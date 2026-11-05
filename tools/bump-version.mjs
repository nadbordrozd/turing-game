#!/usr/bin/env node
// Sets the front-end build version used for cache-busting. The version lives
// only in index.html: `window.TURING_VERSION = "<v>"` (read by versionedUrl,
// which script.js, js/audio.js and the scenes use for every asset URL) and the
// `?v=<v>` on every local <script src> and <link href>.
//
// Usage:
//   node tools/bump-version.mjs            # version = UTC date-time + short git hash
//   node tools/bump-version.mjs <version>  # explicit version ([A-Za-z0-9._-]+)
//   node tools/bump-version.mjs --check    # exit 1 unless every tag matches TURING_VERSION
// Zero dependencies. Bump on every publish that changes front-end files.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const VERSION_RE = /window\.TURING_VERSION = "([^"]*)";/;
// src/href attribute of <script> and <link> tags, any quote style
const TAG_RE = /(<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*)(["'])([^"']*)\2/gi;
const isLocal = (u) => u && !/^(?:[a-z]+:)?\/\//i.test(u) && !/^(?:data|blob|mailto):/i.test(u);
const strip = (u) => u.replace(/([?&])v=[^&#]*&?/, '$1').replace(/[?&]$/, '');

const m = html.match(VERSION_RE);
if (!m) {
  console.error('index.html: window.TURING_VERSION line not found');
  process.exit(1);
}

if (process.argv[2] === '--check') {
  const want = `v=${m[1]}`;
  const bad = [];
  for (const [, , , url] of html.matchAll(TAG_RE)) {
    if (isLocal(url) && !url.split(/[?&#]/).includes(want)) bad.push(url);
  }
  if (bad.length) {
    console.error(`index.html: tags not at ${want}:\n  ${bad.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`index.html: every local script/link tag carries ${want}`);
  process.exit(0);
}

let version = process.argv[2];
if (!version) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15); // 20261105-143210
  let hash = '';
  try {
    hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {}
  version = hash ? `${stamp}-${hash}` : stamp;
}
if (!/^[A-Za-z0-9._-]+$/.test(version)) {
  console.error(`bad version "${version}" (use [A-Za-z0-9._-])`);
  process.exit(1);
}

let tags = 0;
const out = html
  .replace(VERSION_RE, `window.TURING_VERSION = "${version}";`)
  .replace(TAG_RE, (all, pre, q, url) => {
    if (!isLocal(url)) return all;
    tags++;
    const bare = strip(url);
    return `${pre}${q}${bare}${bare.includes('?') ? '&' : '?'}v=${version}${q}`;
  });
fs.writeFileSync(file, out);
console.log(`index.html: TURING_VERSION ${m[1]} -> ${version} (${tags} script/link tags)`);
