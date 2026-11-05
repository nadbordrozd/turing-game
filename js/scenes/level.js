// Main game screen (Toybox, after docs/ui/mockups/main-b-toybox.html).
// Quintus scenes: "level" (stage 0: board, robot cell, tray) and "controls"
// (stage 1: transport deck, see controls.js). The HTML around the canvas is
// built with the UI kit (js/ui/kit.js) from one computed layout, in either the
// landscape or the portrait arrangement.
(function() {
	"use strict";
	var UI = t.UI;
	var PITCH = 54; // board pitch in logical px (contract with the program-tiles atlas)
	var TILE_GAP = 10; // gap between tray tiles

	var CAPTIONS = {
		Step: "step", Conveyor: "belt", ClockwiseRotator: "turn R", CounterClockwiseRotator: "turn L",
		Detector: "wall?", DetectMagic: "blue?", Empty: "empty"
	};
	var TITLES = {
		Step: "Step forward", Conveyor: "Belt (goto)", ClockwiseRotator: "Turn right",
		CounterClockwiseRotator: "Turn left", Detector: "Wall ahead?", DetectMagic: "On a blue tile?"
	};
	var COLORS = {
		Red: { chip: "#ec5b45", lcd: "#ff7a63" }, Blue: { chip: "#2d86b5", lcd: "#7fd6f7" },
		Green: { chip: "#5fae7b", lcd: "#a3d9b1" }, Purple: { chip: "#9b6bd6", lcd: "#c9a6f2" },
		Yellow: { chip: "#d89a2b", lcd: "#f6c445" }, Pink: { chip: "#e0607f", lcd: "#f7a3bd" }
	};
	var OUTCOMES = {
		victory: "escaped!", idle: "program ended", stepLimit: "ran out of steps",
		lava: "fell in the lava", drowned: "fell in the water", electro: "got zapped"
	};

	function opColor(op) {
		var inc = t.OperatorUtils.isIncrementer(op), dec = t.OperatorUtils.isDecrementer(op);
		return inc || dec || null;
	}
	function caption(op) {
		var inc = t.OperatorUtils.isIncrementer(op), dec = t.OperatorUtils.isDecrementer(op);
		if(inc) return inc.toLowerCase() + " +1";
		if(dec) return dec.toLowerCase() + " −1";
		return CAPTIONS[op.name] || op.name;
	}
	function title(op) {
		var inc = t.OperatorUtils.isIncrementer(op), dec = t.OperatorUtils.isDecrementer(op);
		if(inc) return inc + " plus one";
		if(dec) return dec + " minus one";
		return TITLES[op.name] || op.name;
	}

	// ---- counter dials: same API as the 2012 canvas Q.CounterPanel, drawn in HTML ----
	t.CounterDials = function(colors) {
		this.colors = colors.slice();
		this.numbers = {}; this.labels = {}; this.els = {};
		for(var i = 0; i < colors.length; i++) { this.numbers[colors[i]] = 0; this.labels[colors[i]] = "0"; }
	};
	t.CounterDials.COLORS = COLORS;
	t.CounterDials.prototype = {
		set: function(color, number) { this.numbers[color] = number; this.labels[color] = "" + number; this.render(color); },
		setCounterLabel: function(color, label) { this.numbers[color] = undefined; this.labels[color] = "" + label; this.render(color); },
		increment: function(color, cb) { this.numbers[color]++; this.labels[color] = "" + this.numbers[color]; this.render(color); if(cb) cb(); },
		decrement: function(color, cb) { this.numbers[color]--; this.labels[color] = "" + this.numbers[color]; this.render(color); if(cb) cb(); },
		render: function(color) { var e = this.els[color]; if(e) e.textContent = this.labels[color]; },
		attach: function(parent) {
			for(var i = 0; i < this.colors.length; i++) {
				var c = this.colors[i], col = COLORS[c] || { chip: "#6a5f74", lcd: "#fff4dc" };
				var d = UI.el("div", "gs-dial", parent);
				d.setAttribute("aria-label", c + " counter");
				var chip = UI.el("div", "chip", d, c.toLowerCase());
				chip.style.background = col.chip;
				var lcd = UI.el("div", "lcd", d);
				lcd.style.color = col.lcd;
				this.els[c] = lcd;
				this.render(c);
			}
		}
	};

	var GS = t.GameScreen = {
		PITCH: PITCH,
		active: false,
		layout: null,
		els: {},
		caption: caption,
		title: title,

		// ---- layout ----
		trayGrid: function(n, maxRowsH, colsList) {
			// pick the narrowest grid that fits, with captions if possible
			var tries = [];
			colsList.forEach(function(c){ tries.push([c, true]); });
			colsList.forEach(function(c){ tries.push([c, false]); });
			for(var i = 0; i < tries.length; i++) {
				var cols = tries[i][0], cap = tries[i][1];
				var rows = Math.max(1, Math.ceil(n / cols));
				var rowH = PITCH + (cap ? 20 : 0);
				var h = rows * rowH + (rows - 1) * TILE_GAP;
				if(h <= maxRowsH) return { cols: cols, rows: rows, cap: cap, rowH: rowH, h: h };
			}
			var c = colsList[colsList.length - 1], r = Math.ceil(n / c);
			return { cols: c, rows: r, cap: false, rowH: PITCH, h: r * PITCH + (r - 1) * TILE_GAP };
		},

		slotsFor: function(grid, x0, y0, n) {
			var slots = [];
			for(var i = 0; i < n; i++) {
				var col = i % grid.cols, row = Math.floor(i / grid.cols);
				var x = x0 + col * (PITCH + TILE_GAP), y = y0 + row * (grid.rowH + TILE_GAP);
				slots.push({ x: x, y: y, size: PITCH, cx: x + PITCH / 2, cy: y + PITCH / 2 });
			}
			return slots;
		},

		// info: {cols, rows (board), ww, wh (world natural px), nOps, nCounters, hdrH}
		computeLandscape: function(W, H, info) {
			var M = 14, G = 14, GT = 22, deckH = 104, deckW = 620;
			var L = { mode: "landscape", W: W, H: H };
			L.hdr = { x: M, y: M, w: W - 2 * M, h: info.hdrH };
			var midY = M + info.hdrH + GT;
			var bw = info.cols * PITCH, bh = info.rows * PITCH;
			var needMid = Math.max(bh + 36, 300, info.nCounters ? 330 : 0);
			var midH = H - M - deckH - GT - midY;
			if(midH < needMid) { H += needMid - midH; midH = needMid; L.H = H; }
			// tray
			var toolsH = 62, trayInner = midH - 30 - 12 - toolsH - 12;
			var grid = this.trayGrid(info.nOps, trayInner, [2, 3, 4]);
			var gridW = grid.cols * PITCH + (grid.cols - 1) * TILE_GAP;
			var trayW = Math.max(144, gridW + 32);
			L.tray = { x: M, y: midY, w: trayW, h: midH, grid: grid };
			L.tray.slots = this.slotsFor(grid, M + (trayW - gridW) / 2, midY + 30, info.nOps);
			L.tray.tools = { x: M + 14, y: midY + midH - 14 - toolsH, w: trayW - 28, h: toolsH };
			// mat and cell share the rest; the cell gets what the world needs
			var rest = W - 2 * M - 2 * G - trayW;
			var matMin = bw + 54;
			var cellAvail = rest - matMin;
			var DIAL = 78; // dial width + gap
			var dialsW = info.nCounters ? info.nCounters * DIAL - 8 + 28 : 0;
			var s0 = Math.min(1, (cellAvail - 28 - 26) / info.ww, (midH - 36 - 26) / info.wh);
			var cellW = Math.min(cellAvail, Math.max(Math.round(info.ww * s0 + 26) + 28, dialsW, 230));
			var perRow = Math.max(1, Math.floor((cellW - 28 + 8) / DIAL));
			var dialRows = info.nCounters ? Math.ceil(info.nCounters / perRow) : 0;
			var dialsH = dialRows ? dialRows * 62 + (dialRows - 1) * 8 : 0;
			var winHAvail = midH - 22 - 14 - (dialsH ? dialsH + 12 : 0);
			var s = Math.min(1, (cellW - 28 - 26) / info.ww, (winHAvail - 26) / info.wh);
			var winW = Math.round(info.ww * s + 26), winH = Math.round(info.wh * s + 26);
			var matW = rest - cellW;
			var matX = M + trayW + G, cellX = matX + matW + G;
			L.mat = { x: matX, y: midY, w: matW, h: midH };
			L.board = { x: Math.round(matX + 36 + (matW - 54 - bw) / 2), y: Math.round(midY + (midH - bh) / 2), w: bw, h: bh, cols: info.cols, rows: info.rows, pitch: PITCH };
			L.cell = { x: cellX, y: midY, w: cellW, h: midH };
			var winTop = midY + 22 + Math.max(0, (winHAvail - winH) / 2);
			L.win = { x: Math.round(cellX + (cellW - winW) / 2), y: Math.round(winTop), w: winW, h: winH };
			L.worldScale = s;
			if(dialsH) L.dials = { x: cellX + 14, y: midY + midH - 14 - dialsH, w: cellW - 28, h: dialsH };
			var by = H - M - deckH;
			L.deck = { x: M, y: by, w: deckW, h: deckH };
			L.score = { x: M + deckW + G, y: by, w: W - 2 * M - deckW - G, h: deckH };
			return L;
		},

		computePortrait: function(W, H, info) {
			var M = 12, G = 14, GT = 22;
			var L = { mode: "portrait", W: W, H: H };
			L.hdr = { x: M, y: M, w: W - 2 * M, h: info.hdrH };
			var bw = info.cols * PITCH, bh = info.rows * PITCH;
			var matH = bh + 36;
			// tray: tiles in rows, tools in a column on the right
			var toolsW = 64, gridMaxW = W - 2 * M - 28 - toolsW - 12;
			var perRow = Math.max(1, Math.floor((gridMaxW + TILE_GAP) / (PITCH + TILE_GAP)));
			var rows = Math.ceil(info.nOps / perRow);
			var cols = Math.min(perRow, Math.max(1, Math.ceil(info.nOps / rows)));
			var grid = this.trayGrid(info.nOps, rows <= 2 ? 2 * (PITCH + 20) + TILE_GAP : 9999, [cols]);
			var trayInner = Math.max(grid.h, 104);
			var trayH = 30 + trayInner + 14;
			var deckH = 150;
			var dialsW = info.nCounters ? 2 * 70 + 8 + 14 : 0;
			var fixed = M + info.hdrH + GT + GT + matH + GT + trayH + G + deckH + M;
			var winWAvail = W - 2 * M - 28 - dialsW;
			var sw = Math.min(1, (winWAvail - 26) / info.ww);
			var minCellH = 36 + 26 + Math.min(info.wh * sw, 260);
			if(info.nCounters) minCellH = Math.max(minCellH, 36 + 2 * 62 + 8);
			var cellH = H - fixed;
			if(cellH < minCellH) { H += minCellH - cellH; cellH = minCellH; L.H = H; }
			var y = M + info.hdrH + GT;
			L.cell = { x: M, y: y, w: W - 2 * M, h: cellH };
			var winHAvail = cellH - 36;
			var s = Math.min(1, (winWAvail - 26) / info.ww, (winHAvail - 26) / info.wh);
			var winW = Math.round(info.ww * s + 26), winH = Math.round(info.wh * s + 26);
			L.worldScale = s;
			L.win = { x: Math.round(M + 14 + (winWAvail - winW) / 2), y: Math.round(y + 22 + (winHAvail - winH) / 2), w: winW, h: winH };
			if(info.nCounters) L.dials = { x: W - M - 14 - dialsW + 14, y: y + 22, w: dialsW - 14, h: cellH - 36 };
			y += cellH + GT;
			L.mat = { x: M, y: y, w: W - 2 * M, h: matH };
			L.board = { x: Math.round(M + 36 + (W - 2 * M - 54 - bw) / 2), y: y + 18, w: bw, h: bh, cols: info.cols, rows: info.rows, pitch: PITCH };
			y += matH + GT;
			var gridW = grid.cols * PITCH + (grid.cols - 1) * TILE_GAP;
			L.tray = { x: M, y: y, w: W - 2 * M, h: trayH, grid: grid };
			L.tray.slots = this.slotsFor(grid, M + 14 + (gridMaxW - gridW) / 2, y + 30 + (trayInner - grid.h) / 2, info.nOps);
			L.tray.tools = { x: W - M - 14 - toolsW, y: y + 24, w: toolsW, h: trayH - 24 - 14, column: true };
			y += trayH + G;
			L.deck = { x: M, y: y, w: W - 2 * M, h: deckH };
			L.score = null; // the last run sits in the deck's second row
			return L;
		},

		// ---- screen build ----
		begin: function(stage) {
			this.active = true;
			this.stage = stage;
			this.els = {};
			t.TileInput.reset();
			t.RobotTable.counterPanel = null;
		},

		build: function(stage) {
			var level = t.Levels.currentLevel, tt = t.TuringTable, rt = t.RobotTable;
			var mode = UI.mode;
			var size = UI.defaultSize(mode);
			UI.over.classList.toggle("gs-portrait", mode === "portrait");
			UI.under.classList.toggle("gs-portrait", mode === "portrait");
			var ops = t.Selector.operatorList();
			var hdr = this.buildHeader(level, mode, size.w);
			var info = {
				cols: tt.xmax, rows: tt.ymax,
				ww: rt.display1.p.w, wh: rt.display1.p.h,
				nOps: ops.length, nCounters: rt.counterPanel ? rt.counterPanel.colors.length : 0,
				hdrH: hdr.h
			};
			var L = mode === "portrait" ? this.computePortrait(size.w, size.h, info) : this.computeLandscape(size.w, size.h, info);
			this.layout = L;
			UI.setSize(L.W, L.H);
			UI.place(hdr.card.bg, L.hdr); UI.place(hdr.card.el, L.hdr);

			// canvas groups
			tt.display1.p.x = L.board.x + L.board.w / 2;
			tt.display1.p.y = L.board.y + L.board.h / 2;
			rt.display1.p.x = L.win.x + L.win.w / 2;
			rt.display1.p.y = L.win.y + L.win.h / 2;
			rt.display1.p.scale = L.worldScale;
			t.Selector.displayMe(stage, L.tray.slots);
			stage.insert(new Q.TileOverlay());

			this.buildTray(L, ops);
			this.buildMat(L);
			this.buildCell(L, rt);
			this.buildScore(L, level);
			if(t.TileExplain) t.TileExplain.forLevel(ops);
		},

		buildHeader: function(level, mode, W) {
			var M = mode === "portrait" ? 12 : 14;
			var r = { x: M, y: M, w: W - 2 * M, h: 120 };
			var card = UI.card(r, "hdr");
			var el = card.el;
			var portrait = mode === "portrait";
			var badgeSize = portrait ? 56 : 64;
			var badge = UI.el("div", "gs-badge", el);
			badge.style.width = badge.style.height = badgeSize + "px";
			var num = String(this.levelNumber(level));
			badge.appendChild(UI.px(num, num.length > 1 ? (portrait ? 3 : 4) : (portrait ? 4 : 5)));
			var tx = 14 + badgeSize + 16;
			var sysW = portrait ? 4 * 46 + 3 * 6 : 2 * 88 + 2 * 72 + 3 * 12;
			var crumb = UI.el("div", "gs-crumb", el);
			crumb.style.left = tx + "px"; crumb.style.top = "16px";
			crumb.appendChild(UI.px(this.statusText(level, portrait), 2));
			var titleEl = UI.el("div", "gs-title", el);
			titleEl.style.left = tx + "px"; titleEl.style.top = "34px";
			var room = r.w - tx - sysW - 24, name = level.name;
			var ps = 4;
			while(ps > 2 && UI.pxWidth(name, ps) > room) ps--;
			titleEl.appendChild(UI.px(name, ps));
			var sys = UI.el("nav", "gs-sys", el);
			sys.style.right = "14px"; sys.style.top = portrait ? "12px" : "16px";
			// portrait: icon-only square buttons (labels stay as tooltips / aria-labels)
			var sq = portrait ? " gs-sq" : " tall";
			this.els.helpBtn = UI.button({ cls: "sky" + sq, icon: "help", iconScale: 3, label: portrait ? null : "Help", title: "Help", px: 2, onClick: function(){ t.HelpOverlay.show(); } }, sys);
			this.els.levelsBtn = UI.button({ cls: sq, icon: "levels", iconScale: 3, label: portrait ? null : "Levels", title: "Levels", px: 2, onClick: function(){ GS.toLevels(); } }, sys);
			var snd = this.els.soundBtn = UI.button({ cls: "mint gs-sound" + sq, icon: "sound", iconScale: 3, title: "Sound on/off", onClick: function(){
				if(t.Sfx) t.Sfx.toggle();
				GS.updateSound();
			} }, sys);
			var mus = this.els.musicBtn = UI.button({ cls: "mint gs-sound" + sq, icon: "music", iconScale: 3, title: "Music on/off", onClick: function(){
				if(t.Music) t.Music.toggle();
				GS.updateMusic();
			} }, sys);
			if(!portrait) { sys.insertBefore(mus, sys.firstChild); sys.insertBefore(snd, mus); }
			this.updateSound();
			this.updateMusic();
			var msg = UI.el("div", "gs-msg", el);
			var mx = portrait ? 14 : tx, my = portrait ? 14 + badgeSize + 12 : 70;
			msg.style.left = mx + "px"; msg.style.top = my + "px";
			msg.style.width = (portrait ? r.w - 28 : r.w - tx - sysW - 30) + "px";
			this.fillText(msg, level.text || "");
			var h = Math.max(portrait ? 90 : 112, my + msg.offsetHeight + 14);
			r.h = h;
			UI.place(card.bg, r); UI.place(card.el, r);
			this.els.hdr = card;
			return { card: card, h: h };
		},

		// Level text is hard-wrapped with "\n" for the old canvas; reflow it,
		// keeping blank lines as paragraph breaks.
		fillText: function(el, text) {
			var paras = String(text).replace(/\s+$/, "").split(/\n\s*\n/);
			paras.forEach(function(p) {
				UI.el("p", "", el, p.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim());
			});
		},

		levelNumber: function(level) {
			var i = 1;
			for(var n in t.Levels.levels) { if(t.Levels.levels[n] === level) return i; i++; }
			return "?";
		},
		bestParts: function(level) {
			var s = t.GameSaver.loadLevelStatus(level.name);
			return (s || s === 0) && s !== false ? Math.max(0, s - 1) : -1;
		},
		// short form in portrait, where it shares the row with four buttons
		statusText: function(level, short) {
			var p = this.bestParts(level);
			if(p < 0) return "Not solved yet";
			return short ? "Solved: " + p + "/3 parts" : "Solved - best " + p + " of 3 parts";
		},

		buildTray: function(L, ops) {
			var tr = L.tray;
			var card = UI.card(tr, "sun tray", { tag: "Tiles", tagCls: "mint" });
			var el = card.el;
			this.els.tray = card;
			this.els.caps = [];
			if(tr.grid.cap) {
				tr.slots.forEach(function(s, i) {
					var c = UI.el("div", "gs-cap", el, caption(ops[i]));
					UI.place(c, { x: s.x - tr.x - 8, y: s.y - tr.y + PITCH + 3, w: PITCH + 16 });
				});
			}
			// a "?" badge on each tile opens its explainer (js/ui/tile-explainers.js)
			tr.slots.forEach(function(s, i) {
				var op = ops[i];
				if(!t.TileExplain || !t.TileExplain.card(op)) return;
				var q = UI.button({ cls: "sky gs-q", label: "?", px: 2, title: "How does " + title(op) + " work?", onClick: function(){
					t.TileExplain.open([op]);
				} }, el);
				UI.place(q, { x: s.x - tr.x + PITCH - 16, y: s.y - tr.y - 15 });
			});
			var tools = UI.place(UI.el("div", "gs-tools", el), { x: tr.tools.x - tr.x, y: tr.tools.y - tr.y, w: tr.tools.w, h: tr.tools.h });
			if(tr.tools.column) tools.style.flexDirection = "column";
			this.els.undo = UI.button({ cls: "gs-undo mint", icon: "undo", iconScale: 2, small: "undo", title: "Undo", onClick: function(){ t.TileInput.undo(); } }, tools);
			this.els.bin = UI.button({ cls: "gs-bin", icon: "trash", iconScale: 3, small: "trash", title: "Trash: drop a tile here, tap to clear the board", onClick: function(){ t.TileInput.clearBoard(); } }, tools);
			if(tr.tools.column) {
				var bh = Math.max(44, (tr.tools.h - 10) / 2);
				this.els.undo.style.height = this.els.bin.style.height = bh + "px";
				this.els.undo.style.width = this.els.bin.style.width = "100%";
				this.els.bin.style.flex = "none";
			}
			this.updateTools();
		},

		buildMat: function(L) {
			var card = UI.card(L.mat, "sky mat");
			this.els.mat = card;
			var b = L.board;
			UI.place(UI.el("div", "gs-board-frame", UI.under), { x: b.x - 3, y: b.y - 3, w: b.w + 6, h: b.h + 6 });
			// start flag: the program enters the middle row from the left
			var startRow = (b.rows - b.rows % 2) / 2;
			var flag = UI.place(UI.el("div", "gs-flag", UI.under), { x: b.x - 3 - 26, y: b.y + startRow * PITCH + (PITCH - 50) / 2 });
			flag.appendChild(UI.icon("start", 2));
			flag.title = "Start";
			var lock = this.els.lock = UI.el("div", "gs-lock", card.el);
			lock.appendChild(UI.icon("lock", 2));
			UI.el("span", "", lock, "Stop the robot to edit");
			lock.style.left = "50%"; lock.style.transform = "translateX(-50%)";
			lock.style.top = "-16px";
		},

		buildCell: function(L, rt) {
			var card = UI.card(L.cell, "tomato cell", { tag: "Robot cell" });
			this.els.cell = card;
			UI.place(UI.el("div", "gs-win", UI.under), L.win);
			if(L.dials && rt.counterPanel) {
				var d = UI.place(UI.el("div", "gs-dials", card.el), { x: L.dials.x - L.cell.x, y: L.dials.y - L.cell.y, w: L.dials.w, h: L.dials.h });
				rt.counterPanel.attach(d);
			}
		},

		buildScore: function(L, level) {
			var host, box;
			if(L.score) {
				var card = UI.card(L.score, "score", { tag: "Last run", tagCls: "sky" });
				host = card.el;
				box = UI.place(UI.el("div", "gs-score", host), { x: 14, y: 14, w: L.score.w - 28 - 6, h: L.score.h - 28 - 6 });
			} else {
				return; // portrait: controls.js puts the score row in the deck
			}
			this.fillScore(box, level, false);
		},

		fillScore: function(box, level, mini) {
			if(mini) box.classList.add("mini");
			var steps = UI.el("div", "gs-steps", box);
			if(mini) UI.el("span", "lbl", steps, "Last run");
			this.els.stepsNum = UI.el("span", "num", steps, "–");
			UI.el("span", "lbl", steps, "steps");
			this.els.outcome = UI.el("span", "out", steps, "");
			var goals = UI.el("div", "gs-goals" + (mini ? " mini" : ""), box);
			var times = level.times; // [t3, t2, t1]: max steps for 3 / 2 / 1 parts
			var icons = ["capacitor", "integratedcircuit", "coil"];
			this.els.goals = [];
			for(var i = 0; i < 3; i++) {
				var g = UI.el("div", "gs-goal off", goals);
				var img = UI.el("img", "", g);
				img.alt = "";
				img.dataset.icon = icons[i];
				var target = times && times.length === 3 ? times[2 - i] : null;
				UI.el("span", "", g, target !== null && target !== undefined ? "≤" + target : (i + 1) + (i ? " parts" : " part"));
				g.title = (i + 1) + (i ? " parts" : " part") + (target !== null && target !== undefined ? ": finish in " + target + " steps or fewer" : "");
				this.els.goals.push(g);
			}
			this.updateScore();
		},

		updateScore: function() {
			var level = t.Levels.currentLevel, run = t.Controls.lastRun;
			if(!this.els.goals) return;
			var parts = this.bestParts(level);
			if(run && run.parts !== undefined && run.parts > parts) parts = run.parts;
			var bw = { capacitor: "capacitorBW", integratedcircuit: "integratedcircuitBW", coil: "coilBW" };
			for(var i = 0; i < 3; i++) {
				var on = parts >= i + 1, g = this.els.goals[i], img = g.querySelector("img");
				g.classList.toggle("off", !on);
				img.src = versionedUrl("images/" + (on ? img.dataset.icon : bw[img.dataset.icon]) + ".png");
			}
			this.els.stepsNum.textContent = run ? run.steps : "–";
			this.els.outcome.textContent = run ? (OUTCOMES[run.end] || run.end || "") : "";
		},

		// ---- state shown in the HTML ----
		locked: function() {
			var tt = t.TuringTable;
			return t.Controls.animationIsPlaying || !tt.steps.isEmpty();
		},
		refresh: function() {
			if(!this.active || !this.els.mat) return;
			var locked = this.locked();
			if(locked !== this._locked) {
				this._locked = locked;
				this.els.mat.el.classList.toggle("gs-locked", locked);
				this.updateTools();
			}
			t.Controls.refreshButtons && t.Controls.refreshButtons();
		},
		nudgeLock: function() {
			var l = this.els.lock;
			if(!l) return;
			l.animate && l.animate([{ transform: "translateX(-50%) scale(1)" }, { transform: "translateX(-50%) scale(1.15)" }, { transform: "translateX(-50%) scale(1)" }], { duration: 260 });
		},
		updateTools: function() {
			if(!this.els.undo) return;
			var locked = this.locked();
			this.els.undo.disabled = locked || !t.TileInput.canUndo();
			this.els.bin.disabled = locked;
		},
		updateSound: function() {
			var b = this.els.soundBtn;
			if(!b) return;
			var muted = t.Sfx && t.Sfx.muted ? t.Sfx.muted() : false;
			b.innerHTML = "";
			b.appendChild(UI.icon(muted ? "mute" : "sound", 3));
			if(!b.classList.contains("gs-sq")) b.appendChild(UI.px(muted ? "Off" : "Sound", 2));
			b.classList.toggle("mint", !muted);
			b.setAttribute("aria-pressed", muted ? "false" : "true");
			b.title = muted ? "Sound is off: turn it on" : "Sound is on: turn it off";
			b.setAttribute("aria-label", b.title);
		},
		updateMusic: function() {
			var b = this.els.musicBtn;
			if(!b) return;
			var muted = t.Music && t.Music.muted ? t.Music.muted() : true;
			b.innerHTML = "";
			b.appendChild(UI.icon(muted ? "music-off" : "music", 3));
			if(!b.classList.contains("gs-sq")) b.appendChild(UI.px(muted ? "Off" : "Music", 2));
			b.classList.toggle("mint", !muted);
			b.setAttribute("aria-pressed", muted ? "false" : "true");
			b.title = muted ? "Music is off: turn it on" : "Music is on: turn it off";
			b.setAttribute("aria-label", b.title);
		},
		setTrashHot: function(on) { if(this.els.bin) this.els.bin.classList.toggle("hot", !!on); },

		toLevels: function() {
			Q.clearStages();
			Q.stageScene("level selector");
		},

		// screen geometry the help overlay points at
		targets: function() {
			var L = this.layout;
			return { tray: L.tray, mat: L.mat, cell: L.cell, deck: L.deck, hdr: L.hdr, sys: this.els.helpBtn && this.els.helpBtn.parentNode };
		}
	};

	var Q;
	UI.on("screenclear", function(){ GS.active = false; GS.layout = null; GS.els = {}; });

	TuringScenes.add(function(_Q) {
		Q = _Q;
		UI.scene("level", {
			responsive: true,
			restage: function() {
				t.Controls.toDoAfterAnimationStops = false;
				t.Controls.animationIsPlaying = false;
				t.TuringTable.steps.empty();
				Q.clearStages();
				Q.stageScene("level", 0, { sort: true });
				Q.stageScene("controls", 1);
			}
		});
		UI.scene("controls", { responsive: true });

		//stage 0
		Q.scene("level", function(stage) {
			Q.touch(Q.SPRITE_UI, [4, 2]);
			GS.begin(stage);
			t.Levels.setLevel(stage);
			t.TuringTable.callbacksUntilCallback = 0;
			GS.build(stage);
			if(t.Levels.currentLevel.beforePlayLimit) t.Levels.currentLevel.beforePlayLimit();
		}, { sort: true });

		//stage 1
		Q.scene("controls", function(stage) {
			t.Controls.displayMe(stage);
			t.Controls.animationIsPlaying = false;
			t.Controls.toDoAfterAnimationStops = false;
			stage.on("step", function(){ GS.refresh(); });
		});
	});
})();
