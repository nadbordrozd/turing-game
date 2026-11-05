// Tile explainers (bead tg-84y.14): a Toybox card per program tile with a
// title, a short friendly text and a looping demo drawn in its own canvas.
// They replace the 2012 helperOptions demos from Operators.js.
//
//   t.TileExplain.open(ops, {index, auto, fromPress})  ops: operators, one card each
//   t.TileExplain.forLevel(ops)             auto-open unseen tile types
//   t.TileExplain.close(), .isOpen()
//
// Robot-action tiles (step, turns) show the same tile in all four
// orientations, the program marker passing through each, and next to each a
// mini robot cell where the robot does the same thing every time. Belts show
// the marker following a loop; branch tiles show both outcomes side by side.
// Seen tile types are kept in localStorage "turing.tilesSeen" (a JSON list of
// families: operator names, with every colour's +1 as "Plus" and -1 as
// "Minus"). prefers-reduced-motion shows a still frame.
(function() {
	"use strict";
	var UI = t.UI;
	var P = 54;					// program tile pitch (board contract)
	var RS = 52;				// robot cell pitch: 50 px tile + 2 px grout (RobotTable)
	var INK = "#2a2335", CREAM = "#fff4dc", SUN = "#f6c445", MINT = "#a3d9b1";
	var WIN = "#f7e7c6";		// robot window (.gs-win)
	var FONT = '800 13px ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
	var SEEN_KEY = "turing.tilesSeen";
	var Q = null;

	// ---- what each tile says (semantics from Operators.js operate()) ----
	function colourOf(op) {
		return t.OperatorUtils.isIncrementer(op) || t.OperatorUtils.isDecrementer(op) || null;
	}
	function family(op) {
		if(t.OperatorUtils.isIncrementer(op)) return "Plus";
		if(t.OperatorUtils.isDecrementer(op)) return "Minus";
		return op.name;
	}
	var STEER = "The arrow only steers the program.";
	var CARDS = {
		Step: {
			demo: "orient", act: "step",
			text: "Moves the robot one square forward, towards its feet. If a wall is in the way, it bumps into it and stays put.",
			point: STEER + " The robot always moves the way it's facing."
		},
		ClockwiseRotator: {
			demo: "orient", act: "cw",
			text: "Turns the robot a quarter turn to its right (clockwise). It stays on its square.",
			point: STEER + " The robot always turns the same way."
		},
		CounterClockwiseRotator: {
			demo: "orient", act: "ccw",
			text: "Turns the robot a quarter turn to its left (anticlockwise). It stays on its square.",
			point: STEER + " The robot always turns the same way."
		},
		Conveyor: {
			demo: "belt",
			text: "Does nothing to the robot. It just carries the program on the way its arrow points, so you can lead it to other tiles.",
			point: "The program follows the arrows, whichever side it comes in from."
		},
		Detector: {
			demo: "branch", sense: "wall",
			text: "The robot checks the square in front of it. Blocked: the program goes out the side with the walls. Clear: out the other side.",
			point: "The robot looks the way it's facing, whichever way the tile points.",
			labels: ["Wall ahead", "No wall"]
		},
		DetectMagic: {
			demo: "branch", sense: "magic",
			text: "Checks whether the robot is standing on a blue tile. Yes: the program goes out the side with the blue tiles. No: out the other side.",
			point: "Only the square under the robot counts.",
			labels: ["On blue", "Not on blue"]
		},
		Plus: {
			demo: "plus",
			text: function(c) { return "Adds one to the " + c + " counter. The program carries straight on."; },
			point: "The robot stays put: only the counter changes."
		},
		Minus: {
			demo: "minus",
			text: function(c) { return "Looks at the " + c + " counter. If it shows 0, the program goes out the 0 side. Otherwise the counter goes down by one and the program goes out the minus side."; },
			point: "A counter never goes below 0.",
			labels: ["Counter at 0", "Counter above 0"]
		}
	};
	function card(op) { return CARDS[family(op)] || null; }
	function title(op) { return t.GameScreen && t.GameScreen.title ? t.GameScreen.title(op) : op.name; }

	// ---- seen set ----
	function loadSeen() {
		try {
			var v = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
			return Array.isArray(v) ? v : [];
		} catch(e) { return []; }
	}
	function markSeen(fams) {
		var s = loadSeen();
		fams.forEach(function(f) { if(s.indexOf(f) < 0) s.push(f); });
		try { localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch(e) {}
	}
	// one operator per tile type, in tray order
	function distinct(ops) {
		var out = [], fams = [];
		ops.forEach(function(op) {
			var f = family(op);
			if(card(op) && fams.indexOf(f) < 0) { fams.push(f); out.push(op); }
		});
		return out;
	}

	// ---- drawing helpers (logical px) ----
	function ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
	function seg(T, a, b) { return Math.max(0, Math.min(1, (T - a) / (b - a))); }
	function dirOf(angle) { return t.Operators.r([1, 0], angle); }
	function rr(ctx, x, y, w, h, r) { t.UI.roundRect(ctx, x, y, w, h, r); }

	// a patch of program board (mint, ink frame, as .gs-board-frame)
	function drawBoard(ctx, x, y, w, h) {
		ctx.save();
		ctx.fillStyle = "rgba(255,255,255,0.35)";
		rr(ctx, x - 8, y - 8, w + 16, h + 16, 10); ctx.fill();
		ctx.fillStyle = MINT;
		rr(ctx, x - 3, y - 3, w + 6, h + 6, 6); ctx.fill();
		ctx.lineWidth = 3; ctx.strokeStyle = INK;
		rr(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 5); ctx.stroke();
		ctx.restore();
	}
	function drawTile(ctx, op, angle, cx, cy, sheet) {
		var o = sheet ? { sheet: sheet, sprite: op.sprite } : op;
		t.UI.drawTile(ctx, o, angle, cx, cy, P);
	}
	function drawMarker(ctx, x, y, alpha, T) {
		if(alpha <= 0) return;
		ctx.save();
		ctx.globalAlpha *= Math.min(1, alpha);
		ctx.translate(x, y);
		ctx.rotate(T * Math.PI / 3);	// Q.Spark turns at 60 deg/s
		Q.RoboFx.drawMarker(ctx, P);
		ctx.restore();
	}
	// a little ring that flashes when the tile under the marker runs
	function drawFire(ctx, cx, cy, k) {
		if(k <= 0 || k >= 1) return;
		ctx.save();
		ctx.globalAlpha *= 1 - k;
		ctx.lineWidth = 3;
		ctx.strokeStyle = CREAM;
		rr(ctx, cx - P / 2 - 2 - 6 * k, cy - P / 2 - 2 - 6 * k, P + 4 + 12 * k, P + 4 + 12 * k, 8);
		ctx.stroke();
		ctx.restore();
	}
	// Robot window (cols x rows cells); kinds(i, j) -> "floor" | "wall" | "magic".
	// Returns the cell-centre function.
	function drawWin(ctx, cx, cy, cols, rows, kinds) {
		var gw = cols * RS + 2, gh = rows * RS + 2, pad = 7;
		var x0 = cx - gw / 2, y0 = cy - gh / 2;
		ctx.save();
		ctx.fillStyle = WIN;
		rr(ctx, x0 - pad, y0 - pad, gw + 2 * pad, gh + 2 * pad, 10); ctx.fill();
		ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
		ctx.fillStyle = INK;
		ctx.fillRect(x0, y0, gw, gh);
		var floor = Q.asset("robotile.png");
		for(var i = 0; i < cols; i++) for(var j = 0; j < rows; j++) {
			var x = x0 + 2 + RS * i, y = y0 + 2 + RS * j;
			var kind = kinds ? kinds(i, j) : "floor";
			var sh = kind === "wall" ? Q.sheet("obstacle") : kind === "magic" ? Q.sheet("magicTile") : null;
			if(sh) sh.draw(ctx, x, y, 0);
			else if(floor) ctx.drawImage(floor, x, y, 50, 50);
		}
		ctx.restore();
		return function(i, j) { return { x: x0 + 2 + RS * i + 25, y: y0 + 2 + RS * j + 25 }; };
	}
	// The player robot, rotated deg clockwise (0 = facing down), with optional
	// sense / bump effects drawn by Q.RoboFx in the robot's own frame.
	function drawRobot(ctx, x, y, deg, alpha, fx) {
		var sh = Q.sheet("player");
		if(!sh || alpha <= 0) return;
		ctx.save();
		ctx.globalAlpha *= Math.min(1, alpha === undefined ? 1 : alpha);
		ctx.translate(x, y);
		ctx.rotate(deg * Math.PI / 180);
		if(fx && fx.kind === "sense") Q.RoboFx.drawSenseUnder(ctx, fx.k, fx.s);
		sh.draw(ctx, -25, -25, 0);
		if(fx && fx.kind === "sense") Q.RoboFx.drawSenseOver(ctx, fx.k, fx.s);
		ctx.restore();
	}
	// curved arrow around (x, y) for a quarter turn; dir 1 = clockwise
	function drawTurnArrow(ctx, x, y, dir, alpha) {
		if(alpha <= 0) return;
		var r = 31, a0 = dir > 0 ? -Math.PI * 0.95 : -Math.PI * 0.05, a1 = a0 + dir * Math.PI * 0.55;
		ctx.save();
		ctx.globalAlpha *= alpha;
		ctx.lineCap = "round";
		for(var pass = 0; pass < 2; pass++) {
			ctx.strokeStyle = pass ? SUN : INK;
			ctx.lineWidth = pass ? 3 : 7;
			ctx.beginPath();
			ctx.arc(x, y, r, a0, a1, dir < 0);
			ctx.stroke();
		}
		// head, pointing along the arc
		var hx = x + r * Math.cos(a1), hy = y + r * Math.sin(a1), tang = a1 + dir * Math.PI / 2;
		ctx.translate(hx, hy);
		ctx.rotate(tang);
		ctx.beginPath();
		ctx.moveTo(7, 0); ctx.lineTo(-5, -7); ctx.lineTo(-5, 7); ctx.closePath();
		ctx.fillStyle = SUN; ctx.strokeStyle = INK; ctx.lineWidth = 2;
		ctx.lineJoin = "round";
		ctx.fill(); ctx.stroke();
		ctx.restore();
	}
	// chevron just outside a board edge; d = outward direction [dx, dy]
	function drawExit(ctx, x, y, d, lit) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(Math.atan2(d[1], d[0]));
		ctx.beginPath();
		ctx.moveTo(9, 0); ctx.lineTo(-5, -9); ctx.lineTo(-5, 9); ctx.closePath();
		ctx.lineJoin = "round";
		if(lit) {
			ctx.fillStyle = SUN; ctx.fill();
			ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
		} else {
			ctx.lineWidth = 2; ctx.strokeStyle = "rgba(42,35,53,0.35)"; ctx.stroke();
		}
		ctx.restore();
	}
	function drawLabel(ctx, text, x, y, colour) {
		ctx.save();
		ctx.font = FONT;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = colour || INK;
		ctx.fillText(text, x, y);
		ctx.restore();
	}
	// a counter dial like .gs-dial (chip with the colour's name over an LCD)
	function drawDial(ctx, x, y, colour, value, flash, pop) {
		var col = (t.CounterDials && t.CounterDials.COLORS && t.CounterDials.COLORS[colour]) || { chip: "#6a5f74", lcd: CREAM };
		var w = 70, ch = 22, lh = 34;
		ctx.save();
		ctx.fillStyle = col.chip;
		rr(ctx, x, y, w, ch + 10, 10); ctx.fill();
		ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
		ctx.fillStyle = INK;
		rr(ctx, x, y + ch, w, lh + 3, 10); ctx.fill();
		ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
		ctx.strokeStyle = "#3b3349"; ctx.lineWidth = 3;
		rr(ctx, x + 4.5, y + ch + 4.5, w - 9, lh - 6, 6); ctx.stroke();
		if(flash > 0) {
			ctx.globalAlpha = flash;
			ctx.lineWidth = 3; ctx.strokeStyle = SUN;
			rr(ctx, x - 5, y - 5, w + 10, ch + lh + 13, 13); ctx.stroke();
			ctx.globalAlpha = 1;
		}
		ctx.font = '800 12px ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
		ctx.textAlign = "center"; ctx.textBaseline = "middle";
		ctx.fillStyle = CREAM;
		ctx.fillText(colour.toLowerCase(), x + w / 2, y + ch / 2 + 2);
		ctx.font = '800 20px "SF Mono", Menlo, Consolas, monospace';
		ctx.fillStyle = col.lcd;
		ctx.fillText(String(value), x + w / 2, y + ch + lh / 2 + 1);
		if(pop && pop.a > 0) {		// "+1" / "-1" floating up from the dial
			ctx.globalAlpha = pop.a;
			ctx.font = '800 18px ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
			ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = "round";
			ctx.textAlign = "left";
			ctx.strokeText(pop.text, x + w + 7, y + 12 - pop.dy);
			ctx.fillStyle = SUN;
			ctx.fillText(pop.text, x + w + 7, y + 12 - pop.dy);
		}
		ctx.restore();
	}
	function panelBg(ctx, x, y, w, h) {
		ctx.save();
		ctx.fillStyle = "rgba(255,244,220,0.32)";
		rr(ctx, x, y, w, h, 14); ctx.fill();
		ctx.restore();
	}

	// ---- demos: each returns {w, h, draw(ctx, T, still)}; T in seconds ----
	var DEMOS = {};

	// Same tile in all four orientations, each with its own robot doing the same thing.
	DEMOS.orient = function(op, c, W) {
		var gap = 10, colW = Math.min(150, Math.floor((W - 3 * gap - 8) / 4));
		var step = c.act === "step";
		var rows = step ? 2 : 1, winH = rows * RS + 2 + 14;
		var top = 26, tileY = top + P / 2, winY = top + P + 30 + winH / 2;
		var H = top + P + 30 + winH + 16;
		var angles = [0, 1, 2, 3];			// east, north, west, south
		var x0 = (W - (4 * colW + 3 * gap)) / 2;
		var L = 2.8;
		return { w: W, h: H, draw: function(ctx, T, still) {
			var u = still ? 1.2 : T % L;
			var enter = seg(u, 0, 0.55), act = ease(seg(u, 0.75, 1.65));
			var mA = still ? 1 : Math.min(seg(u, 0, 0.2), 1 - seg(u, 1.35, 1.65));
			var s = still ? 6 : (u < 0.75 ? -P / 2 + (P / 2) * ease(enter) : (P / 2) * seg(u, 0.75, 1.65));
			var robotA = still ? 1 : Math.min(Math.max(seg(u, 0, 0.2), u > 0.5 ? 1 : 0), 1 - seg(u, 2.45, 2.8));
			var ghostA = still ? 0.3 : 0.3 * Math.min(seg(u, 1.65, 1.9), 1 - seg(u, 2.35, 2.6));
			if(still) act = 1;
			angles.forEach(function(a, i) {
				var cx = x0 + i * (colW + gap) + colW / 2;
				panelBg(ctx, cx - colW / 2, 4, colW, H - 8);
				drawBoard(ctx, cx - P / 2, tileY - P / 2, P, P);
				drawTile(ctx, op, a, cx, tileY);
				if(!still) drawFire(ctx, cx, tileY, seg(u, 0.55, 1.0));
				var d = dirOf(a);
				drawMarker(ctx, cx + d[0] * s, tileY + d[1] * s, mA, T);
				if(still) drawExitHint(ctx, cx, tileY, d);
				var cell = drawWin(ctx, cx, winY, 1, rows);
				var c0 = cell(0, 0);
				if(step) {
					var c1 = cell(0, 1);
					drawRobot(ctx, c0.x, c0.y, 0, ghostA);
					drawRobot(ctx, c0.x, c0.y + (c1.y - c0.y) * act, 0, robotA);
				} else {
					var dir = c.act === "cw" ? 1 : -1;
					drawRobot(ctx, c0.x, c0.y, 90 * dir * act, robotA);
					drawTurnArrow(ctx, c0.x, c0.y, dir, still ? 1 : Math.min(seg(u, 1.65, 1.85), 1 - seg(u, 2.3, 2.5)));
				}
			});
		} };
	};
	// still frame: a sun chevron where the marker leaves the tile
	function drawExitHint(ctx, cx, cy, d) {
		drawExit(ctx, cx + d[0] * (P / 2 + 12), cy + d[1] * (P / 2 + 12), d, true);
	}

	// A loop of belts with the marker running round; the robot just waits.
	DEMOS.belt = function(op, c, W) {
		// cells of a 3x2 loop and the way each one points
		var path = [[0, 0, 0], [1, 0, 0], [2, 0, 3], [2, 1, 2], [1, 1, 2], [0, 1, 1]];
		var bw = 3 * P, bh = 2 * P, winW = RS + 2 + 14, gap = 56;
		var tot = bw + gap + winW, bx = Math.round((W - tot) / 2), by = 22;
		var H = by + bh + 36;
		var wx = bx + bw + gap + winW / 2, wy = by + bh / 2;
		var sheets = path.map(function(p, i) {
			var prev = path[(i + path.length - 1) % path.length];
			var m = t.Operators.r(dirOf(prev[2]), -p[2]);	// incoming motion, in the tile's own frame
			return m[1] > 0 ? "conveyorFromLeft" : m[1] < 0 ? "conveyorFromRight" : "conveyor";
		});
		var HOP = 0.62, MOVE = 0.48;
		function centre(i) { var p = path[i % path.length]; return { x: bx + p[0] * P + P / 2, y: by + p[1] * P + P / 2 }; }
		return { w: W, h: H, draw: function(ctx, T, still) {
			drawBoard(ctx, bx, by, bw, bh);
			path.forEach(function(p, i) { drawTile(ctx, op, p[2], bx + p[0] * P + P / 2, by + p[1] * P + P / 2, sheets[i]); });
			var tt = still ? HOP * 1.4 : T;
			var n = Math.floor(tt / HOP), k = ease(Math.min(1, (tt - n * HOP) / MOVE));
			var a = centre(n), b = centre(n + 1);
			drawMarker(ctx, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 1, T);
			var cell = drawWin(ctx, wx, wy, 1, 1), c0 = cell(0, 0);
			drawRobot(ctx, c0.x, c0.y, 0, 1);
			// "z z z": the robot is idle
			for(var i = 0; i < 3; i++) {
				var ph = still ? i / 3 : ((T / 2.4) + i / 3) % 1;
				ctx.save();
				ctx.globalAlpha = Math.sin(Math.PI * ph);
				ctx.font = FONT.replace("13px", Math.round(12 + 6 * ph) + "px");
				ctx.fillStyle = INK;
				ctx.fillText("z", c0.x + 22 + 10 * ph, c0.y - 24 - 22 * ph);
				ctx.restore();
			}
			drawLabel(ctx, "robot waits", wx, wy + RS / 2 + 26);
		} };
	};

	// Branch tile: [yes, no] side by side. kind: "wall" | "magic" | "minus".
	function branch(op, c, W, kind, colour) {
		var gap = 16, pw = Math.min(250, Math.floor((W - gap - 8) / 2));
		var sideW = kind === "minus" ? 70 : RS + 2 + 14;
		var rows = kind === "wall" ? 2 : 1;
		var sideH = kind === "minus" ? 59 : rows * RS + 2 + 14;
		var innerH = Math.max(P + 2 * 30, sideH);
		var H = 10 + innerH + 30;
		var x0 = (W - (2 * pw + gap)) / 2, cy = 10 + innerH / 2;
		var L = 3.4;
		return { w: W, h: H, draw: function(ctx, T, still) {
			var u = still ? 1.15 : T % L;
			[true, false].forEach(function(yes, i) {
				var px = x0 + i * (pw + gap);
				panelBg(ctx, px, 2, pw, H - 4);
				var cont = P + 28 + sideW, tx = px + (pw - cont) / 2 + P / 2;
				var sx = tx + P / 2 + 28 + sideW / 2;
				drawBoard(ctx, tx - P / 2, cy - P / 2, P, P);
				drawTile(ctx, op, 0, tx, cy);
				var out = yes ? [0, -1] : [0, 1];	// at angle 0 the "yes" exit is north
				var lit = still || (u > 1.6 && u < 3.1);
				drawExit(ctx, tx, cy - P / 2 - 14, [0, -1], lit && yes);
				drawExit(ctx, tx, cy + P / 2 + 14, [0, 1], lit && !yes);
				// marker: in from the west, wait while the tile runs, out the chosen side
				var mx = tx, my = cy, ma = 1;
				if(still) { mx = tx + out[0] * 8; my = cy + out[1] * 8; }
				else if(u < 0.5) { mx = tx - P / 2 + (P / 2) * ease(u / 0.5); ma = seg(u, 0, 0.2); }
				else if(u >= 1.6) { var e = seg(u, 1.6, 2.2); mx = tx + out[0] * e * P / 2; my = cy + out[1] * e * P / 2; ma = 1 - seg(u, 1.95, 2.2); }
				if(!still) drawFire(ctx, tx, cy, seg(u, 0.5, 0.95));
				drawMarker(ctx, mx, my, ma, T);
				var k = still ? 0.5 : seg(u, 0.5, 1.6);
				if(kind === "minus") {
					var v = yes ? 0 : (u >= 1.0 && !still) || still ? 2 : 3;
					var flash = still ? 0 : Math.sin(Math.PI * seg(u, 0.9, 1.4));
					var pop = !yes && (still || u >= 1.0) ? { text: "−1", a: still ? 1 : 1 - seg(u, 1.8, 2.4), dy: still ? 6 : 16 * seg(u, 1.0, 2.4) } : null;
					drawDial(ctx, sx - 35, cy - 30, colour, v, yes ? flash : 0, pop);
				} else {
					var cell = drawWin(ctx, sx, cy, 1, rows, function(ci, cj) {
						if(kind === "wall") return cj === 1 && yes ? "wall" : "floor";
						return yes ? "magic" : "floor";
					});
					var c0 = cell(0, 0);
					var sense = { kind: kind, result: yes };
					drawRobot(ctx, c0.x, c0.y, 0, 1, k > 0 && k < 1 ? { kind: "sense", k: k, s: sense } : null);
				}
				var col = lit ? INK : "rgba(42,35,53,0.7)";
				drawLabel(ctx, c.labels[i], px + pw / 2, H - 18, col);
			});
		} };
	}
	DEMOS.branch = function(op, c, W) { return branch(op, c, W, c.sense); };
	DEMOS.minus = function(op, c, W) { return branch(op, c, W, "minus", colourOf(op)); };

	// +1: the marker passes through and the dial counts up.
	DEMOS.plus = function(op, c, W) {
		var gap = 46, tot = P + gap + 70 + 30, tx = Math.round((W - tot) / 2) + P / 2, cy = 52;
		var H = 104, L = 2.4, colour = colourOf(op);
		return { w: W, h: H, draw: function(ctx, T, still) {
			var n = Math.floor(T / L), u = still ? 0.9 : T % L;
			drawBoard(ctx, tx - P / 2, cy - P / 2, P, P);
			drawTile(ctx, op, 0, tx, cy);
			var mx = still ? tx + 6 : tx - P / 2 + P * seg(u, 0, 1.4);
			var ma = still ? 1 : Math.min(seg(u, 0, 0.2), 1 - seg(u, 1.15, 1.4));
			if(!still) drawFire(ctx, tx, cy, seg(u, 0.7, 1.15));
			drawMarker(ctx, mx, cy, ma, T);
			drawExit(ctx, tx + P / 2 + 14, cy, [1, 0], true);
			var fired = still || u >= 0.7;
			var v = still ? 1 : (n + (fired ? 1 : 0)) % 100;
			var pop = fired ? { text: "+1", a: still ? 1 : 1 - seg(u, 1.3, 2.0), dy: still ? 6 : 16 * seg(u, 0.7, 2.0) } : null;
			drawDial(ctx, tx + P / 2 + gap, cy - 30, colour, v, 0, pop);
		} };
	};

	// ---- the card ----
	var state = null;	// {ops, index, auto, m, box, raf, demo, ctx, t0}
	var reopen = null;
	function reducedMotion() {
		try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
		catch(e) { return false; }
	}

	function render() {
		var s = state, op = s.ops[s.index], c = card(op), box = s.box;
		var colour = colourOf(op);
		cancelAnimationFrame(s.raf);
		box.innerHTML = "";
		var tags = UI.el("div", "tx-tags", box);
		UI.tag(title(op), "sky", tags);
		if(s.auto) UI.tag("New tile", "sun", tags);
		box.setAttribute("aria-label", title(op));
		UI.button({ icon: "close", iconScale: 2, cls: "sm round tb-close tomato", title: "Close", onClick: function() { s.m.close(); } }, box);

		// card border 3 + padding 20, stage border 3 + padding 3, on each side
		var stage = UI.el("div", "tx-stage", box);
		// landscape cards have room to show the demo a little larger
		var z = s.zoom = UI.mode === "landscape" ? 1.25 : 1;
		var demo = s.demo = DEMOS[c.demo](op, c, (s.w - 58) / z);
		var cv = UI.el("canvas", "", stage);
		cv.setAttribute("role", "img");
		var text = typeof c.text === "function" ? c.text(colour.toLowerCase()) : c.text;
		cv.setAttribute("aria-label", "Animation: " + c.point);
		var k = UI.kx || 1;
		cv.width = Math.round(demo.w * z * k); cv.height = Math.round(demo.h * z * k);
		cv.style.width = demo.w * z + "px"; cv.style.height = demo.h * z + "px";
		s.ctx = cv.getContext("2d");
		s.k = k;
		UI.el("p", "tx-point", box, c.point);
		UI.el("p", "tx-text", box, text);

		var nav = UI.el("div", "tx-nav", box);
		var n = s.ops.length;
		if(n > 1) {
			UI.button({ label: "Back", onClick: function() { go(-1); } }, nav).disabled = s.index === 0;
			var dots = UI.el("div", "tx-dots", nav);
			dots.setAttribute("aria-label", "Tile " + (s.index + 1) + " of " + n);
			for(var i = 0; i < n; i++) UI.el("i", i === s.index ? "on" : "", dots);
		}
		var last = s.index === n - 1;
		var next = UI.button({ label: last ? "Got it" : "Next tile", cls: "sun", onClick: function() {
			if(last) s.m.close(); else go(1);
		} }, nav);
		next.setAttribute("autofocus", "");
		box.style.top = Math.max(24, (UI.h - box.offsetHeight) / 2) + "px";
		if(s.m) setTimeout(function() { if(state === s && next.isConnected) next.focus(); }, 0);

		s.t0 = performance.now();
		var still = reducedMotion();
		var frame = function(now) {
			if(state !== s || s.demo !== demo) return;
			var ctx = s.ctx;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, cv.width, cv.height);
			ctx.setTransform(s.k * z, 0, 0, s.k * z, 0, 0);
			demo.draw(ctx, still ? 0 : Math.max(0, now - s.t0) / 1000, still);	// rAF time can precede t0
			if(!still) s.raf = requestAnimationFrame(frame);
		};
		frame(s.t0);
	}
	function go(d) {
		if(!state) return;
		state.index = Math.max(0, Math.min(state.ops.length - 1, state.index + d));
		render();
	}

	var TE = t.TileExplain = {
		card: card,
		family: family,
		isOpen: function() { return !!state; },
		// ops: operators (one card each); o: {index, auto ("New tile" tag), fromPress (opened by a long press)}
		open: function(ops, o) {
			o = o || {};
			Q = Q || window.Q;
			ops = (ops || []).filter(function(op) { return card(op); });
			if(!ops.length || !Q) return null;
			if(state) TE.close();
			if(t.TileInput) t.TileInput.cancel();
			var wrap = UI.el("div", "tb-modal-wrap");
			wrap.style.position = "absolute";
			wrap.style.inset = "0";
			var back = UI.el("div", "tb-backdrop", wrap);
			var box = UI.el("div", "tb-popup tx-card", wrap);
			box.setAttribute("role", "dialog");
			box.setAttribute("aria-modal", "true");
			var w = Math.min(UI.mode === "portrait" ? 520 : 760, UI.w - 24);
			box.style.width = w + "px";
			box.style.left = Math.round((UI.w - w) / 2) + "px";
			var s = state = { ops: ops, index: Math.max(0, Math.min(ops.length - 1, o.index || 0)), auto: !!o.auto, box: box, w: w };
			// close on a tap that starts on the backdrop, not on the click that
			// ends the long press which opened the card
			var armed = false;
			back.addEventListener("pointerdown", function() { armed = true; });
			back.addEventListener("click", function() { if(armed && s.m) s.m.close(); armed = false; });
			if(o.fromPress) {	// nor may that click press a button on the card
				var swallow = true;
				wrap.addEventListener("click", function(e) { if(swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
				wrap.addEventListener("pointerdown", function() { swallow = false; }, true);
				setTimeout(function() { swallow = false; }, 1000);
			}
			s.m = UI.openModal(wrap, { onClose: function() {
				cancelAnimationFrame(s.raf);
				if(state === s) state = null;
			} });
			render();
			markSeen(ops.map(family));
			return s.m;
		},
		close: function() { if(state && state.m) state.m.close(); },
		// The game screen calls this once a level is built: show the tile
		// types this player has not seen yet, all on one card with pages.
		forLevel: function(ops) {
			if(reopen) {
				var r = reopen; reopen = null;
				setTimeout(function() { TE.open(r.ops, { index: r.index, auto: r.auto }); }, 0);
				return;
			}
			var seen = loadSeen();
			var fresh = distinct(ops).filter(function(op) { return seen.indexOf(family(op)) < 0; });
			if(!fresh.length) return;
			var level = t.Levels.currentLevel;
			setTimeout(function() {
				var Qx = window.Q;
				if(t.Levels.currentLevel !== level || !t.GameScreen.active || UI.modalOpen() || (Qx && (Qx.stages[2] || Qx.stages[4]))) return;
				TE.open(fresh, { auto: true });
			}, 350);
		},
		// every tile type on this level's tray (help overlay)
		openAll: function() { TE.open(distinct(t.Selector.operatorList())); },
		seen: loadSeen,
		resetSeen: function() { try { localStorage.removeItem(SEEN_KEY); } catch(e) {} }
	};

	// A layout-mode change restages the game screen (and clears the modal
	// layer): put an open explainer back on the same page afterwards.
	UI.on("modechange", function() {
		reopen = state ? { ops: state.ops, index: state.index, auto: state.auto } : null;
	});
	UI.on("staged", function(e) { if(e && e.num === 0 && e.name !== "level") reopen = null; });
	UI.on("screenclear", function() { if(state) { cancelAnimationFrame(state.raf); state = null; } });
})();
