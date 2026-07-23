t.Queue = {
	length : 0,
	latest : undefined,
	first : undefined,
	hasNext : function(){
		return (this.length>0);
	},
	
	pop : function(){
		if(this.length<=0) throw "cannot pop from an empty queue";
		var aux = this.first.item;
		this.first = this.first.next;
		this.length--;
		return aux;
	},
	push : function(item){
		var aux = {"item" : item, next : undefined};
		if(this.length===0){
			this.first = aux;
		} else {
			this.latest.next = aux;
		}
		this.latest = aux;
		this.length++;
	},
	
	empty : function(){
		this.length = 0;
		this.latest = undefined;
		this.first = undefined;
	},
	
	create : function(){
		var aux = Object.create(t.Queue);
		return aux;
	}
}