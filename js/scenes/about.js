// About screen (was "credits" / "Vanity"; tg-84y.8): who made Turing, how to
// reach me, and thanks. Toybox cards in the kit's over-layer, two columns in
// landscape and one in portrait. The scene is "about"; "credits" stays as an
// alias so older callers keep working. Back or Escape returns to the levels.
TuringScenes.add(function(Q) {
	var UI = t.UI;
	var EMAIL = "nadbordrozd@gmail.com";
	var PROJECTS = "https://nadbordrozd.github.io/projects/";
	var THANKS = [
		["Pascal Rettig", ", creator of the Quintus game engine, who answered all my questions quickly and expertly."],
		["Nicholas Feinberg", ", whose brilliant Manufactoria inspired me to make Turing. Go and play it now!"],
		["The people behind robozzle.com", ", another direct inspiration."],
		["Bartek Stodulski", " of Laboratorium EE, on whose dime I worked on an early version of Turing."],
		["My wonderful wife Ola and daughter Lucy", ", without whom this game would have been finished three months earlier."]
	];
	var active = false;

	function back() {
		active = false;
		Q.clearStages();
		Q.stageScene("level selector");
	}

	UI.on("screenclear", function(){ active = false; });
	document.addEventListener("keydown", function(e) {
		if(!active || UI.modalOpen() || e.key !== "Escape") return;
		e.preventDefault(); UI.sfx("click"); back();
	});

	function para(parent, parts) {
		var p = UI.el("p", "", parent);
		parts.forEach(function(x) {
			if(typeof x === "string") p.appendChild(document.createTextNode(x));
			else p.appendChild(x);
		});
		return p;
	}
	function link(text, href, cls, newTab) {
		var a = UI.el("a", cls || "", null, text);
		a.href = href;
		if(newTab) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
		return a;
	}
	function linkButton(o, parent) {
		var a = UI.el("a", "tb-btn ab-link " + (o.cls || ""), parent);
		a.href = o.href;
		if(o.newTab) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
		UI.el("b", "", a, o.label);
		UI.el("small", "", a, o.small);
		a.addEventListener("click", function(){ UI.sfx("click"); });
		return a;
	}

	function build(stage) {
		var portrait = UI.mode === "portrait";
		var root = UI.el("div", "ab-root " + (portrait ? "ab-portrait" : "ab-landscape"), UI.over);

		var head = UI.el("div", "ab-head", root);
		UI.button({icon: "back", iconScale: 3, label: "Levels", cls: "sky ab-back", title: "Back to the levels",
			onClick: back}, head);
		var h = UI.el("h1", "ab-title", head);
		h.appendChild(UI.px("About", portrait ? 5 : 6));
		UI.el("div", "ab-spacer", head);

		// photo, caption and the two links
		var side = UI.el("div", "tb-card ab-side", root);
		UI.tag("2013", "sun", side);
		var frame = UI.el("div", "ab-photo", side);
		var img = UI.el("img", "", frame);
		img.src = versionedUrl("images/lucydesk.png");
		img.alt = "Me at my desk in 2013, working on Turing, with baby Lucy lying in front of the keyboard.";
		img.draggable = false;
		UI.el("p", "ab-caption", side, "Where it all happened: Turing on the left screen, Lucy on the desk.");
		var links = UI.el("div", "ab-links", side);
		linkButton({href: "mailto:" + EMAIL, label: "Email me", small: EMAIL, cls: "sun"}, links);
		linkButton({href: PROJECTS, label: "My other projects", small: "nadbordrozd.github.io/projects", cls: "mint", newTab: true}, links);

		// the words
		var text = UI.el("div", "tb-card ab-text", root);
		UI.tag("Hello!", "sky", text);
		para(text, ["Hi, I'm Nadbor Drozd, a physicist turned programmer with a soft spot for puzzles. ",
			"I made Turing in 2013, and in 2026 it got a fresh coat of paint with the help of Claude Opus 5.5."]);
		para(text, ["Suggestions, complaints and bug reports are all welcome: write to me at ",
			link(EMAIL, "mailto:" + EMAIL), ". I'm also always on the lookout for interesting projects in maths, physics, ",
			"machine learning, video games and education, so if you have one lying around, let me know."]);
		UI.el("h2", "", text, "Credit where credit is due. Huge thanks to:");
		var ul = UI.el("ul", "", text);
		THANKS.forEach(function(th) {
			var li = UI.el("li", "", ul);
			UI.el("b", "", li, th[0]);
			li.appendChild(document.createTextNode(th[1]));
		});

		// grow the screen (letterboxed) if the content needs more room than the window gives
		var need = root.scrollHeight;
		if(need > UI.h) UI.setSize(UI.w, need);
		active = true;
	}

	UI.scene("about", {responsive: true});
	UI.scene("credits", {responsive: true});
	Q.scene("about", build);
	Q.scene("credits", build);
});
