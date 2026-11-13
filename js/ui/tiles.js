// Canvas sprites for the Toybox game screen: program tiles on the board and in
// the tray, the interaction overlay (selection, ghost, snap highlight, dragged
// tile).
TuringScenes.add(function(Q) {
	// Current animation frame of an operator's tile, on the shared clock that
	// Q.syncTileAnimation uses, so every copy of a tile shows the same frame.
	t.UI.tileFrame = function(op) {
		var anim = op.sprite && Q.animation(op.sprite, "default");
		if(!anim) return 0;
		if(!anim.rate || anim.loop === false || anim.next) return anim.frames[0];
		return anim.frames[Math.floor(Date.now() / (500 * anim.rate)) % anim.frames.length];
	};

	// Frames in an atlas sheet (data/program-tiles.json records them).
	function sheetFrames(s) { return s.frames || s.cols * Math.max(1, Math.round(s.h / s.tileh)); }
	// Stretches the current transform by a fraction of a device pixel so the
	// w x h rect at (x, y) lands on whole device pixels (tg-oyv). The board is
	// drawn at non-integer scales (window fit x devicePixelRatio); a tile edge
	// that falls inside a device pixel is anti-aliased, and two half-covered
	// edges let the board show through as a faint line along the seam. Only
	// quarter-turn transforms are snapped; anything else is left as it is.
	function snapToPixels(ctx, x, y, w, h) {
		if(!ctx.getTransform || !window.DOMMatrix) return;
		var m = ctx.getTransform(), e = 1e-6;
		if(!((Math.abs(m.b) < e && Math.abs(m.c) < e) || (Math.abs(m.a) < e && Math.abs(m.d) < e))) return;
		var p = m.transformPoint(new DOMPoint(x, y)), q = m.transformPoint(new DOMPoint(x + w, y + h));
		var x0 = Math.min(p.x, q.x), x1 = Math.max(p.x, q.x), y0 = Math.min(p.y, q.y), y1 = Math.max(p.y, q.y);
		var X0 = Math.round(x0), X1 = Math.round(x1), Y0 = Math.round(y0), Y1 = Math.round(y1);
		if(X1 <= X0 || Y1 <= Y0) return;
		var kx = (X1 - X0) / (x1 - x0), ky = (Y1 - Y0) / (y1 - y0);
		ctx.setTransform(new DOMMatrix([kx, 0, 0, ky, X0 - kx * x0, Y0 - ky * y0]).multiply(m));
	}
	// also used by the robot window's static cells (Q.RobotTableTile, tg-iex)
	t.UI.snapToPixels = snapToPixels;

	// Draws a tile's layers at global animation frame `frame`: the belt
	// underlay, then the symbol (if any), each at frame mod its own length,
	// both on the same whole-device-pixel rect.
	t.UI.drawLayers = function(ctx, under, symbol, frame, x, y) {
		ctx.save();
		snapToPixels(ctx, Math.floor(x), Math.floor(y), under.tilew, under.tileh);
		under.draw(ctx, x, y, frame % sheetFrames(under));
		if(symbol) symbol.draw(ctx, x, y, frame % sheetFrames(symbol));
		ctx.restore();
	};

	// Draw an operator's tile centred on (cx, cy), `size` logical px wide;
	// `sheet` overrides op.sheet with the belt underlay of a join
	// (TuringTable.beltSheet); the symbol follows it (OperatorUtils.symbolSheet).
	t.UI.drawTile = function(ctx, op, angle, cx, cy, size, alpha, sheet) {
		var s = Q.sheet(sheet || op.sheet);
		if(!s) return;
		var sym = t.OperatorUtils.symbolSheet(op, sheet || op.sheet);
		ctx.save();
		if(alpha !== undefined) ctx.globalAlpha *= alpha;
		ctx.translate(cx, cy);
		ctx.rotate(-(angle || 0) * Math.PI / 2);
		ctx.scale(size / s.tilew, size / s.tileh);
		t.UI.drawLayers(ctx, s, sym && Q.sheet(sym), t.UI.tileFrame(op), -s.tilew / 2, -s.tileh / 2);
		ctx.restore();
	};

	function roundRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r);
		ctx.arcTo(x, y, x + w, y, r);
		ctx.closePath();
	}
	t.UI.roundRect = roundRect;

	// A program tile (board cell or tray slot). Board pitch contract: one tile
	// per `pitch` px with no gaps; frames are drawn at pitch / frame width
	// (scale 1 once the atlas ships 54 px frames).
	Q.Sprite.extend("ProgTile", {
		init: function(p) {
			this._super(p, { type: Q.SPRITE_NONE, z: 2, pitch: 54, rotationAngle: 0 });
			this.add("animation");
			this.on("step", this, function(){ Q.syncTileAnimation.call(this); });
			this.setOperator(this.p.operator);
			this.setAngle(this.p.rotationAngle);
		},
		setOperator: function(op) {
			this.p.operator = op;
			this.setBelt(op.sheet);
			this.p.sprite = op.sprite;
			var s = Q.sheet(op.sheet);
			this.p.w = s.tilew; this.p.h = s.tileh;
			this.p.cx = s.tilew / 2; this.p.cy = s.tileh / 2;
			this.p.scale = this.p.pitch / s.tilew;
			this.play("default");
		},
		// The belt underlay for this tile's join, and the symbol drawn over it.
		setBelt: function(sheet) {
			this.p.sheet = sheet;
			this.p.symbol = t.OperatorUtils.symbolSheet(this.p.operator, sheet);
		},
		draw: function(ctx) {
			var p = this.p, s = Q.sheet(p.sheet);
			if(!s) return;
			t.UI.drawLayers(ctx, s, p.symbol && Q.sheet(p.symbol), p.frame || 0, -p.cx, -p.cy);
		},
		setAngle: function(angle) {
			this.angle = ((angle % 4) + 4) % 4;
			this.p.angle = -90 * this.angle;
		},
		rotate: function(d) { this.setAngle(this.angle + d); }
	});

	// Draws the tile-interaction feedback from t.TileInput on top of the board.
	Q.Sprite.extend("TileOverlay", {
		init: function(p) {
			this._super(p, { type: Q.SPRITE_NONE, z: 50, x: 0, y: 0, w: 1, h: 1, cx: 0, cy: 0 });
		},
		draw: function(ctx) { if(t.TileInput) t.TileInput.drawOverlay(ctx); }
	});

	// A rectangle that fills the canvas with a translucent ink wash.
	Q.Sprite.extend("Dimmer", {
		init: function(p) {
			this._super(p, { type: Q.SPRITE_NONE, z: -100, x: 0, y: 0, w: 1, h: 1, cx: 0, cy: 0, alpha: 0.55 });
		},
		draw: function(ctx) {
			ctx.fillStyle = "rgba(" + t.Skin.rgb("dim") + "," + this.p.alpha + ")";
			ctx.fillRect(-4000, -4000, 8000, 8000);
		}
	});
});
