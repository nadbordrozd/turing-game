

//init function to be called after Quintus instance is created
;Quintus.TuringSprites = function(Q) {
// Looping tile animations read their frame from one shared clock instead of
// the time since each tile was created, so neighbouring belts stay in phase.
// Quintus' anim step adds dt twice, so a frame lasts rate/2 s; keep that speed.
Q.syncTileAnimation = function(){
	var p = this.p;
	var anim = p.animation && Q.animation(p.sprite, p.animation);
	if(!anim || !anim.rate || anim.loop === false || anim.next) return;
	var i = Math.floor(Date.now() / (500 * anim.rate)) % anim.frames.length;
	p.animationFrame = i;
	p.frame = anim.frames[i];
};

// Drawing for the robot's bump and sense effects (PlayerRobo.draw). Every
// function draws in the robot's own frame (origin at the sprite centre, +y
// towards the feet = the way the robot faces on the board) at progress k in
// 0..1 of the effect. Eye centres are measured on robot-cell frame 0.
Q.RoboFx = {
	ink : t.Skin.rgb("casing"),		//skin palette (js/skin.js tokens, css/toybox.css)
	sun : t.Skin.rgb("sun"),
	spark : t.Skin.rgb("fxSpark"),
	lineArt : !!t.Skin.token("lineArt"),	//retro: phosphor line art instead of toy fills
	colours : {wall : t.Skin.rgb("fxWall"), clear : t.Skin.rgb("fxClear"), magic : t.Skin.rgb("fxMagic"), plain : t.Skin.rgb("fxPlain")},
	eyes : [[-4, -5.5], [4, -5.5]],
	rgba : function(c, a){ return "rgba(" + c + "," + a + ")"; },
	envelope : function(k, rise, fall){		//0 -> 1 by `rise`, hold, 1 -> 0 from `fall`
		if(k < rise) return k/rise;
		if(k > fall) return Math.max(0, (1-k)/(1-fall));
		return 1;
	},
	senseColour : function(s){
		if(s.kind === 'magic') return s.result ? this.colours.magic : this.colours.plain;
		return s.result ? this.colours.wall : this.colours.clear;
	},
	// The program counter marker (Q.Spark, tile explainers): cream halo,
	// sunny four-point star with an ink outline, centred on the origin.
	// Retro draws a phosphor reticle instead (drawReticle).
	drawMarker : function(ctx, size){
		var S = t.Skin;
		if(this.lineArt) return this.drawReticle(ctx, size);
		var pulse = 0.5+0.5*Math.sin(Date.now()/1000*2*Math.PI*1.1);
		var halo = size*(0.27+0.03*pulse);
		ctx.beginPath();
		ctx.arc(0, 0, halo, 0, 2*Math.PI);
		ctx.fillStyle = S.color("markerHalo");
		ctx.fill();
		ctx.lineWidth = 2.5;
		ctx.strokeStyle = S.color("markerLine");
		ctx.stroke();
		var R = size*0.22, r = size*0.085, i, th, rr;
		ctx.beginPath();
		for(i = 0; i < 8; i++){
			th = i*Math.PI/4; rr = i%2 ? r : R;
			ctx.lineTo(Math.sin(th)*rr, -Math.cos(th)*rr);
		}
		ctx.closePath();
		ctx.fillStyle = S.color("markerStar");
		ctx.fill();
		ctx.lineWidth = 2;
		ctx.lineJoin = "round";
		ctx.strokeStyle = S.color("markerStarLine");
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(0, 0, size*0.04, 0, 2*Math.PI);
		ctx.fillStyle = S.color("markerDot");
		ctx.fill();
	},
	// Retro program counter: a dark disc so it reads on any tile, a hot
	// white-yellow ring that breathes (the brightest thing on the board),
	// four yellow crosshair ticks (they turn with the sprite) and a white
	// centre dot. Line art, no filled star.
	drawReticle : function(ctx, size){
		var S = t.Skin;
		var pulse = 0.5+0.5*Math.sin(Date.now()/1000*2*Math.PI*1.1);
		var R = size*(0.27+0.03*pulse), i, th, c, sn;
		ctx.save();
		ctx.beginPath();
		ctx.arc(0, 0, R, 0, 2*Math.PI);
		ctx.fillStyle = S.color("markerHalo");
		ctx.fill();
		ctx.shadowColor = S.color("markerStar");
		ctx.shadowBlur = 10;
		ctx.lineWidth = 3;
		ctx.strokeStyle = S.color("markerLine");
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(0, 0, size*0.17, 0, 2*Math.PI);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "rgba(" + S.rgb("markerLine") + ",0.6)";
		ctx.stroke();
		ctx.lineCap = "square";
		ctx.lineWidth = 2.5;
		ctx.strokeStyle = S.color("markerStar");
		ctx.beginPath();
		for(i = 0; i < 4; i++){
			th = i*Math.PI/2; c = Math.cos(th); sn = Math.sin(th);
			ctx.moveTo(c*size*0.075, sn*size*0.075);
			ctx.lineTo(c*size*0.21, sn*size*0.21);
		}
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(0, 0, size*0.035, 0, 2*Math.PI);
		ctx.fillStyle = S.color("markerDot");
		ctx.fill();
		ctx.restore();
	},
	// lurch into the wall (0-0.3), squash against it (0.3-0.45), recoil with a
	// small backwards overshoot and settle exactly where it started (1)
	bumpPose : function(k){
		var L = 6, dy, sx = 1, sy = 1, u;
		if(k < 0.3){ u = k/0.3; dy = L*u*u; }
		else if(k < 0.45){
			u = Math.sin(Math.PI*(k-0.3)/0.15);
			dy = L; sy = 1-0.14*u; sx = 1+0.09*u;
		} else {
			u = (k-0.45)/0.55;
			dy = L*Math.cos(1.5*Math.PI*u)*Math.pow(1-u, 1.2);
		}
		return {dy : dy, sx : sx, sy : sy};
	},
	drawBumpImpact : function(ctx, k){
		if(k < 0.28 || k > 0.8) return;
		var u = (k-0.28)/0.52, grow = 0.6+0.6*Math.sqrt(u), cy = 26;
		var angles = [50, 72, 94], i, s, th, dx, dy, r0 = 13, r1 = 13+7*grow;
		ctx.save();
		ctx.globalAlpha *= 1-u*u;
		ctx.lineCap = "round";
		for(var pass = 0; pass < 2; pass++){
			ctx.strokeStyle = pass ? this.rgba(this.sun, 1) : this.rgba(this.ink, 1);
			ctx.lineWidth = pass ? 2 : 4;
			for(i = 0; i < angles.length; i++) for(s = -1; s <= 1; s += 2){
				th = angles[i]*Math.PI/180; dx = s*Math.sin(th); dy = -Math.cos(th);
				ctx.beginPath();
				ctx.moveTo(dx*r0, cy+dy*r0);
				ctx.lineTo(dx*r1, cy+dy*r1);
				ctx.stroke();
			}
		}
		//a little four-point star where the feet hit the wall
		var R = 5*grow, r = 1.6*grow;
		ctx.beginPath();
		for(i = 0; i < 8; i++){
			th = i*Math.PI/4; var rr = i%2 ? r : R;
			ctx.lineTo(Math.sin(th)*rr, cy+1-Math.cos(th)*rr);
		}
		ctx.closePath();
		if(this.lineArt){			//retro: an amber outline spark, no filled star
			ctx.fillStyle = this.rgba(this.ink, 1);
			ctx.strokeStyle = this.rgba(this.sun, 1);
			ctx.shadowColor = this.rgba(this.sun, 1);
			ctx.shadowBlur = 4;
		} else {
			ctx.fillStyle = this.rgba(this.sun, 1);
			ctx.strokeStyle = this.rgba(this.ink, 1);
		}
		ctx.lineWidth = 1.5;
		ctx.fill(); ctx.stroke();
		ctx.restore();
	},
	// a scan beam from under the robot towards the tile in front (it stops at
	// the cell edge when blocked, reaches across the next tile when clear);
	// for the magic detector a scan over the robot's own tile
	drawSenseUnder : function(ctx, k, s){
		var col = this.senseColour(s), a = this.envelope(k, 0.25, 0.75);
		var sweep = 0.5-0.5*Math.cos(2*Math.PI*Math.min(1, k/0.8)*1.5);
		if(a <= 0) return;
		ctx.save();
		ctx.globalAlpha *= a;
		if(s.kind === 'magic'){
			var h = 23;
			ctx.fillStyle = this.rgba(col, 0.22);
			ctx.fillRect(-h, -h, 2*h, 2*h);
			ctx.strokeStyle = this.rgba(col, 0.95);
			ctx.lineWidth = 2;
			ctx.strokeRect(-h, -h, 2*h, 2*h);
			var y = -h+3+(2*h-6)*sweep;
			ctx.fillStyle = this.rgba(col, 0.95);
			ctx.fillRect(-h+2, y-1, 2*h-4, 2);
		} else {
			var R = s.result ? 26 : 74;
			var grow = k < 0.3 ? 1-Math.pow(1-k/0.3, 2) : 1;
			var y0 = 6, r = y0+(R-y0)*grow, w0 = 7, w1 = Math.min(22, w0+(r-y0)*0.4);
			ctx.beginPath();
			ctx.moveTo(-w0, y0); ctx.lineTo(w0, y0); ctx.lineTo(w1, r); ctx.lineTo(-w1, r);
			ctx.closePath();
			ctx.fillStyle = this.rgba(col, 0.3);
			ctx.fill();
			ctx.strokeStyle = this.rgba(col, 0.75);
			ctx.lineWidth = 1.5;
			ctx.stroke();
			var sy = y0+(r-y0)*sweep, sw = w0+(w1-w0)*sweep;
			ctx.fillStyle = this.rgba(col, 0.95);
			ctx.fillRect(-sw, sy-1, 2*sw, 2);
		}
		ctx.restore();
	},
	// eyes light up in the result colour, plus a mark where the beam ends
	drawSenseOver : function(ctx, k, s){
		var col = this.senseColour(s), a = this.envelope(k, 0.12, 0.75), i;
		if(a <= 0) return;
		ctx.save();
		ctx.globalAlpha *= a;
		for(i = 0; i < this.eyes.length; i++){
			var ex = this.eyes[i][0], ey = this.eyes[i][1];
			var g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 7);
			g.addColorStop(0, this.rgba(col, 0.8));
			g.addColorStop(1, this.rgba(col, 0));
			ctx.fillStyle = g;
			ctx.fillRect(ex-7, ey-7, 14, 14);
			ctx.fillStyle = this.rgba(col, 1);
			ctx.fillRect(ex-2, ey-2.5, 4, 5);
			ctx.fillStyle = this.rgba(this.spark, 0.95);
			ctx.fillRect(ex-1, ey-1, 2, 2);
		}
		if(s.kind !== 'magic' && k > 0.3){
			var m = Math.min(1, (k-0.3)/0.1);
			if(s.result){				//blocked: a bar on the edge it hit
				ctx.fillStyle = this.rgba(this.ink, 1);
				ctx.fillRect(-20*m-1, 23, 40*m+2, 6);
				ctx.fillStyle = this.rgba(col, 1);
				ctx.fillRect(-20*m, 24, 40*m, 4);
			} else {					//clear: a ring on the tile ahead
				ctx.lineWidth = 3.5;
				ctx.strokeStyle = this.rgba(this.ink, 1);
				ctx.beginPath(); ctx.arc(0, 52, 4+3*m, 0, 2*Math.PI); ctx.stroke();
				ctx.lineWidth = 2;
				ctx.strokeStyle = this.rgba(col, 1);
				ctx.beginPath(); ctx.arc(0, 52, 4+3*m, 0, 2*Math.PI); ctx.stroke();
			}
		}
		ctx.restore();
	}
};
Q.Sprite.extend("Rectangle",{
  init: function(p) {
    this._super(p,{
      color: "rgb(0,0,0)",
      w: 50,
      h: 50,
	  z: 1
    });
  },
  kolo : function(r,g,b){ this.p.color = 'rgb('+r+","+g+","+b+")"; },  //TODO wywalic

  draw: function(ctx) {
  muka = ctx;
    ctx.fillStyle =  this.p.color;
	// Draw a filled rectangle centered at
    // 0,0 (i.e. from -w/2,-h2 to w/2, h/2
    ctx.fillRect(-this.p.cx,
                 -this.p.cy,
                 this.p.w,
                 this.p.h);
  },
  getBoundary: function(){
	return {minX : this.p.x-this.p.w/2, maxX : this.p.x+this.p.w/2, 
		minY : this.p.y-this.p.h/2, maxY : this.p.y+this.p.h/2};
  }
});

