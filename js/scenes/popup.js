// Generic popup on stage 4: a Toybox card drawn in the canvas, because its
// content (each tile's animated helper from Operators.js helperOptions.set)
// is made of canvas sprites. The title tag and close button are HTML on top.
// Q.stageScene("popup", 4, {set: function(container){...}, title: "..."}).
TuringScenes.add(function(Q) {
	var UI = t.UI, INK = "#2a2335";
	UI.scene("popup", {responsive: true});

	Q.scene("popup", function(stage) {
		Q.touch(Q.SPRITE_UI, [4]);
		stage.insert(new Q.Dimmer({alpha: 0.55}));
		var container = stage.insert(new Q.ToyCard({x: 0, y: 0, z: 1}));
		if(stage.options.set) stage.options.set(container);
		// Toybox type for the helper's captions
		for(var i = 0; i < container.children.length; i++) {
			var c = container.children[i];
			if(c instanceof Q.UI.Text && !(c instanceof Q.Counter)) {
				c.p.color = INK;
				c.p.family = '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
				c.p.weight = "700";
				c.fontString = null;
				c.calcSize();
			}
		}
		container.fit(34, 30);
		var p = container.p;
		var s = Math.min(1, (UI.w - 40) / p.w, (UI.h - 60) / p.h);
		p.scale = s;
		p.x = UI.w / 2 - (p.w / 2 - p.cx) * s;
		p.y = UI.h / 2 - (p.h / 2 - p.cy) * s;
		var left = UI.w / 2 - p.w * s / 2, top = UI.h / 2 - p.h * s / 2;

		// HTML chrome: title tag and close button over the card's corners
		var chrome = UI.el("div", "");
		chrome.style.position = "absolute";
		chrome.style.inset = "0";
		chrome.setAttribute("role", "dialog");
		chrome.setAttribute("aria-label", stage.options.title || "Help");
		if(stage.options.title) {
			var tag = UI.tag(stage.options.title, "sky", chrome);
			tag.style.left = (left + 18) + "px";
			tag.style.top = (top - 15) + "px";
		}
		var closing = false;
		var m;
		var close = UI.button({icon: "close", iconScale: 2, cls: "sm round tomato", title: "Close", onClick: function(){ m.close(); }}, chrome);
		close.style.position = "absolute";
		close.style.left = (left + p.w * s - 28) + "px";
		close.style.top = (top - 18) + "px";
		m = UI.openModal(chrome, {onClose: function(){
			if(closing) return;
			closing = true;
			if(Q.stages[4] === stage) Q.clearStage(4);
		}});
		stage.on("destroyed", function(){
			if(closing) return;
			closing = true;
			m.close();
		});
	});
});
