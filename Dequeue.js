t.Dequeue = {
	length : 0,
	first : undefined,
	last : undefined, 
	isEmpty : function(){ return this.length===0;},		//public
	
	addFirst : function(item){		//public 
		//console.log('addFirst');
		if(this.length===0) return this.addToEmpty(item); else {
			this.length++;
			var aux = { "item" : item, next : this.first};
			this.first.previous = aux;
			this.first = aux;
		}
	},
	addLast : function(item){				//public 
//	console.log('addLast');
		if(this.length===0) return this.addToEmpty(item); else {
			this.length++;
			var aux = { "item" : item, 'previous': this.last};
			this.last.next = aux;
			this.last = aux;
		}
	},
	empty : function(){
	//console.log('empty');
		this.length = 0;
		this.first = undefined;
		this.last = undefined;
	},
	peekFirst : function(){				
		return this.first.item;
	},
	peekLast : function(){
		return this.last.item;
	},
	pollFirst : function(){		//if no elems throws error
		//console.log('pollFirst');
		var first = this.first;
		if(this.length===1) {
			this.empty();
			return first.item;
		}
		this.length--;
		this.first = first.next;
		first.next.previous = undefined;
		return first.item;
	},
	pollLast : function(){		//if no elems throws error
//	console.log('pollLast');
		var last = this.last;
		if(this.length===1){
			this.empty();
			return last.item;
		}
		this.length--;
		this.last=last.previous;
		last.previous.next = undefined;
		return last.item;
	},
	addToEmpty : function(item){		
		var aux = { "item" : item, next: undefined, previous: undefined};
		this.first = aux;
		this.last = aux;
		this.length = 1;
	},
	create : function(){				//public
		var aux = Object.create(t.Dequeue);
		return aux;
	}
}