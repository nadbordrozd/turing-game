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

	// Draw an operator's tile centred on (cx, cy), `size` logical px wide.
	t.UI.drawTile = function(ctx, op, angle, cx, cy, size, alpha) {
		var s = Q.sheet(op.sheet);
		if(!s) return;
		ctx.save();
		if(alpha !== undefined) ctx.globalAlpha *= alpha;
		ctx.translate(cx, cy);
		ctx.rotate(-(angle || 0) * Math.PI / 2);
		ctx.scale(size / s.tilew, size / s.tileh);
		s.draw(ctx, -s.tilew / 2, -s.tileh / 2, t.UI.tileFrame(op));
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
			this.p.sheet = op.sheet;
			this.p.sprite = op.sprite;
			var s = Q.sheet(op.sheet);
			this.p.w = s.tilew; this.p.h = s.tileh;
			this.p.cx = s.tilew / 2; this.p.cy = s.tileh / 2;
			this.p.scale = this.p.pitch / s.tilew;
			this.play("default");
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
			ctx.fillStyle = "rgba(42,35,53," + this.p.alpha + ")";
			ctx.fillRect(-4000, -4000, 8000, 8000);
		}
	});
});