Q.Sprite.extend("RobotTableTile", {
	init: function(p) {
		this._super(p, {
			color: "red",
			w: 50, 
			h: 50,
			angle : 90//,
		});
		
		this.add("animation");
		//this.play("default");
		//console.log(p);
		//this.angle = p.rotationAngle;
		//this.p.angle = this.angle*90;
		this.on("finished", this, "finishedCallback");
    },
	finishedCallback : function(){
		if(this.postAnimationCallback) this.postAnimationCallback();
	},
	// A cell never moves, so it is drawn on whole device pixels (tg-iex): the
	// window is scaled by worldScale x the canvas' device-pixel scale, and a
	// cell edge inside a device pixel blends with the dark gap, a soft line on
	// one side of the cell. Children (resistor dots) set their own transform.
	draw : function(ctx){
		var p = this.p;
		ctx.save();
		if(t.UI && t.UI.snapToPixels) t.UI.snapToPixels(ctx, Math.floor(-p.cx), Math.floor(-p.cy), p.w, p.h);
		this._super(ctx);
		ctx.restore();
	},
	playAnimation : function(animation, callback){
		this.postAnimationCallback = callback;
		this.play(animation);
	},
	setAngle : function(angle){
		this.p.angle = -90*angle;
	},
	addDot : function(){
		if(this.dot) return;
		var resistor = t.utils.random(["resistor1.png", "resistor2.png", "resistor3.png", 'resistor4.png','resistor5.png']);
		this.dot = this.stage.insert(new Q.Sprite({x: 0, y: 0, asset: resistor}), this);
	},
	removeDot : function(callback){
		if(!this.dot) {if(callback) callback(); return;};
		this.dot.destroy();
		this.dot = false;
		if(callback) callback();
		
	}
});

