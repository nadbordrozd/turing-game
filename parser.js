t.Parser = {
	
	getDisplay : function(){
		this.display = $("<div><pre> 1: STOP</pre></div>",{"class" : "parser"});
		this.display.addClass("parser");
		return this.display;
	},
	
	parse : function(){
		var visited = {};
		var table = t.TuringTable.table;
		var n = t.TuringTable.n;
		var empty = t.Operators.Empty;
		var right = t.Operators.ClockwiseRotator;
		var left = t.Operators.CounterClockwiseRotator;
		var move = t.Operators.Step;
		var idle = t.Operators.Conveyor;
		var fork = t.Operators.Detector;
		var pred = t.Operators.PlusRed;
		var pblue = t.Operators.PlusBlue;
		var pgreen = t.Operators.PlusGreen;
		var ppurple = t.Operators.PlusPurple;
		var pyellow = t.Operators.PlusYellow;
		var ppink = t.Operators.PlusPink;
		var magic = t.Operators.DetectMagic;
		if(n===undefined||table===undefined) throw "nie ma czego parsowaæ";
		
		var next = function(pos, angle){
			if(angle<0) angle = 4-((-angle)%4);
			else angle = angle%4;
			if(angle===0) return {"x": pos.x+1, "y":pos.y};
			if(angle===1) return {"x": pos.x, "y":pos.y-1};
			if(angle===2) return {"x": pos.x-1, "y":pos.y};
			if(angle===3) return {"x": pos.x, "y": pos.y+1};
		}
		
		
		var isValid = function(pos){
			var x = pos.x; 
			var y = pos.y;
			return (x>=0&&y>=0&&x<n&&y<n);
		}
		
		var st = function(pos){
			return pos.x+","+pos.y;
		}
		
		var ta = function(pos){
			return table[pos.x][pos.y];
		}
		
		

		var auxi = function(pos, i){
			if(i>n*n) { return "infinite"};
			if(!isValid(pos)) return empty;
			if(ta(pos).what===empty) return empty;
			if(ta(pos).what===idle) return auxi(next(pos,ta(pos).angle), i+1);
			return pos;
		}
		
		var tab = function(pos){
			var auxua=auxi(pos,0);
			return auxua;
		}
		
		var tabs = function(n){
			var ret = "";
			for(var i = 0; i<n; i++) ret+=" ";
			return ret;
		}

		var f = function(num){
			if(num<10) return " "+num; else
			if(num<100) return ""+num;
			else return num+"";
		}
		
		var nr = 1;
		//pos = {x: , y: } - wspolrzedne, ntabs - ile tabulatorów
		var parsethis = function(pos, ntabs){
			var first = tab(pos);
			if(first===empty) return f(nr++)+":"+tabs(ntabs)+"STOP<br>";
			if(first==="infinite") return f(nr++)+":"+tabs(ntabs)+"INFINITE LOOP!<br>";
			if(visited[st(first)]!==undefined) return f(nr++)+":"+tabs(ntabs)+"go to "+visited[st(first)]+"<br>";
			visited[st(first)]=nr;
			if(ta(first).what===fork){
				var ret = f(nr++)+":"+tabs(ntabs)+"if blocked then {<br>";
				var nex = next(first, ta(first).angle+1);
				ret+= parsethis(nex, ntabs+4);
				ret+=f(nr++)+":"+tabs(ntabs)+"} else {<br>";
				nex = next(first, ta(first).angle-1);
				ret+= parsethis(nex, ntabs+4);
				ret+=f(nr++)+":"+tabs(ntabs)+"}<br>";
				return ret;
			}
			
			
			if(ta(first).what===magic){
				var ret = f(nr++)+":"+tabs(ntabs)+"if on magic tile then {<br>";
				var nex = next(first, ta(first).angle+1);
				ret+= parsethis(nex, ntabs+4);
				ret+=f(nr++)+":"+tabs(ntabs)+"} else {<br>";
				nex = next(first, ta(first).angle-1);
				ret+= parsethis(nex, ntabs+4);
				ret+=f(nr++)+":"+tabs(ntabs)+"}<br>";
				return ret;
			}
			
			
			var colo = t.OperatorUtils.isDecrementer(ta(first).what);
			if(colo){
				var ret = f(nr++)+":"+tabs(ntabs)+"if "+colo+" is empty then {<br>";
				var nex = next(first, ta(first).angle+1);
				ret+= parsethis(nex, ntabs+4);
				ret+=f(nr++)+":"+tabs(ntabs)+"} else decrement "+colo+" and{<br>";
			//	ret+=f(nr++)+":"+tabs(ntabs+4)+"decrement "+colo+" {<br>";
				nex = next(first, ta(first).angle-1);
				ret+= parsethis(nex, ntabs+4);
				ret+=f(nr++)+":"+tabs(ntabs)+"}<br>";
				return ret;
			}
			
			
			var ret = f(nr++)+":"+tabs(ntabs);
			if(ta(first).what===right) ret+="turn right<br>";
			if(ta(first).what===left) ret+="turn left<br>";
			if(ta(first).what===move) ret+="step forward<br>";

			var colo = t.OperatorUtils.isIncrementer(ta(first).what);
			if(colo) ret+="increment "+colo+"<br>";
	
			return ret+parsethis(next(first, ta(first).angle), ntabs);
		}
		
		
		var retu = parsethis({x:0, y:(n-n%2)/2}, 1);
		this.display.html("<pre>"+retu+"</pre>");
		return retu;
	}
}