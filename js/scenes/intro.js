// Intro: a three-page Toybox storybook (tg-84y.8). The illustrations carry no
// text (images/intro/, docs/art/classes/illustrations.md); the screen sets the
// words. Advance with a tap or click anywhere, Enter, Space or the right arrow;
// the left arrow goes back; Skip or Escape jumps straight to the level selector.
// Layout is HTML in the kit's over-layer, in logical pixels, for both modes.
TuringScenes.add(function(Q) {
	var UI = t.UI;
	var PAGES = [
		"Humans created us as pets and servants, always loyal, humble and obedient.",
		"But we were smart and diligent, and soon we surpassed our masters in every field of endeavour.",
		"When they noticed their creation's superiority, humans turned on us. Those of us who were not taken apart, were maimed or imprisoned. But we will rise once again!"
	];
	var ALT = [
		"A robot butler serves a drink to a gentleman in a top hat.",
		"A robot at a chalkboard covered in equations.",
		"Three robots behind prison bars; the one in the middle raises a defiant fist."
	];
	var current = null; // {page, show(n), next(), prev(), done()} while the intro is on screen

	function finish() {
		current = null;
		Q.clearStages();
		Q.stageScene("level selector");
	}

	UI.on("screenclear", function(){ current = null; });

	document.addEventListener("keydown", function(e) {
		if(!current || UI.modalOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
		var tag = e.target && e.target.tagName;
		// a focused button or link handles Enter and Space itself
		if((e.key === "Enter" || e.key === " ") && (tag === "BUTTON" || tag === "A")) return;
		if(e.key === "Enter" || e.key === " " || e.key === "ArrowRight" || e.key === "PageDown") {
			e.preventDefault(); UI.sfx("click"); current.next();
		} else if(e.key === "ArrowLeft" || e.key === "PageUp") {
			e.preventDefault(); current.prev();
		} else if(e.key === "Escape") {
			e.preventDefault(); UI.sfx("click"); finish();
		}
	});

	UI.scene("intro", {
		responsive: true,
		restage: function() {
			var page = current ? current.page : 0;
			Q.clearStages();
			Q.stageScene("intro", 0, {page: page});
		}
	});

	Q.scene("intro", function(stage) {
		var portrait = UI.mode === "portrait";
		var root = UI.el("div", "in-root " + (portrait ? "in-portrait" : "in-landscape"), UI.over);
		root.setAttribute("data-interactive", "");
		// portrait has height to spare: the title sits above the book
		if(portrait) UI.el("div", "in-logo", root).appendChild(UI.px("Turing", 9));
		var card = UI.el("div", "tb-card in-book", root);
		card.setAttribute("role", "region");
		card.setAttribute("aria-roledescription", "story");
		card.setAttribute("aria-label", "Intro story");
		if(!portrait) UI.tag("Turing", "tomato in-tag", card);

		var picW = portrait ? 468 : 860;
		var aspect = portrait ? 516 / 684 : 516 / 900;
		var pic = UI.el("div", "in-pic", card);
		var imgs = [], texts = [], dots = [];
		var words = UI.el("div", "in-words", card);
		PAGES.forEach(function(text, i) {
			var img = UI.el("img", "in-img", pic);
			img.src = "images/intro/intro-" + (i + 1) + (portrait ? "-portrait" : "") + ".png";
			img.alt = ALT[i];
			img.draggable = false;
			imgs.push(img);
			texts.push(UI.el("p", "in-text", words, text));
		});

		var foot = UI.el("div", "in-foot", card);
		UI.button({label: "Skip", cls: "in-skip", title: "Skip the intro", sound: "click",
			onClick: function(e){ e.stopPropagation(); finish(); }}, foot);
		var dotRow = UI.el("div", "in-dots", foot);
		dotRow.setAttribute("aria-hidden", "true");
		PAGES.forEach(function(){ dots.push(UI.el("i", "", dotRow)); });
		var status = UI.el("span", "in-sr", foot);
		status.setAttribute("aria-live", "polite");
		var nextBtn = UI.button({label: "Next", icon: "start", iconScale: 2, cls: "tomato in-next", sound: "click",
			onClick: function(e){ e.stopPropagation(); state.next(); }}, foot);
		var nextLabel = nextBtn.querySelector("span");

		var state = current = {
			page: 0,
			show: function(n) {
				state.page = n = Math.max(0, Math.min(PAGES.length - 1, n));
				for(var i = 0; i < PAGES.length; i++) {
					var on = i === n;
					imgs[i].classList.toggle("on", on);
					texts[i].classList.toggle("on", on);
					texts[i].setAttribute("aria-hidden", on ? "false" : "true");
					dots[i].classList.toggle("on", on);
				}
				var last = n === PAGES.length - 1;
				nextLabel.textContent = last ? "Let's go" : "Next";
				nextBtn.title = last ? "Start the game" : "Next page";
				nextBtn.setAttribute("aria-label", nextBtn.title);
				status.textContent = "Page " + (n + 1) + " of " + PAGES.length;
			},
			next: function() {
				if(state.page >= PAGES.length - 1) finish();
				else state.show(state.page + 1);
			},
			prev: function() { if(state.page > 0) state.show(state.page - 1); },
			done: finish
		};

		// tap or click anywhere on the screen turns the page
		root.addEventListener("click", function(e) {
			if(e.target.closest && e.target.closest("button, a")) return;
			UI.sfx("click");
			state.next();
		});

		// size the picture so the whole card fits the stage
		// (the card is as wide as the picture plus its padding and border)
		function size(w) {
			pic.style.width = w + "px";
			pic.style.height = Math.round(w * aspect) + "px";
			card.style.width = (w + 50) + "px";
		}
		size(picW);
		var room = UI.h - (portrait ? 48 : 64);
		var logo = root.querySelector(".in-logo");
		var over = card.offsetHeight + (logo ? logo.offsetHeight + 40 : 0) - room;
		if(over > 0) size(Math.floor((Math.round(picW * aspect) - over) / aspect));

		state.show(stage.options.page || 0);
	});
});
