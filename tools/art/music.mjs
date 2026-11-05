#!/usr/bin/env node
// The game score: user-supplied tracks encoded into small, loudness-matched
// derivatives with a recorded, repeatable ffmpeg command.
//
//   node tools/art/music.mjs build <id> <source.wav> [--target -20] [--bitrate 160k] [--note "..."]
//   node tools/art/music.mjs measure        # LUFS / true peak / duration of the shipped files (ffmpeg)
//   node tools/art/music.mjs validate       # shipped files match their records (no ffmpeg needed)
//
// build measures the source (EBU R128 integrated loudness and true peak),
// applies one static gain so the result sits at --target LUFS integrated (true
// peak kept at or under -1 dBTP), encodes AAC-LC in an .m4a with the index at
// the front (it streams), and records the source (path, sha256, size,
// duration), the exact ffmpeg command and the output (sha256, size, codec,
// bitrate, loudness) in audio/music/records.json. The source is only read.
// Output: music/<id>.m4a. Nothing here plays a sound.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fail, loadConfig, parseArgs, readJson, rel, sha256, writeJsonAtomic } from "./lib/common.mjs";

const cfg = loadConfig();
const musicDir = path.join(cfg.root, "audio", "music");
const recordsFile = path.join(musicDir, "records.json");
const CEILING = -1; // dBTP

const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const quote = (s) => (/^[A-Za-z0-9_./:=+,-]+$/.test(s) ? s : `'${s.replaceAll("'", "'\\''")}'`);

function probe(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,bit_rate:stream=codec_name,profile,sample_rate,channels,bit_rate", "-of", "json", file], { encoding: "utf8" });
  const j = JSON.parse(out);
  const s = j.streams.find((x) => x.codec_name) ?? {};
  return {
    duration: round(Number(j.format.duration), 3),
    codec: s.profile ? `${s.codec_name} (${s.profile})` : s.codec_name,
    sampleRate: Number(s.sample_rate),
    channels: s.channels,
    bitrate: Number(s.bit_rate || j.format.bit_rate),
  };
}

function loudness(file) {
  // ebur128 prints its summary on stderr.
  const r = spawnSync("ffmpeg", ["-nostdin", "-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) fail(`ffmpeg could not measure ${file}`);
  const err = r.stderr;
  const summary = err.slice(err.lastIndexOf("Summary:"));
  const I = summary.match(/I:\s+(-?[\d.]+) LUFS/);
  const LRA = summary.match(/LRA:\s+(-?[\d.]+) LU/);
  const TP = summary.match(/True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS/);
  if (!I || !TP) fail(`could not read the loudness summary for ${file}`);
  return { lufs: Number(I[1]), lra: LRA ? Number(LRA[1]) : null, truePeak: TP[1] === "-inf" ? -Infinity : Number(TP[1]) };
}

function build(args) {
  const [, id, source] = args._;
  if (!id || !source) fail("build wants <id> <source>");
  if (!/^[a-z0-9-]+$/.test(id)) fail("id is lower-case letters, digits and dashes");
  if (!fs.existsSync(source)) fail(`${source} does not exist`);
  const target = Number(args.target ?? -20);
  const bitrate = args.bitrate ?? "160k";
  const src = path.resolve(source);
  const bytes = fs.readFileSync(src);
  const before = { ...probe(src), ...loudness(src) };
  let gain = target - before.lufs;
  if (before.truePeak + gain > CEILING) gain = CEILING - before.truePeak;
  gain = round(gain, 2);
  const out = path.join(cfg.root, "music", `${id}.m4a`);
  const tmp = path.join(path.dirname(out), `.${id}.${process.pid}.tmp`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  // bitexact + no metadata: the same ffmpeg build gives the same bytes.
  const argv = ["-nostdin", "-v", "error", "-y", "-i", src, "-map", "0:a:0", "-af", `volume=${gain}dB`, "-c:a", "aac", "-b:a", bitrate, "-ar", String(before.sampleRate), "-ac", "2", "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-movflags", "+faststart", "-f", "ipod"];
  execFileSync("ffmpeg", [...argv, tmp], { stdio: ["ignore", "inherit", "inherit"] });
  fs.renameSync(tmp, out);
  const after = { ...probe(out), ...loudness(out) };
  const outBytes = fs.readFileSync(out);
  const ffmpegVersion = execFileSync("ffmpeg", ["-version"], { encoding: "utf8" }).split("\n")[0];
  const records = readJson(recordsFile, {});
  records[id] = {
    id,
    note: args.note ?? "user-supplied",
    builtAt: new Date().toISOString(),
    source: { file: path.basename(src), path: src, sha256: sha256(bytes), bytes: bytes.length, ...before },
    target: { lufs: target, truePeakCeiling: CEILING, gainDb: gain },
    command: ["ffmpeg", ...argv.map((a) => (a === src ? `<source>` : a)), rel(cfg.root, out)].map(quote).join(" "),
    ffmpeg: ffmpegVersion,
    output: { file: rel(cfg.root, out), sha256: sha256(outBytes), bytes: outBytes.length, ...after },
  };
  writeJsonAtomic(recordsFile, records);
  console.log(`${rel(cfg.root, out)}: ${(outBytes.length / 1e6).toFixed(2)} MB, ${after.duration} s, ${after.codec}, ${Math.round(after.bitrate / 1000)} kb/s, ${after.lufs} LUFS, ${after.truePeak} dBTP (gain ${gain} dB)`);
}

function measure() {
  for (const r of Object.values(readJson(recordsFile, {}))) {
    const f = path.join(cfg.root, r.output.file);
    const m = { ...probe(f), ...loudness(f) };
    console.log(`${r.output.file}: ${m.duration} s, ${m.codec}, ${m.sampleRate} Hz, ${m.channels} ch, ${Math.round(m.bitrate / 1000)} kb/s, ${m.lufs} LUFS integrated, LRA ${m.lra} LU, true peak ${m.truePeak} dBTP`);
  }
}

function validate() {
  const records = readJson(recordsFile, {});
  const problems = [];
  for (const r of Object.values(records)) {
    const f = path.join(cfg.root, r.output?.file ?? "");
    if (!r.output?.file || !fs.existsSync(f)) problems.push(`${r.id}: ${r.output?.file ?? "output"} is missing`);
    else {
      const b = fs.readFileSync(f);
      if (b.length !== r.output.bytes || sha256(b) !== r.output.sha256) problems.push(`${r.output.file} is not the recorded build of ${r.id}`);
    }
  }
  for (const p of problems) console.log(`FAIL ${p}`);
  if (problems.length) process.exit(1);
  console.log(`ok: ${Object.keys(records).length} music track(s) verified (${rel(cfg.root, musicDir)})`);
}

const args = parseArgs(process.argv.slice(2));
const commands = { build: () => build(args), measure, validate };
if (!commands[args._[0]]) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//   node")).map((l) => l.slice(3)).join("\n"));
  process.exit(args._[0] ? 1 : 0);
}
commands[args._[0]]();
