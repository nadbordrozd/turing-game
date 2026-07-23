t.Animator = {
	robomations : t.Queue.create(),
	turingmations : t.Queue.create(),
	noAnimation : false,
	pushRobomation : function(robomation){
		if(this.noAnimation) return;
		this.robomations.push(robomation);
	},
	
	pushTuringmation : function(turingmation){
		if(this.noAnimation) return;
		this.turingmations.push(turingmation);
	},
	
	robomationinprogress : false,
	turingmationinprogress : false,
	robomationended : function(){
		t.Animator.robomationinprogress = false;
		if(!t.Animator.turingmationinprogress) t.Animator.step();
	},
	turingmationended : function(){
		t.Animator.turingmationinprogress = false;
		if(!t.Animator.robomationinprogress) t.Animator.step();
	},
	
	step : function(){
		if(this.robomations.hasNext())
			t.RobotTable.animate(this.robomations.pop(), 1000, this.robomationended);
			
		if(this.turingmations.hasNext())
			t.TuringTable.animate(this.turingmations.pop(), 1000, this.turingmationended);
		
	},
	trueSlowness : 32,
	slowness: 32,
	faster: function(){
		if(t.Animator.slowness>1) t.Animator.slowness /= 2;
	},
	slower: function(){
		if(t.Animator.slowness<128) t.Animator.slowness *=2;
	},
	play : function(){
		var robotion = undefined;
		var turingation = undefined;
		var hmany =0;
		var aux = function(){
			if(hmany===0){
				if(t.Animator.robomations.hasNext()){
					robotion = t.Animator.robomations.pop();
					turingation = t.Animator.turingmations.pop();
				} else return;
			} 

			t.RobotTable.animate(robotion, t.Animator.trueSlowness, hmany===0);
			t.TuringTable.animate(turingation, t.Animator.trueSlowness);
			hmany++;
			if(hmany===t.Animator.trueSlowness) {
				t.Animator.trueSlowness = t.Animator.slowness; 
				hmany =0; 
				if(robotion.win) {alert("Profit!"); return;} 
				if(robotion.electrocuted) {alert("Electrocuted much?"); return;}
				if(robotion.burned) {alert("you just stepped into a stream of lava. guess what happens next"); return;}
				if(robotion.drowned) {alert("rust in peace"); return;}
			} 
			t.Animator.timeout = setTimeout(aux, 25);	
		}
		aux();
	},
	
	reset : function(){
		clearTimeout(this);
		this.robomations.empty();
		this.turingmations.empty();
	},
	
	
	
	rotateSth : function(sth, fromAngle, toAngle, time, callback){
		console.log("do tego dosz³o");
		console.log(sth);
		console.log(fromAngle);
		console.log(toAngle);
		console.log(time);
		
		
		var intervals = time/25;
		var increment = (toAngle - fromAngle)/intervals;
		var intervalnumber=1;
		var aux = function(){
			fromAngle+=increment;
			intervalnumber++;
			sth.css({
				'-moz-transform':'rotate('+fromAngle+'deg)',
				'-moz-transform-origin':'center center',
				'-webkit-transform':'rotate('+fromAngle+'deg)',
				'-webkit-transform-origin':'center center',
				'-o-transform':'rotate('+fromAngle+'deg)',
				'-ms-transform':'rotate('+fromAngle+'deg)',
				'-ms-transform-origin':'center center'
			});
			if(intervalnumber<intervals) setTimeout(aux,25);
			else {
				if(callback) callback();
				return;
			}
		}
		aux();
    },
	
}