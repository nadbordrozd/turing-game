// Look chooser (epic tg-wtv): the first screen on first launch, before the
// intro (the intro differs per skin), and the target of the "Look" buttons on
// the level selector and About. Two big cards, "Retro hacker chic" and
// "Toybox", each with a small CSS-drawn preview of the game screen in its own
// colours. Arrow keys move between the cards, Enter or Space picks one,
// Escape goes back when the screen was opened from a Look button.
//
//   Q.stageScene("skin chooser", 0, {back: "level selector"})
//
// Picking the current look just goes on (first launch: the intro; from a Look
// button: back); picking the other one saves it and reloads the page
// (t.Skin.set), landing on the screen it came from.
TuringScenes.add(function(Q) {
	var UI = t.UI;
	var CARDS = [
		{ id: "retro", name: "Retro hacker chic", blurb: "Green phosphor on black, like it's 1983. The original look, rebooted." },
		{ id: "toybox", name: "Toybox", blurb: "Bright, chunky and friendly, like a box of toys." }
	];
	var active = null; // {back} while the chooser is up

	function leave(to) {
		active = null;
		Q.clearStages();
		Q.stageScene(to || "intro");
	}
	function pick(id, back) {
		if(t.Skin.set(id, { returnTo: back || "intro" })) return; // reloading into the new look
		leave(back || "intro");
	}

	UI.on("screenclear", function() { active = null; });
	document.addEventListener("keydown", function(e) {
		if(!active || UI.modalOpen()) return;
		if(e.key === "Escape" && active.back) { e.preventDefault(); UI.sfx("click"); leave(active.back); return; }
		if(e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
			var cards = active.cards, i = cards.indexOf(document.activeElement);
			var d = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
			e.preventDefault();
			cards[i < 0 ? 0 : (i + d + cards.length) % cards.length].focus();
		}
	});

	// A miniature of the game screen: header, tile tray, board, robot cell, deck.
	function preview(parent) {
		var p = UI.el("div", "sk-pv", parent);
		p.setAttribute("aria-hidden", "true");
		var hdr = UI.el("div", "sk-pv-hdr", p);
		UI.el("i", "sk-pv-badge", hdr);
		UI.el("i", "sk-pv-line", hdr);
		UI.el("i", "sk-pv-line short", hdr);
		var tray = UI.el("div", "sk-pv-tray", p);
		for(var i = 0; i < 6; i++) UI.el("i", "sk-pv-tile", tray);
		var mat = UI.el("div", "sk-pv-mat", p);
		var board = UI.el("div", "sk-pv-board", mat);
		[[1, 3, "e"], [2, 3, "e"], [3, 3, "n"], [3, 2, "w"], [2, 2, "w"]].forEach(function(c) {
			var b = UI.el("i", "sk-pv-belt " + c[2], board);
			b.style.left = (c[0] * 16.66) + "%"; b.style.top = (c[1] * 16.66) + "%";
		});
		UI.el("i", "sk-pv-marker", board);
		var cell = UI.el("div", "sk-pv-cell", p);
		var win = UI.el("div", "sk-pv-win", cell);
		UI.el("i", "sk-pv-robot", win);
		var dials = UI.el("div", "sk-pv-dials", cell);
		UI.el("i", "sk-pv-dial red", dials);
		UI.el("i", "sk-pv-dial blue", dials);
		var deck = UI.el("div", "sk-pv-deck", p);
		UI.el("i", "sk-pv-run", deck);
		for(var j = 0; j < 3; j++) UI.el("i", "sk-pv-key", deck);
		return p;
	}

	UI.scene("skin chooser", { responsive: true });
	Q.scene("skin chooser", function(stage) {
		var o = stage.options || {};
		var portrait = UI.mode === "portrait";
		var root = UI.el("div", "sk-root " + (portrait ? "sk-portrait" : "sk-landscape"), UI.over);
		var head = UI.el("div", "sk-head", root);
		if(o.back) {
			UI.button({ icon: "back", iconScale: 3, label: portrait ? null : "Back", cls: (portrait ? "sm " : "") + "sky sk-back",
				title: "Back without changing the look", onClick: function() { leave(o.back); } }, head);
		}
		var h = UI.el("h1", "sk-title", head);
		h.appendChild(UI.px("Choose your look", portrait ? 3 : 5));
		if(o.back) UI.el("div", "sk-spacer", head);
		UI.el("p", "sk-sub", root, o.back ? "The game plays the same in both. Your progress stays."
			: "Same game, two looks. You can switch any time from the level map or About.");

		var row = UI.el("div", "sk-cards", root);
		row.setAttribute("role", "group");
		row.setAttribute("aria-label", "Looks");
		var cards = [];
		CARDS.forEach(function(c) {
			var b = UI.el("button", "sk-card sk-" + c.id, row);
			b.type = "button";
			b.setAttribute("aria-label", c.name + (t.Skin.chosen && t.Skin.id === c.id ? " (current look)" : ""));
			preview(b);
			var txt = UI.el("span", "sk-text", b);
			UI.el("span", "sk-name", txt).appendChild(UI.px(c.name, portrait ? 3 : 3));
			UI.el("span", "sk-blurb", txt, c.blurb);
			var go = UI.el("span", "sk-go", txt);
			go.appendChild(UI.px(t.Skin.chosen && t.Skin.id === c.id ? "Current look" : "Pick this", 2));
			if(t.Skin.chosen && t.Skin.id === c.id) b.classList.add("sk-current");
			b.addEventListener("click", function() { UI.sfx("click"); pick(c.id, o.back); });
			cards.push(b);
		});

		// grow the screen (letterboxed) if the content needs more room
		var need = root.scrollHeight;
		if(need > UI.h) UI.setSize(UI.w, need);
		active = { back: o.back || null, cards: cards };
		var first = cards[0];
		if(t.Skin.chosen) cards.forEach(function(b) { if(b.classList.contains("sk-current")) first = b; });
		setTimeout(function() { if(active && first.isConnected) try { first.focus(); } catch(e) {} }, 0);
	});
});
