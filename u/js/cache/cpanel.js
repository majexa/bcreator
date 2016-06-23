var Ngn = {};
/*
---

name: Core

description: The heart of MooTools.

license: MIT-style license.

copyright: Copyright (c) 2006-2015 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
  - Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
  - Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

provides: [Core, MooTools, Type, typeOf, instanceOf, Native]

...
*/
/*! MooTools: the javascript framework. license: MIT-style license. copyright: Copyright (c) 2006-2015 [Valerio Proietti](http://mad4milk.net/).*/
(function(){

this.MooTools = {
	version: '1.6.1-dev',
	build: '%build%'
};

// typeOf, instanceOf

var typeOf = this.typeOf = function(item){
	if (item == null) return 'null';
	if (item.$family != null) return item.$family();

	if (item.nodeName){
		if (item.nodeType == 1) return 'element';
		if (item.nodeType == 3) return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
	} else if (typeof item.length == 'number'){
		if ('callee' in item) return 'arguments';
		if ('item' in item) return 'collection';
	}

	return typeof item;
};

var instanceOf = this.instanceOf = function(item, object){
	if (item == null) return false;
	var constructor = item.$constructor || item.constructor;
	while (constructor){
		if (constructor === object) return true;
		constructor = constructor.parent;
	}
	/*<ltIE8>*/
	if (!item.hasOwnProperty) return false;
	/*</ltIE8>*/
	return item instanceof object;
};

var hasOwnProperty = Object.prototype.hasOwnProperty;

/*<ltIE8>*/
var enumerables = true;
for (var i in {toString: 1}) enumerables = null;
if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];
function forEachObjectEnumberableKey(object, fn, bind){
	if (enumerables) for (var i = enumerables.length; i--;){
		var k = enumerables[i];
		// signature has key-value, so overloadSetter can directly pass the
		// method function, without swapping arguments.
		if (hasOwnProperty.call(object, k)) fn.call(bind, k, object[k]);
	}
}
/*</ltIE8>*/

// Function overloading

var Function = this.Function;

Function.prototype.overloadSetter = function(usePlural){
	var self = this;
	return function(a, b){
		if (a == null) return this;
		if (usePlural || typeof a != 'string'){
			for (var k in a) self.call(this, k, a[k]);
			/*<ltIE8>*/
			forEachObjectEnumberableKey(a, self, this);
			/*</ltIE8>*/
		} else {
			self.call(this, a, b);
		}
		return this;
	};
};

Function.prototype.overloadGetter = function(usePlural){
	var self = this;
	return function(a){
		var args, result;
		if (typeof a != 'string') args = a;
		else if (arguments.length > 1) args = arguments;
		else if (usePlural) args = [a];
		if (args){
			result = {};
			for (var i = 0; i < args.length; i++) result[args[i]] = self.call(this, args[i]);
		} else {
			result = self.call(this, a);
		}
		return result;
	};
};

Function.prototype.extend = function(key, value){
	this[key] = value;
}.overloadSetter();

Function.prototype.implement = function(key, value){
	this.prototype[key] = value;
}.overloadSetter();

// From

var slice = Array.prototype.slice;

Array.convert = function(item){
	if (item == null) return [];
	return (Type.isEnumerable(item) && typeof item != 'string') ? (typeOf(item) == 'array') ? item : slice.call(item) : [item];
};

Function.convert = function(item){
	return (typeOf(item) == 'function') ? item : function(){
		return item;
	};
};


Number.convert = function(item){
	var number = parseFloat(item);
	return isFinite(number) ? number : null;
};

String.convert = function(item){
	return item + '';
};



Function.from = Function.convert;
Number.from = Number.convert;
String.from = String.convert;

// hide, protect

Function.implement({

	hide: function(){
		this.$hidden = true;
		return this;
	},

	protect: function(){
		this.$protected = true;
		return this;
	}

});

// Type

var Type = this.Type = function(name, object){
	if (name){
		var lower = name.toLowerCase();
		var typeCheck = function(item){
			return (typeOf(item) == lower);
		};

		Type['is' + name] = typeCheck;
		if (object != null){
			object.prototype.$family = (function(){
				return lower;
			}).hide();
			
		}
	}

	if (object == null) return null;

	object.extend(this);
	object.$constructor = Type;
	object.prototype.$constructor = object;

	return object;
};

var toString = Object.prototype.toString;

Type.isEnumerable = function(item){
	return (item != null && typeof item.length == 'number' && toString.call(item) != '[object Function]' );
};

var hooks = {};

var hooksOf = function(object){
	var type = typeOf(object.prototype);
	return hooks[type] || (hooks[type] = []);
};

var implement = function(name, method){
	if (method && method.$hidden) return;

	var hooks = hooksOf(this);

	for (var i = 0; i < hooks.length; i++){
		var hook = hooks[i];
		if (typeOf(hook) == 'type') implement.call(hook, name, method);
		else hook.call(this, name, method);
	}

	var previous = this.prototype[name];
	if (previous == null || !previous.$protected) this.prototype[name] = method;

	if (this[name] == null && typeOf(method) == 'function') extend.call(this, name, function(item){
		return method.apply(item, slice.call(arguments, 1));
	});
};

var extend = function(name, method){
	if (method && method.$hidden) return;
	var previous = this[name];
	if (previous == null || !previous.$protected) this[name] = method;
};

Type.implement({

	implement: implement.overloadSetter(),

	extend: extend.overloadSetter(),

	alias: function(name, existing){
		implement.call(this, name, this.prototype[existing]);
	}.overloadSetter(),

	mirror: function(hook){
		hooksOf(this).push(hook);
		return this;
	}

});

new Type('Type', Type);

// Default Types

var force = function(name, object, methods){
	var isType = (object != Object),
		prototype = object.prototype;

	if (isType) object = new Type(name, object);

	for (var i = 0, l = methods.length; i < l; i++){
		var key = methods[i],
			generic = object[key],
			proto = prototype[key];

		if (generic) generic.protect();
		if (isType && proto) object.implement(key, proto.protect());
	}

	if (isType){
		var methodsEnumerable = prototype.propertyIsEnumerable(methods[0]);
		object.forEachMethod = function(fn){
			if (!methodsEnumerable) for (var i = 0, l = methods.length; i < l; i++){
				fn.call(prototype, prototype[methods[i]], methods[i]);
			}
			for (var key in prototype) fn.call(prototype, prototype[key], key);
		};
	}

	return force;
};

force('String', String, [
	'charAt', 'charCodeAt', 'concat', 'contains', 'indexOf', 'lastIndexOf', 'match', 'quote', 'replace', 'search',
	'slice', 'split', 'substr', 'substring', 'trim', 'toLowerCase', 'toUpperCase'
])('Array', Array, [
	'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice',
	'indexOf', 'lastIndexOf', 'filter', 'forEach', 'every', 'map', 'some', 'reduce', 'reduceRight', 'contains'
])('Number', Number, [
	'toExponential', 'toFixed', 'toLocaleString', 'toPrecision'
])('Function', Function, [
	'apply', 'call', 'bind'
])('RegExp', RegExp, [
	'exec', 'test'
])('Object', Object, [
	'create', 'defineProperty', 'defineProperties', 'keys',
	'getPrototypeOf', 'getOwnPropertyDescriptor', 'getOwnPropertyNames',
	'preventExtensions', 'isExtensible', 'seal', 'isSealed', 'freeze', 'isFrozen'
])('Date', Date, ['now']);

Object.extend = extend.overloadSetter();

Date.extend('now', function(){
	return +(new Date);
});

new Type('Boolean', Boolean);

// fixes NaN returning as Number

Number.prototype.$family = function(){
	return isFinite(this) ? 'number' : 'null';
}.hide();

// Number.random

Number.extend('random', function(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
});

// forEach, each, keys

Array.implement({

	/*<!ES5>*/
	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (i in this) fn.call(bind, this[i], i, this);
		}
	},
	/*</!ES5>*/

	each: function(fn, bind){
		Array.forEach(this, fn, bind);
		return this;
	}

});

Object.extend({

	keys: function(object){
		var keys = [];
		for (var k in object){
			if (hasOwnProperty.call(object, k)) keys.push(k);
		}
		/*<ltIE8>*/
		forEachObjectEnumberableKey(object, function(k){
			keys.push(k);
		});
		/*</ltIE8>*/
		return keys;
	},

	forEach: function(object, fn, bind){
		Object.keys(object).forEach(function(key){
			fn.call(bind, object[key], key, object);
		});
	}

});

Object.each = Object.forEach;


// Array & Object cloning, Object merging and appending

var cloneOf = function(item){
	switch (typeOf(item)){
		case 'array': return item.clone();
		case 'object': return Object.clone(item);
		default: return item;
	}
};

Array.implement('clone', function(){
	var i = this.length, clone = new Array(i);
	while (i--) clone[i] = cloneOf(this[i]);
	return clone;
});

var mergeOne = function(source, key, current){
	switch (typeOf(current)){
		case 'object':
			if (typeOf(source[key]) == 'object') Object.merge(source[key], current);
			else source[key] = Object.clone(current);
			break;
		case 'array': source[key] = current.clone(); break;
		default: source[key] = current;
	}
	return source;
};

Object.extend({

	merge: function(source, k, v){
		if (typeOf(k) == 'string') return mergeOne(source, k, v);
		for (var i = 1, l = arguments.length; i < l; i++){
			var object = arguments[i];
			for (var key in object) mergeOne(source, key, object[key]);
		}
		return source;
	},

	clone: function(object){
		var clone = {};
		for (var key in object) clone[key] = cloneOf(object[key]);
		return clone;
	},

	append: function(original){
		for (var i = 1, l = arguments.length; i < l; i++){
			var extended = arguments[i] || {};
			for (var key in extended) original[key] = extended[key];
		}
		return original;
	}

});

// Object-less types

['Object', 'WhiteSpace', 'TextNode', 'Collection', 'Arguments'].each(function(name){
	new Type(name);
});

// Unique ID

var UID = Date.now();

String.extend('uniqueID', function(){
	return (UID++).toString(36);
});



})();
/*
---

name: Array

description: Contains Array Prototypes like each, contains, and erase.

license: MIT-style license.

requires: [Type]

provides: Array

...
*/

Array.implement({

	/*<!ES5>*/
	every: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && !fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var results = [];
		for (var value, i = 0, l = this.length >>> 0; i < l; i++) if (i in this){
			value = this[i];
			if (fn.call(bind, value, i, this)) results.push(value);
		}
		return results;
	},

	indexOf: function(item, from){
		var length = this.length >>> 0;
		for (var i = (from < 0) ? Math.max(0, length + from) : from || 0; i < length; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var length = this.length >>> 0, results = Array(length);
		for (var i = 0; i < length; i++){
			if (i in this) results[i] = fn.call(bind, this[i], i, this);
		}
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length >>> 0; i < l; i++){
			if ((i in this) && fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},
	/*</!ES5>*/

	clean: function(){
		return this.filter(function(item){
			return item != null;
		});
	},

	invoke: function(methodName){
		var args = Array.slice(arguments, 1);
		return this.map(function(item){
			return item[methodName].apply(item, args);
		});
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	append: function(array){
		this.push.apply(this, array);
		return this;
	},

	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},

	getRandom: function(){
		return (this.length) ? this[Number.random(0, this.length - 1)] : null;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	erase: function(item){
		for (var i = this.length; i--;){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},

	empty: function(){
		this.length = 0;
		return this;
	},

	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = typeOf(this[i]);
			if (type == 'null') continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments' || instanceOf(this[i], Array)) ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},

	pick: function(){
		for (var i = 0, l = this.length; i < l; i++){
			if (this[i] != null) return this[i];
		}
		return null;
	},

	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return parseInt(value, 16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});


/*
---

name: Function

description: Contains Function Prototypes like create, bind, pass, and delay.

license: MIT-style license.

requires: Type

provides: Function

...
*/

Function.extend({

	attempt: function(){
		for (var i = 0, l = arguments.length; i < l; i++){
			try {
				return arguments[i]();
			} catch (e){}
		}
		return null;
	}

});

Function.implement({

	attempt: function(args, bind){
		try {
			return this.apply(bind, Array.convert(args));
		} catch (e){}

		return null;
	},

	/*<!ES5-bind>*/
	bind: function(that){
		var self = this,
			args = arguments.length > 1 ? Array.slice(arguments, 1) : null,
			F = function(){};

		var bound = function(){
			var context = that, length = arguments.length;
			if (this instanceof bound){
				F.prototype = self.prototype;
				context = new F;
			}
			var result = (!args && !length)
				? self.call(context)
				: self.apply(context, args && length ? args.concat(Array.slice(arguments)) : args || arguments);
			return context == that ? result : context;
		};
		return bound;
	},
	/*</!ES5-bind>*/

	pass: function(args, bind){
		var self = this;
		if (args != null) args = Array.convert(args);
		return function(){
			return self.apply(bind, args || arguments);
		};
	},

	delay: function(delay, bind, args){
		return setTimeout(this.pass((args == null ? [] : args), bind), delay);
	},

	periodical: function(periodical, bind, args){
		return setInterval(this.pass((args == null ? [] : args), bind), periodical);
	}

});


/*
---

name: Number

description: Contains Number Prototypes like limit, round, times, and ceil.

license: MIT-style license.

requires: Type

provides: Number

...
*/

Number.implement({

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0).toFixed(precision < 0 ? -precision : 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}

});

Number.alias('each', 'times');

(function(math){

var methods = {};

math.each(function(name){
	if (!Number[name]) methods[name] = function(){
		return Math[name].apply(null, [this].concat(Array.convert(arguments)));
	};
});

Number.implement(methods);

})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);
/*
---

name: String

description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

license: MIT-style license.

requires: [Type, Array]

provides: String

...
*/

String.implement({

	//<!ES6>
	contains: function(string, index){
		return (index ? String(this).slice(index) : String(this)).indexOf(string) > -1;
	},
	//</!ES6>

	test: function(regex, params){
		return ((typeOf(regex) == 'regexp') ? regex : new RegExp('' + regex, params)).test(this);
	},

	trim: function(){
		return String(this).replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return String(this).replace(/\s+/g, ' ').trim();
	},

	camelCase: function(){
		return String(this).replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return String(this).replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(){
		return String(this).replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return String(this).replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	hexToRgb: function(array){
		var hex = String(this).match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},

	rgbToHex: function(array){
		var rgb = String(this).match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},

	substitute: function(object, regexp){
		return String(this).replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != null) ? object[name] : '';
		});
	}

});


/*
---

name: Browser

description: The Browser Object. Contains Browser initialization, Window and Document, and the Browser Hash.

license: MIT-style license.

requires: [Array, Function, Number, String]

provides: [Browser, Window, Document]

...
*/

(function(){

var document = this.document;
var window = document.window = this;

var parse = function(ua, platform){
	ua = ua.toLowerCase();
	platform = (platform ? platform.toLowerCase() : '');

	// chrome is included in the edge UA, so need to check for edge first,
	// before checking if it's chrome.
	var UA = ua.match(/(edge)[\s\/:]([\w\d\.]+)/);
	if (!UA){
		UA = ua.match(/(opera|ie|firefox|chrome|trident|crios|version)[\s\/:]([\w\d\.]+)?.*?(safari|(?:rv[\s\/:]|version[\s\/:])([\w\d\.]+)|$)/) || [null, 'unknown', 0];
	}

	if (UA[1] == 'trident'){
		UA[1] = 'ie';
		if (UA[4]) UA[2] = UA[4];
	} else if (UA[1] == 'crios'){
		UA[1] = 'chrome';
	}

	platform = ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || ua.match(/mac|win|linux/) || ['other'])[0];
	if (platform == 'win') platform = 'windows';

	return {
		extend: Function.prototype.extend,
		name: (UA[1] == 'version') ? UA[3] : UA[1],
		version: parseFloat((UA[1] == 'opera' && UA[4]) ? UA[4] : UA[2]),
		platform: platform
	};
};

var Browser = this.Browser = parse(navigator.userAgent, navigator.platform);

if (Browser.name == 'ie' && document.documentMode){
	Browser.version = document.documentMode;
}

Browser.extend({
	Features: {
		xpath: !!(document.evaluate),
		air: !!(window.runtime),
		query: !!(document.querySelector),
		json: !!(window.JSON)
	},
	parseUA: parse
});



// Request

Browser.Request = (function(){

	var XMLHTTP = function(){
		return new XMLHttpRequest();
	};

	var MSXML2 = function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	};

	var MSXML = function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
	};

	return Function.attempt(function(){
		XMLHTTP();
		return XMLHTTP;
	}, function(){
		MSXML2();
		return MSXML2;
	}, function(){
		MSXML();
		return MSXML;
	});

})();

Browser.Features.xhr = !!(Browser.Request);



// String scripts

Browser.exec = function(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.text = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

String.implement('stripScripts', function(exec){
	var scripts = '';
	var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(all, code){
		scripts += code + '\n';
		return '';
	});
	if (exec === true) Browser.exec(scripts);
	else if (typeOf(exec) == 'function') exec(scripts, text);
	return text;
});

// Window, Document

Browser.extend({
	Document: this.Document,
	Window: this.Window,
	Element: this.Element,
	Event: this.Event
});

this.Window = this.$constructor = new Type('Window', function(){});

this.$family = Function.convert('window').hide();

Window.mirror(function(name, method){
	window[name] = method;
});

this.Document = document.$constructor = new Type('Document', function(){});

document.$family = Function.convert('document').hide();

Document.mirror(function(name, method){
	document[name] = method;
});

document.html = document.documentElement;
if (!document.head) document.head = document.getElementsByTagName('head')[0];

if (document.execCommand) try {
	document.execCommand('BackgroundImageCache', false, true);
} catch (e){}

/*<ltIE9>*/
if (this.attachEvent && !this.addEventListener){
	var unloadEvent = function(){
		this.detachEvent('onunload', unloadEvent);
		document.head = document.html = document.window = null;
		window = this.Window = document = null;
	};
	this.attachEvent('onunload', unloadEvent);
}

// IE fails on collections and <select>.options (refers to <select>)
var arrayFrom = Array.convert;
try {
	arrayFrom(document.html.childNodes);
} catch (e){
	Array.convert = function(item){
		if (typeof item != 'string' && Type.isEnumerable(item) && typeOf(item) != 'array'){
			var i = item.length, array = new Array(i);
			while (i--) array[i] = item[i];
			return array;
		}
		return arrayFrom(item);
	};

	var prototype = Array.prototype,
		slice = prototype.slice;
	['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'concat', 'join', 'slice'].each(function(name){
		var method = prototype[name];
		Array[name] = function(item){
			return method.apply(Array.convert(item), slice.call(arguments, 1));
		};
	});
}
/*</ltIE9>*/



})();
/*
---

name: Object

description: Object generic methods

license: MIT-style license.

requires: Type

provides: [Object, Hash]

...
*/

(function(){

Object.extend({

	subset: function(object, keys){
		var results = {};
		for (var i = 0, l = keys.length; i < l; i++){
			var k = keys[i];
			if (k in object) results[k] = object[k];
		}
		return results;
	},

	map: function(object, fn, bind){
		var results = {};
		var keys = Object.keys(object);
		for (var i = 0; i < keys.length; i++){
			var key = keys[i];
			results[key] = fn.call(bind, object[key], key, object);
		}
		return results;
	},

	filter: function(object, fn, bind){
		var results = {};
		var keys = Object.keys(object);
		for (var i = 0; i < keys.length; i++){
			var key = keys[i], value = object[key];
			if (fn.call(bind, value, key, object)) results[key] = value;
		}
		return results;
	},

	every: function(object, fn, bind){
		var keys = Object.keys(object);
		for (var i = 0; i < keys.length; i++){
			var key = keys[i];
			if (!fn.call(bind, object[key], key)) return false;
		}
		return true;
	},

	some: function(object, fn, bind){
		var keys = Object.keys(object);
		for (var i = 0; i < keys.length; i++){
			var key = keys[i];
			if (fn.call(bind, object[key], key)) return true;
		}
		return false;
	},

	values: function(object){
		var values = [];
		var keys = Object.keys(object);
		for (var i = 0; i < keys.length; i++){
			var k = keys[i];
			values.push(object[k]);
		}
		return values;
	},

	getLength: function(object){
		return Object.keys(object).length;
	},

	keyOf: function(object, value){
		var keys = Object.keys(object);
		for (var i = 0; i < keys.length; i++){
			var key = keys[i];
			if (object[key] === value) return key;
		}
		return null;
	},

	contains: function(object, value){
		return Object.keyOf(object, value) != null;
	},

	toQueryString: function(object, base){
		var queryString = [];

		Object.each(object, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch (typeOf(value)){
				case 'object': result = Object.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Object.toQueryString(qs, key);
					break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != null) queryString.push(result);
		});

		return queryString.join('&');
	}

});

})();


/*
---
name: Slick.Parser
description: Standalone CSS3 Selector parser
provides: Slick.Parser
...
*/

;(function(){

var parsed,
	separatorIndex,
	combinatorIndex,
	reversed,
	cache = {},
	reverseCache = {},
	reUnescape = /\\/g;

var parse = function(expression, isReversed){
	if (expression == null) return null;
	if (expression.Slick === true) return expression;
	expression = ('' + expression).replace(/^\s+|\s+$/g, '');
	reversed = !!isReversed;
	var currentCache = (reversed) ? reverseCache : cache;
	if (currentCache[expression]) return currentCache[expression];
	parsed = {
		Slick: true,
		expressions: [],
		raw: expression,
		reverse: function(){
			return parse(this.raw, true);
		}
	};
	separatorIndex = -1;
	while (expression != (expression = expression.replace(regexp, parser)));
	parsed.length = parsed.expressions.length;
	return currentCache[parsed.raw] = (reversed) ? reverse(parsed) : parsed;
};

var reverseCombinator = function(combinator){
	if (combinator === '!') return ' ';
	else if (combinator === ' ') return '!';
	else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
	else return '!' + combinator;
};

var reverse = function(expression){
	var expressions = expression.expressions;
	for (var i = 0; i < expressions.length; i++){
		var exp = expressions[i];
		var last = {parts: [], tag: '*', combinator: reverseCombinator(exp[0].combinator)};

		for (var j = 0; j < exp.length; j++){
			var cexp = exp[j];
			if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
			cexp.combinator = cexp.reverseCombinator;
			delete cexp.reverseCombinator;
		}

		exp.reverse().push(last);
	}
	return expression;
};

var escapeRegExp = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function(match){
		return '\\' + match;
	});
};

var regexp = new RegExp(
/*
#!/usr/bin/env ruby
puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
__END__
	"(?x)^(?:\
	  \\s* ( , ) \\s*               # Separator          \n\
	| \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
	|      ( \\s+ )                 # CombinatorChildren \n\
	|      ( <unicode>+ | \\* )     # Tag                \n\
	| \\#  ( <unicode>+       )     # ID                 \n\
	| \\.  ( <unicode>+       )     # ClassName          \n\
	|                               # Attribute          \n\
	\\[  \
		\\s* (<unicode1>+)  (?:  \
			\\s* ([*^$!~|]?=)  (?:  \
				\\s* (?:\
					([\"']?)(.*?)\\9 \
				)\
			)  \
		)?  \\s*  \
	\\](?!\\]) \n\
	|   :+ ( <unicode>+ )(?:\
	\\( (?:\
		(?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+)\
	) \\)\
	)?\
	)"
*/
	"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
	.replace(/<combinator>/, '[' + escapeRegExp('>+~`!@$%^&={}\\;</') + ']')
	.replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
	.replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
);

function parser(
	rawMatch,

	separator,
	combinator,
	combinatorChildren,

	tagName,
	id,
	className,

	attributeKey,
	attributeOperator,
	attributeQuote,
	attributeValue,

	pseudoMarker,
	pseudoClass,
	pseudoQuote,
	pseudoClassQuotedValue,
	pseudoClassValue
){
	if (separator || separatorIndex === -1){
		parsed.expressions[++separatorIndex] = [];
		combinatorIndex = -1;
		if (separator) return '';
	}

	if (combinator || combinatorChildren || combinatorIndex === -1){
		combinator = combinator || ' ';
		var currentSeparator = parsed.expressions[separatorIndex];
		if (reversed && currentSeparator[combinatorIndex])
			currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
		currentSeparator[++combinatorIndex] = {combinator: combinator, tag: '*'};
	}

	var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

	if (tagName){
		currentParsed.tag = tagName.replace(reUnescape, '');

	} else if (id){
		currentParsed.id = id.replace(reUnescape, '');

	} else if (className){
		className = className.replace(reUnescape, '');

		if (!currentParsed.classList) currentParsed.classList = [];
		if (!currentParsed.classes) currentParsed.classes = [];
		currentParsed.classList.push(className);
		currentParsed.classes.push({
			value: className,
			regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
		});

	} else if (pseudoClass){
		pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
		pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

		if (!currentParsed.pseudos) currentParsed.pseudos = [];
		currentParsed.pseudos.push({
			key: pseudoClass.replace(reUnescape, ''),
			value: pseudoClassValue,
			type: pseudoMarker.length == 1 ? 'class' : 'element'
		});

	} else if (attributeKey){
		attributeKey = attributeKey.replace(reUnescape, '');
		attributeValue = (attributeValue || '').replace(reUnescape, '');

		var test, regexp;

		switch (attributeOperator){
			case '^=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue)            ); break;
			case '$=' : regexp = new RegExp(            escapeRegExp(attributeValue) +'$'       ); break;
			case '~=' : regexp = new RegExp( '(^|\\s)'+ escapeRegExp(attributeValue) +'(\\s|$)' ); break;
			case '|=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue) +'(-|$)'   ); break;
			case  '=' : test = function(value){
				return attributeValue == value;
			}; break;
			case '*=' : test = function(value){
				return value && value.indexOf(attributeValue) > -1;
			}; break;
			case '!=' : test = function(value){
				return attributeValue != value;
			}; break;
			default   : test = function(value){
				return !!value;
			};
		}

		if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function(){
			return false;
		};

		if (!test) test = function(value){
			return value && regexp.test(value);
		};

		if (!currentParsed.attributes) currentParsed.attributes = [];
		currentParsed.attributes.push({
			key: attributeKey,
			operator: attributeOperator,
			value: attributeValue,
			test: test
		});

	}

	return '';
};

// Slick NS

var Slick = (this.Slick || {});

Slick.parse = function(expression){
	return parse(expression);
};

Slick.escapeRegExp = escapeRegExp;

if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);
/*
---
name: Slick.Finder
description: The new, superfast css selector engine.
provides: Slick.Finder
requires: Slick.Parser
...
*/

;(function(){

var local = {},
	featuresCache = {},
	toString = Object.prototype.toString;

// Feature / Bug detection

local.isNativeCode = function(fn){
	return (/\{\s*\[native code\]\s*\}/).test('' + fn);
};

local.isXML = function(document){
	return (!!document.xmlVersion) || (!!document.xml) || (toString.call(document) == '[object XMLDocument]') ||
	(document.nodeType == 9 && document.documentElement.nodeName != 'HTML');
};

local.setDocument = function(document){

	// convert elements / window arguments to document. if document cannot be extrapolated, the function returns.
	var nodeType = document.nodeType;
	if (nodeType == 9); // document
	else if (nodeType) document = document.ownerDocument; // node
	else if (document.navigator) document = document.document; // window
	else return;

	// check if it's the old document

	if (this.document === document) return;
	this.document = document;

	// check if we have done feature detection on this document before

	var root = document.documentElement,
		rootUid = this.getUIDXML(root),
		features = featuresCache[rootUid],
		feature;

	if (features){
		for (feature in features){
			this[feature] = features[feature];
		}
		return;
	}

	features = featuresCache[rootUid] = {};

	features.root = root;
	features.isXMLDocument = this.isXML(document);

	features.brokenStarGEBTN
	= features.starSelectsClosedQSA
	= features.idGetsName
	= features.brokenMixedCaseQSA
	= features.brokenGEBCN
	= features.brokenCheckedQSA
	= features.brokenEmptyAttributeQSA
	= features.isHTMLDocument
	= features.nativeMatchesSelector
	= false;

	var starSelectsClosed, starSelectsComments,
		brokenSecondClassNameGEBCN, cachedGetElementsByClassName,
		brokenFormAttributeGetter;

	var selected, id = 'slick_uniqueid';
	var testNode = document.createElement('div');

	var testRoot = document.body || document.getElementsByTagName('body')[0] || root;
	testRoot.appendChild(testNode);

	// on non-HTML documents innerHTML and getElementsById doesnt work properly
	try {
		testNode.innerHTML = '<a id="'+id+'"></a>';
		features.isHTMLDocument = !!document.getElementById(id);
	} catch (e){}

	if (features.isHTMLDocument){

		testNode.style.display = 'none';

		// IE returns comment nodes for getElementsByTagName('*') for some documents
		testNode.appendChild(document.createComment(''));
		starSelectsComments = (testNode.getElementsByTagName('*').length > 1);

		// IE returns closed nodes (EG:"</foo>") for getElementsByTagName('*') for some documents
		try {
			testNode.innerHTML = 'foo</foo>';
			selected = testNode.getElementsByTagName('*');
			starSelectsClosed = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
		} catch (e){};

		features.brokenStarGEBTN = starSelectsComments || starSelectsClosed;

		// IE returns elements with the name instead of just id for getElementsById for some documents
		try {
			testNode.innerHTML = '<a name="'+ id +'"></a><b id="'+ id +'"></b>';
			features.idGetsName = document.getElementById(id) === testNode.firstChild;
		} catch (e){}

		if (testNode.getElementsByClassName){

			// Safari 3.2 getElementsByClassName caches results
			try {
				testNode.innerHTML = '<a class="f"></a><a class="b"></a>';
				testNode.getElementsByClassName('b').length;
				testNode.firstChild.className = 'b';
				cachedGetElementsByClassName = (testNode.getElementsByClassName('b').length != 2);
			} catch (e){};

			// Opera 9.6 getElementsByClassName doesnt detects the class if its not the first one
			try {
				testNode.innerHTML = '<a class="a"></a><a class="f b a"></a>';
				brokenSecondClassNameGEBCN = (testNode.getElementsByClassName('a').length != 2);
			} catch (e){}

			features.brokenGEBCN = cachedGetElementsByClassName || brokenSecondClassNameGEBCN;
		}

		if (testNode.querySelectorAll){
			// IE 8 returns closed nodes (EG:"</foo>") for querySelectorAll('*') for some documents
			try {
				testNode.innerHTML = 'foo</foo>';
				selected = testNode.querySelectorAll('*');
				features.starSelectsClosedQSA = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
			} catch (e){}

			// Safari 3.2 querySelectorAll doesnt work with mixedcase on quirksmode
			try {
				testNode.innerHTML = '<a class="MiX"></a>';
				features.brokenMixedCaseQSA = !testNode.querySelectorAll('.MiX').length;
			} catch (e){}

			// Webkit and Opera dont return selected options on querySelectorAll
			try {
				testNode.innerHTML = '<select><option selected="selected">a</option></select>';
				features.brokenCheckedQSA = (testNode.querySelectorAll(':checked').length == 0);
			} catch (e){};

			// IE returns incorrect results for attr[*^$]="" selectors on querySelectorAll
			try {
				testNode.innerHTML = '<a class=""></a>';
				features.brokenEmptyAttributeQSA = (testNode.querySelectorAll('[class*=""]').length != 0);
			} catch (e){}

		}

		// IE6-7, if a form has an input of id x, form.getAttribute(x) returns a reference to the input
		try {
			testNode.innerHTML = '<form action="s"><input id="action"/></form>';
			brokenFormAttributeGetter = (testNode.firstChild.getAttribute('action') != 's');
		} catch (e){}

		// native matchesSelector function

		features.nativeMatchesSelector = root.matches || /*root.msMatchesSelector ||*/ root.mozMatchesSelector || root.webkitMatchesSelector;
		if (features.nativeMatchesSelector) try {
			// if matchesSelector trows errors on incorrect sintaxes we can use it
			features.nativeMatchesSelector.call(root, ':slick');
			features.nativeMatchesSelector = null;
		} catch (e){}

	}

	try {
		root.slick_expando = 1;
		delete root.slick_expando;
		features.getUID = this.getUIDHTML;
	} catch (e){
		features.getUID = this.getUIDXML;
	}

	testRoot.removeChild(testNode);
	testNode = selected = testRoot = null;

	// getAttribute

	features.getAttribute = (features.isHTMLDocument && brokenFormAttributeGetter) ? function(node, name){
		var method = this.attributeGetters[name];
		if (method) return method.call(node);
		var attributeNode = node.getAttributeNode(name);
		return (attributeNode) ? attributeNode.nodeValue : null;
	} : function(node, name){
		var method = this.attributeGetters[name];
		return (method) ? method.call(node) : node.getAttribute(name);
	};

	// hasAttribute

	features.hasAttribute = (root && this.isNativeCode(root.hasAttribute)) ? function(node, attribute){
		return node.hasAttribute(attribute);
	} : function(node, attribute){
		node = node.getAttributeNode(attribute);
		return !!(node && (node.specified || node.nodeValue));
	};

	// contains
	// FIXME: Add specs: local.contains should be different for xml and html documents?
	var nativeRootContains = root && this.isNativeCode(root.contains),
		nativeDocumentContains = document && this.isNativeCode(document.contains);

	features.contains = (nativeRootContains && nativeDocumentContains) ? function(context, node){
		return context.contains(node);
	} : (nativeRootContains && !nativeDocumentContains) ? function(context, node){
		// IE8 does not have .contains on document.
		return context === node || ((context === document) ? document.documentElement : context).contains(node);
	} : (root && root.compareDocumentPosition) ? function(context, node){
		return context === node || !!(context.compareDocumentPosition(node) & 16);
	} : function(context, node){
		if (node) do {
			if (node === context) return true;
		} while ((node = node.parentNode));
		return false;
	};

	// document order sorting
	// credits to Sizzle (http://sizzlejs.com/)

	features.documentSorter = (root.compareDocumentPosition) ? function(a, b){
		if (!a.compareDocumentPosition || !b.compareDocumentPosition) return 0;
		return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
	} : ('sourceIndex' in root) ? function(a, b){
		if (!a.sourceIndex || !b.sourceIndex) return 0;
		return a.sourceIndex - b.sourceIndex;
	} : (document.createRange) ? function(a, b){
		if (!a.ownerDocument || !b.ownerDocument) return 0;
		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
	} : null;

	root = null;

	for (feature in features){
		this[feature] = features[feature];
	}
};

// Main Method

var reSimpleSelector = /^([#.]?)((?:[\w-]+|\*))$/,
	reEmptyAttribute = /\[.+[*$^]=(?:""|'')?\]/,
	qsaFailExpCache = {};

local.search = function(context, expression, append, first){

	var found = this.found = (first) ? null : (append || []);

	if (!context) return found;
	else if (context.navigator) context = context.document; // Convert the node from a window to a document
	else if (!context.nodeType) return found;

	// setup

	var parsed, i, node, nodes,
		uniques = this.uniques = {},
		hasOthers = !!(append && append.length),
		contextIsDocument = (context.nodeType == 9);

	if (this.document !== (contextIsDocument ? context : context.ownerDocument)) this.setDocument(context);

	// avoid duplicating items already in the append array
	if (hasOthers) for (i = found.length; i--;) uniques[this.getUID(found[i])] = true;

	// expression checks

	if (typeof expression == 'string'){ // expression is a string

		/*<simple-selectors-override>*/
		var simpleSelector = expression.match(reSimpleSelector);
		simpleSelectors: if (simpleSelector){

			var symbol = simpleSelector[1],
				name = simpleSelector[2];

			if (!symbol){

				if (name == '*' && this.brokenStarGEBTN) break simpleSelectors;
				nodes = context.getElementsByTagName(name);
				if (first) return nodes[0] || null;
				for (i = 0; node = nodes[i++];){
					if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
				}

			} else if (symbol == '#'){

				if (!this.isHTMLDocument || !contextIsDocument) break simpleSelectors;
				node = context.getElementById(name);
				if (!node) return found;
				if (this.idGetsName && node.getAttributeNode('id').nodeValue != name) break simpleSelectors;
				if (first) return node || null;
				if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);

			} else if (symbol == '.'){

				if (!this.isHTMLDocument || ((!context.getElementsByClassName || this.brokenGEBCN) && context.querySelectorAll)) break simpleSelectors;
				if (context.getElementsByClassName && !this.brokenGEBCN){
					nodes = context.getElementsByClassName(name);
					if (first) return nodes[0] || null;
					for (i = 0; node = nodes[i++];){
						if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
					}
				} else {
					var matchClass = new RegExp('(^|\\s)'+ Slick.escapeRegExp(name) +'(\\s|$)');
					nodes = context.getElementsByTagName('*');
					for (i = 0; node = nodes[i++];){
						className = node.className;
						if (!(className && matchClass.test(className))) continue;
						if (first) return node;
						if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
					}
				}

			}

			if (hasOthers) this.sort(found);
			return (first) ? null : found;

		}
		/*</simple-selectors-override>*/

		/*<query-selector-override>*/
		querySelector: if (context.querySelectorAll){

			if (!this.isHTMLDocument
				|| qsaFailExpCache[expression]
				//TODO: only skip when expression is actually mixed case
				|| this.brokenMixedCaseQSA
				|| (this.brokenCheckedQSA && expression.indexOf(':checked') > -1)
				|| (this.brokenEmptyAttributeQSA && reEmptyAttribute.test(expression))
				|| (!contextIsDocument //Abort when !contextIsDocument and...
					//  there are multiple expressions in the selector
					//  since we currently only fix non-document rooted QSA for single expression selectors
					&& expression.indexOf(',') > -1
				)
				|| Slick.disableQSA
			) break querySelector;

			var _expression = expression, _context = context, currentId;
			if (!contextIsDocument){
				// non-document rooted QSA
				// credits to Andrew Dupont
				currentId = _context.getAttribute('id'), slickid = 'slickid__';
				_context.setAttribute('id', slickid);
				_expression = '#' + slickid + ' ' + _expression;
				context = _context.parentNode;
			}

			try {
				if (first) return context.querySelector(_expression) || null;
				else nodes = context.querySelectorAll(_expression);
			} catch (e){
				qsaFailExpCache[expression] = 1;
				break querySelector;
			} finally {
				if (!contextIsDocument){
					if (currentId) _context.setAttribute('id', currentId);
					else _context.removeAttribute('id');
					context = _context;
				}
			}

			if (this.starSelectsClosedQSA) for (i = 0; node = nodes[i++];){
				if (node.nodeName > '@' && !(hasOthers && uniques[this.getUID(node)])) found.push(node);
			} else for (i = 0; node = nodes[i++];){
				if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
			}

			if (hasOthers) this.sort(found);
			return found;

		}
		/*</query-selector-override>*/

		parsed = this.Slick.parse(expression);
		if (!parsed.length) return found;
	} else if (expression == null){ // there is no expression
		return found;
	} else if (expression.Slick){ // expression is a parsed Slick object
		parsed = expression;
	} else if (this.contains(context.documentElement || context, expression)){ // expression is a node
		(found) ? found.push(expression) : found = expression;
		return found;
	} else { // other junk
		return found;
	}

	/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

	// cache elements for the nth selectors

	this.posNTH = {};
	this.posNTHLast = {};
	this.posNTHType = {};
	this.posNTHTypeLast = {};

	/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

	// if append is null and there is only a single selector with one expression use pushArray, else use pushUID
	this.push = (!hasOthers && (first || (parsed.length == 1 && parsed.expressions[0].length == 1))) ? this.pushArray : this.pushUID;

	if (found == null) found = [];

	// default engine

	var j, m, n;
	var combinator, tag, id, classList, classes, attributes, pseudos;
	var currentItems, currentExpression, currentBit, lastBit, expressions = parsed.expressions;

	search: for (i = 0; (currentExpression = expressions[i]); i++) for (j = 0; (currentBit = currentExpression[j]); j++){

		combinator = 'combinator:' + currentBit.combinator;
		if (!this[combinator]) continue search;

		tag        = (this.isXMLDocument) ? currentBit.tag : currentBit.tag.toUpperCase();
		id         = currentBit.id;
		classList  = currentBit.classList;
		classes    = currentBit.classes;
		attributes = currentBit.attributes;
		pseudos    = currentBit.pseudos;
		lastBit    = (j === (currentExpression.length - 1));

		this.bitUniques = {};

		if (lastBit){
			this.uniques = uniques;
			this.found = found;
		} else {
			this.uniques = {};
			this.found = [];
		}

		if (j === 0){
			this[combinator](context, tag, id, classes, attributes, pseudos, classList);
			if (first && lastBit && found.length) break search;
		} else {
			if (first && lastBit) for (m = 0, n = currentItems.length; m < n; m++){
				this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
				if (found.length) break search;
			} else for (m = 0, n = currentItems.length; m < n; m++) this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
		}

		currentItems = this.found;
	}

	// should sort if there are nodes in append and if you pass multiple expressions.
	if (hasOthers || (parsed.expressions.length > 1)) this.sort(found);

	return (first) ? (found[0] || null) : found;
};

// Utils

local.uidx = 1;
local.uidk = 'slick-uniqueid';

local.getUIDXML = function(node){
	var uid = node.getAttribute(this.uidk);
	if (!uid){
		uid = this.uidx++;
		node.setAttribute(this.uidk, uid);
	}
	return uid;
};

local.getUIDHTML = function(node){
	return node.uniqueNumber || (node.uniqueNumber = this.uidx++);
};

// sort based on the setDocument documentSorter method.

local.sort = function(results){
	if (!this.documentSorter) return results;
	results.sort(this.documentSorter);
	return results;
};

/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

local.cacheNTH = {};

local.matchNTH = /^([+-]?\d*)?([a-z]+)?([+-]\d+)?$/;

local.parseNTHArgument = function(argument){
	var parsed = argument.match(this.matchNTH);
	if (!parsed) return false;
	var special = parsed[2] || false;
	var a = parsed[1] || 1;
	if (a == '-') a = -1;
	var b = +parsed[3] || 0;
	parsed =
		(special == 'n')	? {a: a, b: b} :
		(special == 'odd')	? {a: 2, b: 1} :
		(special == 'even')	? {a: 2, b: 0} : {a: 0, b: a};

	return (this.cacheNTH[argument] = parsed);
};

local.createNTHPseudo = function(child, sibling, positions, ofType){
	return function(node, argument){
		var uid = this.getUID(node);
		if (!this[positions][uid]){
			var parent = node.parentNode;
			if (!parent) return false;
			var el = parent[child], count = 1;
			if (ofType){
				var nodeName = node.nodeName;
				do {
					if (el.nodeName != nodeName) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			} else {
				do {
					if (el.nodeType != 1) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			}
		}
		argument = argument || 'n';
		var parsed = this.cacheNTH[argument] || this.parseNTHArgument(argument);
		if (!parsed) return false;
		var a = parsed.a, b = parsed.b, pos = this[positions][uid];
		if (a == 0) return b == pos;
		if (a > 0){
			if (pos < b) return false;
		} else {
			if (b < pos) return false;
		}
		return ((pos - b) % a) == 0;
	};
};

/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

local.pushArray = function(node, tag, id, classes, attributes, pseudos){
	if (this.matchSelector(node, tag, id, classes, attributes, pseudos)) this.found.push(node);
};

local.pushUID = function(node, tag, id, classes, attributes, pseudos){
	var uid = this.getUID(node);
	if (!this.uniques[uid] && this.matchSelector(node, tag, id, classes, attributes, pseudos)){
		this.uniques[uid] = true;
		this.found.push(node);
	}
};

local.matchNode = function(node, selector){
	if (this.isHTMLDocument && this.nativeMatchesSelector){
		try {
			return this.nativeMatchesSelector.call(node, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
		} catch (matchError){}
	}

	var parsed = this.Slick.parse(selector);
	if (!parsed) return true;

	// simple (single) selectors
	var expressions = parsed.expressions, simpleExpCounter = 0, i, currentExpression;
	for (i = 0; (currentExpression = expressions[i]); i++){
		if (currentExpression.length == 1){
			var exp = currentExpression[0];
			if (this.matchSelector(node, (this.isXMLDocument) ? exp.tag : exp.tag.toUpperCase(), exp.id, exp.classes, exp.attributes, exp.pseudos)) return true;
			simpleExpCounter++;
		}
	}

	if (simpleExpCounter == parsed.length) return false;

	var nodes = this.search(this.document, parsed), item;
	for (i = 0; item = nodes[i++];){
		if (item === node) return true;
	}
	return false;
};

local.matchPseudo = function(node, name, argument){
	var pseudoName = 'pseudo:' + name;
	if (this[pseudoName]) return this[pseudoName](node, argument);
	var attribute = this.getAttribute(node, name);
	return (argument) ? argument == attribute : !!attribute;
};

local.matchSelector = function(node, tag, id, classes, attributes, pseudos){
	if (tag){
		var nodeName = (this.isXMLDocument) ? node.nodeName : node.nodeName.toUpperCase();
		if (tag == '*'){
			if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
		} else {
			if (nodeName != tag) return false;
		}
	}

	if (id && node.getAttribute('id') != id) return false;

	var i, part, cls;
	if (classes) for (i = classes.length; i--;){
		cls = this.getAttribute(node, 'class');
		if (!(cls && classes[i].regexp.test(cls))) return false;
	}
	if (attributes) for (i = attributes.length; i--;){
		part = attributes[i];
		if (part.operator ? !part.test(this.getAttribute(node, part.key)) : !this.hasAttribute(node, part.key)) return false;
	}
	if (pseudos) for (i = pseudos.length; i--;){
		part = pseudos[i];
		if (!this.matchPseudo(node, part.key, part.value)) return false;
	}
	return true;
};

var combinators = {

	' ': function(node, tag, id, classes, attributes, pseudos, classList){ // all child nodes, any level

		var i, item, children;

		if (this.isHTMLDocument){
			getById: if (id){
				item = this.document.getElementById(id);
				if ((!item && node.all) || (this.idGetsName && item && item.getAttributeNode('id').nodeValue != id)){
					// all[id] returns all the elements with that name or id inside node
					// if theres just one it will return the element, else it will be a collection
					children = node.all[id];
					if (!children) return;
					if (!children[0]) children = [children];
					for (i = 0; item = children[i++];){
						var idNode = item.getAttributeNode('id');
						if (idNode && idNode.nodeValue == id){
							this.push(item, tag, null, classes, attributes, pseudos);
							break;
						}
					}
					return;
				}
				if (!item){
					// if the context is in the dom we return, else we will try GEBTN, breaking the getById label
					if (this.contains(this.root, node)) return;
					else break getById;
				} else if (this.document !== node && !this.contains(node, item)) return;
				this.push(item, tag, null, classes, attributes, pseudos);
				return;
			}
			getByClass: if (classes && node.getElementsByClassName && !this.brokenGEBCN){
				children = node.getElementsByClassName(classList.join(' '));
				if (!(children && children.length)) break getByClass;
				for (i = 0; item = children[i++];) this.push(item, tag, id, null, attributes, pseudos);
				return;
			}
		}
		getByTag: {
			children = node.getElementsByTagName(tag);
			if (!(children && children.length)) break getByTag;
			if (!this.brokenStarGEBTN) tag = null;
			for (i = 0; item = children[i++];) this.push(item, tag, id, classes, attributes, pseudos);
		}
	},

	'>': function(node, tag, id, classes, attributes, pseudos){ // direct children
		if ((node = node.firstChild)) do {
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
		} while ((node = node.nextSibling));
	},

	'+': function(node, tag, id, classes, attributes, pseudos){ // next sibling
		while ((node = node.nextSibling)) if (node.nodeType == 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'^': function(node, tag, id, classes, attributes, pseudos){ // first child
		node = node.firstChild;
		if (node){
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'~': function(node, tag, id, classes, attributes, pseudos){ // next siblings
		while ((node = node.nextSibling)){
			if (node.nodeType != 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	},

	'++': function(node, tag, id, classes, attributes, pseudos){ // next sibling and previous sibling
		this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
	},

	'~~': function(node, tag, id, classes, attributes, pseudos){ // next siblings and previous siblings
		this['combinator:~'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!~'](node, tag, id, classes, attributes, pseudos);
	},

	'!': function(node, tag, id, classes, attributes, pseudos){ // all parent nodes up to document
		while ((node = node.parentNode)) if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!>': function(node, tag, id, classes, attributes, pseudos){ // direct parent (one level)
		node = node.parentNode;
		if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!+': function(node, tag, id, classes, attributes, pseudos){ // previous sibling
		while ((node = node.previousSibling)) if (node.nodeType == 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'!^': function(node, tag, id, classes, attributes, pseudos){ // last child
		node = node.lastChild;
		if (node){
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'!~': function(node, tag, id, classes, attributes, pseudos){ // previous siblings
		while ((node = node.previousSibling)){
			if (node.nodeType != 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	}

};

for (var c in combinators) local['combinator:' + c] = combinators[c];

var pseudos = {

	/*<pseudo-selectors>*/

	'empty': function(node){
		var child = node.firstChild;
		return !(child && child.nodeType == 1) && !(node.innerText || node.textContent || '').length;
	},

	'not': function(node, expression){
		return !this.matchNode(node, expression);
	},

	'contains': function(node, text){
		return (node.innerText || node.textContent || '').indexOf(text) > -1;
	},

	'first-child': function(node){
		while ((node = node.previousSibling)) if (node.nodeType == 1) return false;
		return true;
	},

	'last-child': function(node){
		while ((node = node.nextSibling)) if (node.nodeType == 1) return false;
		return true;
	},

	'only-child': function(node){
		var prev = node;
		while ((prev = prev.previousSibling)) if (prev.nodeType == 1) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeType == 1) return false;
		return true;
	},

	/*<nth-pseudo-selectors>*/

	'nth-child': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTH'),

	'nth-last-child': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHLast'),

	'nth-of-type': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTHType', true),

	'nth-last-of-type': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHTypeLast', true),

	'index': function(node, index){
		return this['pseudo:nth-child'](node, '' + (index + 1));
	},

	'even': function(node){
		return this['pseudo:nth-child'](node, '2n');
	},

	'odd': function(node){
		return this['pseudo:nth-child'](node, '2n+1');
	},

	/*</nth-pseudo-selectors>*/

	/*<of-type-pseudo-selectors>*/

	'first-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.previousSibling)) if (node.nodeName == nodeName) return false;
		return true;
	},

	'last-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.nextSibling)) if (node.nodeName == nodeName) return false;
		return true;
	},

	'only-of-type': function(node){
		var prev = node, nodeName = node.nodeName;
		while ((prev = prev.previousSibling)) if (prev.nodeName == nodeName) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeName == nodeName) return false;
		return true;
	},

	/*</of-type-pseudo-selectors>*/

	// custom pseudos

	'enabled': function(node){
		return !node.disabled;
	},

	'disabled': function(node){
		return node.disabled;
	},

	'checked': function(node){
		return node.checked || node.selected;
	},

	'focus': function(node){
		return this.isHTMLDocument && this.document.activeElement === node && (node.href || node.type || this.hasAttribute(node, 'tabindex'));
	},

	'root': function(node){
		return (node === this.root);
	},

	'selected': function(node){
		return node.selected;
	}

	/*</pseudo-selectors>*/
};

for (var p in pseudos) local['pseudo:' + p] = pseudos[p];

// attributes methods

var attributeGetters = local.attributeGetters = {

	'for': function(){
		return ('htmlFor' in this) ? this.htmlFor : this.getAttribute('for');
	},

	'href': function(){
		return ('href' in this) ? this.getAttribute('href', 2) : this.getAttribute('href');
	},

	'style': function(){
		return (this.style) ? this.style.cssText : this.getAttribute('style');
	},

	'tabindex': function(){
		var attributeNode = this.getAttributeNode('tabindex');
		return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
	},

	'type': function(){
		return this.getAttribute('type');
	},

	'maxlength': function(){
		var attributeNode = this.getAttributeNode('maxLength');
		return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
	}

};

attributeGetters.MAXLENGTH = attributeGetters.maxLength = attributeGetters.maxlength;

// Slick

var Slick = local.Slick = (this.Slick || {});

Slick.version = '1.1.7';

// Slick finder

Slick.search = function(context, expression, append){
	return local.search(context, expression, append);
};

Slick.find = function(context, expression){
	return local.search(context, expression, null, true);
};

// Slick containment checker

Slick.contains = function(container, node){
	local.setDocument(container);
	return local.contains(container, node);
};

// Slick attribute getter

Slick.getAttribute = function(node, name){
	local.setDocument(node);
	return local.getAttribute(node, name);
};

Slick.hasAttribute = function(node, name){
	local.setDocument(node);
	return local.hasAttribute(node, name);
};

// Slick matcher

Slick.match = function(node, selector){
	if (!(node && selector)) return false;
	if (!selector || selector === node) return true;
	local.setDocument(node);
	return local.matchNode(node, selector);
};

// Slick attribute accessor

Slick.defineAttributeGetter = function(name, fn){
	local.attributeGetters[name] = fn;
	return this;
};

Slick.lookupAttributeGetter = function(name){
	return local.attributeGetters[name];
};

// Slick pseudo accessor

Slick.definePseudo = function(name, fn){
	local['pseudo:' + name] = function(node, argument){
		return fn.call(node, argument);
	};
	return this;
};

Slick.lookupPseudo = function(name){
	var pseudo = local['pseudo:' + name];
	if (pseudo) return function(argument){
		return pseudo.call(this, argument);
	};
	return null;
};

// Slick overrides accessor

Slick.override = function(regexp, fn){
	local.override(regexp, fn);
	return this;
};

Slick.isXML = local.isXML;

Slick.uidOf = function(node){
	return local.getUIDHTML(node);
};

if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);
/*
---

name: Element

description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

license: MIT-style license.

requires: [Window, Document, Array, String, Function, Object, Number, Slick.Parser, Slick.Finder]

provides: [Element, Elements, $, $$, IFrame, Selectors]

...
*/

var Element = this.Element = function(tag, props){
	var konstructor = Element.Constructors[tag];
	if (konstructor) return konstructor(props);
	if (typeof tag != 'string') return document.id(tag).set(props);

	if (!props) props = {};

	if (!(/^[\w-]+$/).test(tag)){
		var parsed = Slick.parse(tag).expressions[0][0];
		tag = (parsed.tag == '*') ? 'div' : parsed.tag;
		if (parsed.id && props.id == null) props.id = parsed.id;

		var attributes = parsed.attributes;
		if (attributes) for (var attr, i = 0, l = attributes.length; i < l; i++){
			attr = attributes[i];
			if (props[attr.key] != null) continue;

			if (attr.value != null && attr.operator == '=') props[attr.key] = attr.value;
			else if (!attr.value && !attr.operator) props[attr.key] = true;
		}

		if (parsed.classList && props['class'] == null) props['class'] = parsed.classList.join(' ');
	}

	return document.newElement(tag, props);
};


if (Browser.Element){
	Element.prototype = Browser.Element.prototype;
	// IE8 and IE9 require the wrapping.
	Element.prototype._fireEvent = (function(fireEvent){
		return function(type, event){
			return fireEvent.call(this, type, event);
		};
	})(Element.prototype.fireEvent);
}

new Type('Element', Element).mirror(function(name){
	if (Array.prototype[name]) return;

	var obj = {};
	obj[name] = function(){
		var results = [], args = arguments, elements = true;
		for (var i = 0, l = this.length; i < l; i++){
			var element = this[i], result = results[i] = element[name].apply(element, args);
			elements = (elements && typeOf(result) == 'element');
		}
		return (elements) ? new Elements(results) : results;
	};

	Elements.implement(obj);
});

if (!Browser.Element){
	Element.parent = Object;

	Element.Prototype = {
		'$constructor': Element,
		'$family': Function.convert('element').hide()
	};

	Element.mirror(function(name, method){
		Element.Prototype[name] = method;
	});
}

Element.Constructors = {};



var IFrame = new Type('IFrame', function(){
	var params = Array.link(arguments, {
		properties: Type.isObject,
		iframe: function(obj){
			return (obj != null);
		}
	});

	var props = params.properties || {}, iframe;
	if (params.iframe) iframe = document.id(params.iframe);
	var onload = props.onload || function(){};
	delete props.onload;
	props.id = props.name = [props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + String.uniqueID()].pick();
	iframe = new Element(iframe || 'iframe', props);

	var onLoad = function(){
		onload.call(iframe.contentWindow);
	};

	if (window.frames[props.id]) onLoad();
	else iframe.addListener('load', onLoad);
	return iframe;
});

var Elements = this.Elements = function(nodes){
	if (nodes && nodes.length){
		var uniques = {}, node;
		for (var i = 0; node = nodes[i++];){
			var uid = Slick.uidOf(node);
			if (!uniques[uid]){
				uniques[uid] = true;
				this.push(node);
			}
		}
	}
};

Elements.prototype = {length: 0};
Elements.parent = Array;

new Type('Elements', Elements).implement({

	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeOf(filter) == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}.protect(),

	push: function(){
		var length = this.length;
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = document.id(arguments[i]);
			if (item) this[length++] = item;
		}
		return (this.length = length);
	}.protect(),

	unshift: function(){
		var items = [];
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = document.id(arguments[i]);
			if (item) items.push(item);
		}
		return Array.prototype.unshift.apply(this, items);
	}.protect(),

	concat: function(){
		var newElements = new Elements(this);
		for (var i = 0, l = arguments.length; i < l; i++){
			var item = arguments[i];
			if (Type.isEnumerable(item)) newElements.append(item);
			else newElements.push(item);
		}
		return newElements;
	}.protect(),

	append: function(collection){
		for (var i = 0, l = collection.length; i < l; i++) this.push(collection[i]);
		return this;
	}.protect(),

	empty: function(){
		while (this.length) delete this[--this.length];
		return this;
	}.protect()

});



(function(){

// FF, IE
var splice = Array.prototype.splice, object = {'0': 0, '1': 1, length: 2};

splice.call(object, 1, 1);
if (object[1] == 1) Elements.implement('splice', function(){
	var length = this.length;
	var result = splice.apply(this, arguments);
	while (length >= this.length) delete this[length--];
	return result;
}.protect());

Array.forEachMethod(function(method, name){
	Elements.implement(name, method);
});

Array.mirror(Elements);

/*<ltIE8>*/
var createElementAcceptsHTML;
try {
	createElementAcceptsHTML = (document.createElement('<input name=x>').name == 'x');
} catch (e){}

var escapeQuotes = function(html){
	return ('' + html).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
};
/*</ltIE8>*/

/*<ltIE9>*/
// #2479 - IE8 Cannot set HTML of style element
var canChangeStyleHTML = (function(){
	var div = document.createElement('style'),
		flag = false;
	try {
		div.innerHTML = '#justTesing{margin: 0px;}';
		flag = !!div.innerHTML;
	} catch (e){}
	return flag;
})();
/*</ltIE9>*/

Document.implement({

	newElement: function(tag, props){
		if (props){
			if (props.checked != null) props.defaultChecked = props.checked;
			if ((props.type == 'checkbox' || props.type == 'radio') && props.value == null) props.value = 'on';
			/*<ltIE9>*/ // IE needs the type to be set before changing content of style element
			if (!canChangeStyleHTML && tag == 'style'){
				var styleElement = document.createElement('style');
				styleElement.setAttribute('type', 'text/css');
				if (props.type) delete props.type;
				return this.id(styleElement).set(props);
			}
			/*</ltIE9>*/
			/*<ltIE8>*/// Fix for readonly name and type properties in IE < 8
			if (createElementAcceptsHTML){
				tag = '<' + tag;
				if (props.name) tag += ' name="' + escapeQuotes(props.name) + '"';
				if (props.type) tag += ' type="' + escapeQuotes(props.type) + '"';
				tag += '>';
				delete props.name;
				delete props.type;
			}
			/*</ltIE8>*/
		}
		return this.id(this.createElement(tag)).set(props);
	}

});

})();

(function(){

Slick.uidOf(window);
Slick.uidOf(document);

Document.implement({

	newTextNode: function(text){
		return this.createTextNode(text);
	},

	getDocument: function(){
		return this;
	},

	getWindow: function(){
		return this.window;
	},

	id: (function(){

		var types = {

			string: function(id, nocash, doc){
				id = Slick.find(doc, '#' + id.replace(/(\W)/g, '\\$1'));
				return (id) ? types.element(id, nocash) : null;
			},

			element: function(el, nocash){
				Slick.uidOf(el);
				if (!nocash && !el.$family && !(/^(?:object|embed)$/i).test(el.tagName)){
					var fireEvent = el.fireEvent;
					// wrapping needed in IE7, or else crash
					el._fireEvent = function(type, event){
						return fireEvent(type, event);
					};
					Object.append(el, Element.Prototype);
				}
				return el;
			},

			object: function(obj, nocash, doc){
				if (obj.toElement) return types.element(obj.toElement(doc), nocash);
				return null;
			}

		};

		types.textnode = types.whitespace = types.window = types.document = function(zero){
			return zero;
		};

		return function(el, nocash, doc){
			if (el && el.$family && el.uniqueNumber) return el;
			var type = typeOf(el);
			return (types[type]) ? types[type](el, nocash, doc || document) : null;
		};

	})()

});

if (window.$ == null) Window.implement('$', function(el, nc){
	return document.id(el, nc, this.document);
});

Window.implement({

	getDocument: function(){
		return this.document;
	},

	getWindow: function(){
		return this;
	}

});

[Document, Element].invoke('implement', {

	getElements: function(expression){
		return Slick.search(this, expression, new Elements);
	},

	getElement: function(expression){
		return document.id(Slick.find(this, expression));
	}

});

var contains = {contains: function(element){
	return Slick.contains(this, element);
}};

if (!document.contains) Document.implement(contains);
if (!document.createElement('div').contains) Element.implement(contains);



// tree walking

var injectCombinator = function(expression, combinator){
	if (!expression) return combinator;

	expression = Object.clone(Slick.parse(expression));

	var expressions = expression.expressions;
	for (var i = expressions.length; i--;)
		expressions[i][0].combinator = combinator;

	return expression;
};

Object.forEach({
	getNext: '~',
	getPrevious: '!~',
	getParent: '!'
}, function(combinator, method){
	Element.implement(method, function(expression){
		return this.getElement(injectCombinator(expression, combinator));
	});
});

Object.forEach({
	getAllNext: '~',
	getAllPrevious: '!~',
	getSiblings: '~~',
	getChildren: '>',
	getParents: '!'
}, function(combinator, method){
	Element.implement(method, function(expression){
		return this.getElements(injectCombinator(expression, combinator));
	});
});

Element.implement({

	getFirst: function(expression){
		return document.id(Slick.search(this, injectCombinator(expression, '>'))[0]);
	},

	getLast: function(expression){
		return document.id(Slick.search(this, injectCombinator(expression, '>')).getLast());
	},

	getWindow: function(){
		return this.ownerDocument.window;
	},

	getDocument: function(){
		return this.ownerDocument;
	},

	getElementById: function(id){
		return document.id(Slick.find(this, '#' + ('' + id).replace(/(\W)/g, '\\$1')));
	},

	match: function(expression){
		return !expression || Slick.match(this, expression);
	}

});



if (window.$$ == null) Window.implement('$$', function(selector){
	if (arguments.length == 1){
		if (typeof selector == 'string') return Slick.search(this.document, selector, new Elements);
		else if (Type.isEnumerable(selector)) return new Elements(selector);
	}
	return new Elements(arguments);
});

// Inserters

var inserters = {

	before: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element);
	},

	after: function(context, element){
		var parent = element.parentNode;
		if (parent) parent.insertBefore(context, element.nextSibling);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		element.insertBefore(context, element.firstChild);
	}

};

inserters.inside = inserters.bottom;



// getProperty / setProperty

var propertyGetters = {}, propertySetters = {};

// properties

var properties = {};
Array.forEach([
	'type', 'value', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan',
	'frameBorder', 'rowSpan', 'tabIndex', 'useMap'
], function(property){
	properties[property.toLowerCase()] = property;
});

properties.html = 'innerHTML';
properties.text = (document.createElement('div').textContent == null) ? 'innerText': 'textContent';

Object.forEach(properties, function(real, key){
	propertySetters[key] = function(node, value){
		node[real] = value;
	};
	propertyGetters[key] = function(node){
		return node[real];
	};
});

/*<ltIE9>*/
propertySetters.text = (function(){
	return function(node, value){
		if (node.get('tag') == 'style') node.set('html', value);
		else node[properties.text] = value;
	};
})(propertySetters.text);

propertyGetters.text = (function(getter){
	return function(node){
		return (node.get('tag') == 'style') ? node.innerHTML : getter(node);
	};
})(propertyGetters.text);
/*</ltIE9>*/

// Booleans

var bools = [
	'compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked',
	'disabled', 'readOnly', 'multiple', 'selected', 'noresize',
	'defer', 'defaultChecked', 'autofocus', 'controls', 'autoplay',
	'loop'
];

var booleans = {};
Array.forEach(bools, function(bool){
	var lower = bool.toLowerCase();
	booleans[lower] = bool;
	propertySetters[lower] = function(node, value){
		node[bool] = !!value;
	};
	propertyGetters[lower] = function(node){
		return !!node[bool];
	};
});

// Special cases

Object.append(propertySetters, {

	'class': function(node, value){
		('className' in node) ? node.className = (value || '') : node.setAttribute('class', value);
	},

	'for': function(node, value){
		('htmlFor' in node) ? node.htmlFor = value : node.setAttribute('for', value);
	},

	'style': function(node, value){
		(node.style) ? node.style.cssText = value : node.setAttribute('style', value);
	},

	'value': function(node, value){
		node.value = (value != null) ? value : '';
	}

});

propertyGetters['class'] = function(node){
	return ('className' in node) ? node.className || null : node.getAttribute('class');
};

/* <webkit> */
var el = document.createElement('button');
// IE sets type as readonly and throws
try { el.type = 'button'; } catch (e){}
if (el.type != 'button') propertySetters.type = function(node, value){
	node.setAttribute('type', value);
};
el = null;
/* </webkit> */

/*<IE>*/

/*<ltIE9>*/
// #2479 - IE8 Cannot set HTML of style element
var canChangeStyleHTML = (function(){
	var div = document.createElement('style'),
		flag = false;
	try {
		div.innerHTML = '#justTesing{margin: 0px;}';
		flag = !!div.innerHTML;
	} catch (e){}
	return flag;
})();
/*</ltIE9>*/

var input = document.createElement('input'), volatileInputValue, html5InputSupport;

// #2178
input.value = 't';
input.type = 'submit';
volatileInputValue = input.value != 't';

// #2443 - IE throws "Invalid Argument" when trying to use html5 input types
try {
	input.value = '';
	input.type = 'email';
	html5InputSupport = input.type == 'email';
} catch (e){}

input = null;

if (volatileInputValue || !html5InputSupport) propertySetters.type = function(node, type){
	try {
		var value = node.value;
		node.type = type;
		node.value = value;
	} catch (e){}
};
/*</IE>*/

/* getProperty, setProperty */

/* <ltIE9> */
var pollutesGetAttribute = (function(div){
	div.random = 'attribute';
	return (div.getAttribute('random') == 'attribute');
})(document.createElement('div'));

var hasCloneBug = (function(test){
	test.innerHTML = '<object><param name="should_fix" value="the unknown" /></object>';
	return test.cloneNode(true).firstChild.childNodes.length != 1;
})(document.createElement('div'));
/* </ltIE9> */

var hasClassList = !!document.createElement('div').classList;

var classes = function(className){
	var classNames = (className || '').clean().split(' '), uniques = {};
	return classNames.filter(function(className){
		if (className !== '' && !uniques[className]) return uniques[className] = className;
	});
};

var addToClassList = function(name){
	this.classList.add(name);
};

var removeFromClassList = function(name){
	this.classList.remove(name);
};

Element.implement({

	setProperty: function(name, value){
		var setter = propertySetters[name.toLowerCase()];
		if (setter){
			setter(this, value);
		} else {
			/* <ltIE9> */
			var attributeWhiteList;
			if (pollutesGetAttribute) attributeWhiteList = this.retrieve('$attributeWhiteList', {});
			/* </ltIE9> */

			if (value == null){
				this.removeAttribute(name);
				/* <ltIE9> */
				if (pollutesGetAttribute) delete attributeWhiteList[name];
				/* </ltIE9> */
			} else {
				this.setAttribute(name, '' + value);
				/* <ltIE9> */
				if (pollutesGetAttribute) attributeWhiteList[name] = true;
				/* </ltIE9> */
			}
		}
		return this;
	},

	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},

	getProperty: function(name){
		var getter = propertyGetters[name.toLowerCase()];
		if (getter) return getter(this);
		/* <ltIE9> */
		if (pollutesGetAttribute){
			var attr = this.getAttributeNode(name), attributeWhiteList = this.retrieve('$attributeWhiteList', {});
			if (!attr) return null;
			if (attr.expando && !attributeWhiteList[name]){
				var outer = this.outerHTML;
				// segment by the opening tag and find mention of attribute name
				if (outer.substr(0, outer.search(/\/?['"]?>(?![^<]*<['"])/)).indexOf(name) < 0) return null;
				attributeWhiteList[name] = true;
			}
		}
		/* </ltIE9> */
		var result = Slick.getAttribute(this, name);
		return (!result && !Slick.hasAttribute(this, name)) ? null : result;
	},

	getProperties: function(){
		var args = Array.convert(arguments);
		return args.map(this.getProperty, this).associate(args);
	},

	removeProperty: function(name){
		return this.setProperty(name, null);
	},

	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},

	set: function(prop, value){
		var property = Element.Properties[prop];
		(property && property.set) ? property.set.call(this, value) : this.setProperty(prop, value);
	}.overloadSetter(),

	get: function(prop){
		var property = Element.Properties[prop];
		return (property && property.get) ? property.get.apply(this) : this.getProperty(prop);
	}.overloadGetter(),

	erase: function(prop){
		var property = Element.Properties[prop];
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},

	hasClass: hasClassList ? function(className){
		return this.classList.contains(className);
	} : function(className){
		return classes(this.className).contains(className);
	},

	addClass: hasClassList ? function(className){
		classes(className).forEach(addToClassList, this);
		return this;
	} : function(className){
		this.className = classes(className + ' ' + this.className).join(' ');
		return this;
	},

	removeClass: hasClassList ? function(className){
		classes(className).forEach(removeFromClassList, this);
		return this;
	} : function(className){
		var classNames = classes(this.className);
		classes(className).forEach(classNames.erase, classNames);
		this.className = classNames.join(' ');
		return this;
	},

	toggleClass: function(className, force){
		if (force == null) force = !this.hasClass(className);
		return (force) ? this.addClass(className) : this.removeClass(className);
	},

	adopt: function(){
		var parent = this, fragment, elements = Array.flatten(arguments), length = elements.length;
		if (length > 1) parent = fragment = document.createDocumentFragment();

		for (var i = 0; i < length; i++){
			var element = document.id(elements[i], true);
			if (element) parent.appendChild(element);
		}

		if (fragment) this.appendChild(fragment);

		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		inserters[where || 'bottom'](document.id(el, true), this);
		return this;
	},

	inject: function(el, where){
		inserters[where || 'bottom'](this, document.id(el, true));
		return this;
	},

	replaces: function(el){
		el = document.id(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		el = document.id(el, true);
		return this.replaces(el).grab(el, where);
	},

	getSelected: function(){
		this.selectedIndex; // Safari 3.2.1
		return new Elements(Array.convert(this.options).filter(function(option){
			return option.selected;
		}));
	},

	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea').each(function(el){
			var type = el.type;
			if (!el.name || el.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

			var value = (el.get('tag') == 'select') ? el.getSelected().map(function(opt){
				// IE
				return document.id(opt).get('value');
			}) : ((type == 'radio' || type == 'checkbox') && !el.checked) ? null : el.get('value');

			Array.convert(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	}

});


// appendHTML

var appendInserters = {
	before: 'beforeBegin',
	after: 'afterEnd',
	bottom: 'beforeEnd',
	top: 'afterBegin',
	inside: 'beforeEnd'
};

Element.implement('appendHTML', ('insertAdjacentHTML' in document.createElement('div')) ? function(html, where){
	this.insertAdjacentHTML(appendInserters[where || 'bottom'], html);
	return this;
} : function(html, where){
	var temp = new Element('div', {html: html}),
		children = temp.childNodes,
		fragment = temp.firstChild;

	if (!fragment) return this;
	if (children.length > 1){
		fragment = document.createDocumentFragment();
		for (var i = 0, l = children.length; i < l; i++){
			fragment.appendChild(children[i]);
		}
	}

	inserters[where || 'bottom'](fragment, this);
	return this;
});

var collected = {}, storage = {};

var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};

var clean = function(item){
	var uid = item.uniqueNumber;
	if (item.removeEvents) item.removeEvents();
	if (item.clearAttributes) item.clearAttributes();
	if (uid != null){
		delete collected[uid];
		delete storage[uid];
	}
	return item;
};

var formProps = {input: 'checked', option: 'selected', textarea: 'value'};

Element.implement({

	destroy: function(){
		var children = clean(this).getElementsByTagName('*');
		Array.each(children, clean);
		Element.dispose(this);
		return null;
	},

	empty: function(){
		Array.convert(this.childNodes).each(Element.dispose);
		return this;
	},

	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},

	clone: function(contents, keepid){
		contents = contents !== false;
		var clone = this.cloneNode(contents), ce = [clone], te = [this], i;

		if (contents){
			ce.append(Array.convert(clone.getElementsByTagName('*')));
			te.append(Array.convert(this.getElementsByTagName('*')));
		}

		for (i = ce.length; i--;){
			var node = ce[i], element = te[i];
			if (!keepid) node.removeAttribute('id');
			/*<ltIE9>*/
			if (node.clearAttributes){
				node.clearAttributes();
				node.mergeAttributes(element);
				node.removeAttribute('uniqueNumber');
				if (node.options){
					var no = node.options, eo = element.options;
					for (var j = no.length; j--;) no[j].selected = eo[j].selected;
				}
			}
			/*</ltIE9>*/
			var prop = formProps[element.tagName.toLowerCase()];
			if (prop && element[prop]) node[prop] = element[prop];
		}

		/*<ltIE9>*/
		if (hasCloneBug){
			var co = clone.getElementsByTagName('object'), to = this.getElementsByTagName('object');
			for (i = co.length; i--;) co[i].outerHTML = to[i].outerHTML;
		}
		/*</ltIE9>*/
		return document.id(clone);
	}

});

[Element, Window, Document].invoke('implement', {

	addListener: function(type, fn){
		if (window.attachEvent && !window.addEventListener){
			collected[Slick.uidOf(this)] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, !!arguments[2]);
		else this.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, !!arguments[2]);
		else this.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(property, dflt){
		var storage = get(Slick.uidOf(this)), prop = storage[property];
		if (dflt != null && prop == null) prop = storage[property] = dflt;
		return prop != null ? prop : null;
	},

	store: function(property, value){
		var storage = get(Slick.uidOf(this));
		storage[property] = value;
		return this;
	},

	eliminate: function(property){
		var storage = get(Slick.uidOf(this));
		delete storage[property];
		return this;
	}

});

/*<ltIE9>*/
if (window.attachEvent && !window.addEventListener){
	var gc = function(){
		Object.each(collected, clean);
		if (window.CollectGarbage) CollectGarbage();
		window.removeListener('unload', gc);
	};
	window.addListener('unload', gc);
}
/*</ltIE9>*/

Element.Properties = {};



Element.Properties.style = {

	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}

};

Element.Properties.tag = {

	get: function(){
		return this.tagName.toLowerCase();
	}

};

Element.Properties.html = {

	set: function(html){
		if (html == null) html = '';
		else if (typeOf(html) == 'array') html = html.join('');

		/*<ltIE9>*/
		if (this.styleSheet && !canChangeStyleHTML) this.styleSheet.cssText = html;
		else /*</ltIE9>*/this.innerHTML = html;
	},
	erase: function(){
		this.set('html', '');
	}

};

var supportsHTML5Elements = true, supportsTableInnerHTML = true, supportsTRInnerHTML = true;

/*<ltIE9>*/
// technique by jdbarlett - http://jdbartlett.com/innershiv/
var div = document.createElement('div');
var fragment;
div.innerHTML = '<nav></nav>';
supportsHTML5Elements = (div.childNodes.length == 1);
if (!supportsHTML5Elements){
	var tags = 'abbr article aside audio canvas datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video'.split(' ');
	fragment = document.createDocumentFragment(), l = tags.length;
	while (l--) fragment.createElement(tags[l]);
}
div = null;
/*</ltIE9>*/

/*<IE>*/
supportsTableInnerHTML = Function.attempt(function(){
	var table = document.createElement('table');
	table.innerHTML = '<tr><td></td></tr>';
	return true;
});

/*<ltFF4>*/
var tr = document.createElement('tr'), html = '<td></td>';
tr.innerHTML = html;
supportsTRInnerHTML = (tr.innerHTML == html);
tr = null;
/*</ltFF4>*/

if (!supportsTableInnerHTML || !supportsTRInnerHTML || !supportsHTML5Elements){

	Element.Properties.html.set = (function(set){

		var translations = {
			table: [1, '<table>', '</table>'],
			select: [1, '<select>', '</select>'],
			tbody: [2, '<table><tbody>', '</tbody></table>'],
			tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
		};

		translations.thead = translations.tfoot = translations.tbody;

		return function(html){

			/*<ltIE9>*/
			if (this.styleSheet) return set.call(this, html);
			/*</ltIE9>*/
			var wrap = translations[this.get('tag')];
			if (!wrap && !supportsHTML5Elements) wrap = [0, '', ''];
			if (!wrap) return set.call(this, html);

			var level = wrap[0], wrapper = document.createElement('div'), target = wrapper;
			if (!supportsHTML5Elements) fragment.appendChild(wrapper);
			wrapper.innerHTML = [wrap[1], html, wrap[2]].flatten().join('');
			while (level--) target = target.firstChild;
			this.empty().adopt(target.childNodes);
			if (!supportsHTML5Elements) fragment.removeChild(wrapper);
			wrapper = null;
		};

	})(Element.Properties.html.set);
}
/*</IE>*/

/*<ltIE9>*/
var testForm = document.createElement('form');
testForm.innerHTML = '<select><option>s</option></select>';

if (testForm.firstChild.value != 's') Element.Properties.value = {

	set: function(value){
		var tag = this.get('tag');
		if (tag != 'select') return this.setProperty('value', value);
		var options = this.getElements('option');
		value = String(value);
		for (var i = 0; i < options.length; i++){
			var option = options[i],
				attr = option.getAttributeNode('value'),
				optionValue = (attr && attr.specified) ? option.value : option.get('text');
			if (optionValue === value) return option.selected = true;
		}
	},

	get: function(){
		var option = this, tag = option.get('tag');

		if (tag != 'select' && tag != 'option') return this.getProperty('value');

		if (tag == 'select' && !(option = option.getSelected()[0])) return '';

		var attr = option.getAttributeNode('value');
		return (attr && attr.specified) ? option.value : option.get('text');
	}

};
testForm = null;
/*</ltIE9>*/

/*<IE>*/
if (document.createElement('div').getAttributeNode('id')) Element.Properties.id = {
	set: function(id){
		this.id = this.getAttributeNode('id').value = id;
	},
	get: function(){
		return this.id || null;
	},
	erase: function(){
		this.id = this.getAttributeNode('id').value = '';
	}
};
/*</IE>*/

})();
/*
---

name: Event

description: Contains the Event Type, to make the event object cross-browser.

license: MIT-style license.

requires: [Window, Document, Array, Function, String, Object]

provides: Event

...
*/

(function(){

var _keys = {};
var normalizeWheelSpeed = function(event){
	var normalized;
	if (event.wheelDelta){
		normalized = event.wheelDelta % 120 == 0 ? event.wheelDelta / 120 : event.wheelDelta / 12;
	} else {
		var rawAmount = event.deltaY || event.detail || 0;
		normalized = -(rawAmount % 3 == 0 ? rawAmount / 3 : rawAmount * 10);
	}
	return normalized;
};

var DOMEvent = this.DOMEvent = new Type('DOMEvent', function(event, win){
	if (!win) win = window;
	event = event || win.event;
	if (event.$extended) return event;
	this.event = event;
	this.$extended = true;
	this.shift = event.shiftKey;
	this.control = event.ctrlKey;
	this.alt = event.altKey;
	this.meta = event.metaKey;
	var type = this.type = event.type;
	var target = event.target || event.srcElement;
	while (target && target.nodeType == 3) target = target.parentNode;
	this.target = document.id(target);

	if (type.indexOf('key') == 0){
		var code = this.code = (event.which || event.keyCode);
		if (!this.shift || type != 'keypress') this.key = _keys[code];
		if (type == 'keydown' || type == 'keyup'){
			if (code > 111 && code < 124) this.key = 'f' + (code - 111);
			else if (code > 95 && code < 106) this.key = code - 96;
		}
		if (this.key == null) this.key = String.fromCharCode(code).toLowerCase();
	} else if (type == 'click' || type == 'dblclick' || type == 'contextmenu' || type == 'wheel' || type == 'DOMMouseScroll' || type.indexOf('mouse') == 0){
		var doc = win.document;
		doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
		this.page = {
			x: (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft,
			y: (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop
		};
		this.client = {
			x: (event.pageX != null) ? event.pageX - win.pageXOffset : event.clientX,
			y: (event.pageY != null) ? event.pageY - win.pageYOffset : event.clientY
		};
		if (type == 'DOMMouseScroll' || type == 'wheel' || type == 'mousewheel') this.wheel = normalizeWheelSpeed(event);
		this.rightClick = (event.which == 3 || event.button == 2);
		if (type == 'mouseover' || type == 'mouseout' || type == 'mouseenter' || type == 'mouseleave'){
			var overTarget = type == 'mouseover' || type == 'mouseenter';
			var related = event.relatedTarget || event[(overTarget ? 'from' : 'to') + 'Element'];
			while (related && related.nodeType == 3) related = related.parentNode;
			this.relatedTarget = document.id(related);
		}
	} else if (type.indexOf('touch') == 0 || type.indexOf('gesture') == 0){
		this.rotation = event.rotation;
		this.scale = event.scale;
		this.targetTouches = event.targetTouches;
		this.changedTouches = event.changedTouches;
		var touches = this.touches = event.touches;
		if (touches && touches[0]){
			var touch = touches[0];
			this.page = {x: touch.pageX, y: touch.pageY};
			this.client = {x: touch.clientX, y: touch.clientY};
		}
	}

	if (!this.client) this.client = {};
	if (!this.page) this.page = {};
});

DOMEvent.implement({

	stop: function(){
		return this.preventDefault().stopPropagation();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});

DOMEvent.defineKey = function(code, key){
	_keys[code] = key;
	return this;
};

DOMEvent.defineKeys = DOMEvent.defineKey.overloadSetter(true);

DOMEvent.defineKeys({
	'38': 'up', '40': 'down', '37': 'left', '39': 'right',
	'27': 'esc', '32': 'space', '8': 'backspace', '9': 'tab',
	'46': 'delete', '13': 'enter'
});

})();




/*
---

name: Element.Event

description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events, if necessary.

license: MIT-style license.

requires: [Element, Event]

provides: Element.Event

...
*/

(function(){

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

[Element, Window, Document].invoke('implement', {

	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		if (!events[type]) events[type] = {keys: [], values: []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type,
			custom = Element.Events[type],
			condition = fn,
			self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn, type);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event, type)) return fn.call(this, event);
					return true;
				};
			}
			if (custom.base) realType = Function.convert(custom.base).call(this, type);
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new DOMEvent(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn, arguments[2]);
		}
		events[type].values.push(defn);
		return this;
	},

	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var list = events[type];
		var index = list.keys.indexOf(fn);
		if (index == -1) return this;
		var value = list.values[index];
		delete list.keys[index];
		delete list.values[index];
		var custom = Element.Events[type];
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn, type);
			if (custom.base) type = Function.convert(custom.base).call(this, type);
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value, arguments[2]) : this;
	},

	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			attached[events].keys.each(function(fn){
				this.removeEvent(events, fn);
			}, this);
			delete attached[events];
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		args = Array.convert(args);

		events[type].keys.each(function(fn){
			if (delay) fn.delay(delay, this, args);
			else fn.apply(this, args);
		}, this);
		return this;
	},

	cloneEvents: function(from, type){
		from = document.id(from);
		var events = from.retrieve('events');
		if (!events) return this;
		if (!type){
			for (var eventType in events) this.cloneEvents(from, eventType);
		} else if (events[type]){
			events[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

});

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	wheel: 2, mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	orientationchange: 2, // mobile
	touchstart: 2, touchmove: 2, touchend: 2, touchcancel: 2, // touch
	gesturestart: 2, gesturechange: 2, gestureend: 2, // gesture
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, paste: 2, input: 2, //form elements
	load: 2, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	hashchange: 1, popstate: 2, pageshow: 2, pagehide: 2, // history
	error: 1, abort: 1, scroll: 1, message: 2 //misc
};

Element.Events = {
	mousewheel: {
		base: 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll'
	}
};

var check = function(event){
	var related = event.relatedTarget;
	if (related == null) return true;
	if (!related) return false;
	return (related != this && related.prefix != 'xul' && typeOf(this) != 'document' && !this.contains(related));
};

if ('onmouseenter' in document.documentElement){
	Element.NativeEvents.mouseenter = Element.NativeEvents.mouseleave = 2;
	Element.MouseenterCheck = check;
} else {
	Element.Events.mouseenter = {
		base: 'mouseover',
		condition: check
	};

	Element.Events.mouseleave = {
		base: 'mouseout',
		condition: check
	};
}

/*<ltIE9>*/
if (!window.addEventListener){
	Element.NativeEvents.propertychange = 2;
	Element.Events.change = {
		base: function(){
			var type = this.type;
			return (this.get('tag') == 'input' && (type == 'radio' || type == 'checkbox')) ? 'propertychange' : 'change';
		},
		condition: function(event){
			return event.type != 'propertychange' || event.event.propertyName == 'checked';
		}
	};
}
/*</ltIE9>*/



})();
/*
---

name: DOMReady

description: Contains the custom event domready.

license: MIT-style license.

requires: [Browser, Element, Element.Event]

provides: [DOMReady, DomReady]

...
*/

(function(window, document){

var ready,
	loaded,
	checks = [],
	shouldPoll,
	timer,
	testElement = document.createElement('div');

var domready = function(){
	clearTimeout(timer);
	if (!ready){
		Browser.loaded = ready = true;
		document.removeListener('DOMContentLoaded', domready).removeListener('readystatechange', check);
		document.fireEvent('domready');
		window.fireEvent('domready');
	}
	// cleanup scope vars
	document = window = testElement = null;
};

var check = function(){
	for (var i = checks.length; i--;) if (checks[i]()){
		domready();
		return true;
	}
	return false;
};

var poll = function(){
	clearTimeout(timer);
	if (!check()) timer = setTimeout(poll, 10);
};

document.addListener('DOMContentLoaded', domready);

/*<ltIE8>*/
// doScroll technique by Diego Perini http://javascript.nwbox.com/IEContentLoaded/
// testElement.doScroll() throws when the DOM is not ready, only in the top window
var doScrollWorks = function(){
	try {
		testElement.doScroll();
		return true;
	} catch (e){}
	return false;
};
// If doScroll works already, it can't be used to determine domready
//   e.g. in an iframe
if (testElement.doScroll && !doScrollWorks()){
	checks.push(doScrollWorks);
	shouldPoll = true;
}
/*</ltIE8>*/

if (document.readyState) checks.push(function(){
	var state = document.readyState;
	return (state == 'loaded' || state == 'complete');
});

if ('onreadystatechange' in document) document.addListener('readystatechange', check);
else shouldPoll = true;

if (shouldPoll) poll();

Element.Events.domready = {
	onAdd: function(fn){
		if (ready) fn.call(this);
	}
};

// Make sure that domready fires before load
Element.Events.load = {
	base: 'load',
	onAdd: function(fn){
		if (loaded && this == window) fn.call(this);
	},
	condition: function(){
		if (this == window){
			domready();
			delete Element.Events.load;
		}
		return true;
	}
};

// This is based on the custom load event
window.addEvent('load', function(){
	loaded = true;
});

})(window, document);
/*
---

name: Class

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

requires: [Array, String, Function, Number]

provides: Class

...
*/

(function(){

var Class = this.Class = new Type('Class', function(params){
	if (instanceOf(params, Function)) params = {initialize: params};

	var newClass = function(){
		reset(this);
		if (newClass.$prototyping) return this;
		this.$caller = null;
		this.$family = null;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		this.$caller = this.caller = null;
		return value;
	}.extend(this).implement(params);

	newClass.$constructor = Class;
	newClass.prototype.$constructor = newClass;
	newClass.prototype.parent = parent;

	return newClass;
});

var parent = function(){
	if (!this.$caller) throw new Error('The method "parent" cannot be called.');
	var name = this.$caller.$name,
		parent = this.$caller.$owner.parent,
		previous = (parent) ? parent.prototype[name] : null;
	if (!previous) throw new Error('The method "' + name + '" has no parent.');
	return previous.apply(this, arguments);
};

var reset = function(object){
	for (var key in object){
		var value = object[key];
		switch (typeOf(value)){
			case 'object':
				var F = function(){};
				F.prototype = value;
				object[key] = reset(new F);
				break;
			case 'array': object[key] = value.clone(); break;
		}
	}
	return object;
};

var wrap = function(self, key, method){
	if (method.$origin) method = method.$origin;
	var wrapper = function(){
		if (method.$protected && this.$caller == null) throw new Error('The method "' + key + '" cannot be called.');
		var caller = this.caller, current = this.$caller;
		this.caller = current; this.$caller = wrapper;
		var result = method.apply(this, arguments);
		this.$caller = current; this.caller = caller;
		return result;
	}.extend({$owner: self, $origin: method, $name: key});
	return wrapper;
};

var implement = function(key, value, retain){
	if (Class.Mutators.hasOwnProperty(key)){
		value = Class.Mutators[key].call(this, value);
		if (value == null) return this;
	}

	if (typeOf(value) == 'function'){
		if (value.$hidden) return this;
		this.prototype[key] = (retain) ? value : wrap(this, key, value);
	} else {
		Object.merge(this.prototype, key, value);
	}

	return this;
};

var getInstance = function(klass){
	klass.$prototyping = true;
	var proto = new klass;
	delete klass.$prototyping;
	return proto;
};

Class.implement('implement', implement.overloadSetter());

Class.Mutators = {

	Extends: function(parent){
		this.parent = parent;
		this.prototype = getInstance(parent);
	},

	Implements: function(items){
		Array.convert(items).each(function(item){
			var instance = new item;
			for (var key in instance) implement.call(this, key, instance[key], true);
		}, this);
	}
};

})();
/*
---

name: Class.Extras

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires: Class

provides: [Class.Extras, Chain, Events, Options]

...
*/

(function(){

this.Chain = new Class({

	$chain: [],

	chain: function(){
		this.$chain.append(Array.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.empty();
		return this;
	}

});

var removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

this.Events = new Class({

	$events: {},

	addEvent: function(type, fn, internal){
		type = removeOn(type);

		

		this.$events[type] = (this.$events[type] || []).include(fn);
		if (internal) fn.internal = true;
		return this;
	},

	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},

	fireEvent: function(type, args, delay){
		type = removeOn(type);
		var events = this.$events[type];
		if (!events) return this;
		args = Array.convert(args);
		events.each(function(fn){
			if (delay) fn.delay(delay, this, args);
			else fn.apply(this, args);
		}, this);
		return this;
	},

	removeEvent: function(type, fn){
		type = removeOn(type);
		var events = this.$events[type];
		if (events && !fn.internal){
			var index = events.indexOf(fn);
			if (index != -1) delete events[index];
		}
		return this;
	},

	removeEvents: function(events){
		var type;
		if (typeOf(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--;) if (i in fns){
				this.removeEvent(type, fns[i]);
			}
		}
		return this;
	}

});

this.Options = new Class({

	setOptions: function(){
		var options = this.options = Object.merge.apply(null, [{}, this.options].append(arguments));
		if (this.addEvent) for (var option in options){
			if (typeOf(options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, options[option]);
			delete options[option];
		}
		return this;
	}

});

})();
/*
---

name: Class.Thenable

description: Contains a Utility Class that can be implemented into your own Classes to make them "thenable".

license: MIT-style license.

requires: Class

provides: [Class.Thenable]

...
*/

(function(){

var STATE_PENDING = 0,
	STATE_FULFILLED = 1,
	STATE_REJECTED = 2;

var Thenable = Class.Thenable = new Class({

	$thenableState: STATE_PENDING,
	$thenableResult: null,
	$thenableReactions: [],

	resolve: function(value){
		resolve(this, value);
		return this;
	},

	reject: function(reason){
		reject(this, reason);
		return this;
	},

	getThenableState: function(){
		switch (this.$thenableState){
			case STATE_PENDING:
				return 'pending';

			case STATE_FULFILLED:
				return 'fulfilled';

			case STATE_REJECTED:
				return 'rejected';
		}
	},

	resetThenable: function(reason){
		reject(this, reason);
		reset(this);
		return this;
	},

	then: function(onFulfilled, onRejected){
		if (typeof onFulfilled !== 'function') onFulfilled = 'Identity';
		if (typeof onRejected !== 'function') onRejected = 'Thrower';

		var thenable = new Thenable();

		this.$thenableReactions.push({
			thenable: thenable,
			fulfillHandler: onFulfilled,
			rejectHandler: onRejected
		});

		if (this.$thenableState !== STATE_PENDING){
			react(this);
		}

		return thenable;
	},

	'catch': function(onRejected){
		return this.then(null, onRejected);
	}

});

Thenable.extend({
	resolve: function(value){
		var thenable;
		if (value instanceof Thenable){
			thenable = value;
		} else {
			thenable = new Thenable();
			resolve(thenable, value);
		}
		return thenable;
	},
	reject: function(reason){
		var thenable = new Thenable();
		reject(thenable, reason);
		return thenable;
	}
});

// Private functions

function resolve(thenable, value){
	if (thenable.$thenableState === STATE_PENDING){
		if (thenable === value){
			reject(thenable, new TypeError('Tried to resolve a thenable with itself.'));
		} else if (value && (typeof value === 'object' || typeof value === 'function')){
			var then;
			try {
				then = value.then;
			} catch (exception){
				reject(thenable, exception);
			}
			if (typeof then === 'function'){
				var resolved = false;
				defer(function(){
					try {
						then.call(
							value,
							function(nextValue){
								if (!resolved){
									resolved = true;
									resolve(thenable, nextValue);
								}
							},
							function(reason){
								if (!resolved){
									resolved = true;
									reject(thenable, reason);
								}
							}
						);
					} catch (exception){
						if (!resolved){
							resolved = true;
							reject(thenable, exception);
						}
					}
				});
			} else {
				fulfill(thenable, value);
			}
		} else {
			fulfill(thenable, value);
		}
	}
}

function fulfill(thenable, value){
	if (thenable.$thenableState === STATE_PENDING){
		thenable.$thenableResult = value;
		thenable.$thenableState = STATE_FULFILLED;

		react(thenable);
	}
}

function reject(thenable, reason){
	if (thenable.$thenableState === STATE_PENDING){
		thenable.$thenableResult = reason;
		thenable.$thenableState = STATE_REJECTED;

		react(thenable);
	}
}

function reset(thenable){
	if (thenable.$thenableState !== STATE_PENDING){
		thenable.$thenableResult = null;
		thenable.$thenableState = STATE_PENDING;
	}
}

function react(thenable){
	var state = thenable.$thenableState,
		result = thenable.$thenableResult,
		reactions = thenable.$thenableReactions,
		type;

	if (state === STATE_FULFILLED){
		thenable.$thenableReactions = [];
		type = 'fulfillHandler';
	} else if (state == STATE_REJECTED){
		thenable.$thenableReactions = [];
		type = 'rejectHandler';
	}

	if (type){
		defer(handle.pass([result, reactions, type]));
	}
}

function handle(result, reactions, type){
	for (var i = 0, l = reactions.length; i < l; ++i){
		var reaction = reactions[i],
			handler = reaction[type];

		if (handler === 'Identity'){
			resolve(reaction.thenable, result);
		} else if (handler === 'Thrower'){
			reject(reaction.thenable, result);
		} else {
			try {
				resolve(reaction.thenable, handler(result));
			} catch (exception){
				reject(reaction.thenable, exception);
			}
		}
	}
}

var defer;
if (typeof process !== 'undefined' && typeof process.nextTick === 'function'){
	defer = process.nextTick;
} else if (typeof setImmediate !== 'undefined'){
	defer = setImmediate;
} else {
	defer = function(fn){
		setTimeout(fn, 0);
	};
}

})();
/*
---

name: Fx

description: Contains the basic animation logic to be extended by all other Fx Classes.

license: MIT-style license.

requires: [Chain, Events, Options, Class.Thenable]

provides: Fx

...
*/

(function(){

var Fx = this.Fx = new Class({

	Implements: [Chain, Events, Options, Class.Thenable],

	options: {
		/*
		onStart: nil,
		onCancel: nil,
		onComplete: nil,
		*/
		fps: 60,
		unit: false,
		duration: 500,
		frames: null,
		frameSkip: true,
		link: 'ignore'
	},

	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(now){
		if (this.options.frameSkip){
			var diff = (this.time != null) ? (now - this.time) : 0, frames = diff / this.frameInterval;
			this.time = now;
			this.frame += frames;
		} else {
			this.frame++;
		}

		if (this.frame < this.frames){
			var delta = this.transition(this.frame / this.frames);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.frame = this.frames;
			this.set(this.compute(this.from, this.to, 1));
			this.stop();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},

	check: function(){
		if (!this.isRunning()) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.pass(arguments, this)); return false;
		}
		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.frame = (this.options.frameSkip) ? 0 : -1;
		this.time = null;
		this.transition = this.getTransition();
		var frames = this.options.frames, fps = this.options.fps, duration = this.options.duration;
		this.duration = Fx.Durations[duration] || duration.toInt();
		this.frameInterval = 1000 / fps;
		this.frames = frames || Math.round(this.duration / this.frameInterval);
		if (this.getThenableState() !== 'pending'){
			this.resetThenable(this.subject);
		}
		this.fireEvent('start', this.subject);
		pushInstance.call(this, fps);
		return this;
	},

	stop: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			if (this.frames == this.frame){
				this.fireEvent('complete', this.subject);
				if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
			} else {
				this.fireEvent('stop', this.subject);
			}
			this.resolve(this.subject === this ? null : this.subject);
		}
		return this;
	},

	cancel: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
			this.frame = this.frames;
			this.fireEvent('cancel', this.subject).clearChain();
			this.reject(this.subject);
		}
		return this;
	},

	pause: function(){
		if (this.isRunning()){
			this.time = null;
			pullInstance.call(this, this.options.fps);
		}
		return this;
	},

	resume: function(){
		if (this.isPaused()) pushInstance.call(this, this.options.fps);
		return this;
	},

	isRunning: function(){
		var list = instances[this.options.fps];
		return list && list.contains(this);
	},

	isPaused: function(){
		return (this.frame < this.frames) && !this.isRunning();
	}

});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};

// global timers

var instances = {}, timers = {};

var loop = function(){
	var now = Date.now();
	for (var i = this.length; i--;){
		var instance = this[i];
		if (instance) instance.step(now);
	}
};

var pushInstance = function(fps){
	var list = instances[fps] || (instances[fps] = []);
	list.push(this);
	if (!timers[fps]) timers[fps] = loop.periodical(Math.round(1000 / fps), list);
};

var pullInstance = function(fps){
	var list = instances[fps];
	if (list){
		list.erase(this);
		if (!list.length && timers[fps]){
			delete instances[fps];
			timers[fps] = clearInterval(timers[fps]);
		}
	}
};

})();
/*
---

name: Element.Style

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires: Element

provides: Element.Style

...
*/

(function(){

var html = document.html, el;

//<ltIE9>
// Check for oldIE, which does not remove styles when they're set to null
el = document.createElement('div');
el.style.color = 'red';
el.style.color = null;
var doesNotRemoveStyles = el.style.color == 'red';

// check for oldIE, which returns border* shorthand styles in the wrong order (color-width-style instead of width-style-color)
var border = '1px solid #123abc';
el.style.border = border;
var returnsBordersInWrongOrder = el.style.border != border;
el = null;
//</ltIE9>

var hasGetComputedStyle = !!window.getComputedStyle,
	supportBorderRadius = document.createElement('div').style.borderRadius != null;

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

var hasOpacity = (html.style.opacity != null),
	hasFilter = (html.style.filter != null),
	reAlpha = /alpha\(opacity=([\d.]+)\)/i;

var setVisibility = function(element, opacity){
	element.store('$opacity', opacity);
	element.style.visibility = opacity > 0 || opacity == null ? 'visible' : 'hidden';
};

//<ltIE9>
var setFilter = function(element, regexp, value){
	var style = element.style,
		filter = style.filter || element.getComputedStyle('filter') || '';
	style.filter = (regexp.test(filter) ? filter.replace(regexp, value) : filter + ' ' + value).trim();
	if (!style.filter) style.removeAttribute('filter');
};
//</ltIE9>

var setOpacity = (hasOpacity ? function(element, opacity){
	element.style.opacity = opacity;
} : (hasFilter ? function(element, opacity){
	if (!element.currentStyle || !element.currentStyle.hasLayout) element.style.zoom = 1;
	if (opacity == null || opacity == 1){
		setFilter(element, reAlpha, '');
		if (opacity == 1 && getOpacity(element) != 1) setFilter(element, reAlpha, 'alpha(opacity=100)');
	} else {
		setFilter(element, reAlpha, 'alpha(opacity=' + (opacity * 100).limit(0, 100).round() + ')');
	}
} : setVisibility));

var getOpacity = (hasOpacity ? function(element){
	var opacity = element.style.opacity || element.getComputedStyle('opacity');
	return (opacity == '') ? 1 : opacity.toFloat();
} : (hasFilter ? function(element){
	var filter = (element.style.filter || element.getComputedStyle('filter')),
		opacity;
	if (filter) opacity = filter.match(reAlpha);
	return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
} : function(element){
	var opacity = element.retrieve('$opacity');
	if (opacity == null) opacity = (element.style.visibility == 'hidden' ? 0 : 1);
	return opacity;
}));

var floatName = (html.style.cssFloat == null) ? 'styleFloat' : 'cssFloat',
	namedPositions = {left: '0%', top: '0%', center: '50%', right: '100%', bottom: '100%'},
	hasBackgroundPositionXY = (html.style.backgroundPositionX != null),
	prefixPattern = /^-(ms)-/;

var camelCase = function(property){
	return property.replace(prefixPattern, '$1-').camelCase();
};

//<ltIE9>
var removeStyle = function(style, property){
	if (property == 'backgroundPosition'){
		style.removeAttribute(property + 'X');
		property += 'Y';
	}
	style.removeAttribute(property);
};
//</ltIE9>

Element.implement({

	getComputedStyle: function(property){
		if (!hasGetComputedStyle && this.currentStyle) return this.currentStyle[camelCase(property)];
		var defaultView = Element.getDocument(this).defaultView,
			computed = defaultView ? defaultView.getComputedStyle(this, null) : null;
		return (computed) ? computed.getPropertyValue((property == floatName) ? 'float' : property.hyphenate()) : '';
	},

	setStyle: function(property, value){
		if (property == 'opacity'){
			if (value != null) value = parseFloat(value);
			setOpacity(this, value);
			return this;
		}
		property = camelCase(property == 'float' ? floatName : property);
		if (typeOf(value) != 'string'){
			var map = (Element.Styles[property] || '@').split(' ');
			value = Array.convert(value).map(function(val, i){
				if (!map[i]) return '';
				return (typeOf(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		//<ltIE9>
		if ((value == '' || value == null) && doesNotRemoveStyles && this.style.removeAttribute){
			removeStyle(this.style, property);
		}
		//</ltIE9>
		return this;
	},

	getStyle: function(property){
		if (property == 'opacity') return getOpacity(this);
		property = camelCase(property == 'float' ? floatName : property);
		if (supportBorderRadius && property.indexOf('borderRadius') != -1){
			return ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map(function(corner){
				return this.style[corner] || '0px';
			}, this).join(' ');
		}
		var result = this.style[property];
		if (!result || property == 'zIndex'){
			if (Element.ShortStyles.hasOwnProperty(property)){
				result = [];
				for (var s in Element.ShortStyles[property]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (hasBackgroundPositionXY && /^backgroundPosition[XY]?$/.test(property)){
			return result.replace(/(top|right|bottom|left)/g, function(position){
				return namedPositions[position];
			}) || '0px';
		}
		if (!result && property == 'backgroundPosition') return '0px 0px';
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (!hasGetComputedStyle && !this.style[property]){
			if ((/^(height|width)$/).test(property) && !(/px$/.test(result))){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if ((/^border(.+)Width|margin|padding/).test(property) && isNaN(parseFloat(result))){
				return '0px';
			}
		}
		//<ltIE9>
		if (returnsBordersInWrongOrder && /^border(Top|Right|Bottom|Left)?$/.test(property) && /^#/.test(result)){
			return result.replace(/^(.+)\s(.+)\s(.+)$/, '$2 $3 $1');
		}
		//</ltIE9>

		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

Element.Styles = {
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundSize: '@px', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@', borderRadius: '@px @px @px @px'
};





Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});

if (hasBackgroundPositionXY) Element.ShortStyles.backgroundPosition = {backgroundPositionX: '@', backgroundPositionY: '@'};
})();
/*
---

name: Fx.CSS

description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

license: MIT-style license.

requires: [Fx, Element.Style]

provides: Fx.CSS

...
*/

Fx.CSS = new Class({

	Extends: Fx,

	//prepares the base from/to object

	prepare: function(element, property, values){
		values = Array.convert(values);
		var from = values[0], to = values[1];
		if (to == null){
			to = from;
			from = element.getStyle(property);
			var unit = this.options.unit;
			// adapted from: https://github.com/ryanmorr/fx/blob/master/fx.js#L299
			if (unit && from && typeof from == 'string' && from.slice(-unit.length) != unit && parseFloat(from) != 0){
				element.setStyle(property, to + unit);
				var value = element.getComputedStyle(property);
				// IE and Opera support pixelLeft or pixelWidth
				if (!(/px$/.test(value))){
					value = element.style[('pixel-' + property).camelCase()];
					if (value == null){
						// adapted from Dean Edwards' http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
						var left = element.style.left;
						element.style.left = to + unit;
						value = element.style.pixelLeft;
						element.style.left = left;
					}
				}
				from = (to || 1) / (parseFloat(value) || 1) * (parseFloat(from) || 0);
				element.setStyle(property, from + unit);
			}
		}
		return {from: this.parse(from), to: this.parse(to)};
	},

	//parses a value into an array

	parse: function(value){
		value = Function.convert(value)();
		value = (typeof value == 'string') ? value.split(' ') : Array.convert(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Object.each(Fx.CSS.Parsers, function(parser){
				if (found) return;
				var parsed = parser.parse(val);
				if (parsed || parsed === 0) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.

	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = Function.convert('fx:css:value');
		return computed;
	},

	//serves the value as settable

	serve: function(value, unit){
		if (typeOf(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element

	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector

	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {}, selectorTest = new RegExp('^' + selector.escapeRegExp() + '$');

		var searchStyles = function(rules){
			Array.each(rules, function(rule){
				if (rule.media){
					searchStyles(rule.rules || rule.cssRules);
					return;
				}
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorTest.test(selectorText)) return;
				Object.each(Element.Styles, function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = ((/^rgb/).test(value)) ? value.rgbToHex() : value;
				});
			});
		};

		Array.each(document.styleSheets, function(sheet){
			var href = sheet.href;
			if (href && href.indexOf('://') > -1 && href.indexOf(document.domain) == -1) return;
			var rules = sheet.rules || sheet.cssRules;
			searchStyles(rules);
		});
		return Fx.CSS.Cache[selector] = to;
	}

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = {

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: Function.convert(false),
		compute: function(zero, one){
			return one;
		},
		serve: function(zero){
			return zero;
		}
	}

};


/*
---

name: Fx.Morph

description: Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

license: MIT-style license.

requires: Fx.CSS

provides: Fx.Morph

...
*/

Fx.Morph = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(now){
		if (typeof now == 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unit);
		return this;
	},

	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},

	start: function(properties){
		if (!this.check(properties)) return this;
		if (typeof properties == 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}

});

Element.Properties.morph = {

	set: function(options){
		this.get('morph').cancel().setOptions(options);
		return this;
	},

	get: function(){
		var morph = this.retrieve('morph');
		if (!morph){
			morph = new Fx.Morph(this, {link: 'cancel'});
			this.store('morph', morph);
		}
		return morph;
	}

};

Element.implement({

	morph: function(props){
		this.get('morph').start(props);
		return this;
	}

});
/*
---

name: Fx.Tween

description: Formerly Fx.Style, effect to transition any CSS property for an element.

license: MIT-style license.

requires: Fx.CSS

provides: [Fx.Tween, Element.fade, Element.highlight]

...
*/

Fx.Tween = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

Element.Properties.tween = {

	set: function(options){
		this.get('tween').cancel().setOptions(options);
		return this;
	},

	get: function(){
		var tween = this.retrieve('tween');
		if (!tween){
			tween = new Fx.Tween(this, {link: 'cancel'});
			this.store('tween', tween);
		}
		return tween;
	}

};

Element.implement({

	tween: function(property, from, to){
		this.get('tween').start(property, from, to);
		return this;
	},

	fade: function(){
		var fade = this.get('tween'), method, args = ['opacity'].append(arguments), toggle;
		if (args[1] == null) args[1] = 'toggle';
		switch (args[1]){
			case 'in': method = 'start'; args[1] = 1; break;
			case 'out': method = 'start'; args[1] = 0; break;
			case 'show': method = 'set'; args[1] = 1; break;
			case 'hide': method = 'set'; args[1] = 0; break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.getStyle('opacity') == 1);
				method = 'start';
				args[1] = flag ? 0 : 1;
				this.store('fade:flag', !flag);
				toggle = true;
				break;
			default: method = 'start';
		}
		if (!toggle) this.eliminate('fade:flag');
		fade[method].apply(fade, args);
		var to = args[args.length - 1];

		if (method == 'set'){
			this.setStyle('visibility', to == 0 ? 'hidden' : 'visible');
		} else if (to != 0){
			if (fade.$chain.length){
				fade.chain(function(){
					this.element.setStyle('visibility', 'visible');
					this.callChain();
				});
			} else {
				this.setStyle('visibility', 'visible');
			}
		} else {
			fade.chain(function(){
				if (this.element.getStyle('opacity')) return;
				this.element.setStyle('visibility', 'hidden');
				this.callChain();
			});
		}

		return this;
	},

	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}

});
/*
---

name: Fx.Transitions

description: Contains a set of advanced transitions to be used with any of the Fx Classes.

license: MIT-style license.

credits:
  - Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.

requires: Fx

provides: Fx.Transitions

...
*/

Fx.implement({

	getTransition: function(){
		var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
		if (typeof trans == 'string'){
			var data = trans.split(':');
			trans = Fx.Transitions;
			trans = trans[data[0]] || trans[data[0].capitalize()];
			if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
		}
		return trans;
	}

});

Fx.Transition = function(transition, params){
	params = Array.convert(params);
	var easeIn = function(pos){
		return transition(pos, params);
	};
	return Object.append(easeIn, {
		easeIn: easeIn,
		easeOut: function(pos){
			return 1 - transition(1 - pos, params);
		},
		easeInOut: function(pos){
			return (pos <= 0.5 ? transition(2 * pos, params) : (2 - transition(2 * (1 - pos), params))) / 2;
		}
	});
};

Fx.Transitions = {

	linear: function(zero){
		return zero;
	}

};



Fx.Transitions.extend = function(transitions){
	for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

	Pow: function(p, x){
		return Math.pow(p, x && x[0] || 6);
	},

	Expo: function(p){
		return Math.pow(2, 8 * (p - 1));
	},

	Circ: function(p){
		return 1 - Math.sin(Math.acos(p));
	},

	Sine: function(p){
		return 1 - Math.cos(p * Math.PI / 2);
	},

	Back: function(p, x){
		x = x && x[0] || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},

	Bounce: function(p){
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
				break;
			}
		}
		return value;
	},

	Elastic: function(p, x){
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x && x[0] || 1) / 3);
	}

});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function(transition, i){
	Fx.Transitions[transition] = new Fx.Transition(function(p){
		return Math.pow(p, i + 2);
	});
});
/*
---

name: Request

description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

license: MIT-style license.

requires: [Object, Element, Chain, Events, Options, Class.Thenable, Browser]

provides: Request

...
*/

(function(){

var empty = function(){},
	progressSupport = ('onprogress' in new Browser.Request);

var Request = this.Request = new Class({

	Implements: [Chain, Events, Options, Class.Thenable],

	options: {/*
		onRequest: function(){},
		onLoadstart: function(event, xhr){},
		onProgress: function(event, xhr){},
		onComplete: function(){},
		onCancel: function(){},
		onSuccess: function(responseText, responseXML){},
		onFailure: function(xhr){},
		onException: function(headerName, value){},
		onTimeout: function(){},
		user: '',
		password: '',
		withCredentials: false,*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false,
		timeout: 0,
		noCache: false
	},

	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.headers = this.options.headers;
	},

	onStateChange: function(){
		var xhr = this.xhr;
		if (xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		Function.attempt(function(){
			var status = xhr.status;
			this.status = (status == 1223) ? 204 : status;
		}.bind(this));
		xhr.onreadystatechange = empty;
		if (progressSupport) xhr.onprogress = xhr.onloadstart = empty;
		if (this.timer){
			clearTimeout(this.timer);
			delete this.timer;
		}

		this.response = {text: this.xhr.responseText || '', xml: this.xhr.responseXML};
		if (this.options.isSuccess.call(this, this.status))
			this.success(this.response.text, this.response.xml);
		else
			this.failure();
	},

	isSuccess: function(){
		var status = this.status;
		return (status >= 200 && status < 300);
	},

	isRunning: function(){
		return !!this.running;
	},

	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return Browser.exec(text);
		return text.stripScripts(this.options.evalScripts);
	},

	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
		this.resolve({text: text, xml: xml});
	},

	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
		this.reject({reason: 'failure', xhr: this.xhr});
	},

	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},

	loadstart: function(event){
		this.fireEvent('loadstart', [event, this.xhr]);
	},

	progress: function(event){
		this.fireEvent('progress', [event, this.xhr]);
	},

	timeout: function(){
		this.fireEvent('timeout', this.xhr);
		this.reject({reason: 'timeout', xhr: this.xhr});
	},

	setHeader: function(name, value){
		this.headers[name] = value;
		return this;
	},

	getHeader: function(name){
		return Function.attempt(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.pass(arguments, this)); return false;
		}
		return false;
	},

	send: function(options){
		if (!this.check(options)) return this;

		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.running = true;

		var type = typeOf(options);
		if (type == 'string' || type == 'element') options = {data: options};

		var old = this.options;
		options = Object.append({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

		switch (typeOf(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Object.toQueryString(data);
		}

		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if (this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if (this.options.urlEncoded && ['post', 'put'].contains(method)){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers['Content-type'] = 'application/x-www-form-urlencoded' + encoding;
		}

		if (!url) url = document.location.pathname;

		var trimPosition = url.lastIndexOf('/');
		if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

		if (this.options.noCache)
			url += (url.indexOf('?') > -1 ? '&' : '?') + String.uniqueID();

		if (data && (method == 'get' || method == 'delete')){
			url += (url.indexOf('?') > -1 ? '&' : '?') + data;
			data = null;
		}

		var xhr = this.xhr;
		if (progressSupport){
			xhr.onloadstart = this.loadstart.bind(this);
			xhr.onprogress = this.progress.bind(this);
		}

		xhr.open(method.toUpperCase(), url, this.options.async, this.options.user, this.options.password);
		if ((this.options.withCredentials) && 'withCredentials' in xhr) xhr.withCredentials = true;

		xhr.onreadystatechange = this.onStateChange.bind(this);

		Object.each(this.headers, function(value, key){
			try {
				xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
				this.reject({reason: 'exception', xhr: xhr, exception: e});
			}
		}, this);

		if (this.getThenableState() !== 'pending'){
			this.resetThenable({reason: 'send'});
		}
		this.fireEvent('request');
		xhr.send(data);
		if (!this.options.async) this.onStateChange();
		else if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		var xhr = this.xhr;
		xhr.abort();
		if (this.timer){
			clearTimeout(this.timer);
			delete this.timer;
		}
		xhr.onreadystatechange = empty;
		if (progressSupport) xhr.onprogress = xhr.onloadstart = empty;
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		this.reject({reason: 'cancel', xhr: xhr});
		return this;
	}

});

var methods = {};
['get', 'post', 'put', 'delete', 'patch', 'head', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].each(function(method){
	methods[method] = function(data){
		var object = {
			method: method
		};
		if (data != null) object.data = data;
		return this.send(object);
	};
});

Request.implement(methods);

Element.Properties.send = {

	set: function(options){
		var send = this.get('send').cancel();
		send.setOptions(options);
		return this;
	},

	get: function(){
		var send = this.retrieve('send');
		if (!send){
			send = new Request({
				data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
			});
			this.store('send', send);
		}
		return send;
	}

};

Element.implement({

	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}

});

})();
/*
---

name: JSON

description: JSON encoder and decoder.

license: MIT-style license.

SeeAlso: <http://www.json.org/>

requires: [Array, String, Number, Function]

provides: JSON

...
*/

if (typeof JSON == 'undefined') this.JSON = {};



(function(){

var special = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'};

var escape = function(chr){
	return special[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
};

JSON.validate = function(string){
	string = string.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
					replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
					replace(/(?:^|:|,)(?:\s*\[)+/g, '');

	return (/^[\],:{}\s]*$/).test(string);
};

JSON.encode = JSON.stringify ? function(obj){
	return JSON.stringify(obj);
} : function(obj){
	if (obj && obj.toJSON) obj = obj.toJSON();

	switch (typeOf(obj)){
		case 'string':
			return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
		case 'array':
			return '[' + obj.map(JSON.encode).clean() + ']';
		case 'object': case 'hash':
			var string = [];
			Object.each(obj, function(value, key){
				var json = JSON.encode(value);
				if (json) string.push(JSON.encode(key) + ':' + json);
			});
			return '{' + string + '}';
		case 'number': case 'boolean': return '' + obj;
		case 'null': return 'null';
	}

	return null;
};

JSON.secure = true;


JSON.decode = function(string, secure){
	if (!string || typeOf(string) != 'string') return null;

	if (secure == null) secure = JSON.secure;
	if (secure){
		if (JSON.parse) return JSON.parse(string);
		if (!JSON.validate(string)) throw new Error('JSON could not decode the input; security is enabled and the value is not secure.');
	}

	return eval('(' + string + ')');
};

})();
/*
---

name: Request.JSON

description: Extends the basic Request Class with additional methods for sending and receiving JSON data.

license: MIT-style license.

requires: [Request, JSON]

provides: Request.JSON

...
*/

Request.JSON = new Class({

	Extends: Request,

	options: {
		/*onError: function(text, error){},*/
		secure: true
	},

	initialize: function(options){
		this.parent(options);
		Object.append(this.headers, {
			'Accept': 'application/json',
			'X-Request': 'JSON'
		});
	},

	success: function(text){
		var json;
		try {
			json = this.response.json = JSON.decode(text, this.options.secure);
		} catch (error){
			this.fireEvent('error', [text, error]);
			return;
		}
		if (json == null){
			this.failure();
		} else {
			this.onSuccess(json, text);
			this.resolve({json: json, text: text});
		}
	}

});
/*
---

script: More.js

name: More

description: MooTools More

license: MIT-style license

authors:
  - Guillermo Rauch
  - Thomas Aylott
  - Scott Kyle
  - Arian Stolwijk
  - Tim Wienk
  - Christoph Pojer
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	version: '1.6.1-dev',
	build: '%build%'
};
/*
---

name: Hash

description: Contains Hash Prototypes. Provides a means for overcoming the JavaScript practical impossibility of extending native Objects.

license: MIT-style license.

requires:
  - Core/Object
  - MooTools.More

provides: [Hash]

...
*/

(function(){

if (this.Hash) return;

var Hash = this.Hash = new Type('Hash', function(object){
	if (typeOf(object) == 'hash') object = Object.clone(object.getClean());
	for (var key in object) this[key] = object[key];
	return this;
});

this.$H = function(object){
	return new Hash(object);
};

Hash.implement({

	forEach: function(fn, bind){
		Object.forEach(this, fn, bind);
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('each', 'forEach');

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		return Object.keyOf(this, value);
	},

	hasValue: function(value){
		return Object.contains(this, value);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == undefined) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		return new Hash(Object.map(this, fn, bind));
	},

	filter: function(fn, bind){
		return new Hash(Object.filter(this, fn, bind));
	},

	every: function(fn, bind){
		return Object.every(this, fn, bind);
	},

	some: function(fn, bind){
		return Object.some(this, fn, bind);
	},

	getKeys: function(){
		return Object.keys(this);
	},

	getValues: function(){
		return Object.values(this);
	},

	toQueryString: function(base){
		return Object.toQueryString(this, base);
	}

});

Hash.alias({indexOf: 'keyOf', contains: 'hasValue'});


})();

/*
---

name: Cookie

description: Class for creating, reading, and deleting browser Cookies.

license: MIT-style license.

credits:
  - Based on the functions by Peter-Paul Koch (http://quirksmode.org).

requires: [Options, Browser]

provides: Cookie

...
*/

var Cookie = new Class({

	Implements: Options,

	options: {
		path: '/',
		domain: false,
		duration: false,
		secure: false,
		document: document,
		encode: true,
		httpOnly: false
	},

	initialize: function(key, options){
		this.key = key;
		this.setOptions(options);
	},

	write: function(value){
		if (this.options.encode) value = encodeURIComponent(value);
		if (this.options.domain) value += '; domain=' + this.options.domain;
		if (this.options.path) value += '; path=' + this.options.path;
		if (this.options.duration){
			var date = new Date();
			date.setTime(date.getTime() + this.options.duration * 24 * 60 * 60 * 1000);
			value += '; expires=' + date.toGMTString();
		}
		if (this.options.secure) value += '; secure';
		if (this.options.httpOnly) value += '; HttpOnly';
		this.options.document.cookie = this.key + '=' + value;
		return this;
	},

	read: function(){
		var value = this.options.document.cookie.match('(?:^|;)\\s*' + this.key.escapeRegExp() + '=([^;]*)');
		return (value) ? decodeURIComponent(value[1]) : null;
	},

	dispose: function(){
		new Cookie(this.key, Object.merge({}, this.options, {duration: -1})).write('');
		return this;
	}

});

Cookie.write = function(key, value, options){
	return new Cookie(key, options).write(value);
};

Cookie.read = function(key){
	return new Cookie(key).read();
};

Cookie.dispose = function(key, options){
	return new Cookie(key, options).dispose();
};
/*
---

name: Element.Dimensions

description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

license: MIT-style license.

credits:
  - Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
  - Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

requires: [Element, Element.Style]

provides: [Element.Dimensions]

...
*/

(function(){

var element = document.createElement('div'),
	child = document.createElement('div');
element.style.height = '0';
element.appendChild(child);
var brokenOffsetParent = (child.offsetParent === element);
element = child = null;

var heightComponents = ['height', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'],
	widthComponents = ['width', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'];

var svgCalculateSize = function(el){

	var gCS = window.getComputedStyle(el),
		bounds = {x: 0, y: 0};

	heightComponents.each(function(css){
		bounds.y += parseFloat(gCS[css]);
	});
	widthComponents.each(function(css){
		bounds.x += parseFloat(gCS[css]);
	});
	return bounds;
};

var isOffset = function(el){
	return styleString(el, 'position') != 'static' || isBody(el);
};

var isOffsetStatic = function(el){
	return isOffset(el) || (/^(?:table|td|th)$/i).test(el.tagName);
};

Element.implement({

	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},

	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();

		//<ltIE9>
		// This if clause is because IE8- cannot calculate getBoundingClientRect of elements with visibility hidden.
		if (!window.getComputedStyle) return {x: this.offsetWidth, y: this.offsetHeight};
		//</ltIE9>

		// This svg section under, calling `svgCalculateSize()`, can be removed when FF fixed the svg size bug.
		// Bug info: https://bugzilla.mozilla.org/show_bug.cgi?id=530985
		if (this.get('tag') == 'svg') return svgCalculateSize(this);

		try {
			var bounds = this.getBoundingClientRect();
			return {x: bounds.width, y: bounds.height};
		} catch (e){
			return {x: 0, y: 0};
		}
	},

	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},

	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},

	getScrolls: function(){
		var element = this.parentNode, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},

	getOffsetParent: brokenOffsetParent ? function(){
		var element = this;
		if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

		var isOffsetCheck = (styleString(element, 'position') == 'static') ? isOffsetStatic : isOffset;
		while ((element = element.parentNode)){
			if (isOffsetCheck(element)) return element;
		}
		return null;
	} : function(){
		var element = this;
		if (isBody(element) || styleString(element, 'position') == 'fixed') return null;

		try {
			return element.offsetParent;
		} catch (e){}
		return null;
	},

	getOffsets: function(){
		var hasGetBoundingClientRect = this.getBoundingClientRect;

		if (hasGetBoundingClientRect){
			var bound = this.getBoundingClientRect(),
				html = document.id(this.getDocument().documentElement),
				htmlScroll = html.getScroll(),
				elemScrolls = this.getScrolls(),
				isFixed = (styleString(this, 'position') == 'fixed');

			return {
				x: bound.left.toFloat() + elemScrolls.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
				y: bound.top.toFloat() + elemScrolls.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
			};
		}

		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;

		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;

			element = element.offsetParent;
		}

		return position;
	},

	getPosition: function(relative){
		var offset = this.getOffsets(),
			scroll = this.getScrolls();
		var position = {
			x: offset.x - scroll.x,
			y: offset.y - scroll.y
		};

		if (relative && (relative = document.id(relative))){
			var relativePosition = relative.getPosition();
			return {x: position.x - relativePosition.x - leftBorder(relative), y: position.y - relativePosition.y - topBorder(relative)};
		}
		return position;
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element),
			size = this.getSize();
		var obj = {
			left: position.x,
			top: position.y,
			width: size.x,
			height: size.y
		};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {
			left: obj.x - styleNumber(this, 'margin-left'),
			top: obj.y - styleNumber(this, 'margin-top')
		};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


[Document, Window].invoke('implement', {

	getSize: function(){
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},

	getScroll: function(){
		var win = this.getWindow(), doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},

	getScrollSize: function(){
		var doc = getCompatElement(this),
			min = this.getSize(),
			body = this.getDocument().body;

		return {x: Math.max(doc.scrollWidth, body.scrollWidth, min.x), y: Math.max(doc.scrollHeight, body.scrollHeight, min.y)};
	},

	getPosition: function(){
		return {x: 0, y: 0};
	},

	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}

});

// private methods

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
}



function topBorder(element){
	return styleNumber(element, 'border-top-width');
}

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
}

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
}

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
}

})();

//aliases
Element.alias({position: 'setPosition'}); //compatability

[Window, Document, Element].invoke('implement', {

	getHeight: function(){
		return this.getSize().y;
	},

	getWidth: function(){
		return this.getSize().x;
	},

	getScrollTop: function(){
		return this.getScroll().y;
	},

	getScrollLeft: function(){
		return this.getScroll().x;
	},

	getScrollHeight: function(){
		return this.getScrollSize().y;
	},

	getScrollWidth: function(){
		return this.getScrollSize().x;
	},

	getTop: function(){
		return this.getPosition().y;
	},

	getLeft: function(){
		return this.getPosition().x;
	}

});
/*
---

script: Fx.Scroll.js

name: Fx.Scroll

description: Effect to smoothly scroll any element, including the window.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Fx
  - Core/Element.Event
  - Core/Element.Dimensions
  - MooTools.More

provides: [Fx.Scroll]

...
*/

(function(){

Fx.Scroll = new Class({

	Extends: Fx,

	options: {
		offset: {x: 0, y: 0},
		wheelStops: true
	},

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);

		if (typeOf(this.element) != 'element') this.element = document.id(this.element.getDocument().body);

		if (this.options.wheelStops){
			var stopper = this.element,
				cancel = this.cancel.pass(false, this);
			this.addEvent('start', function(){
				stopper.addEvent('mousewheel', cancel);
			}, true);
			this.addEvent('complete', function(){
				stopper.removeEvent('mousewheel', cancel);
			}, true);
		}
	},

	set: function(){
		var now = Array.flatten(arguments);
		this.element.scrollTo(now[0], now[1]);
		return this;
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(x, y){
		if (!this.check(x, y)) return this;
		var scroll = this.element.getScroll();
		return this.parent([scroll.x, scroll.y], [x, y]);
	},

	calculateScroll: function(x, y){
		var element = this.element,
			scrollSize = element.getScrollSize(),
			scroll = element.getScroll(),
			size = element.getSize(),
			offset = this.options.offset,
			values = {x: x, y: y};

		for (var z in values){
			if (!values[z] && values[z] !== 0) values[z] = scroll[z];
			if (typeOf(values[z]) != 'number') values[z] = scrollSize[z] - size[z];
			values[z] += offset[z];
		}

		return [values.x, values.y];
	},

	toTop: function(){
		return this.start.apply(this, this.calculateScroll(false, 0));
	},

	toLeft: function(){
		return this.start.apply(this, this.calculateScroll(0, false));
	},

	toRight: function(){
		return this.start.apply(this, this.calculateScroll('right', false));
	},

	toBottom: function(){
		return this.start.apply(this, this.calculateScroll(false, 'bottom'));
	},

	toElement: function(el, axes){
		axes = axes ? Array.convert(axes) : ['x', 'y'];
		var scroll = isBody(this.element) ? {x: 0, y: 0} : this.element.getScroll();
		var position = Object.map(document.id(el).getPosition(this.element), function(value, axis){
			return axes.contains(axis) ? value + scroll[axis] : false;
		});
		return this.start.apply(this, this.calculateScroll(position.x, position.y));
	},

	toElementEdge: function(el, axes, offset){
		axes = axes ? Array.convert(axes) : ['x', 'y'];
		el = document.id(el);
		var to = {},
			position = el.getPosition(this.element),
			size = el.getSize(),
			scroll = this.element.getScroll(),
			containerSize = this.element.getSize(),
			edge = {
				x: position.x + size.x,
				y: position.y + size.y
			};

		['x', 'y'].each(function(axis){
			if (axes.contains(axis)){
				if (edge[axis] > scroll[axis] + containerSize[axis]) to[axis] = edge[axis] - containerSize[axis];
				if (position[axis] < scroll[axis]) to[axis] = position[axis];
			}
			if (to[axis] == null) to[axis] = scroll[axis];
			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);

		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	},

	toElementCenter: function(el, axes, offset){
		axes = axes ? Array.convert(axes) : ['x', 'y'];
		el = document.id(el);
		var to = {},
			position = el.getPosition(this.element),
			size = el.getSize(),
			scroll = this.element.getScroll(),
			containerSize = this.element.getSize();

		['x', 'y'].each(function(axis){
			if (axes.contains(axis)){
				to[axis] = position[axis] - (containerSize[axis] - size[axis]) / 2;
			}
			if (to[axis] == null) to[axis] = scroll[axis];
			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);

		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	}

});



function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
}

})();
/*
---

script: Fx.Slide.js

name: Fx.Slide

description: Effect to slide an element in and out of view.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Fx
  - Core/Element.Style
  - MooTools.More

provides: [Fx.Slide]

...
*/

Fx.Slide = new Class({

	Extends: Fx,

	options: {
		mode: 'vertical',
		wrapper: false,
		hideOverflow: true,
		resetHeight: false
	},

	initialize: function(element, options){
		element = this.element = this.subject = document.id(element);
		this.parent(options);
		options = this.options;

		var wrapper = element.retrieve('wrapper'),
			styles = element.getStyles('margin', 'position', 'overflow');

		if (options.hideOverflow) styles = Object.append(styles, {overflow: 'hidden'});
		if (options.wrapper) wrapper = document.id(options.wrapper).setStyles(styles);

		if (!wrapper) wrapper = new Element('div', {
			styles: styles
		}).wraps(element);

		element.store('wrapper', wrapper).setStyle('margin', 0);
		if (element.getStyle('overflow') == 'visible') element.setStyle('overflow', 'hidden');

		this.now = [];
		this.open = true;
		this.wrapper = wrapper;

		this.addEvent('complete', function(){
			this.open = (wrapper['offset' + this.layout.capitalize()] != 0);
			if (this.open && this.options.resetHeight) wrapper.setStyle('height', '');
		}, true);
	},

	vertical: function(){
		this.margin = 'margin-top';
		this.layout = 'height';
		this.offset = this.element.offsetHeight;
	},

	horizontal: function(){
		this.margin = 'margin-left';
		this.layout = 'width';
		this.offset = this.element.offsetWidth;
	},

	set: function(now){
		this.element.setStyle(this.margin, now[0]);
		this.wrapper.setStyle(this.layout, now[1]);
		return this;
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(how, mode){
		if (!this.check(how, mode)) return this;
		this[mode || this.options.mode]();

		var margin = this.element.getStyle(this.margin).toInt(),
			layout = this.wrapper.getStyle(this.layout).toInt(),
			caseIn = [[margin, layout], [0, this.offset]],
			caseOut = [[margin, layout], [-this.offset, 0]],
			start;

		switch (how){
			case 'in': start = caseIn; break;
			case 'out': start = caseOut; break;
			case 'toggle': start = (layout == 0) ? caseIn : caseOut;
		}
		return this.parent(start[0], start[1]);
	},

	slideIn: function(mode){
		return this.start('in', mode);
	},

	slideOut: function(mode){
		return this.start('out', mode);
	},

	hide: function(mode){
		this[mode || this.options.mode]();
		this.open = false;
		return this.set([-this.offset, 0]);
	},

	show: function(mode){
		this[mode || this.options.mode]();
		this.open = true;
		return this.set([0, this.offset]);
	},

	toggle: function(mode){
		return this.start('toggle', mode);
	}

});

Element.Properties.slide = {

	set: function(options){
		this.get('slide').cancel().setOptions(options);
		return this;
	},

	get: function(){
		var slide = this.retrieve('slide');
		if (!slide){
			slide = new Fx.Slide(this, {link: 'cancel'});
			this.store('slide', slide);
		}
		return slide;
	}

};

Element.implement({

	slide: function(how, mode){
		how = how || 'toggle';
		var slide = this.get('slide'), toggle;
		switch (how){
			case 'hide': slide.hide(mode); break;
			case 'show': slide.show(mode); break;
			case 'toggle':
				var flag = this.retrieve('slide:flag', slide.open);
				slide[flag ? 'slideOut' : 'slideIn'](mode);
				this.store('slide:flag', !flag);
				toggle = true;
				break;
			default: slide.start(how, mode);
		}
		if (!toggle) this.eliminate('slide:flag');
		return this;
	}

});
/*
---

script: String.QueryString.js

name: String.QueryString

description: Methods for dealing with URI query strings.

license: MIT-style license

authors:
  - Sebastian Markbåge
  - Aaron Newton
  - Lennart Pilon
  - Valerio Proietti

requires:
  - Core/Array
  - Core/String
  - MooTools.More

provides: [String.QueryString]

...
*/

(function(){

/**
 * decodeURIComponent doesn't do the correct thing with query parameter keys or
 * values. Specifically, it leaves '+' as '+' when it should be converting them
 * to spaces as that's the specification. When browsers submit HTML forms via
 * GET, the values are encoded using 'application/x-www-form-urlencoded'
 * which converts spaces to '+'.
 *
 * See: http://unixpapa.com/js/querystring.html for a description of the
 * problem.
 */
var decodeComponent = function(str){
	return decodeURIComponent(str.replace(/\+/g, ' '));
};

String.implement({

	parseQueryString: function(decodeKeys, decodeValues){
		if (decodeKeys == null) decodeKeys = true;
		if (decodeValues == null) decodeValues = true;

		var vars = this.split(/[&;]/),
			object = {};
		if (!vars.length) return object;

		vars.each(function(val){
			var index = val.indexOf('=') + 1,
				value = index ? val.substr(index) : '',
				keys = index ? val.substr(0, index - 1).match(/([^\]\[]+|(\B)(?=\]))/g) : [val],
				obj = object;
			if (!keys) return;
			if (decodeValues) value = decodeComponent(value);
			keys.each(function(key, i){
				if (decodeKeys) key = decodeComponent(key);
				var current = obj[key];

				if (i < keys.length - 1) obj = obj[key] = current || {};
				else if (typeOf(current) == 'array') current.push(value);
				else obj[key] = current != null ? [current, value] : value;
			});
		});

		return object;
	},

	cleanQueryString: function(method){
		return this.split('&').filter(function(val){
			var index = val.indexOf('='),
				key = index < 0 ? '' : val.substr(0, index),
				value = val.substr(index + 1);

			return method ? method.call(null, key, value) : (value || value === 0);
		}).join('&');
	}

});

})();
/*
---

script: URI.js

name: URI

description: Provides methods useful in managing the window location and uris.

license: MIT-style license

authors:
  - Sebastian Markbåge
  - Aaron Newton

requires:
  - Core/Object
  - Core/Class
  - Core/Class.Extras
  - Core/Element
  - String.QueryString

provides: [URI]

...
*/

(function(){

var toString = function(){
	return this.get('value');
};

var URI = this.URI = new Class({

	Implements: Options,

	options: {
		/*base: false*/
	},

	regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@\/]*):?([^:@\/]*))?@)?(\[[A-Fa-f0-9:]+\]|[^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
	parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
	schemes: {http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0},

	initialize: function(uri, options){
		this.setOptions(options);
		var base = this.options.base || URI.base;
		if (!uri) uri = base;

		if (uri && uri.parsed) this.parsed = Object.clone(uri.parsed);
		else this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
	},

	parse: function(value, base){
		var bits = value.match(this.regex);
		if (!bits) return false;
		bits.shift();
		return this.merge(bits.associate(this.parts), base);
	},

	merge: function(bits, base){
		if ((!bits || !bits.scheme) && (!base || !base.scheme)) return false;
		if (base){
			this.parts.every(function(part){
				if (bits[part]) return false;
				bits[part] = base[part] || '';
				return true;
			});
		}
		bits.port = bits.port || this.schemes[bits.scheme.toLowerCase()];
		bits.directory = bits.directory ? this.parseDirectory(bits.directory, base ? base.directory : '') : '/';
		return bits;
	},

	parseDirectory: function(directory, baseDirectory){
		directory = (directory.substr(0, 1) == '/' ? '' : (baseDirectory || '/')) + directory;
		if (!directory.test(URI.regs.directoryDot)) return directory;
		var result = [];
		directory.replace(URI.regs.endSlash, '').split('/').each(function(dir){
			if (dir == '..' && result.length > 0) result.pop();
			else if (dir != '.') result.push(dir);
		});
		return result.join('/') + '/';
	},

	combine: function(bits){
		return bits.value || bits.scheme + '://' +
			(bits.user ? bits.user + (bits.password ? ':' + bits.password : '') + '@' : '') +
			(bits.host || '') + (bits.port && bits.port != this.schemes[bits.scheme] ? ':' + bits.port : '') +
			(bits.directory || '/') + (bits.file || '') +
			(bits.query ? '?' + bits.query : '') +
			(bits.fragment ? '#' + bits.fragment : '');
	},

	set: function(part, value, base){
		if (part == 'value'){
			var scheme = value.match(URI.regs.scheme);
			if (scheme) scheme = scheme[1];
			if (scheme && this.schemes[scheme.toLowerCase()] == null) this.parsed = { scheme: scheme, value: value };
			else this.parsed = this.parse(value, (base || this).parsed) || (scheme ? { scheme: scheme, value: value } : { value: value });
		} else if (part == 'data'){
			this.setData(value);
		} else {
			this.parsed[part] = value;
		}
		return this;
	},

	get: function(part, base){
		switch (part){
			case 'value': return this.combine(this.parsed, base ? base.parsed : false);
			case 'data' : return this.getData();
		}
		return this.parsed[part] || '';
	},

	go: function(){
		document.location.href = this.toString();
	},

	toURI: function(){
		return this;
	},

	getData: function(key, part){
		var qs = this.get(part || 'query');
		if (!(qs || qs === 0)) return key ? null : {};
		var obj = qs.parseQueryString();
		return key ? obj[key] : obj;
	},

	setData: function(values, merge, part){
		if (typeof values == 'string'){
			var data = this.getData();
			data[arguments[0]] = arguments[1];
			values = data;
		} else if (merge){
			values = Object.merge(this.getData(null, part), values);
		}
		return this.set(part || 'query', Object.toQueryString(values));
	},

	clearData: function(part){
		return this.set(part || 'query', '');
	},

	toString: toString,
	valueOf: toString

});

URI.regs = {
	endSlash: /\/$/,
	scheme: /^(\w+):/,
	directoryDot: /\.\/|\.$/
};

URI.base = new URI(Array.convert(document.getElements('base[href]', true)).getLast(), {base: document.location});

String.implement({

	toURI: function(options){
		return new URI(this, options);
	}

});

})();
/*
---

script: Tips.js

name: Tips

description: Class for creating nice tips that follow the mouse cursor when hovering an element.

license: MIT-style license

authors:
  - Valerio Proietti
  - Christoph Pojer
  - Luis Merino

requires:
  - Core/Options
  - Core/Events
  - Core/Element.Event
  - Core/Element.Style
  - Core/Element.Dimensions
  - MooTools.More

provides: [Tips]

...
*/

(function(){

var read = function(option, element){
	return (option) ? (typeOf(option) == 'function' ? option(element) : element.get(option)) : '';
};

var Tips = this.Tips = new Class({

	Implements: [Events, Options],

	options: {/*
		id: null,
		onAttach: function(element){},
		onDetach: function(element){},
		onBound: function(coords){},*/
		onShow: function(){
			this.tip.setStyle('display', 'block');
		},
		onHide: function(){
			this.tip.setStyle('display', 'none');
		},
		title: 'title',
		text: function(element){
			return element.get('rel') || element.get('href');
		},
		showDelay: 100,
		hideDelay: 100,
		className: 'tip-wrap',
		offset: {x: 16, y: 16},
		windowPadding: {x:0, y:0},
		fixed: false,
		waiAria: true,
		hideEmpty: false
	},

	initialize: function(){
		var params = Array.link(arguments, {
			options: Type.isObject,
			elements: function(obj){
				return obj != null;
			}
		});
		this.setOptions(params.options);
		if (params.elements) this.attach(params.elements);
		this.container = new Element('div', {'class': 'tip'});

		if (this.options.id){
			this.container.set('id', this.options.id);
			if (this.options.waiAria) this.attachWaiAria();
		}
	},

	toElement: function(){
		if (this.tip) return this.tip;

		this.tip = new Element('div', {
			'class': this.options.className,
			styles: {
				position: 'absolute',
				top: 0,
				left: 0,
				display: 'none'
			}
		}).adopt(
			new Element('div', {'class': 'tip-top'}),
			this.container,
			new Element('div', {'class': 'tip-bottom'})
		);

		return this.tip;
	},

	attachWaiAria: function(){
		var id = this.options.id;
		this.container.set('role', 'tooltip');

		if (!this.waiAria){
			this.waiAria = {
				show: function(element){
					if (id) element.set('aria-describedby', id);
					this.container.set('aria-hidden', 'false');
				},
				hide: function(element){
					if (id) element.erase('aria-describedby');
					this.container.set('aria-hidden', 'true');
				}
			};
		}
		this.addEvents(this.waiAria);
	},

	detachWaiAria: function(){
		if (this.waiAria){
			this.container.erase('role');
			this.container.erase('aria-hidden');
			this.removeEvents(this.waiAria);
		}
	},

	attach: function(elements){
		$$(elements).each(function(element){
			var title = read(this.options.title, element),
				text = read(this.options.text, element);

			element.set('title', '').store('tip:native', title).retrieve('tip:title', title);
			element.retrieve('tip:text', text);
			this.fireEvent('attach', [element]);

			var events = ['enter', 'leave'];
			if (!this.options.fixed) events.push('move');

			events.each(function(value){
				var event = element.retrieve('tip:' + value);
				if (!event) event = function(event){
					this['element' + value.capitalize()].apply(this, [event, element]);
				}.bind(this);

				element.store('tip:' + value, event).addEvent('mouse' + value, event);
			}, this);
		}, this);

		return this;
	},

	detach: function(elements){
		$$(elements).each(function(element){
			['enter', 'leave', 'move'].each(function(value){
				element.removeEvent('mouse' + value, element.retrieve('tip:' + value)).eliminate('tip:' + value);
			});

			this.fireEvent('detach', [element]);

			if (this.options.title == 'title'){ // This is necessary to check if we can revert the title
				var original = element.retrieve('tip:native');
				if (original) element.set('title', original);
			}
		}, this);

		return this;
	},

	elementEnter: function(event, element){
		clearTimeout(this.timer);
		this.timer = (function(){
			this.container.empty();
			var showTip = !this.options.hideEmpty;
			['title', 'text'].each(function(value){
				var content = element.retrieve('tip:' + value);
				var div = this['_' + value + 'Element'] = new Element('div', {
					'class': 'tip-' + value
				}).inject(this.container);
				if (content){
					this.fill(div, content);
					showTip = true;
				}
			}, this);
			if (showTip){
				this.show(element);
			} else {
				this.hide(element);
			}
			this.position((this.options.fixed) ? {page: element.getPosition()} : event);
		}).delay(this.options.showDelay, this);
	},

	elementLeave: function(event, element){
		clearTimeout(this.timer);
		this.timer = this.hide.delay(this.options.hideDelay, this, element);
		this.fireForParent(event, element);
	},

	setTitle: function(title){
		if (this._titleElement){
			this._titleElement.empty();
			this.fill(this._titleElement, title);
		}
		return this;
	},

	setText: function(text){
		if (this._textElement){
			this._textElement.empty();
			this.fill(this._textElement, text);
		}
		return this;
	},

	fireForParent: function(event, element){
		element = element.getParent();
		if (!element || element == document.body) return;
		if (element.retrieve('tip:enter')) element.fireEvent('mouseenter', event);
		else this.fireForParent(event, element);
	},

	elementMove: function(event, element){
		this.position(event);
	},

	position: function(event){
		if (!this.tip) document.id(this);

		var size = window.getSize(), scroll = window.getScroll(),
			tip = {x: this.tip.offsetWidth, y: this.tip.offsetHeight},
			props = {x: 'left', y: 'top'},
			bounds = {y: false, x2: false, y2: false, x: false},
			obj = {};

		for (var z in props){
			obj[props[z]] = event.page[z] + this.options.offset[z];
			if (obj[props[z]] < 0) bounds[z] = true;
			if ((obj[props[z]] + tip[z] - scroll[z]) > size[z] - this.options.windowPadding[z]){
				obj[props[z]] = event.page[z] - this.options.offset[z] - tip[z];
				bounds[z+'2'] = true;
			}
		}

		this.fireEvent('bound', bounds);
		this.tip.setStyles(obj);
	},

	fill: function(element, contents){
		if (typeof contents == 'string') element.set('html', contents);
		else element.adopt(contents);
	},

	show: function(element){
		if (!this.tip) document.id(this);
		if (!this.tip.getParent()) this.tip.inject(document.body);
		this.fireEvent('show', [this.tip, element]);
	},

	hide: function(element){
		if (!this.tip) document.id(this);
		this.fireEvent('hide', [this.tip, element]);
	}

});

})();
/*
---

script: Class.Occlude.js

name: Class.Occlude

description: Prevents a class from being applied to a DOM element twice.

license: MIT-style license.

authors:
  - Aaron Newton

requires:
  - Core/Class
  - Core/Element
  - MooTools.More

provides: [Class.Occlude]

...
*/

Class.Occlude = new Class({

	occlude: function(property, element){
		element = document.id(element || this.element);
		var instance = element.retrieve(property || this.property);
		if (instance && !this.occluded)
			return (this.occluded = instance);

		this.occluded = false;
		element.store(property || this.property, this);
		return this.occluded;
	}

});
/*
---

script: Elements.From.js

name: Elements.From

description: Returns a collection of elements from a string of html.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/String
  - Core/Element
  - MooTools.More

provides: [Elements.from, Elements.From]

...
*/

Elements.from = function(text, excludeScripts){
	if (excludeScripts || excludeScripts == null) text = text.stripScripts();

	var container, match = text.match(/^\s*(?:<!--.*?-->\s*)*<(t[dhr]|tbody|tfoot|thead)/i);

	if (match){
		container = new Element('table');
		var tag = match[1].toLowerCase();
		if (['td', 'th', 'tr'].contains(tag)){
			container = new Element('tbody').inject(container);
			if (tag != 'tr') container = new Element('tr').inject(container);
		}
	}

	return (container || new Element('div')).set('html', text).getChildren();
};
/*
---

script: Drag.js

name: Drag

description: The base Drag Class. Can be used to drag and resize Elements using mouse events.

license: MIT-style license

authors:
  - Valerio Proietti
  - Tom Occhinno
  - Jan Kassens

requires:
  - Core/Events
  - Core/Options
  - Core/Element.Event
  - Core/Element.Style
  - Core/Element.Dimensions
  - MooTools.More

provides: [Drag]
...

*/
(function(){

var Drag = this.Drag = new Class({

	Implements: [Events, Options],

	options: {/*
		onBeforeStart: function(thisElement){},
		onStart: function(thisElement, event){},
		onSnap: function(thisElement){},
		onDrag: function(thisElement, event){},
		onCancel: function(thisElement){},
		onComplete: function(thisElement, event){},*/
		snap: 6,
		unit: 'px',
		grid: false,
		style: true,
		limit: false,
		handle: false,
		invert: false,
		unDraggableTags: ['button', 'input', 'a', 'textarea', 'select', 'option'],
		preventDefault: false,
		stopPropagation: false,
		compensateScroll: false,
		modifiers: {x: 'left', y: 'top'}
	},

	initialize: function(){
		var params = Array.link(arguments, {
			'options': Type.isObject,
			'element': function(obj){
				return obj != null;
			}
		});

		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = typeOf(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {'now': {}, 'pos': {}};
		this.value = {'start': {}, 'now': {}};
		this.offsetParent = (function(el){
			var offsetParent = el.getOffsetParent();
			var isBody = !offsetParent || (/^(?:body|html)$/i).test(offsetParent.tagName);
			return isBody ? window : document.id(offsetParent);
		})(this.element);
		this.selection = 'selectstart' in document ? 'selectstart' : 'mousedown';

		this.compensateScroll = {start: {}, diff: {}, last: {}};

		if ('ondragstart' in document && !('FileReader' in window) && !Drag.ondragstartFixed){
			document.ondragstart = Function.convert(false);
			Drag.ondragstartFixed = true;
		}

		this.bound = {
			start: this.start.bind(this),
			check: this.check.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			cancel: this.cancel.bind(this),
			eventStop: Function.convert(false),
			scrollListener: this.scrollListener.bind(this)
		};
		this.attach();
	},

	attach: function(){
		this.handles.addEvent('mousedown', this.bound.start);
		this.handles.addEvent('touchstart', this.bound.start);
		if (this.options.compensateScroll) this.offsetParent.addEvent('scroll', this.bound.scrollListener);
		return this;
	},

	detach: function(){
		this.handles.removeEvent('mousedown', this.bound.start);
		this.handles.removeEvent('touchstart', this.bound.start);
		if (this.options.compensateScroll) this.offsetParent.removeEvent('scroll', this.bound.scrollListener);
		return this;
	},

	scrollListener: function(){

		if (!this.mouse.start) return;
		var newScrollValue = this.offsetParent.getScroll();

		if (this.element.getStyle('position') == 'absolute'){
			var scrollDiff = this.sumValues(newScrollValue, this.compensateScroll.last, -1);
			this.mouse.now = this.sumValues(this.mouse.now, scrollDiff, 1);
		} else {
			this.compensateScroll.diff = this.sumValues(newScrollValue, this.compensateScroll.start, -1);
		}
		if (this.offsetParent != window) this.compensateScroll.diff = this.sumValues(this.compensateScroll.start, newScrollValue, -1);
		this.compensateScroll.last = newScrollValue;
		this.render(this.options);
	},

	sumValues: function(alpha, beta, op){
		var sum = {}, options = this.options;
		for (var z in options.modifiers){
			if (!options.modifiers[z]) continue;
			sum[z] = alpha[z] + beta[z] * op;
		}
		return sum;
	},

	start: function(event){
		if (this.options.unDraggableTags.contains(event.target.get('tag'))) return;

		var options = this.options;

		if (event.rightClick) return;

		if (options.preventDefault) event.preventDefault();
		if (options.stopPropagation) event.stopPropagation();
		this.compensateScroll.start = this.compensateScroll.last = this.offsetParent.getScroll();
		this.compensateScroll.diff = {x: 0, y: 0};
		this.mouse.start = event.page;
		this.fireEvent('beforeStart', this.element);

		var limit = options.limit;
		this.limit = {x: [], y: []};

		var z, coordinates, offsetParent = this.offsetParent == window ? null : this.offsetParent;
		for (z in options.modifiers){
			if (!options.modifiers[z]) continue;

			var style = this.element.getStyle(options.modifiers[z]);

			// Some browsers (IE and Opera) don't always return pixels.
			if (style && !style.match(/px$/)){
				if (!coordinates) coordinates = this.element.getCoordinates(offsetParent);
				style = coordinates[options.modifiers[z]];
			}

			if (options.style) this.value.now[z] = (style || 0).toInt();
			else this.value.now[z] = this.element[options.modifiers[z]];

			if (options.invert) this.value.now[z] *= -1;

			this.mouse.pos[z] = event.page[z] - this.value.now[z];

			if (limit && limit[z]){
				var i = 2;
				while (i--){
					var limitZI = limit[z][i];
					if (limitZI || limitZI === 0) this.limit[z][i] = (typeof limitZI == 'function') ? limitZI() : limitZI;
				}
			}
		}

		if (typeOf(this.options.grid) == 'number') this.options.grid = {
			x: this.options.grid,
			y: this.options.grid
		};

		var events = {
			mousemove: this.bound.check,
			mouseup: this.bound.cancel,
			touchmove: this.bound.check,
			touchend: this.bound.cancel
		};
		events[this.selection] = this.bound.eventStop;
		this.document.addEvents(events);
	},

	check: function(event){
		if (this.options.preventDefault) event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if (distance > this.options.snap){
			this.cancel();
			this.document.addEvents({
				mousemove: this.bound.drag,
				mouseup: this.bound.stop,
				touchmove: this.bound.drag,
				touchend: this.bound.stop
			});
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},

	drag: function(event){
		var options = this.options;
		if (options.preventDefault) event.preventDefault();
		this.mouse.now = this.sumValues(event.page, this.compensateScroll.diff, -1);

		this.render(options);
		this.fireEvent('drag', [this.element, event]);
	},

	render: function(options){
		for (var z in options.modifiers){
			if (!options.modifiers[z]) continue;
			this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];

			if (options.invert) this.value.now[z] *= -1;
			if (options.limit && this.limit[z]){
				if ((this.limit[z][1] || this.limit[z][1] === 0) && (this.value.now[z] > this.limit[z][1])){
					this.value.now[z] = this.limit[z][1];
				} else if ((this.limit[z][0] || this.limit[z][0] === 0) && (this.value.now[z] < this.limit[z][0])){
					this.value.now[z] = this.limit[z][0];
				}
			}
			if (options.grid[z]) this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0]||0)) % options.grid[z]);
			if (options.style) this.element.setStyle(options.modifiers[z], this.value.now[z] + options.unit);
			else this.element[options.modifiers[z]] = this.value.now[z];
		}
	},

	cancel: function(event){
		this.document.removeEvents({
			mousemove: this.bound.check,
			mouseup: this.bound.cancel,
			touchmove: this.bound.check,
			touchend: this.bound.cancel
		});
		if (event){
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},

	stop: function(event){
		var events = {
			mousemove: this.bound.drag,
			mouseup: this.bound.stop,
			touchmove: this.bound.drag,
			touchend: this.bound.stop
		};
		events[this.selection] = this.bound.eventStop;
		this.document.removeEvents(events);
		this.mouse.start = null;
		if (event) this.fireEvent('complete', [this.element, event]);
	}

});

})();


Element.implement({

	makeResizable: function(options){
		var drag = new Drag(this, Object.merge({
			modifiers: {
				x: 'width',
				y: 'height'
			}
		}, options));

		this.store('resizer', drag);
		return drag.addEvent('drag', function(){
			this.fireEvent('resize', drag);
		}.bind(this));
	}

});
/*
---

script: Drag.Move.js

name: Drag.Move

description: A Drag extension that provides support for the constraining of draggables to containers and droppables.

license: MIT-style license

authors:
  - Valerio Proietti
  - Tom Occhinno
  - Jan Kassens
  - Aaron Newton
  - Scott Kyle

requires:
  - Core/Element.Dimensions
  - Drag

provides: [Drag.Move]

...
*/

Drag.Move = new Class({

	Extends: Drag,

	options: {/*
		onEnter: function(thisElement, overed){},
		onLeave: function(thisElement, overed){},
		onDrop: function(thisElement, overed, event){},*/
		droppables: [],
		container: false,
		precalculate: false,
		includeMargins: true,
		checkDroppables: true
	},

	initialize: function(element, options){
		this.parent(element, options);
		element = this.element;

		this.droppables = $$(this.options.droppables);
		this.setContainer(this.options.container);

		if (this.options.style){
			if (this.options.modifiers.x == 'left' && this.options.modifiers.y == 'top'){
				var parent = element.getOffsetParent(),
					styles = element.getStyles('left', 'top');
				if (parent && (styles.left == 'auto' || styles.top == 'auto')){
					element.setPosition(element.getPosition(parent));
				}
			}

			if (element.getStyle('position') == 'static') element.setStyle('position', 'absolute');
		}

		this.addEvent('start', this.checkDroppables, true);
		this.overed = null;
	},

	setContainer: function(container){
		this.container = document.id(container);
		if (this.container && typeOf(this.container) != 'element'){
			this.container = document.id(this.container.getDocument().body);
		}
	},

	start: function(event){
		if (this.container) this.options.limit = this.calculateLimit();

		if (this.options.precalculate){
			this.positions = this.droppables.map(function(el){
				return el.getCoordinates();
			});
		}

		this.parent(event);
	},

	calculateLimit: function(){
		var element = this.element,
			container = this.container,

			offsetParent = document.id(element.getOffsetParent()) || document.body,
			containerCoordinates = container.getCoordinates(offsetParent),
			elementMargin = {},
			elementBorder = {},
			containerMargin = {},
			containerBorder = {},
			offsetParentPadding = {},
			offsetScroll = offsetParent.getScroll();

		['top', 'right', 'bottom', 'left'].each(function(pad){
			elementMargin[pad] = element.getStyle('margin-' + pad).toInt();
			elementBorder[pad] = element.getStyle('border-' + pad).toInt();
			containerMargin[pad] = container.getStyle('margin-' + pad).toInt();
			containerBorder[pad] = container.getStyle('border-' + pad).toInt();
			offsetParentPadding[pad] = offsetParent.getStyle('padding-' + pad).toInt();
		}, this);

		var width = element.offsetWidth + elementMargin.left + elementMargin.right,
			height = element.offsetHeight + elementMargin.top + elementMargin.bottom,
			left = 0 + offsetScroll.x,
			top = 0 + offsetScroll.y,
			right = containerCoordinates.right - containerBorder.right - width + offsetScroll.x,
			bottom = containerCoordinates.bottom - containerBorder.bottom - height + offsetScroll.y;

		if (this.options.includeMargins){
			left += elementMargin.left;
			top += elementMargin.top;
		} else {
			right += elementMargin.right;
			bottom += elementMargin.bottom;
		}

		if (element.getStyle('position') == 'relative'){
			var coords = element.getCoordinates(offsetParent);
			coords.left -= element.getStyle('left').toInt();
			coords.top -= element.getStyle('top').toInt();

			left -= coords.left;
			top -= coords.top;
			if (container.getStyle('position') != 'relative'){
				left += containerBorder.left;
				top += containerBorder.top;
			}
			right += elementMargin.left - coords.left;
			bottom += elementMargin.top - coords.top;

			if (container != offsetParent){
				left += containerMargin.left + offsetParentPadding.left;
				if (!offsetParentPadding.left && left < 0) left = 0;
				top += offsetParent == document.body ? 0 : containerMargin.top + offsetParentPadding.top;
				if (!offsetParentPadding.top && top < 0) top = 0;
			}
		} else {
			left -= elementMargin.left;
			top -= elementMargin.top;
			if (container != offsetParent){
				left += containerCoordinates.left + containerBorder.left;
				top += containerCoordinates.top + containerBorder.top;
			}
		}

		return {
			x: [left, right],
			y: [top, bottom]
		};
	},

	getDroppableCoordinates: function(element){
		var position = element.getCoordinates();
		if (element.getStyle('position') == 'fixed'){
			var scroll = window.getScroll();
			position.left += scroll.x;
			position.right += scroll.x;
			position.top += scroll.y;
			position.bottom += scroll.y;
		}
		return position;
	},

	checkDroppables: function(){
		var overed = this.droppables.filter(function(el, i){
			el = this.positions ? this.positions[i] : this.getDroppableCoordinates(el);
			var now = this.mouse.now;
			return (now.x > el.left && now.x < el.right && now.y < el.bottom && now.y > el.top);
		}, this).getLast();

		if (this.overed != overed){
			if (this.overed) this.fireEvent('leave', [this.element, this.overed]);
			if (overed) this.fireEvent('enter', [this.element, overed]);
			this.overed = overed;
		}
	},

	drag: function(event){
		this.parent(event);
		if (this.options.checkDroppables && this.droppables.length) this.checkDroppables();
	},

	stop: function(event){
		this.checkDroppables();
		this.fireEvent('drop', [this.element, this.overed, event]);
		this.overed = null;
		return this.parent(event);
	}

});

Element.implement({

	makeDraggable: function(options){
		var drag = new Drag.Move(this, options);
		this.store('dragger', drag);
		return drag;
	}

});
/*
---

script: Sortables.js

name: Sortables

description: Class for creating a drag and drop sorting interface for lists of items.

license: MIT-style license

authors:
  - Tom Occhino

requires:
  - Core/Fx.Morph
  - Drag.Move

provides: [Sortables]

...
*/
(function(){

var Sortables = this.Sortables = new Class({

	Implements: [Events, Options],

	options: {/*
		onSort: function(element, clone){},
		onStart: function(element, clone){},
		onComplete: function(element){},*/
		opacity: 1,
		clone: false,
		revert: false,
		handle: false,
		dragOptions: {},
		unDraggableTags: ['button', 'input', 'a', 'textarea', 'select', 'option']
	},

	initialize: function(lists, options){
		this.setOptions(options);

		this.elements = [];
		this.lists = [];
		this.idle = true;

		this.addLists($$(document.id(lists) || lists));

		if (!this.options.clone) this.options.revert = false;
		if (this.options.revert) this.effect = new Fx.Morph(null, Object.merge({
			duration: 250,
			link: 'cancel'
		}, this.options.revert));
	},

	attach: function(){
		this.addLists(this.lists);
		return this;
	},

	detach: function(){
		this.lists = this.removeLists(this.lists);
		return this;
	},

	addItems: function(){
		Array.flatten(arguments).each(function(element){
			this.elements.push(element);
			var start = element.retrieve('sortables:start', function(event){
				this.start.call(this, event, element);
			}.bind(this));
			(this.options.handle ? element.getElement(this.options.handle) || element : element).addEvent('mousedown', start);
		}, this);
		return this;
	},

	addLists: function(){
		Array.flatten(arguments).each(function(list){
			this.lists.include(list);
			this.addItems(list.getChildren());
		}, this);
		return this;
	},

	removeItems: function(){
		return $$(Array.flatten(arguments).map(function(element){
			this.elements.erase(element);
			var start = element.retrieve('sortables:start');
			(this.options.handle ? element.getElement(this.options.handle) || element : element).removeEvent('mousedown', start);

			return element;
		}, this));
	},

	removeLists: function(){
		return $$(Array.flatten(arguments).map(function(list){
			this.lists.erase(list);
			this.removeItems(list.getChildren());

			return list;
		}, this));
	},

	getDroppableCoordinates: function(element){
		var offsetParent = element.getOffsetParent();
		var position = element.getPosition(offsetParent);
		var scroll = {
			w: window.getScroll(),
			offsetParent: offsetParent.getScroll()
		};
		position.x += scroll.offsetParent.x;
		position.y += scroll.offsetParent.y;

		if (offsetParent.getStyle('position') == 'fixed'){
			position.x -= scroll.w.x;
			position.y -= scroll.w.y;
		}

		return position;
	},

	getClone: function(event, element){
		if (!this.options.clone) return new Element(element.tagName).inject(document.body);
		if (typeOf(this.options.clone) == 'function') return this.options.clone.call(this, event, element, this.list);
		var clone = element.clone(true).setStyles({
			margin: 0,
			position: 'absolute',
			visibility: 'hidden',
			width: element.getStyle('width')
		}).addEvent('mousedown', function(event){
			element.fireEvent('mousedown', event);
		});
		//prevent the duplicated radio inputs from unchecking the real one
		if (clone.get('html').test('radio')){
			clone.getElements('input[type=radio]').each(function(input, i){
				input.set('name', 'clone_' + i);
				if (input.get('checked')) element.getElements('input[type=radio]')[i].set('checked', true);
			});
		}

		return clone.inject(this.list).setPosition(this.getDroppableCoordinates(this.element));
	},

	getDroppables: function(){
		var droppables = this.list.getChildren().erase(this.clone).erase(this.element);
		if (!this.options.constrain) droppables.append(this.lists).erase(this.list);
		return droppables;
	},

	insert: function(dragging, element){
		var where = 'inside';
		if (this.lists.contains(element)){
			this.list = element;
			this.drag.droppables = this.getDroppables();
		} else {
			where = this.element.getAllPrevious().contains(element) ? 'before' : 'after';
		}
		this.element.inject(element, where);
		this.fireEvent('sort', [this.element, this.clone]);
	},

	start: function(event, element){
		if (
			!this.idle ||
			event.rightClick ||
			(!this.options.handle && this.options.unDraggableTags.contains(event.target.get('tag')))
		) return;

		this.idle = false;
		this.element = element;
		this.opacity = element.getStyle('opacity');
		this.list = element.getParent();
		this.clone = this.getClone(event, element);

		this.drag = new Drag.Move(this.clone, Object.merge({
			
			droppables: this.getDroppables()
		}, this.options.dragOptions)).addEvents({
			onSnap: function(){
				event.stop();
				this.clone.setStyle('visibility', 'visible');
				this.element.setStyle('opacity', this.options.opacity || 0);
				this.fireEvent('start', [this.element, this.clone]);
			}.bind(this),
			onEnter: this.insert.bind(this),
			onCancel: this.end.bind(this),
			onComplete: this.end.bind(this)
		});

		this.clone.inject(this.element, 'before');
		this.drag.start(event);
	},

	end: function(){
		this.drag.detach();
		this.element.setStyle('opacity', this.opacity);
		var self = this;
		if (this.effect){
			var dim = this.element.getStyles('width', 'height'),
				clone = this.clone,
				pos = clone.computePosition(this.getDroppableCoordinates(clone));

			var destroy = function(){
				this.removeEvent('cancel', destroy);
				clone.destroy();
				self.reset();
			};

			this.effect.element = clone;
			this.effect.start({
				top: pos.top,
				left: pos.left,
				width: dim.width,
				height: dim.height,
				opacity: 0.25
			}).addEvent('cancel', destroy).chain(destroy);
		} else {
			this.clone.destroy();
			self.reset();
		}

	},

	reset: function(){
		this.idle = true;
		this.fireEvent('complete', this.element);
	},

	serialize: function(){
		var params = Array.link(arguments, {
			modifier: Type.isFunction,
			index: function(obj){
				return obj != null;
			}
		});
		var serial = this.lists.map(function(list){
			return list.getChildren().map(params.modifier || function(element){
				return element.get('id');
			}, this);
		}, this);

		var index = params.index;
		if (this.lists.length == 1) index = 0;
		return (index || index === 0) && index >= 0 && index < this.lists.length ? serial[index] : serial;
	}

});

})();
/*
---

script: Object.Extras.js

name: Object.Extras

description: Extra Object generics, like getFromPath which allows a path notation to child elements.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Object
  - MooTools.More

provides: [Object.Extras]

...
*/

(function(){

var defined = function(value){
	return value != null;
};

var hasOwnProperty = Object.prototype.hasOwnProperty;

Object.extend({

	getFromPath: function(source, parts){
		if (typeof parts == 'string') parts = parts.split('.');
		for (var i = 0, l = parts.length; i < l; i++){
			if (hasOwnProperty.call(source, parts[i])) source = source[parts[i]];
			else return null;
		}
		return source;
	},

	cleanValues: function(object, method){
		method = method || defined;
		for (var key in object) if (!method(object[key])){
			delete object[key];
		}
		return object;
	},

	erase: function(object, key){
		if (hasOwnProperty.call(object, key)) delete object[key];
		return object;
	},

	run: function(object){
		var args = Array.slice(arguments, 1);
		for (var key in object) if (object[key].apply){
			object[key].apply(object, args);
		}
		return object;
	}

});

})();
/*
---

script: Locale.js

name: Locale

description: Provides methods for localization.

license: MIT-style license

authors:
  - Aaron Newton
  - Arian Stolwijk

requires:
  - Core/Events
  - Object.Extras
  - MooTools.More

provides: [Locale, Lang]

...
*/

(function(){

var current = null,
	locales = {},
	inherits = {};

var getSet = function(set){
	if (instanceOf(set, Locale.Set)) return set;
	else return locales[set];
};

var Locale = this.Locale = {

	define: function(locale, set, key, value){
		var name;
		if (instanceOf(locale, Locale.Set)){
			name = locale.name;
			if (name) locales[name] = locale;
		} else {
			name = locale;
			if (!locales[name]) locales[name] = new Locale.Set(name);
			locale = locales[name];
		}

		if (set) locale.define(set, key, value);

		

		if (!current) current = locale;

		return locale;
	},

	use: function(locale){
		locale = getSet(locale);

		if (locale){
			current = locale;

			this.fireEvent('change', locale);

			
		}

		return this;
	},

	getCurrent: function(){
		return current;
	},

	get: function(key, args){
		return (current) ? current.get(key, args) : '';
	},

	inherit: function(locale, inherits, set){
		locale = getSet(locale);

		if (locale) locale.inherit(inherits, set);
		return this;
	},

	list: function(){
		return Object.keys(locales);
	}

};

Object.append(Locale, new Events);

Locale.Set = new Class({

	sets: {},

	inherits: {
		locales: [],
		sets: {}
	},

	initialize: function(name){
		this.name = name || '';
	},

	define: function(set, key, value){
		var defineData = this.sets[set];
		if (!defineData) defineData = {};

		if (key){
			if (typeOf(key) == 'object') defineData = Object.merge(defineData, key);
			else defineData[key] = value;
		}
		this.sets[set] = defineData;

		return this;
	},

	get: function(key, args, _base){
		var value = Object.getFromPath(this.sets, key);
		if (value != null){
			var type = typeOf(value);
			if (type == 'function') value = value.apply(null, Array.convert(args));
			else if (type == 'object') value = Object.clone(value);
			return value;
		}

		// get value of inherited locales
		var index = key.indexOf('.'),
			set = index < 0 ? key : key.substr(0, index),
			names = (this.inherits.sets[set] || []).combine(this.inherits.locales).include('en-US');
		if (!_base) _base = [];

		for (var i = 0, l = names.length; i < l; i++){
			if (_base.contains(names[i])) continue;
			_base.include(names[i]);

			var locale = locales[names[i]];
			if (!locale) continue;

			value = locale.get(key, args, _base);
			if (value != null) return value;
		}

		return '';
	},

	inherit: function(names, set){
		names = Array.convert(names);

		if (set && !this.inherits.sets[set]) this.inherits.sets[set] = [];

		var l = names.length;
		while (l--) (set ? this.inherits.sets[set] : this.inherits.locales).unshift(names[l]);

		return this;
	}

});



})();
/*
---

name: Element.Delegation

description: Extends the Element native object to include the delegate method for more efficient event management.

license: MIT-style license.

requires: [Element.Event]

provides: [Element.Delegation]

...
*/

(function(){

var eventListenerSupport = !!window.addEventListener;

Element.NativeEvents.focusin = Element.NativeEvents.focusout = 2;

var bubbleUp = function(self, match, fn, event, target){
	while (target && target != self){
		if (match(target, event)) return fn.call(target, event, target);
		target = document.id(target.parentNode);
	}
};

var map = {
	mouseenter: {
		base: 'mouseover',
		condition: Element.MouseenterCheck
	},
	mouseleave: {
		base: 'mouseout',
		condition: Element.MouseenterCheck
	},
	focus: {
		base: 'focus' + (eventListenerSupport ? '' : 'in'),
		capture: true
	},
	blur: {
		base: eventListenerSupport ? 'blur' : 'focusout',
		capture: true
	}
};

/*<ltIE9>*/
var _key = '$delegation:';
var formObserver = function(type){

	return {

		base: 'focusin',

		remove: function(self, uid){
			var list = self.retrieve(_key + type + 'listeners', {})[uid];
			if (list && list.forms) for (var i = list.forms.length; i--;){
				// the form may have been destroyed, so it won't have the
				// removeEvent method anymore. In that case the event was
				// removed as well.
				if (list.forms[i].removeEvent) list.forms[i].removeEvent(type, list.fns[i]);
			}
		},

		listen: function(self, match, fn, event, target, uid){
			var form = (target.get('tag') == 'form') ? target : event.target.getParent('form');
			if (!form) return;

			var listeners = self.retrieve(_key + type + 'listeners', {}),
				listener = listeners[uid] || {forms: [], fns: []},
				forms = listener.forms, fns = listener.fns;

			if (forms.indexOf(form) != -1) return;
			forms.push(form);

			var _fn = function(event){
				bubbleUp(self, match, fn, event, target);
			};
			form.addEvent(type, _fn);
			fns.push(_fn);

			listeners[uid] = listener;
			self.store(_key + type + 'listeners', listeners);
		}
	};
};

var inputObserver = function(type){
	return {
		base: 'focusin',
		listen: function(self, match, fn, event, target){
			var events = {blur: function(){
				this.removeEvents(events);
			}};
			events[type] = function(event){
				bubbleUp(self, match, fn, event, target);
			};
			event.target.addEvents(events);
		}
	};
};

if (!eventListenerSupport) Object.append(map, {
	submit: formObserver('submit'),
	reset: formObserver('reset'),
	change: inputObserver('change'),
	select: inputObserver('select')
});
/*</ltIE9>*/

var proto = Element.prototype,
	addEvent = proto.addEvent,
	removeEvent = proto.removeEvent;

var relay = function(old, method){
	return function(type, fn, useCapture){
		if (type.indexOf(':relay') == -1) return old.call(this, type, fn, useCapture);
		var parsed = Slick.parse(type).expressions[0][0];
		if (parsed.pseudos[0].key != 'relay') return old.call(this, type, fn, useCapture);
		var newType = parsed.tag;
		parsed.pseudos.slice(1).each(function(pseudo){
			newType += ':' + pseudo.key + (pseudo.value ? '(' + pseudo.value + ')' : '');
		});
		old.call(this, type, fn);
		return method.call(this, newType, parsed.pseudos[0].value, fn);
	};
};

var delegation = {

	addEvent: function(type, match, fn){
		var storage = this.retrieve('$delegates', {}), stored = storage[type];
		if (stored) for (var _uid in stored){
			if (stored[_uid].fn == fn && stored[_uid].match == match) return this;
		}

		var _type = type, _match = match, _fn = fn, _map = map[type] || {};
		type = _map.base || _type;

		match = function(target){
			return Slick.match(target, _match);
		};

		var elementEvent = Element.Events[_type];
		if (_map.condition || elementEvent && elementEvent.condition){
			var __match = match, condition = _map.condition || elementEvent.condition;
			match = function(target, event){
				return __match(target, event) && condition.call(target, event, type);
			};
		}

		var self = this, uid = String.uniqueID();
		var delegator = _map.listen ? function(event, target){
			if (!target && event && event.target) target = event.target;
			if (target) _map.listen(self, match, fn, event, target, uid);
		} : function(event, target){
			if (!target && event && event.target) target = event.target;
			if (target) bubbleUp(self, match, fn, event, target);
		};

		if (!stored) stored = {};
		stored[uid] = {
			match: _match,
			fn: _fn,
			delegator: delegator
		};
		storage[_type] = stored;
		return addEvent.call(this, type, delegator, _map.capture);
	},

	removeEvent: function(type, match, fn, _uid){
		var storage = this.retrieve('$delegates', {}), stored = storage[type];
		if (!stored) return this;

		if (_uid){
			var _type = type, delegator = stored[_uid].delegator, _map = map[type] || {};
			type = _map.base || _type;
			if (_map.remove) _map.remove(this, _uid);
			delete stored[_uid];
			storage[_type] = stored;
			return removeEvent.call(this, type, delegator, _map.capture);
		}

		var __uid, s;
		if (fn) for (__uid in stored){
			s = stored[__uid];
			if (s.match == match && s.fn == fn) return delegation.removeEvent.call(this, type, match, fn, __uid);
		} else for (__uid in stored){
			s = stored[__uid];
			if (s.match == match) delegation.removeEvent.call(this, type, match, s.fn, __uid);
		}
		return this;
	}

};

[Element, Window, Document].invoke('implement', {
	addEvent: relay(addEvent, delegation.addEvent),
	removeEvent: relay(removeEvent, delegation.removeEvent)
});

})();
/*
---

script: Class.Binds.js

name: Class.Binds

description: Automagically binds specified methods in a class to the instance of the class.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Class
  - MooTools.More

provides: [Class.Binds]

...
*/

Class.Mutators.Binds = function(binds){
	if (!this.prototype.initialize) this.implement('initialize', function(){});
	return Array.convert(binds).concat(this.prototype.Binds || []);
};

Class.Mutators.initialize = function(initialize){
	return function(){
		Array.convert(this.Binds).each(function(name){
			var original = this[name];
			if (original) this[name] = original.bind(this);
		}, this);
		return initialize.apply(this, arguments);
	};
};
/*
---

name: Locale.en-US.Date

description: Date messages for US English.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Locale

provides: [Locale.en-US.Date]

...
*/

Locale.define('en-US', 'Date', {

	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	months_abbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	days_abbr: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

	// Culture's date order: MM/DD/YYYY
	dateOrder: ['month', 'date', 'year'],
	shortDate: '%m/%d/%Y',
	shortTime: '%I:%M%p',
	AM: 'AM',
	PM: 'PM',
	firstDayOfWeek: 0,

	// Date.Extras
	ordinal: function(dayOfMonth){
		// 1st, 2nd, 3rd, etc.
		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'less than a minute ago',
	minuteAgo: 'about a minute ago',
	minutesAgo: '{delta} minutes ago',
	hourAgo: 'about an hour ago',
	hoursAgo: 'about {delta} hours ago',
	dayAgo: '1 day ago',
	daysAgo: '{delta} days ago',
	weekAgo: '1 week ago',
	weeksAgo: '{delta} weeks ago',
	monthAgo: '1 month ago',
	monthsAgo: '{delta} months ago',
	yearAgo: '1 year ago',
	yearsAgo: '{delta} years ago',

	lessThanMinuteUntil: 'less than a minute from now',
	minuteUntil: 'about a minute from now',
	minutesUntil: '{delta} minutes from now',
	hourUntil: 'about an hour from now',
	hoursUntil: 'about {delta} hours from now',
	dayUntil: '1 day from now',
	daysUntil: '{delta} days from now',
	weekUntil: '1 week from now',
	weeksUntil: '{delta} weeks from now',
	monthUntil: '1 month from now',
	monthsUntil: '{delta} months from now',
	yearUntil: '1 year from now',
	yearsUntil: '{delta} years from now'

});
/*
---

script: Date.js

name: Date

description: Extends the Date native object to include methods useful in managing dates.

license: MIT-style license

authors:
  - Aaron Newton
  - Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
  - Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
  - Scott Kyle - scott [at] appden.com; http://appden.com

requires:
  - Core/Array
  - Core/String
  - Core/Number
  - MooTools.More
  - Locale
  - Locale.en-US.Date

provides: [Date]

...
*/

(function(){

var Date = this.Date;

var DateMethods = Date.Methods = {
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
};

[
	'Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds', 'UTCMilliseconds'
].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

var pad = function(n, digits, string){
	if (digits == 1) return n;
	return n < Math.pow(10, digits - 1) ? (string || '0') + pad(n, digits - 1, string) : n;
};

Date.implement({

	set: function(prop, value){
		prop = prop.toLowerCase();
		var method = DateMethods[prop] && 'set' + DateMethods[prop];
		if (method && this[method]) this[method](value);
		return this;
	}.overloadSetter(),

	get: function(prop){
		prop = prop.toLowerCase();
		var method = DateMethods[prop] && 'get' + DateMethods[prop];
		if (method && this[method]) return this[method]();
		return null;
	}.overloadGetter(),

	clone: function(){
		return new Date(this.get('time'));
	},

	increment: function(interval, times){
		interval = interval || 'day';
		times = times != null ? times : 1;

		switch (interval){
			case 'year':
				return this.increment('month', times * 12);
			case 'month':
				var d = this.get('date');
				this.set('date', 1).set('mo', this.get('mo') + times);
				return this.set('date', d.min(this.get('lastdayofmonth')));
			case 'week':
				return this.increment('day', times * 7);
			case 'day':
				return this.set('date', this.get('date') + times);
		}

		if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');

		return this.set('time', this.get('time') + times * Date.units[interval]());
	},

	decrement: function(interval, times){
		return this.increment(interval, -1 * (times != null ? times : 1));
	},

	isLeapYear: function(){
		return Date.isLeapYear(this.get('year'));
	},

	clearTime: function(){
		return this.set({hr: 0, min: 0, sec: 0, ms: 0});
	},

	diff: function(date, resolution){
		if (typeOf(date) == 'string') date = Date.parse(date);

		return ((date - this) / Date.units[resolution || 'day'](3, 3)).round(); // non-leap year, 30-day month
	},

	getLastDayOfMonth: function(){
		return Date.daysInMonth(this.get('mo'), this.get('year'));
	},

	getDayOfYear: function(){
		return (Date.UTC(this.get('year'), this.get('mo'), this.get('date') + 1)
			- Date.UTC(this.get('year'), 0, 1)) / Date.units.day();
	},

	setDay: function(day, firstDayOfWeek){
		if (firstDayOfWeek == null){
			firstDayOfWeek = Date.getMsg('firstDayOfWeek');
			if (firstDayOfWeek === '') firstDayOfWeek = 1;
		}

		day = (7 + Date.parseDay(day, true) - firstDayOfWeek) % 7;
		var currentDay = (7 + this.get('day') - firstDayOfWeek) % 7;

		return this.increment('day', day - currentDay);
	},

	getWeek: function(firstDayOfWeek){
		if (firstDayOfWeek == null){
			firstDayOfWeek = Date.getMsg('firstDayOfWeek');
			if (firstDayOfWeek === '') firstDayOfWeek = 1;
		}

		var date = this,
			dayOfWeek = (7 + date.get('day') - firstDayOfWeek) % 7,
			dividend = 0,
			firstDayOfYear;

		if (firstDayOfWeek == 1){
			// ISO-8601, week belongs to year that has the most days of the week (i.e. has the thursday of the week)
			var month = date.get('month'),
				startOfWeek = date.get('date') - dayOfWeek;

			if (month == 11 && startOfWeek > 28) return 1; // Week 1 of next year

			if (month == 0 && startOfWeek < -2){
				// Use a date from last year to determine the week
				date = new Date(date).decrement('day', dayOfWeek);
				dayOfWeek = 0;
			}

			firstDayOfYear = new Date(date.get('year'), 0, 1).get('day') || 7;
			if (firstDayOfYear > 4) dividend = -7; // First week of the year is not week 1
		} else {
			// In other cultures the first week of the year is always week 1 and the last week always 53 or 54.
			// Days in the same week can have a different weeknumber if the week spreads across two years.
			firstDayOfYear = new Date(date.get('year'), 0, 1).get('day');
		}

		dividend += date.get('dayofyear');
		dividend += 6 - dayOfWeek; // Add days so we calculate the current date's week as a full week
		dividend += (7 + firstDayOfYear - firstDayOfWeek) % 7; // Make up for first week of the year not being a full week

		return (dividend / 7);
	},

	getOrdinal: function(day){
		return Date.getMsg('ordinal', day || this.get('date'));
	},

	getTimezone: function(){
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},

	getGMTOffset: function(){
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+') + pad((off.abs() / 60).floor(), 2) + pad(off % 60, 2);
	},

	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		var hr = this.get('hr');
		if (hr > 11 && ampm == 'AM') return this.decrement('hour', 12);
		else if (hr < 12 && ampm == 'PM') return this.increment('hour', 12);
		return this;
	},

	getAMPM: function(){
		return (this.get('hr') < 12) ? 'AM' : 'PM';
	},

	parse: function(str){
		this.set('time', Date.parse(str));
		return this;
	},

	isValid: function(date){
		if (!date) date = this;
		return typeOf(date) == 'date' && !isNaN(date.valueOf());
	},

	format: function(format){
		if (!this.isValid()) return 'invalid date';

		if (!format) format = '%x %X';
		if (typeof format == 'string') format = formats[format.toLowerCase()] || format;
		if (typeof format == 'function') return format(this);

		var d = this;
		return format.replace(/%([a-z%])/gi,
			function($0, $1){
				switch ($1){
					case 'a': return Date.getMsg('days_abbr')[d.get('day')];
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months_abbr')[d.get('month')];
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.format('%a %b %d %H:%M:%S %Y');
					case 'd': return pad(d.get('date'), 2);
					case 'e': return pad(d.get('date'), 2, ' ');
					case 'H': return pad(d.get('hr'), 2);
					case 'I': return pad((d.get('hr') % 12) || 12, 2);
					case 'j': return pad(d.get('dayofyear'), 3);
					case 'k': return pad(d.get('hr'), 2, ' ');
					case 'l': return pad((d.get('hr') % 12) || 12, 2, ' ');
					case 'L': return pad(d.get('ms'), 3);
					case 'm': return pad((d.get('mo') + 1), 2);
					case 'M': return pad(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 's': return Math.round(d / 1000);
					case 'S': return pad(d.get('seconds'), 2);
					case 'T': return d.format('%H:%M:%S');
					case 'U': return pad(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'z': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $1;
			}
		);
	},

	toISOString: function(){
		return this.format('iso8601');
	}

}).alias({
	toJSON: 'toISOString',
	compare: 'diff',
	strftime: 'format'
});

// The day and month abbreviations are standardized, so we cannot use simply %a and %b because they will get localized
var rfcDayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	rfcMonthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var formats = {
	db: '%Y-%m-%d %H:%M:%S',
	compact: '%Y%m%dT%H%M%S',
	'short': '%d %b %H:%M',
	'long': '%B %d, %Y %H:%M',
	rfc822: function(date){
		return rfcDayAbbr[date.get('day')] + date.format(', %d ') + rfcMonthAbbr[date.get('month')] + date.format(' %Y %H:%M:%S %Z');
	},
	rfc2822: function(date){
		return rfcDayAbbr[date.get('day')] + date.format(', %d ') + rfcMonthAbbr[date.get('month')] + date.format(' %Y %H:%M:%S %z');
	},
	iso8601: function(date){
		return (
			date.getUTCFullYear() + '-' +
			pad(date.getUTCMonth() + 1, 2) + '-' +
			pad(date.getUTCDate(), 2) + 'T' +
			pad(date.getUTCHours(), 2) + ':' +
			pad(date.getUTCMinutes(), 2) + ':' +
			pad(date.getUTCSeconds(), 2) + '.' +
			pad(date.getUTCMilliseconds(), 3) + 'Z'
		);
	}
};

var parsePatterns = [],
	nativeParse = Date.parse;

var parseWord = function(type, word, num){
	var ret = -1,
		translated = Date.getMsg(type + 's');
	switch (typeOf(word)){
		case 'object':
			ret = translated[word.get(type)];
			break;
		case 'number':
			ret = translated[word];
			if (!ret) throw new Error('Invalid ' + type + ' index: ' + word);
			break;
		case 'string':
			var match = translated.filter(function(name){
				return this.test(name);
			}, new RegExp('^' + word, 'i'));
			if (!match.length) throw new Error('Invalid ' + type + ' string');
			if (match.length > 1) throw new Error('Ambiguous ' + type);
			ret = match[0];
	}

	return (num) ? translated.indexOf(ret) : ret;
};

var startCentury = 1900,
	startYear = 70;

Date.extend({

	getMsg: function(key, args){
		return Locale.get('Date.' + key, args);
	},

	units: {
		ms: Function.convert(1),
		second: Function.convert(1000),
		minute: Function.convert(60000),
		hour: Function.convert(3600000),
		day: Function.convert(86400000),
		week: Function.convert(608400000),
		month: function(month, year){
			var d = new Date;
			return Date.daysInMonth(month != null ? month : d.get('mo'), year != null ? year : d.get('year')) * 86400000;
		},
		year: function(year){
			year = year || new Date().get('year');
			return Date.isLeapYear(year) ? 31622400000 : 31536000000;
		}
	},

	daysInMonth: function(month, year){
		return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	isLeapYear: function(year){
		return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
	},

	parse: function(from){
		var t = typeOf(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;

		var parsed;
		parsePatterns.some(function(pattern){
			var bits = pattern.re.exec(from);
			return (bits) ? (parsed = pattern.handler(bits)) : false;
		});

		if (!(parsed && parsed.isValid())){
			parsed = new Date(nativeParse(from));
			if (!(parsed && parsed.isValid())) parsed = new Date(from.toInt());
		}
		return parsed;
	},

	parseDay: function(day, num){
		return parseWord('day', day, num);
	},

	parseMonth: function(month, num){
		return parseWord('month', month, num);
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(
			localDate.get('year'),
			localDate.get('mo'),
			localDate.get('date'),
			localDate.get('hr'),
			localDate.get('min'),
			localDate.get('sec'),
			localDate.get('ms')
		);
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
		return this;
	},

	

	defineParser: function(pattern){
		parsePatterns.push((pattern.re && pattern.handler) ? pattern : build(pattern));
		return this;
	},

	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
		return this;
	},

	define2DigitYearStart: function(year){
		startYear = year % 100;
		startCentury = year - startYear;
		return this;
	}

}).extend({
	defineFormats: Date.defineFormat.overloadSetter()
});

var regexOf = function(type){
	return new RegExp('(?:' + Date.getMsg(type).map(function(name){
		return name.substr(0, 3);
	}).join('|') + ')[a-z]*');
};

var replacers = function(key){
	switch (key){
		case 'T':
			return '%H:%M:%S';
		case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
			return ((Date.orderIndex('month') == 1) ? '%m[-./]%d' : '%d[-./]%m') + '([-./]%y)?';
		case 'X':
			return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%z?';
	}
	return null;
};

var keys = {
	d: /[0-2]?[0-9]|3[01]/,
	H: /[01]?[0-9]|2[0-3]/,
	I: /0?[1-9]|1[0-2]/,
	M: /[0-5]?\d/,
	s: /\d+/,
	o: /[a-z]*/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	z: /Z|[+-]\d{2}(?::?\d{2})?/
};

keys.m = keys.I;
keys.S = keys.M;

var currentLanguage;

var recompile = function(language){
	currentLanguage = language;

	keys.a = keys.A = regexOf('days');
	keys.b = keys.B = regexOf('months');

	parsePatterns.each(function(pattern, i){
		if (pattern.format) parsePatterns[i] = build(pattern.format);
	});
};

var build = function(format){
	if (!currentLanguage) return {format: format};

	var parsed = [];
	var re = (format.source || format) // allow format to be regex
	.replace(/%([a-z])/gi,
		function($0, $1){
			return replacers($1) || $0;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	.replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	.replace(/%([a-z%])/gi,
		function($0, $1){
			var p = keys[$1];
			if (!p) return $1;
			parsed.push($1);
			return '(' + p.source + ')';
		}
	).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff;\&]'); // handle unicode words

	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		handler: function(bits){
			bits = bits.slice(1).associate(parsed);
			var date = new Date().clearTime(),
				year = bits.y || bits.Y;

			if (year != null) handle.call(date, 'y', year); // need to start in the right year
			if ('d' in bits) handle.call(date, 'd', 1);
			if ('m' in bits || bits.b || bits.B) handle.call(date, 'm', 1);

			for (var key in bits) handle.call(date, key, bits[key]);
			return date;
		}
	};
};

var handle = function(key, value){
	if (!value) return this;

	switch (key){
		case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
		case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
		case 'd': return this.set('date', value);
		case 'H': case 'I': return this.set('hr', value);
		case 'm': return this.set('mo', value - 1);
		case 'M': return this.set('min', value);
		case 'p': return this.set('ampm', value.replace(/\./g, ''));
		case 'S': return this.set('sec', value);
		case 's': return this.set('ms', ('0.' + value) * 1000);
		case 'w': return this.set('day', value);
		case 'Y': return this.set('year', value);
		case 'y':
			value = +value;
			if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
			return this.set('year', value);
		case 'z':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
			offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
			return this.set('time', this - offset * 60000);
	}

	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
	'%Y %b( %d%o( %X)?)?', // Same as above with year coming first
	'%o %b %d %X %z %Y', // "Thu Oct 22 08:11:23 +0000 2009"
	'%T', // %H:%M:%S
	'%H:%M( ?%p)?' // "11:05pm", "11:05 am" and "11:05"
);

Locale.addEvent('change', function(language){
	if (Locale.get('Date')) recompile(language);
}).fireEvent('change', Locale.getCurrent());

})();
/*
---

script: String.Extras.js

name: String.Extras

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
  - Aaron Newton
  - Guillermo Rauch
  - Christopher Pitt

requires:
  - Core/String
  - Core/Array
  - MooTools.More

provides: [String.Extras]

...
*/

(function(){

var special = {
		'a': /[àáâãäåăą]/g,
		'A': /[ÀÁÂÃÄÅĂĄ]/g,
		'c': /[ćčç]/g,
		'C': /[ĆČÇ]/g,
		'd': /[ďđ]/g,
		'D': /[ĎÐ]/g,
		'e': /[èéêëěę]/g,
		'E': /[ÈÉÊËĚĘ]/g,
		'g': /[ğ]/g,
		'G': /[Ğ]/g,
		'i': /[ìíîï]/g,
		'I': /[ÌÍÎÏ]/g,
		'l': /[ĺľł]/g,
		'L': /[ĹĽŁ]/g,
		'n': /[ñňń]/g,
		'N': /[ÑŇŃ]/g,
		'o': /[òóôõöøő]/g,
		'O': /[ÒÓÔÕÖØ]/g,
		'r': /[řŕ]/g,
		'R': /[ŘŔ]/g,
		's': /[ššş]/g,
		'S': /[ŠŞŚ]/g,
		't': /[ťţ]/g,
		'T': /[ŤŢ]/g,
		'u': /[ùúûůüµ]/g,
		'U': /[ÙÚÛŮÜ]/g,
		'y': /[ÿý]/g,
		'Y': /[ŸÝ]/g,
		'z': /[žźż]/g,
		'Z': /[ŽŹŻ]/g,
		'th': /[þ]/g,
		'TH': /[Þ]/g,
		'dh': /[ð]/g,
		'DH': /[Ð]/g,
		'ss': /[ß]/g,
		'oe': /[œ]/g,
		'OE': /[Œ]/g,
		'ae': /[æ]/g,
		'AE': /[Æ]/g
	},

	tidy = {
		' ': /[\xa0\u2002\u2003\u2009]/g,
		'*': /[\xb7]/g,
		'\'': /[\u2018\u2019]/g,
		'"': /[\u201c\u201d]/g,
		'...': /[\u2026]/g,
		'-': /[\u2013]/g,
	//	'--': /[\u2014]/g,
		'&raquo;': /[\uFFFD]/g
	},

	conversions = {
		ms: 1,
		s: 1000,
		m: 6e4,
		h: 36e5
	},

	findUnits = /(\d*.?\d+)([msh]+)/;

var walk = function(string, replacements){
	var result = string, key;
	for (key in replacements) result = result.replace(replacements[key], key);
	return result;
};

var getRegexForTag = function(tag, contents){
	tag = tag || (contents ? '' : '\\w+');
	var regstr = contents ? '<' + tag + '(?!\\w)[^>]*>([\\s\\S]*?)<\/' + tag + '(?!\\w)>' : '<\/?' + tag + '\/?>|<' + tag + '[\\s|\/][^>]*>';
	return new RegExp(regstr, 'gi');
};

String.implement({

	standardize: function(){
		return walk(this, special);
	},

	repeat: function(times){
		return new Array(times + 1).join(this);
	},

	pad: function(length, str, direction){
		if (this.length >= length) return this;

		var pad = (str == null ? ' ' : '' + str)
			.repeat(length - this.length)
			.substr(0, length - this.length);

		if (!direction || direction == 'right') return this + pad;
		if (direction == 'left') return pad + this;

		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	getTags: function(tag, contents){
		return this.match(getRegexForTag(tag, contents)) || [];
	},

	stripTags: function(tag, contents){
		return this.replace(getRegexForTag(tag, contents), '');
	},

	tidy: function(){
		return walk(this, tidy);
	},

	truncate: function(max, trail, atChar){
		var string = this;
		if (trail == null && arguments.length == 1) trail = '…';
		if (string.length > max){
			string = string.substring(0, max);
			if (atChar){
				var index = string.lastIndexOf(atChar);
				if (index != -1) string = string.substr(0, index);
			}
			if (trail) string += trail;
		}
		return string;
	},

	ms: function(){
		// "Borrowed" from https://gist.github.com/1503944
		var units = findUnits.exec(this);
		if (units == null) return Number(this);
		return Number(units[1]) * conversions[units[2]];
	}

});

})();
/*
---

script: Element.Forms.js

name: Element.Forms

description: Extends the Element native object to include methods useful in managing inputs.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element
  - String.Extras
  - MooTools.More

provides: [Element.Forms]

...
*/

Element.implement({

	tidy: function(){
		this.set('value', this.get('value').tidy());
	},

	getTextInRange: function(start, end){
		return this.get('value').substring(start, end);
	},

	getSelectedText: function(){
		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
		return document.selection.createRange().text;
	},

	getSelectedRange: function(){
		if (this.selectionStart != null){
			return {
				start: this.selectionStart,
				end: this.selectionEnd
			};
		}

		var pos = {
			start: 0,
			end: 0
		};
		var range = this.getDocument().selection.createRange();
		if (!range || range.parentElement() != this) return pos;
		var duplicate = range.duplicate();

		if (this.type == 'text'){
			pos.start = 0 - duplicate.moveStart('character', -100000);
			pos.end = pos.start + range.text.length;
		} else {
			var value = this.get('value');
			var offset = value.length;
			duplicate.moveToElementText(this);
			duplicate.setEndPoint('StartToEnd', range);
			if (duplicate.text.length) offset -= value.match(/[\n\r]*$/)[0].length;
			pos.end = offset - duplicate.text.length;
			duplicate.setEndPoint('StartToStart', range);
			pos.start = offset - duplicate.text.length;
		}
		return pos;
	},

	getSelectionStart: function(){
		return this.getSelectedRange().start;
	},

	getSelectionEnd: function(){
		return this.getSelectedRange().end;
	},

	setCaretPosition: function(pos){
		if (pos == 'end') pos = this.get('value').length;
		this.selectRange(pos, pos);
		return this;
	},

	getCaretPosition: function(){
		return this.getSelectedRange().start;
	},

	selectRange: function(start, end){
		if (this.setSelectionRange){
			this.focus();
			this.setSelectionRange(start, end);
		} else {
			var value = this.get('value');
			var diff = value.substr(start, end - start).replace(/\r/g, '').length;
			start = value.substr(0, start).replace(/\r/g, '').length;
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', start + diff);
			range.moveStart('character', start);
			range.select();
		}
		return this;
	},

	insertAtCursor: function(value, select){
		var pos = this.getSelectedRange();
		var text = this.get('value');
		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));
		if (select !== false) this.selectRange(pos.start, pos.start + value.length);
		else this.setCaretPosition(pos.start + value.length);
		return this;
	},

	insertAroundCursor: function(options, select){
		options = Object.append({
			before: '',
			defaultMiddle: '',
			after: ''
		}, options);

		var value = this.getSelectedText() || options.defaultMiddle;
		var pos = this.getSelectedRange();
		var text = this.get('value');

		if (pos.start == pos.end){
			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));
			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);
		} else {
			var current = text.substring(pos.start, pos.end);
			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));
			var selStart = pos.start + options.before.length;
			if (select !== false) this.selectRange(selStart, selStart + current.length);
			else this.setCaretPosition(selStart + text.length);
		}
		return this;
	}

});
/*
---

name: Locale.en-US.Form.Validator

description: Form Validator messages for English.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Locale

provides: [Locale.en-US.Form.Validator]

...
*/

Locale.define('en-US', 'FormValidator', {

	required: 'This field is required.',
	length: 'Please enter {length} characters (you entered {elLength} characters)',
	minLength: 'Please enter at least {minLength} characters (you entered {length} characters).',
	maxLength: 'Please enter no more than {maxLength} characters (you entered {length} characters).',
	integer: 'Please enter an integer in this field. Numbers with decimals (e.g. 1.25) are not permitted.',
	numeric: 'Please enter only numeric values in this field (i.e. "1" or "1.1" or "-1" or "-1.1").',
	digits: 'Please use numbers and punctuation only in this field (for example, a phone number with dashes or dots is permitted).',
	alpha: 'Please use only letters (a-z) within this field. No spaces or other characters are allowed.',
	alphanum: 'Please use only letters (a-z) or numbers (0-9) in this field. No spaces or other characters are allowed.',
	dateSuchAs: 'Please enter a valid date such as {date}',
	dateInFormatMDY: 'Please enter a valid date such as MM/DD/YYYY (i.e. "12/31/1999")',
	email: 'Please enter a valid email address. For example "fred@domain.com".',
	url: 'Please enter a valid URL such as http://www.example.com.',
	currencyDollar: 'Please enter a valid $ amount. For example $100.00 .',
	oneRequired: 'Please enter something for at least one of these inputs.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Warning: ',

	// Form.Validator.Extras
	noSpace: 'There can be no spaces in this input.',
	reqChkByNode: 'No items are selected.',
	requiredChk: 'This field is required.',
	reqChkByName: 'Please select a {label}.',
	match: 'This field needs to match the {matchName} field',
	startDate: 'the start date',
	endDate: 'the end date',
	currentDate: 'the current date',
	afterDate: 'The date should be the same or after {label}.',
	beforeDate: 'The date should be the same or before {label}.',
	startMonth: 'Please select a start month',
	sameMonth: 'These two dates must be in the same month - you must change one or the other.',
	creditcard: 'The credit card number entered is invalid. Please check the number and try again. {length} digits entered.'

});
/*
---

script: Element.Shortcuts.js

name: Element.Shortcuts

description: Extends the Element native object to include some shortcut methods.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Style
  - MooTools.More

provides: [Element.Shortcuts]

...
*/

Element.implement({

	isDisplayed: function(){
		return this.getStyle('display') != 'none';
	},

	isVisible: function(){
		var w = this.offsetWidth,
			h = this.offsetHeight;
		return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : this.style.display != 'none';
	},

	toggle: function(){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(){
		var d;
		try {
			//IE fails here if the element is not in the dom
			d = this.getStyle('display');
		} catch (e){}
		if (d == 'none') return this;
		return this.store('element:_originalDisplay', d || '').setStyle('display', 'none');
	},

	show: function(display){
		if (!display && this.isDisplayed()) return this;
		display = display || this.retrieve('element:_originalDisplay') || 'block';
		return this.setStyle('display', (display == 'none') ? 'block' : display);
	},

	swapClass: function(remove, add){
		return this.removeClass(remove).addClass(add);
	}

});

Document.implement({

	clearSelection: function(){
		if (window.getSelection){
			var selection = window.getSelection();
			if (selection && selection.removeAllRanges) selection.removeAllRanges();
		} else if (document.selection && document.selection.empty){
			try {
				//IE fails here if selected element is not in dom
				document.selection.empty();
			} catch (e){}
		}
	}

});
/*
---

script: Form.Validator.js

name: Form.Validator

description: A css-class based form validation system.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Options
  - Core/Events
  - Core/Element.Delegation
  - Core/Slick.Finder
  - Core/Element.Event
  - Core/Element.Style
  - Core/JSON
  - Locale
  - Class.Binds
  - Date
  - Element.Forms
  - Locale.en-US.Form.Validator
  - Element.Shortcuts

provides: [Form.Validator, InputValidator, FormValidator.BaseValidators]

...
*/
if (!window.Form) window.Form = {};

var InputValidator = this.InputValidator = new Class({

	Implements: [Options],

	options: {
		errorMsg: 'Validation failed.',
		test: Function.convert(true)
	},

	initialize: function(className, options){
		this.setOptions(options);
		this.className = className;
	},

	test: function(field, props){
		field = document.id(field);
		return (field) ? this.options.test(field, props || this.getProps(field)) : false;
	},

	getError: function(field, props){
		field = document.id(field);
		var err = this.options.errorMsg;
		if (typeOf(err) == 'function') err = err(field, props || this.getProps(field));
		return err;
	},

	getProps: function(field){
		field = document.id(field);
		return (field) ? field.get('validatorProps') : {};
	}

});

Element.Properties.validators = {

	get: function(){
		return (this.get('data-validators') || this.className).clean().replace(/'(\\.|[^'])*'|"(\\.|[^"])*"/g, function(match){
			return match.replace(' ', '\\x20');
		}).split(' ');
	}

};

Element.Properties.validatorProps = {

	set: function(props){
		return this.eliminate('$moo:validatorProps').store('$moo:validatorProps', props);
	},

	get: function(props){
		if (props) this.set(props);
		if (this.retrieve('$moo:validatorProps')) return this.retrieve('$moo:validatorProps');
		if (this.getProperty('data-validator-properties') || this.getProperty('validatorProps')){
			try {
				this.store('$moo:validatorProps', JSON.decode(this.getProperty('validatorProps') || this.getProperty('data-validator-properties'), false));
			} catch (e){
				return {};
			}
		} else {
			var vals = this.get('validators').filter(function(cls){
				return cls.test(':');
			});
			if (!vals.length){
				this.store('$moo:validatorProps', {});
			} else {
				props = {};
				vals.each(function(cls){
					var split = cls.split(':');
					if (split[1]){
						try {
							props[split[0]] = JSON.decode(split[1], false);
						} catch (e){}
					}
				});
				this.store('$moo:validatorProps', props);
			}
		}
		return this.retrieve('$moo:validatorProps');
	}

};

Form.Validator = new Class({

	Implements: [Options, Events],

	options: {/*
		onFormValidate: function(isValid, form, event){},
		onElementValidate: function(isValid, field, className, warn){},
		onElementPass: function(field){},
		onElementFail: function(field, validatorsFailed){}, */
		fieldSelectors: 'input, select, textarea',
		ignoreHidden: true,
		ignoreDisabled: true,
		useTitles: false,
		evaluateOnSubmit: true,
		evaluateFieldsOnBlur: true,
		evaluateFieldsOnChange: true,
		serial: true,
		stopOnFailure: true,
		warningPrefix: function(){
			return Form.Validator.getMsg('warningPrefix') || 'Warning: ';
		},
		errorPrefix: function(){
			return Form.Validator.getMsg('errorPrefix') || 'Error: ';
		}
	},

	initialize: function(form, options){
		this.setOptions(options);
		this.element = document.id(form);
		this.warningPrefix = Function.convert(this.options.warningPrefix)();
		this.errorPrefix = Function.convert(this.options.errorPrefix)();
		this._bound = {
			onSubmit: this.onSubmit.bind(this),
			blurOrChange: function(event, field){
				this.validationMonitor(field, true);
			}.bind(this)
		};
		this.enable();
	},

	toElement: function(){
		return this.element;
	},

	getFields: function(){
		return (this.fields = this.element.getElements(this.options.fieldSelectors));
	},

	enable: function(){
		this.element.store('validator', this);
		if (this.options.evaluateOnSubmit) this.element.addEvent('submit', this._bound.onSubmit);
		if (this.options.evaluateFieldsOnBlur){
			this.element.addEvent('blur:relay(input,select,textarea)', this._bound.blurOrChange);
		}
		if (this.options.evaluateFieldsOnChange){
			this.element.addEvent('change:relay(input,select,textarea)', this._bound.blurOrChange);
		}
	},

	disable: function(){
		this.element.eliminate('validator');
		this.element.removeEvents({
			submit: this._bound.onSubmit,
			'blur:relay(input,select,textarea)': this._bound.blurOrChange,
			'change:relay(input,select,textarea)': this._bound.blurOrChange
		});
	},

	validationMonitor: function(){
		clearTimeout(this.timer);
		this.timer = this.validateField.delay(50, this, arguments);
	},

	onSubmit: function(event){
		if (this.validate(event)) this.reset();
	},

	reset: function(){
		this.getFields().each(this.resetField, this);
		return this;
	},

	validate: function(event){
		var result = this.getFields().map(function(field){
			return this.validateField(field, true);
		}, this).every(function(v){
			return v;
		});
		this.fireEvent('formValidate', [result, this.element, event]);
		if (this.options.stopOnFailure && !result && event) event.preventDefault();
		return result;
	},

	validateField: function(field, force){
		if (this.paused) return true;
		field = document.id(field);
		var passed = !field.hasClass('validation-failed');
		var failed, warned;
		if (this.options.serial && !force){
			failed = this.element.getElement('.validation-failed');
			warned = this.element.getElement('.warning');
		}
		if (field && (!failed || force || field.hasClass('validation-failed') || (failed && !this.options.serial))){
			var validationTypes = field.get('validators');
			var validators = validationTypes.some(function(cn){
				return this.getValidator(cn);
			}, this);
			var validatorsFailed = [];
			validationTypes.each(function(className){
				if (className && !this.test(className, field)) validatorsFailed.include(className);
			}, this);
			passed = validatorsFailed.length === 0;
			if (validators && !this.hasValidator(field, 'warnOnly')){
				if (passed){
					field.addClass('validation-passed').removeClass('validation-failed');
					this.fireEvent('elementPass', [field]);
				} else {
					field.addClass('validation-failed').removeClass('validation-passed');
					this.fireEvent('elementFail', [field, validatorsFailed]);
				}
			}
			if (!warned){
				var warnings = validationTypes.some(function(cn){
					if (cn.test('^warn'))
						return this.getValidator(cn.replace(/^warn-/,''));
					else return null;
				}, this);
				field.removeClass('warning');
				var warnResult = validationTypes.map(function(cn){
					if (cn.test('^warn'))
						return this.test(cn.replace(/^warn-/,''), field, true);
					else return null;
				}, this);
			}
		}
		return passed;
	},

	test: function(className, field, warn){
		field = document.id(field);
		if ((this.options.ignoreHidden && !field.isVisible()) || (this.options.ignoreDisabled && field.get('disabled'))) return true;
		var validator = this.getValidator(className);
		if (warn != null) warn = false;
		if (this.hasValidator(field, 'warnOnly')) warn = true;
		var isValid = field.hasClass('ignoreValidation') || (validator ? validator.test(field) : true);
		if (validator) this.fireEvent('elementValidate', [isValid, field, className, warn]);
		if (warn) return true;
		return isValid;
	},

	hasValidator: function(field, value){
		return field.get('validators').contains(value);
	},

	resetField: function(field){
		field = document.id(field);
		if (field){
			field.get('validators').each(function(className){
				if (className.test('^warn-')) className = className.replace(/^warn-/, '');
				field.removeClass('validation-failed');
				field.removeClass('warning');
				field.removeClass('validation-passed');
			}, this);
		}
		return this;
	},

	stop: function(){
		this.paused = true;
		return this;
	},

	start: function(){
		this.paused = false;
		return this;
	},

	ignoreField: function(field, warn){
		field = document.id(field);
		if (field){
			this.enforceField(field);
			if (warn) field.addClass('warnOnly');
			else field.addClass('ignoreValidation');
		}
		return this;
	},

	enforceField: function(field){
		field = document.id(field);
		if (field) field.removeClass('warnOnly').removeClass('ignoreValidation');
		return this;
	}

});

Form.Validator.getMsg = function(key){
	return Locale.get('FormValidator.' + key);
};

Form.Validator.adders = {

	validators:{},

	add : function(className, options){
		this.validators[className] = new InputValidator(className, options);
		//if this is a class (this method is used by instances of Form.Validator and the Form.Validator namespace)
		//extend these validators into it
		//this allows validators to be global and/or per instance
		if (!this.initialize){
			this.implement({
				validators: this.validators
			});
		}
	},

	addAllThese : function(validators){
		Array.convert(validators).each(function(validator){
			this.add(validator[0], validator[1]);
		}, this);
	},

	getValidator: function(className){
		return this.validators[className.split(':')[0]];
	}

};

Object.append(Form.Validator, Form.Validator.adders);

Form.Validator.implement(Form.Validator.adders);

Form.Validator.add('IsEmpty', {

	errorMsg: false,
	test: function(element){
		if (element.type == 'select-one' || element.type == 'select')
			return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
		else
			return ((element.get('value') == null) || (element.get('value').length == 0));
	}

});

Form.Validator.addAllThese([

	['required', {
		errorMsg: function(){
			return Form.Validator.getMsg('required');
		},
		test: function(element){
			return !Form.Validator.getValidator('IsEmpty').test(element);
		}
	}],

	['length', {
		errorMsg: function(element, props){
			if (typeOf(props.length) != 'null')
				return Form.Validator.getMsg('length').substitute({length: props.length, elLength: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			if (typeOf(props.length) != 'null') return (element.get('value').length == props.length || element.get('value').length == 0);
			else return true;
		}
	}],

	['minLength', {
		errorMsg: function(element, props){
			if (typeOf(props.minLength) != 'null')
				return Form.Validator.getMsg('minLength').substitute({minLength: props.minLength, length: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			if (typeOf(props.minLength) != 'null') return (element.get('value').length >= (props.minLength || 0));
			else return true;
		}
	}],

	['maxLength', {
		errorMsg: function(element, props){
			//props is {maxLength:10}
			if (typeOf(props.maxLength) != 'null')
				return Form.Validator.getMsg('maxLength').substitute({maxLength: props.maxLength, length: element.get('value').length});
			else return '';
		},
		test: function(element, props){
			return element.get('value').length <= (props.maxLength || 10000);
		}
	}],

	['validate-integer', {
		errorMsg: Form.Validator.getMsg.pass('integer'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(-?[1-9]\d*|0)$/).test(element.get('value'));
		}
	}],

	['validate-numeric', {
		errorMsg: Form.Validator.getMsg.pass('numeric'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) ||
				(/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(element.get('value'));
		}
	}],

	['validate-digits', {
		errorMsg: Form.Validator.getMsg.pass('digits'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[\d() .:\-\+#]+$/.test(element.get('value')));
		}
	}],

	['validate-alpha', {
		errorMsg: Form.Validator.getMsg.pass('alpha'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[a-zA-Z]+$/).test(element.get('value'));
		}
	}],

	['validate-alphanum', {
		errorMsg: Form.Validator.getMsg.pass('alphanum'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || !(/\W/).test(element.get('value'));
		}
	}],

	['validate-date', {
		errorMsg: function(element, props){
			if (Date.parse){
				var format = props.dateFormat || '%x';
				return Form.Validator.getMsg('dateSuchAs').substitute({date: new Date().format(format)});
			} else {
				return Form.Validator.getMsg('dateInFormatMDY');
			}
		},
		test: function(element, props){
			if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
			var dateLocale = Locale.get('Date'),
				dateNouns = new RegExp([dateLocale.days, dateLocale.days_abbr, dateLocale.months, dateLocale.months_abbr, dateLocale.AM, dateLocale.PM].flatten().join('|'), 'i'),
				value = element.get('value'),
				wordsInValue = value.match(/[a-z]+/gi);

			if (wordsInValue && !wordsInValue.every(dateNouns.exec, dateNouns)) return false;

			var date = Date.parse(value);
			if (!date) return false;

			var format = props.dateFormat || '%x',
				formatted = date.format(format);
			if (formatted != 'invalid date') element.set('value', formatted);
			return date.isValid();
		}
	}],

	['validate-email', {
		errorMsg: Form.Validator.getMsg.pass('email'),
		test: function(element){
			/*
			var chars = "[a-z0-9!#$%&'*+/=?^_`{|}~-]",
				local = '(?:' + chars + '\\.?){0,63}' + chars,

				label = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?',
				hostname = '(?:' + label + '\\.)*' + label;

				octet = '(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
				ipv4 = '\\[(?:' + octet + '\\.){3}' + octet + '\\]',

				domain = '(?:' + hostname + '|' + ipv4 + ')';

			var regex = new RegExp('^' + local + '@' + domain + '$', 'i');
			*/
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i).test(element.get('value'));
		}
	}],

	['validate-url', {
		errorMsg: Form.Validator.getMsg.pass('url'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(element.get('value'));
		}
	}],

	['validate-currency-dollar', {
		errorMsg: Form.Validator.getMsg.pass('currencyDollar'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(element.get('value'));
		}
	}],

	['validate-one-required', {
		errorMsg: Form.Validator.getMsg.pass('oneRequired'),
		test: function(element, props){
			var p = document.id(props['validate-one-required']) || element.getParent(props['validate-one-required']);
			return p.getElements('input').some(function(el){
				if (['checkbox', 'radio'].contains(el.get('type'))) return el.get('checked');
				return el.get('value');
			});
		}
	}]

]);

Element.Properties.validator = {

	set: function(options){
		this.get('validator').setOptions(options);
	},

	get: function(){
		var validator = this.retrieve('validator');
		if (!validator){
			validator = new Form.Validator(this);
			this.store('validator', validator);
		}
		return validator;
	}

};

Element.implement({

	validate: function(options){
		if (options) this.set('validator', options);
		return this.get('validator').validate();
	}

});





/*
---

script: Form.Validator.Inline.js

name: Form.Validator.Inline

description: Extends Form.Validator to add inline messages.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Form.Validator
  - Core/Element.Dimensions

provides: [Form.Validator.Inline]

...
*/

Form.Validator.Inline = new Class({

	Extends: Form.Validator,

	options: {
		showError: function(errorElement){
			if (errorElement.reveal) errorElement.reveal();
			else errorElement.setStyle('display', 'block');
		},
		hideError: function(errorElement){
			if (errorElement.dissolve) errorElement.dissolve();
			else errorElement.setStyle('display', 'none');
		},
		scrollToErrorsOnSubmit: true,
		scrollToErrorsOnBlur: false,
		scrollToErrorsOnChange: false,
		scrollFxOptions: {
			transition: 'quad:out',
			offset: {
				y: -20
			}
		}
	},

	initialize: function(form, options){
		this.parent(form, options);
		this.addEvent('onElementValidate', function(isValid, field, className, warn){
			var validator = this.getValidator(className);
			if (!isValid && validator.getError(field)){
				if (warn) field.addClass('warning');
				var advice = this.makeAdvice(className, field, validator.getError(field), warn);
				this.insertAdvice(advice, field);
				this.showAdvice(className, field);
			} else {
				this.hideAdvice(className, field);
			}
		});
	},

	makeAdvice: function(className, field, error, warn){
		var errorMsg = (warn) ? this.warningPrefix : this.errorPrefix;
		errorMsg += (this.options.useTitles) ? field.title || error:error;
		var cssClass = (warn) ? 'warning-advice' : 'validation-advice';
		var advice = this.getAdvice(className, field);
		if (advice){
			advice = advice.set('html', errorMsg);
		} else {
			advice = new Element('div', {
				html: errorMsg,
				styles: { display: 'none' },
				id: 'advice-' + className.split(':')[0] + '-' + this.getFieldId(field)
			}).addClass(cssClass);
		}
		field.store('$moo:advice-' + className, advice);
		return advice;
	},

	getFieldId : function(field){
		return field.id ? field.id : field.id = 'input_' + field.name;
	},

	showAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (
			advice &&
			!field.retrieve('$moo:' + this.getPropName(className)) &&
			(
				advice.getStyle('display') == 'none' ||
				advice.getStyle('visibility') == 'hidden' ||
				advice.getStyle('opacity') == 0
			)
		){
			field.store('$moo:' + this.getPropName(className), true);
			this.options.showError(advice);
			this.fireEvent('showAdvice', [field, advice, className]);
		}
	},

	hideAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (advice && field.retrieve('$moo:' + this.getPropName(className))){
			field.store('$moo:' + this.getPropName(className), false);
			this.options.hideError(advice);
			this.fireEvent('hideAdvice', [field, advice, className]);
		}
	},

	getPropName: function(className){
		return 'advice' + className;
	},

	resetField: function(field){
		field = document.id(field);
		if (!field) return this;
		this.parent(field);
		field.get('validators').each(function(className){
			this.hideAdvice(className, field);
		}, this);
		return this;
	},

	getAllAdviceMessages: function(field, force){
		var advice = [];
		if (field.hasClass('ignoreValidation') && !force) return advice;
		var validators = field.get('validators').some(function(cn){
			var warner = cn.test('^warn-') || field.hasClass('warnOnly');
			if (warner) cn = cn.replace(/^warn-/, '');
			var validator = this.getValidator(cn);
			if (!validator) return;
			advice.push({
				message: validator.getError(field),
				warnOnly: warner,
				passed: validator.test(),
				validator: validator
			});
		}, this);
		return advice;
	},

	getAdvice: function(className, field){
		return field.retrieve('$moo:advice-' + className);
	},

	insertAdvice: function(advice, field){
		//Check for error position prop
		var props = field.get('validatorProps');
		//Build advice
		if (!props.msgPos || !document.id(props.msgPos)){
			if (field.type && field.type.toLowerCase() == 'radio') field.getParent().adopt(advice);
			else advice.inject(document.id(field), 'after');
		} else {
			document.id(props.msgPos).grab(advice);
		}
	},

	validateField: function(field, force, scroll){
		var result = this.parent(field, force);
		if (((this.options.scrollToErrorsOnSubmit && scroll == null) || scroll) && !result){
			var failed = document.id(this).getElement('.validation-failed');
			var par = document.id(this).getParent();
			while (par != document.body && par.getScrollSize().y == par.getSize().y){
				par = par.getParent();
			}
			var fx = par.retrieve('$moo:fvScroller');
			if (!fx && window.Fx && Fx.Scroll){
				fx = new Fx.Scroll(par, this.options.scrollFxOptions);
				par.store('$moo:fvScroller', fx);
			}
			if (failed){
				if (fx) fx.toElement(failed);
				else par.scrollTo(par.getScroll().x, failed.getPosition(par).y - 20);
			}
		}
		return result;
	},

	watchFields: function(fields){
		fields.each(function(el){
			if (this.options.evaluateFieldsOnBlur){
				el.addEvent('blur', this.validationMonitor.pass([el, false, this.options.scrollToErrorsOnBlur], this));
			}
			if (this.options.evaluateFieldsOnChange){
				el.addEvent('change', this.validationMonitor.pass([el, true, this.options.scrollToErrorsOnChange], this));
			}
		}, this);
	}

});
/*
---

script: Assets.js

name: Assets

description: Provides methods to dynamically load JavaScript, CSS, and Image files into the document.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Element.Event
  - MooTools.More

provides: [Assets, Asset.javascript, Asset.css, Asset.image, Asset.images]

...
*/
;(function(){

var Asset = this.Asset = {

	javascript: function(source, properties){
		if (!properties) properties = {};

		var script = new Element('script', {src: source, type: 'text/javascript'}),
			doc = properties.document || document,
			load = properties.onload || properties.onLoad;

		delete properties.onload;
		delete properties.onLoad;
		delete properties.document;

		if (load){
			if (!script.addEventListener){
				script.addEvent('readystatechange', function(){
					if (['loaded', 'complete'].contains(this.readyState)) load.call(this);
				});
			} else {
				script.addEvent('load', load);
			}
		}

		return script.set(properties).inject(doc.head);
	},

	css: function(source, properties){
		if (!properties) properties = {};

		var load = properties.onload || properties.onLoad,
			doc = properties.document || document,
			timeout = properties.timeout || 3000;

		['onload', 'onLoad', 'document'].each(function(prop){
			delete properties[prop];
		});

		var link = new Element('link', {
			type: 'text/css',
			rel: 'stylesheet',
			media: 'screen',
			href: source
		}).setProperties(properties).inject(doc.head);

		if (load){
			// based on article at http://www.yearofmoo.com/2011/03/cross-browser-stylesheet-preloading.html
			var loaded = false, retries = 0;
			var check = function(){
				var stylesheets = document.styleSheets;
				for (var i = 0; i < stylesheets.length; i++){
					var file = stylesheets[i];
					var owner = file.ownerNode ? file.ownerNode : file.owningElement;
					if (owner && owner == link){
						loaded = true;
						return load.call(link);
					}
				}
				retries++;
				if (!loaded && retries < timeout / 50) return setTimeout(check, 50);
			};
			setTimeout(check, 0);
		}
		return link;
	},

	image: function(source, properties){
		if (!properties) properties = {};

		var image = new Image(),
			element = document.id(image) || new Element('img');

		['load', 'abort', 'error'].each(function(name){
			var type = 'on' + name,
				cap = 'on' + name.capitalize(),
				event = properties[type] || properties[cap] || function(){};

			delete properties[cap];
			delete properties[type];

			image[type] = function(){
				if (!image) return;
				if (!element.parentNode){
					element.width = image.width;
					element.height = image.height;
				}
				image = image.onload = image.onabort = image.onerror = null;
				event.delay(1, element, element);
				element.fireEvent(name, element, 1);
			};
		});

		image.src = element.src = source;
		if (image && image.complete) image.onload.delay(1);
		return element.set(properties);
	},

	images: function(sources, options){
		sources = Array.convert(sources);

		var fn = function(){},
			counter = 0;

		options = Object.merge({
			onComplete: fn,
			onProgress: fn,
			onError: fn,
			properties: {}
		}, options);

		return new Elements(sources.map(function(source, index){
			return Asset.image(source, Object.append(options.properties, {
				onload: function(){
					counter++;
					options.onProgress.call(this, counter, index, source);
					if (counter == sources.length) options.onComplete();
				},
				onerror: function(){
					counter++;
					options.onError.call(this, counter, index, source);
					if (counter == sources.length) options.onComplete();
				}
			}));
		}));
	}

};

})();
/*
---

script: Color.js

name: Color

description: Class for creating and manipulating colors in JavaScript. Supports HSB -> RGB Conversions and vice versa.

license: MIT-style license

authors:
  - Valerio Proietti

requires:
  - Core/Array
  - Core/String
  - Core/Number
  - Core/Hash
  - Core/Function
  - MooTools.More

provides: [Color]

...
*/

(function(){

var Color = this.Color = new Type('Color', function(color, type){
	if (arguments.length >= 3){
		type = 'rgb'; color = Array.slice(arguments, 0, 3);
	} else if (typeof color == 'string'){
		if (color.match(/rgb/)) color = color.rgbToHex().hexToRgb(true);
		else if (color.match(/hsb/)) color = color.hsbToRgb();
		else color = color.hexToRgb(true);
	}
	type = type || 'rgb';
	switch (type){
		case 'hsb':
			var old = color;
			color = color.hsbToRgb();
			color.hsb = old;
			break;
		case 'hex': color = color.hexToRgb(true); break;
	}
	color.rgb = color.slice(0, 3);
	color.hsb = color.hsb || color.rgbToHsb();
	color.hex = color.rgbToHex();
	return Object.append(color, this);
});

Color.implement({

	mix: function(){
		var colors = Array.slice(arguments);
		var alpha = (typeOf(colors.getLast()) == 'number') ? colors.pop() : 50;
		var rgb = this.slice();
		colors.each(function(color){
			color = new Color(color);
			for (var i = 0; i < 3; i++) rgb[i] = Math.round((rgb[i] / 100 * (100 - alpha)) + (color[i] / 100 * alpha));
		});
		return new Color(rgb, 'rgb');
	},

	invert: function(){
		return new Color(this.map(function(value){
			return 255 - value;
		}));
	},

	setHue: function(value){
		return new Color([value, this.hsb[1], this.hsb[2]], 'hsb');
	},

	setSaturation: function(percent){
		return new Color([this.hsb[0], percent, this.hsb[2]], 'hsb');
	},

	setBrightness: function(percent){
		return new Color([this.hsb[0], this.hsb[1], percent], 'hsb');
	}

});

this.$RGB = function(r, g, b){
	return new Color([r, g, b], 'rgb');
};

this.$HSB = function(h, s, b){
	return new Color([h, s, b], 'hsb');
};

this.$HEX = function(hex){
	return new Color(hex, 'hex');
};

Array.implement({

	rgbToHsb: function(){
		var red = this[0],
			green = this[1],
			blue = this[2],
			hue = 0,
			max = Math.max(red, green, blue),
			min = Math.min(red, green, blue),
			delta = max - min,
			brightness = max / 255,
			saturation = (max != 0) ? delta / max : 0;

		if (saturation != 0){
			var rr = (max - red) / delta;
			var gr = (max - green) / delta;
			var br = (max - blue) / delta;
			if (red == max) hue = br - gr;
			else if (green == max) hue = 2 + rr - br;
			else hue = 4 + gr - rr;
			hue /= 6;
			if (hue < 0) hue++;
		}
		return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100)];
	},

	hsbToRgb: function(){
		var br = Math.round(this[2] / 100 * 255);
		if (this[1] == 0){
			return [br, br, br];
		} else {
			var hue = this[0] % 360;
			var f = hue % 60;
			var p = Math.round((this[2] * (100 - this[1])) / 10000 * 255);
			var q = Math.round((this[2] * (6000 - this[1] * f)) / 600000 * 255);
			var t = Math.round((this[2] * (6000 - this[1] * (60 - f))) / 600000 * 255);
			switch (Math.floor(hue / 60)){
				case 0: return [br, t, p];
				case 1: return [q, br, p];
				case 2: return [p, br, t];
				case 3: return [p, q, br];
				case 4: return [t, p, br];
				case 5: return [br, p, q];
			}
		}
		return false;
	}

});

String.implement({

	rgbToHsb: function(){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHsb() : null;
	},

	hsbToRgb: function(){
		var hsb = this.match(/\d{1,3}/g);
		return (hsb) ? hsb.hsbToRgb() : null;
	}

});

})();

/*
---

name: Swiff

description: Wrapper for embedding SWF movies. Supports External Interface Communication.

license: MIT-style license.

credits:
  - Flash detection & Internet Explorer + Flash Player 9 fix inspired by SWFObject.

requires: [Core/Options, Core/Object, Core/Element]

provides: Swiff

...
*/

(function(){

var Swiff = this.Swiff = new Class({

	Implements: Options,

	options: {
		id: null,
		height: 1,
		width: 1,
		container: null,
		properties: {},
		params: {
			quality: 'high',
			allowScriptAccess: 'always',
			wMode: 'window',
			swLiveConnect: true
		},
		callBacks: {},
		vars: {}
	},

	toElement: function(){
		return this.object;
	},

	initialize: function(path, options){
		this.instance = 'Swiff_' + String.uniqueID();

		this.setOptions(options);
		options = this.options;
		var id = this.id = options.id || this.instance;
		var container = document.id(options.container);

		Swiff.CallBacks[this.instance] = {};

		var params = options.params, vars = options.vars, callBacks = options.callBacks;
		var properties = Object.append({height: options.height, width: options.width}, options.properties);

		var self = this;

		for (var callBack in callBacks){
			Swiff.CallBacks[this.instance][callBack] = (function(option){
				return function(){
					return option.apply(self.object, arguments);
				};
			})(callBacks[callBack]);
			vars[callBack] = 'Swiff.CallBacks.' + this.instance + '.' + callBack;
		}

		params.flashVars = Object.toQueryString(vars);
		if ('ActiveXObject' in window){
			properties.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
			params.movie = path;
		} else {
			properties.type = 'application/x-shockwave-flash';
		}
		properties.data = path;

		var build = '<object id="' + id + '"';
		for (var property in properties) build += ' ' + property + '="' + properties[property] + '"';
		build += '>';
		for (var param in params){
			if (params[param]) build += '<param name="' + param + '" value="' + params[param] + '" />';
		}
		build += '</object>';
		this.object = ((container) ? container.empty() : new Element('div')).set('html', build).firstChild;
	},

	replaces: function(element){
		element = document.id(element, true);
		element.parentNode.replaceChild(this.toElement(), element);
		return this;
	},

	inject: function(element){
		document.id(element, true).appendChild(this.toElement());
		return this;
	},

	remote: function(){
		return Swiff.remote.apply(Swiff, [this.toElement()].append(arguments));
	}

});

Swiff.CallBacks = {};

Swiff.remote = function(obj, fn){
	var rs = obj.CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 2) + '</invoke>');
	return eval(rs);
};

})();

/*--|/home/user/ngn-env/bc/sd/js/cufon-yui.js|--*/
/*
 * Copyright (c) 2009 Simo Kinnunen.
 * Licensed under the MIT license.
 *
 * @version 1.09i
 */
var Cufon=(function(){var m=function(){return m.replace.apply(null,arguments)};var x=m.DOM={ready:(function(){var C=false,E={loaded:1,complete:1};var B=[],D=function(){if(C){return}C=true;for(var F;F=B.shift();F()){}};if(document.addEventListener){document.addEventListener("DOMContentLoaded",D,false);window.addEventListener("pageshow",D,false)}if(!window.opera&&document.readyState){(function(){E[document.readyState]?D():setTimeout(arguments.callee,10)})()}if(document.readyState&&document.createStyleSheet){(function(){try{document.body.doScroll("left");D()}catch(F){setTimeout(arguments.callee,1)}})()}q(window,"load",D);return function(F){if(!arguments.length){D()}else{C?F():B.push(F)}}})(),root:function(){return document.documentElement||document.body}};var n=m.CSS={Size:function(C,B){this.value=parseFloat(C);this.unit=String(C).match(/[a-z%]*$/)[0]||"px";this.convert=function(D){return D/B*this.value};this.convertFrom=function(D){return D/this.value*B};this.toString=function(){return this.value+this.unit}},addClass:function(C,B){var D=C.className;C.className=D+(D&&" ")+B;return C},color:j(function(C){var B={};B.color=C.replace(/^rgba\((.*?),\s*([\d.]+)\)/,function(E,D,F){B.opacity=parseFloat(F);return"rgb("+D+")"});return B}),fontStretch:j(function(B){if(typeof B=="number"){return B}if(/%$/.test(B)){return parseFloat(B)/100}return{"ultra-condensed":0.5,"extra-condensed":0.625,condensed:0.75,"semi-condensed":0.875,"semi-expanded":1.125,expanded:1.25,"extra-expanded":1.5,"ultra-expanded":2}[B]||1}),getStyle:function(C){var B=document.defaultView;if(B&&B.getComputedStyle){return new a(B.getComputedStyle(C,null))}if(C.currentStyle){return new a(C.currentStyle)}return new a(C.style)},gradient:j(function(F){var G={id:F,type:F.match(/^-([a-z]+)-gradient\(/)[1],stops:[]},C=F.substr(F.indexOf("(")).match(/([\d.]+=)?(#[a-f0-9]+|[a-z]+\(.*?\)|[a-z]+)/ig);for(var E=0,B=C.length,D;E<B;++E){D=C[E].split("=",2).reverse();G.stops.push([D[1]||E/(B-1),D[0]])}return G}),quotedList:j(function(E){var D=[],C=/\s*((["'])([\s\S]*?[^\\])\2|[^,]+)\s*/g,B;while(B=C.exec(E)){D.push(B[3]||B[1])}return D}),recognizesMedia:j(function(G){var E=document.createElement("style"),D,C,B;E.type="text/css";E.media=G;try{E.appendChild(document.createTextNode("/**/"))}catch(F){}C=g("head")[0];C.insertBefore(E,C.firstChild);D=(E.sheet||E.styleSheet);B=D&&!D.disabled;C.removeChild(E);return B}),removeClass:function(D,C){var B=RegExp("(?:^|\\s+)"+C+"(?=\\s|$)","g");D.className=D.className.replace(B,"");return D},supports:function(D,C){var B=document.createElement("span").style;if(B[D]===undefined){return false}B[D]=C;return B[D]===C},textAlign:function(E,D,B,C){if(D.get("textAlign")=="right"){if(B>0){E=" "+E}}else{if(B<C-1){E+=" "}}return E},textShadow:j(function(F){if(F=="none"){return null}var E=[],G={},B,C=0;var D=/(#[a-f0-9]+|[a-z]+\(.*?\)|[a-z]+)|(-?[\d.]+[a-z%]*)|,/ig;while(B=D.exec(F)){if(B[0]==","){E.push(G);G={};C=0}else{if(B[1]){G.color=B[1]}else{G[["offX","offY","blur"][C++]]=B[2]}}}E.push(G);return E}),textTransform:(function(){var B={uppercase:function(C){return C.toUpperCase()},lowercase:function(C){return C.toLowerCase()},capitalize:function(C){return C.replace(/\b./g,function(D){return D.toUpperCase()})}};return function(E,D){var C=B[D.get("textTransform")];return C?C(E):E}})(),whiteSpace:(function(){var D={inline:1,"inline-block":1,"run-in":1};var C=/^\s+/,B=/\s+$/;return function(H,F,G,E){if(E){if(E.nodeName.toLowerCase()=="br"){H=H.replace(C,"")}}if(D[F.get("display")]){return H}if(!G.previousSibling){H=H.replace(C,"")}if(!G.nextSibling){H=H.replace(B,"")}return H}})()};n.ready=(function(){var B=!n.recognizesMedia("all"),E=false;var D=[],H=function(){B=true;for(var K;K=D.shift();K()){}};var I=g("link"),J=g("style");function C(K){return K.disabled||G(K.sheet,K.media||"screen")}function G(M,P){if(!n.recognizesMedia(P||"all")){return true}if(!M||M.disabled){return false}try{var Q=M.cssRules,O;if(Q){search:for(var L=0,K=Q.length;O=Q[L],L<K;++L){switch(O.type){case 2:break;case 3:if(!G(O.styleSheet,O.media.mediaText)){return false}break;default:break search}}}}catch(N){}return true}function F(){if(document.createStyleSheet){return true}var L,K;for(K=0;L=I[K];++K){if(L.rel.toLowerCase()=="stylesheet"&&!C(L)){return false}}for(K=0;L=J[K];++K){if(!C(L)){return false}}return true}x.ready(function(){if(!E){E=n.getStyle(document.body).isUsable()}if(B||(E&&F())){H()}else{setTimeout(arguments.callee,10)}});return function(K){if(B){K()}else{D.push(K)}}})();function s(D){var C=this.face=D.face,B={"\u0020":1,"\u00a0":1,"\u3000":1};this.glyphs=D.glyphs;this.w=D.w;this.baseSize=parseInt(C["units-per-em"],10);this.family=C["font-family"].toLowerCase();this.weight=C["font-weight"];this.style=C["font-style"]||"normal";this.viewBox=(function(){var F=C.bbox.split(/\s+/);var E={minX:parseInt(F[0],10),minY:parseInt(F[1],10),maxX:parseInt(F[2],10),maxY:parseInt(F[3],10)};E.width=E.maxX-E.minX;E.height=E.maxY-E.minY;E.toString=function(){return[this.minX,this.minY,this.width,this.height].join(" ")};return E})();this.ascent=-parseInt(C.ascent,10);this.descent=-parseInt(C.descent,10);this.height=-this.ascent+this.descent;this.spacing=function(L,N,E){var O=this.glyphs,M,K,G,P=[],F=0,J=-1,I=-1,H;while(H=L[++J]){M=O[H]||this.missingGlyph;if(!M){continue}if(K){F-=G=K[H]||0;P[I]-=G}F+=P[++I]=~~(M.w||this.w)+N+(B[H]?E:0);K=M.k}P.total=F;return P}}function f(){var C={},B={oblique:"italic",italic:"oblique"};this.add=function(D){(C[D.style]||(C[D.style]={}))[D.weight]=D};this.get=function(H,I){var G=C[H]||C[B[H]]||C.normal||C.italic||C.oblique;if(!G){return null}I={normal:400,bold:700}[I]||parseInt(I,10);if(G[I]){return G[I]}var E={1:1,99:0}[I%100],K=[],F,D;if(E===undefined){E=I>400}if(I==500){I=400}for(var J in G){if(!k(G,J)){continue}J=parseInt(J,10);if(!F||J<F){F=J}if(!D||J>D){D=J}K.push(J)}if(I<F){I=F}if(I>D){I=D}K.sort(function(M,L){return(E?(M>=I&&L>=I)?M<L:M>L:(M<=I&&L<=I)?M>L:M<L)?-1:1});return G[K[0]]}}function r(){function D(F,G){if(F.contains){return F.contains(G)}return F.compareDocumentPosition(G)&16}function B(G){var F=G.relatedTarget;if(!F||D(this,F)){return}C(this,G.type=="mouseover")}function E(F){C(this,F.type=="mouseenter")}function C(F,G){setTimeout(function(){var H=d.get(F).options;m.replace(F,G?h(H,H.hover):H,true)},10)}this.attach=function(F){if(F.onmouseenter===undefined){q(F,"mouseover",B);q(F,"mouseout",B)}else{q(F,"mouseenter",E);q(F,"mouseleave",E)}}}function u(){var C=[],D={};function B(H){var E=[],G;for(var F=0;G=H[F];++F){E[F]=C[D[G]]}return E}this.add=function(F,E){D[F]=C.push(E)-1};this.repeat=function(){var E=arguments.length?B(arguments):C,F;for(var G=0;F=E[G++];){m.replace(F[0],F[1],true)}}}function A(){var D={},B=0;function C(E){return E.cufid||(E.cufid=++B)}this.get=function(E){var F=C(E);return D[F]||(D[F]={})}}function a(B){var D={},C={};this.extend=function(E){for(var F in E){if(k(E,F)){D[F]=E[F]}}return this};this.get=function(E){return D[E]!=undefined?D[E]:B[E]};this.getSize=function(F,E){return C[F]||(C[F]=new n.Size(this.get(F),E))};this.isUsable=function(){return !!B}}function q(C,B,D){if(C.addEventListener){C.addEventListener(B,D,false)}else{if(C.attachEvent){C.attachEvent("on"+B,function(){return D.call(C,window.event)})}}}function v(C,B){var D=d.get(C);if(D.options){return C}if(B.hover&&B.hoverables[C.nodeName.toLowerCase()]){b.attach(C)}D.options=B;return C}function j(B){var C={};return function(D){if(!k(C,D)){C[D]=B.apply(null,arguments)}return C[D]}}function c(F,E){var B=n.quotedList(E.get("fontFamily").toLowerCase()),D;for(var C=0;D=B[C];++C){if(i[D]){return i[D].get(E.get("fontStyle"),E.get("fontWeight"))}}return null}function g(B){return document.getElementsByTagName(B)}function k(C,B){return C.hasOwnProperty(B)}function h(){var C={},B,F;for(var E=0,D=arguments.length;B=arguments[E],E<D;++E){for(F in B){if(k(B,F)){C[F]=B[F]}}}return C}function o(E,M,C,N,F,D){var K=document.createDocumentFragment(),H;if(M===""){return K}var L=N.separate;var I=M.split(p[L]),B=(L=="words");if(B&&t){if(/^\s/.test(M)){I.unshift("")}if(/\s$/.test(M)){I.push("")}}for(var J=0,G=I.length;J<G;++J){H=z[N.engine](E,B?n.textAlign(I[J],C,J,G):I[J],C,N,F,D,J<G-1);if(H){K.appendChild(H)}}return K}function l(D,M){var C=D.nodeName.toLowerCase();if(M.ignore[C]){return}var E=!M.textless[C];var B=n.getStyle(v(D,M)).extend(M);var F=c(D,B),G,K,I,H,L,J;if(!F){return}for(G=D.firstChild;G;G=I){K=G.nodeType;I=G.nextSibling;if(E&&K==3){if(H){H.appendData(G.data);D.removeChild(G)}else{H=G}if(I){continue}}if(H){D.replaceChild(o(F,n.whiteSpace(H.data,B,H,J),B,M,G,D),H);H=null}if(K==1){if(G.firstChild){if(G.nodeName.toLowerCase()=="cufon"){z[M.engine](F,null,B,M,G,D)}else{arguments.callee(G,M)}}J=G}}}var t=" ".split(/\s+/).length==0;var d=new A();var b=new r();var y=new u();var e=false;var z={},i={},w={autoDetect:false,engine:null,forceHitArea:false,hover:false,hoverables:{a:true},ignore:{applet:1,canvas:1,col:1,colgroup:1,head:1,iframe:1,map:1,optgroup:1,option:1,script:1,select:1,style:1,textarea:1,title:1,pre:1},printable:true,selector:(window.Sizzle||(window.jQuery&&function(B){return jQuery(B)})||(window.dojo&&dojo.query)||(window.Ext&&Ext.query)||(window.YAHOO&&YAHOO.util&&YAHOO.util.Selector&&YAHOO.util.Selector.query)||(window.$$&&function(B){return $$(B)})||(window.$&&function(B){return $(B)})||(document.querySelectorAll&&function(B){return document.querySelectorAll(B)})||g),separate:"words",textless:{dl:1,html:1,ol:1,table:1,tbody:1,thead:1,tfoot:1,tr:1,ul:1},textShadow:"none"};var p={words:/\s/.test("\u00a0")?/[^\S\u00a0]+/:/\s+/,characters:"",none:/^/};m.now=function(){x.ready();return m};m.refresh=function(){y.repeat.apply(y,arguments);return m};m.registerEngine=function(C,B){if(!B){return m}z[C]=B;return m.set("engine",C)};m.registerFont=function(D){if(!D){return m}var B=new s(D),C=B.family;if(!i[C]){i[C]=new f()}i[C].add(B);return m.set("fontFamily",'"'+C+'"')};m.replace=function(D,C,B){C=h(w,C);if(!C.engine){return m}if(!e){n.addClass(x.root(),"cufon-active cufon-loading");n.ready(function(){n.addClass(n.removeClass(x.root(),"cufon-loading"),"cufon-ready")});e=true}if(C.hover){C.forceHitArea=true}if(C.autoDetect){delete C.fontFamily}if(typeof C.textShadow=="string"){C.textShadow=n.textShadow(C.textShadow)}if(typeof C.color=="string"&&/^-/.test(C.color)){C.textGradient=n.gradient(C.color)}else{delete C.textGradient}if(!B){y.add(D,arguments)}if(D.nodeType||typeof D=="string"){D=[D]}n.ready(function(){for(var F=0,E=D.length;F<E;++F){var G=D[F];if(typeof G=="string"){m.replace(C.selector(G),C,true)}else{l(G,C)}}});return m};m.set=function(B,C){w[B]=C;return m};return m})();Cufon.registerEngine("vml",(function(){var e=document.namespaces;if(!e){return}e.add("cvml","urn:schemas-microsoft-com:vml");e=null;var b=document.createElement("cvml:shape");b.style.behavior="url(#default#VML)";if(!b.coordsize){return}b=null;var h=(document.documentMode||0)<8;document.write(('<style type="text/css">cufoncanvas{text-indent:0;}@media screen{cvml\\:shape,cvml\\:rect,cvml\\:fill,cvml\\:shadow{behavior:url(#default#VML);display:block;antialias:true;position:absolute;}cufoncanvas{position:absolute;text-align:left;}cufon{display:inline-block;position:relative;vertical-align:'+(h?"middle":"text-bottom")+";}cufon cufontext{position:absolute;left:-10000in;font-size:1px;}a cufon{cursor:pointer}}@media print{cufon cufoncanvas{display:none;}}</style>").replace(/;/g,"!important;"));function c(i,j){return a(i,/(?:em|ex|%)$|^[a-z-]+$/i.test(j)?"1em":j)}function a(l,m){if(m==="0"){return 0}if(/px$/i.test(m)){return parseFloat(m)}var k=l.style.left,j=l.runtimeStyle.left;l.runtimeStyle.left=l.currentStyle.left;l.style.left=m.replace("%","em");var i=l.style.pixelLeft;l.style.left=k;l.runtimeStyle.left=j;return i}function f(l,k,j,n){var i="computed"+n,m=k[i];if(isNaN(m)){m=k.get(n);k[i]=m=(m=="normal")?0:~~j.convertFrom(a(l,m))}return m}var g={};function d(p){var q=p.id;if(!g[q]){var n=p.stops,o=document.createElement("cvml:fill"),i=[];o.type="gradient";o.angle=180;o.focus="0";o.method="sigma";o.color=n[0][1];for(var m=1,l=n.length-1;m<l;++m){i.push(n[m][0]*100+"% "+n[m][1])}o.colors=i.join(",");o.color2=n[l][1];g[q]=o}return g[q]}return function(ac,G,Y,C,K,ad,W){var n=(G===null);if(n){G=K.alt}var I=ac.viewBox;var p=Y.computedFontSize||(Y.computedFontSize=new Cufon.CSS.Size(c(ad,Y.get("fontSize"))+"px",ac.baseSize));var y,q;if(n){y=K;q=K.firstChild}else{y=document.createElement("cufon");y.className="cufon cufon-vml";y.alt=G;q=document.createElement("cufoncanvas");y.appendChild(q);if(C.printable){var Z=document.createElement("cufontext");Z.appendChild(document.createTextNode(G));y.appendChild(Z)}if(!W){y.appendChild(document.createElement("cvml:shape"))}}var ai=y.style;var R=q.style;var l=p.convert(I.height),af=Math.ceil(l);var V=af/l;var P=V*Cufon.CSS.fontStretch(Y.get("fontStretch"));var U=I.minX,T=I.minY;R.height=af;R.top=Math.round(p.convert(T-ac.ascent));R.left=Math.round(p.convert(U));ai.height=p.convert(ac.height)+"px";var F=Y.get("color");var ag=Cufon.CSS.textTransform(G,Y).split("");var L=ac.spacing(ag,f(ad,Y,p,"letterSpacing"),f(ad,Y,p,"wordSpacing"));if(!L.length){return null}var k=L.total;var x=-U+k+(I.width-L[L.length-1]);var ah=p.convert(x*P),X=Math.round(ah);var O=x+","+I.height,m;var J="r"+O+"ns";var u=C.textGradient&&d(C.textGradient);var o=ac.glyphs,S=0;var H=C.textShadow;var ab=-1,aa=0,w;while(w=ag[++ab]){var D=o[ag[ab]]||ac.missingGlyph,v;if(!D){continue}if(n){v=q.childNodes[aa];while(v.firstChild){v.removeChild(v.firstChild)}}else{v=document.createElement("cvml:shape");q.appendChild(v)}v.stroked="f";v.coordsize=O;v.coordorigin=m=(U-S)+","+T;v.path=(D.d?"m"+D.d+"xe":"")+"m"+m+J;v.fillcolor=F;if(u){v.appendChild(u.cloneNode(false))}var ae=v.style;ae.width=X;ae.height=af;if(H){var s=H[0],r=H[1];var B=Cufon.CSS.color(s.color),z;var N=document.createElement("cvml:shadow");N.on="t";N.color=B.color;N.offset=s.offX+","+s.offY;if(r){z=Cufon.CSS.color(r.color);N.type="double";N.color2=z.color;N.offset2=r.offX+","+r.offY}N.opacity=B.opacity||(z&&z.opacity)||1;v.appendChild(N)}S+=L[aa++]}var M=v.nextSibling,t,A;if(C.forceHitArea){if(!M){M=document.createElement("cvml:rect");M.stroked="f";M.className="cufon-vml-cover";t=document.createElement("cvml:fill");t.opacity=0;M.appendChild(t);q.appendChild(M)}A=M.style;A.width=X;A.height=af}else{if(M){q.removeChild(M)}}ai.width=Math.max(Math.ceil(p.convert(k*P)),0);if(h){var Q=Y.computedYAdjust;if(Q===undefined){var E=Y.get("lineHeight");if(E=="normal"){E="1em"}else{if(!isNaN(E)){E+="em"}}Y.computedYAdjust=Q=0.5*(a(ad,E)-parseFloat(ai.height))}if(Q){ai.marginTop=Math.ceil(Q)+"px";ai.marginBottom=Q+"px"}}return y}})());Cufon.registerEngine("canvas",(function(){var b=document.createElement("canvas");if(!b||!b.getContext||!b.getContext.apply){return}b=null;var a=Cufon.CSS.supports("display","inline-block");var e=!a&&(document.compatMode=="BackCompat"||/frameset|transitional/i.test(document.doctype.publicId));var f=document.createElement("style");f.type="text/css";f.appendChild(document.createTextNode(("cufon{text-indent:0;}@media screen,projection{cufon{display:inline;display:inline-block;position:relative;vertical-align:middle;"+(e?"":"font-size:1px;line-height:1px;")+"}cufon cufontext{display:-moz-inline-box;display:inline-block;width:0;height:0;overflow:hidden;text-indent:-10000in;}"+(a?"cufon canvas{position:relative;}":"cufon canvas{position:absolute;}")+"}@media print{cufon{padding:0;}cufon canvas{display:none;}}").replace(/;/g,"!important;")));document.getElementsByTagName("head")[0].appendChild(f);function d(p,h){var n=0,m=0;var g=[],o=/([mrvxe])([^a-z]*)/g,k;generate:for(var j=0;k=o.exec(p);++j){var l=k[2].split(",");switch(k[1]){case"v":g[j]={m:"bezierCurveTo",a:[n+~~l[0],m+~~l[1],n+~~l[2],m+~~l[3],n+=~~l[4],m+=~~l[5]]};break;case"r":g[j]={m:"lineTo",a:[n+=~~l[0],m+=~~l[1]]};break;case"m":g[j]={m:"moveTo",a:[n=~~l[0],m=~~l[1]]};break;case"x":g[j]={m:"closePath"};break;case"e":break generate}h[g[j].m].apply(h,g[j].a)}return g}function c(m,k){for(var j=0,h=m.length;j<h;++j){var g=m[j];k[g.m].apply(k,g.a)}}return function(V,w,P,t,C,W){var k=(w===null);if(k){w=C.getAttribute("alt")}var A=V.viewBox;var m=P.getSize("fontSize",V.baseSize);var B=0,O=0,N=0,u=0;var z=t.textShadow,L=[];if(z){for(var U=z.length;U--;){var F=z[U];var K=m.convertFrom(parseFloat(F.offX));var I=m.convertFrom(parseFloat(F.offY));L[U]=[K,I];if(I<B){B=I}if(K>O){O=K}if(I>N){N=I}if(K<u){u=K}}}var Z=Cufon.CSS.textTransform(w,P).split("");var E=V.spacing(Z,~~m.convertFrom(parseFloat(P.get("letterSpacing"))||0),~~m.convertFrom(parseFloat(P.get("wordSpacing"))||0));if(!E.length){return null}var h=E.total;O+=A.width-E[E.length-1];u+=A.minX;var s,n;if(k){s=C;n=C.firstChild}else{s=document.createElement("cufon");s.className="cufon cufon-canvas";s.setAttribute("alt",w);n=document.createElement("canvas");s.appendChild(n);if(t.printable){var S=document.createElement("cufontext");S.appendChild(document.createTextNode(w));s.appendChild(S)}}var aa=s.style;var H=n.style;var j=m.convert(A.height);var Y=Math.ceil(j);var M=Y/j;var G=M*Cufon.CSS.fontStretch(P.get("fontStretch"));var J=h*G;var Q=Math.ceil(m.convert(J+O-u));var o=Math.ceil(m.convert(A.height-B+N));n.width=Q;n.height=o;H.width=Q+"px";H.height=o+"px";B+=A.minY;H.top=Math.round(m.convert(B-V.ascent))+"px";H.left=Math.round(m.convert(u))+"px";var r=Math.max(Math.ceil(m.convert(J)),0)+"px";if(a){aa.width=r;aa.height=m.convert(V.height)+"px"}else{aa.paddingLeft=r;aa.paddingBottom=(m.convert(V.height)-1)+"px"}var X=n.getContext("2d"),D=j/A.height;X.scale(D,D*M);X.translate(-u,-B);X.save();function T(){var x=V.glyphs,ab,l=-1,g=-1,y;X.scale(G,1);while(y=Z[++l]){var ab=x[Z[l]]||V.missingGlyph;if(!ab){continue}if(ab.d){X.beginPath();if(ab.code){c(ab.code,X)}else{ab.code=d("m"+ab.d,X)}X.fill()}X.translate(E[++g],0)}X.restore()}if(z){for(var U=z.length;U--;){var F=z[U];X.save();X.fillStyle=F.color;X.translate.apply(X,L[U]);T()}}var q=t.textGradient;if(q){var v=q.stops,p=X.createLinearGradient(0,A.minY,0,A.maxY);for(var U=0,R=v.length;U<R;++U){p.addColorStop.apply(p,v[U])}X.fillStyle=p}else{X.fillStyle=P.get("color")}T();return s}})());
/*--|/home/user/ngn-env/ngn/i/js/ngn/Ngn.js|--*/
Ngn.toObj = function(s, value) {
  var a = s.split('.');
  for (var i = 0; i < a.length; i++) {
    var ss = a.slice(0, i + 1).join('.');
    eval('var def = ' + ss + ' === undefined');
    if (def) eval((i == 0 ? 'var ' : '') + ss + ' = {}');
  }
  if (value) eval(s + ' = value');
};

if (!Ngn.tpls) Ngn.tpls = {};

/*--|/home/user/ngn-env/bc/scripts/js/base.php|--*/
Ngn.toObj('Ngn.sd.baseUrl', 'http://bcreator.majexa.ru');

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.RequiredOptions.js|--*/
Ngn.RequiredOptions = new Class({
  Extends: Options,

  requiredOptions: [],

  setOptions: function(options) {
    this.parent(options);
    for (var i = 0; i++; i < this.requiredOptions.length) {
      if (!this.options[this.requiredOptions[i]])
        throw new Error('Required option ' + this.requiredOptions[i] + ' not defined');
    }
    return this;
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.js|--*/
Ngn.Dialog = new Class({
  Implements: [Ngn.RequiredOptions, Events],
  options: {
    id: 'dlg', // Уникальный идентификатор диалога. Если не задан, то формируется, как "dlg + random string"
    autoShow: true, // Показывать диалог при создании класса. Иначе используется _Ngn.Dialog.show_
    buttons: null, // Набор дополнительные кнопок в подвале. Формат объекта: {name: 'Name', text: 'Button text', class_name: 'CSS class', action: function() {}, tabindex: 1}
    cancel: null,
    cancelClass: 'cancel',
    cancelText: 'Cancel',
    cancelDestroy: true,
    callback: null,
    center: true,
    dialogClass: 'dialog',
    draggable: true,
    fxOptions: {},
    footer: null,
    footerClass: 'dialog-footer iconsSet',
    force: true,
    height: 'auto',
    message: null,
    messageAreaClass: 'dialog-message',
    messageBoxClass: 'mid-float-box',
    noTitleClass: 'mav-no-title',
    noFooterClass: 'mav-no-footer',
    ok: null,
    okClass: 'ok',
    okText: 'OK',
    okDestroy: true,
    parent: null,
    shadeClass: 'dialog-shade',
    styles: {},
    title: '',
    titleBarClass: 'dialog-title',
    titleClose: true,
    titleCloseClass: 'icon-button md-closer',
    titleCloseTitle: 'Close',
    titleTextClass: 'md-title-text move',
    url: null,
    useFx: !Browser.ie,
    //'useFx: false,
    width: 550,
    top: 30,
    bindBuildMessageFunction: false,
    noPadding: true,
    setMessageDelay: null,
    forceShadeClose: false,
    jsonRequest: false,
    reduceHeight: false,
    baseZIndex: 300,
    savePosition: false,
    vResize: false,
    fixed: false,
    //maxHeight: null,
    onComplete: Function.from(),
    onClose: Function.from(),
    onOkClose: Function.from(),
    onCancelClose: Function.from(),
    onHide: Function.from(),
    onRequest: Function.from(),
    onShow: Function.from()
  },

  delayedShow: false,
  closed: false,
  dialog: null,
  drag: null,
  footer: null,
  fx: null,
  grabbed: null,
  message: null,
  parent: null,
  request: null,
  titlebar: null,
  isOkClose: false,
  btns: {},
  status: null,

  initialize: function(options) {
    this.setOptions(options);
    // new Image().src = '/i/img/dialog/cross-pushed.png'; // preloading of hover cross
    if (this.options.id == 'dlg') {
      this.options.id = 'dlg' + Ngn.String.rand(5);
      if (this.options.savePosition) throw new Error('Can not save position on random ID');
      if (this.options.vResize) throw new Error('Can not save size on random ID');
    }
    if (this.options.vResize && typeof(this.options.vResize) != 'function') {
      this.options.vResize = Ngn.Dialog.VResize;
    }
    if (this.options.noPadding) this.options.messageAreaClass += ' dialog-nopadding';
    if (this.options.reduceHeight) this.options.messageAreaClass += ' dialog-scroll';
    if ($(this.options.id + '_dialog')) {
      console.debug('Dialog with id=' + this.options.id + ' already opened. Aborted');
      return null;
    }
    if (this.options.bindBuildMessageFunction) this.options.message = this.buildMessage.bind(this, this.options.message);
    this.request = new (this.options.jsonRequest ? Ngn.Request.JSON : Ngn.Request)({
      evalScripts: true,
      onSuccess: this.urlResponse.bind(this),
      onFailure: this.errorMessage.bind(this)
    });
    this.dialogId = this.options.id + '_dialog';
    this.dialogN = Ngn.Dialog.dialogs.getLength() + 1;
    Ngn.Dialog.dialogs[this.dialogId] = this;
    this.parentElement = $((this.options.parent || document.body));
    var dialog_styles = Object.merge({
      'display': 'none',
      'width': this.options.width.toInt() + 'px',
      'z-index': this.options.baseZIndex + (this.dialogN * 2)
    }, this.options.styles);
    this.dialog = new Element('div', {
      'id': this.dialogId,
      'class': this.options.dialogClass,
      //'opacity': (this.options.useFx ? 0 : 1),
      'styles': dialog_styles
    }).inject(this.parentElement);
    if (this.options.fixed) this.dialog.setStyle('position', 'fixed');
    this.fx = this.options.useFx ? new Fx.Tween(this.dialog, Object.merge({
      duration: 300
    }, this.options.fxOptions)) : null;
    if (this.fx) this.fx.set('opacity', 0);

    //dialog-message
    //if (this.options.maxHeight)
    //this.message.setStyle('max-height', this.options.maxHeight+'px');
    //this.options.maxHeight;

    // dialog box sections and borders
    this.eMessage = new Element('div', {
      'class': this.options.messageBoxClass
    }).inject(this.dialog);

    // dialog box title
    if (this.options.title !== false) {
      this.titlebar = new Element('div', {
        'id': this.options.id + '_title',
        'class': this.options.titleBarClass
      }).inject(this.eMessage);

      this.titleText = new Element('span', {'class': this.options.titleTextClass, 'html': this.options.title}).inject(this.titlebar);

      if (this.options.titleClose != false) {
        this.btnClose = Ngn.Btn.opacity(new Element('span', {
          'id': this.options.id + '_closer',
          'class': this.options.titleCloseClass
          //'title': this.options.titleCloseTitle
        }).inject(this.titlebar).addEvent('click', this.close.bind(this)));
      }
    }

    // dialog box message
    this.message = new Element('div', {
      'id': this.options.id + '_message',
      'class': this.options.messageAreaClass + (this.options.title === false ? ' ' + this.options.noTitleClass : '') + (this.options.footer === false ? ' ' + this.options.noFooterClass : '')
    }).inject(this.eMessage);
    if (this.options.height != 'auto') this.message.setStyle('max-height', this.options.height.toInt() + 'px');
    if (this.options.height != 'auto') this.message.setStyle('overflow-y', 'auto');
    this.beforeInitRequest();
    if (this.options.url != undefined) {
      this.dotter = new Ngn.Dotter(this.message);
      this.dotter.start();
      this.request.options.url = this.options.url;
      this.startupLoading(true);
      (function() {
        this.request.send()
      }).delay(100, this);
      if (this.options.autoShow) this.delayedShow = true;
    } else if (this.options.message != undefined) {
      if (this.options.setMessageDelay) {
        (function() {
          this.setMessage(this.options.message);
        }).delay(this.options.setMessageDelay, this);
      } else {
        this.setMessage(this.options.message);
      }
    }

    // dialog footer
    if (this.options.footer !== false) {
      this.footer = new Element('div', {
        'id': this.options.id + '_footer',
        'class': this.options.footerClass
      }).inject(this.eMessage);
      new Element('div', {'class': 'foot-wrap'}).inject(this.footer);
      if (this.options.ok !== false) {
        this.createButton('ok', this.options.id, this.options.okText, this.options.okClass, this.options.ok, !this.options.okDestroy, undefined, true).inject(this.footer.firstChild, 'top');
      }
      if (this.options.cancel !== false) {
        this.createButton('cancel', this.options.id, this.options.cancelText, this.options.cancelClass, this.options.cancel, !this.options.cancelDestroy).inject(this.footer.firstChild, 'top');
      }
      this.status = new Element('div', {'class': 'foot-status'}).inject(this.footer.firstChild, 'top');
      if (typeOf(this.options.buttons) == 'object') {
        for (var btn in this.options.buttons) {
          btn = this.options.buttons[btn];
          this.createButton(btn.name, this.options.id, btn.text, btn.class_name, btn.action, !(btn.auto_close), ((btn.tabindex != undefined) ? btn.tabindex : null)).inject(this.footer.firstChild, 'top');
        }
      }
    }

    // set dialog to draggable
    if (this.options.draggable && this.titlebar) {
      this.drag = new Drag.Move(this.dialog, {
        handle: this.titlebar,
        onComplete: function() {
          if (this.options.savePosition) Ngn.Storage.json.set('dialogPos' + this.options.id, this.dialog.getPosition());
          window.fireEvent('dialogMove', this);
        }.bind(this)
      });
    }

    this.fireEvent('complete');
    this.init();

    if (this.options.vResize) {
      if (this.options.url) {
        this.addEvent('request', function() {
          new this.options.vResize(this);
        }.bind(this));
      } else {
        new this.options.vResize(this);
      }
    }

    // close on escape
    this.dialog.addEvent('keydown', function(e) {
      if (e.key == 'esc') this.close();
    }.bind(this));
    // execute onComplete function, if present.
    if (this.options.autoShow && !this.request.running) {
      this.show();
    }
    window.document.currentDialog = this;
  },

  initSavedPosition: function() {
    if (this.options.id == 'dlg') throw new Error('Can not use default id for such dialog');
    var pos = Ngn.Storage.json.get('dialogPos' + this.options.id);
    if (pos) this.dialog.setPosition(pos); else this.initCenterPosition();
  },

  beforeInitRequest: function() {
  },

  init: function() {
  },

  initReduceHeight: function(force) {
    if (force || !this.options.reduceHeight) return;
    //if (this.initHeight) return;
    //this.initHeight = this.message.getSize().y;
    //if (!this.initHeight) throw new Error('Cannot be null');
    window.addEvent('resize', this.reduceHeight.bind(this));
    this.reduceHeight();
  },

  reduceHeight: function() {
    var maxH = window.getSize().y - 150;
    this.message.setStyle('max-height', maxH + 'px');
    return;
    if (this.initHeight < maxH)
      this.message.setStyle('height', this.initHeight + 'px'); else
      this.message.setStyle('height', maxH + 'px');
  },

  setTitle: function(title) {
    if (this.options.title === false) return;
    this.prevTitle = this.options.title;
    this.title = title;
    this.titleText.set('html', title);
  },

  restorePrevTitle: function() {
    if (this.options.title === false) return;
    this.titleText.set('html', this.prevTitle);
  },

  setMessage: function(_message, delayedShow) {
    var message = (typeOf(_message) == 'function' ? _message() : _message);
    if (this.dotter) this.dotter.stop();
    if (typeOf(message) == 'element') {
      this.grabbed = message.getParent();
      if (this.grabbed != null) {
        message.removeClass('none');
        this.message.grab(message);
      } else {
        message.inject(this.message);
      }
    } else {
      this.message.set('html', message);
    }
    if (delayedShow == undefined) delayedShow = this.delayedShow;
    if (this.delayedShow && delayedShow) {
      this.delayedShow = false;
      this.show();
    }

    /*
     if (this.titlebar && this.btnClose) {
     this.titleText.setStyle('width',
     (this.titlebar.getSizeWithoutPadding().x
     - this.btnClose.getSizeWithMargin().x
     - 10) + 'px');
     }
     */

    this.initReduceHeight();
    this.initPosition();
  },

  initPosition: function() {
    this.options.savePosition ? this.initSavedPosition() : this.initCenterPosition();
  },

  setOkText: function(text) {
    if (!this.btns.ok) return;
    this.btns.ok.getElement('a').set('html', this.getButtonInnerHtml(text));
  },

  setWidth: function(width) {
    this.options.width = width;
    this.dialog.setStyle('width', width.toInt() + 'px');
    this.initPosition();
  },

  enlargeWidth: function(width) {
    if (width > this.options.width) this.setWidth(width);
  },

  toggle: function(name, flag) {
    if (!this.btns[name]) return;
    this.btns[name].setStyle('display', flag ? 'block' : 'none');
  },

  errorMessage: function(xhr) {
  },

  urlResponse: function(_response) {
    if (this.closed) return;
    this.startupLoading(false);
    this.dotter.stop();
    if (!this.options.jsonRequest) {
      this.setMessage(_response, false);
    } else {
      if (_response.title) this.setTitle(_response.title);
      this.setMessage('', false);
    }
    this.fireEvent('request', _response);
  },

  getButtonInnerHtml: function(text) {
    return '<span><i></i>' + text + '</span>';
  },

  createButton: function(name, id, text, cls, action, unforceClose, tabindex, okClose) {
    var self = this;
    var eButton = new Element('div', { 'class': 'goright image-button ' + cls });
    var eLink = new Element('a', {
      id: id + '_' + name,
      href: 'javascript:void(0)',
      'class': 'btn',
      tabindex: (tabindex != undefined ? tabindex : (++this.tab_index)),
      html: this.getButtonInnerHtml(text)
    }).inject(eButton);
    if (action && action instanceof Function) {
      eLink.addEvent('click', action);
    }
    if (!unforceClose) eLink.addEvent('click', okClose ? this.okClose.bind(this) : this.close.bind(this));
    /*
     if (!unforceClose) eLink.addEvent('click', function(e) {
     e.preventDefault();
     okClose ? this.okClose.bind(this) : this.close.bind(this);
     }.bind(this));
     */
    this.btns[name] = eButton;
    return eButton;
  },

  openShade: function() {
    if (this.eShade != undefined) return;
    this.eShade = new Element('div', {
      'class': this.options.shadeClass,
      'styles': {
        'z-index': this.options.baseZIndex + (this.dialogN * 2) - 1
      }
    }).inject(document.body);
    return this;
  },

  closeShade: function() {
    this.eShade.dispose();
  },

  show: function() {
    if (this.options.force) this.openShade();
    this.dialog.setStyle('display', '');
    this.initPosition();
    this.fireEvent('show');
    if (this.options.useFx) {
      this.fx.start('opacity', 0, 1);
    }
  },

  hide: function() {
    this.dialog.setStyle('display', 'none');
    this.fireEvent('hide');
  },

  okClose: function() {
    this.isOkClose = true;
    this.close();
  },

  close: function() {
    if (this.options.useFx) {
      this.fx.start('opacity', 1, 0).chain(this.finishClose.bind(this));
    } else {
      this.finishClose();
    }
  },

  finishClose: function() {
    document.getElement('body').removeClass('noscroll');
    if ($(this.dialog)) {
      this.closed = true;
      if (this.grabbed != undefined) {
        this.grabbed.grab(this.message.firstChild);
      }
      this.fireEvent('beforeClose');
      this.dialog.empty().dispose();
      Ngn.Dialog.dialogs.erase(this.dialogId);
      if (this.options.force) this.closeShade();
      this.fireEvent('close');
      this.isOkClose ? this.fireEvent('okClose') : this.fireEvent('cancelClose');
    }
  },

  initCenterPosition: function(fx) {
    if (!this.options.center) return;
    var parXY = this.parentElement.getCoordinates();
    var parScroll = this.parentElement.getScroll();
    var elmXY = this.dialog.getCoordinates();
    var elmWH = this.dialog.getSize();
    var dialogH = Math.round((parXY.height - elmWH.y) / 5);
    if (dialogH < 20) dialogH = 20;
    if (this.options.center !== 'y') {
      if (fx) new Fx.Tween(this.dialog, { duration: 'short' }).start('left', ((parXY.width - elmWH.x) / 2) + 'px'); else this.dialog.setStyle('left', ((parXY.width - elmWH.x) / 2) + 'px');
    }
    if (this.options.center !== 'x') {
      if (fx) new Fx.Tween(this.dialog, { duration: 'short' }).start('top', (dialogH + parScroll.y) + 'px');
      //else this.dialog.setStyle('top', (dialogH + parScroll.y) + 'px');
      else this.dialog.setStyle('top', this.options.top + 'px');
    }
  },

  startupLoading: function(flag) {
    flag ? this.message.addClass('dialog-loading') : this.message.removeClass('dialog-loading');
    this.loading(flag);
  },

  loading: function(flag) {
    this.toggle('ok', !flag);
    this.toggle('cancel', !flag);
    if (this.footer) {
      this.message.removeClass('loading');
      flag ? this.footer.addClass('loading') : this.footer.removeClass('loading');
    } else {
      flag ? this.message.addClass('loading') : this.message.removeClass('loading');
    }
  }

});

Ngn.Dialog.openWhenClosed = function(closingDialogObject, openDialogClass, options) {
  var id = function() {
    if (!closingDialogObject.closed) return;
    clearInterval(id);
    new openDialogClass(options);
  }.periodical(500);
};

Ngn.Dialog.dialogs = new Hash({});

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.String.js|--*/
Ngn.String = {};
Ngn.String.rand = function(len) {
  var allchars = 'abcdefghijknmpqrstuvwxyzABCDEFGHIJKLNMPQRSTUVWXYZ'.split('');
  var string = '';
  for (var i = 0; i < len; i++) {
    string += allchars[Ngn.Number.randomInt(0, allchars.length - 1)];
  }
  return string;
};

Ngn.String.ucfirst = function(str) {
  var f = str.charAt(0).toUpperCase();
  return f + str.substr(1, str.length - 1);
};

Ngn.String.hashCode = function(str) {
  var hash = 0, i, chr, len;
  if (str.length == 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

Ngn.String.trim = function(s) {
  return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};


/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Number.js|--*/
Ngn.Number = {};
Ngn.Number.randomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.VResize.js|--*/
Ngn.Dialog.VResize = new Class({

  initialize: function(dialog) {
    this.dialog = dialog;
    Ngn.Element._whenElPresents(this.getResizebleEl.bind(this), this.init.bind(this));
  },

  init: function() {
    var eResizeble = this.getResizebleEl();
    this.eHandler = new Element('div', {'class': 'vResizeHandler'}).inject(this.dialog.eMessage);
    this.dialog.dialog.addClass('vResize');
    var storeK = this.dialog.options.id + '_height';
    var h = Ngn.Storage.get(storeK);
    if (h) eResizeble.setStyle('height', h + 'px');
    new Drag(eResizeble, {
      preventDefault: true,
      stopPropagation: true,
      snap: 0,
      handle: this.eHandler,
      modifiers: {y: 'height', x: null},
      onComplete: function() {
        Ngn.Storage.set(storeK, eResizeble.getSize().y);
      }
    });
    this.eHandler.inject(this.dialog.eMessage);
  },

  getResizebleEl: function() {
    return this.dialog.eMessage;
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Element.js|--*/
Ngn.Element = {};

Ngn.Element._whenElPresents = function(elGetter, action, maxAttempts) {
  var el;
  el = elGetter();
  find = function() {
    return el = elGetter();
  };
  if (find()) {
    action(el);
    return;
  }
  maxAttempts = maxAttempts || 10;
  var n = 1;
  var id = function() {
    n++;
    if (find()) {
      clearTimeout(id);
      action(el);
      return;
    }
    if (n == maxAttempts) {
      clearTimeout(id);
      throw new Error('Element not presents after ' + maxAttempts + ' attempts');
    }
  }.periodical(200);
};

Ngn.Element.whenElPresents = function(eParent, selector, action) {
  return Ngn.Element._whenElPresents(function() {
    return eParent.getElement(selector);
  }, action);
};

Ngn.Element.bindSizes = function(eFrom, eTo) {
  eFrom.addEvent('resize', function() {
    eTo.setSize(eFrom.getSize());
  });
};

Ngn.Element.initTips = function(els) {
  if (!Ngn.tips) Ngn.Element.tips = new Tips(els);
};

Ngn.Element.setTip = function(el, title) {
  if (!Ngn.Element.tips) Ngn.Element.initTips(el);
  if (el.retrieve('tip:native')) {
    Ngn.Element.tips.hide(el);
    el.store('tip:title', title);
  } else {
    Ngn.Element.tips.attach(el);
  }
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Storage.js|--*/
Ngn.Storage = {
  get: function(key) {
    if (localStorage) {
      var v = localStorage.getItem(key);
    } else {
      var v = Cookie.read(key);
    }
    if (v == 'false') return false; else if (v == 'true') return true; else return v;
  },
  set: function(key, value) {
    if (localStorage) {
      localStorage.setItem(key, value)
    } else {
      Cookie.write(key, value);
    }
  },
  remove: function(key) {
    localStorage.removeItem(key);
  },
  bget: function(key, value) {
    return !!this.get(key);
  }
};

Ngn.Storage.int = {

  get: function(key) {
    return parseInt(Ngn.Storage.get(key));
  }

};

Ngn.Storage.json = {
  get: function(key) {
    try {
      if (localStorage) {
        var r = Ngn.LocalStorage.json.get(key);
      } else {
        var r = JSON.decode(Cookie.read(key));
      }
    } catch (e) {
      var r = {};
    }
    return r;
  },
  set: function(key, data) {
    if (localStorage)
      Ngn.LocalStorage.json.set(key, data); else
      Cookie.write(key, JSON.encode(data));
  }
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.LocalStorage.js|--*/
Ngn.LocalStorage = {

  clean: function() {
    if (!localStorage) return;
    try {
      for (var k in localStorage) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      for (var i = 0; i < localStorage.length; i++)
        localStorage.removeItem(localStorage[i]);
    }
  },

  remove: function(key) {
    if (!localStorage) return false;
    localStorage.removeItem(key);
  }

};

Ngn.LocalStorage.json = {

  get: function(key) {
    if (!localStorage) return false;
    return JSON.decode(localStorage.getItem(key));
  },

  set: function(key, data) {
    localStorage.setItem(key, JSON.encode(data));
  }

};

/*--|/home/user/ngn-env/ngn/i/js/ngn/Ngn.Request.js|--*/
Ngn.Request = new Class({
  Extends: Request,

  id: null,

  initialize: function(options) {
    this.id = Ngn.String.rand(20);
    this.parent(options);
  },

  success: function(text, xml) {
    Ngn.Arr.drop(Ngn.Request.inProgress, this.id);
    if (text.contains('Error: ')) {
      return;
    }
    this.parent(text, xml);
  },

  send: function(options) {
    Ngn.Request.inProgress.push(this.id);
    this.parent(options);
  }

});

Ngn.Request.inProgress = [];

Ngn.Request.Loading = new Class({
  Extends: Ngn.Request,

  success: function(text, xml) {
    Ngn.loading(false);
    this.parent(text, xml);
  },

  send: function(options) {
    Ngn.loading(true);
    this.parent(options);
  }

});

Ngn.json = {};
Ngn.json.decode = function(text, secure) {
  return Ngn.json.process(JSON.decode(text, secure));
};

Ngn.json.process = function(json) {
  if (!json) return json;
  for (var i in json) {
    if (typeof(json[i]) == 'object' || typeof(json[i]) == 'array') {
      json[i] = Ngn.json.process(json[i]);
    } else if (typeOf(json[i]) == 'string') {
      if (json[i].test(/^func: .*/)) {
        json[i] = json[i].replace(/^func: (.*)/, '$1');
        json[i] = eval('(function() {' + json[i] + '})');
      }
    }
  }
  return json;
};

Ngn.Request.JSON = new Class({
  Extends: Request.JSON,

  initialize: function(options) {
    this.id = Ngn.String.rand(20);
    this.parent(options);
  },

  success: function(text) {
    Ngn.Arr.drop(Ngn.Request.inProgress, this.id);
    try {
      this.response.json = Ngn.json.decode(text, this.options.secure);
    } catch (e) {
      throw new Error('non-json result by url ' + this.options.url + '. result:\n' + text);
    }
    if (this.response.json === null) {
      this.onSuccess({});
      return;
    }
    if (this.response.json.actionDisabled) {
      window.location.reload(true);
      return;
    }
    if (this.response.json.error) {
      Ngn.Request.JSON.throwServerError(this.response.json);
      return;
    }
    // sflm
    if (this.response.json.sflJsDeltaUrl) {
      Asset.javascript(this.response.json.sflJsDeltaUrl, {
        onLoad: function() {
          this.onSuccess(this.response.json, text);
        }.bind(this)
      });
    } else {
      this.onSuccess(this.response.json, text);
    }
    if (this.response.json.sflCssDeltaUrl) Asset.css(this.response.json.sflCssDeltaUrl);
  },

  send: function(options) {
    Ngn.Request.inProgress.push(this.id);
    this.parent(options);
  }

});

Ngn.Request.JSON.throwServerError = function(r) {
  throw new Error(r.error.message + "\n----------\n" + r.error.trace)
};

Ngn.Request.sflJsDeltaUrlOnLoad = false;

Ngn.Request.Iface = {};

Ngn.Request.Iface.loading = function(state) {
  var el = $('globalLoader');
  if (!el) {
    var el = Elements.from('<div id="globalLoader" class="globalLoader"></div>')[0].inject(document.getElement('body'), 'top');
    el.setStyle('top', window.getScroll().y);
    window.addEvent('scroll', function() {
      el.setStyle('top', window.getScroll().y);
    });
  }
  el.setStyle('visibility', state ? 'visible' : 'hidden');
};

Ngn.Request.settings = function(name, callback) {
  Asset.javascript('/c2/jsSettings/' + name, {
    onLoad: function() {
      callback(eval('Ngn.settings.' + name.replace(/\//g, '.')));
    }
  });
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Arr.js|--*/
Ngn.Arr = {};
Ngn.Arr.inn = function(needle, haystack, strict) {  // Checks if a value exists in an array
  var found = false, key, strict = !!strict;
  for (key in haystack) {
    if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
      found = true;
      break;
    }
  }
  return found;
};

Ngn.Arr.drop = function(array, value) {
  return array.splice(array.indexOf(value), 1);
};


/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.Btn.js|--*/
// @requires Ngn.Frm

Ngn.Btn = new Class({
  Implements: [Options],

  options: {
    usePushed: false,
    request: false,
    fileUpload: false
  },

  pushed: false,

  initialize: function(el, action, options) {
    //if (options.request) this.request = options.request;
    this.setOptions(options);
    this.setAction(action);
    this.el = el;
    this.toggleDisabled(true);
    var up = function() {
      if (!this.enable) return;
      if (!this.options.usePushed) this.el.removeClass('pushed');
    }.bind(this);
    var down = function() {
      if (!this.enable) return;
      if (!this.options.usePushed) this.el.addClass('pushed');
    }.bind(this);
    this.el.addEvent('mousedown', down);
    this.el.addEvent('tap', down);
    this.el.addEvent('mouseup', up);
    this.el.addEvent('mouseout', up);
    this.el.addEvent('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      if (!this.enable) return;
      //if (this.request) this.toggleDisabled(false);
      this.runAction();
    }.bind(this));
    //if (this.request) {
    //  this.request.addEvent('complete', function() {
    //    this.toggleDisabled(true);
    //  }.bind(this));
    //}
    if (this.options.fileUpload) {
      new Ngn.Btn.FileUpload(this, this.options.fileUpload);
    }
    this.init();
  },

  setAction: function(action) {
    if (!action) action = function() {
    };
    if (typeof(action) == 'function') this.action = { action: action.bind(this) };
    else {
      if (action.classAction) {
        // do nothing. action is class
      } else {
        if (action.args) {
          action.action = action.action.pass(action.args, this);
        } else {
          action.action = action.action.bind(this);
        }
      }
      this.action = action;
    }
  },

  runAction: function() {
    if (!this.pushed && this.action.confirm) {
      var opt = {
        id: this.action.id,
        onOkClose: function() {
          this._action();
        }.bind(this)
      };
      if (typeof(this.action.confirm) == 'string') opt.message = this.action.confirm;
      new Ngn.Dialog.Confirm.Mem(opt);
    } else {
      this._action();
    }
  },

  _action: function() {
    this.action.action();
    if (this.options.usePushed) this.togglePushed(!this.pushed);
    if (this.request) this.request.send();
  },

  init: function() {
  },

  togglePushed: function(pushed) {
    this.pushed = pushed;
    this.pushed ? this.el.addClass('pushed') : this.el.removeClass('pushed');
  },

  toggleDisabled: function(enable) {
    this.enable = enable;
    enable ? this.el.removeClass('nonActive') : this.el.addClass('nonActive');
  }

});

/**
 * Создаёт и возвращает html-элемент кнопки
 *
 * @param opt
 * @param opt.cls CSS-класс
 * @param opt.title Заголовок кнопки
 * @param opt.caption Значение тега "title"
 * @returns {HTMLElement}
 */
Ngn.Btn.btn = function(opt) {
  if (!opt) opt = {};
  if (!opt.cls) opt.cls = '';
  if (!opt.title && !opt.cls.contains('btn')) opt.cls = 'bordered ' + opt.cls;
  var a = new Element('a', Object.merge({
    'class': (opt.cls.contains('icon') ? '' : 'smIcons ') + opt.cls,
    html: opt.title || ''
  }, opt.prop || {}));
  if (opt.caption) {
    a.set('title', opt.caption);
    //Ngn.Element.setTip(a, opt.caption);
  }
  new Element('i').inject(a, 'top');
  return a;
};

/**
 * Кнопка с заголовком
 */
Ngn.Btn.btn1 = function(title, cls, prop) {
  return Ngn.Btn.btn({
    title: title,
    cls: cls,
    prop: prop
  });
};

/**
 * Кнопка с всплывающей подсказкой
 */
Ngn.Btn.btn2 = function(caption, cls, prop) {
  return Ngn.Btn.btn({
    caption: caption,
    cls: cls,
    prop: prop
  });
};

Ngn.Btn.flag1 = function(defaultFirstState, state1, state2) {
  return Ngn.Btn.__flag(Ngn.Btn.tn1, defaultFirstState, state1, state2);
};

Ngn.Btn.flag2 = function(defaultFirstState, state1, state2) {
  return Ngn.Btn.__flag(Ngn.Btn.btn2, defaultFirstState, state1, state2);
};

Ngn.Btn.__flag = function(btn, defaultFirstState, state1, state2) {
  var deflt = defaultFirstState ? state1 : state2;
  return Ngn.Btn._flag(Ngn.Btn.btn2(deflt.title, deflt.cls), state1, state2);
};

Ngn.Btn._flag = function(eA, state1, state2) {
  return eA.addEvent('click', function(e) {
    e.preventDefault();
    var flag = eA.hasClass(state1.cls);
    var newState = flag ? state2 : state1;
    var curState = flag ? state1 : state2;
    if (curState.confirm !== undefined) if (!confirm(curState.confirm)) return;
    new Ngn.Request({
      url: curState.url,
      onComplete: function() {
        eA.removeClass(curState.cls);
        eA.addClass(newState.cls);
        eA.set('title', newState.title);
        //Ngn.addTips(eA);
      }
    }).send();
  });
};

Ngn.Btn.Action = new Class({
  action: function() {}
});

Ngn.Btn.FileUpload = new Class({
  Implements: [Options],

  options: {
    // url: '',
    mime: '',
    onRequest: function() {
    },
    onComplete: function() {
    }
  },

  initialize: function(btn, options) {
    this.btn = btn;
    this.setOptions(options);
    var eUploadWrapper = new Element('div', {styles: {
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden'
    }}).wraps(this.btn.el);
    var eEile = new Element('input', {type: 'file', accept: this.options.mime, events: {
      mouseover: function() {
        this.getParent().getElement('a').addClass('over');
      },
      mouseout: function() {
        this.getParent().getElement('a').removeClass('over');
      }
    }, styles: {
      position: 'absolute',
      cursor: 'pointer',
      width: this.btn.el.getSize().x + 'px',
      height: this.btn.el.getSize().y + 'px',
      top: '0px',
      left: '0px',
      'z-index': 2,
      'opacity': 0
    }}).inject(eUploadWrapper, 'bottom');
    eEile.addEvent('change', function() {
      req.append('file', this.files[0]);
      req.send();
    });
    this.options.onRequest = this.options.onRequest.bind(this);
    this.options.onComplete = this.options.onComplete.bind(this);
    var req = new Ngn.Request.File({
      url: this.options.url,
      formData: {
        name: 'bg'
      },
      onRequest: function() {
        this.btn.toggleDisabled(false);
        this.options.onRequest();
      }.bind(this),
      onProgress: function(event) {
        var loaded = event.loaded, total = event.total;
        var proc = parseInt(loaded / total * 100, 10).limit(0, 100);
        //c ('Загружено ' + proc + '%');
        //if (proc == 100) console.debug('Загрузка завершена');
      }.bind(this),
      onComplete: function(r) {
        this.btn.toggleDisabled(true);
        this.options.onComplete(r);
        eEile.set('value', '');
        req.clear();
      }.bind(this)
    });

  }

});

Ngn.Btn.addAction = function(selector, action, parent) {
  var esBtn = (parent ? parent : document).getElements(selector);
  if (!esBtn) return;
  esBtn.each(function(eBtn) {
    action = action.pass(eBtn);
    eBtn.addEvent('click', function(e) {
      e.preventDefault();
      action(e);
    });
  });
};

Ngn.Btn.opacity = function(eBtn, outOp, overOp) {
  var fx = new Fx.Morph(eBtn, { duration: 'short', link: 'cancel' });
  if (!outOp != undefined) outOp = 0.4;
  if (!overOp != undefined) overOp = 1;
  eBtn.setStyle('opacity', outOp);
  eBtn.addEvent('mouseover', function() {
    fx.start({'opacity': [outOp, overOp]});
  });
  eBtn.addEvent('mouseout', function() {
    fx.start({'opacity': [overOp, outOp]});
  });
  return eBtn;
};

Ngn.Btn.addAjaxAction = function(eBtn, action, onComplete) {
  if (!eBtn) return;
  onComplete = onComplete ? onComplete : Function.from();
  eBtn.addEvent('click', function(e) {
    e.preventDefault();
    if (eBtn.hasClass('confirm') && !Ngn.confirm()) return;
    if (eBtn.hasClass('loading')) return;
    if (eBtn.retrieve('disabled')) return;
    eBtn.addClass('loading');
    new Ngn.Request({
      url: eBtn.get('href').replace(action, 'ajax_' + action),
      onComplete: function() {
        onComplete();
        eBtn.removeClass('loading');
      }
    }).send();
  });
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Msg.js|--*/
Ngn.Dialog.Msg = new Class({
  Extends: Ngn.Dialog,

  options: {
    noPadding: false,
    messageAreaClass: 'dialog-message large',
    title: false
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Confirm.js|--*/
Ngn.Dialog.Confirm = new Class({
  Extends: Ngn.Dialog.Msg,

  options: {
    width: 300,
    message: 'Вы уверены?'
  },

  initialize: function(_opts) {
    var opts = Object.merge(_opts, {
      cancel: false,
      titleClose: false,
      ok: this.closeAction.bind(this, true),
      cancel: this.closeAction.bind(this, false)
    });
    this.parent(opts);
  },

  closeAction: function(_confirmed) {
    _confirmed ? this.okClose() : this.close();
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Confirm.Mem.js|--*/
Ngn.Dialog.Confirm.Mem = new Class({
  Extends: Ngn.Dialog.Confirm,

  options: {
    width: 250,
    okText: 'Удалить',
    bindBuildMessageFunction: true,
    notAskSomeTime: false
  },

  timeoutId: null,

  initialize: function(_opts) {
    this.setOptions(_opts);
    this.options.dialogClass += ' dialog-confirm';
    if (this.options.notAskSomeTime) {
      if (this.timeoutId) clearTimeout(this.timeoutId);
      this.timeoutId = (function() {
        Ngn.Storage.remove(this.options.id + 'confirmMem');
      }).delay(120000, this);
    }
    if (Ngn.Storage.get(this.options.id + 'confirmMem')) {
      this.fireEvent('okClose');
      return;
    }
    this.parent(_opts);
  },

  buildMessage: function(_msg) {
    var eMessageCont = new Element('div');
    if (this.options.notAskSomeTime) {
      var checkboxCaption = 'Неспрашивать меня об этом какое-то время';
    } else {
      var checkboxCaption = 'Больше не спрашивать по этому поводу';
    }
    new Element('div', {'html': '<h3 style="margin-top:0px">' + _msg + '</h3>'}).inject(eMessageCont);
    Elements.from('<span class="checkbox"><input type="checkbox" id="confirmMem' + this.options.id + '" class="confirmMem" /><label for="confirmMem' + this.options.id + '">' + checkboxCaption + '</label></span>')[0].inject(eMessageCont);
    this.eMemCheckbox = eMessageCont.getElement('.confirmMem');
    return eMessageCont;
  },

  finishClose: function() {
    if (this.isOkClose) {
      console.debug([this.options.id + 'confirmMem', this.eMemCheckbox.get('checked')]);
      Ngn.Storage.set(this.options.id + 'confirmMem', this.eMemCheckbox.get('checked'));
    }
    this.parent();
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Request.File.js|--*/
Ngn.progressSupport = ('onprogress' in new Browser.Request);

// Обёртка для Request с поддержкой FormData
Ngn.Request.File = new Class({
  Extends: Ngn.Request.JSON,

  options: {
    emulation: false, urlEncoded: false, allowDublicates: false, formData: null
  },

  initialize: function(options) {
    this.id = Ngn.String.rand(20);
    this.xhr = new Browser.Request();
    this.setOptions(options);
    this.clear();
    this.headers = this.options.headers;
    if (this.options.formData) for (var i in this.options.formData) this.append(i, this.options.formData[i]);
  },

  clear: function() {
    this.formData = new FormData();
    this._formData = {};
    return this;
  },

  bracketCount: {},

  append: function(key, value) {
    var hasStr = function(haystack, needle) {
      var pos = haystack.indexOf(needle);
      if (pos == -1) {
        return false;
      } else {
        return true;
      }
    };
    var baseKey;
    var multi = hasStr(key, '[]');
    if (!multi && !this.options.allowDublicates && this._formData[key]) return;
    if (multi) {
      baseKey = key.replace('[]', '');
      if (!this.bracketCount[baseKey]) this.bracketCount[baseKey] = 0;
      key = baseKey + '[' + this.bracketCount[baseKey] + ']';
      this.bracketCount[baseKey]++;
    }
    this.formData.append(key, value);
    this._formData[key] = value;
    return this.formData;
  },

  send: function(options) {
    if (!this.check(options)) return this;
    Ngn.Request.inProgress.push(this.id);
    this.options.isSuccess = this.options.isSuccess || this.isSuccess;
    this.running = true;
    var xhr = this.xhr;
    if (Ngn.progressSupport) {
      xhr.onloadstart = this.loadstart.bind(this);
      xhr.onprogress = this.progress.bind(this);
      xhr.upload.onprogress = this.progress.bind(this);
    }
    xhr.open('POST', this.options.url, true);
    xhr.onreadystatechange = this.onStateChange.bind(this);
    Object.each(this.headers, function(value, key) {
      try {
        xhr.setRequestHeader(key, value);
      } catch (e) {
        this.fireEvent('exception', [key, value]);
      }
    }, this);
    this.fireEvent('request');
    xhr.send(this.formData);
    if (!this.options.async) this.onStateChange();
    if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
    return this;
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.elementExtras.js|--*/
Element.implement({
  values: function() {
    var r = {};
    this.getElements('input').each(function(el) {
      if (el.get('type') == 'radio') {
        if (el.get('checked')) {
          r = el.get('value');
        }
      } else if (el.get('type') == 'checkbox') {
        if (el.get('checked')) {
          r[el.get('name')] = el.get('value');
        }
      } else {
        r[el.get('name')] = el.get('value');
      }
    });
    return r;
  },
  getSizeWithMarginBorder: function() {
    var s = this.getSize();
    return {
      x: parseInt(this.getStyle('margin-left')) + parseInt(this.getStyle('margin-right')) + parseInt(this.getStyle('border-left-width')) + parseInt(this.getStyle('border-right-width')) + s.x,
      y: parseInt(this.getStyle('margin-top')) + parseInt(this.getStyle('margin-bottom')) + parseInt(this.getStyle('border-top-width')) + parseInt(this.getStyle('border-bottom-width')) + s.y
    };
  },
  getSizeWithMargin: function() {
    var s = this.getSize();
    return {
      x: parseInt(this.getStyle('margin-left')) + parseInt(this.getStyle('margin-right')) + s.x,
      y: parseInt(this.getStyle('margin-top')) + parseInt(this.getStyle('margin-bottom')) + s.y
    };
  },
  getSizeWithoutBorders: function() {
    var s = this.getSize();
    return {
      x: s.x - parseInt(this.getStyle('border-left-width')) - parseInt(this.getStyle('border-right-width')),
      y: s.y - parseInt(this.getStyle('border-top-width')) - parseInt(this.getStyle('border-bottom-width'))
    };
  },
  getSizeWithoutPadding: function() {
    var s = this.getSize();
    return {
      x: s.x - parseInt(this.getStyle('padding-left')) - parseInt(this.getStyle('padding-right')),
      y: s.y - parseInt(this.getStyle('padding-top')) - parseInt(this.getStyle('padding-bottom'))
    };
  },
  setSize: function(s) {
    if (!s.x && !s.y) throw new Error('No sizes defined');
    if (s.x) this.setStyle('width', s.x + 'px');
    if (s.y) this.setStyle('height', s.y + 'px');
    this.fireEvent('resize');
  },
  setValue: function(v) {
    this.set('value', v);
    this.fireEvent('change');
  },
  getPadding: function() {
    return {
      x: parseInt(this.getStyle('padding-left')) + parseInt(this.getStyle('padding-right')),
      y: parseInt(this.getStyle('padding-top')) + parseInt(this.getStyle('padding-bottom'))
    };
  },
  storeAppend: function(k, v) {
    var r = this.retrieve(k);
    this.store(k, r ? r.append(v) : r = [v]);
  },
  setTip: function(title) {
    if (!Ngn.tips) Ngn.initTips(this);
    if (this.retrieve('tip:native')) {
      Ngn.tips.hide(this);
      this.store('tip:title', title);
    } else {
      Ngn.tips.attach(this);
    }
  }
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.js|--*/
Ngn.Frm = {};
Ngn.Frm.init = {}; // объект для хранения динамических функций иниыиализации
Ngn.Frm.html = {};
Ngn.Frm.selector = 'input,select,textarea';
Ngn.Frm.textSelector = 'input[type=text],input[type=password],textarea';

Ngn.Frm.getValueByName = function(name, parent) {
  return Ngn.Frm.getValue(Ngn.Frm.getElements(name, parent));
};

Ngn.Frm.emptify = function(eInput) {
  if (eInput.get('type') == 'checkbox') eInput.set('checked', false); else eInput.get('value', '');
};

/**
 * @param Element|array of Element
 * @returns {*}
 */
Ngn.Frm.getValue = function(el) {
  if (el.length === undefined) {
    var elements = el.getElements(Ngn.Frm.selector);
  } else {
    var elements = el;
  }
  var r = null;
  var res = [];
  var i = 0;
  elements.each(function(el) {
    var type = el.get('type');
    if (type == 'checkbox') {
      if (el.get('checked')) res[i] = el.get('value');
      i++;
    } else if (type == 'radio') {
      if (el.get('checked'))
        r = el.get('value');
    } else {
      r = el.get('value');
    }
  });
  if (res.length != 0) r = res;
  return r;
};

Ngn.Frm.getValues = function(el) {
  if (el.length === undefined) {
    var elements = el.getElements(Ngn.Frm.selector);
  } else {
    var elements = el;
  }
  var r = [];
  elements.each(function(el) {
    var type = el.get('type');
    if (type == 'radio' || type == 'checkbox') {
      if (el.get('checked'))
        r.push(el.get('value'));
    } else {
      r = [el.get('value')];
    }
  });
  return r;
};

Ngn.Frm.getElements = function(name, parent) {
  var elements = [];
  var n = 0;
  var _name;
  parent = parent || document;
  parent.getElements(Ngn.Frm.selector).each(function(el) {
    _name = el.get('name');
    if (!_name) return;
    if (_name.replace('[]', '') != name) return;
    elements[n] = el;
    n++;
  });
  return elements;
};

Ngn.Frm.virtualElements = [];
Ngn.Frm.disable = function(eForm, flag) {
  eForm.getElements(Ngn.Frm.selector).each(function(el) {
    el.set('disabled', flag);
  });
  // console.debug(Ngn.Frm.virtualElements);
  for (var i = 0; i < Ngn.Frm.virtualElements.length; i++) {
    // var o = Ngn.Frm.virtualElements[i];
    // console.debug([o, o.getForm()]);
    // if (o.getForm() && o.getForm().get('id') != eForm.get('id')) return;
    // o.toggleDisabled(!flag);
  }
};

// формат callback ф-ии должен быть следующим:
// function (fieldValue, args) {}
Ngn.Frm.addEvent = function(event, name, callback, args) {
  var elements = Ngn.Frm.getElements(name);
  elements.each(function(el) {
    el.addEvent(event, function(e) {
      callback.run([Ngn.Frm.getValue(elements), args], el);
    });
  });
}

Ngn.enumm = function(arr, tpl, glue) {
  if (glue == undefined) glue = '';
  for (var i = 0; i < arr.length; i++)
    arr[i] = tpl.replace('{v}', arr[i]);
  return arr.join(glue);
};

Ngn.Frm.getPureName = function($bracketName) {
  return $bracketName.replace(/(\w)\[.*/, '$1');
};

Ngn.Frm.getBracketNameKeys = function(name) {
  var m;
  m = name.match(/([^[]*)\[/);
  if (!m) return [name];
  var keys = [];
  keys.append([m[1]]);
  var re = /\[([^\]]*)\]/g;
  while (m = re.exec(name)) {
    keys.append([m[1]]);
  }
  return keys;
};

Ngn.Frm.fillEmptyObject = function(object, keys) {
  for (var i = 0; i < keys.length - 1; i++) {
    var p = 'object' + (Ngn.enumm(keys.slice(0, i + 1), "['{v}']"));
    eval('if (' + p + ' == undefined) ' + p + ' = {}');
  }
};

Ngn.Frm.setValueByBracketName = function(o, name, value) {
  var _name = name.replace('[]', '');
  if (!(o instanceof Object)) throw new Error('o is not object');
  var keys = Ngn.Frm.getBracketNameKeys(_name);
  Ngn.Frm.fillEmptyObject(o, keys);
  var p = 'o';
  for (var i = 0; i < keys.length; i++) p += "['" + keys[i] + "']";
  if (name.contains('[]')) {
    eval(p + ' = (' + p + ' != undefined) ? ' + p + '.concat(value) : [value]');
  } else {
    //eval(p+' = $defined('+p+') ? [].concat('+p+', value) : value');
    eval(p + ' = value');
  }
  return o;
};

Ngn.Frm.objTo = function(eContainer, obj) {
  for (var i in obj) {
    eContainer.getElement('input[name=' + i + ']').set('value', obj[i]);
  }
};

Ngn.Frm.toObj = function(eContainer, except) {
  var rv = {};
  except = except || [];
  eContainer = $(eContainer);
  var typeMatch = 'text' + (!except.contains('hidden') ? '|hidden' : '') + (!except.contains('password') ? '|password' : '');
  var elements = eContainer.getElements(Ngn.Frm.selector);
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    if (!el.name) continue;
    var pushValue = undefined;
    if (el.get('tag') == 'textarea' && el.get('aria-hidden')) {
      // Значит из этой texarea был сделан tinyMce
      pushValue = tinyMCE.get(el.get('id')).getContent();
      //} else if ((el.get('tag') == 'input' && el.type.match(new RegExp('^' + typeMatch + '$', 'i'))) || el.get('tag') == 'textarea' || (el.get('type').match(/^checkbox|radio$/i) && el.get('checked'))) {
    } else if ((el.get('tag') == 'input' && el.type.match(new RegExp('^' + typeMatch + '$', 'i'))) || el.get('tag') == 'textarea' || (el.get('type').match(/^radio$/i) && el.get('checked'))) {
      pushValue = el.value;
    } else if ((el.get('type').match(/^checkbox$/i) && el.get('checked'))) {
      var pushValue = [];
      eContainer.getElement('.name_'+el.name).getElements('input').each(function(checkbox){
        if(checkbox.get('checked'))  pushValue.push(checkbox.value);
      });
    } else if (el.get('tag') == 'select') {
      if (el.multiple) {
        var pushValue = [];
        for (var j = 0; j < el.options.length; j++)
          if (el.options[j].selected)
            pushValue.push(el.options[j].value);
        if (pushValue.length == 0) pushValue = undefined;
      } else {
        pushValue = el.options[el.selectedIndex].value;
      }
    }
    if (pushValue != undefined) {
      Ngn.Frm.setValueByBracketName(rv, el.name, pushValue);
    }
  }
  return rv;
};

Ngn.Frm.initTranslateField = function(eMasterField, eTranslatedField) {
  var eMasterField = $(eMasterField);
  var eTranslatedField = $(eTranslatedField);
  //if (!eMasterField || !eTranslatedField) return;
  var translatedValueExists = eTranslatedField.get('value') ? true : false;
  var translatedFieldEdited = false;
  var translateField = function() {
    if (translatedValueExists || translatedFieldEdited) return;
    eTranslatedField.set('value', translate(trim(eMasterField.get('value'))));
  };
  eMasterField.addEvent('keyup', translateField);
  eMasterField.addEvent('blur', translateField);
  eMasterField.addEvent('click', translateField);
  eTranslatedField.addEvent('keyup', function(e) {
    translatedFieldEdited = true;
  });
};

Ngn.Frm.initCopySelectValue = function(eSelectField, eSlaveField, param) {
  if (param == undefined) param = 'value';
  var eSelectField = $(eSelectField);
  var eSlaveField = $(eSlaveField);
  eSlaveField.addEvent('keyup', function() {
    eSlaveField.store('edited', true);
  });
  eSelectField.addEvent('change', function() {
    if (eSlaveField.retrieve('edited')) return;
    eSlaveField.set('value', eSelectField.options[eSelectField.selectedIndex].get(param));
    eSlaveField.fireEvent('blur');
  });
};

Ngn.Frm.initCopySelectTitle = function(eSelectField, eSlaveField) {
  Ngn.Frm.initCopySelectValue(eSelectField, eSlaveField, 'text');
};

Ngn.Frm.storable = function(eInput) {
  if (!eInput.get('id')) throw new Error('ID param mast be defined');
  var store = function() {
    Ngn.Storage.set(eInput.get('id'), eInput.get('value'));
  };
  var restore = function() {
    eInput.set('value', Ngn.Storage.get(eInput.get('id')));
  };
  restore();
  eInput.addEvent('keypress', function() {
    (function() {
      store();
    }).delay(100);
  });
  eInput.addEvent('blur', function() {
    store();
  });
}

// @requiresBefore i/js/ngn/core/Ngn.elementExtras.js
Ngn.Frm.virtualElement = {
  // abstract toggleDisabled: function(flag) {},
  parentForm: null,
  initVirtualElement: function(el) {
    var eForm = el.getParent('form');
    if (!eForm) return;
    eForm.storeAppend('virtualElements', this);
  },
  getForm: function() {
  }
};

Ngn.Frm.maxLength = function(eForm, defaultMaxLength) {
  eForm.getElements('textarea').each(function(eInput){
    var eLabel = eInput.getParent('.element').getElement('.label');
    var maxlength = eInput.get('maxlength');
    if (!eLabel || !maxlength) return;
    var init = function() {
      eRemained.set('html',
        ' (осталось ' + (maxlength-eInput.get('value').length) + ' знаков из ' + maxlength + ')'
      );
    };
    if (maxlength >= defaultMaxLength) return;
    var eRemained = new Element('small', {
      'class': 'remained gray'
    }).inject(eLabel, 'bottom');
    eInput.addEvent('keyup', init);
    init();
  });
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.Dotter.js|--*/
Ngn.Dotter = new Class({
  Implements: [Options,Events],

  options: {
    delay: 500,
    dot: '.',
    message: 'Loading',
    numDots: 10,
    property: 'text',
    reset: false/*,
    onDot: Function.from(),
    onStart: Function.from(),
    onStop: Function.from()
    */
  },

  initialize: function(container, options) {
    this.setOptions(options);
    this.container = document.id(container);
    this.dots = 0;
    this.running = false;
  },

  dot: function() {
    if(this.running) {
      var text = this.container.get(this.options.property);
      this.dots++;
      this.container.set(this.options.property,(this.dots % this.options.numDots != 0 ? text : this.options.message) + '' + this.options.dot);
    }
    return this;
  },

  load: function() {
    this.loaded = true;
    this.dots = 0;
    this.dotter = function(){ this.dot(); this.fireEvent('dot'); }.bind(this);
    this.periodical = this.dotter.periodical(this.options.delay);
    this.container.set(this.options.property,this.options.message + '' + this.options.dot);
    return this;
  },

  start: function() {
    if(!this.loaded || this.options.reset) this.load();
    this.running = true;
    this.fireEvent('start');
    return this;
  },

  stop: function() {
    this.running = this.loaded = false;
    clearTimeout(this.periodical);
    this.fireEvent('stop');
    return this;
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.RequestForm.js|--*/
Ngn.Dialog.RequestFormBase = new Class({
  Extends: Ngn.Dialog,

  options: {
    okDestroy: false,
    jsonRequest: true,
    autoSave: false,
    getFormData: function() {
      return Ngn.Frm.toObj(this.form.eForm);
    },
    onFormResponse: Function.from(),
    onFormRequest: Function.from(),
    onSubmitSuccess: Function.from()
  },

  initialize: function(options) {
    options = options || {};
    options.ok = this.submit.bind(this);
    if (options.submitUrl == undefined) {
      if (options.jsonSubmit == undefined) options.jsonSubmit = false;
      options.submitUrl = options.url;
    }
    this.parent(options);
    this.toggle('ok', false);
    this.iframeUpload = true;
    window.addEvent('keypress', function(e) {
      if (e.key != 'enter' || e.target.get('tag') == 'textarea') return;
      e.preventDefault();
      this.submit();
    }.bind(this));
  },

  form: null,
  response: null,

  urlResponse: function(r) {
    this.parent(r);
    this.response = r;
    if (r.submitTitle) this.setOkText(r.submitTitle);
    if (r.jsOptions) {
      if (r.jsOptions.onOkClose)
        this.addEvent('okClose', r.jsOptions.onOkClose);
    }
    this.setMessage(r.form, false);
    this.form = Ngn.Form.factory(this.message.getElement('form'), {
      ajaxSubmit: true,
      ajaxSubmitUrl: this.options.submitUrl,
      disableInit: true
    });
    this.form.options.dialog = this; // Важно передавать объект Диалога в объект
    // Формы после выполнения конструктура, иначе объект
    // Даилога не будет содержать созданого объекта Формы
    this.form.init();
    this.fireEvent('formResponse');
    this.form.addEvent('submit', function(r) {
      this.fireEvent('formRequest');
      this.loading(true);
    }.bind(this));
    this.form.addEvent('failed', function(r) {
      this.urlResponse(r);
      this.loading(false);
    }.bind(this));
    this.form.addEvent('complete', function(r) {
      this.response = r;
      this.okClose();
      this.fireEvent('submitSuccess', r);
    }.bind(this));
    this.resizeByCols();
    if (this.options.autoSave) {
      new Ngn.Frm.Saver(this.form.eForm, {
        url: this.options.submitUrl,
        jsonRequest: true
      });
    }
    this.initEvents();
    this.formInit();
    this.initPosition();
  },

  // abstract
  initEvents: function() {
  },

  resizeByCols: function() {
    var cols = this.form.eForm.getElements('.type_col');
    if (!cols.length) return;
    //var maxY = 0;
    var ys = [];
    var x = 0;
    for (var i = 0; i < cols.length; i++) {
      ys[i] = cols[i].getSize().y;
      x += cols[i].getSize().x;
    }
    //for (var i=0; i<cols.length; i++) cols[i].setStyle('height', ys.max() + 'px');
    this.dialog.setStyle('width', (x + 12) + 'px');
  },

  formInit: function() {
  },

  submit: function() {
    this._submit();
  },

  finishClose: function() {
    this.parent();
    // если в последнем респонзе есть ссылка не следующую форму
    if (this.isOkClose && this.response.nextFormUrl) {
      var opt = {};
      if (this.response.nextFormOptions) opt = Object.merge(opt, this.response.nextFormOptions);
      opt.url = this.response.nextFormUrl;
      new Ngn.Dialog.RequestForm(opt);
    }
  }

  // abstract
  //_submit: {}

});

Ngn.Dialog.Form = new Class({
  Extends: Ngn.Dialog.RequestFormBase,

  options: {
    onSubmit: Function.from()
  },

  _submit: function() {
    this.fireEvent('submit', this.options.getFormData.bind(this)());
    this.okClose();
  }

});

Ngn.Dialog.RequestForm = new Class({
  Extends: Ngn.Dialog.RequestFormBase,

  options: {
    autoSave: false,
    formEvents: false
    //cacheRequest: false
  },

  _submit: function() {
    this.form.submit();
  },

  initEvents: function() {
    if (!this.options.formEvents) return;
    var obj = this;
    for (var i = 0; i < this.options.formEvents.length; i++) {
      var evnt = this.options.formEvents[i];
      this.message.getElement('[name=' + evnt.fieldName + ']').addEvent(evnt.fieldEvent, function() {
        obj.fireEvent(evnt.formEvent, this.get('value'));
      });
    }
  }

});

Ngn.Dialog.RequestForm.Static = new Class({
  Extends: Ngn.Dialog.RequestForm,

  // options: {
  //   staticResponse: {
  //     title: text
  //     submitTitle: text
  //     form: html
  //   }
  // }

  initFormResponse: function() {
    this.urlResponse(Ngn.json.process(this.options.staticResponse));
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.js|--*/
/**
 * Класс `Ngn.Form` в паре с серверным PHP классом `Form` образует свзяку для работы с HTML-формами
 *
 * ###Основные задачи###
 *
 *  - Инициализацию динамически сгенерированого на сервере JavaScript'а
 *  - Валидацию полей
 *  - Сабмит
 *  - Интерфейс колонок, свёртываемых блоков, прикрепленных файлов
 *  - Активацию/дезактивацию полей
 *  - Инициализацию загрузчика файлов
 */
Ngn.Form = new Class({
  Implements: [Options, Events, Class.Occlude],

  options: {
    equalElementHeights: false, // [boolean] Уравнивать высоты элементов формы
    dialog: null, // [null|Ngn.Dialog] Диалог, из которого была создана форма
    focusFirst: false, // [boolean] Делать фокус на первом элементе
    ajaxSubmit: false, // [boolean] Сабмитить форму ajax-ом
    disableInit: false // [boolean] Не производить инициализацию в формы в конструкторе
  },

  els: {},

  initialize: function(eForm, options) {
    this.eForm = eForm;
    this.eOutsideContainer = new Element('div', {styles: {'display': 'none'}}).inject(this.eForm, 'after');
    if (this.eForm.get('data-init')) throw new Error('This form already initialized');
    this.eForm.set('data-init', true);
    if ((options && !options.forceOcclude) && this.occlude(this.eForm.get('id'), this.eForm)) return this.occluded;
    Ngn.Form.forms[this.eForm.get('id')] = this;
    this.id = this.eForm.get('id');
    this.setOptions(options);
    if (!this.options.disableInit) this.init();
  },

  init: function() {
    // core
    this.initDynamicJs();
    this.initInlineJs();
    this.initValidation();
    this.initSubmit();
    // more
    this.initVisibilityConditions();
    this.initHeaderToggle();
    this.initFileNav();
    this.initActive();
    this.initCols();
    this.initImagePreview();
    if (this.options.focusFirst) {
      var focused = false;
      var eFirstAdvice = this.eForm.getElement('.static-advice');
      if (eFirstAdvice) {
        var eInput = eFirstAdvice.getParent('.element').getElement('input');
        if (eInput) {
          focused = true;
          eInput.focus();
        }
      }
      if (!focused) {
        var f = this.eForm.getElement(Ngn.Frm.textSelector);
        if (f) f.focus();
      }
    }
    // Если у первого элемента есть плейсхолдер, значит и у всех остальных. Инициализируем кроссбрауузерные плейсхолдеры (для IE9)
    var eFirstTextInput = this.eForm.getElement(Ngn.Frm.textSelector);
    if (eFirstTextInput && eFirstTextInput.get('placeholder')) new Ngn.PlaceholderSupport();
    this.eForm.getElements('input[type=text],input[type=password]').each(function(el) {
      el.addEvent('keypress', function(e) {
        if (e.key == 'enter') this.submit();
      }.bind(this));
    }.bind(this));
  },

  initValidation: function() {
    var opts = {};
    opts.evaluateOnSubmit = false;
    if (this.options.dialog) {
      opts.scrollToErrorsOnSubmit = false;
      // opts.scrollElement = this.options.dialog.message;
    }
    this.validator = new Ngn.Form.Validator(this, opts);
  },

  initDynamicJs: function() {
    var js = $(this.eForm.get('id') + 'js');
    if (js) {
      Asset.javascript(js.get('html'), {
        onLoad: function() {
          var func = eval('Ngn.Frm.init.' + this.eForm.get('id'));
          if (func) func();
          this.fireEvent('jsComplete');
        }.bind(this)
      });
    }
  },

  initInlineJs: function() {
    var js = $(this.eForm.get('id') + 'jsInline');
    if (js) {
      try {
        eval(js.get('html'));
      } catch (e) {
        throw new Error('Error in code: ' + js.get('html') + "\nerror:" + e.toString());
      }
    }
  },

  initImagePreview: function() {
    this.eForm.getElements('.elImagePreview').each(function(el) {
      var eFileNav = el.getElement('.fileNav');
      if (!eFileNav) return;
      eFileNav.inject(el.getElement('.label'), 'top');
    });
    Ngn.Milkbox.add(this.eForm.getElements('a.lightbox'));
  },

  initActive: function() {
    this.eForm.getElements(Ngn.Frm.textSelector).each(function(el) {
      this.initActiveEl(el);
    }.bind(this));
  },

  initActiveEl: function(el) {
    el.addEvent('focus', function() {
      this.addClass('active');
    });
    el.addEvent('blur', function() {
      this.removeClass('active');
    });
  },

  initCols: function() {
    var cols = this.eForm.getElements('.type_col');
    for (var i = 0; i < cols.length; i++) {
      var children = cols[i].getChildren();
      var eColBody = new Element('div', {'class': 'colBody'}).inject(cols[i]);
      for (var j = 0; j < children.length; j++)
        children[j].inject(eColBody);
    }
  },

  disable: function(flag) {
    if (this.options.ajaxSubmit) {
      Ngn.Frm.disable(this.eForm, flag);
    } else {
      var eSubmit = this.eForm.getElement('input[type=submit]');
      if (eSubmit) {
        eSubmit.addClass('disabled');
        eSubmit.set('disabled', flag);
      }
    }
  },

  submit: function() {
    if (this.submiting) return false;
    if (!this.validator.validate()) return false;
    this.fireEvent('submit');
    this.disable(true);
    this.submiting = true;
    if (this.uploadType == 'html5') {
      this.submitHtml5();
    } else if (this.uploadType == 'default' && !this.options.ajaxSubmit) {
      this.eForm.submit();
    } else {
      this.submitAjax();
    }
    return true;
  },

  initSubmit: function() {
    this.eForm.addEvent('submit', function(e) {
      e.preventDefault();
      this.submit();
    }.bind(this));
  },

  uploadType: 'default',
  uploadOptions: null,

  initUpload: function(opt) {
    if (!this.hasFilesFields()) return;
    if (!opt || !opt.url) throw Error("$options['uploadOptions']['url'] of php Form object must be defined. Use UploadTemp::extendFormOptions to add this option to Form object");
    this.uploadOptions = opt;
    if ('FormData' in window) this.initHtml5Upload();
    if (this.uploadType == 'default') {
      this.uploadType = 'iframe';
      this.initIframeRequest();
    }
  },

  uploads: [],

  submitHtml5: function() {
    this.uploads.each(function(upload) {
      upload.send(false);
    }.bind(this));
  },

  initHtml5Upload: function() {
    if (!this.hasFilesFields()) return;
    this.uploadType = 'html5';
    this.eForm.getElements('input[type=file]').each(function(eInput) {
      if (eInput.retrieve('uploadInitialized')) return;
      eInput.store('uploadInitialized', true);
      var cls = eInput.get('multiple') ? 'multiUpload' : 'upload';
      var eInputValidator = new Element('input', {
        type: 'hidden'
        //name: eInput.get('name') + '_helper'
      }).inject(eInput, 'after');
      var fileSaved = eInput.getParent('.element').getElement('.fileSaved');
      if (!fileSaved) eInputValidator.addClass(eInput.hasClass('required') ? 'validate-' + cls + '-required' : 'validate-' + cls);
      if (eInput.get('data-file')) eInputValidator.set('value', 1);
      var name = eInput.get('name');
      this.oneFileCompleteEventFired = false;
      var uploadOptions = {
        url: this.uploadOptions.url.replace('{fn}', name),
        loadedFiles: this.uploadOptions.loadedFiles,
        fileEvents: {
          change: function() {
            eInputValidator.set('value', 1);
          },
          empty: function() {
            eInputValidator.set('value', '');
          }
        },
        onComplete: function(r) {
          if (this.allUploadsIsEmpty() && this.oneFileCompleteEventFired) {
            return;
          }
          this.oneFileCompleteEventFired = true;
          if (this.hasUploadsInProgress()) return;
          this.submitedAndUploaded(r);
        }.bind(this)
      };
      if (!eInput.get('multiple')) {
        this.addUpload(new Ngn.Form.Upload.Single(this, eInput, uploadOptions));
      } else {
        uploadOptions.url += '&multiple=1';
        this.addUpload(new Ngn.Form.Upload.Multi(this, eInput, uploadOptions));
      }
    }.bind(this));
  },

  submitedAndUploaded: function() {
    this.submitAjax();
  },


  /**
   * @property upload Ngn.Form.Upload
   */
  addUpload: function(upload) {
    this.uploads.push(upload);
  },

  allUploadsIsEmpty: function() {
    for (var i = 0; i < this.uploads.length; i++) {
      if (this.uploads[i].file) return false;
    }
    return true;
  },

  hasUploadsInProgress: function() {
    for (var i = 0; i < this.uploads.length; i++) {
      if (this.uploads[i].inProgress) return true;
    }
    return false;
  },

  hasFilesFields: function() {
    return this.eForm.getElements('input[type=file]').length != 0;
  },

  initHeaderToggle: function() {
    var htBtns = this.eForm.getElements('.type_headerToggle .toggleBtn');
    var ht = [];
    if (htBtns) {
      for (var i = 0; i < htBtns.length; i++)
        ht.push(new Ngn.Frm.HeaderToggle(htBtns[i]));
    }
    if (this.options.equalElementHeights) {
      this.setEqualHeights();
      for (i = 0; i < ht.length; i++)
        ht[i].addEvent('toggle', function(open) {
          if (open) this.setEqualHeights();
        }.bind(this));
    }
  },

  visibilityConditions: [],

  setEqualHeights: function() {
    this.eForm.getElements('.hgrp').each(function(eHgrp) {
      Ngn.equalItemHeights(eHgrp.getElements('.element').filter(function(el) {
        return !el.hasClass('subElement');
      }));
    });
  },

  initVisibilityConditions: function() {
    var vc = this.eForm.getElement('.visibilityConditions');
    if (!vc) return;
    vc = JSON.decode(vc.get('html'));
    for (var i = 0; i < vc.length; i++) {
      var cls = eval('Ngn.Frm.VisibilityCondition.' + Ngn.String.ucfirst(vc[i][3]));
      this.visibilityConditions[vc[i][0]] = new cls(this.eForm, vc[i][0], vc[i][1], vc[i][2]);
    }
  },

  resetVisibilityConditionOfFieldSection: function(eInput) {
    var eHgrp = eInput.getParent().getParent('.hgrp');
    if (!eHgrp) return;
    var headerName = eHgrp.get('class').replace(/.* hgrp_(\w+) .*/, '$1');
    if (headerName && this.visibilityConditions[headerName])
      (function() {
        this.visibilityConditions[headerName].fx.show();
      }).delay(500, this);
  },

  initValues: {},

  initAutoGrow: function() {
    this.eForm.getElements('textarea').each(function(el) {
      new AutoGrow(el);
    });
  },

  initIframeRequest: function() {
    this.iframeRequest = new Ngn.IframeFormRequest.JSON(this.eForm);
    return this.iframeRequest;
  },

  addElements: function(eRow) {
    eRow.getElements('.element').each(function(el) {
      Ngn.Form.ElInit.factory(this, Ngn.Form.getElType(el));
    }.bind(this));
    this.initHtml5Upload();
  },

  initFileNav: function() {
    this.eForm.getElements('.fileNav').each(function(eFileNav) {
      Ngn.Btn.addAjaxAction(eFileNav.getElement('.delete'), 'delete', function() {
        eFileNav.dispose();
      });
    });
  },

  submitAjax: function() {
    this.options.ajaxSubmit ? this._submitAjax() : this._submit();
  },

  _submitAjax: function() {
    new Ngn.Request.JSON({
      url: this.options.ajaxSubmitUrl || this.eForm.get('action'),
      onComplete: function(r) {
        this.disable(false);
        this.submiting = false;
        if (r && r.form) {
          this.fireEvent('failed', r);
          return;
        }
        this.fireEvent('complete', r);
      }.bind(this)
    }).post(Ngn.Frm.toObj(this.eForm));
  },

  _submit: function() {
    this.eForm.submit();
  }

});


Ngn.Form.factories = {};
Ngn.Form.registerFactory = function(id, func) {
  Ngn.Form.factories[id] = func;
};

Ngn.Form.factory = function(eForm, opts) {
  eForm = document.id(eForm, true);
  if (Ngn.Form.factories[eForm.get('id')]) {
    return Ngn.Form.factories[eForm.get('id')](eForm, opts);
  }
  var name = 'Ngn.' + (eForm.get('data-class') || 'Form');
  var cls = eval(name);
  if (!cls) throw new Error('class ' + name + ' not found');
  return new cls(eForm, opts);
};

Ngn.Form.forms = {};
Ngn.Form.elOptions = {};

Ngn.Form.ElInit = new Class({

  initialize: function(form, type) {
    this.form = form;
    this.type = type;
    this.init();
  },

  init: function() {
    var els = this.form.eForm.getElements('.type_' + this.type);
    if (!els.length) throw new Error('No ".type_' + this.type + '" elements was found. Maybe use FieldEAbstract::_html() instead of html()');
    els.each(function(eRow) {
      if (!eRow.get('data-typejs')) return;
      var clsName = 'Ngn.Form.El.' + Ngn.String.ucfirst(this.type)
      var cls = eval(clsName);
      if (cls === undefined) throw new Error('Class "' + clsName + '" is not defined');
      if (eRow.retrieve('initialized')) return;
      new cls(this.type, this.form, eRow);
      eRow.store('initialized', true);
    }.bind(this));
  }

});

// ------------------- Form Elements Framework ----------------------

Ngn.Form.ElInit.factory = function(form, type) {
  var cls = eval('Ngn.Form.ElInit.' + Ngn.String.ucfirst(type));
  if (cls) return new cls(form, type);
  return new Ngn.Form.ElInit(form, type);
};

Ngn.Form.getElType = function(el) {
  return el.get('class').replace(/.*type_(\w+).*/, '$1');
};

Ngn.Form.elN = 0;
Ngn.Form.El = new Class({
  options: {},
  initialize: function(type, form, eRow) {
    this.type = type;
    this.form = form;
    Ngn.Form.elN++;
    this.eRow = eRow;
    this.eRow.n = Ngn.Form.elN;
    this.name = eRow.get('data-name');
    this.form.els[this.name] = this;
    if (Ngn.Form.elOptions[this.name]) this.options = Ngn.Form.elOptions[this.name];
    this.init();
  },
  fireFormElEvent: function(event, value) {
    this.form.fireEvent('el' + Ngn.String.ucfirst(this.name) + Ngn.String.ucfirst(event), value);
  },
  init: function() {
  }
});

// ------------------- Form Elements Framework End -------------------

Ngn.Form.Validator = new Class({
  Extends: Form.Validator.Inline,

  options: {
    showError: function(errorElement) {
      errorElement.setStyle('display', 'block');
    },
    hideError: function(errorElement) {
      errorElement.setStyle('display', 'none');
    },
    ignoreHidden: false,
    evaluateFieldsOnBlur: false
  },

  initialize: function(form, options) {
    if (!options) options = {};
    options.scrollElement = document.body;
    this.parent(form.eForm, options);
    this.addEvents({
      elementFail: function(eInput, name) {
        this.resetVisibilityConditionOfFieldSection(eInput);
      }.bind(form),
      elementPass: function(eInput, name) {
        this.resetVisibilityConditionOfFieldSection(eInput);
      }.bind(form)
    });
    // при инициализации формы происходит фокус на первое поле. так что сообщение об ошибке пропадает
    // так что добавляем задержку для инициализации этой фичи
    (function() {
      // Добавляем событие для элементов, имеющих статические ошибки (созданные жестко в html)
      this.element.getElements('.static-advice').each(function(eAdvice) {
        eAdvice.getParent('.element').getElement('input').addEvent('focus', function() {
          eAdvice.dispose();
        });
      });
    }).delay(2000, this);
    // убираем все эдвайсы при фокусе на поле
    this.getFields().each(function(field) {
      field.addEvent('focus', this.reset.bind(this));
    }.bind(this));
  },

  lastAdvices: {},

  makeAdvice: function(className, field, error, warn) {
    var advice;
    var errorMsg = (warn) ? this.warningPrefix : this.errorPrefix;
    errorMsg += (this.options.useTitles) ? field.title || error : error;
    var cssClass = (warn) ? 'warning-advice' : 'validation-advice';
    var adviceWrapper = this.getAdvice(className, field);
    if (!adviceWrapper) {
      advice = new Element('div', {
        html: errorMsg
      }).addClass('advice').addClass(cssClass);
      adviceWrapper = new Element('div', {
        styles: {display: 'none'},
        id: 'advice-' + className.split(':')[0] + '-' + this.getFieldId(field)
      }).addClass('advice-wrapper').grab(advice);
      adviceWrapper.grab(new Element('div', {'class': 'corner'}), 'top').setStyle('z-index', 300);
      field.store('$moo:advice-' + className, adviceWrapper);
    } else {
      advice = adviceWrapper.getElement('.advice');
      advice.set('html', errorMsg);
    }
    this.lastAdvices[field.get('name')] = className;
    return adviceWrapper;
  },

  showNewAdvice: function(className, field, error) {
    var advice = this.getAdvice(className, field);
    if (!advice) {
      advice = this.makeAdvice(className, field, error);
      this.insertAdvice(advice, field);
    }
    this.showAdvice(className, field);
    field.addEvent('keypress', function() {
      this.hideAdvice(className, field);
    }.bind(this));
    field.addEvent('change', function() {
      this.hideAdvice(className, field);
    }.bind(this));
    field.focus();
  },

  hideLastAdvice: function(field) {
    if (!this.lastAdvices[field.get('name')]) return;
    this.hideAdvice(this.lastAdvices[field.get('name')], field);
  },

  insertAdvice: function(advice, field) {
    advice.inject(field.getParent('.field-wrapper'), 'after');
  },

  rewatchFields: function() {
    this.watchFields(this.getFields());
  },

  getScrollFx: function() {
    var par = this.options.scrollElement || document.id(this).getParent();
    return new Fx.Scroll(par, this.options.scrollFxOptions);
  }

});

Form.Validator.add('IsEmpty', {
  errorMsg: false,
  test: function(element) {
    if (element.type == 'select-one' || element.type == 'select') {
      return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
    } else if (element.type == 'file') {
      return element.get('data-file') == null;
    } else {
      return ((element.get('value') == null) || (element.get('value').length == 0));
    }
  }
});

Ngn.getReadableFileSizeString = function(fileSizeInBytes) {
  var i = -1;
  var byteUnits = [' Кб', ' Мб', ' Гб'];
  do {
    fileSizeInBytes = fileSizeInBytes / 1024;
    i++;
  } while (fileSizeInBytes > 1024);
  return Math.max(fileSizeInBytes, 0.1).toFixed(0) + byteUnits[i];
};

Form.Validator.addAllThese([['should-be-changed', {
  errorMsg: 'значение этого поля должно быть изменено',
  test: function(element) {
    if (Ngn.Form.forms[element.getParent('form').get('id')].initValues[element.get('name')] == element.get('value'))
      return false; else
      return true;
  }
}], ['validate-num-min', {
  errorMsg: 'слишком маленькое число',
  test: function(element, props) {
    if (!element.get('value')) return true;
    var strict = typeOf(element.get('data-strict')) != 'null';
    if (typeOf(element.get('data-min')) != 'null') {
      var value = parseFloat(element.get('value').replace(/\s/g, ''));
      element.set('value', value);
      var min = parseFloat(element.get('data-min'));
      return strict ? value > min : value >= min;
    }
  }
}], ['validate-num-max', {
  errorMsg: 'слишком большое число',
  test: function(element, props) {
    if (!element.get('value')) return true;
    var strict = typeOf(element.get('data-strict')) != 'null';
    if (typeOf(element.get('data-max')) != 'null') {
      var value = parseFloat(element.get('value').replace(/\s/g, ''));
      element.set('value', value);
      var max = parseFloat(element.get('data-max'));
      return strict ? value < max : value <= max;
    }
  }
}], ['validate-name', {
  errorMsg: 'должно содержать только латинские символы, тире, подчеркивание и не начинаться с цифры',
  test: function(element) {
    if (!element.value) return true;
    if (element.value.match(/^[a-z][a-z0-9-_]*$/i)) return true; else return false;
  }
}], ['validate-fullName', {
  errorMsg: 'неправильный формат имени',
  test: function(element) {
    //return true;
    if (!element.value) return true;
    if (element.value.match(/^\S+\s+\S+\s+\S+.*$/i)) return true; else return false;
  }
}], ['validate-domain', {
  errorMsg: 'неправильный формат',
  test: function(element) {
    if (!element.value) return true;
    if (element.value.match(/^[a-z][a-z0-9-.]*[a-z]$/i)) return true; else return false;
  }
}], ['validate-phone', {
  errorMsg: 'неправильный формат',
  test: function(element) {
    if (!element.value) return true;
    element.value = element.value.trim();
    element.value = element.value.replace(/[\s\-\(\)]/g, '');
    element.value = element.value.replace(/^8(.*)/g, '+7$1');
    return /^\+\d{11}$/g.test(element.value);
  }
}], ['validate-procent', {
  errorMsg: 'введите число от 0 до 100',
  test: function(element) {
    if (!element.value) return true;
    element.value = parseInt(element.value);
    return (element.value >= 0 && element.value <= 100);
  }
}], ['validate-skype', {
  errorMsg: 'неправильный формат',
  test: function(element) {
    if (!element.value) return true;
    if (element.value.length > 32 || element.value.length < 6) return false;
    if (element.value.match(/^[a-z][a-z0-9._]*$/i)) return true; else return false;
  }
}], ['required-wisiwig', {
  errorMsg: 'поле обязательно для заполнения',
  test: function(element) {
    return !!Ngn.clearParagraphs(tinyMCE.get(element.get('id')).getContent());
  }
}], ['validate-request', {
  errorMsg: 'Дождитесь загрузки',
  test: function(element) {
    return element.get('value') == 'complete' ? true : false;
  }
}], ['validate-upload-required', {
  errorMsg: 'Файл не выбран',
  test: function(element) {
    return element.get('value') ? true : false;
  }
}], ['validate-multiUpload-required', {
  errorMsg: 'Файлы не выбраны',
  test: function(element) {
    return element.get('value') ? true : false;
  }
}], ['maxFileSizeExceeded', {
  errorMsg: 'Превышен максимальный размер файла ' + Ngn.getReadableFileSizeString(Ngn.fileSizeMax),
  test: function() {
    return false;
  }
}]]);

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.PlaceholderSupport.js|--*/
Ngn.PlaceholderSupport = new Class({

  initialize : function(els){
    if(('placeholder' in document.createElement('input'))) return;
    var self = this;
    this.elements = (typeOf(els) === 'string') ? $$(els) : els;
    if(typeOf(this.elements) === 'null' || typeOf(this.elements[0]) === 'null') {
      this.elements = $$('input[placeholder],textarea[placeholder]');
    }
    this.elements.each(function(input){
      var textColor = input.getStyle('color');
      var lighterTextColor = self.lightenDarkenColor(textColor,80);
      if(input.getProperty('value') === '') {
        input.setProperty('value',input.getProperty('placeholder'));
        input.setStyle('color',lighterTextColor);
      }
      input.addEvents({
        focus: function(){
          if(input.getProperty('value') === input.getProperty('placeholder')) {
            input.setProperty('value','');
            input.setStyle('color',textColor);
          }
        },
        blur: function(){
          if(input.getProperty('value') === '') {
            input.setProperty('value',input.getProperty('placeholder'));
            input.setStyle('color',lighterTextColor);
          }
        }
      });
    });
  },

  lightenDarkenColor: function(col,amt) {
     var usePound = false;
    if ( col[0] == "#" ) {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col,16);
    var r = (num >> 16) + amt;
    if ( r > 255 ) r = 255;
    else if  (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if ( b > 255 ) b = 255;
    else if  (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if ( g > 255 ) g = 255;
    else if  ( g < 0 ) g = 0;
    var rStr = (r.toString(16).length < 2)?'0'+r.toString(16):r.toString(16);
    var gStr = (g.toString(16).length < 2)?'0'+g.toString(16):g.toString(16);
    var bStr = (b.toString(16).length < 2)?'0'+b.toString(16):b.toString(16);
    return (usePound?"#":"") + rStr + gStr + bStr;
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/Ngn.Milkbox.js|--*/
(function() {

  var milkbox_singleton = null;

  Ngn.Milkbox = new Class({
    Implements: [Options, Events],

    options: { //set all the options here
      overlayOpacity: 0.7,
      marginTop: 10,
      initialWidth: 250,
      initialHeight: 250,
      fileboxBorderWidth: '0px',
      fileboxBorderColor: '#000000',
      fileboxPadding: '0px',
      resizeDuration: .5,
      resizeTransition: 'sine:in:out', /*function (ex. Transitions.Sine.easeIn) or string (ex. 'bounce:out')*/
      autoPlay: false,
      autoPlayDelay: 7,
      removeTitle: true,
      autoSize: true,
      autoSizeMaxHeight: 0,//only if autoSize==true
      centered: false,
      imageOfText: 'из',
      onXmlGalleries: function() {
      },
      onClosed: function() {
      },
      onFileReady: function() {
      }
    },

    initialize: function(options) {
      if (milkbox_singleton) return milkbox_singleton;
      milkbox_singleton = this;

      this.setOptions(options);
      this.autoPlayBkup = { autoPlayDelay: this.options.autoPlayDelay, autoPlay: this.options.autoPlay };
      this.fullOptionsBkup = {};
      this.galleries = [];
      this.formElements = [];
      this.activated;
      this.busy = false;
      this.paused = false;
      this.closed = true;
      this.intId;
      this.loadCheckerId;
      this.externalGalleries = [];
      this.singlePageLinkId = 0;

      this.currentIndex;
      this.currentGallery;
      this.fileReady;
      this.loadedImages = [];
      this.currentFile;
      this.options_bkup;

      this.display;

      this.getPageGalleries();
      if (this.galleries.length != 0) {
        this.prepare(true);
      }
    },

    prepare: function(checkForm) {
      // if(checkForm){ this.checkFormElements(); }
      this.prepareHTML();
      this.prepareEventListeners();
      this.activated = true;
    },

    //utility
    open: function(gallery, index) {
      var i;

      if (!this.activated) {
        this.prepare(true);
      }

      var g = (instanceOf(gallery, Ngn.MilkboxGallery)) ? gallery : this.getGallery(gallery);
      if (!g) return false;

      // [i_a] when 'index' is not an number, it may be a element reference or string: resolve such indexes too
      if (typeOf(index) !== 'number') {
        i = g.get_index_of(index);
        if (i !== -1) {
          index = i;
        }
      }

      i = parseInt(index, 10);
      if (isNaN(i)) {
        i = 0;
      }

      this.closed = false;
      var item = g.get_item(i);
      if (!item) return false;

      this.currentGallery = g;
      this.currentIndex = i;

      this.hideFormElements();

      this.display.set_mode(this.currentGallery.type);
      this.display.appear();


      if (this.options.autoPlay || g.options.autoplay) {
        this.startAutoPlay(true);
      }

      this.loadFile(item, this.getPreloads());
      return true;
    },

    //utility
    close: function(hideDisplay) {
      if (hideDisplay) {
        this.display.disappear();
      }
      this.showFormElements();
      this.pauseAutoPlay();
      this.stopLoadingCheck();
      this.currentGallery = null;
      this.currentIndex = null;
      this.currentFile = null;
      this.busy = false;
      this.paused = false;
      this.fileReady = false;
      this.closed = true;

      this.fireEvent('close');
    },

    startAutoPlay: function(opening) {
      var d = this.currentGallery.options.autoplay_delay || this.options.autoPlayDelay;
      if (d < this.options.resizeDuration * 2) {
        d = this.options.resizeDuration * 2
      }
      ;

      var f = function() {
        this.removeEvent('fileReady', f);
        this.intId = this.navAux.periodical(d * 1000, this, [null, 'next']);
      }

      if (opening) {
        this.addEvent('fileReady', f);
      } else {
        this.intId = this.navAux.periodical(d * 1000, this, [null, 'next']);
      }

      this.paused = false;
    },

    pauseAutoPlay: function() {
      if (this.intId) {
        clearInterval(this.intId);
        this.intId = null;
      }

      this.paused = true;
    },

    //utility
    //list:Array of objects or an object > [ { gallery:'gall1', autoplay:true, delay:6 } ]
    //to permanently define autoplay options for any gallery 
    setAutoPlay: function(list) {
      var l = (typeOf(list) == 'object') ? [list] : list;
      l.each(function(item) {
        var g = this.getGallery(item.gallery);
        if (!g) {
          return;
        }
        var a = (item.autoplay == true) ? item.autoplay : false;
        var d = (item.delay && a) ? item.delay : this.options.autoPlayDelay;
        g.setOptions({ autoplay: a, autoplay_delay: d }).refresh();
      }, this);
    },


    //utility  
    //{href:'file1.jpg',size:'width:900,height:100', title:'text'}
    //show a file on the fly without gallery functionalities
    openWithFile: function(file, options) {
      if (!this.activated) {
        this.prepare();
      }

      if (options) {
        this.refreshDisplay(options, true);//set custom options
      }

      var g = new Ngn.MilkboxGallery([file], { remove_title: this.options.removeTitle });
      this.open(g, 0);
    },

    getPreloads: function() {
      var items = this.currentGallery.items;
      var index = this.currentIndex;
      if (items.length == 1) return null;

      var next = (index != items.length - 1) ? items[index + 1] : items[0];
      var prev = (index != 0) ? items[index - 1] : items[items.length - 1];
      var preloads = (prev == next) ? [prev] : [prev, next]; //if gallery.length == 2, then prev == next
      return preloads;
    },

    //LOADING
    loadFile: function(fileObj, preloads) {

      this.fileReady = false;
      this.display.clear_content();
      this.display.hide_bottom();

      if (this.checkFileType(fileObj, 'swf')) {
        this.loadSwf(fileObj);
      } else if (this.checkFileType(fileObj, 'html')) {
        this.loadHtml(fileObj);
      } else {//filetype:image
        this.loadImage(fileObj);
      }

      if (!this.checkFileType(fileObj, 'swf')) this.startLoadingCheck();
      if (preloads) {
        this.preloadFiles(preloads);
      }
    },

    //to prevent the loader to show if the file is cached
    startLoadingCheck: function() {
      var t = 0;
      if (!this.loadCheckerId) {
        this.loadCheckerId = (function() {
          t += 1;
          if (t > 5) {
            if (this.loadCheckerId) {
              // only show the loader when the timer has not been cleared yet!
              this.display.show_loader();
            }
            this.stopLoadingCheck();
          }
        }).periodical(100, this);
      }//end if
    },

    stopLoadingCheck: function() {
      clearInterval(this.loadCheckerId);
    },

    preloadFiles: function(preloads) {
      preloads.each(function(fileObj, index) {
        if (!this.checkFileType(fileObj, "swf") && !this.checkFileType(fileObj, "html")) {
          this.preloadImage(fileObj.href);
        }
      }, this);
    },

    preloadImage: function(file) {
      if (!this.loadedImages.contains(file)) {
        var imageAsset = new Asset.image(file, {
          onLoad: function() {
            this.loadedImages.push(file);
          }.bind(this)
        });
      }
    },

    loadImage: function(fileObj) {
      var file = fileObj.href;
      var imageAsset = new Asset.image(file, {
        onLoad: function(img) {
          if (!this.loadedImages.contains(file)) {
            this.loadedImages.push(file);
          }
          ;//see next/prev events
          this.loadComplete(img, fileObj.caption);
        }.bind(this)
      });
    },

    loadSwf: function(fileObj) {
      var swfObj = new Swiff(fileObj.href, {
        width: fileObj.size.width,
        height: fileObj.size.height,
        vars: fileObj.vars,
        params: { wMode: 'opaque', swLiveConnect: 'false' }
      });

      this.loadComplete($(swfObj), fileObj.caption);
    },

    loadHtml: function(fileObj) {

      var query = (fileObj.vars ? '?' + Object.toQueryString(fileObj.vars) : '');

      var iFrame = new Element('iframe', {
        'src': fileObj.href + query,
        'frameborder': 0,//for IE...
        styles: {
          'border': 'none'
        }
      });

      if (fileObj.size) {
        iFrame.set({
          'width': fileObj.size.width,
          'height': fileObj.size.height
        });
      }

      this.loadComplete(iFrame, fileObj.caption);
    },//loadHtml


    //LOAD COMPLETE ********//
    loadComplete: function(file, caption) {

      if (this.closed) return;//if an onload event were still running

      this.fileReady = true;//the file is loaded and ready to be showed (see next_prev_aux())
      this.stopLoadingCheck();
      this.currentFile = file;
      var timer;
      timer = (function() {
        if (this.display.ready) {
          if (this.currentGallery.items != null) {
            this.display.show_file(file, caption, this.currentIndex + 1, this.currentGallery.items.length);
          }
          clearInterval(timer);
        }//end if
      }).periodical(100, this);

      this.fireEvent('fileReady');
    },//end loadComplete

    checkFileType: function(file, type) {
      var href = (typeOf(file) != 'string') ? file.href : file;
      var regexp = new RegExp("\.(" + type + ")$", "i");
      return href.split('?')[0].test(regexp);
    },

    //GALLERIES
    getPageGalleries: function() {
      var names = [];
      var links = $$('a[data-milkbox]');

      //check names
      links.each(function(link) {
        var name = link.get('data-milkbox');
        if (name == 'single') {
          this.galleries.push(new Ngn.MilkboxGallery(link, {name: 'single' + this.singlePageLinkId++, remove_title: this.options.removeTitle }));
        } else if (!names.contains(name)) {
          names.push(name);
        }
      }, this);

      names.each(function(name) {
        this.galleries.push(new Ngn.MilkboxGallery($$('a[data-milkbox=' + name + ']'), { name: name, remove_title: this.options.removeTitle }));
      }, this);

      //set default autoplay // override with setAutoPlay
      if (this.options.autoPlay) {
        this.galleries.each(function(g) {
          g.setOptions({autoplay: this.options.autoPlay, autoplay_delay: this.options.autoPlayDelay});
        });
      }

    },//getPageGalleries

    reloadPageGalleries: function() {
      //reload page galleries
      this.removePageGalleryEvents();

      this.galleries = this.galleries.filter(function(gallery) {
        if (!gallery.external) gallery.clear();
        return gallery.external;
      });

      this.getPageGalleries();
      this.addPageGalleriesEvents();

      if (!this.activated) {
        this.prepare(true);
      }
    },//end reloadPageGalleries

    //list: optional. Can be a single string/object or an array of strings/objects
    resetExternalGalleries: function(list) {
      this.galleries = this.galleries.filter(function(gallery) {
        if (gallery.external) gallery.clear();
        return !gallery.external;
      });

      if (!list) return;
      var array = (typeOf(list) == 'array') ? list : [list];
      array.each(function(data) {
        this.addGalleries(data);
      }, this);
    },

    //utility
    addGalleries: function(data) {
      if (!this.activated) {
        this.prepare(true);
      }
      if (typeOf(data) == 'string' && data.split('?')[0].test(/\.(xml)$/i)) {
        this.loadXml(data);
      } else {//array or object
        this.setObjectGalleries(data);
      }
      if (!this.activated) {
        this.prepare(true);
      }
    },

    loadXml: function(xmlfile) {
      var r = new Request({
        method: 'get',
        autoCancel: true,
        url: xmlfile,
        onRequest: function() {
          //placeholder
        }.bind(this),
        onSuccess: function(text, xml) {
          var t = text.replace(/(<a.+)\/>/gi, "$1></a>");
          this.setXmlGalleries(new Element('div', { html: t }));
        }.bind(this),
        onFailure: function(transport) {
          alert('Milkbox :: loadXml: XML file path error or local Ajax test: please test xml galleries on-line');
        }
      }).send();
    },

    setXmlGalleries: function(container) {
      var c = container;
      var xml_galleries = c.getElements('.gallery');
      var links;
      var aplist = [];
      xml_galleries.each(function(xml_gallery, i) {

        var options = {
          name: xml_gallery.getProperty('name'),
          autoplay: Boolean(xml_gallery.getProperty('autoplay')),
          autoplay_delay: Number(xml_gallery.getProperty('autoplay_delay'))
        }

        var links = xml_gallery.getChildren('a').map(function(tag) {
          return { href: tag.href, size: tag.get('data-milkbox-size'), title: tag.get('title') }
        }, this);

        this.galleries.push(new Ngn.MilkboxGallery(links, options));
      }, this);

      this.fireEvent('xmlGalleries');
    },//end setXmlGalleries

    //[{ name:'gall1', autoplay:true, autoplay_delay:7, files:[{href:'file1.jpg',size:'width:900,height:100', title:'text'},{href:'file2.html',size:'w:800,h:200', title:'text'}] },{...},{...}]  
    setObjectGalleries: function(data) {
      var array = (typeOf(data) == 'array') ? data : [data];
      array.each(function(newobj) {
        var options = {
          name: newobj.name,
          autoplay: newobj.autoplay,
          autoplay_delay: newobj.autoplay_delay
        }
        this.galleries.push(new Ngn.MilkboxGallery(newobj.files, options));
      }, this);
    },

    //utility
    getGallery: function(name) {
      var g = this.galleries.filter(function(gallery) {
        return gallery.name == name;
      }, this);
      return g[0] || null;
    },

    //HTML
    prepareHTML: function() {
      this.display = new Ngn.MilkboxDisplay({
        initialWidth: this.options.initialWidth,
        initialHeight: this.options.initialHeight,
        overlayOpacity: this.options.overlayOpacity,
        marginTop: this.options.marginTop,
        fileboxBorderWidth: this.options.fileboxBorderWidth,
        fileboxBorderColor: this.options.fileboxBorderColor,
        fileboxPadding: this.options.fileboxPadding,
        resizeDuration: this.options.resizeDuration,
        resizeTransition: this.options.resizeTransition,
        centered: this.options.centered,
        autoSize: this.options.autoSize,
        autoSizeMaxHeight: this.options.autoSizeMaxHeight,
        imageOfText: this.options.imageOfText
      });
    },

    refreshDisplay: function(options, keepBackup) {
      if (!this.activated) return;

      var options_bkup = this.display.options;//save original options
      var new_options = Object.merge({}, options_bkup, options);
      if (this.display) {
        this.display.clear()
      }
      this.display = new Ngn.MilkboxDisplay(new_options);
      this.addDisplayEvents();

      if (keepBackup) {
        this.options_bkup = options_bkup;//restored in close();
      } else {
        this.options_bkup = null;
      }
    },

    checkFormElements: function() {
      this.formElements = $$('select, textarea');
      if (this.formElements.length == 0) return;
      this.formElements = this.formElements.map(function(elem) {
        elem.store('visibility', elem.getStyle('visibility'));
        elem.store('display', elem.getStyle('display'));
        return elem;
      });
    },

    hideFormElements: function() {
      if (this.formElements.length == 0) return;
      this.formElements.each(function(elem) {
        elem.setStyle('display', 'none');
      });
    },

    showFormElements: function() {
      if (this.formElements.length == 0) return;
      this.formElements.each(function(elem) {
        elem.setStyle('visibility', elem.retrieve('visibility'));
        elem.setStyle('display', elem.retrieve('display'));
      })
    },

    //EVENTS
    addPageGalleriesEvents: function() {
      var pageGalleries = this.galleries.filter(function(gallery) {
        return !gallery.external
      });
      pageGalleries.each(function(gallery) {
        gallery.items.each(function(item) {
          item.element.addEvent('click', function(e) {
            e.preventDefault();
            this.open(gallery.name, gallery.get_index_of(item));
          }.bind(this));
        }, this);
      }, this);
    },

    removePageGalleryEvents: function() {
      var pageGalleries = this.galleries.filter(function(gallery) {
        return !gallery.external
      });
      pageGalleries.each(function(gallery) {
        gallery.items.each(function(item) {
          item.element.removeEvents('click');
        });
      });
    },

    addDisplayEvents: function() {
      this.display.addEvent('nextClick', function() {
        this.navAux(true, 'next');
      }.bind(this));
      this.display.addEvent('prevClick', function() {
        this.navAux(true, 'prev');
      }.bind(this));
      this.display.addEvent('playPauseClick', function() {
        if (this.paused) {
          this.startAutoPlay();
        } else {
          this.pauseAutoPlay();
        }
        this.display.set_paused(this.paused);
      }.bind(this));
      this.display.addEvent('disappear', function() {
        if (this.options_bkup) {
          this.refreshDisplay(this.options_bkup);
        }
        this.close(false);
      }.bind(this));
      this.display.addEvent('resizeComplete', function() {
        this.busy = false; // see navAux
      }.bind(this));
    },

    prepareEventListeners: function() {
      this.addPageGalleriesEvents();
      this.addDisplayEvents();
      //reset overlay height and position onResize
      window.addEvent('resize', function() {
        if (this.display.ready) {
          this.display.resetOverlaySize();
        }
      }.bind(this));
      //keyboard next/prev/close
      window.document.addEvent('keydown', function(e) {
        if (this.busy == true || this.closed) {
          return;
        }
        if (e.key == 'right' || e.key == 'left' || e.key == 'space') {
          e.preventDefault();
        }
        if (this.display.mode != 'single') {
          if (e.key == 'right' || e.key == 'space') {
            this.navAux(e, 'next');
          } else if (e.key == 'left') {
            this.navAux(e, 'prev');
          }
        }
        if (e.key == 'esc') {
          this.display.disappear();
        }
      }.bind(this));
    },

    navAux: function(e, direction) {
      if (e) {//called from a button/key event
        this.pauseAutoPlay();
      } else {//called from autoplay
        if (this.busy || !this.fileReady) {
          return;
        }//prevent autoplay()
      }
      this.busy = true; //for keyboard and autoplay
      var i, _i;
      if (direction == "next") {
        i = (this.currentIndex != this.currentGallery.items.length - 1) ? this.currentIndex += 1 : this.currentIndex = 0;
        _i = (this.currentIndex != this.currentGallery.items.length - 1) ? this.currentIndex + 1 : 0;
      } else {
        i = (this.currentIndex != 0) ? this.currentIndex -= 1 : this.currentIndex = this.currentGallery.items.length - 1;
        _i = (this.currentIndex != 0) ? this.currentIndex - 1 : this.currentGallery.items.length - 1;
      }
      this.loadFile(this.currentGallery.get_item(i), [this.currentGallery.get_item(_i)]);
    }
  });

})();

Ngn.MilkboxDisplay = new Class({

  Implements: [Options, Events],

  options: {
    initialWidth: 100,
    initialHeight: 100,
    overlayOpacity: 1,
    marginTop: 0,
    fileboxBorderWidth: '0px',
    fileboxBorderColor: '#000000',
    fileboxPadding: '0px',
    resizeDuration: .5,
    resizeTransition: 'sine:in:out',
    centered: false,
    autoSize: false,
    autoSizeMaxHeight: 0,
    imageOfText: 'of',
    onNextClick: function() {
    },
    onPrevClick: function() {
    },
    onPlayPause: function() {
    },
    onDisappear: function() {
    },
    onResizeComplete: function() {
    }
  },

  initialize: function(options) {
    this.setOptions(options);

    this.overlay;
    this.mainbox;
    this.filebox;
    this.bottom;
    this.controls;
    this.caption;
    this.close;
    this.next;
    this.prev;
    this.playpause;
    this.paused = false;
    this.count;

    this.mode = 'standard';
    this.ready = false;//after overlay and mainbox become visible == true

    this.overlay_show_fx;
    this.overlay_hide_fx;

    this.mainbox_show_fx;
    this.mainbox_hide_fx;
    this.mainbox_resize_fx;

    this.current_file = null;

    this.build_html();
    this.prepare_effects();
    this.prepare_events();

  },//end init

  build_html: function() {
    this.overlay = new Element('div', {
      'id': 'mbox-overlay',
      'styles': {
        'visibility': 'visible',
        'position': 'fixed',
        'display': 'none',
        'left': 0,
        'width': '100%',
        'opacity': 0,
        'height': 0,
        'overflow': 'hidden',
        'margin': 0,
        'padding': 0
      }
    }).inject($(document.body));

    this.mainbox = new Element('div', {
      'id': 'mbox-mainbox',
      'styles': {
        'position': (this.options.centered) ? 'fixed' : 'absolute',
        'overflow': 'hidden',
        'display': 'none',
        'z-index': 50001,//overlay z-index (see css) + 1
        'width': this.options.initialWidth,
        'height': this.options.initialHeight,
        'opacity': 0,
        'margin': 0,
        'left': '50%',
        'marginLeft': -(this.options.initialWidth / 2),
        'marginTop': (this.options.centered) ? -(this.options.initialHeight / 2) : '',
        'top': (this.options.centered) ? '50%' : ''
      }
    }).inject($(document.body));

    this.filebox = new Element('div', {
      'id': 'mbox-filebox',
      'styles': {
        'border-style': 'solid',
        'border-width': this.options.fileboxBorderWidth,
        'border-color': this.options.fileboxBorderColor,
        'padding': this.options.fileboxPadding,
        'opacity': 0
      }
    }).inject(this.mainbox);

    this.bottom = new Element('div#mbox-bottom').setStyle('visibility', 'hidden').inject(this.mainbox);
    this.controls = new Element('div#mbox-controls');
    this.caption = new Element('div#mbox-caption', {'html': 'test'}).setStyle('display', 'none');

    this.bottom.adopt(new Element('div.mbox-reset'), this.controls, this.caption, new Element('div.mbox-reset'));

    this.close = new Element('div#mbox-close');
    this.next = new Element('div#mbox-next');
    this.prev = new Element('div#mbox-prev');
    this.playpause = new Element('div#mbox-playpause');
    this.count = new Element('div#mbox-count');

    $$(this.next, this.prev, this.close, this.playpause).setStyles({
      'outline': 'none',
      'cursor': 'pointer'
    });

    this.controls.adopt(new Element('div.mbox-reset'), this.close, this.next, this.prev, this.playpause, new Element('div.mbox-reset'), this.count);
  },

  prepare_effects: function() {
    this.overlay_show_fx = new Fx.Tween(this.overlay, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
        this.element.setStyles({
          'top': -window.getScroll().y,
          'height': window.getScrollSize().y + window.getScroll().y,
          'display': 'block'
        });
      },
      onComplete: function() {
        this.mainbox_show_fx.start(1);
      }.bind(this)
    });

    this.overlay_hide_fx = new Fx.Tween(this.overlay, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
      },
      onComplete: function() {
        this.overlay.setStyle('display', 'none');
        this.fireEvent('disappear');
      }.bind(this)
    });

    this.mainbox_show_fx = new Fx.Tween(this.mainbox, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
        this.mainbox.setStyle('display', 'block');
      }.bind(this),
      onComplete: function() {
        this.ready = true;
      }.bind(this)
    });

    this.mainbox_hide_fx = new Fx.Tween(this.mainbox, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
        this.ready = false;
      }.bind(this),
      onComplete: function() {
        this.overlay.setStyle('display', 'none');
      }.bind(this)
    });


    this.mainbox_resize_fx = new Fx.Morph(this.mainbox, {
      duration: this.options.resizeDuration * 1000,
      transition: this.options.resizeTransition,
      link: 'cancel',
      onStart: function() {
        this.filebox.setStyle('opacity', 0)
      }.bind(this),
      onComplete: function() {
        this.show_bottom();
        this.filebox.setStyle('height', this.current_file.height + 'px');
        this.filebox.grab(this.current_file).tween('opacity', 1);
        this.fireEvent('resizeComplete');
      }.bind(this)
    });

    this.filebox.set('tween', { duration: 'short', link: 'chain' });
  }, // end prepare_effects

  prepare_events: function() {
    $$(this.overlay, this.close).addEvent('click', function() {
      this.disappear();
    }.bind(this));
    this.prev.addEvent('click', function() {
      this.fireEvent('prevClick')
    }.bind(this));
    this.next.addEvent('click', function() {
      this.fireEvent('nextClick')
    }.bind(this));
    this.playpause.addEvent('click', function() {
      this.fireEvent('playPauseClick')
    }.bind(this));
  },

  show_file: function(file, caption, index, length) {
    this.hide_loader();
    if (file.match && file.match('img') && (this.options.autoSize || this.options.centered)) {
      var file = this.get_resized_image(file);
    }
    var file_size = { w: file.width.toInt(), h: file.height.toInt() };
    if (!file_size.w || !file_size.h) {
      alert('Milkbox error: you must pass size values if the file is swf or html or a free file (openWithFile)');
      return;
    } // data-milkbox-size not passed
    file_size = Object.map(file_size, function(value) {
      return value.toInt();
    });

    this.caption.innerHTML = (caption) ? caption : '';
    this.update_count(index, length);
    var filebox_addsize = this.filebox.getStyle('border-width').toInt() * 2 + this.filebox.getStyle('padding').toInt() * 2;
    var final_w = file_size.w + filebox_addsize;
    // so now I can predict the caption height
    var caption_adds = this.caption.getStyles('paddingRight', 'marginRight');
    this.caption.setStyle('width', final_w - caption_adds.paddingRight.toInt() - caption_adds.marginRight.toInt());
    $$(this.bottom, this.controls).setStyle('height', Math.max(this.caption.getDimensions().height, this.controls.getComputedSize().totalHeight));
    var mainbox_size = this.mainbox.getComputedSize();
    var final_h = file_size.h + filebox_addsize + this.bottom.getComputedSize().totalHeight;
    var target_size = {
      w: final_w,
      h: final_h,
      total_w: final_w + mainbox_size.totalWidth - mainbox_size.width,
      total_h: final_h + mainbox_size.totalHeight - mainbox_size.height
    }
    this.current_file = file;
    this.resize_to(target_size);
  }, // show_file

  // image: <img>, maxsize:{ w,h }
  get_resized_image: function(image) {
    var max_size, ratio, check;
    var i_size = { w: image.get('width').toInt(), h: image.get('height').toInt() };
    //cut out some pixels to make it better
    var w_size = window.getSize();
    max_size = {
      w: w_size.x - 60,
      h: w_size.y - 68 - this.options.marginTop * 2
    };
    var max_dim = Math.max(max_size.h, max_size.w);
    if (max_dim == max_size.w) {
      ratio = max_dim / i_size.w;
      check = 'h';
    } else {
      ratio = max_dim / i_size.h;
      check = 'w';
    }
    ratio = (ratio <= 1) ? ratio : 1;
    i_size = Object.map(i_size, function(value) {
      return Math.floor(value * ratio);
    });
    ratio = (max_size[check] / i_size[check] <= 1) ? max_size[check] / i_size[check] : 1;
    i_size = Object.map(i_size, function(value) {
      return Math.floor(value * ratio);
    });
    if (this.options.autoSizeMaxHeight > 0) {
      ratio = (this.options.autoSizeMaxHeight / i_size.height < 1) ? this.options.autoSizeMaxHeight / i_size.height : 1;
      i_size = Object.map(i_size, function(value) {
        return Math.floor(value * ratio);
      });
    }
    image.set({ 'width': i_size.w, 'height': i_size.h });
    return image;
  }, // get_resized_image

  resize_to: function(target_size) {
    this.mainbox_resize_fx.start({
      'width': target_size.w,
      'height': target_size.h,
      'marginLeft': -(target_size.total_w / 2).round(),
      'marginTop': (this.options.centered) ? -(target_size.total_h / 2).round() : ''
    });
  },

  show_loader: function() {
    this.mainbox.addClass('mbox-loading');
  },

  hide_loader: function() {
    this.mainbox.removeClass('mbox-loading');
  },

  clear_content: function() {
    this.filebox.empty();
    this.caption.empty();
    this.count.empty();
    $$(this.bottom, this.controls).setStyle('height', '');
  },

  hide_bottom: function() {
    this.caption.setStyle('display', 'none');
    this.bottom.setStyle('visibility', 'hidden');
  },

  show_bottom: function() {
    this.caption.setStyle('display', 'block');
    this.bottom.setStyle('visibility', 'visible');
  },

  appear: function() {
    if (!this.options.centered) {
      this.mainbox.setStyle('top', window.getScroll().y + this.options.marginTop);
    }
    this.overlay_show_fx.start(this.options.overlayOpacity);
  },

  disappear: function() {
    this.cancel_effects();
    this.current_file = null;
    this.ready = false;
    this.mode = 'standard';
    $$(this.prev, this.next, this.playpause, this.count).setStyle('display', 'none');
    this.playpause.setStyle('backgroundPosition', '0 0');
    this.count.empty();
    this.caption.setStyle('display', 'none').empty();
    this.bottom.setStyle('visibility', 'hidden');
    // TODO anche opacity a 0 se si usa un tween per il file
    this.filebox.setStyle('height', '').empty();
    this.mainbox.setStyles({
      'opacity': 0,
      'display': 'none',
      'width': this.options.initialWidth,
      'height': this.options.initialHeight,
      'marginLeft': -(this.options.initialWidth / 2),
      'marginTop': (this.options.centered) ? -(this.options.initialHeight / 2) : '',
      'top': (this.options.centered) ? '50%' : ''
    });
    this.filebox.setStyle('opacity', 0);
    this.overlay_hide_fx.start(0);
    // this.fireEvent('disappear');
  },// end disappear

  cancel_effects: function() {
    [this.mainbox_resize_fx, this.mainbox_hide_fx, this.mainbox_show_fx, this.overlay_hide_fx, this.overlay_show_fx
    ].each(function(fx) {
        fx.cancel();
      });
  },

  set_mode: function(gallery_type) {
    this.mode = gallery_type;
    var close_w = this.close.getComputedSize().width;
    var prev_w = this.prev.getComputedSize().width;
    var next_w = this.next.getComputedSize().width;
    var playpause_w = this.playpause.getComputedSize().width;
    var offset = this.mainbox.getStyle('border-right-width').toInt();//for design purposes
    switch (gallery_type) {
      case 'autoplay':
        $$(this.playpause, this.close, this.next, this.prev, this.count).setStyle('display', 'block');
        this.controls.setStyle('width', close_w + prev_w + next_w + playpause_w + offset);
        break;
      case 'single':
        $$(this.playpause, this.next, this.prev, this.count).setStyle('display', 'none');
        this.controls.setStyle('width', close_w + offset);
        break;
      case 'standard':
        $$(this.close, this.next, this.prev, this.count).setStyle('display', 'block');
        this.playpause.setStyle('display', 'none');
        this.controls.setStyle('width', close_w + prev_w + next_w + offset);
        break;
      default:
        return;
    }
    this.caption.setStyle('margin-right', this.controls.getComputedSize().totalWidth);
  }, // end set_mode

  set_paused: function(paused) {
    this.paused = paused;
    var pos = (this.paused) ? '0 -66px' : '';
    this.playpause.setStyle('background-position', pos);
  },

  update_count: function(index, length) {
    this.count.set('text', index + ' ' + this.options.imageOfText + ' ' + length);
  },

  resetOverlaySize: function() {
    if (this.overlay.getStyle('opacity') == 0) {
      return;
    }
    // resize only if visible
    var h = window.getSize().y;
    this.overlay.setStyles({ 'height': h });
  },

  clear: function() {
    this.overlay.destroy();
    this.mainbox.destroy();
  }

});
Ngn.MilkboxGallery = new Class({

  Implements: [Options, Events],

  options: { // set all the options here
    name: null,
    autoplay: null,
    autoplay_delay: null,
    remove_title: true
  },

  initialize: function(source, options) {

    this.setOptions(options);

    this.source = source;
    this.external = false;
    this.items = null;
    this.name = this.options.name;
    this.type = null; // 'autoplay','standard','single'
    this.prepare_gallery();
    this.prepare_elements();
  },

  prepare_gallery: function() {
    switch (typeOf(this.source)) {
      case 'element'://single
        if (this.check_extension(this.source.href)) {
          this.items = [this.source];
        } else {
          alert('Wrong file extension: ' + this.source.href);
        }
        break;
      case 'elements': // html
        this.items = this.source.filter(function(link) {
          return this.check_extension(link.href);
        }, this);
        break;
      case 'array': // xml, array
        this.items = this.source.filter(function(link) {
          return this.check_extension(link.href);
        }, this);
        this.external = true;
        break;
      default:
        return;
    }
    //if (this.items.length == 0) {
    //  throw new Error('Warning: gallery ' + this.name + ' is empty');
    //}
  },

  // turns everything into an object
  prepare_elements: function() {
    this.items = this.items.map(function(item) {
      var splitted_url = item.href.split('?');
      var output = {};
      output.element = (typeOf(item) == 'element') ? item : null;
      output.href = splitted_url[0];
      output.vars = (splitted_url[1]) ? splitted_url[1].parseQueryString() : null;
      output.size = null;
      output.caption = (output.element) ? output.element.get('title') : item.title;
      if (this.options.remove_title && output.element) {
        output.element.removeProperty('title')
      }
      var size_string = (output.element) ? output.element.get('data-milkbox-size') : item.size;
      if (size_string) {
        output.size = Object.map(this.get_item_props(size_string), function(value, key) {
          return value.toInt();
        });
      }
      return output;
    }, this);
    if (this.items.length == 0) return;
    this.type = (this.items.length == 1) ? 'single' : (this.options.autoplay) ? 'autoplay' : 'standard';
  },

  check_extension: function(string) {
    return string.split('?')[0].test(/\.(gif|jpg|jpeg|png|swf|html)$/i);
  },

  get_index_of: function(item) {
    var index = (typeOf(item) == 'string') ? this.items.indexOf(this.items.filter(function(i) {
      return i.href === item;
    })[0]) : this.items.indexOf(item);
    return index;
  },

  get_item: function(index) {
    return this.items[index];
  },

  get_item_props: function(prop_string) {
    var props = {};
    var s = prop_string.split(',').each(function(p, i) {
      var clean = p.trim().split(':');
      props[clean[0].trim()] = clean[1].trim();
    }, this);
    return props;
  },

  refresh: function() {
    this.type = (this.items.length == 1) ? 'single' : (this.options.autoplay) ? 'autoplay' : 'standard';
  },

  clear: function() {
    this.source = null;
    this.items = null;
  }

});

Ngn.Milkbox.milkbox = new Ngn.Milkbox({ centered: true });

Ngn.Milkbox.add = function(els, name) {
  if (!els.length) return;
  if (!name) name = 'g' + Ngn.getRandomInt(0, 10000);
  var files = [];
  els.each(function(el, i) {
    el.addEvent('click', function(e) {
      e.preventDefault();
      Ngn.Milkbox.milkbox.open(name, i);
    });
    var eImg = el.getElement('img');
    files.push({
      href: el.get('href'),
      title: eImg ? eImg.get('title') : ''
    });
  });
  if (!files.length) return;
  Ngn.Milkbox.milkbox.addGalleries([{
    name: name,
    files: files
  }]);
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.Upload.js|--*/
Ngn.Form.Upload = new Class({
  Implements: [Options, Events],

  options: {
    dropMsg: 'Пожалуйста перетащите файлы сюда',
    onComplete: function() {
      //window.location.reload(true);
    },
    fileOptions: {}
  },

  initialize: function(form, eInput, options) {
    this.form = form;
    this.eInput = document.id(eInput);
    this.eCaption = this.eInput.getParent('.element').getElement('.help');
    this.name = this.eInput.get('name');
    this.setOptions(options);
    if ('FormData' in window) {
      this.beforeInit();
      this.init();
      this.afterInit();
    } else throw new Error('FormData.window not exists');
  },

  beforeInit: function() {
  },

  inProgress: false,

  init: function() {
    this.eProgress = new Element('div.fileProgress').inject(this.eCaption, 'after');
    this.requestFile = new Ngn.Request.File({
      url: this.options.url,
      onRequest: function() {
        this.inProgress = true;
        this.eProgress.setStyles({display: 'block', width: 0});
        this.eCaption.set('html', Locale.get('Core.uploading'));
      }.bind(this),
      onProgress: function(event) {
        var loaded = event.loaded, total = event.total;
        var proc = parseInt(loaded / total * 100, 10).limit(0, 100);
        if (!proc) return;
        this.eProgress.setStyle('width', proc + '%');
        if (proc == 100) this.eCaption.set('html', Locale.get('Core.uploadComplete'));
        else if (proc) this.eCaption.set('html', proc + '%');
      }.bind(this),
      onComplete: function(r) {
        this.inProgress = false;
        this.eProgress.setStyle('width', '100%');
        this.fireEvent('complete', {result: r});
      }.bind(this)
    });
  },

  afterInit: function() {
  }

});

Ngn.Form.Upload.Single = new Class({
  Extends: Ngn.Form.Upload,

  beforeInit: function() {
    this.eInput.addEvents(this.options.fileEvents);
    this.eInput.addEvents({
      change: function() {
        // the main place in file classes
        this.file = this.eInput.files[0];
        if (this.file.size > Ngn.fileSizeMax) {
          this.eInput.addClass('maxFileSizeExceeded');
        } else {
          this.eInput.removeClass('maxFileSizeExceeded');
        }
      }.bind(this)
    });
  },

  //afterInit: function() {
  //  if (this.options.loadedFiles[this.eInput.get('name')]) {
  //    this.eCaption.set('html', 'Загружен: ' + this.options.loadedFiles[this.eInput.get('name')].name);
  //  }
  //},

  send: function() {
    if (!this.file) {
      this.fireEvent('complete');
      return;
    }
    this.requestFile.append(this.eInput.get('name'), this.file);
    this.requestFile.send();
  }

});

Ngn.Form.Upload.Multi = new Class({
  Extends: Ngn.Form.Upload,

  afterInit: function() {
    this.inputFiles = new Ngn.Form.MultipleFileInput(this.eInput, this.eCaption);
    this.inputFiles.addEvents(this.options.fileEvents);
  },

  send: function() {
    var n = 0;
    this.inputFiles.getFiles().each(function(file) {
      this.requestFile.append(this.name, file);
      n++;
    }.bind(this));
    this.requestFile.send();
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.MultipleFileInput.js|--*/
Object.append(Element.NativeEvents, {
  dragenter: 2, dragleave: 2, dragover: 2, dragend: 2, drop: 2
});

Ngn.Form.MultipleFileInput = new Class({
  Implements: [Options, Events],
  
  initialize: function(eInput, eContainer, options) {
    this.eInput = document.id(eInput);
    this.eContainer = document.id(eContainer);
    this.setOptions(options);
    var drop = this.drop = document.id(this.options.drop);
    var name = this.eInput.get('name');
    this.eInput.set('multiple', true);
    this.inputEvents = {
      change: function() {
        Array.each(this.eInput.files, this.add, this);
      }.bind(this)
    };
    this.dragEvents = drop && (typeof document.body.draggable != 'undefined') ? {
      dragenter: this.fireEvent.bind(this, 'dragenter'),
      dragleave: this.fireEvent.bind(this, 'dragleave'),
      dragend: this.fireEvent.bind(this, 'dragend'),
      dragover: function(event){
        event.preventDefault();
        this.fireEvent('dragover', event);
      }.bind(this),
      drop: function(event){
        event.preventDefault();
        var dataTransfer = event.event.dataTransfer;
        if (dataTransfer) Array.each(dataTransfer.files, this.add, this);
        this.fireEvent('drop', event);
      }.bind(this)
    } : null;
    this.attach();
  },
  
  attach: function(){
    this.eInput.addEvents(this.inputEvents);
    if (this.dragEvents) this.drop.addEvents(this.dragEvents);
  },

  detach: function(){
    this.eInput.removeEvents(this.inputEvents);
    if (this.dragEvents) this.drop.removeEvents(this.dragEvents);
  },
  
  _files: [],

  add: function(file) {
    this._files.push(file);
    this.fireEvent('change', file);
    this.eContainer.set('html', 'Добавлено: '+this._files.length+' шт.');
    return this;
  },

  getFiles: function(){
    return this._files;
  }

});

// заменяет обычный input multiple-input'ом
Ngn.Form.MultipleFileInput.Adv = new Class({
  Extends: Ngn.Form.MultipleFileInput,

  options: {
    itemClass: 'uploadItem'/*,
    onAdd: function(file){},
    onRemove: function(file){},
    onEmpty: function(){},
    onDragenter: function(event){},
    onDragleave: function(event){},
    onDragover: function(event){},
    onDrop: function(event){}*/
  },
  
  _files: [],

  add: function(file) {
    this._files.push(file);
    var self = this;
    new Element('li', {
      'class': this.options.itemClass
    }).grab(new Element('span', {
      text: file.name
    })).grab(new Element('a', {
      text: 'x',
      href: '#',
      events: {
        click: function(e){
          e.preventDefault();
          self.remove(file);
        }
      }
    })).inject(this.eConrainer);
    this.fireEvent('add', file);
    return this;
  },

  remove: function(file){
    var index = this._files.indexOf(file);
    if (index == -1) return this;
    this._files.splice(index, 1);
    this.eContainer.childNodes[index].destroy();
    this.fireEvent('remove', file);
    if (!this._files.length) this.fireEvent('empty');
    return this;
  },

  getFiles: function(){
    return this._files;
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.HeaderToggle.js|--*/
Ngn.Frm.HeaderToggle = new Class({
  Implements: [Options, Events],

  opened: false,

  initialize: function(eBtn, options) {
    this.setOptions(options);
    this.eBtn = eBtn;
    this.eHeader = this.eBtn.getParent();
    this.eToggle = this.eBtn.getParent().getParent();
    this.eHeader.inject(this.eToggle, 'before');
    var saved = Ngn.Storage.get(eBtn.get('data-name'));
    if (saved == undefined) this.toggle(this.opened); else this.toggle(saved);
    this.eBtn.addEvent('click', function(e) {
      e.preventDefault();
      this.toggle(!this.opened);
      Ngn.Storage.set(this.eBtn.get('data-name'), this.opened);
    }.bind(this));
  },

  toggle: function(opened) {
    opened ? this.eHeader.removeClass('headerToggleClosed') : this.eHeader.addClass('headerToggleClosed');
    if (this.eBtn.get('tag') == 'input') this.eBtn.set('value', '  ' + (opened ? '↑' : '↓') + '  ');
    this.eToggle.setStyle('display', opened ? 'block' : 'none');
    this.opened = opened;
    this.fireEvent('toggle', opened);
  }

});


Ngn.Frm.headerToggleFx = function(btns) {
  btns.each(function(btn) {
    var eToggle = btn.getParent().getParent();
    btn.getParent().inject(eToggle, 'before');
    var setArrow = function(opened) {
      btn.set('value', '  ' + (opened ? '↑' : '↓') + '  ');
    };
    var fx = new Fx.Slide(eToggle, {
      duration: 300,
      transition: Fx.Transitions.Pow.easeOut,
      onComplete: function() {
        setArrow(opened);
        Ngn.Storage.set(btn.get('data-name'), opened ? 1 : 0);
      }
    });
    var opened = true;
    var saved = Ngn.Storage.get(btn.get('data-name'));
    if (!saved || saved == 0) {
      fx.hide();
      opened = false;
    }
    if (saved != undefined) setArrow(opened);
    btn.addEvent('click', function(e) {
      e.preventDefault();
      opened ? fx.slideOut() : fx.slideIn();
      opened = !opened;
    });
  });
};
/*--|/home/user/ngn-env/ngn/i/js/ngn/trash/Ngn.IframeFormRequest.js|--*/
Ngn.IframeFormRequest = new Class({

  Implements: [Options, Events],

  options: { /*
    onRequest: function() {},
    onComplete: function(data) {},
    onFailure: function() {}, */
    eventName: 'submit'
  },

  initialize: function(form, options) {
    this.setOptions(options);
    var frameId = this.frameId = String.uniqueID();
    var loading = false;

    this.form = document.id(form);

    this.formEvent = function() {
      loading = true;
      this.fireEvent('request');
    }.bind(this);

    this.iframe = new IFrame({
      name: frameId,
      styles: {
        display: 'none'
      },
      src: 'about:blank',
      events: {
        load: function() {
          if (loading) {
            var doc = this.iframe.contentWindow.document;
            if (doc && doc.location.href != 'about:blank') {
              this.complete(doc);
            } else {
              this.fireEvent('failure');
            }
            loading = false;
          }
        }.bind(this)
      }
    }).inject(document.body);
    this.attach();
  },
  
  complete: function(doc) {
    this.fireEvent('complete', doc.body.innerHTML);
  },

  attach: function() {
    this.target = this.form.get('target');
    this.form.set('action', this.form.get('action').toURI().setData({ifr: 1}, true).toString());
    this.form.set('target', this.frameId)
      .addEvent(this.options.eventName, this.formEvent);
  },

  detach: function() {
    this.form.set('target', this.target)
      .removeEvent(this.options.eventName, this.formEvent);
  }

});


Ngn.IframeFormRequest.JSON = new Class({
  Extends: Ngn.IframeFormRequest,
  
  initialize: function(form, options) {
    this.parent(form, options);
    this.iframe.responseType = 'json';
  },
  
  complete: function(doc) {
    var data = JSON.decode(doc.getElementById('json').value);
    if (data.error) {
      new Ngn.Dialog.Error({ error: data.error });
      return;
    }
    this.fireEvent('complete', data);
  }
  
});
/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Alert.js|--*/
Ngn.Dialog.Alert = new Class({
  Extends: Ngn.Dialog,

  options: {
    noPadding: false,
    title: false
  },

  initialize: function(_opts) {
    var opts = Object.merge(_opts, {
      cancel: false,
      titleClose: false,
      bindBuildMessageFunction: true
    });
    this.parent(opts);
  },

  buildMessage: function(msg) {
    var message_box = new Element('div');
    new Element('div', {'class': 'icon-button alert-icon goleft'}).inject(message_box);
    new Element('div', {'class': 'mav-alert-msg goleft', 'html': msg}).inject(message_box);
    new Element('div', {'class': 'clear'}).inject(message_box);
    return message_box;
  }
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Error.js|--*/
Ngn.Dialog.Error = new Class({
  Extends: Ngn.Dialog.Alert,

  options: {
    title: 'Ошибка',
    width: 600
  },

  buildMessage: function(msg) {
    //throw new Error(this.options.error.message);
    //return this.parent('<p>' + this.options.error.message + ' <i>Code: ' + this.options.error.code + '</i></p>' + '<p>' + this.options.error.trace + '</p>');
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.Saver.js|--*/
Ngn.Frm.SaverBase = new Class({
  Implements: [Options],
  
  options: {
    // url: '',
    changeElementsSelector: Ngn.Frm.selector,
    jsonRequest: false
  },
  
  saving: false,
  
  initialize: function(eForm, options) {
    this.setOptions(options);
    this.eForm = eForm;
    this.hash = JSON.encode(Ngn.Frm.toObj(this.eForm));
    this.addEvents();
    this.init();
  },
  
  init: function() {},
  
  addEvents: function() {
    var els = this.eForm.getElements(this.options.changeElementsSelector);
    els.each(function(eInput) {
      if (eInput.retrieve('saver')) return;
      eInput.store('saver', true);
      eInput.addEvent('blur', this.save.bind(this));
      eInput.addEvent('change', this.save.bind(this));
    }.bind(this));
  },
  
  save: function() {
    if (this.saving) return;
    var p = Ngn.Frm.toObj(this.eForm);
    var postHash = JSON.encode(p);
    if (postHash == this.hash) return;
    Ngn.Request.Iface.loading(true);
    this.saving = true;
    Ngn.Frm.disable(this.eForm, true);
    new (this.options.jsonRequest ? Request.JSON : Request)({
      url: this.options.url,
      onSuccess: function(r) {
        this.saving = false;
        this.hash = postHash;
        Ngn.Request.Iface.loading(false);
        Ngn.Frm.disable(this.eForm, false);
      }.bind(this)
    }).post(p);
  }
  
});

Ngn.Frm.Saver = new Class({
  Extends: Ngn.Frm.SaverBase,
  
  init: function() {
    for (var i=0; i<Ngn.Frm.fieldSets.length; i++) {
      Ngn.Frm.fieldSets[i].addEvent('delete', this.save.bind(this));
      Ngn.Frm.fieldSets[i].addEvent('cleanup', this.save.bind(this));
      Ngn.Frm.fieldSets[i].addEvent('addRow', this.addEvents.bind(this));
    }
  }
  
});
/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.ElSelectDialog.js|--*/
Ngn.ElSelectDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    dialogClass: 'dialog selectDialog',
    noPadding: false
  },
  okClose: function() {
    //this.formEl.setVisibleValue(this.getValue());
    this.fireEvent('changeValue', this.getValue());
    this.parent();
  },
  getValue: function() {
    throw new Error('Abstract');
  }
});
/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.El.DialogSelect.js|--*/
Ngn.Form.El.DialogSelect = new Class({
  Extends: Ngn.Form.El,
  options: {
    selectTitle: Locale.get('Core.change'),
    selectClass: ''
  },
  baseName: 'defualt',
  getInitField: function() {
    return this.eRow.getElement('input') || this.eRow.getElement('select');
  },
  getSelectDialogEl: function() {
    return new Element('a', {
      'class': 'pseudoLink dgray' + (this.options.selectClass ? ' ' + this.options.selectClass : ''),
      html: this.options.selectTitle
    }).inject(this.eInitField, 'after');
  },
  makeHiddenField: function() {
    this.eInput = new Element('input', { type: 'hidden', name: this.eInitField.get('name') }).inject(this.eInitField, 'after');
  },
  init: function() {
    this.eInitField = this.getInitField();
    this.value = this.eInitField.get('value');
    this.makeHiddenField();
    this.eSelectDialog = this.getSelectDialogEl();
    new Element('div', {'class': 'rightFading'}).inject(this.eSelectDialog);
    this.eInitField.dispose();
    this.initControlDefault();
    this.setValue(this.value);
  },
  setValue: function(value) {
    this.setVisibleValue(value);
    this._setValue(value);
  },
  setVisibleValue: function(value) {
    this.eSelectDialog.set('html', value || 'not defined');
  },
  _setValue: function(value) {
    if (!value) return;
    this.value = value;
    this.eInput.set('value', value);
  },
  initControl: function() {
    this.eSelectDialog.addEvent('click', function() {
      var cls = this.getDialogClass();
      if (!cls) throw new Error('class not found');
      new cls(Object.merge({
        value: this.value
      }, this.getDialogOptions()));
    }.bind(this));
  },
  initControlDefault: function() {
    this.initControl();
  },
  getDialogClass: function() {
    throw new Error('Create abstract method getDialogClass()');
  },
  getDialogOptions: function() {
    return {
      onChangeValue: function(value) {
        this.setValue(value);
        if (this.form && this.form.options.dialog) {
          this.form.options.dialog.fireEvent('change' + this.baseName.capitalize(), value);
        }
      }.bind(this)
    };
  }
});
/*--|/home/user/ngn-env/ngn/more/scripts/js/common/tpl.php| (with request data)--*/
Ngn.toObj('Ngn.tpls.fontSelect', '<div class="selectItems">\n    <div class="item" data-name="Aero_Matics_Stencil_Regular">\n    Aero_Matics_Stencil_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Ancient_Kyiv">\n    Ancient_Kyiv    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Archive">\n    Archive    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Attentica_4f_Ultralight">\n    Attentica_4f_Ultralight    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Avdira">\n    Avdira    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azamat">\n    Azamat    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans">\n    Azoft_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Bold">\n    Azoft_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Bold_Italic">\n    Azoft_Sans_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Italic">\n    Azoft_Sans_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bad_Script">\n    Bad_Script    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bardelin">\n    Bardelin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Barkentina">\n    Barkentina    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender">\n    Bender    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Black">\n    Bender_Black    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Black_Italic">\n    Bender_Black_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Bold">\n    Bender_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Bold_Italic">\n    Bender_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Italic">\n    Bender_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Light">\n    Bender_Light    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Light_Italic">\n    Bender_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Boblic">\n    Boblic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bombarda">\n    Bombarda    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Boom_Boom">\n    Boom_Boom    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bradobrei">\n    Bradobrei    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brava_Novella">\n    Brava_Novella    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brava_Novella_Italic">\n    Brava_Novella_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brush">\n    Brush    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Regular">\n    Corki_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Rounded">\n    Corki_Rounded    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Tuscan">\n    Corki_Tuscan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Tuscan_Rounded">\n    Corki_Tuscan_Rounded    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Danger">\n    Danger    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Days">\n    Days    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Decolz">\n    Decolz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Decree_Art_Two">\n    Decree_Art_Two    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Derby">\n    Derby    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Deuz_Ex">\n    Deuz_Ex    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Don_Quixote">\n    Don_Quixote    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Droid_Sans">\n    Droid_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Droid_Sans_Bold">\n    Droid_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="FatC">\n    FatC    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Font_Awesome">\n    Font_Awesome    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Free_Font_Pro">\n    Free_Font_Pro    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat">\n    Fregat    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Bold">\n    Fregat_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Bold_Italic">\n    Fregat_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Italic">\n    Fregat_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Glidesketch">\n    Glidesketch    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Gogol">\n    Gogol    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Graublau_Web">\n    Graublau_Web    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Graublau_Web_Bold">\n    Graublau_Web_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hagin_Caps_Medium">\n    Hagin_Caps_Medium    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hagin_Caps_Thin">\n    Hagin_Caps_Thin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hattori_Hanzo">\n    Hattori_Hanzo    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hattori_Hanzo_Italic">\n    Hattori_Hanzo_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Helgoland">\n    Helgoland    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Intruder">\n    Intruder    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Bold">\n    Iwona_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Bold_Italic">\n    Iwona_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Bold">\n    Iwona_Condensed_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Bold_Italic">\n    Iwona_Condensed_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Heavy_Italic">\n    Iwona_Condensed_Heavy_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Heavy_Regular">\n    Iwona_Condensed_Heavy_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Italic">\n    Iwona_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Light_Italic">\n    Iwona_Condensed_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Light_Regular">\n    Iwona_Condensed_Light_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Medium_Regular">\n    Iwona_Condensed_Medium_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Regular">\n    Iwona_Condensed_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condesed_Medium_Italic">\n    Iwona_Condesed_Medium_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Heavy_Italic">\n    Iwona_Heavy_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Heavy_Regular">\n    Iwona_Heavy_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Italic">\n    Iwona_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Light_Italic">\n    Iwona_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Light_Regular">\n    Iwona_Light_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Medium_Italic">\n    Iwona_Medium_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Medium_Regular">\n    Iwona_Medium_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Regular">\n    Iwona_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="John_Daniels">\n    John_Daniels    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Juan">\n    Juan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Bold_RU">\n    Kelson_Sans_Bold_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Light_RU">\n    Kelson_Sans_Light_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Regular_RU">\n    Kelson_Sans_Regular_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kotyhoroshko_Bold">\n    Kotyhoroshko_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kotyhoroshko_Regular">\n    Kotyhoroshko_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lloyd">\n    Lloyd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lobster">\n    Lobster    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Audrey_BG">\n    Lovely_Audrey_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Grace_BG">\n    Lovely_Grace_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Sofia_BG">\n    Lovely_Sofia_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Condensed">\n    Lytiga_Pro_Condensed    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Condensed_Italic">\n    Lytiga_Pro_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Extended">\n    Lytiga_Pro_Extended    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Extended_Italic">\n    Lytiga_Pro_Extended_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Italic">\n    Lytiga_Pro_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Regular">\n    Lytiga_Pro_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="MS_Reshetka">\n    MS_Reshetka    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Bold">\n    Marta_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Italic">\n    Marta_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Regular">\n    Marta_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Mikodacs">\n    Mikodacs    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Mikodacs_PCS">\n    Mikodacs_PCS    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Multima_Bold">\n    Multima_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Museo_Sans_500">\n    Museo_Sans_500    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Neonic">\n    Neonic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nikodecs">\n    Nikodecs    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG">\n    Nioki_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG_Bold">\n    Nioki_BG_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG_Italic">\n    Nioki_BG_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Now_Grotesk">\n    Now_Grotesk    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Bold">\n    Old_Standard_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Italic">\n    Old_Standard_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Regular">\n    Old_Standard_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Oranienbaum">\n    Oranienbaum    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus">\n    Orpheus    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus_Bold">\n    Orpheus_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus_Italic">\n    Orpheus_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Bold">\n    Palemonas_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Bold_Italic">\n    Palemonas_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Italic">\n    Palemonas_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Regular">\n    Palemonas_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Perforama">\n    Perforama    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Perforama_Italic">\n    Perforama_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pharmadin">\n    Pharmadin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Philosopher">\n    Philosopher    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Bold">\n    Pixar_One_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Display">\n    Pixar_One_Display    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Regular">\n    Pixar_One_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Bold">\n    Pixar_Two_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Display">\n    Pixar_Two_Display    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Regular">\n    Pixar_Two_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans">\n    Resavska_BG_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Bold">\n    Resavska_BG_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Bold_Italic">\n    Resavska_BG_Sans_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Italic">\n    Resavska_BG_Sans_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Retropecan">\n    Retropecan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Black">\n    SkolaSans-Black    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-BlackItalic">\n    SkolaSans-BlackItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Bold">\n    SkolaSans-Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-BoldItalic">\n    SkolaSans-BoldItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Light">\n    SkolaSans-Light    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-LightItalic">\n    SkolaSans-LightItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Medium">\n    SkolaSans-Medium    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-MediumItalic">\n    SkolaSans-MediumItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Regular">\n    SkolaSans-Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-RegularItalic">\n    SkolaSans-RegularItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Skoropys_XVII">\n    Skoropys_XVII    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Sports_World_Regular">\n    Sports_World_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Stiff_Staff">\n    Stiff_Staff    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Sumkin">\n    Sumkin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus">\n    Supremus    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus_Condensed_Italic">\n    Supremus_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus_Italic">\n    Supremus_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Tot_Shrift_Bold">\n    Tot_Shrift_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Underdog">\n    Underdog    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Venus_Rising">\n    Venus_Rising    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Zion_Train_Pro_Stencil_Bold">\n    Zion_Train_Pro_Stencil_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Znikomit_No25">\n    Znikomit_No25    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arial">\n    arial    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arialbd">\n    arialbd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arialbi">\n    arialbi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="ariali">\n    ariali    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgia">\n    georgia    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiab">\n    georgiab    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiai">\n    georgiai    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiaz">\n    georgiaz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="impact">\n    impact    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="tahoma">\n    tahoma    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="tahomabd">\n    tahomabd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="times">\n    times    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesbd">\n    timesbd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesbi">\n    timesbi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesi">\n    timesi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdana">\n    verdana    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanab">\n    verdanab    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanai">\n    verdanai    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanaz">\n    verdanaz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="clear"></div>\n  <script>\n  </script>\n</div>');
/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.js|--*/
// from common

if (!Ngn.sd) Ngn.sd = {};

Ngn.sd.positionDiff = function(pos1, pos2, offset) {
  if (!offset) offset = 0;
  return {
    x: pos1.x - pos2.x + offset,
    y: pos1.y - pos2.y + offset
  }
};

Ngn.sd.loadedFonts = {};
Ngn.sd.loadFont = function(font, onLoad) {
  if (!font) return;
  if (Ngn.sd.loadedFonts[font]) {
    onLoad();
    return;
  }
  Asset.javascript((Ngn.sd.baseUrl || '') + '/sd/js/fonts/' + font + '.js', {
    onLoad: function() {
      Ngn.sd.loadedFonts[font] = true;
      onLoad();
    }
  });
};

Ngn.sd.initFullBodyHeight = function() {
  return;
  var isFullHeight = null;
  var fullBodyHeight = function() {
    if (window.getScrollSize().y > window.getSize().y) {
      if (isFullHeight === true || isFullHeight === null) document.getElement('body').setStyle('height', '');
    } else {
      if (isFullHeight === false || isFullHeight === null) document.getElement('body').setStyle('height', '100%');
    }
  };
  window.addEvent('domready', fullBodyHeight);
  window.addEvent('resize', fullBodyHeight);
};

// --

Ngn.sd.setMinHeight = function(parent, offset, min) {
  if (!offset) offset = 0;
  if (!min) min = 0;
  var max = 0;
  parent.getChildren().each(function(el) {
    var y = el.getSize().y + parseInt(el.getStyle('top'));
    if (y > max) max = y + offset;
  });
  if (max) {
    if (max < min) max = min;
    parent.sdSetStyle('min-height', max);
  }
};

Ngn.sd.Font = new Class({

  directChangeFontStyleProps: function() {
    return [];
  },

  _updateFont: function(forceDirectChange) {
    if (!this.data.font) return;
    if (!this.data.font.fontSize) this.data.font.fontSize = '24px';
    var s = ['font-size', 'font-family', 'color'], prop;
    for (var i = 0; i < s.length; i++) this.styleEl().sdSetStyle(s[i], '');
    for (i in this.data.font) {
      prop = i.hyphenate();
      if (forceDirectChange || Ngn.Arr.inn(prop, this.directChangeFontStyleProps())) {
        this.styleEl().setStyle(prop, this.data.font[i]);
      }
      if (Ngn.Arr.inn(prop, s)) this.styleEl().sdSetStyle(prop, this.data.font[i]);
    }
    this.updateBtnFontSettings();
  },

  updateBtnFontSettings: function() {
    if (!this.btnFontSettings) return;
    if (this.data.font.color) this.btnFontSettings.el.setStyle('background-color', this.data.font.color); else {
      if (this.btnFontSettings.el.getStyle('background-color')) {
        this.btnFontSettings.el.setStyle('background-color', '');
      }
    }
  },

  defaultFontColor: function() {
    return this.data.font.color || false;
  },

  linkColor: function() {
    if (!this.data.font) return false;
    return this.data.font.linkColor || this.data.font.color || false;
  },

  linkOverColor: function() {
    if (!this.data.font) return false;
    return this.data.font.linkOverColor || false;
  },

  settingsAction: 'json_blockSettings',

  fontSettingsDialogOptions: function() {
    return {
      width: 420
    };
  },

  initFont: function() {
    if (!this.data.font) this.data.font = {};
    this.initFontBtn();
    this.updateFont();
  },

  _settingsAction: function() {
    if (Ngn.sd.openedPropDialog) Ngn.sd.openedPropDialog.close();
    Ngn.sd.openedPropDialog = new Ngn.sd.SettingsDialog(Object.merge({
      onClose: function() {
        Ngn.sd.openedPropDialog = false;
      },
      dialogClass: 'settingsDialog dialog',
      id: this.finalData().data.type + this.id(),
      blockId: this.id(),
      baseZIndex: 210,
      force: false,
      url: this.ctrl + '/' + this.settingsAction + '/' + this.id(),
      onSubmitSuccess: function() {
        this.reload();
      }.bind(this),
      onChangeFont: function(fontFamily) {
        this.data.font.fontFamily = fontFamily;
        this._updateFont(true);
      }.bind(this),
      onChangeColor: function(color) {
        this.data.font.color = color;
        this._updateFont(true);
      }.bind(this),
      onChangeSize: function(fontSize) {
        this.data.font.fontSize = fontSize;
        this._updateFont(true);
      }.bind(this)
      //onChangeShadow: function(shadow) {
      //  this.data.font.shadow = shadow;
      //  this._updateFont(true);
      //}.bind(this)
    }, this.settingsDialogOptions()));
  },

  settingsDialogOptions: function() {
    return {};
  },

  initFontBtn: function() {
    if (!this.eBtns) return;
    this.btnFontSettings = new Ngn.Btn( //
      Ngn.Btn.btn2('Font Settings', 'font').inject(this.eBtns), //
      this._settingsAction.bind(this) //
    );
  },

  styleEl: function() {
    return this.el;
  }

});

Ngn.sd.SettingsDialog = new Class({
  Extends: Ngn.Dialog.RequestForm,

  options: {
    useFx: false
  },

  formInit: function() {
    var obj = this;
    var el = this.message.getElement('[name=fontFamily]');
    if (el) {
      el.addEvent('change', function() {
        obj.fireEvent('changeFont', this.get('value'));
      });
      this.message.getElement('[name=fontSize]').addEvent('change', function() {
        obj.fireEvent('changeSize', this.get('value'));
      });
      this.message.getElement('[name=color]').addEvent('change', function() {
        obj.fireEvent('changeColor', this.get('value'));
      });
    }
  }

});

Ngn.sd.Items = new Class({

  reload: function() {
    this.loading(true);
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_getItem/' + this.id() + '?ownPageId=' + Ngn.sd.ownPageId,
      onComplete: function(data) {
        this.setData(data);
        this.updateElement();
        //Ngn.sd.GlobalSlides.init(true);
        this.loading(false);
      }.bind(this)
    }).send();
  },
  id: function() {
    return this.data.id;
  },
  setData: function(data) {
    this.data = data;
  },
  loading: function(flag) {
    Ngn.Request.Iface.loading(flag);
  },
  updateElement: function() {
  }

});

Ngn.sd.ElementMeta = new Class({
  initElement: function(el) {
    this.el = el;
    if (!this.id()) return;
    if (!this.finalData().data.type) throw new Error('this.finalData().data.type');
    this.el.addClass('sdEl').store('obj', this).set('data-id', this.id()).set('data-type', this.finalData().data.type).addClass('type_' + this.finalData().data.type).addClass('id_' + this.id());
  }
});

Ngn.sd.styles = {};

Ngn.sd.buildStyles = function() {
  var r = {};
  for (var selector in Ngn.sd.styles) {
    var styles = Ngn.sd.styles[selector];
    if (!r[selector]) r[selector] = [];
    for (var property in styles) r[selector].push([property.hyphenate(), styles[property]]);
  }
  var css = '';
  for (var selector in r) {
    css += selector + ' {\n';
    for (var i = 0; i < r[selector].length; i++) {
      css += r[selector][i][0] + ': ' + r[selector][i][1] + ';\n';
    }
    css += '}\n';
  }
  return css;
};

Ngn.sd.directChangeStyleProperies = '(width|height|left|top|margin|padding)';
Ngn.sd.directChangeStyleValues = 'rotate';

Element.implement({
  sdSetStyle: function(property, value, subSelector) {
    if (property == 'opacity') {
      this.setOpacity(this, parseFloat(value));
      return this;
    }
    property = (property == 'float' ? floatName : property).camelCase();
    if (typeOf(value) != 'string') {
      //var map = (Element.Styles[property] || '@').split(' ');
      //value = Array.from(value).map(function(val, i) {
      //  if (!map[i]) return '';
      //  return (typeOf(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
      //}).join(' ');
    } else if (value == String(Number(value))) {
      value = Math.round(value);
    }
    var selector;
    var cls = this.get('class');
    if (cls) cls = cls.replace(/\s*dynamicStyles\s*/, '');

    if (this.hasClass('sdEl')) {
      if (subSelector) throw new Error('U can not use subSelector on .sdEl');
      selector = '.' + cls.replace(/(\s+)/g, '.');
    } else {
      var eParent = this.getParent('.sdEl');
      if (eParent) var pCls = this.getParent('.sdEl').get('class').replace(/\s*dynamicStyles\s*/, '');
      selector = (pCls ? '.' + pCls.replace(/(\s+)/g, '.') : '');
      if (subSelector) {
        selector += (cls ? ' .' + cls : '') + ' ' + subSelector;
      } else {
        selector += ' ' + (cls ? '.' + cls : this.get('tag'));
      }
    }
    if (!value) return;
    if (!subSelector && (property.test(new RegExp(Ngn.sd.directChangeStyleProperies, 'i')) || value.test(new RegExp(Ngn.sd.directChangeStyleValues, 'i')))) {
      if (!this.hasClass('dynamicStyles')) this.addClass('dynamicStyles');
      this.setStyle(property, value);
    }
    Ngn.sd.addStyle(selector, property, value);
  },
  sdSetPosition: function(position) {
    return this.sdSetStyles(this.computePosition(position));
  },
  sdSetStyles: function(styles) {
    for (var style in styles) this.sdSetStyle(style, styles[style]);
  }
});

Ngn.sd.addStyle = function(selector, property, value) {
  if (!Ngn.sd.styles[selector]) Ngn.sd.styles[selector] = {};
  Ngn.sd.styles[selector][property] = value;
  Ngn.sd.updateCommonStyle();
};

Ngn.sd.updateCommonStyle = function() {
  if (Ngn.sd.commonStyleGenId) clearTimeout(Ngn.sd.commonStyleGenId);
  Ngn.sd.commonStyleGenId = (function() {
    if ($('commonStyles')) $('commonStyles').dispose();
    new Element('style', {
      id: 'commonStyles',
      type: 'text/css',
      html: Ngn.sd.buildStyles()
    }).inject($('layout'), 'top');
  }).delay(300);
};

Ngn.sd.BlockAbstract = new Class({
  Implements: [Options, Ngn.sd.ElementMeta, Ngn.sd.Items],
  defaultData: false,
  finalData: function() {
    return this.defaultData ? Object.merge(this.defaultData, this._data) : this._data;
  },
  setData: function(data) {
    if (!data) throw new Error('empty data');
    this._data = this.defaultData ? Object.merge(this.defaultData(), data) : data;
    this.data = data.data;
  },
  id: function() {
    return this._data.id;
  },
  initialize: function(el, data, event, options) {
    this.setData(data);
    this.initElement(el);
    this.addCont(this.el);
    this.event = event;
    this.el.addEvent('click', function() {

    });
    this.setOptions(options);
    this.ctrl = '/pageBlock/' + Ngn.sd.bannerId;
    this.init();
  },
  delete: function() {
    this.el.dispose();
  },
  addCont: function(el) {
    new Element('div', {'class': 'cont'}).inject(el);
  },
  updateContainerHeight: function() {
    Ngn.sd.updateContainerHeight(this.container());
  },
  updateFont: function() {
    this._updateFont();
  },
  updateElement: function() {
    this.updateFont();
    this.updateContainerHeight();
    this.el.set('data-id', this.id());
    this.replaceContent();
    this.updateContent();
    this.updateSize();
    Ngn.sd.interface.bars.layersBar.init();
    window.fireEvent('resize');
  },
  eLastContainer: false,
  _container: function() {
    return this.el.getParent();
  },
  container: function() {
    var eContainer = this._container();
    if (!eContainer && this.eLastContainer) return this.eLastContainer;
    //if (!eContainer.hasClass('container')) throw new Error('Block has no container');
    return this.eLastContainer = eContainer;
  },
  inject: function(eContainer) {
    this.setPosition(Ngn.sd.positionDiff(this.el.getPosition(), eContainer.getPosition(), -1));
    if (!this._container() || this._container() != eContainer) {
      this.el.inject(eContainer);
    }
    return this;
  },
  setPosition: function(position) {
    if (!this.data.position) this.data.position = {};
    this.data.position = Object.merge(this.data.position, position);
    this.el.sdSetPosition(this.data.position);
  },
  getDataForSave: function(create) {
    this.data = Object.merge(this.data, {
      ownPageId: Ngn.sd.ownPageId
    });
    this.loading(true);
    // this._data.data - исходные изменяемые данные
    // this.data - текущие несохраненные данные
    if (create) {
      this._data.data = Object.merge(this._data.data, this.data);
      var p = {data: this._data};
      delete p.data.html;
    } else {
      var p = {
        id: this._data.id,
        content: this._data.content,
        data: this.data
      };
    }
    return p;
  },
  save: function(create) {
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_' + (create ? 'create' : 'update') + '?ownPageId=' + Ngn.sd.ownPageId,
      onComplete: function(data) {
        this.setData(data);
        if (create) {
          Ngn.sd.blocks[this._data.id] = this;
          this.initElement(this.el);
        }
        this.updateElement();
        this.creationEvent();
        this.loading(false);
      }.bind(this)
    }).post(this.getDataForSave(create));
  },
  creationEvent: function() {
    Ngn.sd.interface.bars.layersBar.init();
  },
  replaceContent: function() {
    if (!this._data.html) return;
    this.el.getElement('.cont').set('html', this._data.html);
    this.el.getElement('.cont').getElements('a').addEvent('click', function(e) {
      e.preventDefault()
    });
  }
});

Ngn.sd.BlockPreview = new Class({
  Extends: Ngn.sd.BlockAbstract,
  options: {
    action: 'create'
  },
  init: function() {
    this.el.addClass('blockPreview');
    new Ngn.sd.BlockDragNew(this);
  },
  updateElement: function() {
    Ngn.sd.block(Ngn.sd.elBlock().inject(this.container()), this._data);
    this.el.destroy();
  }
});

Ngn.sd.TranslateDragEvents = new Class({

  translateDragEvents: function() {
    return {
      onStart: this.onStart.bind(this),
      onDrag: this.onDrag.bind(this),
      onComplete: this.onComplete.bind(this)
    }
  }

});

Ngn.sd.BlockDraggableProgress = {};

Ngn.sd.BlockDraggable = new Class({
  Implements: [Ngn.sd.TranslateDragEvents],

  name: 'default',

  initialize: function(block) {
    this.block = block;
    this.eHandle = this.getHandleEl();
    this.init();
    new Drag(new Element('div'), Object.merge({
      handle: this.eHandle,
      snap: 0,
      stopPropagation: true
    }, this.translateDragEvents()))
  },

  init: function() {
  },

  getHandleEl: function() {
    return Elements.from('<div class="btn' + (this.name.capitalize()) + ' control"></div>')[0].inject(this.block.el, 'top');
  },

  onStart: function(el, e) {
    Ngn.sd.BlockDraggableProgress[this.name] = true;
  },

  onComplete: function() {
    delete Ngn.sd.BlockDraggableProgress[this.name];
    this.block.updateContainerHeight();
    window.fireEvent(this.name);
    this.block.save();
  }

});

Ngn.sd.BlockResize = new Class({
  Extends: Ngn.sd.BlockDraggable,

  name: 'resize',

  onStart: function(el, e) {
    this.parent(el, e);
    this.offset = this.block.el.getPosition();
  },

  onDrag: function(el, e) {
    this.block.resize({
      w: e.event.pageX - this.offset.x,
      h: e.event.pageY - this.offset.y
    });
  }

});

Ngn.sd.BlockRotate = new Class({
  Extends: Ngn.sd.BlockDraggable,

  name: 'rotate',

  init: function() {
    this.block.data.rotate = this.block.data.rotate || 0;
    if (this.block.data.rotate) this.block.rotate(this.block.data.rotate);
  },
  onStart: function(el, e) {
    this.parent(el, e);
    this.startY = e.event.pageY;
    this.startRotate = this.block.data.rotate;
  },
  onDrag: function(el, e) {
    this.block.rotate(this.startRotate - (this.startY - e.event.pageY) * 2);
  }

});

Ngn.sd.blocks = {};
Ngn.sd.BlockB = new Class({
  Extends: Ngn.sd.BlockAbstract,
  Implements: [Ngn.sd.Font],
  options: {
    action: 'update'
  },
  className: function() {
    return 'Ngn.sd.BlockB' + Ngn.String.ucfirst(this.data.type);
  },
  setData: function(data) {
    if (data.html === undefined) throw new Error('undefined data.html');
    this.parent(data);
  },
  styleEl: function() {
    return this.el.getElement('.cont');
  },
  delete: function() {
    this.parent();
    delete Ngn.sd.blocks[this._data.id];
    Ngn.sd.interface.bars.layersBar.init();
    //this.updateContainerHeight();
  },
  init: function() {
    if (this._data.id) Ngn.sd.blocks[this._data.id] = this;
    this.el.sdSetPosition(this.data.position);
    this.updateOrder();
    this.initControls();
    this.initFont();
    this.replaceContent();
    this.updateContent();
    this.updateSize();
    // Ngn.sd.setMinHeight(eContainer); 
  }, // предназначено для изменения стилей внутренних элементов из данных блока
  setToTheTop: function() {
    var minOrderKey = 1;
    for (var i in Ngn.sd.blocks) {
      if (Ngn.sd.blocks[i]._data.orderKey < minOrderKey) {
        minOrderKey = Ngn.sd.blocks[i]._data.orderKey;
      }
    }
    this.updateOrder(minOrderKey - 1);
    return this;
  },
  updateOrder: function(orderKey) {
    if (orderKey !== undefined) this._data.orderKey = orderKey;
    this.el.setStyle('z-index', -this._data.orderKey + 100);
  },
  updateContent: function() {
    Ngn.sd.GlobalSlides.init();
  },
  rotate: function(deg) {
    this._rotate(this.el.getElement('.cont'), deg);
  },
  _rotate: function(el, deg) {
    el.sdSetStyle('transform', 'rotate(' + deg + 'deg)');
    el.sdSetStyle('-ms-transform', 'rotate(' + deg + 'deg)');
    el.sdSetStyle('-webkit-transform', 'rotate(' + deg + 'deg)');
    this.data.rotate = deg;
  },
  initCopyCloneBtn: function() {
    if (this.finalData().data.type == 'image') {
      this.initCloneBtn();
    } else {
      this.initCopyBtn();
    }
  },
  initCopyBtn: function() {
    /*
     // temporarily disabled
     new Ngn.Btn(Ngn.Btn.btn2('Клонировать', 'copy').inject(this.eBtns, 'top'), function() {
     var data = Object.clone(this._data);
     data.data.position.x += 50;
     data.data.position.y += 50;
     delete data.id;
     Ngn.sd.block(Ngn.sd.elBlock().inject(this.container()), data).save(true);
     }.bind(this));
     */
  },
  initCloneBtn: function() {
    return;
    new Ngn.Btn(Ngn.Btn.btn2('Клонировать', 'copy').inject(this.eBtns, 'top'), function() {
      var data = {
        data: {
          position: {
            x: this._data.data.position.x + 20,
            y: this._data.data.position.y + 20
          },
          type: 'clone',
          refId: this._data.id,
          size: this._data.data.size
        },
        html: this._data.html
      };
      Ngn.sd.block(Ngn.sd.elBlock().inject(this.container()), data).save(true);
    }.bind(this));
  },
  initBtnsHide: function() {
    this.eBtns.setStyle('display', 'none');
    this.el.addEvent('mouseover', function() {
      if (Object.values(Ngn.sd.BlockDraggableProgress).length) return;
      if (Ngn.sd.isPreview()) return;
      if (Ngn.sd.movingBlock.get()) return;
      this.eBtns.setStyle('display', 'block');
    }.bind(this));
    this.el.addEvent('mouseout', function() {
      if (Object.values(Ngn.sd.BlockDraggableProgress).length) return;
      if (Ngn.sd.movingBlock.get()) return;
      this.eBtns.setStyle('display', 'none');
    }.bind(this));
  },
  deleteAction: function() {
    if (!confirm('Are you sure?')) return;
    this.loading(true);
    this._deleteAction();
  },
  _deleteAction: function() {
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_delete/' + this.id(),
      onComplete: function() {
        this.loading(false);
        this.delete();
      }.bind(this)
    }).send();
  },
  initDeleteBtn: function() {
    new Ngn.Btn(Ngn.Btn.btn2('Delete', 'delete').inject(this.eBtns, 'top'), function() {
      this.deleteAction();
    }.bind(this));
  },
  initBlockScopeBtn: function() {
    return;
    Ngn.Btn.flag2(this.global(), {
      title: 'Блок глобальный. Нажмите, что бы сделать локальным',
      cls: 'global',
      url: '/pageBlock/ajax_updateGlobal/' + this._data.id + '/0'
    }, {
      title: 'Блок локальный. Нажмите, что бы сделать глобальным',
      cls: 'local',
      url: '/pageBlock/ajax_updateGlobal/' + this._data.id + '/1'
    }).inject(this.eBtns, 'top');
  },
  initTextScopeBtn: function() {
    if (Ngn.sd.getBlockType(this.finalData().data.type).separateContent) {
      Ngn.Btn.flag2(this.data.separateContent, {
        title: 'Блок имеет отдельный текст для каждого раздела. Сделать общий текст для всех разделов',
        cls: 'dynamic',
        url: '/pageBlock/ajax_updateSeparateContent/' + this._data.id + '/0',
        confirm: 'Тексты для всех, кроме самого первого раздела будут удалены. Вы уверены?'
      }, {
        title: 'Блок имеет общий текст для всех разделов. Сделать отдельный текст для каждого раздела',
        cls: 'static',
        url: '/pageBlock/ajax_updateSeparateContent/' + this._data.id + '/1'
      }).inject(this.eBtns, 'top');
    }
  },
  initEditBtn: function() {
    if (this.finalData().data.type != 'image') {
      new Ngn.Btn(Ngn.Btn.btn2('Редактировать', 'edit').inject(this.eBtns, 'top'), this.editAction.bind(this));
    }
  },
  initBtns: function() {
    this.eBtns = new Element('div', {'class': 'btnSet'}).inject(this.el, 'top');
    this.initDeleteBtn();
    this.initEditBtn();
    this.initCopyCloneBtn();
    this.initBlockScopeBtn();
    this.initTextScopeBtn();
  },
  global: function() {
    if (this.data.global !== undefined) return this.data.global;
    return Ngn.sd.blockContainers[this.data.containerId].data.global;
  },
  editAction: function() {
    //Ngn.sd.previewSwitch(true);
    var cls = this.editDialogClass();
    var options = Object.merge(Object.merge({
      url: this.ctrl + '/json_edit/' + this._data.id + '?ownPageId=' + Ngn.sd.ownPageId,
      dialogClass: 'settingsDialog dialog',
      title: 'Edit Content',
      width: 500,
      id: this.data.type,
      savePosition: true, // force: false,
      onClose: function() {
        //Ngn.sd.previewSwitch(false);
      },
      onSubmitSuccess: function() {
        this.reload();
      }.bind(this)
    }, Ngn.sd.getBlockType(this.data.type).editDialogOptions || {}), this.editDialogOptions());
    new cls(options);
  },
  editDialogClass: function() {
    return Ngn.Dialog.RequestForm;
  },
  editDialogOptions: function() {
    return {};
  },
  initControls: function() {
    //this.initBtns();
    //this.initBtnsHide();
    this.initDrag();
    new Ngn.sd.BlockResize(this);
  },
  initDrag: function() {
    //this.eDrag = Elements.from('<a class="btn control drag dragBox2" data-move="1" title="Передвинуть блок"></a>')[0].inject(this.eBtns, 'top');
    this.drag = new Ngn.sd.BlockDrag(this);
//    return; 
  },
  updateSize: function() {
    if (!this.finalData().data.size) return;
    this.resizeEl(this.finalData().data.size);
  },
  resize: function(size) {
    this.resizeEl(size);
    this.data = Object.merge(this.data, {size: size});
  },
  resizeEl: function(size) {
    this.resizeBlockEl(size);
    this.resizeContentEl(size);
  },
  resizeBlockEl: function(size) {
    this._resizeEl(this.el, size);
  },
  resizeContentEl: function(size) {
    this._resizeEl(this.el.getElement('.cont'), size);
  },
  _resizeEl: function(el, size) {
    if (size.w) el.sdSetStyle('width', size.w + 'px');
    if (size.h) el.sdSetStyle('height', size.h + 'px');
  },
  move: function(d) {
    var r = {
      up: ['y', -1],
      down: ['y', 1],
      left: ['x', -1],
      right: ['x', 1]
    };
    var p = {};
    p[r[d][0]] = this.data.position[r[d][0]] + r[d][1];
    this.setPosition(p);
    clearTimeout(this.timeoutId);
    this.timeoutId = this.save.bind(this).delay(1000);
  },
  resetData: function() {
    this.data = this._data.data;
  },
  hasAnimation: function() {
    return false;
  },
  framesCount: function() {
    return 0;
  }
});

Ngn.sd.BlockBMenu = new Class({
  Extends: Ngn.sd.BlockB,
  init: function() {
    this.parent();
  },
  editDialogOptions: function() {
    var obj = this;
    return {
      width: 250,
      id: 'menu', //footer: false,
      onFormResponse: function() {
        this.form.addEvent('elHDistanceChange', function(value) {
          obj.data.prop.hDistance = value;
          obj.updateContent();
        });
        this.form.addEvent('elHDistanceChanged', function() {
          obj.save();
        });
        this.form.addEvent('elHPaddingChange', function(value) {
          obj.data.prop.hPadding = value;
          obj.updateContent();
        });
        this.form.addEvent('elHPaddingChanged', function() {
          obj.save();
        });
        this.form.addEvent('elVPaddingChange', function(value) {
          obj.data.prop.vPadding = value;
          obj.updateContent();
        });
        this.form.addEvent('elVPaddingChanged', function() {
          obj.save();
        });
        this.form.eForm.getElement('[name=activeBgColor]').addEvent('change', function(color) {
          obj.data.prop.activeBgColor = color.hex;
          obj.updateContent();
          //obj.save();
        });
      }
    };
  },
  updateContent: function() {
    if (!this.data.prop) this.data.prop = {};
    if (this.data.prop.activeBgColor)
      this.el.getElement('.cont').getElement('a.sel').sdSetStyle('background-color', this.data.prop.activeBgColor);
    if (this.data.prop.overBgColor)
      this.el.getElement('.cont').sdSetStyle('background-color', this.data.prop.overBgColor, 'a:hover');
    this.el.getElement('.cont').sdSetStyle('margin-right', this.data.prop.hDistance + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-left', this.data.prop.hPadding + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-right', this.data.prop.hPadding + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-top', this.data.prop.vPadding + 'px', 'a');
    this.el.getElement('.cont').sdSetStyle('padding-bottom', this.data.prop.vPadding + 'px', 'a');
  },
  _updateFont: function() {
    this.parent();
    this.updateLinkSelectedColor();
  },
  updateLinkSelectedColor: function() {
    if (!this.data.font || !this.data.font.linkSelectedColor) return;
    this.styleEl().sdSetStyle('color', this.data.font.linkSelectedColor, 'a.sel');
  }
});

Ngn.sd.BlockBFont = new Class({
  Extends: Ngn.sd.BlockB,
  settingsDialogOptions: function() {
    return {
      width: 350,
      onChangeFont: function(font) {
        if (!this.data.font) this.data.font = {};
        this.data.font.fontFamily = font;
        this.updateCufon();
      }.bind(this),
      onChangeSize: function(size) {
        if (!this.data.font) this.data.font = {};
        this.data.font.fontSize = size;
        this.updateCufon();
      }.bind(this),
      onChangeColor: function(color) {
        if (!this.data.font) this.data.font = {};
        this.data.font.color = color;
        this.updateCufon();
      }.bind(this),
      onCancelClose: function() {
        if (this.data.font) {
          this.resetData();
          this.updateCufon();
        } else {
          this.styleEl().set('html', this.data.html);
        }
      }.bind(this)
    };
  },
  directChangeFontStyleProps: function() {
    return ['font-size', 'font-family', 'color'];
  },
  updateFont: function() {
  },
  updateCufon: function() {
    this._updateFont();
    Ngn.sd.BlockBFont.html[this.id()] = this.data.html;
    this.loadFont(function() {
      Cufon.set('fontFamily', this.data.font.fontFamily); // Так-то куфон подхватывает шрифт из стилей, но где-то в другом месте (в диалоге, например) он может быть определен через set(). Так что нужно переопределять и тут
      var cufonProps = {};
      if (this.data.font.shadow) {
        cufonProps = {
          textShadow: '1px 1px rgba(0, 0, 0, 0.8)'
        };
      }
      Cufon.replace(this.styleEl(), cufonProps);
      Ngn.Request.Iface.loading(false);
      this.phantomCufonLoaded();
    }.bind(this));
  },
  phantomCufonLoaded: function() {
    if (typeof window.callPhantom === 'function') {
      window.callPhantom({
        action: 'cufonLoaded'
      });
    }
  },
  loadFont: function(onLoad) {
    if (!this.data.font || !this.data.font.fontFamily) return;
    Ngn.Request.Iface.loading(true);
    Ngn.sd.loadFont(this.data.font.fontFamily, onLoad);
  },
  replaceContent: function() {
    this.parent();
    this.updateCufon();
  },
  initControls: function() {
    this.parent();
    new Ngn.sd.BlockRotate(this);
  },
  framesCount: function() {
    return 2;
  }
});

Ngn.sd.BlockBFont.html = {};

Ngn.sd.BlockBClone = new Class({
  Extends: Ngn.sd.BlockB,
  finalData: function() {
    return Ngn.sd.blocks[this._data.data.refId]._data;
  },
  initCopyCloneBtn: function() {
  },
  initResize: function() {
  },
  getDataForSave: function(create) {
    var p = this.parent(create);
    if (p.data.data && p.data.data.size) delete p.data.data.size;
    return p;
  }
});

// factory
Ngn.sd.block = function(el, data) {
  var cls = 'Ngn.sd.BlockB' + Ngn.String.ucfirst(data.data.type);
  var o = eval(cls);
  cls = o || Ngn.sd.BlockB;
  return new cls(el, data);
};

Ngn.sd.BlockDragAbstract = new Class({
  initialize: function(block) {
    this.block = block;
    this.drag = new Drag.Move(this.block.el, this.getDragOptions());
    this.startPos = {};
    this.init();
  },
  init: function() {
  },
  create: false,
  getDragOptions: function() {
    return {
      onDrop: function(eBlock, eContainer, event) {
        this.drop(eBlock);
      }.bind(this)
    };
  },
  drop: function(eBlock) {
    window.fireEvent('resize');
    this.block.setPosition({
      x: eBlock.getStyle('left').toInt(),
      y: eBlock.getStyle('top').toInt()
    });
    this.block.updateContainerHeight();
    this.block.save(this.create);
  }
});

Ngn.sd.BlockDragNew = new Class({
  Extends: Ngn.sd.BlockDragAbstract,
  create: true,
  init: function() {
    this.drag.start(this.block.event);
  },
  cancel: function() {
    this.block.delete();
  }
});

Ngn.sd.blockDraggin = false;

Ngn.sd.BlockDrag = new Class({
  Extends: Ngn.sd.BlockDragAbstract,
  initialize: function(block) {
    this.block = block;
    if (this.block.eDrag) {
      this.block.eDrag.addEvent('click', function() {
        if (this.dragging) return;
        Ngn.sd.movingBlock.toggle(block);
      }.bind(this));
    }
    this.drag = new Drag.Move(this.block.el, this.getDragOptions());
    this.startPos = {};
    this.init();
  },
  dragging: false,
  start: function(eBlock) {
    this.dragging = true;
    Ngn.sd.blockDraggin = true;
    this.startPos = eBlock.getPosition(this.block.container());
    Ngn.sd.movingBlock.cancel();
  },
  drop: function(eBlock, eContainer) {
    (function() {
      this.dragging = false;
      Ngn.sd.blockDraggin = false;
    }.bind(this)).delay(10);
    var eCurContainer = this.block.container();
    this.parent(eBlock, eContainer);
    if (eCurContainer != eContainer) Ngn.sd.updateContainerHeight(eCurContainer);
  },
  cancel: function() {
    this.dragging = false;
    this.block.el.sdSetPosition(this.startPos);
  }
});

Ngn.sd.elBlock = function() {
  return new Element('div', {'class': 'block'});
};

// data: id
Ngn.sd.ContainerAbstract = new Class({
  Implements: [Options, Ngn.sd.ElementMeta, Ngn.sd.Font, Ngn.sd.Items],
  type: null,
  options: {
    disableFont: false
  },
  finalData: function() {
    return {data: this.data};
  },
  initialize: function(data, options) {
    this.setOptions(options);
    this.data = data;
    this.afterData();
    this.ctrl = '/' + this.type;
    this.data.type = this.type;
    this.initElement(this.getEl());
    this.el.store('data', data);
    if (!this.data.position) this.data.position = {
      x: 0,
      y: 0
    };
    this.setPosition(this.data.position);
    this.initControls();
    if (!this.options.disableFont) this.initFont();
  },
  afterData: function() {
  },
  btns: {},
  initControls: function() {
    this.eBtns = new Element('div', {'class': 'btnSet'}).inject(this.el);
    new Element('div', {
      'class': 'ctrlTitle',
      html: this.id() + ':'
    }).inject(this.eBtns);
    this.initDrag();
    this.btns.deleteBg = new Ngn.Btn(Ngn.Btn.btn2('Удалить фон', 'delete').inject(this.eBtns), function() {
      if (!Ngn.confirm()) return;
      this.loading(true);
      new Ngn.Request.JSON({
        url: this.ctrl + '/json_removeBg/' + this.id(),
        onComplete: function() {
          this.loading(false);
          this.setBg(false);
        }.bind(this)
      }).send();
    }.bind(this));
    new Ngn.Btn(Ngn.Btn.btn2('Настройки фона', 'bgSettings').inject(this.eBtns), function() {
      new Ngn.Dialog.RequestForm({
        dialogClass: 'settingsDialog compactFields dialog',
        width: 450,
        url: this.ctrl + '/json_bgSettings/' + this.id(),
        onSubmitSuccess: function() {
          this.reload();
        }.bind(this)
      });
    }.bind(this));
    new Ngn.Btn(Ngn.Btn.btn2('Задать фон', 'image').inject(this.eBtns), null, {
      fileUpload: {
        url: this.ctrl + '/json_uploadBg/' + this.id(),
        onRequest: function() {
          this.loading(true);
        }.bind(this),
        onComplete: function(r) {
          this.loading(false);
          this.setBg(r.url + '?' + Math.random(1000));
        }.bind(this)
      }
    });
    this.setBg(this.data.bg || false);
  },
  toggleBtns: function() {
    this.btns.deleteBg.toggleDisabled(!!this.data.bg);
  },
  initDrag: function() {
    var eDrag = Elements.from('<div class="drag dragBox" title="Передвинуть фон"></div>')[0].inject(this.eBtns);
    var startCursorPos;
    new Drag(eDrag, {
      snap: 0,
      onStart: function(el, e) {
        startCursorPos = [e.event.clientX, e.event.clientY];
      },
      onDrag: function(el, e) {
        this.curPosition = {
          x: this.data.position.x + startCursorPos[0] - e.event.clientX,
          y: this.data.position.y + startCursorPos[1] - e.event.clientY
        };
        this.setPosition(this.curPosition);
      }.bind(this),
      onComplete: function(el) {
        this.data.position = this.curPosition;
        this.save();
      }.bind(this)
    });
  },
  setBg: function(url) {
    if (url) this.data.bg = url; else delete this.data.bg;
    this.refreshBg();
  },
  refreshBg: function() {
    var s = ['color'];
    for (var i = 0; i < s.length; i++) this.styleEl().sdSetStyle('background-' + s[i], '');
    if (this.data.bgSettings) for (var i in this.data.bgSettings) this.styleEl().sdSetStyle('background-' + i, this.data.bgSettings[i]);
    this.el.sdSetStyle('background-image', this.data.bg ? 'url(' + this.data.bg + '?' + this.data.dateUpdate + ')' : 'none');
    this.toggleBtns();
  },
  save: function(create) {
    var data = this.data;
    if (data.bg) delete data.bg;
    this.loading(true);
    new Ngn.Request.JSON({
      url: this.ctrl + '/json_' + (create ? 'create' : 'update'),
      onComplete: function() {
        this.loading(false);
      }.bind(this)
    }).post({data: data});
  },
  updateElement: function() {
    this.refreshBg();
    this._updateFont();
  },
  updateFont: function() {
    this._updateFont();
  },
  setPosition: function(position) {
    if (!position.x && !position.y) {
      this.el.sdSetStyle('background-position', '');
      return;
    }
    this.el.sdSetStyle('background-position', (-position.x) + 'px ' + (-position.y) + 'px');
  },
  loading: function(flag) {
    Ngn.Request.Iface.loading(flag);
  }
});

Ngn.sd.BlockContainer = new Class({
  Extends: Ngn.sd.ContainerAbstract,
  type: 'blockContainer',
  getEl: function() {
    var eParent = $('layout2').getElement('.lCont');
    var eContainer = new Element('div', {'class': 'container'});
    if (this.data.wrapper) {
      if ($(this.data.wrapper)) eParent = $(this.data.wrapper); else {
        eParent = new Element('div', {
          id: this.data.wrapper,
          'class': this.data.wrapper
        }).inject(eParent);
        new Element('div', {'class': 'clear clear_' + this.data.wrapper}).inject(eParent);
      }
      eContainer.inject(eParent.getElement('.clear_' + this.data.wrapper), 'before');
    } else {
      eContainer.inject(eParent);
    }
    return eContainer;
  },
  initControls: function() {
  }
});

Ngn.sd.Layout = new Class({
  Extends: Ngn.sd.ContainerAbstract,
  type: 'layout',
  options: {
    disableFont: true,
    cls: false
  },
  initControls: function() {
  },
  getEl: function() {
    if (!this.data.parent) throw new Error('parent not defined in ' + this.id() + ' layout');
    if (!$(this.data.parent)) throw new Error(this.data.parent + ' not found');
    var el = new Element('div', {
      id: this.id(),
      'class': 'layout' + (this.options.cls ? ' ' + this.options.cls : '')
    }).inject($(this.data.parent));
    return el;
  }
});

Ngn.sd.LayoutContent = new Class({
  Extends: Ngn.sd.ContainerAbstract,
  type: 'layoutContent',
  getEl: function() {
    return new Element('div', {
      'class': 'lCont'
    }).inject($('layout2'));
  },
  defaultFontColor: function() {
    return '#000';
  },
  initControls: function() {
  }
});

if (!Ngn.sd.blockTypes) Ngn.sd.blockTypes = [];

Ngn.sd.getBlockType = function(type) {
  for (var i = 0; i < Ngn.sd.blockTypes.length; i++) {
    if (Ngn.sd.blockTypes[i].data.type == type) return Ngn.sd.blockTypes[i];
  }
  for (var i = 0; i < Ngn.sd.blockUserTypes.length; i++) {
    if (Ngn.sd.blockUserTypes[i].data.type == type) return Ngn.sd.blockUserTypes[i];
  }
  return false;
};

Ngn.sd.exportLayout = function() {
  var eLayout = $('layout').clone();
  eLayout.getElements('.btnSet').dispose();
  eLayout.getElements('.btnResize').dispose();
  eLayout.getElements('.block.type_font').each(function(eBlock) {
    eBlock.getElement('.cont').set('html', Ngn.sd.BlockBFont.html[eBlock.get('data-id')]);
  });
  eLayout.getElements('.dynamicStyles').removeProperty('style').removeClass('dynamicStyles');
  // replace dynamic blocks content
  eLayout.getElements('.block').each(function(eBlock) {
    // разобраться в этом куске
    if (!Ngn.sd.blocks[eBlock.get('data-id')]) return;
    var type = Ngn.sd.blocks[eBlock.get('data-id')].finalData().data.type;
    if (Ngn.sd.getBlockType(type).dynamic) {
      var eStyle = eBlock.getElement('style');
      eStyle.inject(eBlock.getElement('.cont').set('html', '{tplBlock:' + eBlock.get('data-id') + '}'), 'top');
    }
  });
  new Element('style', {
    type: 'text/css',
    html: Ngn.sd.buildStyles()
  }).inject(eLayout, 'top');
  return eLayout.get('html');
};

Ngn.sd.ownPageId = 0;
Ngn.sd.blockUserTypes = [];

Ngn.sd.initUserTypes = function(types) {
  if (!types.length) return;
  new Ngn.sd.UserPanel(types);
  Ngn.sd.blockUserTypes = types;
};

Ngn.sd.initPageTitle = document.title;

Ngn.getParam = function(val) {
  var result = "Not found", tmp = [];
  location.search//.replace ( "?", "" )
    // this is better, there might be a question mark inside
    .substr(1).split("&").forEach(function(item) {
      tmp = item.split("=");
      if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    });
  return result;
};

Ngn.sd.loadData = function(ownPageId, onComplete) {
  onComplete = onComplete || function() {
  };
  $('layout1').set('html', '');
  Ngn.sd.ownPageId = ownPageId;
  Ngn.Request.Iface.loading(true);
  Ngn.sd.blockContainers = {};
  if (Ngn.sd.pagesSet) Ngn.sd.pagesSet.setActive(ownPageId);
  new Ngn.Request.JSON({
    url: '/cpanel/' + Ngn.sd.bannerId + '/json_get/?renderKey=' + Ngn.renderKey,
    onComplete: function(data) {
      var v, i;
      document.getElement('head title').set('html', data.pageTitle + ' - ' + Ngn.sd.initPageTitle);
      if (data.blockUserTypes) Ngn.sd.initUserTypes(data.blockUserTypes);
      Ngn.sd.eLayoutContent = new Element('div', {
        'class': 'lCont sdEl'
      }).inject('layout1');
      Ngn.sd.blocks = {};
      for (i = data.items.pageBlock.length - 1; i >= 0; i--) {
        v = data.items.pageBlock[i];
        Ngn.sd.blocks[v.id] = Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), v);
      }
      Ngn.sd.eContentOverlayBorder = new Element('div', {'class': 'contentOverlayBorder'}).inject(Ngn.sd.eLayoutContent, 'top');
      new Element('div', {'class': 'contentOverlay contentOverlayLeft'}). //
        inject(Ngn.sd.eLayoutContent, 'top');
      new Element('div', {'class': 'contentOverlay contentOverlayTop'}). //
        inject(Ngn.sd.eLayoutContent, 'top');
      Ngn.sd.eContentOverlayRight = new Element('div', {'class': 'contentOverlay contentOverlayRight'}). //
        inject(Ngn.sd.eLayoutContent, 'top');
      Ngn.sd.eContentOverlayBottom = new Element('div', {'class': 'contentOverlay contentOverlayBottom'}). //
        inject(Ngn.sd.eLayoutContent, 'top');
      Ngn.sd.data = data;
      Ngn.sd.setBannerSize(data.bannerSettings.size);
      Ngn.sd.updateLayoutContentHeight();
      Ngn.sd.updateOrderBar(data.items.pageBlock);
      Ngn.sd.setPageTitle(ownPageId);
      Ngn.Request.Iface.loading(false);
      window.fireEvent('resize');
      onComplete(data);
    }
  }).send();
};

Ngn.sd.PageBlocksShift = new Class({
  back: function(id) {
    var ePrev = Ngn.sd.blocks[id].el.getPrevious('.block');
    if (ePrev) {
      Ngn.sd.blocks[id].el.inject(ePrev, 'before');
      this.updateOrder(id);
    }
  },
  forward: function(id) {
    var eNext = Ngn.sd.blocks[id].el.getNext('.block');
    if (eNext) {
      Ngn.sd.blocks[id].el.inject(eNext, 'after');
      this.updateOrder(id);
    }
  },
  updateOrder: function(id) {
    var esBlocks = Ngn.sd.blocks[id].el.getParent('.layout').getElements('.block');
    var ids = [];
    for (var i = 0; i < esBlocks.length; i++) {
      ids.push(esBlocks[i].get('data-id'));
    }
    new Ngn.Request.JSON({
      url: '/pageBlock/' + Ngn.sd.bannerId + '/json_updateOrder'
    }).post({
        ids: ids
      });
  }
});

Ngn.sd.pages = {};

Ngn.sd.setPageTitle = function(n) {
  if (Ngn.sd.pages[n]) $('pageTitle').set('html', Ngn.sd.pages[n]);
};

Ngn.sd.UserPanel = new Class({
  initialize: function(blockUserTypes) {
    var eBlocksPanel = new Element('div', {
      'class': 'dropRightMenu extraBlocks'
    }).inject(Ngn.sd.ePanel, 'after');
    new Element('div', {
      'class': 'tit',
      html: 'Ещё'
    }).inject(eBlocksPanel);
    Ngn.sd.buildBlockBtns(blockUserTypes, eBlocksPanel);
    new Ngn.HidebleBar.V(eBlocksPanel);
  }
});

Ngn.sd.OrderBarItem = new Class({

  initialize: function(id) {
    this.id = id;
    this.el = new Element('div', {
      'class': 'item',
      html: Ngn.sd.blocks[id]._data.data.type + ' ' + Ngn.sd.blocks[id]._data.id
    }).inject($('orderBar'));
    this.el.addEvent('mouseover', function() {
      Ngn.sd.blocks[id].el.addClass('highlight');
    });
    this.el.addEvent('mouseout', function() {
      Ngn.sd.blocks[id].el.removeClass('highlight');
    });
  }

});

Ngn.sd.updateOrderBar = function(orderedBlocks) {
  $('orderBar').set('html', '');
  for (var i = 0; i < orderedBlocks.length; i++) {
    if (Ngn.sd.blocks[orderedBlocks[i].id]) new Ngn.sd.OrderBarItem(orderedBlocks[i].id);
  }
};

Ngn.sd.animation = {};
Ngn.sd.animation.exists = function() {
  for (var i in Ngn.sd.blocks) {
    if (Ngn.sd.blocks[i].hasAnimation()) return true;
  }
  return false;
};
Ngn.sd.setBannerSize = function(size) {
  Ngn.sd.bannerSize = size;
  Ngn.sd.eLayoutContent.setStyle('width', size.w + 'px');
  Ngn.sd.eContentOverlayBottom.setStyle('width', size.w + 'px');
  Ngn.sd.eContentOverlayBottom.setStyle('top', size.h + 'px');
  Ngn.sd.eContentOverlayRight.setStyle('left', size.w + 'px');
  Ngn.sd.eLayoutContent.setStyle('min-height', 'auto');
  Ngn.sd.eLayoutContent.setStyle('height', size.h + 'px');
  Ngn.sd.eContentOverlayBorder.setStyle('height', size.h + 'px');
};
Ngn.sd.animation.framesCount = function() {
  var count = 0;
  for (var i in Ngn.sd.blocks) {
    if (Ngn.sd.blocks[i].framesCount() > count) {
      count = Ngn.sd.blocks[i].framesCount();
    }
  }
  return count;
};

Ngn.sd.sortBySubKey = function(obj, key1, key2) {
  var r = [];
  for (var key in obj) r.push(obj[key]);
  r.sort(function(a, b) {
    bb = parseInt(b[key1][key2]);
    aa = parseInt(a[key1][key2]);
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });
  return r;
};

Ngn.sd.changeBannerBackground = function(backgroundUrl) {
  new Ngn.Request.JSON({
    url: '/cpanel/' + Ngn.sd.bannerId + '/json_createBackgroundBlock?backgroundUrl=' + backgroundUrl,
    onComplete: function() {
      Ngn.sd.reinit();
    }
  }).send();
};

Ngn.sd.fbtn = function(title, cls) {
  var btn = new Element('a', {
    'class': 'panelBtn ' + cls,
    html: '<i></i><div>' + title + '</div>'
  });
  new Element('div', {'class': 'featureBtnWrapper'}).grab(btn).inject(Ngn.sd.eFeatureBtns);
  return btn;
};

Ngn.sd.movingBlock = {
  get: function() {
    return this.block;
  },
  set: function(block) {
    this.block = block;
    block.eDrag.addClass('pushed');
  },
  toggle: function(block) {
    if (this.block) {
      var enother = this.block != block;
      this.block.eDrag.removeClass('pushed');
      this.block = false;
      if (enother) this.set(block);
    } else {
      this.set(block);
    }
  },
  cancel: function() {
    if (!this.block) return;
    this.block.eDrag.removeClass('pushed');
    this.block = false;
  }
};

Ngn.sd.minContainerHeight = 100;


Ngn.sd.isPreview = function() {
  return $('layout').hasClass('preview');
};

Ngn.sd.previewSwitch = function(flag) {
  flag = typeof(flag) == 'undefined' ? Ngn.sd.isPreview() : !flag;
  if (flag) {
    document.getElement('.body').removeClass('preview');
    if (Ngn.sd.btnPreview) Ngn.sd.btnPreview.togglePushed(false);
  } else {
    document.getElement('.body').addClass('preview');
    if (Ngn.sd.btnPreview) Ngn.sd.btnPreview.togglePushed(true);
  }
};

Ngn.sd.updateLayoutContentHeight = function() {
  return;
  var y = 0;
  for (var i in Ngn.sd.blockContainers) y += Ngn.sd.blockContainers[i].el.getSize().y;
  $('layout').getElement('.lCont').sdSetStyle('min-height', (y + 6) + 'px');
};

Ngn.sd.SelectDialog = new Class({
  Extends: Ngn.ElSelectDialog,
  options: {
    selectedName: false,
    footer: false,
    width: 580,
    height: 300,
    savePosition: true,
    onChangeFont: function() {
    }
  },
  setOptions: function(opts) {
    this.parent(Object.merge(opts || {}, {id: this.name + 'Select'}));
  },
  init: function() {
    var eSelected;
    var obj = this;
    this.message.getElements('div.item').each(function(el) {
      if (obj.options.selectedName && el.get('data-name') == obj.options.selectedName) {
        eSelected = el.addClass('selected');
      }
      el.addEvent('click', function() {
        if (eSelected) eSelected.removeClass('selected');
        el.addClass('selected');
        eSelected = this;
        obj.fireEvent('changeValue', el.get('data-name'));
      });
    });
    if (eSelected) (function() {
      new Fx.Scroll(obj.message).toElement(eSelected)
    }).delay(500);
  }
});

// @requiresBefore s2/js/common/tpl?name=fontSelect&controller=/font/ajax_browse
Ngn.sd.FontSelectDialog = new Class({
  Extends: Ngn.sd.SelectDialog,
  name: 'font',
  options: {
    width: 600,
    message: Ngn.tpls.fontSelect,
    title: 'Choose Font...'
  },
  init: function() {
    this.parent();
    this.message.addClass('hLoader');
    var els = this.message.getElements('div.item');
    var loaded = 0;
    els.each(function(el) {
      Ngn.sd.loadFont(el.get('data-name'), function() {
        loaded++;
        Cufon.set('fontFamily', el.get('data-name')).replace(el.getElement('.font'));
        if (loaded == els.length) this.message.removeClass('hLoader');
      }.bind(this));
    }.bind(this));
  }
});

Ngn.Form.El.DialogSelect.Sd = new Class({
  Extends: Ngn.Form.El.DialogSelect,

  getSelectDialogEl: function() {
    var eSelectDialog = new Element('div', {
      'class': 'dialogSelect' + (this.options.selectClass ? ' ' + this.options.selectClass : ''),
      title: this.options.selectTitle
    }).inject(this.eInitField, 'after');
    new Element('div', {'class': 'rightFading'}).inject(eSelectDialog);
    return eSelectDialog;
  }

});

Ngn.Form.El.FontFamilyCufon = new Class({
  Extends: Ngn.Form.El.DialogSelect.Sd,
  baseName: 'font',
  options: {
    selectClass: 'font'
  },
  init: function() {
    this.parent();
    this.value ? Ngn.sd.loadFont(this.value, this.initControl.bind(this)) : this.initControl();
  },
  initControlDefault: function() {
  },
  setValue: function(font) {
    this.parent(font);
    Cufon.set('fontFamily', font).replace(this.eSelectDialog);
  },
  getDialogClass: function() {
    return Ngn.sd.FontSelectDialog;
  }
});

Ngn.sd.itemTpl = function(k, v) {
  var el = Elements.from(Ngn.tpls[k])[0].getElement('div.item[data-name=' + v + ']');
  if (!el) throw new Error('Element "' + v + '" not found');
  return el.get('html');
};

Ngn.sd.exportPageR = function(n) {
  console.debug('Загружаю данные');
  var onLoaded = function(n) {
    var onComplete;
    if (Ngn.sd.pages[n + 1]) {
      onComplete = function() {
        Ngn.sd.exportPageR(n + 1);
      }
    } else {
      onComplete = function() {
        new Ngn.Dialog.Link({
          title: 'Результат',
          width: 150,
          link: '/index.html?' + Math.random()
        });
      }
    }
    console.debug('Экспортирую ' + (n == 1 ? 'индекс' : n));
    Ngn.sd.exportRequest(n == 1 ? 'index' : 'page' + n, onComplete);
  };
  Ngn.sd.loadData(n, onLoaded);
};

Ngn.sd.interface = {};

Ngn.sd.init = function(bannerId) {
  Ngn.sd.bannerId = bannerId;
  Ngn.sd.interface.bars = Ngn.sd.barsClass ? new Ngn.sd.barsClass() : new Ngn.sd.Bars();
  if (window.location.hash == '#preview') {
    Ngn.sd.previewSwitch();
  }
  if (typeof window.callPhantom === 'function') {
    window.callPhantom({
      action: 'afterInit'
    });
  }
  window.fireEvent('sdAfterInit', bannerId);
};

Ngn.sd.reinit = function() {
  Ngn.sd.init(Ngn.sd.bannerId);
};

Ngn.sd.updateContainerHeight = function(eContainer) {
  return;
  Ngn.sd.setMinHeight(eContainer, 0, Ngn.sd.minContainerHeight);
  Ngn.sd.updateLayoutContentHeight();
};

Ngn.sd.initFullBodyHeight();

/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.GlobalSlides.js|--*/
Ngn.sd.GlobalSlides = new Class({

  duration: 1500,
  slideSelector: '.cont div',
  blocks: [],

  initialize: function(blocks) {
    this.id = Ngn.String.rand(3);
    this.blocks = [];
    for (var i in blocks) {
      this.add(blocks[i]);
    }
    this.startAnimation.delay(100, this); // Make delay to all blocks will be already added
  },

  add: function(block) {
    if (!block.hasAnimation()) return;
    this.blocks.push(block);
    this.hideSlides(block);
  },

  hideSlides: function(block) {
    var slides = block.el.getElements(this.slideSelector);
    if (slides.length > 1) {
      for (var i = 1; i < slides.length; i++) {
        slides[i].setStyle('display', 'none');
      }
    }
  },

  slides: [],

  cacheSlides: function() {
    var slides = [];
    for (var i = 0; i < this.blocks.length; i++) {
      slides.push(this.blocks[i].el.getElements(this.slideSelector));
    }
    this.slides = slides;
  },

  phantomFrameChange: function() {
    if (typeof window.callPhantom === 'function') {
      window.callPhantom({
        action: 'frameChange'
      });
    }
  },

  currentIndex: 0,
  nextIndex: 0,
  animationStarted: false,
  maxSlidesBlockN: 0,

  initMaxSlidesBlockN: function() {
    for (var i = 0; i < this.slides.length; i++) {
      if (this.slides[i].length > this.maxSlidesBlockN) {
        this.maxSlidesBlockN = i;
      }
    }
  },

  nextSlide: function() {
    if (this.slides[this.maxSlidesBlockN][this.currentIndex + 1]) {
      this.nextIndex = this.currentIndex + 1;
    } else {
      this.nextIndex = 0;
    }
    // hide current
    for (var i = 0; i < this.slides.length; i++) {
      if (this.slides[i].length > 1) {
        if (this.slides[i][this.currentIndex]) this.slides[i][this.currentIndex].setStyle('display', 'none');
        if (this.slides[i][this.nextIndex]) this.slides[i][this.nextIndex].setStyle('display', 'block');
      }
    }
    // show next
    this.currentIndex = this.nextIndex;
    this.phantomFrameChange();
  },

  animationId: null,

  startAnimation: function() {
    if (this.animationStarted) return;
    this.animationStarted = true;
    this.phantomFrameChange();
    this.cacheSlides();
    this.initMaxSlidesBlockN();
    this.animationId = this.nextSlide.periodical(this.duration, this);
  }

});

Ngn.sd.GlobalSlides.init = function() {
  if (Ngn.sd.GlobalSlides.timeoutId) {
    clearTimeout(Ngn.sd.GlobalSlides.timeoutId);
  }
  Ngn.sd.GlobalSlides.timeoutId = function() {
    if (Ngn.sd.GlobalSlides.instance) {
      clearTimeout(Ngn.sd.GlobalSlides.instance.animationId);
    }
    Ngn.sd.GlobalSlides.instance = new Ngn.sd.GlobalSlides(Ngn.sd.blocks);
  }.delay(1);
};

Ngn.sd.GlobalSlides.lastFrameChangeTime = 0;

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.HidebleBar.js|--*/
Ngn.hidebleBarIds = [];
Ngn.HidebleBar = new Class({

  modes: ['up', 'down'],
  slideMode: 'vertical',

  initialize: function(eBar, mode) {
    this.mode = mode || this.modes[0];
    this.id = Ngn.hidebleBarIds.length + 1;
    Ngn.hidebleBarIds.push(this.id);
    this.eBar = document.id(eBar);
    this.initBarPosition = this.eBar.getPosition();
    this.eBar.addClass('hidebleBar ' + this.slideMode);
    this.eHandlerHide = new Element('div', {'class': 'hidebleBarHandler'}).addClass(this.slideMode).addClass('hide').addClass(this.mode);
    this.eHandlerShow = new Element('div', {'class': 'hidebleBarHandler'}).addClass(this.slideMode).addClass('show');
    var handleShowExtraClass = this.eBar.get('class').replace(/\s*dropRightMenu\s*/, '') || false;
    if (handleShowExtraClass) this.eHandlerShow.addClass(handleShowExtraClass);
    Ngn.HidebleBar.addHover(this.eHandlerHide, 'hover');
    Ngn.HidebleBar.addHover(this.eHandlerShow, 'hover');
    this.eHandlerHide.inject(this.eBar);
    this.eHandlerShow.inject(document.getElement('body'));
    this.positionHandlerShow();
    this.init();
    window.addEvent('resize', this.position.bind(this));
    var fxHide = new Fx.Slide(this.eBar, {
      mode: this.slideMode,
      duration: 100,
      onComplete: function() {
        this.hide();
        Ngn.Storage.set('hidebleBar' + this.id, false);
      }.bind(this)
    });
    var state = Ngn.Storage.bget('hidebleBar' + this.id);
    if (!state) {
      (function() {
        fxHide.hide();
        this.hide();
      }).delay(1, this);
    } else {
      this.eHandlerShow.setStyle('visibility', 'hidden');
    }
    var fxShow = new Fx.Slide(this.eBar, {
      mode: this.slideMode,
      duration: 100,
      onComplete: function() {
        window.fireEvent('resize');
        Ngn.Storage.set('hidebleBar' + this.id, true);
        this.eHandlerShow.setStyle('visibility', 'hidden');
      }.bind(this)
    });
    this.eHandlerHide.addEvent('click', function() {
      fxHide.slideOut();
    });
    this.eHandlerShow.addEvent('click', function() {
      fxShow.slideIn();
    }.bind(this));
  },

  hide: function() {
    this.eHandlerShow.setStyle('visibility', 'visible');
    window.fireEvent('resize');
  },

  position: function() {
    this.positionHandlerShow();
  },

  styleProp: 'top',
  positionProp: 'y',

  positionHandlerShow: function() {
    if (this.mode == this.modes[1]) {
      this.eHandlerShow.setStyle(this.styleProp, window.getSize()[this.positionProp] - this.eHandlerShow.getSize()[this.positionProp]);
    } else {
      this.eHandlerShow.setStyle(this.styleProp, this.initBarPosition[this.positionProp] + 'px');
    }
  },

  init: function() {
    this.eHandlerShow.addClass(this.mode == this.modes[1] ? this.modes[0] : this.modes[1]);
    if (this.mode == this.modes[0]) this.eHandlerHide.setStyle(this.styleProp, this.eBar.getSize()[this.positionProp] - this.eHandlerHide.getSize()[this.positionProp]);
  }

});


Ngn.HidebleBar.H = new Class({
  Extends: Ngn.HidebleBar,

  init: function() {
    this.parent();
    Ngn.setToCenterHor(this.eHandlerHide, this.eBar);
    Ngn.setToCenterHor(this.eHandlerShow, this.eBar);
  },

  position: function() {
    this.parent();
    Ngn.setToCenterHor(this.eHandlerHide);
    Ngn.setToCenterHor(this.eHandlerShow);
  }

});

Ngn.HidebleBar.V = new Class({
  Extends: Ngn.HidebleBar,

  modes: ['left', 'right'],
  slideMode: 'horizontal',
  styleProp: 'left',
  positionProp: 'x'

});

Ngn.HidebleBar.addHover = function(el, hoverClass) {
  el.addEvent('mouseover', function() {
    this.addClass(hoverClass);
  });
  el.addEvent('mouseout', function() {
    this.removeClass(hoverClass);
  });
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Link.js|--*/
Ngn.Dialog.Link = new Class({
  Extends: Ngn.Dialog.Msg,

  options: {
    width: 120,
    title: '&nbsp;',
    footer: false,
    linkTitle: 'Открыть',
    bindBuildMessageFunction: true
    //link: ''
  },

  buildMessage: function() {
    return Elements.from('<h2 style="text-align: center"><a href="' + this.options.link + '" target="_blank">' + this.options.linkTitle + '</a></h2>')[0];
  }

});
/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.Bars.js|--*/
Ngn.sd.Bars = new Class({
  layersBar: null,
  initialize: function() {
    var pg = window.location.hash.match(/#pg(\d+)/);
    Ngn.sd.ePanel = new Element('div', {'class': 'cont'}).inject($('panel'));
    new Element('a', {
      'class': 'logo',
      href: '/', //target: '_blank',
      title: '...'
    }).inject(Ngn.sd.ePanel);
    Ngn.sd.eFeatureBtns = new Element('div', {
      'class': 'featureBtns'
    }).inject(Ngn.sd.ePanel);
    //new Element('div', {'class': 'clear'}).inject(Ngn.sd.ePanel);
    new Element('div', {
      'class': 'tit'
    }).inject(Ngn.sd.ePanel);
    document.getElement('.profileBar').inject(Ngn.sd.ePanel);
    Ngn.sd.eLayers = new Element('div', {'class': 'cont'}).inject($('layers'));
    Ngn.sd.loadData(pg ? pg[1] : 1, function(data) {
      this.layersBar = this.getLayersBar();

      //
    }.bind(this));
    this.bindKeys();
    window.fireEvent('sdPanelComplete');
  },
  getLayersBar: function() {
    return new Ngn.sd.LayersBar();
  },
  bindKeys: function() {
    var moveMap = {
      119: 'up',
      87: 'up',
      1094: 'up',
      1062: 'up',
      1092: 'left',
      1060: 'left',
      97: 'left',
      65: 'left',
      1099: 'down',
      1067: 'down',
      83: 'down',
      115: 'down',
      100: 'right',
      68: 'right',
      1074: 'right',
      1042: 'right'
    };
    var shiftMap = {
      'q': 'back',
      'Q': 'back',
      'й': 'back',
      'Й': 'back',
      'e': 'forward',
      'E': 'forward',
      'у': 'forward',
      'У': 'forward'
    };
    document.addEvent('keypress', function(e) {
      if (e.shift && (e.key == 'p' || e.key == 'з')) Ngn.sd.previewSwitch(); // p
      else if (moveMap[e.code]) {
        var movingBlock = Ngn.sd.movingBlock.get();
        if (movingBlock) movingBlock.move(moveMap[e.code]);
      } else if (shiftMap[e.key]) {
        var movingBlock = Ngn.sd.movingBlock.get();
        if (movingBlock) {
          (new Ngn.sd.PageBlocksShift)[shiftMap[e.key]](movingBlock._data.id);
        }
      }
    });
  }
});

/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.LayersBar.js|--*/
Ngn.sd.LayersBar = new Class({
  initialize: function() {
    this.init();
  },
  init: function() {
    Ngn.sd.eLayers.set('html', '');
    new Element('div', {
      html: 'Layers',
      'class': 'lTitle'
    }).inject(Ngn.sd.eLayers);
    var eLayers = new Element('div', {
      'class': 'layers'
    }).inject(Ngn.sd.eLayers);
    Ngn.sd.sortBySubKey(Ngn.sd.blocks, '_data', 'orderKey').each(function(item) {
      this.getTitle(item);
      var eItem = new Element('div', {
        'class': 'item ' + 'item_' + (item.data.subType || item.data.type),
        'data-id': item._data.id,
        'data-type': item.data.type,
        events: {
          click: function() {
            if (!Ngn.sd.blocks[item._data.id].canEdit()) return;
            Ngn.sd.blocks[item._data.id]._settingsAction(Ngn.sd.blocks[item._data.id]);
          }.bind(this)
        }
      });
      new Element('div', {
        'class': 'title',
        html: this.getTitle(item)
      }).inject(eItem);
      var eBtns = new Element('div', {
        'class': 'btns'
      }).inject(eItem);
      if (this.canEdit(item)) {
        new Ngn.Btn( //
          Ngn.Btn.btn2('Edit', 'edit').inject(eBtns), //
          Ngn.sd.blocks[item._data.id]._settingsAction.bind(Ngn.sd.blocks[item._data.id]) //
        );
      } else {
        new Element('a', {
          'class': 'smIcons dummy'
        }).inject(eBtns);
      }
      new Ngn.Btn( //
        Ngn.Btn.btn2('Delete', 'delete').inject(eBtns), //
        Ngn.sd.blocks[item._data.id].deleteAction.bind(Ngn.sd.blocks[item._data.id]) //
      );
      eItem.inject(eLayers);
    }.bind(this));
    new Sortables(eLayers, {
      onStart: function(eMovingLayer) {
        eMovingLayer.addClass('drag');
      },
      onComplete: function(eMovingLayer) {
        eMovingLayer.removeClass('drag');
        var ePrevLayer;
        var id = eMovingLayer.get('data-id');
        ePrevLayer = eMovingLayer.getPrevious();
        if (ePrevLayer) {
          Ngn.sd.blocks[id].el.inject( //
            Ngn.sd.blocks[ePrevLayer.get('data-id')].el, 'before');
        } else {
          ePrevLayer = eMovingLayer.getNext();
          if (ePrevLayer) {
            Ngn.sd.blocks[id].el.inject( //
              Ngn.sd.blocks[ePrevLayer.get('data-id')].el, 'after');
          }
        }
        // request
        var ids = this.serialize(0, function(element) {
          return element.get('data-id');
        });
        for (var i = 0; i < ids.length; i++) {
          Ngn.sd.blocks[ids[i]].updateOrder(i);
        }
        new Ngn.Request({
          url: '/pageBlock/' + Ngn.sd.bannerId + '/json_updateOrder'
        }).post({
            ids: ids
          });
      }
    });
  },
  getTitle: function(item) {
    if (item.data.subType == 'image') {
      return '<span class="ico 1">' + item._data.html + '</span>' + Ngn.String.ucfirst(item.data.type);
    } else if (item.data.type == 'text') {
      return '<span class="ico 2">' + '<img src="/sd/img/font.png"></span>' + //
      '<span class="text">' + (item._data.html ? item._data.html : 'empty') + '</span>'
    } else {
      return '<span class="ico"></span>unsupported';
    }
  },
  canEdit: function(item) {
    return Ngn.sd.blocks[item._data.id].finalData().data.type == 'text';
  }
});

/*--|/home/user/ngn-env/bc/sd/js/plugins/new.js|--*/
window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('New banner', 'add'), function() {
    new Ngn.Dialog.RequestForm({
      url: '/newBanner',
      width: 200,
      onSubmitSuccess: function(r) {
        window.location = '/cpanel/' + r.id;
      }
    });
  });
});
/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/plugins/animatedText.js|--*/
Ngn.sd.blockTypes.push({
  title: 'Text',
  data: {
    type: 'animatedText',
    subType: 'text'
  }
});

Ngn.sd.BlockBAnimatedText = new Class({
  Extends: Ngn.sd.BlockBFont,
  hasAnimation: function() {
    return this.data.font.text.length > 1;
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add text', 'text'), function() {
    var data = Ngn.sd.getBlockType('animatedText');
    data.data.position = {
      x: 0,
      y: 0
    };
    Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), {
      data: data.data,
      html: ''
    }).setToTheTop().save(true);
  });
});
/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/plugins/animatedImage.js|--*/
Ngn.sd.blockTypes.push({
  title: 'Image',
  data: {
    type: 'animatedImage'
  }
});

Ngn.sd.BlockBAnimatedImage = new Class({
  Extends: Ngn.sd.BlockB,
  resizeContentEl: function(size) {
    this.el.getElements('img').each(function(el) {
      this._resizeEl(el, size);
    }.bind(this));
    this.parent(size);
  },
  hasAnimation: function() {
    return this.data.images && this.data.images.length > 1;
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add image', 'image'), function() {
    var data = Ngn.sd.getBlockType('animatedImage');
    data.data.position = {
      x: 0,
      y: 0
    };
    Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), {
      data: data.data,
      html: ''
    }).setToTheTop().save(true);
  });
});
/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.BlockBImage.js|--*/
Ngn.sd.BlockBImage = new Class({
  Extends: Ngn.sd.BlockB,
  replaceContent: function() {
    this.parent();
    var eImg = this.el.getElement('img');
    eImg.set('src', eImg.get('src') /*+ '?' + Math.random(1000)*/);
  },
  initControls: function() {
    this.parent();
    new Ngn.sd.BlockRotate(this);
  },
  resizeContentEl: function(size) {
    this._resizeEl(this.el.getElement('img'), size);
    this.parent(size);
  },
  initFont: function() {
  }
});

/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/plugins/background.js|--*/
Ngn.sd.BlockBBackground = new Class({
  Extends: Ngn.sd.BlockBImage
});

Ngn.sd.BackgroundInsertDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    id: 'background',
    title: 'Insert background',
    okText: 'Insert',
    dialogClass: 'dialog-images',
    onRequest: function() {
      this.initImages();
    },
    ok: function() {
      Ngn.sd.changeBannerBackground(Ngn.sd.selectedBackgroundUrl);
    }.bind(this)
  },
  initialize: function(options) {
    var w = Ngn.sd.data.bannerSettings.size.w.toInt();
    if (w < 200) {
      w = w * 3;
    } else if (w < 400) {
      w = w * 2;
    }
    var h = Ngn.sd.data.bannerSettings.size.h.toInt();
    if (h < 200) {
      //h = h * 2;
    } else if (h < 400) {
      //h = h * 2;
    }
    this.options.width = w + 56;
    this.options.height = h + 30;
    this.options.url = '/cpanel/' + Ngn.sd.bannerId + '/ajax_backgroundSelect';
    this.parent(options);
  },
  removeClass: function() {
    this.images.each(function(el) {
      el.removeClass('selected');
    });
  },
  initImages: function() {
    this.images = this.message.getElements('img');
    this.select(this.images[0]);
    this.images.each(function(el) {
      el.addEvent('click', function() {
        this.select(el);
      }.bind(this));
    }.bind(this));
  },
  select: function(el) {
    this.removeClass();
    Ngn.sd.selectedBackgroundUrl = el.get('src');
    el.addClass('selected');
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add background', 'background'), function() {
    new Ngn.sd.BackgroundInsertDialog();
  });
});
/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.ImageInsertDialog.js|--*/
Ngn.sd.ImageInsertDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    id: 'image',
    title: 'Insert image',
    okText: 'Insert',
    width: 400,
    height: 300,
    //url: 'ajax_select',
    //createUrl: 'ajax_select',
    dialogClass: 'dialog-images',
    createImageJsonAction: 'createImageBlock',
    onRequest: function() {
      this.initImages();
    }
  },
  initialize: function(opts) {
    if (!opts) opts = {};
    opts = Object.merge(opts, {
      ok: this.okAction.bind(this)
    });
    this.parent(opts);
  },
  okAction: function() {
    this.insertImage(this.selectedUrl);
  },
  createImageUrl: function(url) {
    return '/cpanel/' + Ngn.sd.bannerId + '/json_' + this.createImageJsonAction + '?url=' + url
  },
  insertImage: function(url) {
    new Ngn.Request.JSON({
      url: this.createImageUrl(url),
      onComplete: function() {
        Ngn.sd.reinit();
      }
    }).send();
  },
  removeClass: function() {
    this.images.each(function(el) {
      el.removeClass('selected');
    });
  },
  initImages: function() {
    this.images = this.message.getElements('img');
    this.select(this.images[0]);
    this.images.each(function(el) {
      el.addEvent('click', function() {
        this.select(el);
      }.bind(this));
    }.bind(this));
  },
  select: function(el) {
    this.removeClass();
    this.selectedUrl = el.get('src');
    el.addClass('selected');
  }
});

/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/plugins/button.js|--*/
Ngn.sd.BlockBButton = new Class({
  Extends: Ngn.sd.BlockBImage
});

window.addEvent('sdPanelComplete', function() {
  Ngn.sd.ButtonInsertDialog = new Class({
    Extends: Ngn.sd.ImageInsertDialog,

    options: {
      id: 'button',
      title: 'Insert button',
      url: '/cpanel/' + Ngn.sd.bannerId + '/ajax_buttonSelect'
    },
    createImageUrl: function(url) {
      return '/cpanel/' + Ngn.sd.bannerId + '/json_createButtonBlock?url=' + url
    }
  });
  new Ngn.Btn(Ngn.sd.fbtn('Add button', 'button'), function() {
    new Ngn.sd.ButtonInsertDialog();
  });
});
/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/plugins/clipart.js|--*/
Ngn.sd.BlockBClipart = new Class({
  Extends: Ngn.sd.BlockBImage
});

Ngn.sd.ClipartInsertDialog = new Class({
  Extends: Ngn.sd.ImageInsertDialog,
  options: {
    id: 'clipart',
    title: 'Insert clipart',
    url: '/cpanel/' + Ngn.sd.bannerId + '/ajax_clipartSelect'
  },
  createImageUrl: function(url) {
    return '/cpanel/' + Ngn.sd.bannerId + '/json_createClipartBlock?url=' + url
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add clipart', 'clipart'), function() {
    new Ngn.sd.ClipartInsertDialog();
  });
});
/*--|/home/user/ngn-env/bc/sd/js/plugins/fromTemplate.js|--*/
window.addEvent('sdPanelComplete', function() {
  Ngn.sd.CreateFromTemplateDialog = new Class({
    Extends: Ngn.sd.ImageInsertDialog,
    options: {
      id: 'template',
      title: 'Create from template',
      okText: 'Create',
      width: 400,
      height: 300,
      url: '/cpanel/' + Ngn.sd.bannerId + '/ajax_templateSelect'
    },
    insertImage: function(url) {
      new Ngn.Request.JSON({
        url: '/createFromTemplate/' + url.replace(/.*\/(\d+)\..*/, '$1'),
        onComplete: function(bannerId) {
          window.location = '/cpanel/' + bannerId;
        }
      }).send();
    }
  });
  new Ngn.Btn(Ngn.sd.fbtn('Create from template', 'template'), function() {
    new Ngn.sd.CreateFromTemplateDialog();
  });
});
/*--|/home/user/ngn-env/bc/sd/js/plugins/settings.js|--*/
window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Settings', 'settings'), function() {
    new Ngn.Dialog.RequestForm({
      url: '/cpanel/' + Ngn.sd.bannerId + '/json_settings',
      width: 250,
      onSubmitSuccess: function(r) {
        Ngn.sd.setBannerSize(r);
      }
    });
  });
});
/*--|/home/user/ngn-env/bc/sd/js/plugins/render.js|--*/
Ngn.sd.render = function() {
  new Ngn.Dialog.HtmlPage({
    url: url = '/render/' + Ngn.sd.bannerId,
    title: 'Render',
    width: Ngn.sd.bannerSize.w.toInt() + 30
  });
};

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Render', 'render'), function() {
    Ngn.sd.render();
  });
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.HtmlPage.js|--*/
Ngn.Dialog.HtmlPage = new Class({
  Extends: Ngn.Dialog,

  options: {
    noPadding: false,
    footer: false,
    reduceHeight: true
  }

});
/*--|/home/user/ngn-env/bc/sd/js/plugins/download.js|--*/
window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Download', 'download'), function() {
    var dialog = new Ngn.Dialog.Loader({
      title: 'Rendering...',
      width: 200
    });
    new Ngn.Request({
      url: '/download/' + Ngn.sd.bannerId,
      onComplete: function(bannerUrl) {
        dialog.close();
        window.location = bannerUrl;
      }
    }).send();
  });
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Loader.js|--*/
Ngn.Dialog.Loader = new Class({
  Extends: Ngn.Dialog,

  options: {
    bindBuildMessageFunction: true,
    ok: false,
    hasFaviconTimer: true // при редиректе, после включения DialogLoader'а FaviconTimer необходимо отключить
  },

  initialize: function(options) {
    this.parent(options);
  },

  start: function() {
    if (this.options.hasFaviconTimer) Ngn.FaviconTimer.start();
  },

  stop: function() {
    if (this.options.hasFaviconTimer) Ngn.FaviconTimer.stop();
  },

  close: function() {
    this.stop();
    this.parent();
  },

  buildMessage: function() {
    return '<div class="dialog-progress"></div>';
  }

});

Ngn.Dialog.Loader.Simple = new Class({
  Extends: Ngn.Dialog.Loader,

  options: {
    //cancel: false,
    titleClose: false,
    footer: false,
    messageBoxClass: 'dummy',
    titleBarClass: 'dialog-loader-title',
    titleTextClass: 'dummy',
    messageAreaClass: 'dummy',
    bindBuildMessageFunction: true
  }

});

Ngn.Dialog.Loader.Advanced = new Class({
  Extends: Ngn.Dialog.Loader,

  options: {
    messageAreaClass: 'dialog-message dialog-message-loader',
    onContinue: Function.from(),
    noPadding: false
  },

  init: function() {
    this.eProgress = this.message.getElement('.dialog-progress');
    this.stop();
  },

  buildMessage: function() {
    return '<div class="message-text"></div><div class="dialog-progress"></div>';
  },

  start: function() {
    this.eProgress.removeClass('stopped');
    this.parent();
  },

  stop: function() {
    this.eProgress.addClass('stopped');
    this.parent();
  }

});

Ngn.Dialog.Loader.Request = new Class({
  Extends: Ngn.Dialog.Loader.Simple,

  options: {
    loaderUrl: null,
    onLoaderComplete: Function.from(),
    titleClose: false,
    footer: false
  },

  initialize: function(options) {
    this.parent(options);
    new Request({
      url: this.options.loaderUrl,
      onComplete: function(r) {
        this.okClose();
        this.fireEvent('loaderComplete', r);
      }.bind(this)
    }).send();
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.FaviconTimer.js|--*/
Ngn.FaviconTimer = {
  
  start: function() {
    Ngn.Favicon.animate([
      '/i/img/icons/l/loader1.ico',
      '/i/img/icons/l/loader2.ico',
      '/i/img/icons/l/loader3.ico',
      '/i/img/icons/l/loader4.ico'
    ]);
  },
  
  stop: function() {
    Ngn.Favicon.stop();
  }
  
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.Favicon.js|--*/
// Favicon.js - Change favicon dynamically [http://ajaxify.com/run/favicon].
// Copyright (c) 2006 Michael Mahemoff. Only works in Firefox and Opera.
// Background and MIT License notice at end of file, see the homepage for more.

// USAGE:
// * favicon.change("/icon/active.ico");  (Optional 2nd arg is new title.)
// * favicon.animate(new Array("icon1.ico", "icon2.ico", ...));
//     Tip: Use "" as the last element to make an empty icon between cycles.
//     To stop the animation, call change() and pass in the new arg.
//     (Optional 2nd arg is animation pause in millis, overwrites the default.)
// * favicon.defaultPause = 5000;

Ngn.Favicon = {

  // -- "PUBLIC" ----------------------------------------------------------------

  defaultPause: 1000,
  initIconUrl: '/favicon.ico',

  change: function(iconURL, optionalDocTitle) {
    clearTimeout(this.loopTimer);
    if (optionalDocTitle) {
      document.title = optionalDocTitle;
    }
    this.replaceLink(iconURL);
  },

  animate: function(iconSequence, optionalDelay) {
    var links = this.getAllLinks();
    if (links.length && links[0].href) this.initIconUrl = links[0].href;
    // --------------------------------------------------
    this.preloadIcons(iconSequence);
    this.iconSequence = iconSequence;
    this.sequencePause = (optionalDelay) ? optionalDelay : this.defaultPause;
    Ngn.Favicon.index = 0;
    Ngn.Favicon.change(iconSequence[0]);
    this.loopTimer = setInterval(function() {
      Ngn.Favicon.index = (Ngn.Favicon.index + 1) % Ngn.Favicon.iconSequence.length;
      Ngn.Favicon.replaceLink(Ngn.Favicon.iconSequence[Ngn.Favicon.index], false);
    }, Ngn.Favicon.sequencePause);
  },

  stop: function() {
    clearTimeout(this.loopTimer);
    this.removeIconLinksIfExists();
    if (this.initIconUrl) {
      this.replaceLink(this.initIconUrl);
    }
  },

  // -- "PRIVATE" ---------------------------------------------------------------

  loopTimer: null,

  preloadIcons: function(iconSequence) {
    var dummyImageForPreloading = document.createElement("img");
    for (var i = 0; i < iconSequence.length; i++) {
      dummyImageForPreloading.src = iconSequence[i];
    }
  },

  replaceLink: function(iconURL) {
    var link = document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = iconURL;
    this.removeIconLinksIfExists();
    this.docHead.appendChild(link);
  },

  removeIconLinksIfExists: function() {
    var links = this.getAllLinks();
    for (var i = 0; i < links.length; i++) {
      this.docHead.removeChild(links[i]);
    }
  },

  getAllLinks: function() {
    var r = [];
    var esLink = this.docHead.getElementsByTagName("link");
    var n = 0;
    for (var i = 0; i < esLink.length; i++) {
      if (esLink[i].type == "image/x-icon"/* && esLink[i].rel == "shortcut icon"*/) {
        r[n] = esLink[i];
      }
    }
    return r;
  },

  docHead: document.getElementsByTagName("head")[0]
}
/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/Ngn.sd.BcreatorBars.js|--*/
Ngn.sd.BcreatorBars = new Class({
  Extends: Ngn.sd.Bars,
  getLayersBar: function() {
    return new Ngn.sd.BcreatorLayersBar;
  }
});

/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/Ngn.sd.BcreatorLayersBar.js|--*/
Ngn.sd.BcreatorLayersBar = new Class({
  Extends: Ngn.sd.LayersBar,
  getTitle: function(item) {
    if (item.data.type == 'animatedText') {

      return '<span class="ico">' + '<img src="/sd/img/font.png"></span>' + //
      '<span class="text">' + (item.data.font.text && item.data.font.text[0] ? item.data.font.text[0] : 'empty') + '</span>';
    }
    else if (item.data.type == 'animatedImage') {
      return '<span class="ico">' + //
      (item.data.images && item.data.images[0] ? ('<img src="' + item.data.images[0] + '">') : '') + //
      '</span>Image';
    }
    return this.parent(item);
  },
  canEdit: function(item) {
    if (item.data.type == 'animatedText' || item.data.type == 'animatedImage') {
      return true;
    } else {
      return this.parent(item);
    }
  }
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.El.Color.js|--*/
Ngn.Form.El.Color = new Class({
  Extends: Ngn.Form.El,

  init: function() {
    var el = this.eRow;
    var eColor = el.getElement('div.color');
    var eInput = el.getElement('input').addClass('hexInput');
    eInput.addEvent('change', function() {
      eColor.setStyle('background-color', eInput.value);
    });
    new Ngn.Rainbow(eInput, {
      eParent: eInput.getParent(),
      id: 'rainbow_' + eInput.get('name'),
      //styles: { // и так работает
      //  'z-index': this.options.dialog.dialog.getStyle('z-index').toInt() + 1
      //},
      imgPath: '/i/img/rainbow/small/',
      wheel: true,
      startColor: eInput.value ? new Color(eInput.value).rgb : [255, 255, 255],
      onChange: function(color) {
        eColor.setStyle('background-color', color.hex);
        eInput.value = color.hex;
        eInput.fireEvent('change', color);
      },
      onComplete: function(color) {
        eColor.setStyle('background-color', color.hex);
        eInput.value = color.hex;
        eInput.fireEvent('change', color);
      }
    });
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/Ngn.Rainbow.js|--*/
Ngn.Rainbows = [];

Ngn.Rainbow = new Class({
  options: {
    id: 'rainbow',
    styles: {},
    prefix: 'moor-',
    imgPath: 'images/',
    startColor: [255, 0, 0],
    wheel: false,
    onComplete: Function.from(),
    onChange: Function.from(),
    eParent: null
  },

  initialize: function(el, options) {
    this.element = $(el);
    if (!this.element) return;
    this.setOptions(options);
    if (!this.options.eParent) this.options.eParent = document.body;
    this.sliderPos = 0;
    this.pickerPos = {x: 0, y: 0};
    this.backupColor = this.options.startColor;
    this.currentColor = this.options.startColor;
    this.sets = {
      rgb: [],
      hsb: [],
      hex: []
    };
    this.pickerClick = this.sliderClick = false;
    if (!this.layout) this.doLayout();
    this.OverlayEvents();
    this.sliderEvents();
    this.backupEvent();
    if (this.options.wheel) this.wheelEvents();
    this.element.addEvent('click', function(e) {
      this.closeAll().toggle(e);
    }.bind(this));

    this.layout.overlay.setStyle('background-color', this.options.startColor.rgbToHex());
    //this.layout.backup.setStyle('background-color', this.backupColor.rgbToHex());

    this.pickerPos.x = this.snippet('curPos').l + this.snippet('curSize', 'int').w;
    this.pickerPos.y = this.snippet('curPos').t + this.snippet('curSize', 'int').h;

    this.manualSet(this.options.startColor);

    this.pickerPos.x = this.snippet('curPos').l + this.snippet('curSize', 'int').w;
    this.pickerPos.y = this.snippet('curPos').t + this.snippet('curSize', 'int').h;
    this.sliderPos = this.snippet('arrPos') - this.snippet('arrSize', 'int');

    if (window.khtml) this.hide();
  },

  toggle: function() {
    this[this.visible ? 'hide' : 'show']();
  },

  show: function() {
    this.rePosition();
    (function() {
      this.layout.setStyle('display', 'block');
    }).delay(100, this);
    this.visible = true;
  },

  hide: function() {
    this.layout.setStyles({'display': 'none'});
    this.visible = false;
  },

  closeAll: function() {
    Ngn.Rainbows.each(function(obj) {
      obj.hide();
    });

    return this;
  },

  manualSet: function(color, type) {
    if (!type || (type != 'hsb' && type != 'hex')) type = 'rgb';
    var rgb, hsb, hex;

    if (type == 'rgb') {
      rgb = color;
      hsb = color.rgbToHsb();
      hex = color.rgbToHex();
    } else if (type == 'hsb') {
      hsb = color;
      rgb = color.hsbToRgb();
      hex = rgb.rgbToHex();
    } else {
      hex = color;
      rgb = color.hexToRgb(true);
      hsb = rgb.rgbToHsb();
    }

    this.setRainbow(rgb);
    this.autoSet(hsb);
  },

  autoSet: function(hsb) {
    var curH = this.snippet('curSize', 'int').h;
    var curW = this.snippet('curSize', 'int').w;
    var oveH = this.layout.overlay.height;
    var oveW = this.layout.overlay.width;
    var sliH = this.layout.slider.height;
    var arwH = this.snippet('arrSize', 'int');
    var hue;

    var posx = Math.round(((oveW * hsb[1]) / 100) - curW);
    var posy = Math.round(-((oveH * hsb[2]) / 100) + oveH - curH);

    var c = Math.round(((sliH * hsb[0]) / 360));
    c = (c == 360) ? 0 : c;
    var position = sliH - c + this.snippet('slider') - arwH;
    hue = [this.sets.hsb[0], 100, 100].hsbToRgb().rgbToHex();

    this.layout.cursor.setStyles({'top': posy, 'left': posx});
    this.layout.arrows.setStyle('top', position);
    this.layout.overlay.setStyle('background-color', hue);
    this.sliderPos = this.snippet('arrPos') - arwH;
    this.pickerPos.x = this.snippet('curPos').l + curW;
    this.pickerPos.y = this.snippet('curPos').t + curH;
  },

  setRainbow: function(color, type) {
    if (!type || (type != 'hsb' && type != 'hex')) type = 'rgb';
    var rgb, hsb, hex;

    if (type == 'rgb') {
      rgb = color;
      hsb = color.rgbToHsb();
      hex = color.rgbToHex();
    } else if (type == 'hsb') {
      hsb = color;
      rgb = color.hsbToRgb();
      hex = rgb.rgbToHex();
    } else {
      hex = color;
      rgb = color.hexToRgb();
      hsb = rgb.rgbToHsb();
    }
    this.sets = {
      rgb: rgb,
      hsb: hsb,
      hex: hex
    };
    if (this.pickerPos.x == null) this.autoSet(hsb);
    this.RedInput.value = rgb[0];
    this.GreenInput.value = rgb[1];
    this.BlueInput.value = rgb[2];
    this.HueInput.value = hsb[0];
    this.SatuInput.value = hsb[1];
    this.BrighInput.value = hsb[2];
    //this.hexInput.value = hex;
    this.currentColor = rgb;
    //this.chooseColor.setStyle('background-color', rgb.rgbToHex());
  },

  parseColors: function(x, y, z) {
    var s = Math.round((x * 100) / this.layout.overlay.width);
    var b = 100 - Math.round((y * 100) / this.layout.overlay.height);
    var h = 360 - Math.round((z * 360) / this.layout.slider.height) + this.snippet('slider') - this.snippet('arrSize', 'int');
    h -= this.snippet('arrSize', 'int');
    h = (h >= 360) ? 0 : (h < 0) ? 0 : h;
    s = (s > 100) ? 100 : (s < 0) ? 0 : s;
    b = (b > 100) ? 100 : (b < 0) ? 0 : b;

    return [h, s, b];
  },

  OverlayEvents: function() {
    var lim, curH, curW, inputs;
    curH = this.snippet('curSize', 'int').h;
    curW = this.snippet('curSize', 'int').w;
    //inputs = Array.from(this.arrRGB).concat(this.arrHSB, this.hexInput);
    document.addEvent('click', function() {
      this.hide(this.layout);
    }.bind(this));
    /*
    inputs.each(function(el) {
      el.addEvent('keydown', this.eventKeydown.bindWithEvent(this, el));
      el.addEvent('keyup', this.eventKeyup.bindWithEvent(this, el));
    }, this);
    */
    [this.element, this.layout].each(function(el) {
      el.addEvents({
        'click': function(e) {
          e.preventDefault();
        },
        'keyup': function(e) {
          if (e.key == 'esc' && this.visible) this.hide(this.layout);
        }.bind(this)
      }, this);
    }, this);
    lim = {
      //x: [0 - curW, this.layout.overlay.width - curW],
      //y: [0 - curH, this.layout.overlay.height - curH]
      x: [0 - curW, 80 - curW],
      y: [0 - curH, 80 - curH]
    };
    this.layout.addEvent('click', function(e) {
      e.stop();
    });
    this.layout.drag = new Drag(this.layout.cursor, {
      limit: lim,
      onBeforeStart: this.overlayDrag.bind(this),
      onStart: this.overlayDrag.bind(this),
      onDrag: this.overlayDrag.bind(this),
      snap: 0
    });

    this.layout.overlay2.addEvent('mousedown', function(e) {
      this.layout.cursor.setStyles({
        'top': e.page.y - this.layout.overlay.getTop() - curH,
        'left': e.page.x - this.layout.overlay.getLeft() - curW
      });
      this.layout.drag.start(e);
    }.bind(this));

    /*
     this.layout.overlay2.addEvent('dblclick', function(){
     this.ok();
     }.bind(this));
     this.okButton.addEvent('click', function() {
     this.ok();
     }.bind(this));
     */


    this.transp.addEvent('click', function() {
      this.hide();
      this.fireEvent('onComplete', ['transparent', this]);
    }.bind(this));
  },

  ok: function() {
    if (this.currentColor == this.options.startColor) {
      this.hide();
      this.fireEvent('onComplete', [this.sets, this]);
    } else {
      this.backupColor = this.currentColor;
      //this.layout.backup.setStyle('background-color', this.backupColor.rgbToHex());
      this.hide();
      this.fireEvent('onComplete', [this.sets, this]);
    }
  },

  overlayDrag: function() {
    var curH = this.snippet('curSize', 'int').h;
    var curW = this.snippet('curSize', 'int').w;
    this.pickerPos.x = this.snippet('curPos').l + curW;
    this.pickerPos.y = this.snippet('curPos').t + curH;
    this.setRainbow(this.parseColors(this.pickerPos.x, this.pickerPos.y, this.sliderPos), 'hsb');
    this.fireEvent('onChange', [this.sets, this]);
  },

  sliderEvents: function() {
    var arwH = this.snippet('arrSize', 'int'), lim;
    lim = [0 + this.snippet('slider') - arwH, this.layout.slider.height - arwH + this.snippet('slider')];
    this.layout.sliderDrag = new Drag(this.layout.arrows, {
      limit: {y: lim},
      modifiers: {x: false},
      onBeforeStart: this.sliderDrag.bind(this),
      onStart: this.sliderDrag.bind(this),
      onDrag: this.sliderDrag.bind(this),
      snap: 0
    });

    this.layout.slider.addEvent('mousedown', function(e) {
      this.layout.arrows.setStyle('top', e.page.y - this.layout.slider.getTop() + this.snippet('slider') - arwH);
      this.layout.sliderDrag.start(e);
    }.bind(this));
  },

  sliderDrag: function() {
    var arwH = this.snippet('arrSize', 'int'), hue;

    this.sliderPos = this.snippet('arrPos') - arwH;
    this.setRainbow(this.parseColors(this.pickerPos.x, this.pickerPos.y, this.sliderPos), 'hsb');
    hue = [this.sets.hsb[0], 100, 100].hsbToRgb().rgbToHex();
    this.layout.overlay.setStyle('background-color', hue);
    this.fireEvent('onChange', [this.sets, this]);
  },

  backupEvent: function() {
    /*
    this.layout.backup.addEvent('click', function() {
      this.manualSet(this.backupColor);
      this.fireEvent('onChange', [this.sets, this]);
    }.bind(this));
    */
  },

  wheelEvents: function() {
    var arrColors = Object.append(Array.from(this.arrRGB), this.arrHSB);
    arrColors.each(function(el) {
      el.addEvents({
        'mousewheel': function() {
          this.eventKeys(el);
        }.bind(this),
        'keydown': function() {
          this.eventKeys(el);
        }.bind(this)
      });
    }, this);

    [this.layout.arrows, this.layout.slider].each(function(el) {
      el.addEvents({
        'mousewheel': function() {
          this.eventKeys([this.arrHSB[0], 'slider']);
        }.bind(this),
        'keydown': function() {
          this.eventKeys([this.arrHSB[0], 'slider']);
        }.bind(this)
      });
    }, this);
  },

  eventKeys: function(e, el, id) {
    var wheel, type;
    id = (!id) ? el.id : this.arrHSB[0];

    if (e.type == 'keydown') {
      if (e.key == 'up') wheel = 1; else if (e.key == 'down') wheel = -1; else return;
    } else if (e.type == Element.Events.mousewheel.base) wheel = (e.wheel > 0) ? 1 : -1;

    if (this.arrRGB.contains(el)) type = 'rgb'; else if (this.arrHSB.contains(el)) type = 'hsb'; else type = 'hsb';

    if (type == 'rgb') {
      var rgb = this.sets.rgb, hsb = this.sets.hsb, prefix = this.options.prefix, pass;
      var value = (el.value.toInt() || 0) + wheel;
      value = (value > 255) ? 255 : (value < 0) ? 0 : value;

      switch (el.className) {
        case prefix + 'rInput':
          pass = [value, rgb[1], rgb[2]];
          break;
        case prefix + 'gInput':
          pass = [rgb[0], value, rgb[2]];
          break;
        case prefix + 'bInput':
          pass = [rgb[0], rgb[1], value];
          break;
        default :
          pass = rgb;
      }
      this.manualSet(pass);
      this.fireEvent('onChange', [this.sets, this]);
    } else {
      var rgb = this.sets.rgb, hsb = this.sets.hsb, prefix = this.options.prefix, pass;
      var value = (el.value.toInt() || 0) + wheel;

      if (el.className.test(/(HueInput)/)) value = (value > 359) ? 0 : (value < 0) ? 0 : value; else value = (value > 100) ? 100 : (value < 0) ? 0 : value;

      switch (el.className) {
        case prefix + 'HueInput':
          pass = [value, hsb[1], hsb[2]];
          break;
        case prefix + 'SatuInput':
          pass = [hsb[0], value, hsb[2]];
          break;
        case prefix + 'BrighInput':
          pass = [hsb[0], hsb[1], value];
          break;
        default :
          pass = hsb;
      }

      this.manualSet(pass, 'hsb');
      this.fireEvent('onChange', [this.sets, this]);
    }
    e.stop();
  },

  eventKeydown: function(e, el) {
    var n = e.code, k = e.key;
    if ((!el.className.test(/hexInput/) && !(n >= 48 && n <= 57)) && (k != 'backspace' && k != 'tab' && k != 'delete' && k != 'left' && k != 'right'))
      e.stop();
  },

  eventKeyup: function(e, el) {
    var n = e.code, k = e.key, pass, prefix, chr = el.value.charAt(0);
    if (el.value == null) return;
    if (el.className.test(/hexInput/)) {
      if (chr != "#" && el.value.length != 6) return;
      if (chr == '#' && el.value.length != 7) return;
    } else {
      if (!(n >= 48 && n <= 57) && (!['backspace', 'tab', 'delete', 'left', 'right'].contains(k)) && el.value.length > 3) return;
    }

    prefix = this.options.prefix;

    if (el.className.test(/(rInput|gInput|bInput)/)) {
      if (el.value < 0 || el.value > 255) return;
      switch (el.className) {
        case prefix + 'rInput':
          pass = [el.value, this.sets.rgb[1], this.sets.rgb[2]];
          break;
        case prefix + 'gInput':
          pass = [this.sets.rgb[0], el.value, this.sets.rgb[2]];
          break;
        case prefix + 'bInput':
          pass = [this.sets.rgb[0], this.sets.rgb[1], el.value];
          break;
        default :
          pass = this.sets.rgb;
      }
      this.manualSet(pass);
      this.fireEvent('onChange', [this.sets, this]);
    } else if (!el.className.test(/hexInput/)) {
      if (el.className.test(/HueInput/) && el.value < 0 || el.value > 360) return; else if (el.className.test(/HueInput/) && el.value == 360) el.value = 0; else if (el.className.test(/(SatuInput|BrighInput)/) && el.value < 0 || el.value > 100) return;
      switch (el.className) {
        case prefix + 'HueInput':
          pass = [el.value, this.sets.hsb[1], this.sets.hsb[2]];
          break;
        case prefix + 'SatuInput':
          pass = [this.sets.hsb[0], el.value, this.sets.hsb[2]];
          break;
        case prefix + 'BrighInput':
          pass = [this.sets.hsb[0], this.sets.hsb[1], el.value];
          break;
        default :
          pass = this.sets.hsb;
      }
      this.manualSet(pass, 'hsb');
      this.fireEvent('onChange', [this.sets, this]);
    } else {
      pass = el.value.hexToRgb(true);
      if (isNaN(pass[0]) || isNaN(pass[1]) || isNaN(pass[2])) return;
      if (pass != null) {
        this.manualSet(pass);
        this.fireEvent('onChange', [this.sets, this]);
      }
    }
  },

  doLayout: function() {
    var id = this.options.id, prefix = this.options.prefix;
    var idPrefix = id + ' .' + prefix;

    this.layout = new Element('div', {
      'styles': Object.merge({ 'display': 'block', 'position': 'absolute', zIndex: 10}, this.options.styles),
      'id': id
    }).inject(this.options.eParent);

    Ngn.Rainbows.push(this);

    var box = new Element('div', {
      'styles': {'position': 'relative'},
      'class': prefix + 'box'
    }).inject(this.layout);

    var div = new Element('div', {
      'styles': {'position': 'absolute', 'overflow': 'hidden'},
      'class': prefix + 'overlayBox'
    }).inject(box);

    var ar = new Element('div', {
      'styles': {
        'position': 'absolute'
        //,'zIndex': 1
      },
      'class': prefix + 'arrows'
    }).inject(box);
    ar.width = ar.getStyle('width').toInt();
    ar.height = ar.getStyle('height').toInt();

    var ov = new Element('img', {
      'styles': {
        'background-color': '#fff',
        'position': 'relative'
        //,'zIndex': 2
      },
      'src': this.options.imgPath + 'moor_woverlay.png',
      'class': prefix + 'overlay'
    }).inject(div);

    var ov2 = new Element('img', {
      'styles': {'position': 'absolute', 'top': 0, 'left': 0/*, 'zIndex': 2*/},
      'src': this.options.imgPath + 'moor_boverlay.png',
      'class': prefix + 'overlay'
    }).inject(div);

    if (window.ie6) {
      div.setStyle('overflow', '');
      var src = ov.src;
      ov.src = this.options.imgPath + 'blank.gif';
      ov.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')";
      src = ov2.src;
      ov2.src = this.options.imgPath + 'blank.gif';
      ov2.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')";
    }
    ov.width = ov2.width = div.getStyle('width').toInt();
    ov.height = ov2.height = div.getStyle('height').toInt();

    var cr = new Element('div', {
      'styles': {'overflow': 'hidden', 'position': 'absolute'/*, 'zIndex': 2*/},
      'class': prefix + 'cursor'
    }).inject(div);
    cr.width = cr.getStyle('width').toInt();
    cr.height = cr.getStyle('height').toInt();

    var sl = new Element('img', {
      'styles': {'position': 'absolute'/*, 'z-index': 2, marginLeft: '1px'*/},
      'src': this.options.imgPath + 'moor_slider.png',
      'class': prefix + 'slider'
    }).inject(box);
    this.layout.slider = document.getElement('#' + idPrefix + 'slider');
    sl.width = sl.getStyle('width').toInt();
    sl.height = sl.getStyle('height').toInt();

    new Element('div', {
      'styles': {'position': 'absolute'},
      'class': prefix + 'colorBox'
    }).inject(box);

    /*
     new Element('div', {
      'styles': {
      //'zIndex': 2,
      'position': 'absolute'
      },
      'class': prefix + 'chooseColor'
    }).inject(box);

    this.layout.backup = new Element('div', {
      'styles': {
        //'zIndex': 2,
        'position': 'absolute', 'cursor': 'pointer'},
      'class': prefix + 'currentColor'
    }).inject(box);
    */

    var R = new Element('label').inject(box).setStyle('position', 'absolute');
    var G = R.clone().inject(box).addClass(prefix + 'gLabel').appendText('G: ');
    var B = R.clone().inject(box).addClass(prefix + 'bLabel').appendText('B: ');
    R.appendText('R: ').addClass(prefix + 'rLabel');

    var inputR = new Element('input');
    var inputG = inputR.clone().inject(G).addClass(prefix + 'gInput');
    var inputB = inputR.clone().inject(B).addClass(prefix + 'bInput');
    inputR.inject(R).addClass(prefix + 'rInput');

    var HU = new Element('label').inject(box).setStyle('position', 'absolute');
    var SA = HU.clone().inject(box).addClass(prefix + 'SatuLabel').appendText('S: ');
    var BR = HU.clone().inject(box).addClass(prefix + 'BrighLabel').appendText('B: ');
    HU.appendText('H: ').addClass(prefix + 'HueLabel');

    var inputHU = new Element('input');
    var inputSA = inputHU.clone().inject(SA).addClass(prefix + 'SatuInput');
    var inputBR = inputHU.clone().inject(BR).addClass(prefix + 'BrighInput');
    inputHU.inject(HU).addClass(prefix + 'HueInput');
    SA.appendText(' %');
    BR.appendText(' %');
    new Element('span', {'styles': {'position': 'absolute'}, 'class': prefix + 'ballino'}).set('html', " &deg;").inject(HU, 'after');

    //var hex = new Element('label').inject(box).setStyle('position', 'absolute').addClass(prefix + 'hexLabel').appendText('#hex: ').adopt(new Element('input').addClass(prefix + 'hexInput'));

    /*
    var ok = new Element('input', {
      'styles': {'position': 'absolute'},
      'type': 'button',
      'value': 'OK',
      'class': prefix + 'okButton'
    }).inject(box);
    */

    var transp = new Element('a', {'style': {'position': 'absolute'}, 'href': '#', 'class': prefix + 'transp'}).inject(box);

    this.rePosition();

    var overlays = $$('#' + idPrefix + 'overlay');
    this.layout.overlay = overlays[0];

    this.layout.overlay2 = overlays[1];
    this.layout.cursor = document.getElement('#' + idPrefix + 'cursor');
    this.layout.arrows = document.getElement('#' + idPrefix + 'arrows');
    this.chooseColor = document.getElement('#' + idPrefix + 'chooseColor');
    //this.layout.backup = document.getElement('#' + idPrefix + 'currentColor');
    this.RedInput = document.getElement('#' + idPrefix + 'rInput');
    this.GreenInput = document.getElement('#' + idPrefix + 'gInput');
    this.BlueInput = document.getElement('#' + idPrefix + 'bInput');
    this.HueInput = document.getElement('#' + idPrefix + 'HueInput');
    this.SatuInput = document.getElement('#' + idPrefix + 'SatuInput');
    this.BrighInput = document.getElement('#' + idPrefix + 'BrighInput');
    //this.hexInput = document.getElement('#' + idPrefix + 'hexInput');

    this.arrRGB = [this.RedInput, this.GreenInput, this.BlueInput];
    this.arrHSB = [this.HueInput, this.SatuInput, this.BrighInput];
    //this.okButton = document.getElement('#' + idPrefix + 'okButton');
    this.transp = box.getElement('.' + prefix + 'transp');

    if (!window.khtml) this.hide();
  },
  rePosition: function() {
    return;
    var coords = this.element.getCoordinates();
    this.layout.setStyles({
      'left': coords.left,
      'top': coords.top + coords.height + 1
    });
  },

  snippet: function(mode, type) {
    var size;
    type = (type) ? type : 'none';
    switch (mode) {
      case 'arrPos':
        var t = this.layout.arrows.getStyle('top').toInt();
        size = t;
        break;
      case 'arrSize':
        var h = this.layout.arrows.height;
        h = (type == 'int') ? (h / 2).toInt() : h;
        size = h;
        break;
      case 'curPos':
        var l = this.layout.cursor.getStyle('left').toInt();
        var t = this.layout.cursor.getStyle('top').toInt();
        size = {'l': l, 't': t};
        break;
      case 'slider':
        var t = this.layout.slider.getStyle('marginTop').toInt();
        size = t;
        break;
      default :
        var h = this.layout.cursor.height;
        var w = this.layout.cursor.width;
        h = (type == 'int') ? (h / 2).toInt() : h;
        w = (type == 'int') ? (w / 2).toInt() : w;
        size = {w: w, h: h};
    }
    ;
    return size;
  }
});

Ngn.Rainbow.implement(new Options);
Ngn.Rainbow.implement(new Events);

/*--|/home/user/ngn-env/ngn/more/scripts/js/locale/core.php|--*/
Locale.define('en-US', 'Core', {"keepEmptyIfNotChanges":"Keep empty if you don't wish to change your password","add":"Add","clean":"Clean","delete":"Delete","uploading":"Uploading","uploadComplete":"Upload complete","change":"Change"});

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.FieldSet.js|--*/
// @requiresBefore s2/js/locale/core
/**
 *
 * <div id="mainElement">
 *   <div class="rowElement">
 *     <input type="" name="k[0]" value="gg" size="40" id="k[0]i" />
 *     <input type="" name="v[0]" value="gggg" size="40" id="v[0]i" />
 *     <div class="drag"></div>
 *     <a href="#" class="smIcons delete bordered"><i></i></a>
 *     <div class="clear"><!-- --></div>
 *   </div>
 *   <div class="element">
 *     ...
 *   </div>
 *   <a href="#" class="add">Add</a>
 * </div>
 *
 */
Ngn.FieldSet = new Class({
  Implements: [Options, Events],

  options: {
    fields: [],
    data: [],
    rowElementSelector: 'div[class~=rowElement]',
    elementContainerSelector: '.element',
    cleanOnCloneSelector: '.type_image .iconsSet',
    addRowBtnSelector: 'a[class~=add]',
    deleteBtnSelector: 'a[class~=delete]',
    dragBoxSelector: 'div[class=dragBox]',
    removeExceptFirstRow: 'p.label',
    moveElementToRowStyles: ['border-bottom', 'padding-left'],
    addTitle: Locale.get('Core.add'),
    cleanupTitle: Locale.get('Core.clean'),
    deleteTitle: Locale.get('Core.delete'),
    addRowNumber: false
  },

  changed: false,
  eSampleRow: null,
  buttons: [], // array of Ngn.Btn objects


  initialize: function(eParent, options) {
    this.eParent = eParent;
    this.setOptions(options);
    this.eContainer = this.getContainer();
    this.eAddRow = this.eContainer.getElement(this.options.addRowBtnSelector);
    if (!this.eAddRow) {
      var eBottomBtns = new Element('div', {'class': 'bottomBtns'}).inject(this.eContainer, 'bottom');
      this.eAddRow = Ngn.Btn.btn1(this.options.addTitle, 'btn add dgray').inject(eBottomBtns);
      Elements.from('<div class="heightFix"></div>')[0].inject(this.eContainer, 'bottom');
    }
    this.buttons.push(new Ngn.Btn(this.eAddRow, function(btn) {
      this.buttons.push(btn);
      this.addRow();
    }.bind(this)));
    this.initRows();
    //this.initSorting();
    this.checkDeleteButtons();
  },

  toggleDisabled: function(flag) {
    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].toggleDisabled(flag);
    }
  },

  getContainer: function() {
    var eContainer = Elements.from('<div class="fieldSet"></div>')[0];
    if (!this.options.data) this.options.data = [false];
    var n = this.options.data.length;
    var eRowProto = Elements.from('<div class="rowElement"><div class="drag"></div><div class="clear"><!-- --></div></div>')[0];
    for (var j = 0; j < n; j++) {
      var eRow = eRowProto.clone();
      eRow.store('n', j + 1);
      for (var i = 0; i < this.options.fields.length; i++) {
        var el = new Element('div', {'class': 'element'});
        new Element('input', {
          name: this.options.fields[i].name + '[' + j + ']',
          value: this.options.data[j] ? this.options.data[j].name : ''
        }).inject(el);
        el.inject(eRow, 'top');
      }
      eRow.inject(eContainer);
    }
    return eContainer.inject(this.eParent);
  },

  /*
   inputsEmpty: function(container) {
   var elements = container.getElements('input')
   for (var i = 0; i < elements.length; i++) {
   if (elements[i].get('value')) return false;
   }
   return true;
   },
   */

  initRows: function() {
    if (!this.options.rowElementSelector) {
      this.eContainer.getElements('input').each(function(eInput) {
        var eRowDiv = new Element('div', {'class': 'genRow'})
        eRowDiv.inject(eInput, 'after');
        eInput.inject(eRowDiv);
      });
      this.options.rowElementSelector = 'div[class=genRow]';
    }
    // Переносим стили элементов в стили контейнеров элементов, а у элементов их удаляем
    this.esRows = this.eContainer.getElements(this.options.rowElementSelector);
    for (var i = 0; i < this.esRows.length; i++) {
      new Element('div', {'class': 'rowBtns smIcons'}).inject(this.esRows[i]); // контейнер для кнопок
    }
    this.eSampleRow = this.esRows[0].clone();
    this.eSampleRow.getElements(this.options.cleanOnCloneSelector).dispose();
    if (!this.esRows[0].getElement('input[type=file]')) {
      this.createCleanupButton(this.esRows[0]);
    }
    this.removeTrash(this.eSampleRow);
    for (var i = 0; i < this.esRows.length; i++) {
      if (this.options.addRowNumber) this.addRowNumber(this.esRows[i]);
      this.moveStyles(this.esRows[i]);
    }
    if (this.esRows.length > 0) {
      for (var i = 1; i < this.esRows.length; i++) {
        this.removeTrash(this.esRows[i]);
        this.createDeleteButton(this.esRows[i], i);
      }
    }
  },

  firstIndex: function(name) {
    return name.replace(/[^[]+\[(\d)+\].*/, '$1').toInt();
  },

  addRowNumber: function(eRow) {
    var index = this.firstIndex(eRow.getElement(Ngn.Frm.selector).get('name'));
    new Element('span', {
      html: index + ' — ',
      'class': 'rowNumber'
    }).inject(eRow.getElement('.field-wrapper'), 'top');
  },

  moveStyles: function(eRow) {
    //var style;
    //esEls = eRow.getElements(this.options.elementContainerSelector);
    //for (var j = 0; j < this.options.moveElementToRowStyles.length; j++) {
    //  style = this.options.moveElementToRowStyles[j];
    //  eRow.setStyles(esEls[0].getStyles(style));
    //  for (var k = 0; k < esEls.length; k++)
    //    esEls[k].setStyle(style, '0');
    //}
  },

  checkDeleteButtons: function() {
    return;
    // Удаляем кнопку "Удалить", если элемент 1 в списке и значения полей пустые
    if (this.eRows.length == 1) {
      var eRow = this.eContainer.getElement(this.options.rowElementSelector);
    }
  },

  removeTrash: function(eRow) {
    eRow.getElements(this.options.removeExceptFirstRow).each(function(el) {
      el.dispose();
    });
  },

  createRowButton: function(eRow, btn, action, options) {
    var els = eRow.getElements(this.options.elementContainerSelector);
    var fieldSet = this;
    var eRowBtns = eRow.getElement('.rowBtns');
    this.buttons.push(new Ngn.Btn(// Вставляем кнопку после последнего элемента формы в этой строке
      // Ngn.addTips(Ngn.Btn.btn(btn)).inject(els[els.length - 1], 'after'), function() {
      // Ngn.Btn.btn(btn).inject(els[els.length - 1], 'after'), function() {
      Ngn.Btn.btn(btn).inject(eRowBtns), function() {
        fieldSet.fireEvent(btn.cls);
        action.bind(this)();
      }, options || {}));
  },

  createDeleteButton: function(eRow, index) {
    var fieldSet = this;
    this.createRowButton(eRow, {
      caption: this.options.deleteTitle,
      cls: 'delete'
    }, function() {
      eRow.dispose();
      fieldSet.regenInputNames();
      fieldSet.buttons.erase(this);
    });
  },

  createCleanupButton: function(eRow) {
    this.createRowButton(eRow, {
      caption: this.options.cleanupTitle,
      cls: 'cleanup'
    }, function() {
      eRow.getElements(Ngn.Frm.selector).set('value', '');
    });
  },

  addRow: function() {
    var eLastRow = this.eContainer.getLast(this.options.rowElementSelector);
    var eNewRow = this.eSampleRow.clone();
    var lastRowN = this.getN(eLastRow);
    var nextRowN = this.getNextN(eLastRow);
    var eLabel;
    var lastRowElements = eLastRow.getElements(Ngn.Frm.selector);
    eNewRow.getElements('.element').each(function(eElement, i) {
      eElement.set('class', eElement.get('class').replace(new RegExp('(.*)-0-(.*)'), '$1-' + nextRowN + '-$2'));
    });
    eNewRow.getElements(Ngn.Frm.selector).each(function(eInput, i) {
      Ngn.Frm.emptify(eInput);
      if (eInput.get('value')) eInput.set('value', '');
      if (eInput.get('checked')) eInput.set('checked', false);
      eInput.set('name', this.getInputName(eInput, nextRowN));
      eLabel = eInput.getNext('label');
      this.initInput(eInput);
    }.bind(this));
    eNewRow.inject(eLastRow, 'after');
    this.createDeleteButton(eNewRow);
    this.fireEvent('addRow');
    if (this.options.addRowNumber) this.addRowNumber(eNewRow, nextRowN);
    this.moveStyles(eNewRow);
    this.afterAddRow(eNewRow);
    // this.initSorting();
  },

  initInput: function(eInput) {
  },
  afterAddRow: function(eNewRow) {
  },

  getNextN: function(eRow) {
    return this.getN(eRow, 1);
  },

  getN: function(eRow, plus) {
    plus = plus || 0;
    var els = eRow.getElements(Ngn.Frm.selector);
    var name;
    for (var i = 0; i < els.length; i++) {
      name = els[i].get('name');
      if (name) break;
    }
    return this.firstIndex(name) + plus;
  },

  getInputName: function(eInput, n) {
    var name = eInput.get('name');
    if (!name) return;
    return name.replace(/([a-z0-9]+)\[([0-9]+)\](.*)/i, '$1[' + n + ']$3');
  },

  regenInputNames: function() {
    this.eContainer.getElements(this.options.rowElementSelector).each(function(eRow, n) {
      eRow.getElements(Ngn.Frm.selector).each(function(eInput) {
        eInput.set('name', this.getInputName(eInput, n));
      }.bind(this));
    }.bind(this));
  },

  initSorting: function() {
    var ST = new Sortables(this.eContainer, {
      handle: this.options.dragBoxSelector
    });
    ST.addEvent('start', function(el, clone) {
      el.addClass('move');
    });
    ST.addEvent('complete', function(el, clone) {
      el.removeClass('move');
    }.bind(this));
    this.eContainer.getElements(this.options.dragBoxSelector).each(function(el) {
      el.addEvent('mouseover', function() {
        el.addClass('over');
      });
      el.addEvent('mouseout', function() {
        el.removeClass('over');
      });
    });
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.FieldSet.Html.js|--*/
Ngn.FieldSet.Html = new Class({
  Extends: Ngn.FieldSet,

  getContainer: function() {
    return this.eContainerInit;
  },

  initialize: function(container, options) {
    this.eContainerInit = $(container);
    this.parent(this.eContainerInit.getParent(), options);
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.FieldSet.js|--*/
Ngn.Frm.fieldSets = [];

Ngn.Frm.FieldSet = new Class({
  Extends: Ngn.FieldSet.Html,
  form: null, // Ngn.Form

  initialize: function(form, container, options) {
    this.form = form;
    Ngn.Frm.fieldSets.include(this);
    this.parent(container, options);
    this.initVirtualElement(this.eContainer);
  },

  initInput: function(eInput) {
    this.form.initActiveEl(eInput);
  },

  afterAddRow: function(eNewRow) {
    this.form.addElements(eNewRow);
  }

});

Ngn.Frm.FieldSet.implement(Ngn.Frm.virtualElement);
/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/Ngn.Frm.FieldSetBcreatorImages.js|--*/
Ngn.Frm.FieldSetBcreatorImages = new Class({
  Extends: Ngn.Frm.FieldSet,

  createDeleteButton: function(eRow, index) {
    var fieldSet = this;
    this.createRowButton(eRow, {
      caption: this.options.deleteTitle,
      cls: 'delete'
    }, function() {
      if (!confirm('Are you sure?')) return;
      Ngn.Request.Iface.loading(true);
      new Ngn.Request.JSON({
        url: fieldSet.options.deleteImageUrl.replace('{n}', index),
        onSuccess: function() {
          Ngn.Request.Iface.loading(false);
          eRow.dispose();
          fieldSet.regenInputNames();
          fieldSet.buttons.erase(this);
          Ngn.sd.blocks[Ngn.sd.openedPropDialog.options.blockId].reload();
        }
      }).send();
    });
  }

});
