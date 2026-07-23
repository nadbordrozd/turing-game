t = {};

function selectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection
    ;    

    if (doc.body.createTextRange) { //ms
        range = doc.body.createTextRange();
        range.moveToElementText(text);
		
        range.select();
    } else if (window.getSelection) { //all others
		console.log("all others");
        selection = window.getSelection();        
        range = doc.createRange();

		range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
		text.focus();
}
t.utils = {};
t.utils.random = function(somearray){
	var l = somearray.length;
	return somearray[Math.floor(Math.random()*l)];
}