Q.UI.Button.extend("MyButton", {
	init: function(p){
		this._super(p);
		this.on("click");
	},
	click: function(){
		this.p.onClick();
	}
});


// Board and tray tiles are Q.ProgTile (js/ui/tiles.js); placing them is t.TileInput.

// The program counter: a Toybox marker drawn in code (cream halo, sunny
// four-point star with an ink outline, slowly turning) so it reads on the
// mint board, on the red start tab and on every program tile. It replaces the
// 2012 'spark' sheet; movement and fading are unchanged.
Q.Sprite.extend("Spark",{
  init: function(p) {
    this._super(p, {
		x: 0,
		y: 0,
		w: 54,
		h: 54,
		vx: 0,
		vy: 0,
		z : 3,
		scale : 1,
		angularVel : 60
    });
	//if(this.p.asset)
	//this.p.scale = this.p.desiredHeight/this.asset().height;
	if(p.parent){
		this.p.x+=p.parent.p.x; 
		this.p.y+=p.parent.p.y;
	}
	spa = this;
  },
  //the sprite will move for time "time" with such velocity that it 
  //moves [deltaX, deltaY] then it stops and calls back
  //same with rotation. 
  //it only works if only one of deltaX deltaY deltaAngle is != 0
  move : function(deltaX, deltaY, time, callback){
	this.deltaX = deltaX;
	this.deltaY = deltaY;
	this.targetX = this.p.x + deltaX;
	this.targetY = this.p.y + deltaY;
	this.p.vx = deltaX/time;
	this.p.vy = deltaY/time;
	this.callback = callback;
	this.path = null;
  },
  // Moves along `path` ({len, at(distance) -> {x, y}}, from t.TuringTable.flowPath)
  // at constant speed for `time` seconds, then calls back once.
  follow : function(path, time, callback){
	this.deltaX = this.deltaY = false;
	this.path = path;
	this.pathT = 0;
	this.pathTime = time;
	this.callback = callback;
  },
  rotate : function(deltaAngle, time, callback){
	this.deltaAngle = deltaAngle;
	this.targetAngle = this.p.angle + deltaAngle;
	this.p.angularVel = deltaAngle/time;
	this.callback = callback;
  },
  draw : function(ctx){
	Q.RoboFx.drawMarker(ctx, this.p.desiredHeight || 54);
  },
  dieSlowly : function(callback){
	console.log('krowa krowa krowa krowa');
	this.deltaOpacity = 1;
	this.callback = callback;
  },
  step: function(dt){
 
	if(this.deltaOpacity>0 && this.p.opacity>0){
		this.p.opacity-=dt*0.5
		if(this.p.opacity<=0){
			this.p.opacity = 0;
			if(this.callback) this.callback();
			this.deltaOpacity = 0;
		}
	}
	this.p.angle += this.p.angularVel*dt;
	if(this.path){
		this.pathT += dt;
		var k = this.pathTime > 0 ? Math.min(1, this.pathT/this.pathTime) : 1;
		var pt = this.path.at(k*this.path.len);
		this.p.x = pt.x;
		this.p.y = pt.y;
		if(k >= 1){
			this.path = null;
			if(typeof this.callback === "function") this.callback();
		}
	}
	if(this.deltaX){
		this.deltaX -= this.p.vx*dt;
		if(this.deltaX*this.p.vx>0)
			this.p.x += this.p.vx*dt;
		else {
			this.p.x = this.targetX;
			this.deltaX = false;
			this.vx = 0;
			if(typeof this.callback === "function") this.callback();
		}
	}

	if(this.deltaY){
		this.deltaY -= this.p.vy*dt;
		if(this.deltaY*this.p.vy>0)
			this.p.y += this.p.vy*dt;
		else {
			this.p.y = this.targetY;
			this.deltaY = false;
			this.vy = 0;
			if(typeof this.callback === "function") this.callback();
		}
	}
  },
  
  setPos : function(x, y){
	this.path = null;
	this.p.x = x;
	this.p.y=y;
	if(this.p.parent){ this.p.x+=this.p.parent.p.x; this.p.y+=this.p.parent.p.y;}
  }
});

