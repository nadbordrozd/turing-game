// End-of-level screen on stage 2 (Toybox, bead tg-84y.9).
// Q.stageScene("endLevel", 2, {result, totalSteps, totalParts}) after a victory.
// The freed robots stand beside the main robot on the landscape
// (EndLevelRobots.js); robots freed by this finish drop in with a sparkle.
// Everything is HTML in the kit's modal layer; the Quintus stage only holds
// the state (tile input stays locked while stage 2 exists). The first finish
// of an alwaysFull level ('just give up') opens a celebration popup first.
(function() {
	var UI = t.UI;

	var EL = t.EndLevel = {
		POINTS_PER_ROBOT: 3,

		// Saved status is parts + 1 per finished level; points are their sum.
		points: function() {
			var total = 0;
			for(var n in t.Levels.levels) {
				var s = t.GameSaver.loadLevelStatus(n);
				if(s) total += s;
			}
			return total;
		},
		// Robots freed beside the main robot (entry 0, always shown): entry i
		// (i >= 1) is freed at POINTS_PER_ROBOT * i points.
		freed: function(points) {
			var max = t.EndLevelRobots.data.length - 1;
			return Math.max(0, Math.min(max, Math.floor(points / EL.POINTS_PER_ROBOT)));
		},
		available: function(level) {
			var req = level.required;
			if(!req) return true;
			for(var i in req) {
				var s = t.GameSaver.loadLevelStatus(req[i]);
				if(s === false || s === undefined || s === null) return false;
			}
			return true;
		},
		// The next level in order that can be played, or null.
		nextLevel: function(level) {
			var seen = false;
			for(var n in t.Levels.levels) {
				var l = t.Levels.levels[n];
				if(seen && EL.available(l)) return l;
				if(l === level) seen = true;
			}
			return null;
		},
		celebrateKey: function(level) { return "turing.celebrated." + level.name; },
		shouldCelebrate: function(level) {
			if(!level || !level.alwaysFull) return false;
			try { return !t.Storage.getItem(EL.celebrateKey(level)); } catch(e) { return false; }
		},
		markCelebrated: function(level) {
			try { t.Storage.setItem(EL.celebrateKey(level), true); } catch(e) {}
		},
	};

	var ICONS = ["capacitor", "integratedcircuit", "coil"];
	var PART_NAMES = ["capacitor", "integrated circuit", "coil"];
	var LAND = { w: 1024, h: 768 };
	var current = null; // {stage, options} while the screen is up

	function titleFor(level, parts) {
		if(level.alwaysFull) return "Escaped!";
		if(parts >= 3) return "Speedy escape!";
		if(parts >= 1) return "Escaped!";
		return "Slow, but out!";
	}

	function hintFor(level, steps, parts) {
		var tm = level.times;
		if(level.alwaysFull) return "Any finish earns all three parts here.";
		if(parts >= 3 || !tm || tm.length !== 3) return "All three parts. The robots salute you.";
		var target = tm[2 - parts]; // steps needed for parts + 1
		var word = parts === 0 ? "a part" : "part " + (parts + 1);
		return "Finish in " + target + " steps or fewer for " + word + ".";
	}

	function assetSrc(Q, name) {
		var a = Q.asset(name);
		return a && a.src ? a.src : "images/" + name;
	}

	// The landscape with the robots, 1024x768 in its own coordinates.
	function buildLand(Q, freedNow, freedBefore, animate) {
		var land = UI.el("div", "el-land");
		var bg = UI.el("img", "el-bg", land);
		bg.alt = "";
		bg.src = assetSrc(Q, t.EndLevelRobots.background);
		var fresh = [];
		var data = t.EndLevelRobots.data;
		for(var i = 0; i <= freedNow; i++) {
			var d = data[i], a = Q.asset(d[0]);
			var w = a ? a.width : 64, h = a ? a.height : 64;
			var wrap = UI.place(UI.el("div", "el-robot", land), { x: d[1] - w / 2, y: d[2] - h / 2, w: w, h: h });
			wrap.style.zIndex = d[3];
			var img = UI.el("img", "", wrap);
			img.alt = "";
			img.src = assetSrc(Q, d[0]);
			if(i === 0) wrap.classList.add("el-main");
			if(animate && i === 0) wrap.classList.add("el-hop");
			if(animate && i > freedBefore) {
				wrap.classList.add("el-wait");
				fresh.push({ el: wrap, x: d[1], y: d[2], w: w, h: h, z: d[3] });
			}
		}
		return { el: land, fresh: fresh };
	}

	// Drop the new robots in one after another, with sparkles and the unlock sound.
	function revealFresh(land, fresh, timers, delay) {
		var showTag = fresh.length <= 3;
		fresh.forEach(function(f, k) {
			var at = delay + Math.min(k, 6) * 260;
			timers.push(setTimeout(function() {
				f.el.classList.remove("el-wait");
				f.el.classList.add("el-drop");
			}, at));
			timers.push(setTimeout(function() {
				var sp = UI.place(UI.el("div", "el-spark", land), { x: f.x, y: f.y + f.h / 2 - 10 });
				sp.style.zIndex = 60;
				for(var j = 0; j < 10; j++) {
					var p = UI.el("i", "", sp);
					var ang = j / 10 * Math.PI * 2, r = 46 + (j % 3) * 14;
					p.style.setProperty("--dx", Math.round(Math.cos(ang) * r) + "px");
					p.style.setProperty("--dy", Math.round(Math.sin(ang) * r * 0.8 - 24) + "px");
					p.style.animationDelay = (j % 2) * 60 + "ms";
				}
				if(showTag) {
					var tag = UI.el("div", "el-newtag", land);
					tag.appendChild(UI.px("New!", 2));
					UI.place(tag, { x: f.x - 26, y: f.y - f.h / 2 - 34 });
					tag.style.zIndex = 61;
				}
				if(k < 3) UI.sfx("unlock");
			}, at + 420));
		});
	}

	function partsRow(level, parts, animate) {
		var goals = UI.el("div", "gs-goals el-goals");
		var tm = level.times;
		for(var i = 0; i < 3; i++) {
			var on = parts >= i + 1;
			var g = UI.el("div", "gs-goal" + (on ? "" : " off"), goals);
			var img = UI.el("img", "", g);
			img.alt = "";
			img.src = "images/" + ICONS[i] + (on ? "" : "BW") + ".png";
			var label;
			if(level.alwaysFull) label = "any";
			else if(tm && tm.length === 3) label = "≤" + tm[2 - i];
			else label = (i + 1) + (i ? " parts" : " part");
			UI.el("span", "", g, label);
			g.title = PART_NAMES[i] + (on ? ": earned" : ": not earned") +
				(!level.alwaysFull && tm && tm.length === 3 ? " (finish in " + tm[2 - i] + " steps or fewer)" : "");
			if(on && animate) {
				g.classList.add("el-pop");
				g.style.animationDelay = (250 + i * 180) + "ms";
			}
		}
		return goals;
	}

	function goLevel(Q, level) {
		t.Levels.currentLevel = level;
		Q.clearStages();
		Q.stageScene("level", 0, { sort: true });
		Q.stageScene("controls", 1);
	}

	function celebrate(onDone) {
		UI.sfx("fanfare");
		var body = UI.el("div", "el-whoa");
		var title = UI.el("div", "el-whoa-title", body);
		title.appendChild(UI.px("Whoa,", 5));
		title.appendChild(UI.px("you did it!", 5));
		UI.el("p", "", body, "Nobody was supposed to finish this one. Full marks, obviously. Take the rest of the day off.");
		var icons = UI.el("div", "el-whoa-parts", body);
		ICONS.forEach(function(n, i) {
			var img = UI.el("img", "", icons);
			img.alt = "";
			img.src = "images/" + n + ".png";
			img.style.animationDelay = (200 + i * 160) + "ms";
		});
		var m = UI.popup({
			title: "Just give up",
			tagCls: "sun",
			w: 470,
			body: body,
			actions: [{ label: "Yay!", cls: "tomato el-yay" }],
			onClose: onDone,
		});
		m.box.classList.add("el-whoa-box");
		var confetti = UI.el("div", "el-confetti", m.node);
		var colors = ["#ec5b45", "#5ec4ee", "#f6c445", "#a3d9b1", "#9b6bd6", "#f27a9b"];
		for(var i = 0; i < 36; i++) {
			var c = UI.el("i", "", confetti);
			c.style.left = Math.round((i * 37 + 11) % 100) + "%";
			c.style.background = colors[i % colors.length];
			c.style.animationDelay = ((i * 53) % 700) + "ms";
			c.style.animationDuration = (1400 + (i * 97) % 900) + "ms";
			c.style.setProperty("--rot", ((i * 71) % 360) + "deg");
		}
		var yay = m.box.querySelector(".el-yay");
		if(yay) setTimeout(function() { try { yay.focus(); } catch(e) {} }, 0);
		return m;
	}

	TuringScenes.add(function(Q) {
		UI.scene("endLevel", { covers: true, responsive: true });

		// A layout change restages the game screen (clearing stage 2); put the
		// result screen back, without replaying its entrance.
		UI.on("modechange", function() {
			if(!current) return;
			var opts = current.options;
			setTimeout(function() {
				if(!Q.stages[0] || Q.stages[2]) return;
				if(!UI.base || UI.base.name !== "level") return;
				Q.stageScene("endLevel", 2, opts);
			}, 0);
		});

		Q.scene("endLevel", function(stage) {
			var o = stage.options;
			var level = t.Levels.currentLevel;
			var result = typeof o.result === "number" ? o.result : 0;
			var st = o._state;
			if(!st) {
				var before = EL.points();
				var bestBefore = t.GameSaver.loadLevelStatus(level.name);
				t.GameSaver.saveLevelStatus(level.name, result + 1);
				st = o._state = {
					before: before,
					after: EL.points(),
					best: Math.max(result, bestBefore ? bestBefore - 1 : 0),
					celebrate: EL.shouldCelebrate(level),
					shown: false,
				};
				if(st.celebrate) EL.markCelebrated(level);
			}
			var animate = !st.shown;
			st.shown = true;
			var steps = typeof o.totalSteps === "number" ? o.totalSteps : null;
			var freedBefore = EL.freed(st.before), freedNow = EL.freed(st.after);
			var total = t.EndLevelRobots.data.length - 1;
			var portrait = UI.mode === "portrait";
			var timers = [];

			var root = UI.el("div", "el-screen" + (portrait ? " el-portrait" : "") + (animate ? " el-anim" : ""));
			UI.place(root, { x: 0, y: 0, w: UI.w, h: UI.h });
			root.setAttribute("role", "dialog");
			root.setAttribute("aria-modal", "true");
			root.setAttribute("aria-label", "Level complete");

			var land = buildLand(Q, freedNow, freedBefore, animate && !st.celebrate);
			var frame;
			if(portrait) {
				frame = UI.el("div", "el-frame", root);
				frame.appendChild(land.el);
			} else {
				root.appendChild(land.el);
			}

			// ---- result card ----
			var card = UI.el("div", "el-card", root);
			var num = t.GameScreen && t.GameScreen.levelNumber ? t.GameScreen.levelNumber(level) : "";
			UI.tag((num ? "Level " + num + " - " : "") + level.name, "sky", card);
			var head = UI.el("div", "el-head", card);
			var title = titleFor(level, result), innerW = (portrait ? UI.w - 32 : 600) - 50;
			var tScale = 5;
			while(tScale > 2 && UI.pxWidth(title, tScale) > innerW) tScale--;
			head.appendChild(UI.px(title, tScale));
			UI.el("div", "el-sub", card, hintFor(level, steps, result));

			var stats = UI.el("div", "el-stats", card);
			var sb = UI.el("div", "gs-steps el-steps", stats);
			UI.el("span", "num", sb, steps === null ? "–" : String(steps));
			UI.el("span", "lbl", sb, steps === 1 ? "step" : "steps");
			if(st.best > result) UI.el("span", "best", sb, "Best: " + st.best + " of 3 parts");
			stats.appendChild(partsRow(level, result, animate));

			var fr = UI.el("div", "el-freed", card);
			var frTop = UI.el("div", "el-freed-top", fr);
			var lbl = UI.el("span", "el-freed-lbl", frTop);
			if(freedNow >= total) UI.el("b", "", lbl, "All " + total + " robots freed!");
			else {
				UI.el("b", "", lbl, freedNow + " / " + total);
				lbl.appendChild(document.createTextNode(" robots freed"));
			}
			var gained = freedNow - freedBefore;
			if(gained > 0) UI.el("span", "el-gain", frTop, "+" + gained + (gained === 1 ? " new friend" : " new friends"));
			var bar = UI.el("div", "tb-bar el-bar", fr);
			var fill = UI.el("i", "", bar);
			fill.style.width = Math.round(100 * (animate ? freedBefore : freedNow) / total) + "%";
			if(animate) timers.push(setTimeout(function() { fill.style.width = Math.round(100 * freedNow / total) + "%"; }, 350));

			var acts = UI.el("div", "el-actions", card);
			var next = EL.nextLevel(level);
			var close = function() { m.close(); };
			var backBtn = UI.button({ icon: "back", iconScale: 2, label: "Back to board", cls: "el-back", onClick: close }, acts);
			var selBtn = UI.button({ icon: "levels", iconScale: 2, label: "Level select", cls: "sky el-sel", onClick: function() {
				Q.clearStages();
				Q.stageScene("level selector");
			} }, acts);
			var nextBtn = null;
			if(next) {
				nextBtn = UI.button({ label: "Next level", icon: "start", iconScale: 3, cls: "tomato big el-next", title: "Next level: " + next.name, onClick: function() {
					goLevel(Q, next);
				} });
				if(portrait) acts.insertBefore(nextBtn, acts.firstChild);
				else acts.appendChild(nextBtn);
				nextBtn.setAttribute("autofocus", "");
			} else {
				selBtn.classList.add("el-primary");
				selBtn.setAttribute("autofocus", "");
			}

			// ---- layout ----
			var m = UI.openModal(root, { onClose: function() {
				if(closing) return;
				closing = true;
				if(Q.stages[2] === stage) Q.clearStage(2);
			} });
			var closing = false;
			var cardH = card.offsetHeight;
			if(portrait) {
				var W = UI.w, pad = 16, gap = 30;
				var innerW = W - 2 * pad - 6, s = innerW / LAND.w;
				var maxInner = Math.round(LAND.h * s);
				var room = UI.h - 2 * 24 - gap - cardH - 6;
				var innerH = Math.min(maxInner, Math.max(260, room));
				var used = innerH + 6 + gap + cardH;
				var top = Math.max(20, Math.round((UI.h - used) / 2));
				UI.place(frame, { x: pad, y: top, w: innerW + 6, h: innerH + 6 });
				land.el.style.transform = "scale(" + s + ") translateY(" + (-(LAND.h - innerH / s)) + "px)";
				UI.place(card, { x: pad, y: top + innerH + 6 + gap, w: W - 2 * pad });
			} else {
				var cw = 600;
				var cy = Math.max(26, 380 - cardH);
				UI.place(card, { x: (UI.w - cw) / 2, y: Math.min(26, cy), w: cw });
				var ls = Math.max(UI.w / LAND.w, UI.h / LAND.h);
				land.el.style.transform = "translateX(" + Math.round((UI.w - LAND.w * ls) / 2) + "px) scale(" + ls + ")";
			}

			// ---- sound and entrance ----
			var startEntrance = function() {
				if(land.fresh.length) {
					land.fresh.forEach(function(f) { f.el.classList.add("el-wait"); });
					revealFresh(land.el, land.fresh, timers, st.celebrate ? 250 : 700);
				}
			};
			if(animate) {
				if(st.celebrate) {
					land.fresh = buildFreshList(land.el, freedBefore, freedNow);
					land.fresh.forEach(function(f) { f.el.classList.add("el-wait"); });
					timers.push(setTimeout(function() {
						if(Q.stages[2] !== stage) return;
						celebrate(function() {
							if(Q.stages[2] !== stage) return;
							var h = land.el.querySelector(".el-main");
							if(h) { h.classList.remove("el-hop"); void h.offsetWidth; h.classList.add("el-hop"); }
							startEntrance();
							var f = root.querySelector("[autofocus]");
							if(f) setTimeout(function() { try { f.focus(); } catch(e) {} }, 0);
						});
					}, 150));
				} else {
					// 'exit' already played when the robot reached the hatch (tg-84y.7)
					startEntrance();
				}
			}

			current = { stage: stage, options: o };
			stage.on("destroyed", function() {
				timers.forEach(clearTimeout);
				if(current && current.stage === stage) current = null;
				if(closing) return;
				closing = true;
				m.close();
			});
		}, { sort: true });

		// For the celebration path the landscape is built without entrance
		// classes (so nothing animates under the popup); find the new robots.
		function buildFreshList(landEl, freedBefore, freedNow) {
			var data = t.EndLevelRobots.data, els = landEl.querySelectorAll(".el-robot"), out = [];
			for(var i = freedBefore + 1; i <= freedNow && i < els.length; i++) {
				var a = Q.asset(data[i][0]);
				out.push({ el: els[i], x: data[i][1], y: data[i][2], w: a ? a.width : 64, h: a ? a.height : 64, z: data[i][3] });
			}
			return out;
		}
	});
})();
