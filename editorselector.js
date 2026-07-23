t.EditorSelector = {
    selected: false,
	createSelectee: function(obstacle){
		var aux = {
			angle:0,
			container : $("<div></div>").addClass("selectee"),
			tile : t.RobotTable.styleTheTile($("<div></div>").addClass("tile"), {what:obstacle, angle: 0}),
			rotator: $('<img src=rotate.png height=20px width=20px/>')
		}
		aux.container.append(aux.tile);
		aux.container.append(aux.rotator);
		aux.tile.mousedown(function(){
			t.EditorSelector.selected = {what: obstacle, angle: aux.angle};
		});
		var wid = t.RobotTable.unitwidth;
		var inter = t.RobotTable.interval;
		aux.tile.css({"width" : wid, "height" : wid, "top" : 0, "left" : 0});
		aux.rotator.mousedown(function(){
			aux.angle+=1;
			t.TuringTable.styleTheTile(aux.tile, {what: obstacle, angle: aux.angle});
		});
		return aux;
	},
    getDisplay : function(){
       if(this.display) return this.display;

        this.display = $("<div></div>", {class : "editorselector"});
		
		for(var i in t.Obstacles){
			this.display.append(this.createSelectee(t.Obstacles[i]).container)
		}
        return this.display;
    }
}