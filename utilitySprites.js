

//init function to be called after Quintus instance is created
;Quintus.TuringSprites = function(Q) {
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


Q.Sprite.extend("DraggableTile", {
     init: function(p) {
       this._super(p, {sprite: p.operator.sprite, sheet: p.operator.sheet, angle: p.rotationAngle, type: Q.SPRITE_UI, z: 2});
	   this.p.scale = 0.9;

		this.beingDragged = false;
		this.parent = p.parent;
		if(p.parent) this.p.x += p.parent.p.x;
		if(p.parent) this.p.y += p.parent.p.y;
		this.originalX = this.p.x;
		this.originalY = this.p.y;
		this.add('animation');
		this.add('touch');
		if(p.operator.sprite){
			this.p.sprite = p.operator.sprite;
			this.p.sheet = p.operator.sheet;
			this.play("default");
		} 
	   this.on("drag");
       this.on("touchEnd");
	   this.on('touch', this, 'highlight');

	   this.angle = 0;
	   this.rotate(p.rotationAngle);

	   
     },
	 setOperator : function(operator){
		console.log("krowa krowa krowa");
		this.p.operator = operator;
		//this.p.asset = operator.img;
		if(operator.sprite) {
		console.log(operator.sprite+"    "+operator.sheet);
			this.p.sprite = operator.sprite;
			this.p.sheet = operator.sheet;
			this.play("default");
		}
	 },
    drag: function(touch) {
		if(!this.beingDragged) this.dragStart();
       this.p.x = touch.origX + touch.dx;
       this.p.y = touch.origY + touch.dy;
    },
	mousedown : function(){
		alert("mousedown");
	},
	click: function(touch){
		alert("clicked");
	},
	dragStart : function(){
	//	if(t.Controls.animationIsPlaying) return;
		//console.log("start dragging "+this.p.z);
		t.highlighter.unhighlight();
		if(this.toDoOnDragStart) this.toDoOnDragStart();
		this.beingDragged = true;
		this.p.z = 7;
	 },
	 rotate : function(angle){
		this.angle += angle;
		this.angle =(4+this.angle)%4;
		this.p.angle = -90*this.angle;
	 },
	 setAngle : function(angle){
		this.angle = angle;
		this.p.angle = -90*angle;
	 },
     touchEnd: function(touch) {
		console.log("touchend");
		if(!this.beingDragged) return;
		console.log('was being dragged');
		//console.log("touch end");
		//this.p.z=3;
		this.beingDragged = false;
		//for(var i in this.rotators) this.rotators[i].destroy();
		//collided = this.stage.search(this);
		//console.log((collided.obj===t.TuringTable.display1)+" fgh "+collided);
		//if(collided && collided.obj===t.TuringTable.display1)
		
		t.TuringTable.droppedTile(this.p.operator, 
			this.angle, this.getPosition());
		if(this.toDoOnDragEnd) this.toDoOnDragEnd();
		t.GameSaver.saveTuringTable();
     },
	getPosition : function(){
		return[this.p.x,this.p.y];
	},
	highlight : function(){
		
		t.highlighter.unhighlight();
		t.highlighter.highlight(this);
		this.halo = this.stage.insert(new Q.Sprite({asset: "highlight.png", 
			scale: this.p.scale, x : this.p.x, y: this.p.y, z: 3, type: Q.SPRITE_NONE}));
	},
	unhighlight : function(){
		this.halo.destroy();
		this.halo = false;
	}
	
  });
  
  Q.DraggableTile.extend("SelectorTile", {
	toDoOnDragEnd : function(touch){
		this.p.x = this.originalX;
		this.p.y = this.originalY; 
	}
  });
  
  Q.DraggableTile.extend("TuringTile", {
  	 rotate : function(angle){
		this.angle += angle;
		this.angle =(4+this.angle)%4;
		this.p.angle = -90*this.angle;
		//t.TuringTable.updateTile(this.p.tablePosX, this.p.tablePosY, {angle: this.angle});
	 },
	toDoOnDragEnd : function(touch){
		this.destroy();
	},
	toDoOnDragStart : function(touch){
		t.TuringTable.createTile(this.p.tablePosX, this.p.tablePosY, {angle : 0, what: t.Operators.Empty});
	}
  });
  
Q.Sprite.extend('ShowTile', {		//klocek do pokazywania w helperach
     init: function(p) {
       this._super(p, {sprite : p.operator.sprite, sheet : p.operator.sheet, asset: p.operator.img, angle: p.rotationAngle, type: Q.SPRITE_UI, z: 2});
	   //this.p.scale = this.p.desiredHeight/this.asset().height;
	    this.p.scale = 0.9;
		this.beingDragged = false;
		this.parent = p.parent;
		if(p.parent) this.p.x += p.parent.p.x;
		if(p.parent) this.p.y += p.parent.p.y;
		this.add('animation');
		if(p.operator.sprite){
					this.p.sprite = p.operator.sprite;
			this.p.sheet = p.operator.sheet;
			this.play("default");
		}
	   this.angle = 0;
	   this.rotate(p.rotationAngle);

	   
     },
	 setOperator : function(operator){
		this.p.operator = operator;
		this.p.asset = operator.img;
		if(operator.sprite) {
			this.p.sprite = operator.sprite;
			this.p.sheet = operator.sheet;
			this.play("default");
		}
	 },
	 rotate : function(angle){
		this.angle += angle;
		this.angle =(4+this.angle)%4;
		this.p.angle = -90*this.angle;
	 }
});

Q.Sprite.extend("Spark",{
  // the init constructor is called on creation
  init: function(p) {
    // You can call the parent's constructor with this._super(..)
    this._super(p, {
		sprite: 'sparkMations',
		sheet: 'spark',
		//asset: 'bender.png',
		x: 0,           // You can also set additional properties that can
		y: 0,             // be overridden on object creation
		vx: 0,
		vy: 0,
		z : 3, 
		scale : 0.5, 
		angularVel : 90
    });
	this.add("animation");
	this.play("default");
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
  },
  rotate : function(deltaAngle, time, callback){
	this.deltaAngle = deltaAngle;
	this.targetAngle = this.p.angle + deltaAngle; 
	this.p.angularVel = deltaAngle/time; 
	this.callback = callback;
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
	this.add("animation");
	this.on("died", this, "diedCallback");
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
  },
  rotate : function(deltaAngle, time, callback){
	this.deltaAngle = deltaAngle;
	this.targetAngle = this.p.angle + deltaAngle; 
	this.p.angularVel = deltaAngle/time; 
	this.callback = callback;
  },
  wallBump : function(dir, time, callback){
	var that = this;
	this.move(dir[0], dir[1], time/2, function(){that.move(-dir[0], -dir[1], time/2, callback)});
  },
  step: function(dt){
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

Q.UI.Text.extend("Counter", {
	init: function(p){
		if(p.number!==undefined) p.label =""+p.number;
		if(p.label===undefined) p.label = "katapulta";
		p.family = "monospace";
		this._super(p, {
			
		});
	},
	setLabel : function(label){
		this.p.label = label;
		this.p.number = undefined;
	},
	set : function(number){
	console.log("taki dostalem number nic nie poradze  "+number);
		this.p.number = number;
		this.p.label = ""+number;
		console.log("dlaczego taki kolo +  "+this.p.label);
	},
	increment : function(callback){
		this.p.number++;
		this.p.label = ""+this.p.number;
		if(callback) {console.log('a jednak callback'); callback();}
	},
	decrement : function(callback){
		this.p.number--;
		this.p.label = ""+this.p.number;
		if(callback) callback();
	}
});

Q.UI.Container.extend("CounterPanel", {
	init: function(p) {
		var colorDict = {
			"Pink" : "#FF00BA"
		}
		p.fill = "#000000";
		this._super(p, {fill: "#000000"});
		var iy = 0;
		this.counters = {};
		for(var i in p.colors){
			console.log('krowa rkowara asd as  '+this);
			var colo = colorDict[p.colors[i]]||p.colors[i];
			this.counters[p.colors[i]] = p.stage.insert(
			new Q.Counter({'x' : 10, 'y' : iy , number: 0, color: colo}), this);
			iy += 60;
		}
		this.fit(20);
		maka = this;
	},
	setCounterLabel: function(counter, label){
		this.counters[counter].setLabel(label);
	},
	set : function(color, number){
		this.counters[color].set(number);
	},
	increment: function(color, callback){
		this.counters[color].increment(callback);
	},
	decrement: function(color, callback){
		this.counters[color].decrement(callback);
	}
});
}