Q.Sprite.extend("MySprite",{
  // the init constructor is called on creation
  init: function(p) {
    // You can call the parent's constructor with this._super(..)
    this._super(p, {
		x: 0,           // You can also set additional properties that can
		y: 0,             // be overridden on object creation
		vx: 0,
		vy: 0,
		z : 3, 
		angularVel : 0
    });
	this.add("animation");
	if(this.p.asset)
	this.p.scale = this.p.desiredHeight/this.asset().height;
	else if(p.sprite){
		this.play("default");
	} 
	if(p.parent){ this.p.x+=p.parent.p.x; this.p.y+=p.parent.p.y;}
  }
 });

var PlayerRobo_baseRates = {};
Q.Sprite.extend("PlayerRobo",{
  // the init constructor is called on creation
  init: function(p) {
    // You can call the parent's constructor with this._super(..)
    this._super(p, {
		sheet: "player",  // Setting a sprite sheet sets sprite width and height
		sprite: 'playerMations',
		//sprite: 'player',
		//sheet: 'player',
		x: 0,           // You can also set additional properties that can
		y: 0,             // be overridden on object creation
		vx: 0,
		vy: 0,
		z : 3, 
		angularVel : 0
    });
	playerkurna = this;
	if(p.parent){ this.p.x+=p.parent.p.x; this.p.y+=p.parent.p.y;}
	// Death animations follow the playback speed: before the animation
	// component steps (listeners run in registration order), stretch the
	// current animation's frame rate by the speed factor. At x1 the factor is
	// 1, so the authored rates are unchanged.
	this.on("step", this, "scaleDeathRate");
	this.add("animation");
	this.on("died", this, "diedCallback");
  },
  deathRateFactor : function(){
	var f = (t.TuringTable && t.TuringTable.stepTimeFactor) || 1;
	return Math.max(1/8, Math.min(4, f));		//sane clamps: x8 .. 1/4
  },
  scaleDeathRate : function(){
	var name = this.p.animation;
	if(!name || name === "default") return;
	var anim = Q.animation(this.p.sprite, name);
	if(!anim) return;
	PlayerRobo_baseRates[name] = PlayerRobo_baseRates[name] || anim.rate;
	anim.rate = PlayerRobo_baseRates[name]*this.deathRateFactor();
  },
  diedCallback : function(){
		if(this.todoAfterDeath) this.todoAfterDeath();
  },
  move : function(deltaX, deltaY, time, callback){
	this.deltaX = deltaX;
	this.deltaY = deltaY;
	this.targetX = this.p.x + deltaX;
	this.targetY = this.p.y + deltaY;
	this.p.vx = deltaX/time;
	this.p.vy = deltaY/time;
	this.callback = callback;
  },
  electrocute : function(callback){
	this.todoAfterDeath = callback;
	this.play("toYellow"); 
  },
  drownInLava : function(callback){
	this.todoAfterDeath = callback;
	this.play("drownInLava");
  },
  drown : function(callback){
	this.todoAfterDeath = callback;
	this.play("drown");
  },
  disappear : function(callback){
	this.disappearing = true;
	this.callback = callback;
  },
  reset : function(){
	this.disappearing = false;
	this.deltaAngle = false;
	this.deltaX = false;
	this.deltaY = false;
	this.callback = false;
	this.fx = null;
	this.todoAfterDeath = null;		//a reset mid-death must not fire the old 'fail'
  },
  rotate : function(deltaAngle, time, callback){
	this.deltaAngle = deltaAngle;
	this.targetAngle = this.p.angle + deltaAngle; 
	this.p.angularVel = deltaAngle/time; 
	this.callback = callback;
  },
  // Feedback effects (bump, sense) are purely visual: they are drawn as an
  // offset/overlay in the robot's own frame and never touch p.x, p.y or
  // p.angle. In that frame the robot walks towards +y (its feet), so the tile
  // in front is centred at (0, 52) and the cell edge it bumps into is y = 26.
  // Each lasts a share of the step time, so it follows the speed controls.
  startFx : function(kind, opts, time, callback){
	this.fx = {kind : kind, opts : opts || {}, t : 0, dur : Math.max(time, 0.001), callback : callback};
  },
  wallBump : function(dir, time, callback){
	this.startFx('bump', {}, time, callback);
  },
  sense : function(sense, time, callback){
	this.startFx('sense', sense, time*0.92, callback);
  },
  stepFx : function(dt){
	var fx = this.fx;
	if(!fx) return;
	fx.t += dt;
	if(fx.t >= fx.dur){
		this.fx = null;
		if(typeof fx.callback === "function") fx.callback();
	}
  },
  draw : function(ctx){
	var fx = this.fx;
	if(!fx) { this._super(ctx); return; }
	var k = Math.min(1, fx.t/fx.dur);
	if(fx.kind === 'bump'){
		var pose = Q.RoboFx.bumpPose(k);
		ctx.save();
		ctx.translate(0, pose.dy + 21);		//squash about the feet (front edge)
		ctx.scale(pose.sx, pose.sy);
		ctx.translate(0, -21);
		this._super(ctx);
		ctx.restore();
		Q.RoboFx.drawBumpImpact(ctx, k);
	} else if(fx.kind === 'sense'){
		Q.RoboFx.drawSenseUnder(ctx, k, fx.opts);
		this._super(ctx);
		Q.RoboFx.drawSenseOver(ctx, k, fx.opts);
	} else this._super(ctx);
  },
  step: function(dt){
	this.stepFx(dt);
	if(this.disappearing){
		if(this.p.scale<=0) return;
		this.p.scale -= 0.4*dt;
		this.p.angle -= 500*dt;
		if(this.p.scale<=0) this.callback();
	}
	if(this.deltaAngle){
		this.deltaAngle -= this.p.angularVel*dt;
		if(this.deltaAngle*this.p.angularVel*dt>0) {
			this.p.angle += this.p.angularVel*dt;
		}
		else {
			this.p.angle = this.targetAngle;
			this.deltaAngle = false;
			this.p.angularVel = 0;
			if(typeof this.callback === "function") this.callback();
		}
	}
	if(this.deltaX){
		this.deltaX -= this.p.vx*dt;
		if(this.deltaX*this.p.vx>0)
			this.p.x += this.p.vx*dt;
		else {
			this.p.x = this.targetX;
			this.deltaX = false;
			this.vx = 0;
			if(typeof this.callback === "function") this.callback();
		}
	}

	if(this.deltaY){
		this.deltaY -= this.p.vy*dt;
		if(this.deltaY*this.p.vy>0)
			this.p.y += this.p.vy*dt;
		else {
			this.p.y = this.targetY;
			this.deltaY = false;
			this.vy = 0;
			if(typeof this.callback === "function") this.callback();
		}
	}
  },
  
  setPos : function(x, y){
	this.p.x = x;
	this.p.y=y;
	if(this.p.parent){ this.p.x+=this.p.parent.p.x; this.p.y+=this.p.parent.p.y;}
  },
  setAngle : function(angle){
	this.p.angle = angle;
  } 
  
});

Q.UI.Text.extend("MyText",{
	init : function(p) {
		this._super(p);
		this.p.x+=this.p.w/2;
	}
});

}



