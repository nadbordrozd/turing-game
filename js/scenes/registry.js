// Scene registry: every file under js/scenes/ (and js/ui/ sprite files) calls
// TuringScenes.add(function(Q){ ... }) to define its Quintus scenes or classes.
// script.js includes the "TuringScenes" module, which runs them all once the
// Quintus instance exists. Load this file before the scene files.
window.TuringScenes = {
	list: [],
	add: function(definer){ this.list.push(definer); }
};

Quintus.TuringScenes = function(Q) {
	for(var i = 0; i < TuringScenes.list.length; i++) TuringScenes.list[i](Q);
};
