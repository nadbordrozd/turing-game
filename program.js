
Function.prototype.method = function (name, func) {
	this.prototype[name] = func;
	return this;
};

Function.method('curry', function(){
	var slice = Array.prototype.slice, 
	args = slice.apply(arguments), 
	that = this;
	return function() {
		return that.apply(null, args.concat(slice.apply(arguments)));
	};
});

if(typeof Object.create !== 'function') {
	Object.create = function (o) {
		var F = function() {};
		F.prototype = o;
		return new F();
	}
};

//TODO szybciej
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};



/*													musia�em zakomentowac bo mi koliduje z p�tl� for(i in object)
Object.method('superior', function(name){
	var that = this,
		method = that[name];
	return function() {
		return method.apply(that.arguments);
	};
});
*/




//jeszcze nie wiem, czy to dziala tak jak bym chcial. chcialbym, zeby to umozliwialo dodawanie i zmienianie p�l obiektowi a 
// a.cascade(pole1, wartosc1).
//cascade(pole2, wartosc2).  itd
/*
Object.method('cascade', function(name, property){
		this[name] = property;
		return this;
});
*/
