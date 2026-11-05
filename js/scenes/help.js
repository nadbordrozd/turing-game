// Help overlay for the main game screen (HTML, UI kit): a callout on each part
// of the screen with the original help text. t.HelpOverlay.show() / close().
(function() {
	"use strict";
	var UI = t.UI;
	var current = null;

	t.HelpOverlay = {
		show: function() {
			if(current || !t.GameScreen.layout) return;
			var T = t.GameScreen.targets();
			var portrait = t.GameScreen.layout.mode === "portrait";
			var wrap = UI.el("div", "");
			wrap.style.position = "absolute";
			wrap.style.inset = "0";
			wrap.setAttribute("role", "dialog");
			wrap.setAttribute("aria-label", "Help");
			UI.modal.appendChild(wrap); // attached first so callouts can be measured
			var back = UI.el("div", "tb-backdrop", wrap);

			function ring(r) {
				UI.place(UI.el("div", "tb-ring", wrap), {x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12});
			}
			// a callout centred in rect r (clamped to the stage), at most maxW wide
			function callout(r, maxW, html, top) {
				var c = UI.el("div", "tb-callout", wrap);
				c.innerHTML = html;
				var w = Math.min(maxW, UI.w - 24);
				c.style.width = w + "px";
				var h = c.offsetHeight;
				var x = Math.max(12, Math.min(UI.w - 12 - w, r.x + (r.w - w) / 2));
				var y = Math.max(12, Math.min(UI.h - 12 - h, top ? r.y + 8 : r.y + (r.h - h) / 2));
				UI.place(c, {x: x, y: y});
				return c;
			}

			[T.tray, T.mat, T.cell, T.deck].forEach(ring);
			callout(T.tray, portrait ? 300 : Math.max(150, T.tray.w + 40),
				"Each of these instructions makes the robot perform a simple task - like moving or turning around. " +
				"Drag one to the CPU and press play to see the effect" +
				"<br><br><span class=\"gs-hint\">Tap <b>?</b> on a tile to see how it works.</span>");
			callout(T.mat, portrait ? 320 : Math.min(300, T.mat.w - 30),
				"This is the robot's <b>CPU</b>. Instructions that you put here will be carried out by the robot." +
				"<br><br><span class=\"gs-hint\">Tap a tile on the board to turn it. Drag it off the board (or press and hold) to remove it.</span>");
			callout(T.cell, portrait ? 300 : Math.min(260, T.cell.w - 30),
				"This is the robot's <b>cell</b>. Help him escape by programming his CPU");
			callout(T.deck, portrait ? 360 : 420,
				"These are control buttons - play, pause, next, stop, slower, faster.", portrait);

			// the header buttons, explained to their left
			var sys = T.sys.getBoundingClientRect(), a = UI.toLogical(sys.left, sys.top), z = UI.toLogical(sys.right, sys.bottom);
			var sysR = {x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y};
			ring(sysR);
			var hc = UI.el("div", "tb-callout", wrap);
			var w = portrait ? UI.w - 24 : 470;
			hc.style.width = w + "px";
			[["levels", "This button will take you back to level selection screen"],
			 ["help", "You can bring back this instruction at any time by clicking here"],
			 ["sound", "Sound effects on or off"],
			 ["music", "Music on or off"]].forEach(function(it) {
				var row = UI.el("div", "", hc);
				row.style.display = "flex"; row.style.alignItems = "center"; row.style.gap = "10px";
				row.style.margin = "2px 0";
				row.appendChild(UI.icon(it[0], 2));
				UI.el("span", "", row, it[1]);
			});
			var hy = portrait ? sysR.y + sysR.h + 14 : sysR.y + (sysR.h - hc.offsetHeight) / 2;
			UI.place(hc, {x: portrait ? 12 : sysR.x - w - 18, y: hy});

			// "Got it" and the tile guide (every tile on this tray, js/ui/tile-explainers.js)
			var row = UI.el("div", "", wrap);
			row.style.position = "absolute";
			row.style.display = "flex";
			row.style.gap = "12px";
			var tiles = UI.button({label: "Tile guide", px: 3, cls: "sky big", title: "How each tile works", onClick: function(){
				t.HelpOverlay.close();
				if(t.TileExplain) t.TileExplain.openAll();
			}}, row);
			var ok = UI.button({label: "Got it", px: 3, cls: "sun big", onClick: function(){ t.HelpOverlay.close(); }}, row);
			ok.setAttribute("autofocus", "");
			var okW = 170, tilesW = 210, rowW = okW + 12 + tilesW;
			[[ok, okW], [tiles, tilesW]].forEach(function(b){ b[0].style.height = "56px"; b[0].style.width = b[1] + "px"; });
			// centred on the gap below the header, or bottom of the stage in portrait
			UI.place(row, portrait ? {x: (UI.w - rowW) / 2, y: UI.h - 12 - 64} : {x: T.mat.x + (T.mat.w - rowW) / 2, y: T.mat.y + T.mat.h - 76});
			back.addEventListener("click", function(){ t.HelpOverlay.close(); });
			current = UI.openModal(wrap, {onClose: function(){ current = null; }});
		},
		close: function() { if(current) current.close(); }
	};
	UI.on("screenclear", function(){ current = null; });
})();
