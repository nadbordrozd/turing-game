t.Storage = {
	ls : window.localStorage,
	setItem : function(key, value){
		this.ls.setItem(key, JSON.stringify(value));
	},
	getItem : function(key){
		var item = this.ls.getItem(key);
		if(!item) { return false};
		return this.parseResult(this.ls.getItem(key));
	},
	parseResult: function(res){
		var ret;
		try {
			ret = JSON.parse(res);
			if (ret == 'true'){
				ret = true;
			}
			if (ret == 'false'){
				ret = false;
			}
			if (parseFloat(ret) == ret){
				ret = parseFloat(ret);
			}
		} catch(e){console.error('parsing error form localStorage');}
		return ret;
	}
}


t.GameSaver = new function(){
	this.saveTableAsLevel = function(table, levelname){

		var key = levelname;
		if(!table||table.length<1){
			t.Storage.setItem(key, false);
			return;
		}
		console.log("saving turing");
		var oldTab = table;
		var newTab = [];
		for(var i in oldTab){
			newTab[i] = [];
			for(var j in oldTab[i]){
				var tile = oldTab[i][j];
				var newTile = {"what" : tile.what.name, 'angle' : tile.angle};
				newTab[i][j] = newTile;
			}
		}
		t.Storage.setItem(key, newTab);
	}
	
	this.saveTuringTable = function(){
		if(!t.Levels.currentLevel) 
			{console.error('trying to save level when no level is selected'); throw 'me'; return false;}
		var key = t.Levels.currentLevel.name;
		var oldTab = t.TuringTable.table;
		this.saveTableAsLevel(oldTab, key);
	}
	
	
	
	this.loadTuringTableForLevel = function(levelname){
		var newTab = t.Storage.getItem(levelname);
		if(!newTab) return false;
		for(var i in newTab)
			for(var j in newTab[i]){
					newTab[i][j].what = t.Operators[newTab[i][j].what];
					if(!newTab[i][j].angle) newTab[i][j].angle = 0;
					//console.log('loaded angle '+newTab[i][j].angle);
				}
		return newTab;
	}
	
	this.loadTuringTable = function(){
		if(!t.Levels.currentLevel) 
			{console.error('trying to load level when no level is selected'); return false;}
		return this.loadTuringTableForLevel(t.Levels.currentLevel.name);
	}
	
	
	this.levelToShorthand = function(levdata){
		var shorttab = [];
		for(var i in levdata){
			var col = levdata[i];
			var shortcol = [];
			for(var j in col){
				var op = col[j];
				var shortop = [op.what.shortname, op.angle];
				shortcol.push(shortop);
			}
			shorttab.push(shortcol);
		}
		return shorttab;
	}
	
	this.shorthandToLevel = function(shorthand){
		var leveldata = [];
		for(var i in shorthand){
			var shortcol = shorthand[i];
			var col = [];
			for(var j in shortcol){
				var shortop = shortcol[j];
				var op = {what : t.Operators.nameToOp[shortop[0]], angle : shortop[1]};
				col.push(op);
			}
			leveldata.push(col);
		}
		return leveldata;
	}
	

	this.loadLevelStatuses = function(){
		var statuses = {};
		for(var i in t.Levels.levels){
			statuses[i] = this.loadLevelStatus(i);
		}	
		return statuses;
	}
	this.loadLevelStatus = function(levelname){
		return t.Storage.getItem("result_"+levelname); 
	}
	this.saveLevelStatus = function(levelname, result){
		var old = this.loadLevelStatus(levelname);
		if(old&&old>=result) return; 
		t.Storage.setItem("result_"+levelname, result); 
	}
	
	this.allToString = function(){
		var all ={};
		for(var i in t.Levels.levels){
			var tab = this.loadTuringTableForLevel(i);
			var shorttab = this.levelToShorthand(tab);
			//console.log(shorttab);
			var status = this.loadLevelStatus(i);
			all[i] = [shorttab, status];
		}
		return JSON.stringify(all);
	}
	
	this.resetFromString = function(savestring){
		var everything = JSON.parse(savestring);
		for(var i in everything){
			//console.log("reseting level " +i);
			if(!everything[i]){
				this.saveTableAsLevel(false, i);
			}
			this.saveTableAsLevel(this.shorthandToLevel(everything[i][0]),i);
			this.saveLevelStatus(i, everything[i][1]);
		}
	}
	this.reset = function(){
		t.Storage.ls.clear();
	}
}()

/*
t.de = function(){
	var g = t.GameSaver;
	var lev = g.loadTuringTableForLevel('chaining');
	var shorthand = g.levelToShorthand(lev);
	var shortstring = JSON.stringify(shorthand);
	var shorthand2 = JSON.parse(shortstring);
	var lev2 = g.shorthandToLevel(shorthand2);
	console.log(JSON.stringify(lev));
	console.log();
	console.log(JSON.stringify(lev2));
}
*/