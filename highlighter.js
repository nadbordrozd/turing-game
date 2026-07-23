t.highlighter = {
	currently : false,
	highlight : function(draggableTile) {
		this.currently = draggableTile;
		var tuta = t.TuringTable.display1;
		var boundary = tuta.getBoundary();
		var x = (boundary.minX+boundary.maxX)/2-30;
		var y = boundary.minY-30;
		if(draggableTile.p.operator == t.Operators.Empty) return;
		this.rotator1 = tuta.stage.insert(new Q.MyButton({sheet: "rotateCounterClockwiseButton", z: 2,
			x: x-10, y: y, scale : 0.5, onClick: function(){
				draggableTile.rotate(1);
				if(draggableTile.p.tablePosX!==undefined){
					t.TuringTable.updateTile(draggableTile.p.tablePosX,
					draggableTile.p.tablePosY, {angle: draggableTile.angle});
				}
				t.GameSaver.saveTuringTable();
			}}));
		this.rotator2 = tuta.stage.insert(new Q.MyButton({sheet: "rotateClockwiseButton", z: 2,
			x: x+50, y: y, scale : 0.5, onClick: function(){
				draggableTile.rotate(-1);
				if(draggableTile.p.tablePosX!==undefined)
					t.TuringTable.updateTile(draggableTile.p.tablePosX,
						draggableTile.p.tablePosY, {angle: draggableTile.angle});
				t.GameSaver.saveTuringTable();
			}
		}));	
		
		var options = this.currently!=undefined ? this.currently.p.operator.helperOptions||{}:{};			
		this.helper = tuta.stage.insert(new Q.MyButton({sheet: "helpButton", z: 2,
			x: x+110, y: y, scale : 0.5, onClick: function(){
				Q.stageScene("popup",4, options);
			}
		}));	
				/*
		var that = this;
		this.rotators = [];
		this.rotators.push(this.insert(new Q.MyButton({asset: "rotate.png", x: -100, y: 0, scale : 3, 
			onClick: function(){that.rotate(1);}
		})));
		this.rotators.push(this.insert(new Q.MyButton({asset: "rotate2.png", x: 100, y: 0, scale : 3,
			onClick: function(){that.rotate(-1);}
		})));
		*/
	},
	unhighlight : function(){
		if(this.currently) this.currently.unhighlight();
		this.currently = false;
		if(this.rotator1) this.rotator1.destroy();
		this.rotator1 = false;
		if(this.rotator2) this.rotator2.destroy();
		this.rotator2 = false;
		if(this.helper) this.helper.destroy();
		this.helper = false;
	}
}