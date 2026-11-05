// Level selector (Toybox, tg-84y.2): a toy map of every level.
//
// Levels are grouped into tracks (Basics, Twists, Mazes, Counters, Finale).
// Everything except the first level of each track is derived from the
// levels' `required` lists: a level with one requirement hangs off that level
// in the same track; a level that needs several is a finale level. Inside a
// track the "main" path (the child that leads to the most levels) runs
// straight on and the side levels branch off it.
//
// Landscape: each track is a left-to-right tree packed into rows, and the
// tracks are arranged to fit one 1024x768 screen. Portrait: each track is an
// indented tree list, one level per row, and the page scrolls.
// Every level is a real <button>; locked ones explain what opens them.
(function() {
	"use strict";
	var UI = t.UI;
	var Q;

	// The first level(s) of each track; every other level follows its requirement.
	var GROUPS = [
		{ id: "basics", title: "Basics", color: "sun", roots: ["start here"] },
		{ id: "twists", title: "Twists", color: "sky", roots: ["spiral"] },
		{ id: "mazes", title: "Mazes", color: "mint", roots: ["way out", "zigzag", "anywhere"] },
		{ id: "counters", title: "Counters", color: "tomato", roots: ["++"] },
		{ id: "finale", title: "Finale", color: "plum", finale: true }
	];
	// Landscape arrangement: rows of columns of stacked tracks.
	var ARRANGE = [[["basics"]], [["twists", "finale"], ["counters", "mazes"]]];

	var PARTS = [
		{ img: "greencapacitor", name: "capacitor" },
		{ img: "greenintegratedcircuit", name: "chip" },
		{ img: "greencoil", name: "coil" }
	];

	var SIZES = {
		landscape: { M: 12, HDR: 56, NODE_H: 32, P: 46, G: 22, PADX: 16, PADT: 28, PADB: 8, TAB: 12,
			MINW: 84, TXT: 12, VGAP: 24, HGAP: 14, GRID_W: 0 },
		portrait: { M: 14, HDR: 132, NODE_H: 46, P: 56, G: 14, PADX: 14, PADT: 30, PADB: 14, TAB: 0,
			MINW: 0, TXT: 14, VGAP: 30, HGAP: 0, INDENT: 40 }
	};

	// ---------- model ----------
	function buildModel() {
		var levels = t.Levels.levels, names = Object.keys(levels);
		var statuses = t.GameSaver.loadLevelStatuses();
		var N = {};
		names.forEach(function(n, i) {
			var s = statuses[n], solved = s === 0 || s > 0 || s === true;
			N[n] = {
				name: n, level: levels[n], idx: i, solved: solved,
				parts: solved ? Math.max(0, Math.min(3, (+s || 0) - 1)) : 0,
				// a requirement that is not a level never blocks (as in 2013)
				req: (levels[n].required || []).filter(function(r) { return !!levels[r] && r !== n; }),
				users: [], kids: []
			};
		});
		names.forEach(function(n) {
			var o = N[n];
			o.open = !o.solved && o.req.every(function(r) { return N[r].solved; });
			o.state = o.solved ? "solved" : o.open ? "open" : "locked";
			o.req.forEach(function(r) { N[r].users.push(n); });
		});
		// how many levels each one leads to (through any requirement)
		names.forEach(function(n) {
			var seen = {}, stack = N[n].users.slice(), c = 0;
			while(stack.length) {
				var u = stack.pop();
				if(seen[u]) continue;
				seen[u] = true; c++;
				stack.push.apply(stack, N[u].users);
			}
			N[n].reach = c;
		});

		// tracks
		var rootOf = {}, finaleId = null, byId = {};
		GROUPS.forEach(function(g) {
			byId[g.id] = g;
			(g.roots || []).forEach(function(r) { rootOf[r] = g.id; });
			if(g.finale) finaleId = g.id;
		});
		function groupOf(n, depth) {
			var o = N[n];
			if(o.group) return o.group;
			var g;
			if(o.req.length > 1 && finaleId) g = finaleId;
			else if(rootOf[n]) g = rootOf[n];
			else if(!o.req.length || depth > 200) g = GROUPS[0].id;
			else g = groupOf(o.req[0], depth + 1);
			return (o.group = g);
		}
		names.forEach(function(n) { groupOf(n, 0); });

		var groups = GROUPS.map(function(g) {
			return { id: g.id, title: g.title, color: g.color, finale: !!g.finale, names: [], roots: [], needs: [] };
		});
		var gi = {};
		groups.forEach(function(g) { gi[g.id] = g; });
		names.forEach(function(n) {
			var o = N[n], g = gi[o.group];
			g.names.push(n);
			var p = o.req.length === 1 && N[o.req[0]].group === o.group ? o.req[0] : null;
			o.parent = p;
			if(p) N[p].kids.push(n);
			else {
				g.roots.push(n);
				o.req.forEach(function(r) { if(N[r].group !== o.group && g.needs.indexOf(r) < 0) g.needs.push(r); });
			}
		});
		// main child first (leads to the most levels; earlier level wins a tie), the rest in level order
		names.forEach(function(n) {
			var k = N[n].kids;
			if(k.length < 2) { N[n].ordered = k.slice(); return; }
			var main = k.slice().sort(function(a, b) { return N[b].reach - N[a].reach || N[a].idx - N[b].idx; })[0];
			N[n].ordered = [main].concat(k.filter(function(x) { return x !== main; }));
		});
		groups = groups.filter(function(g) { return g.names.length; });
		groups.forEach(function(g) {
			g.solved = g.names.filter(function(n) { return N[n].solved; }).length;
			g.parts = g.names.reduce(function(s, n) { return s + N[n].parts; }, 0);
			g.locked = g.names.every(function(n) { return N[n].state === "locked"; });
		});

		// suggestion: the first open level, in level order
		var next = null;
		names.some(function(n) { if(N[n].open) { next = n; return true; } return false; });

		var parts = 0, solved = 0;
		names.forEach(function(n) { parts += N[n].parts; if(N[n].solved) solved++; });
		return { N: N, names: names, groups: groups, next: next, parts: parts, solved: solved, total: names.length };
	}

	// ---------- packing (landscape) ----------
	// A shape is a list of placed items {n, c, r} plus, per column, the row
	// intervals it occupies. A parent's children share a vertical "bus" in the
	// gap before their column, so that column's interval spans all of them.
	function overlaps(list, a, b) {
		for(var i = 0; i < list.length; i++) if(a <= list[i][1] && b >= list[i][0]) return true;
		return false;
	}
	function collides(sh, s, dc, dr) {
		for(var c in s.occ) {
			var mine = sh.occ[+c + dc];
			if(!mine) continue;
			for(var i = 0; i < s.occ[c].length; i++) {
				if(overlaps(mine, s.occ[c][i][0] + dr, s.occ[c][i][1] + dr)) return true;
			}
		}
		return false;
	}
	function addIv(sh, c, iv) { (sh.occ[c] = sh.occ[c] || []).push(iv); }
	function merge(sh, s, dc, dr) {
		s.items.forEach(function(it) { sh.items.push({ n: it.n, c: it.c + dc, r: it.r + dr }); });
		for(var c in s.occ) s.occ[c].forEach(function(iv) { addIv(sh, +c + dc, [iv[0] + dr, iv[1] + dr]); });
	}
	function packTree(N, n) {
		var sh = { items: [{ n: n, c: 0, r: 0 }], occ: { 0: [[0, 0]] } };
		var last = -1;
		N[n].ordered.forEach(function(k) {
			var s = packTree(N, k), off = last + 1;
			while(collides(sh, s, 1, off)) off++;
			merge(sh, s, 1, off);
			last = off;
		});
		if(N[n].ordered.length > 1) addIv(sh, 1, [0, last]);
		return sh;
	}
	function packGroup(m, g) {
		var N = m.N, sh = { items: [], occ: {} };
		if(g.finale && g.names.every(function(n) { return !N[n].kids.length; })) {
			var cols = g.names.length > 2 ? 2 : g.names.length;
			g.names.forEach(function(n, i) { sh.items.push({ n: n, c: i % cols, r: Math.floor(i / cols) }); });
			return sh;
		}
		var roots = g.roots.slice().sort(function(a, b) { return N[b].reach - N[a].reach || N[a].idx - N[b].idx; });
		roots.forEach(function(r) {
			var s = packTree(N, r), off = 0;
			while(collides(sh, s, 0, off)) off++;
			merge(sh, s, 0, off);
		});
		return sh;
	}

	// ---------- outline (portrait) ----------
	// One level per row; the main child continues in the same lane after the
	// side branches, which are indented one lane.
	function outline(m, g) {
		var N = m.N, rows = [];
		if(g.finale && g.names.every(function(n) { return !N[n].kids.length; })) {
			g.names.forEach(function(n, i) { rows.push({ n: n, lane: 0, grid: i }); });
			return rows;
		}
		function visit(n, lane) {
			rows.push({ n: n, lane: lane });
			var k = N[n].ordered;
			k.slice(1).forEach(function(c) { visit(c, lane + 1); });
			if(k.length) visit(k[0], lane);
		}
		g.roots.forEach(function(r) { visit(r, 0); });
		return rows;
	}

	// ---------- DOM helpers ----------
	var measurer = null;
	function textWidth(text, cls) {
		if(!measurer || !measurer.parentNode) {
			measurer = UI.el("span", "ls-measure", UI.over);
		}
		measurer.className = "ls-measure " + (cls || "");
		measurer.textContent = text;
		return measurer.offsetWidth;
	}
	function partsStrip(o, cls) {
		var p = UI.el("span", "ls-parts " + (cls || ""));
		PARTS.forEach(function(pt, i) {
			var img = UI.el("img", i < o.parts ? "" : "no", p);
			img.src = versionedUrl("images/" + pt.img + ".png");
			img.alt = "";
			img.draggable = false;
		});
		return p;
	}
	function svgEl(tag, attrs, parent) {
		var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
		for(var k in attrs) e.setAttribute(k, attrs[k]);
		if(parent) parent.appendChild(e);
		return e;
	}
	function listNames(arr) {
		if(arr.length < 2) return arr.join("");
		return arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
	}

	// ---------- the screen ----------
	var LS = t.LevelSelector = {
		model: null,
		buttons: {},

		play: function(name) {
			var level = t.Levels.levels[name];
			if(!level) return;
			t.Levels.currentLevel = level;
			Q.clearStages();
			Q.stageScene("level", 0, { sort: true });
			Q.stageScene("controls", 1);
		},

		showLocked: function(o) {
			var N = this.model.N;
			var missing = o.req.filter(function(r) { return !N[r].solved; });
			var openOnes = missing.filter(function(r) { return N[r].open; });
			var body = UI.el("div", "ls-why");
			UI.el("p", "", body, "Solve " + listNames(missing.map(function(r) { return "“" + r + "”"; })) +
				" to open “" + o.name + "”.");
			var actions = [];
			if(openOnes.length) actions.push({ label: "Play “" + openOnes[0] + "”", cls: "tomato",
				onClick: function() { LS.play(openOnes[0]); } });
			actions.push({ label: "OK", cls: openOnes.length ? "" : "sky" });
			UI.popup({ title: "Locked", tagCls: "cream", body: body, actions: actions, w: 400 });
		},

		toIntro: function() { Q.clearStages(); Q.stageScene("intro"); },
		toAbout: function() { Q.clearStages(); Q.stageScene(Q.scenes.about ? "about" : "credits"); },

		build: function() {
			var portrait = UI.mode === "portrait";
			var S = SIZES[portrait ? "portrait" : "landscape"];
			var m = this.model = buildModel();
			this.buttons = {};
			var W = portrait ? UI.breakpoints.portrait.w : UI.breakpoints.landscape.w;

			// ---- track sizes ----
			var cards = {};
			m.groups.forEach(function(g) {
				var c = cards[g.id] = { g: g };
				var headW = UI.pxWidth(g.title, 2) + 26 + 18 + (g.needs.length ? textWidth(LS.needsText(g), "ls-chip-m") + 34 : 0) + 70;
				if(portrait) {
					c.rows = outline(m, g);
					var gridRows = c.rows.some(function(r) { return r.grid !== undefined; }) ? Math.ceil(c.rows.length / 2) : c.rows.length;
					c.contentH = (gridRows - 1) * S.P + S.NODE_H;
					c.w = W - 2 * S.M;
					c.h = c.contentH + S.PADT + S.PADB;
					return;
				}
				var sh = c.shape = packGroup(m, g);
				var ncols = 0, nrows = 0;
				sh.items.forEach(function(it) { ncols = Math.max(ncols, it.c + 1); nrows = Math.max(nrows, it.r + 1); });
				var colW = [];
				for(var i = 0; i < ncols; i++) colW.push(S.MINW);
				sh.items.forEach(function(it) {
					colW[it.c] = Math.max(colW[it.c], textWidth(it.n, "ls-name-m") + 2 * S.TXT + 6);
				});
				c.colW = colW;
				c.contentW = colW.reduce(function(a, b) { return a + b; }, 0) + (ncols - 1) * S.G;
				c.contentH = (nrows - 1) * S.P + S.NODE_H + S.TAB;
				c.w = Math.max(c.contentW + 2 * S.PADX, headW);
				c.h = c.contentH + S.PADT + S.PADB;
			});

			// ---- arrangement ----
			var top = S.M + S.HDR + S.VGAP, H;
			if(portrait) {
				m.groups.forEach(function(g) {
					var c = cards[g.id];
					c.x = S.M; c.y = top;
					top += c.h + S.VGAP;
				});
				H = top - S.VGAP + S.M + 10;
			} else {
				var placed = {}, rows = [];
				ARRANGE.forEach(function(row) {
					var r = [];
					row.forEach(function(col) {
						var cc = col.filter(function(id) { return cards[id]; });
						cc.forEach(function(id) { placed[id] = true; });
						if(cc.length) r.push(cc);
					});
					if(r.length) rows.push(r);
				});
				m.groups.forEach(function(g) { if(!placed[g.id]) rows.push([[g.id]]); });
				var maxRowW = 0;
				rows.forEach(function(r) {
					r.w = 0;
					r.cols = r.map(function(col) {
						var cw = Math.max.apply(null, col.map(function(id) { return cards[id].w; }));
						var ch = col.reduce(function(s, id) { return s + cards[id].h; }, 0) + (col.length - 1) * S.VGAP;
						r.w += cw;
						return { ids: col, w: cw, h: ch };
					});
					r.w += (r.length - 1) * S.HGAP;
					r.h = Math.max.apply(null, r.cols.map(function(c) { return c.h; }));
					maxRowW = Math.max(maxRowW, r.w);
				});
				W = Math.max(W, maxRowW + 2 * S.M);
				var avail = W - 2 * S.M;
				rows.forEach(function(r) {
					var extra = avail - r.w, x = S.M;
					r.cols.forEach(function(col) {
						var w = col.w + extra * col.w / r.w;
						var y = top, room = r.h - col.h;
						col.ids.forEach(function(id, i) {
							var c = cards[id];
							c.x = x; c.y = y; c.w = w;
							if(i === col.ids.length - 1) c.h += room; // last card in a column fills it
							y += c.h + S.VGAP;
						});
						x += w + S.HGAP;
					});
					top += r.h + S.VGAP;
				});
				H = top - S.VGAP + S.M;
			}
			W = Math.round(W);
			H = Math.round(Math.max(H, UI.defaultSize().h));
			if(W !== UI.w || H !== UI.h) UI.setSize(W, H);

			// ---- render ----
			this.buildHeader(m, S, W, portrait);
			var root = UI.el("div", "ls-root " + (portrait ? "ls-portrait" : "ls-landscape"), UI.over);
			var svg = svgEl("svg", { "class": "ls-paths", width: W, height: H, viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
			var nodeBox = {};
			m.groups.forEach(function(g) {
				var c = cards[g.id];
				LS.buildCard(m, S, c, portrait, root, nodeBox);
			});
			UI.under.appendChild(svg);
			m.groups.forEach(function(g) { LS.drawPaths(m, S, cards[g.id], portrait, svg, nodeBox); });

			// bring the suggestion into view on a scrolling phone
			if(portrait && m.next && this.buttons[m.next]) {
				var b = this.buttons[m.next];
				setTimeout(function() {
					if(!UI.scrolling || !b.isConnected) return;
					var r = b.getBoundingClientRect();
					if(r.bottom > window.innerHeight - 20) window.scrollTo(0, Math.max(0, window.scrollY + r.top - window.innerHeight * 0.4));
				}, 0);
			}
		},

		needsText: function(g) {
			return (g.finale ? "needs " : "after ") + g.needs.join(" + ");
		},

		buildHeader: function(m, S, W, portrait) {
			var r = { x: S.M, y: S.M, w: W - 2 * S.M, h: S.HDR };
			var card = UI.card(r, "ls-hdr");
			var el = card.el;
			el.classList.add("ls-hdr-in");
			if(portrait) el.classList.add("ls-hdr-portrait");
			var title = UI.el("h1", "ls-title", el);
			title.appendChild(UI.px("Levels", 4));

			var count = UI.el("div", "ls-count", el);
			count.setAttribute("role", "status");
			count.title = m.parts + " of " + m.total * 3 + " parts collected, " + m.solved + " of " + m.total + " levels solved";
			var icons = UI.el("span", "ls-count-ic", count);
			PARTS.forEach(function(pt) {
				var img = UI.el("img", "", icons);
				img.src = versionedUrl("images/" + pt.img + ".png");
				img.alt = "";
			});
			var nums = UI.el("span", "ls-count-n", count);
			UI.el("b", "", nums, m.parts + " / " + m.total * 3);
			UI.el("small", "", nums, "parts · " + m.solved + " of " + m.total + " solved");

			var legend = UI.el("div", "ls-legend", el);
			legend.setAttribute("aria-hidden", "true");
			[["open", "open"], ["solved", "solved"], ["locked", "locked"]].forEach(function(k) {
				var i = UI.el("span", "ls-key " + k[0], legend);
				if(k[0] === "locked") i.appendChild(UI.icon("lock", 1));
				if(k[0] === "solved") i.appendChild(UI.icon("check", 1));
				UI.el("span", "", legend, k[1]);
			});

			var sys = UI.el("nav", "ls-sys", el);
			sys.setAttribute("aria-label", "Menu");
			var snd = UI.button({ cls: "ls-sound sm", icon: "sound", iconScale: 3, title: "Sound on/off", onClick: function() {
				if(t.Sfx) t.Sfx.toggle();
				LS.updateSound(snd);
			} }, sys);
			this.updateSound(snd);
			var mus = UI.button({ cls: "ls-sound sm", icon: "music", iconScale: 3, title: "Music on/off", onClick: function() {
				if(t.Music) t.Music.toggle();
				LS.updateMusic(mus);
			} }, sys);
			this.updateMusic(mus);
			UI.button({ cls: portrait ? "sm sun" : "sun", icon: "play", iconScale: 2, label: portrait ? null : "Intro", px: 2,
				title: "Replay the intro", onClick: function() { LS.toIntro(); } }, sys);
			UI.button({ cls: portrait ? "sm sky" : "sky", icon: "info", iconScale: 2, label: portrait ? null : "About", px: 2,
				title: "About Turing", onClick: function() { LS.toAbout(); } }, sys);
		},

		updateSound: function(b) {
			var muted = t.Sfx && t.Sfx.muted ? t.Sfx.muted() : false;
			b.innerHTML = "";
			b.appendChild(UI.icon(muted ? "mute" : "sound", 3));
			b.classList.toggle("mint", !muted);
			b.setAttribute("aria-pressed", muted ? "false" : "true");
			b.title = muted ? "Sound is off: turn it on" : "Sound is on: turn it off";
			b.setAttribute("aria-label", b.title);
		},

		updateMusic: function(b) {
			var muted = t.Music && t.Music.muted ? t.Music.muted() : true;
			b.innerHTML = "";
			b.appendChild(UI.icon(muted ? "music-off" : "music", 3));
			b.classList.toggle("mint", !muted);
			b.setAttribute("aria-pressed", muted ? "false" : "true");
			b.title = muted ? "Music is off: turn it on" : "Music is on: turn it off";
			b.setAttribute("aria-label", b.title);
		},

		buildCard: function(m, S, c, portrait, root, nodeBox) {
			var g = c.g, N = m.N;
			var r = { x: c.x, y: c.y, w: c.w, h: c.h };
			var card = UI.card(r, "ls-card ls-" + g.color + (g.locked ? " ls-card-locked" : ""));
			var el = card.el;
			el.setAttribute("role", "group");
			el.setAttribute("aria-label", g.title + ": " + g.solved + " of " + g.names.length + " solved");
			UI.tag(g.title, g.color === "plum" ? "plum" : g.color, el);
			var chips = UI.el("div", "ls-chips", el);
			chips.style.left = (UI.pxWidth(g.title, 2) + 26 + 14 + 10) + "px";
			if(g.needs.length) {
				var met = g.needs.every(function(n) { return N[n].solved; });
				var chip = UI.el("span", "ls-chip " + (met ? "ok" : "need"), chips);
				chip.appendChild(UI.icon(met ? "check" : "lock", 2));
				UI.el("span", "", chip, LS.needsText(g));
			}
			var prog = UI.el("span", "ls-chip ls-prog" + (g.solved === g.names.length ? " ok" : ""), el);
			UI.el("span", "", prog, g.solved + "/" + g.names.length);
			prog.title = g.solved + " of " + g.names.length + " levels solved, " + g.parts + " of " + g.names.length * 3 + " parts";

			// node rects in stage coordinates
			var boxes = [];
			if(portrait) {
				var x0 = c.x + S.PADX, y0 = c.y + S.PADT, inner = c.w - 2 * S.PADX;
				c.rows.forEach(function(row, i) {
					var b;
					if(row.grid !== undefined) {
						var gw = (inner - S.G) / 2;
						b = { x: x0 + (row.grid % 2) * (gw + S.G), y: y0 + Math.floor(row.grid / 2) * S.P, w: gw, h: S.NODE_H };
					} else {
						var dx = row.lane * S.INDENT;
						b = { x: x0 + dx, y: y0 + i * S.P, w: inner - dx, h: S.NODE_H };
					}
					b.n = row.n; b.lane = row.lane;
					boxes.push(b);
				});
			} else {
				var cx = c.x + (c.w - c.contentW) / 2;
				var cy = c.y + S.PADT + Math.max(0, (c.h - S.PADT - S.PADB - c.contentH) / 2);
				var colX = [], acc = 0;
				c.colW.forEach(function(w) { colX.push(acc); acc += w + S.G; });
				// tab order follows the tree: parent, then branches
				var order = {};
				outline(m, g).forEach(function(row, i) { order[row.n] = i; });
				c.shape.items.slice().sort(function(a, b) { return order[a.n] - order[b.n]; }).forEach(function(it) {
					boxes.push({ n: it.n, x: cx + colX[it.c], y: cy + it.r * S.P, w: c.colW[it.c], h: S.NODE_H, c: it.c, r: it.r });
				});
			}
			c.boxes = boxes;
			boxes.forEach(function(b) {
				nodeBox[b.n] = b;
				LS.buildNode(m, N[b.n], b, portrait, root, g.locked);
			});
		},

		buildNode: function(m, o, b, portrait, root, cardLocked) {
			var next = m.next === o.name;
			var label = o.name + ": " + (o.solved ? "solved, " + o.parts + " of 3 parts" : o.open ? "open" : "locked");
			var btn = UI.button({ cls: "ls-node " + o.state + (next ? " next" : ""), title: label,
				sound: o.state === "locked" ? "bump" : "click",
				onClick: function() {
					if(o.state === "locked") LS.showLocked(o);
					else LS.play(o.name);
				} }, root);
			btn.removeAttribute("title");
			btn.setAttribute("aria-label", label + (next ? ", suggested next" : ""));
			if(o.state === "locked") btn.setAttribute("aria-disabled", "true");
			UI.place(btn, b);
			UI.el("span", "ls-name", btn, o.name);
			if(o.solved) btn.appendChild(partsStrip(o, portrait ? "inline" : "tab"));
			else if(o.state === "locked") {
				// in landscape a locked track already says so; keep its nodes quiet
				if(cardLocked && !portrait) { this.buttons[o.name] = btn; return; }
				var lk = UI.el("span", "ls-lock", btn);
				lk.appendChild(UI.icon("lock", 2));
			} else if(portrait) {
				var pl = UI.el("span", "ls-go", btn);
				pl.appendChild(UI.icon("play", 2));
			}
			if(next) {
				var tag = UI.el("span", "ls-next", btn);
				tag.appendChild(UI.px("Next", 1));
			}
			this.buttons[o.name] = btn;
		},

		// toy-track paths from each level to the levels it opens, inside its track
		drawPaths: function(m, S, c, portrait, svg, nodeBox) {
			var N = m.N, layers = { locked: [], open: [], solved: [] };
			c.boxes.forEach(function(b) {
				var o = N[b.n];
				o.ordered.forEach(function(k, i) {
					var kb = nodeBox[k];
					if(!kb) return;
					var d;
					if(portrait) {
						var x = b.x + 22, y1 = b.y + b.h;
						if(i === 0 && kb.lane === b.lane) d = "M" + x + " " + y1 + "V" + kb.y;
						else {
							var cy = kb.y + kb.h / 2, rr = 10;
							d = "M" + x + " " + y1 + "V" + (cy - rr) + "Q" + x + " " + cy + " " + (x + rr) + " " + cy + "H" + kb.x;
						}
					} else {
						var x1 = b.x + b.w, py = b.y + b.h / 2, x2 = kb.x, ky = kb.y + kb.h / 2;
						if(Math.abs(py - ky) < 1) d = "M" + x1 + " " + py + "H" + x2;
						else {
							var xm = x2 - S.G / 2, r = Math.min(9, (ky - py) / 2);
							d = "M" + x1 + " " + py + "H" + (xm - r) + "Q" + xm + " " + py + " " + xm + " " + (py + r) +
								"V" + (ky - r) + "Q" + xm + " " + ky + " " + (xm + r) + " " + ky + "H" + x2;
						}
					}
					layers[N[k].state].push(d);
				});
			});
			// locked under open under solved, so a shared stretch shows the furthest progress
			["locked", "open", "solved"].forEach(function(st) {
				layers[st].forEach(function(d) {
					if(st === "locked") svgEl("path", { d: d, "class": "ls-path locked" }, svg);
					else {
						svgEl("path", { d: d, "class": "ls-path casing" }, svg);
						svgEl("path", { d: d, "class": "ls-path " + st }, svg);
					}
				});
			});
		}
	};

	TuringScenes.add(function(_Q) {
		Q = _Q;
		UI.scene("level selector", { responsive: true, scroll: true });
		Q.scene("level selector", function(stage) { LS.build(stage); });
	});
})();
