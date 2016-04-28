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
    this.eOutsideContainer = new Element('div', { styles: {'display': 'none'}}).inject(this.eForm, 'after');
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
    this.uploadType = 'html5';
    this.eForm.getElements('input[type=file]').each(function(eInput) {
      var cls = eInput.get('multiple') ? 'multiUpload' : 'upload';
      var eInputValidator = new Element('input', {
        type: 'hidden'
        //name: eInput.get('name') + '_helper',
      }).inject(eInput, 'after');
      var fileSaved = eInput.getParent('.element').getElement('.fileSaved');
      if (!fileSaved) eInputValidator.addClass(eInput.hasClass('required') ? 'validate-' + cls + '-required' : 'validate-' + cls);
      if (eInput.get('data-file')) eInputValidator.set('value', 1);
      var name = eInput.get('name');
      var uploadOptions = {
        url: this.uploadOptions.url.replace('{fn}', name.replace(']', '').replace('[', '')),
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

  hasUploadsInProgress: function() {
    for (var i =0; i<this.uploads.length; i++) {
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
        if (r && r.form) {
          this.fireEvent('failed', r);
          return;
        }
        this.fireEvent('complete', r);
      }.bind(this)
    }).post(Ngn.Frm.toObj(this.eForm));
  },

  _submit: function() {
    //c('_submit');
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
        styles: { display: 'none' },
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

Form.Validator.addAllThese([
  ['should-be-changed', {
    errorMsg: 'значение этого поля должно быть изменено',
    test: function(element) {
      if (Ngn.Form.forms[element.getParent('form').get('id')].initValues[element.get('name')] == element.get('value'))
        return false; else
        return true;
    }
  }],
  ['validate-num-min', {
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
  }],
  ['validate-num-max', {
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
  }],
  ['validate-name', {
    errorMsg: 'должно содержать только латинские символы, тире, подчеркивание и не начинаться с цифры',
    test: function(element) {
      if (!element.value) return true;
      if (element.value.match(/^[a-z][a-z0-9-_]*$/i)) return true; else return false;
    }
  }],
  ['validate-fullName', {
    errorMsg: 'неправильный формат имени',
    test: function(element) {
      //return true;
      if (!element.value) return true;
      if (element.value.match(/^\S+\s+\S+\s+\S+.*$/i)) return true; else return false;
    }
  }],
  ['validate-domain', {
    errorMsg: 'неправильный формат',
    test: function(element) {
      if (!element.value) return true;
      if (element.value.match(/^[a-z][a-z0-9-.]*[a-z]$/i)) return true; else return false;
    }
  }],
  ['validate-phone', {
    errorMsg: 'неправильный формат',
    test: function(element) {
      if (!element.value) return true;
      element.value = element.value.trim();
      element.value = element.value.replace(/[\s\-\(\)]/g, '');
      element.value = element.value.replace(/^8(.*)/g, '+7$1');
      return /^\+\d{11}$/g.test(element.value);
    }
  }],
  ['validate-procent', {
    errorMsg: 'введите число от 0 до 100',
    test: function(element) {
      if (!element.value) return true;
      element.value = parseInt(element.value);
      return (element.value >= 0 && element.value <= 100);
    }
  }],
  ['validate-skype', {
    errorMsg: 'неправильный формат',
    test: function(element) {
      if (!element.value) return true;
      if (element.value.length > 32 || element.value.length < 6) return false;
      if (element.value.match(/^[a-z][a-z0-9._]*$/i)) return true; else return false;
    }
  }],
  ['required-wisiwig', {
    errorMsg: 'поле обязательно для заполнения',
    test: function(element) {
      return !!Ngn.clearParagraphs(tinyMCE.get(element.get('id')).getContent());
    }
  }],
  ['validate-request', {
    errorMsg: 'Дождитесь загрузки',
    test: function(element) {
      return element.get('value') == 'complete' ? true : false;
    }
  }],
  ['validate-upload-required', {
    errorMsg: 'Файл не выбран',
    test: function(element) {
      return element.get('value') ? true : false;
    }
  }],
  ['validate-multiUpload-required', {
    errorMsg: 'Файлы не выбраны',
    test: function(element) {
      return element.get('value') ? true : false;
    }
  }],
  ['maxFileSizeExceeded', {
    errorMsg: 'Превышен максимальный размер файла ' + Ngn.getReadableFileSizeString(Ngn.fileSizeMax),
    test: function() {
      return false;
    }
  }]
]);

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
        this.eCaption.set('html', 'Происходит загрузка');
      }.bind(this),
      onProgress: function(event) {
        var loaded = event.loaded, total = event.total;
        var proc = parseInt(loaded / total * 100, 10).limit(0, 100);
        if (!proc) return;
        this.eProgress.setStyle('width', proc + '%');
        if (proc == 100) this.eCaption.set('html', 'Загрузка завершена');
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
/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.VisibilityCondition.js|--*/
Ngn.Frm.VisibilityCondition = new Class({

  initialize: function(eForm, sectionName, condFieldName, cond) {
    this.sectionName = sectionName;
    this.initSectionSelector();
    this.eSection = eForm.getElement(this.sectionSelector);
    if (!this.eSection) {
      console.debug('Element "' + this.sectionSelector + '" does not exists');
      return;
    }
    /*
     this.fx = new Fx.Slide(this.eSection, {
     duration: 200,
     transition: Fx.Transitions.Pow.easeOut
     });
     this.fx.hide();
     */
    var toggleSection = function(v, isFx) {
      // v необходима для использования в условии $d['cond']
      var flag = (eval(cond));
      if (!flag) {
        // Если скрываем секцию, необходимо снять все required css-классы в её полях
        this.eSection.getElements('.required').each(function(el) {
          el.removeClass('required');
          el.addClass('required-disabled');
        });
      } else {
        this.eSection.getElements('.required-disabled').each(function(el) {
          el.removeClass('required-disabled');
          el.addClass('required');
        });
      }
      if (isFx && 0) {
        // если нужно завернуть не развёрнутую до конца секцию,
        // нужно просто скрыть её
        if (flag == this.fx.open)
          flag ? (function() {
            this.fx.show();
          }).delay(200, this) : (function() {
            this.fx.hide();
          }).delay(200, this); else
          flag ? this.fx.slideIn() : this.fx.slideOut();
      } else {
        this.eSection.setStyle('display', flag ? 'block' : 'none');
        this.eSection.getElements(Ngn.Frm.selector).each(function(el) {
          el.set('disabled', !flag);
        });
      }
    }.bind(this);
    toggleSection(Ngn.Frm.getValueByName(condFieldName), false);
    Ngn.Frm.addEvent('change', condFieldName, toggleSection, true);
    Ngn.Frm.addEvent('focus', condFieldName, toggleSection, true);
  }

});

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

/*--|/home/user/ngn-env/ngn/more/scripts/js/common/tpl.php| (with request data)--*/
Ngn.toObj('Ngn.tpls.fontSelect', '<div class="selectItems">\n    <div class="item" data-name="Aero_Matics_Stencil_Regular">\n    Aero_Matics_Stencil_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Ancient_Kyiv">\n    Ancient_Kyiv    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Archive">\n    Archive    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Attentica_4f_Ultralight">\n    Attentica_4f_Ultralight    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Avdira">\n    Avdira    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azamat">\n    Azamat    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans">\n    Azoft_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Bold">\n    Azoft_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Bold_Italic">\n    Azoft_Sans_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Italic">\n    Azoft_Sans_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bad_Script">\n    Bad_Script    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bardelin">\n    Bardelin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Barkentina">\n    Barkentina    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender">\n    Bender    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Black">\n    Bender_Black    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Black_Italic">\n    Bender_Black_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Bold">\n    Bender_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Bold_Italic">\n    Bender_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Italic">\n    Bender_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Light">\n    Bender_Light    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Light_Italic">\n    Bender_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Boblic">\n    Boblic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bombarda">\n    Bombarda    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Boom_Boom">\n    Boom_Boom    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bradobrei">\n    Bradobrei    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brava_Novella">\n    Brava_Novella    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brava_Novella_Italic">\n    Brava_Novella_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brush">\n    Brush    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Regular">\n    Corki_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Rounded">\n    Corki_Rounded    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Tuscan">\n    Corki_Tuscan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Tuscan_Rounded">\n    Corki_Tuscan_Rounded    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Danger">\n    Danger    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Days">\n    Days    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Decolz">\n    Decolz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Decree_Art_Two">\n    Decree_Art_Two    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Derby">\n    Derby    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Deuz_Ex">\n    Deuz_Ex    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Don_Quixote">\n    Don_Quixote    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Droid_Sans">\n    Droid_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Droid_Sans_Bold">\n    Droid_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="FatC">\n    FatC    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Font_Awesome">\n    Font_Awesome    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Free_Font_Pro">\n    Free_Font_Pro    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat">\n    Fregat    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Bold">\n    Fregat_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Bold_Italic">\n    Fregat_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Italic">\n    Fregat_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Glidesketch">\n    Glidesketch    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Gogol">\n    Gogol    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Graublau_Web">\n    Graublau_Web    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Graublau_Web_Bold">\n    Graublau_Web_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hagin_Caps_Medium">\n    Hagin_Caps_Medium    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hagin_Caps_Thin">\n    Hagin_Caps_Thin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hattori_Hanzo">\n    Hattori_Hanzo    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hattori_Hanzo_Italic">\n    Hattori_Hanzo_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Helgoland">\n    Helgoland    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Intruder">\n    Intruder    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Bold">\n    Iwona_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Bold_Italic">\n    Iwona_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Bold">\n    Iwona_Condensed_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Bold_Italic">\n    Iwona_Condensed_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Heavy_Italic">\n    Iwona_Condensed_Heavy_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Heavy_Regular">\n    Iwona_Condensed_Heavy_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Italic">\n    Iwona_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Light_Italic">\n    Iwona_Condensed_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Light_Regular">\n    Iwona_Condensed_Light_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Medium_Regular">\n    Iwona_Condensed_Medium_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Regular">\n    Iwona_Condensed_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condesed_Medium_Italic">\n    Iwona_Condesed_Medium_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Heavy_Italic">\n    Iwona_Heavy_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Heavy_Regular">\n    Iwona_Heavy_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Italic">\n    Iwona_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Light_Italic">\n    Iwona_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Light_Regular">\n    Iwona_Light_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Medium_Italic">\n    Iwona_Medium_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Medium_Regular">\n    Iwona_Medium_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Regular">\n    Iwona_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="John_Daniels">\n    John_Daniels    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Juan">\n    Juan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Bold_RU">\n    Kelson_Sans_Bold_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Light_RU">\n    Kelson_Sans_Light_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Regular_RU">\n    Kelson_Sans_Regular_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kotyhoroshko_Bold">\n    Kotyhoroshko_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kotyhoroshko_Regular">\n    Kotyhoroshko_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lloyd">\n    Lloyd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lobster">\n    Lobster    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Audrey_BG">\n    Lovely_Audrey_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Grace_BG">\n    Lovely_Grace_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Sofia_BG">\n    Lovely_Sofia_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Condensed">\n    Lytiga_Pro_Condensed    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Condensed_Italic">\n    Lytiga_Pro_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Extended">\n    Lytiga_Pro_Extended    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Extended_Italic">\n    Lytiga_Pro_Extended_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Italic">\n    Lytiga_Pro_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Regular">\n    Lytiga_Pro_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="MS_Reshetka">\n    MS_Reshetka    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Bold">\n    Marta_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Italic">\n    Marta_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Regular">\n    Marta_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Mikodacs">\n    Mikodacs    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Mikodacs_PCS">\n    Mikodacs_PCS    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Multima_Bold">\n    Multima_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Museo_Sans_500">\n    Museo_Sans_500    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Neonic">\n    Neonic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nikodecs">\n    Nikodecs    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG">\n    Nioki_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG_Bold">\n    Nioki_BG_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG_Italic">\n    Nioki_BG_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Now_Grotesk">\n    Now_Grotesk    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Bold">\n    Old_Standard_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Italic">\n    Old_Standard_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Regular">\n    Old_Standard_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Oranienbaum">\n    Oranienbaum    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus">\n    Orpheus    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus_Bold">\n    Orpheus_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus_Italic">\n    Orpheus_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Bold">\n    Palemonas_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Bold_Italic">\n    Palemonas_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Italic">\n    Palemonas_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Regular">\n    Palemonas_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Perforama">\n    Perforama    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Perforama_Italic">\n    Perforama_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pharmadin">\n    Pharmadin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Philosopher">\n    Philosopher    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Bold">\n    Pixar_One_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Display">\n    Pixar_One_Display    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Regular">\n    Pixar_One_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Bold">\n    Pixar_Two_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Display">\n    Pixar_Two_Display    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Regular">\n    Pixar_Two_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans">\n    Resavska_BG_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Bold">\n    Resavska_BG_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Bold_Italic">\n    Resavska_BG_Sans_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Italic">\n    Resavska_BG_Sans_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Retropecan">\n    Retropecan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Black">\n    SkolaSans-Black    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-BlackItalic">\n    SkolaSans-BlackItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Bold">\n    SkolaSans-Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-BoldItalic">\n    SkolaSans-BoldItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Light">\n    SkolaSans-Light    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-LightItalic">\n    SkolaSans-LightItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Medium">\n    SkolaSans-Medium    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-MediumItalic">\n    SkolaSans-MediumItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Regular">\n    SkolaSans-Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-RegularItalic">\n    SkolaSans-RegularItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Skoropys_XVII">\n    Skoropys_XVII    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Sports_World_Regular">\n    Sports_World_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Stiff_Staff">\n    Stiff_Staff    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Sumkin">\n    Sumkin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus">\n    Supremus    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus_Condensed_Italic">\n    Supremus_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus_Italic">\n    Supremus_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Tot_Shrift_Bold">\n    Tot_Shrift_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Underdog">\n    Underdog    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Venus_Rising">\n    Venus_Rising    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Zion_Train_Pro_Stencil_Bold">\n    Zion_Train_Pro_Stencil_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Znikomit_No25">\n    Znikomit_No25    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arial">\n    arial    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arialbd">\n    arialbd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arialbi">\n    arialbi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="ariali">\n    ariali    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgia">\n    georgia    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiab">\n    georgiab    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiai">\n    georgiai    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiaz">\n    georgiaz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="impact">\n    impact    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="tahoma">\n    tahoma    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="tahomabd">\n    tahomabd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="times">\n    times    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesbd">\n    timesbd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesbi">\n    timesbi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesi">\n    timesi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdana">\n    verdana    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanab">\n    verdanab    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanai">\n    verdanai    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanaz">\n    verdanaz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="clear"></div>\n  <script>\n  </script>\n</div>');
/*--|/home/user/ngn-env/ngn/more/scripts/js/common/tpl.php| (with request data)--*/
Ngn.toObj('Ngn.tpls.svgSelect', '<div class="selectItems">\n    <div class="item" data-name="@">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M185.86 77.0793c0,20.5844 -7.27683,38.1605 -21.8163,52.7284 -14.5466,14.5714 -32.0896,21.8529 -52.6327,21.8529 -14.2466,0 -26.4392,-5.07642 -36.5814,-15.2293 -10.1398,-10.1528 -15.2104,-22.3573 -15.2104,-36.6133 0,-14.2572 5.07642,-26.4628 15.234,-36.6145 10.1528,-10.1517 22.3632,-15.2304 36.6251,-15.2304 13.5698,0 25.3467,4.65712 35.3282,13.956 9.98394,9.30125 15.4466,20.7439 16.4009,34.329 2.24411,-6.16068 3.37207,-12.5387 3.37207,-19.1399 0,-15.28 -5.39532,-28.3207 -16.1741,-39.1243 -10.7835,-10.8072 -23.7935,-16.2131 -39.0346,-16.2131 -21.4821,0 -39.8424,7.65242 -55.0823,22.949 -15.247,15.2954 -22.864,33.7184 -22.864,55.2689 0,21.5565 7.61108,39.9806 22.8462,55.276 15.2293,15.2966 33.5719,22.9431 55.0363,22.9431 17.5655,0 33.4491,-5.5087 47.6425,-16.5356 1.64293,-1.58623 4.14925,-3.83861 7.52604,-6.74887 2.42246,-2.11301 4.67248,-3.17719 6.7536,-3.17719 2.68349,0 5.01972,1.02993 7.0099,3.0768 1.98899,2.04569 2.98349,4.3772 2.98349,6.98628 0,2.35277 -0.994496,4.66775 -2.98349,6.9284 -8.03865,8.97645 -18.5435,16.0761 -31.5038,21.299 -12.28,4.96894 -24.7278,7.45281 -37.3479,7.45281 -26.7971,0 -49.7047,-9.53275 -68.7194,-28.5983 -19.0206,-19.0667 -28.525,-42.0322 -28.525,-68.8954 0,-26.8656 9.4985,-49.8382 28.5085,-68.9025 19.0076,-19.0643 41.9058,-28.6053 68.6911,-28.6053 20.5608,0 38.1204,7.28864 52.6776,21.8577 14.5584,14.569 21.8399,32.1451 21.8399,52.7236zm-42.2011 22.7388l0 0c0,-8.94338 -3.17719,-16.6064 -9.52212,-22.9892 -6.34375,-6.378 -13.9666,-9.57291 -22.8569,-9.57291 -8.89613,0 -16.5202,3.19491 -22.864,9.57291 -6.34257,6.38273 -9.51622,14.0458 -9.51622,22.9892 0,9.03196 3.17365,16.7175 9.51622,23.0553 6.34375,6.33903 14.0127,9.50441 22.9951,9.50441 8.89023,0 16.4895,-3.189 22.7943,-9.57291 6.29769,-6.378 9.45362,-14.0399 9.45362,-22.9868z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="airplane">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M158.016 83.6227l-10.4245 -0.7441 -60.8024 -71.2021c-4.79649,-6.11816 -9.43236,-9.17842 -13.8922,-9.17842l-8.44022 0 38.5338 82.3306 -53.4642 3.96735 -20.888 -23.3695 -16.18 0 21.4183 32.757 -21.3864 35.9719 16.1612 0 20.8809 -23.3683 53.4583 3.97208 -38.5338 82.7404 8.44022 0c4.45988,0 9.09574,-3.06026 13.8922,-9.1796l60.8024 -71.201 10.4245 -0.7441c2.47561,-0.330711 4.75161,-0.622446 6.81974,-0.869298 2.06813,-0.246852 4.7587,-0.784258 8.06463,-1.61458 3.30711,-0.823235 6.57407,-2.56065 9.80205,-5.20516 3.2268,-2.64451 4.84256,-5.54296 4.84256,-8.68708 0,-9.25755 -9.84811,-14.7155 -29.529,-16.3761z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="alert">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M74.3864 72.4636l0 5.778 -54.8178 0 0 -5.778 54.8178 0zm-30.2932 -49.0445l0 0 39.9168 37.7483 -3.85397 3.84688 -39.6724 -37.994 3.60948 -3.60121zm39.9168 56.7453l0 0c0,-3.68625 0.878747,-6.44887 2.64097,-8.29731 1.7634,-1.8449 4.00751,-2.76853 6.73234,-2.76853l13.2261 -0.237403c3.84688,0.160631 6.41226,0.762998 7.69376,1.8012 1.28269,1.04528 1.92403,3.00711 1.92403,5.89257l18.7525 120.943 -69.9667 0 18.997 -117.334zm20.6765 -22.8439l0 0 -7.45636 0 0 -54.8225 7.45636 0 0 54.8225zm55.0611 -30.3002l0 0 -36.0641 37.994 -3.84688 -3.84688 36.0641 -37.7483 3.84688 3.60121zm20.6824 45.4433l0 0 0 5.778 -52.8996 0 0 -5.778 52.8996 0z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow1">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="2.49923,118.923 125.327,118.923 62.5529,181.695 115.81,181.695 197.502,100 115.81,18.3025 62.5529,18.3025 125.327,81.0786 2.49923,81.0786 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow10">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M100.15 113.08c-3.57523,-3.56932 -3.57523,-9.36503 0,-12.9367 3.5705,-3.56696 9.36267,-3.56696 12.9344,0l18.2423 18.2435 0 -25.8002c0,-5.0528 4.09137,-9.14417 9.1418,-9.14417 5.06106,0 9.15362,4.09137 9.15362,9.14417l0 25.8002 18.2423 -18.2435c3.57168,-3.5705 9.36622,-3.5705 12.9367,0 3.5705,3.57168 3.5705,9.36031 0,12.9367l-18.2021 18.1997 25.76 0.0448822c5.05161,0 9.14299,4.09137 9.14299,9.14653 0,5.05161 -4.09137,9.14653 -9.14299,9.14653l-25.7789 0 18.221 18.2446c3.5705,3.5705 3.5705,9.36149 0,12.932 -3.5705,3.57641 -9.36503,3.57641 -12.9367,0l-18.1986 -18.1974 -0.0437011 25.7565c0,5.05161 -4.09255,9.14653 -9.15362,9.14653 -5.05043,0 -9.1418,-4.09491 -9.1418,-9.14653l0 -25.8014 -18.2423 18.2423c-3.57168,3.57641 -9.36385,3.57641 -12.9344,0 -3.57523,-3.5705 -3.57523,-9.36149 0,-12.932l18.2399 -18.2446 -25.7978 0c-5.04925,0 -9.14535,-4.09491 -9.14535,-9.14653 0,-5.05516 4.0961,-9.14653 9.14535,-9.14653l25.7825 0 -18.2246 -18.2446z"/>\n  <path class="fil0" d="M89.9109 20.8289c0,-5.05043 -4.09491,-9.14535 -9.14653,-9.14535 -5.04925,0 -9.14653,4.09491 -9.14653,9.14535l0 37.8487 -53.5032 -53.4985c-3.5705,-3.57641 -9.36149,-3.57641 -12.932,0 -3.57641,3.56578 -3.57641,9.35795 0,12.9332l53.4784 53.5032 -37.8286 0c-5.05043,0 -9.14653,4.0961 -9.14653,9.14771 0,5.05043 4.0961,9.14535 9.14653,9.14535l59.906 -0.03189c2.33624,0 4.67838,-0.890558 6.47013,-2.6764 1.77167,-1.77994 2.66813,-4.10909 2.6764,-6.43706l0.0259845 -59.9343z"/>\n  <path class="fil0" d="M100.15 113.08c-3.57523,-3.56932 -3.57523,-9.36503 0,-12.9367 3.5705,-3.56696 9.36267,-3.56696 12.9344,0l18.2423 18.2435 0 -25.8002c0,-5.0528 4.09137,-9.14417 9.1418,-9.14417 5.06106,0 9.15362,4.09137 9.15362,9.14417l0 25.8002 18.2423 -18.2435c3.57168,-3.5705 9.36622,-3.5705 12.9367,0 3.5705,3.57168 3.5705,9.36031 0,12.9367l-18.2021 18.1997 25.76 0.0448822c5.05161,0 9.14299,4.09137 9.14299,9.14653 0,5.05161 -4.09137,9.14653 -9.14299,9.14653l-25.7789 0 18.221 18.2446c3.5705,3.5705 3.5705,9.36149 0,12.932 -3.5705,3.57641 -9.36503,3.57641 -12.9367,0l-18.1986 -18.1974 -0.0437011 25.7565c0,5.05161 -4.09255,9.14653 -9.15362,9.14653 -5.05043,0 -9.1418,-4.09491 -9.1418,-9.14653l0 -25.8014 -18.2423 18.2423c-3.57168,3.57641 -9.36385,3.57641 -12.9344,0 -3.57523,-3.5705 -3.57523,-9.36149 0,-12.932l18.2399 -18.2446 -25.7978 0c-5.04925,0 -9.14535,-4.09491 -9.14535,-9.14653 0,-5.05516 4.0961,-9.14653 9.14535,-9.14653l25.7825 0 -18.2246 -18.2446z"/>\n  <path class="fil0" d="M89.9109 20.8289c0,-5.05043 -4.09491,-9.14535 -9.14653,-9.14535 -5.04925,0 -9.14653,4.09491 -9.14653,9.14535l0 37.8487 -53.5032 -53.4985c-3.5705,-3.57641 -9.36149,-3.57641 -12.932,0 -3.57641,3.56578 -3.57641,9.35795 0,12.9332l53.4784 53.5032 -37.8286 0c-5.05043,0 -9.14653,4.0961 -9.14653,9.14771 0,5.05043 4.0961,9.14535 9.14653,9.14535l59.906 -0.03189c2.33624,0 4.67838,-0.890558 6.47013,-2.6764 1.77167,-1.77994 2.66813,-4.10909 2.6764,-6.43706l0.0259845 -59.9343z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.16696}\n    .str1 {stroke:#2B2A29;stroke-width:12.4997}\n    .fil0 {fill:none;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0 str0" d="M180.363 100.054c0.0519689,-2.04096 -0.668509,-4.10082 -2.15907,-5.70123"/>\n  <polyline class="fil0 str0" points="178.204,94.3531 178.212,94.3378 125.682,41.8066 125.637,41.8539 122.781,38.9956 "/>\n  <path class="fil0 str0" d="M122.781 38.9956c-0.204332,-0.25512 -0.413389,-0.503154 -0.646068,-0.738195 -3.15002,-3.14648 -8.25361,-3.14648 -11.3954,0 -3.0827,3.07798 -3.14294,8.01975 -0.197246,11.1816"/>\n  <polyline class="fil0 str0" points="110.543,49.439 110.528,49.4508 153.286,92.2094 149.378,92.2094 68.3344,92.2094 45.4669,92.2094 45.4669,92.2743 28.6738,92.2743 "/>\n  <path class="fil0 str0" d="M28.6738 92.2743c-0.314176,-0.0413389 -0.644887,-0.0649611 -0.976779,-0.0649611 -4.45043,0 -8.05754,3.6083 -8.05754,8.05872 0,4.3524 3.45003,7.89337 7.7729,8.04691"/>\n  <polyline class="fil0 str0" points="27.4124,108.315 27.4124,108.33 50.2787,108.33 131.314,108.33 152.744,108.33 114.28,146.791 114.325,146.837 111.467,149.696 "/>\n  <path class="fil0 str0" d="M111.467 149.696c-0.253939,0.198427 -0.503154,0.408665 -0.737014,0.643706 -3.14884,3.15002 -3.14884,8.25361 0,11.4036 3.07443,3.07325 8.02211,3.13467 11.178,0.193702"/>\n  <polyline class="fil0 str0" points="121.908,161.937 121.925,161.947 174.453,109.417 174.409,109.37 177.266,106.509 "/>\n  <path class="fil0 str0" d="M177.266 106.509c0.25512,-0.197246 0.503154,-0.408665 0.735833,-0.641344 1.60749,-1.60395 2.38939,-3.71342 2.36104,-5.81343"/>\n  <path class="fil0 str1" d="M2.50041 99.9976c0,-53.8504 43.6515,-97.5019 97.4972,-97.5019 53.8516,0 97.5043,43.6515 97.5043,97.5019 0,53.854 -43.6527,97.5043 -97.5043,97.5043 -53.8457,0 -97.4972,-43.6503 -97.4972,-97.5043"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow3">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M27.1963 163.713c24.8742,-24.5636 52.0622,-48.2543 60.6229,-52.8311 14.0387,-7.50478 24.5459,-5.40713 32.542,-5.16736l-6.13824 19.7576c-1.03465,4.1398 0,7.24848 2.58545,9.83866 3.62719,3.09924 9.84457,2.06222 13.4635,-1.0441l67.2301 -47.9035 -68.1738 -47.1618c-3.62011,-3.1075 -9.83275,-4.14334 -13.4517,-1.03702 -2.59372,2.59018 -3.62601,5.69532 -2.59372,9.83866l7.41502 19.1742c0,0 -27.1986,-0.963787 -45.3972,8.13668 -18.2045,9.09692 -72.8002,63.0489 -72.8002,63.0489l24.6959 25.3502z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow4">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M168.033 78.1731c-2.36222,1.69017 -5.07996,2.36931 -8.12369,1.35119l-16.2356 -5.41303 0 41.2893c0,14.8879 -12.5328,27.4112 -27.416,27.4112l-41.9649 0c-5.4154,0 -7.78234,2.36695 -7.78234,7.78353l0 49.4047 -37.2286 0 0 -67.0068c0,-14.8891 12.521,-27.4077 27.4183,-27.4077l41.9578 0c6.08981,0 7.78234,-1.6949 7.78234,-7.78353l0 -23.6907 -16.2415 5.41303c-3.04491,1.01812 -5.75438,0.338979 -8.12369,-1.35119 -3.38507,-2.70947 -3.38507,-7.78353 -1.01812,-11.1721l44 -67.0021 43.994 67.0021c2.36695,3.38861 2.36695,8.46267 -1.01812,11.1721z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow5">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M140.02 65.4631l4.03586 13.9596 -7.52486 0c-12.3556,0 -24.1762,6.98509 -29.5502,18.5328 -1.33702,2.95396 -2.13899,6.18194 -2.94451,9.39929 -0.811424,3.7642 -3.23152,6.98628 -7.52486,6.98628 -4.56145,0 -6.44651,-4.02405 -7.51541,-6.98628 -2.15199,-5.63745 -2.95396,-9.93433 -6.7158,-18.5281 -7.79297,-17.9954 -29.8136,-23.9057 -46.7413,-15.0415 -6.17603,3.22325 -12.0863,10.4776 -13.9714,13.6985 -1.87324,3.22325 -4.56027,4.83311 -8.5855,4.83311l-10.4812 0 0 26.053 13.9702 0c11.0068,0 19.871,-4.83193 25.7825,-12.893 0.800794,-1.07009 2.1508,-3.22443 2.68703,-4.29334 1.88269,-4.29925 4.03586,-5.10713 6.71226,-5.10713 2.68703,0 5.64217,1.07481 6.72289,5.10713 1.07009,3.49018 3.21262,14.5005 5.89965,19.6017 4.5709,8.59731 8.59613,13.4304 17.1946,17.7308 16.9241,8.32211 37.3302,1.60867 45.9287,-15.8458 1.61458,-3.23034 2.68585,-7.25439 3.22207,-11.0139 0.533862,-3.21971 2.15199,-4.83665 4.83901,-4.83665 2.68703,0 8.59613,0 8.59613,0l-4.03586 13.9655c-1.07127,2.68703 0,4.83901 1.61576,6.18312 1.60631,1.87797 4.29334,1.87797 7.79534,-0.54213l48.0712 -33.3003 -48.0712 -33.305c-3.502,-2.42246 -6.18903,-2.42246 -7.79534,-0.539768 -1.61576,1.34056 -2.68703,3.49137 -1.61576,6.18194z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow6">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M87.8062 30.1916c77.827,18.1064 96.7094,78.199 96.7094,108.159l0 59.1489 -38.4275 0 0 -59.1489c0,-2.2512 -2.45907,-55.3752 -68.6911,-70.7864l0.376775 17.4025c0,4.552 -1.13505,7.58746 -5.68587,8.72369 -3.03191,0.75473 -6.06737,-0.383861 -8.72487,-3.78783l-47.8775 -61.8973 73.451 -24.7159c3.79137,-1.51891 7.95951,-0.759455 9.85874,1.51773 1.89214,3.03309 2.27364,6.44178 0,9.85401l-10.9891 15.5304z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow7">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M147.7 52.0764l-26.3636 0 35.9341 36.0806 -58.6764 0 0 -72.1163 -23.8762 0 0 72.1163 -24.1384 0c-13.3572,0 -24.7242,4.63823 -34.1058,13.91 -9.31661,9.40519 -13.9737,20.7486 -13.9737,34.0408 0,13.291 4.64767,24.5671 13.9513,33.8424 9.36385,9.33551 20.712,14.0056 34.0455,14.0056 13.2639,0 24.6498,-4.66539 34.1459,-13.9962 4.74453,-4.73035 8.25833,-9.88 10.5343,-15.4525 2.27482,-5.57248 3.41696,-11.6942 3.41696,-18.3722l0 -24.1018 58.6764 0 -33.5896 35.842 29.588 0 44.2326 -47.7299 -49.8016 -48.0689zm-72.9821 84.0774l0 0c0,6.67801 -2.32088,12.3202 -6.96383,16.9253 -4.83665,4.67012 -10.5887,7.00045 -17.2572,7.00045 -6.73352,0 -12.4548,-2.33033 -17.1568,-7.00045 -4.64177,-4.60515 -6.96383,-10.2473 -6.96383,-16.9253 0,-6.61423 2.32207,-12.3214 6.96383,-17.1202 4.83547,-4.66539 10.5521,-7.00045 17.1568,-7.00045l24.2211 0 0 24.1207z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow8">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_265655072">\n   <polygon id="_265656344" class="fil0" points="197.502,93.4578 181.155,108.652 179.233,102.304 169.616,105.189 159.809,108.075 150.193,110.382 140.578,112.499 130.772,114.038 121.155,115.383 111.349,116.151 101.732,116.344 92.5023,116.151 83.2707,115.383 74.2305,114.42 64.9989,112.884 55.7697,110.96 46.7295,108.843 37.5003,106.345 28.2711,103.461 22.8829,105.189 2.50041,95.9594 13.845,93.6492 6.53863,83.6522 27.8825,93.4578 31.1554,100.96 39.807,103.652 48.6535,105.96 57.5001,107.882 66.3466,109.614 75.1931,111.151 84.0396,112.112 92.885,112.69 101.732,113.075 111.349,112.69 120.772,111.921 130.386,110.767 140.002,109.228 149.619,107.113 159.233,104.806 168.848,102.113 178.271,99.2287 175.963,91.7275 "/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow9">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M164.192 26.386c0.0566934,0.114568 1.90513,-1.70553 5.5465,-5.46028 9.26936,9.4985 16.2202,20.2336 20.8561,32.203 4.63232,11.9706 6.93667,24.1844 6.90714,36.6369 -0.0295278,12.4536 -2.40238,24.6522 -7.12092,36.5944 -4.72327,11.941 -11.8028,22.6325 -21.2411,32.0695 -9.49614,9.49732 -20.2596,16.6371 -32.288,21.4136 -12.0273,4.77523 -24.2931,7.16226 -36.8034,7.16226 -12.5103,0 -24.7797,-2.37285 -36.8082,-7.12092 -12.0284,-4.74571 -22.7907,-11.8973 -32.2845,-21.4549 -18.769,-18.7655 -28.251,-41.5114 -28.4518,-68.2375 -0.199608,-26.7262 8.91385,-49.6457 27.3404,-68.7537l-8.61621 -2.64333 22.0939 -5.79926 -3.92365 21.834 -3.41105 -8.44377c-17.745,17.7462 -26.588,38.985 -26.5313,63.7198 0.0578745,24.7372 8.87369,45.9204 26.4439,63.5485 17.5714,17.5714 38.9436,26.4734 64.1072,26.699 25.1636,0.226773 46.5878,-8.47211 64.2726,-26.1037 17.5702,-17.6848 26.3423,-38.9932 26.3116,-63.9288 -0.0295278,-24.938 -8.82763,-46.25 -26.399,-63.9348z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="atom">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M165.653 40.218c9.17251,1.44804 15.4489,5.13311 18.834,11.0552 3.38625,5.93036 3.43822,13.2107 0.15945,21.8517 -3.27877,8.63983 -9.11582,17.6163 -17.5088,26.927 8.32329,9.31307 14.1226,18.2883 17.4013,26.9293 3.27995,8.63983 3.22798,15.9237 -0.154726,21.8506 -3.46066,5.92564 -9.74063,9.6296 -18.8375,11.1107 -9.0981,1.47993 -19.7836,0.844495 -32.0566,-1.90631 -3.81027,11.993 -8.64101,21.5671 -14.4958,28.7258 -5.85595,7.1599 -12.2032,10.7375 -19.0454,10.7375 -6.84572,0 -13.1741,-3.57759 -18.9935,-10.7375 -5.81816,-7.15872 -10.6335,-16.6997 -14.4403,-28.6231 -12.2765,2.61498 -22.9809,3.17955 -32.1156,1.69608 -9.13472,-1.48111 -15.3934,-5.1839 -18.7797,-11.1107 -3.38625,-5.92327 -3.45593,-13.1883 -0.209057,-21.7962 3.24097,-8.60322 9.0981,-17.5631 17.5631,-26.8762 -8.46503,-9.3107 -14.3399,-18.2872 -17.6186,-26.927 -3.27995,-8.64101 -3.2268,-15.9214 0.158269,-21.8517 3.38625,-5.92209 9.66267,-9.60716 18.834,-11.0552 9.16897,-1.44686 19.8911,-0.863393 32.1676,1.74686 3.73704,-11.9186 8.52999,-21.4773 14.3848,-28.6738 5.85595,-7.19297 12.2032,-10.793 19.049,-10.793 6.84218,0 13.1895,3.58231 19.0454,10.741 5.85477,7.1599 10.6855,16.7009 14.4958,28.6195 12.2729,-2.54057 22.9915,-3.08743 32.1629,-1.64056zm-129.507 4.70791l0 0c-8.11306,0.989772 -13.5757,3.91775 -16.3974,8.78511 -2.89609,4.93941 -2.71892,11.1473 0.527957,18.6226 3.24097,7.4788 8.7792,15.3415 16.6112,23.5903 6.63194,-6.69808 14.1781,-13.1517 22.6407,-19.362 0.989772,-10.0135 2.7886,-19.7836 5.39768,-29.3057 -11.0753,-2.54057 -20.6683,-3.31538 -28.7801,-2.33033zm0.635438 59.254l0 0c-7.76108,8.25243 -13.245,16.1174 -16.4541,23.5939 -3.21144,7.47762 -3.37089,13.6513 -0.475988,18.5175 2.82049,4.93941 8.27132,7.88392 16.3501,8.8359 8.07526,0.953157 17.6494,0.121655 28.7246,-2.48978 -2.60908,-9.30716 -4.40791,-18.9687 -5.39768,-28.9916 -8.46267,-6.20202 -16.0466,-12.6934 -22.747,-19.4659zm4.23429 -4.12799l0 0c4.93232,5.01146 10.8922,10.0879 17.8785,15.2352 -0.4252,-4.6524 -0.635438,-9.76543 -0.635438,-15.3415 0,-2.53821 0.0330711,-5.02209 0.107481,-7.45872 0.0696856,-2.43309 0.177167,-4.88508 0.316538,-7.35478 -6.70045,4.8709 -12.5907,9.84338 -17.6671,14.9198zm41.1582 30.6841l0 0c5.85241,3.45593 11.8111,6.56108 17.882,9.31188 6.2032,-2.82168 12.1288,-5.92327 17.7745,-9.31188 6.27643,-3.66617 11.8808,-7.22958 16.8226,-10.6867 0.561028,-5.78154 0.844495,-12.4832 0.844495,-20.1037 0,-7.54612 -0.283467,-14.2111 -0.844495,-19.9986 -5.29256,-3.52089 -10.9336,-7.08431 -16.9289,-10.6843 -5.78627,-3.24215 -11.6765,-6.31068 -17.6682,-9.20558 -6.07091,2.8949 -11.9599,5.96343 -17.6718,9.20558 -6.42052,3.80909 -12.0627,7.40675 -16.9289,10.7918 -0.564571,5.64335 -0.845676,12.2729 -0.845676,19.8911 0,7.62053 0.281105,14.2855 0.845676,19.9974 4.44098,3.17601 10.0123,6.77604 16.7186,10.793zm-2.96459 -66.8675l0 0c4.09019,-2.46734 8.53235,-4.82957 13.3324,-7.09021 -7.47644,-3.17483 -14.8135,-5.81934 -22.0065,-7.93825 -1.90395,7.40675 -3.35199,15.1312 -4.33822,23.1734 3.87759,-2.68112 8.21581,-5.39414 13.0123,-8.14495zm13.3324 79.4581l0 0c-5.07996,-2.39648 -9.55874,-4.79413 -13.4363,-7.19297 -4.37602,-2.40002 -8.64338,-5.04453 -12.8056,-7.93471 0.845676,7.61817 2.22285,15.2706 4.12799,22.9584 6.91305,-1.8319 14.2832,-4.44216 22.114,-7.83077zm7.51423 -90.1483l0 0c10.0123,-4.37011 19.3253,-7.65006 27.9321,-9.83984 -3.24569,-10.9288 -7.31817,-19.6572 -12.2221,-26.1852 -4.90279,-6.52446 -10.1753,-9.78905 -15.8174,-9.78905 -5.64217,0 -10.9005,3.26459 -15.7667,9.78905 -4.86618,6.528 -8.9233,15.1856 -12.1655,25.975 9.0981,2.53939 18.4431,5.89375 28.0396,10.0501zm0 93.6409l0 0c-9.17251,4.1646 -18.4832,7.47998 -27.9357,9.94614 3.17483,10.9336 7.19533,19.6442 12.0615,26.1345 4.86618,6.49257 10.1245,9.73354 15.7667,9.73354 5.64217,0 10.9147,-3.24097 15.8174,-9.73354 4.90398,-6.49021 8.97645,-15.2009 12.2221,-26.1345 -9.38275,-2.39884 -18.6946,-5.71422 -27.9321,-9.94614zm20.9494 -10.6855l0 0c-5.15083,3.03428 -9.66622,5.43193 -13.5426,7.19297 7.75636,3.38861 15.1277,5.99887 22.1128,7.83077 1.69017,-6.55635 3.10278,-14.1781 4.23192,-22.8557 -4.02169,2.61026 -8.28904,5.22169 -12.8021,7.83195zm8.57015 -87.2936l0 0c-6.77249,1.90631 -14.1084,4.51539 -22.01,7.83077 5.22169,2.6823 9.6296,5.08114 13.2261,7.19769 4.79531,2.75081 9.13472,5.46382 13.0159,8.14495 -0.920086,-7.82841 -2.33033,-15.5517 -4.23192,-23.1734zm33.54 47.0838l0 0c7.82959,-8.24888 13.3489,-16.1115 16.5568,-23.5903 3.20908,-7.47526 3.40514,-13.6832 0.583469,-18.6226 -2.82049,-4.86736 -8.28904,-7.77644 -16.4009,-8.72842 -8.11187,-0.953157 -17.7049,-0.122836 -28.7778,2.48388 2.60671,9.10165 4.44216,18.8718 5.50162,29.3093 8.18156,5.92682 15.6922,12.3107 22.5368,19.1482zm0.688588 59.254l0 0c8.07408,-0.986228 13.5237,-3.9142 16.3442,-8.78393 2.82168,-4.86618 2.63034,-11.0351 -0.578745,-18.5127 -3.21144,-7.47644 -8.69534,-15.3781 -16.4541,-23.7014 -6.70399,6.77249 -14.2513,13.2261 -22.6431,19.3631 -1.06064,10.0867 -2.85947,19.7872 -5.39532,29.0943 11.0729,2.68112 20.647,3.53034 28.727,2.54057zm-13.1198 -47.3496l0 0c2.99884,-2.57364 5.76382,-5.165 8.30321,-7.77644 -4.79531,-4.72563 -10.6843,-9.76897 -17.6671,-15.1312 0.351971,5.64689 0.529138,10.6524 0.529138,15.0249 0,4.86972 -0.177167,10.1233 -0.529138,15.7655 3.24215,-2.67994 6.36501,-5.30555 9.36385,-7.88274z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="briefcase">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M84.4601 31.8132c0.500791,-3.40278 2.25356,-5.10476 5.27012,-5.10476 4.33586,0 8.26188,-0.0307089 11.7721,-0.121655 3.50908,-0.0720478 8.27841,-0.132285 14.295,-0.132285 2.33742,0 3.91893,1.04528 4.75516,3.10514 0.837408,2.07521 1.26143,4.07602 1.26143,5.98587 0,1.89687 -0.0885834,3.51026 -0.253939,4.83783l-37.3456 0c-0.337798,-2.31262 -0.256301,-5.16382 0.245671,-8.57015zm17.0423 112.275l0 0c16.3773,-0.0909456 29.4935,-0.18071 39.3558,-0.253939 9.85992,-0.0909456 18.0415,-0.133466 24.5648,-0.133466 6.35438,0 10.4458,-1.92639 12.2812,-5.76264 1.83663,-3.83861 2.76262,-7.25793 2.76262,-10.2591l0 -71.11c0,-2.85238 -0.925992,-6.18194 -2.76262,-10.0194 -1.83545,-3.85161 -5.92682,-5.67406 -12.2812,-5.5087 -6.18666,0 -12.3686,-0.0602367 -18.5494,-0.134647 -6.18903,-0.0885834 -12.3686,-0.134647 -18.5505,-0.134647 0.509059,-3.49137 0.381499,-7.92762 -0.37205,-13.258 -0.755911,-5.34335 -3.30003,-8.01739 -7.64297,-8.01739l-35.5869 0c-3.189,0 -5.31618,1.46458 -6.40753,4.37602 -1.08072,2.93979 -1.61812,5.98587 -1.61812,9.13708 0,3.17955 0,5.77682 0,7.76227 -6.18903,0 -12.3698,0.0460634 -18.5517,0.134647 -6.18666,0.07441 -12.3686,0.134647 -18.5482,0.134647 -6.01658,-0.165356 -10.0265,1.6571 -12.0343,5.5087 -2.0008,3.83743 -3.00002,7.16699 -3.00002,10.0194l0 71.6025c0,2.85238 0.954338,6.15123 2.88073,9.90008 1.91813,3.76066 5.9717,5.62918 12.1536,5.62918 6.17958,0 12.3615,0.04252 18.5482,0.133466 6.18194,0.0732289 12.3627,0.11693 18.5517,0.11693 0.164175,0.166537 8.43668,0.210238 24.8069,0.137009zm-99.002 36.4125l0 0 14.5348 0 0 -14.3623 -14.5348 0 0 14.3623zm30.0782 0l0 0 14.5418 0 0 -14.3623 -14.5418 0 0 14.3623zm30.0829 0l0 0 14.5348 0 0 -14.3623 -14.5348 0 0 14.3623zm30.0687 0l0 0 14.543 0 0 -14.3623 -14.543 0 0 14.3623zm30.0841 0l0 0 14.5348 0 0 -14.3623 -14.5348 0 0 14.3623zm30.077 0l0 0 14.5418 0 0 -14.3623 -14.5418 0 0 14.3623zm30.077 0l0 0 14.5336 0 0 -14.3623 -14.5336 0 0 14.3623z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="calc">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M36.0912 2.49805l127.821 0 0 195.002 -127.821 0 0 -195.002zm122.173 189.948l0 0 0 -184.894 -116.823 0 0 184.894 116.823 0zm-103.445 -165.573l0 0 90.6633 0 0 23.4829 -90.6633 0 0 -23.4829zm0 30.618l0 0 17.2407 0 0 17.5383 -17.2407 0 0 -17.5383zm0 24.9687l0 0 17.2407 0 0 17.2419 -17.2407 0 0 -17.2419zm0 24.3758l0 0 17.2407 0 0 17.5395 -17.2407 0 0 -17.5395zm0 24.3746l0 0 17.2407 0 0 17.5383 -17.2407 0 0 -17.5383zm0 24.6734l0 0 41.2255 0 0 17.5383 -41.2255 0 0 -17.5383zm85.3129 -110.877l0 0 0 -12.4855 -80.1207 0 0 12.4855 80.1207 0zm-60.9383 12.4844l0 0 17.2419 0 0 17.5383 -17.2419 0 0 -17.5383zm0 24.9687l0 0 17.2419 0 0 17.2419 -17.2419 0 0 -17.2419zm0 24.3758l0 0 17.2419 0 0 17.5395 -17.2419 0 0 -17.5395zm0 24.3746l0 0 17.2419 0 0 17.5383 -17.2419 0 0 -17.5383zm24.3746 -73.7191l0 0 17.5395 0 0 17.5383 -17.5395 0 0 -17.5383zm0 24.9687l0 0 17.5395 0 0 17.2419 -17.5395 0 0 -17.2419zm0 24.3758l0 0 17.5395 0 0 17.5395 -17.5395 0 0 -17.5395zm0 24.3746l0 0 17.5395 0 0 17.5383 -17.5395 0 0 -17.5383zm0 24.6734l0 0 17.5395 0 0 17.5383 -17.5395 0 0 -17.5383zm24.6722 -24.2778l0 0 17.2419 0 0 41.8161 -17.2419 0 0 -41.8161zm0.196065 -74.1148l0 0 17.2407 0 0 17.5383 -17.2407 0 0 -17.5383zm0 24.9687l0 0 17.2407 0 0 17.2419 -17.2407 0 0 -17.2419zm0 24.3758l0 0 17.2407 0 0 17.5395 -17.2407 0 0 -17.5395z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cart">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M193.61 75.6797l-51.5626 0 -29.1073 -68.3793c-6.31068,-3.15829 -5.95871,4.20712 -5.95871,4.20712l24.899 64.5253 -68.0332 0 28.4022 -65.9308c0.709848,-10.1682 -6.31068,-2.8016 -6.31068,-2.8016l-30.5069 67.6871 -47.7086 0 -4.09019 1.04528c-2.79805,5.1461 0.470082,9.36503 0.470082,9.36503l8.41542 0 0.930716 1.6323 17.3175 89.7787c2.32679,5.83942 6.77131,4.21184 6.77131,4.21184l10.7552 0 0 10.519 1.86852 -0.118111 0.119292 1.98781 8.06227 0 0 -2.21458 2.10356 0 0 -10.206 82.9247 0 0 12.0946 2.17915 0 0 2.19332 7.72447 0 0 -2.45553 1.75159 0 0 -11.921 13.6844 0c3.15239,-0.703943 4.90516,-4.20948 4.90516,-4.20948l14.7249 -91.8846 5.26894 0c8.75558,-5.60437 0,-9.12645 0,-9.12645zm-171.728 9.00834l0 0 17.9942 0 0.237403 38.1121 -11.6989 0 -6.53273 -38.1121zm18.4655 84.1743l0 0 -3.97326 0 -6.31186 -39.9854 10.2851 0 0 39.9854zm19.6301 0.465358l0 0 -11.9198 0 0 -40.4507 11.9198 0 0 40.4507zm0 -46.7638l0 0 -11.6847 0 0 -37.1779 11.6847 0 0 37.1779zm64.7781 -37.1779l0 0 11.6847 0 0 37.1779 -11.6847 0 0 -37.1779zm-58.2135 0l0 0 11.6847 0 0 37.1779 -11.6847 0 0 -37.1779zm12.1536 83.9416l0 0 -11.9328 0 0 -40.4507 11.9328 0 0 40.4507zm7.94652 -83.9416l0 0 11.6836 0 0 37.1779 -11.6836 0 0 -37.1779zm12.1584 83.9416l0 0 -11.9375 0 0 -40.4507 11.9375 0 0 40.4507zm18.2305 0l0 0 -11.9198 0 0 -40.4507 11.9198 0 0 40.4507zm0 -46.7638l0 0 -11.6836 0 0 -37.1779 11.6836 0 0 37.1779zm19.6442 46.7638l0 0 -11.9198 0 0 -40.4507 11.9198 0 0 40.4507zm18.469 0l0 0 -11.9328 0 0 -40.4507 11.9328 0 0 40.4507zm0.468901 -46.7638l0 0 -11.6965 0 0 -37.1779 11.6965 0 0 37.1779zm10.9808 46.0634l0 0 -5.60674 0 0.23386 -39.7503 11.4639 0 -6.09099 39.7503zm6.78076 -46.5334l0 0 -11.9186 0.239766 -0.235041 -37.6456 18.2352 0 -6.08154 37.4058z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="coil">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M112.854 54.6311c-39.2117,0 -70.9978,31.7896 -70.9978,71.0002 0,13.0466 3.53625,25.2675 9.68157,35.7735 -3.70279,-2.23348 -10.1694,-8.24652 -16.6501,-24.4561 0,0 -22.1399,-41.4098 12.4985,-87.5086 0,0 18.7561,-29.953 68.4974,-32.0365l0 -14.8466c0,0 -69.2769,-4.68429 -95.5826,69.5403 0,0 -21.358,62.7666 32.8172,104.956 0,0 46.8771,35.4204 90.3728,13.0229 0,0 4.67484,-1.66419 10.9442,-6.91659 17.8147,-12.8989 29.4179,-33.8542 29.4179,-57.5284 0,-39.2105 -31.7884,-71.0002 -70.999,-71.0002zm-26.6671 117.058l0 0c-9.94732,0 -18.0096,-8.06109 -18.0096,-18.0084 0,-9.94496 8.06227,-18.0108 18.0096,-18.0108 9.94496,0 18.0084,8.06581 18.0084,18.0108 0,9.94732 -8.06345,18.0084 -18.0084,18.0084zm2.77089 -53.3343l0 0c-9.9485,0 -18.0096,-8.06227 -18.0096,-18.0096 0,-9.94378 8.06109,-18.0096 18.0096,-18.0096 9.94496,0 18.0096,8.06581 18.0096,18.0096 0,9.94732 -8.06463,18.0096 -18.0096,18.0096zm26.8998 17.5478l0 0c-3.44412,0 -6.23509,-2.79097 -6.23509,-6.23391 0,-3.44176 2.79097,-6.23509 6.23509,-6.23509 3.44176,0 6.23391,2.79333 6.23391,6.23509 0,3.44294 -2.79215,6.23391 -6.23391,6.23391zm22.9714 37.8641l0 0c-9.94732,0 -18.0096,-8.06227 -18.0096,-18.0084 0,-9.94496 8.06227,-18.0084 18.0096,-18.0084 9.94614,0 18.0096,8.06345 18.0096,18.0084 0,9.94614 -8.06345,18.0084 -18.0096,18.0084zm2.07876 -52.6421l0 0c-9.94732,0 -18.0096,-8.06109 -18.0096,-18.0084 0,-9.94496 8.06227,-18.0096 18.0096,-18.0096 9.94378,0 18.0096,8.06463 18.0096,18.0096 0,9.94732 -8.06581,18.0084 -18.0096,18.0084z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cross">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M131.831 97.4594l20.8632 44.6708c-0.800794,1.87561 -1.86852,2.94215 -3.74176,3.74294l0 2.14608c-1.07363,1.06654 -5.35162,2.66931 -5.35162,4.27681 0,1.06891 0.801975,2.6764 1.3382,3.74294 -0.536225,3.21262 -5.61619,6.68864 -8.82881,6.68864 -3.47719,0 -8.82881,-9.62842 -10.1658,-11.7674l-25.1423 -38.7924 -52.9634 82.1262c-3.21262,2.40356 -10.1658,3.20554 -13.9088,3.20554 -3.47719,0 -4.01342,-2.66931 -5.61737,-5.34571 -1.60749,-2.40947 -4.01224,-5.35044 -4.01224,-8.2914 0,-1.60867 0.264569,-2.67522 0.800794,-4.28389 0.536225,-2.14017 1.60395,-3.74294 -0.264569,-5.34571 -0.536225,-0.536225 -1.3382,-1.07363 -1.3382,-1.87442 0,-3.47719 4.54492,-9.89535 6.41816,-13.1068l6.41698 -10.9666c10.969,-19.2604 31.3018,-43.3362 45.7456,-60.721l3.20672 -3.74885 -19.7907 -54.5674c-0.80788,-2.13899 -2.94687,-6.68864 -2.94687,-9.09338 0,-1.87442 2.41065,-4.27799 3.47719,-5.61619l1.87442 -1.60867c0.536225,-0.536225 1.07245,-0.801975 1.87324,-0.801975 1.87324,0 2.94215,1.33702 4.27917,2.41065 1.60277,-1.3382 2.40947,-1.3382 4.27917,-1.3382 1.60867,-0.806699 1.60867,-0.806699 2.40947,-1.87324 0.801975,-1.3382 1.3382,-2.14017 2.94215,-2.14017 2.93979,0 3.74176,2.6764 4.81421,4.81421l10.9678 21.9356 9.36503 18.1879 6.68273 -8.29258 13.1068 -14.9812c2.94687,-3.47601 23.2738,-28.0868 25.6845,-28.0868 1.60277,0 7.75518,3.74767 9.35795,5.08587l2.94687 -2.6764c0.530319,-0.801975 2.13899,-2.67522 2.94097,-2.67522 0.801975,0 1.3382,1.60277 1.60277,2.13899 1.07245,2.6764 5.35162,5.61619 5.35162,7.49061 0,1.60277 -1.87324,3.21262 -2.94097,4.27917 -2.94687,2.67522 -6.68864,7.76108 -9.09928,10.9678l-37.9834 49.2216 -2.94097 4.27799 8.2914 16.5852z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cross2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M160.644 197.5l-24.4608 -24.5589c-5.58311,2.68939 -11.3906,4.81775 -17.4214,6.37918 -6.03312,1.56143 -12.2895,2.34451 -18.762,2.34451 -6.48076,0 -12.73,-0.783077 -18.762,-2.34451 -6.03194,-1.56143 -11.8395,-3.68979 -17.4226,-6.37918l-24.4608 24.5589 -36.5401 -36.6464 24.4762 -24.5482c-2.67522,-5.59729 -4.8024,-11.4273 -6.36383,-17.4757 -1.56261,-6.04729 -2.34333,-12.3261 -2.34333,-18.8316 0,-6.49611 0.780715,-12.7749 2.34333,-18.8222 1.56143,-6.04611 3.68861,-11.8784 6.36383,-17.4828l-24.4762 -24.547 36.5401 -36.6475 24.4608 24.56c5.58311,-2.68349 11.3906,-4.81067 17.4226,-6.37092 6.03194,-1.56261 12.2812,-2.35277 18.762,-2.35277 6.47249,0 12.7288,0.790164 18.762,2.35277 6.03076,1.56025 11.8383,3.68743 17.4214,6.37092l24.4608 -24.56 36.5401 36.6475 -24.4762 24.547c2.6764,5.60437 4.79531,11.4367 6.35674,17.4828 1.56261,6.04729 2.35041,12.3261 2.35041,18.8222 0,6.50556 -0.787801,12.7844 -2.35041,18.8316 -1.56143,6.04847 -3.68034,11.8784 -6.35674,17.4757l24.4762 24.5482 -36.5401 36.6464zm-28.7211 -97.5019l0 0c0,-4.28389 -0.843314,-8.40597 -2.52167,-12.358 -1.68545,-3.95082 -3.98271,-7.39258 -6.89061,-10.3312 -2.91498,-2.92916 -6.33312,-5.24177 -10.2461,-6.93785 -3.92129,-1.69253 -8.01148,-2.54175 -12.2647,-2.54175 -4.48586,0 -8.63156,0.849219 -12.4359,2.54175 -3.80436,1.69608 -7.16817,4.00869 -10.0761,6.93785 -2.91616,2.93861 -5.21343,6.38037 -6.89061,10.3312 -1.68663,3.952 -2.52049,8.07408 -2.52049,12.358 0,4.51893 0.833865,8.70125 2.52049,12.5375 1.67718,3.83389 3.97444,7.2225 6.89061,10.154 2.9079,2.93861 6.2717,5.25004 10.0761,6.94257 3.80436,1.6949 7.95006,2.53821 12.4359,2.53821 4.25318,0 8.34337,-0.843314 12.2647,-2.53821 3.91302,-1.69253 7.33116,-4.00397 10.2461,-6.94257 2.9079,-2.93152 5.20516,-6.32013 6.89061,-10.154 1.67836,-3.83625 2.52167,-8.01857 2.52167,-12.5375z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cruchenie">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!-- Created with Inkscape (http://www.inkscape.org/) -->\n\n<svg\n   xmlns:dc="http://purl.org/dc/elements/1.1/"\n   xmlns:cc="http://creativecommons.org/ns#"\n   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n   xmlns:svg="http://www.w3.org/2000/svg"\n   xmlns="http://www.w3.org/2000/svg"\n   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"\n   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"\n   width="200"\n   height="200"\n   id="svg2"\n   version="1.1"\n   inkscape:version="0.48.4 r9939"\n   sodipodi:docname="cruchenie.svg">\n  <defs\n     id="defs4" />\n  <sodipodi:namedview\n     id="base"\n     pagecolor="#ffffff"\n     bordercolor="#666666"\n     borderopacity="1.0"\n     inkscape:pageopacity="0.0"\n     inkscape:pageshadow="2"\n     inkscape:zoom="0.35"\n     inkscape:cx="375"\n     inkscape:cy="520"\n     inkscape:document-units="px"\n     inkscape:current-layer="layer1"\n     showgrid="false"\n     inkscape:window-width="1366"\n     inkscape:window-height="684"\n     inkscape:window-x="-8"\n     inkscape:window-y="-8"\n     inkscape:window-maximized="1" />\n  <metadata\n     id="metadata7">\n    <rdf:RDF>\n      <cc:Work\n         rdf:about="">\n        <dc:format>image/svg+xml</dc:format>\n        <dc:type\n           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />\n        <dc:title></dc:title>\n      </cc:Work>\n    </rdf:RDF>\n  </metadata>\n  <g\n     inkscape:label="Layer 1"\n     inkscape:groupmode="layer"\n     id="layer1"\n     transform="translate(0,-852.36218)">\n    <path\n       style="fill:#666666"\n       d="m 57.726711,905.07953 c -0.04809,0.002 -0.07625,0.008 -0.07854,0.023 -0.900066,6.14261 -2.839755,11.98921 -4.886915,17.76304 -1.03199,2.93561 -2.169826,5.83983 -3.002816,8.85275 -0.902523,3.26444 -0.0073,0.46986 -0.578973,2.22182 -0.04245,0.11331 1.566901,0.81555 1.609354,0.70223 0.694086,-1.38382 0.159706,-0.22075 0.863548,-2.24484 0.794422,-2.28458 1.683475,-4.52582 2.521967,-6.7921 0.543875,-0.29003 1.075684,-0.59839 1.579914,-0.94398 1.22756,3.43964 2.791342,6.75989 4.317756,10.08453 0.242874,0.4297 0.483298,0.85964 0.726171,1.28935 0.02155,0.0512 0.342998,-0.0485 0.686918,-0.17268 -0.06294,0.39312 -0.0989,0.78818 -0.07854,1.18574 -0.0065,0.11762 1.641823,0.30183 1.648607,0.18419 0.659764,-2.89606 1.60065,-5.69772 2.355142,-8.56494 0.530388,-2.06601 0.931123,-3.43977 1.305136,-5.56032 0.534257,-3.02921 0.795663,-6.1315 1.197197,-9.18659 0.01796,-0.12267 -1.70911,-0.46803 -1.727104,-0.34536 -0.628161,3.00908 -0.935302,6.09313 -1.491586,9.11753 -0.358853,1.9508 -0.783622,3.48717 -1.265891,5.39913 -0.526812,2.03736 -1.101392,4.06045 -1.579905,6.11289 -1.531876,-3.57803 -3.157191,-7.12051 -4.671041,-10.70619 0.08981,-0.0891 0.178214,-0.18238 0.264958,-0.27628 3.301294,-3.25516 6.367219,-6.75957 9.106555,-10.52199 0.06245,-0.10322 -1.419294,-1.07023 -1.481782,-0.96701 -2.988659,3.45589 -5.966166,6.91792 -9.175247,10.16511 -0.19464,0.22233 -0.405413,0.42683 -0.618226,0.62165 1.931068,-5.50647 3.665519,-11.13617 4.072442,-17.07232 0.01551,-0.10558 -1.282447,-0.38194 -1.619167,-0.36839 z m 16.122926,6.82663 c -1.906959,0.0293 -3.751569,0.74733 -5.505149,1.32388 -0.111366,0.0385 0.506867,1.66174 0.618225,1.62319 1.951208,-0.52391 4.70026,-1.64766 6.7416,-0.94398 0.143002,0.12437 0.348982,0.19381 0.42196,0.36838 0.141884,0.33936 -0.188133,1.87767 -0.196264,1.911 -0.449923,1.86163 -1.223233,3.65663 -1.864489,5.44519 -0.963395,2.10677 -1.933003,4.51975 -3.689726,6.08986 -0.438191,0.39163 -1.126252,0.67739 -1.658412,0.92096 -0.879786,0.16264 -1.376652,-0.26991 -2.011687,-0.82886 -0.08082,-0.0986 -1.395798,0.99505 -1.314949,1.09364 0.29692,0.26677 0.548611,0.59763 0.892988,0.79432 1.118929,0.63908 2.28792,0.74182 3.454208,0.43746 0.856796,-0.39916 1.40757,-0.59111 2.149073,-1.25481 1.907089,-1.70701 3.025839,-4.24253 4.033181,-6.56185 0.751528,-2.19928 2.886967,-6.83721 1.521034,-9.15206 -0.225435,-0.38204 -0.667732,-0.58288 -1.000941,-0.87491 -0.588876,-0.12229 -1.171147,-0.31131 -1.766357,-0.36839 -0.27464,-0.0263 -0.551876,-0.0272 -0.824295,-0.023 z m 5.348137,2.08367 c -0.01363,0.004 -0.02833,0.0154 -0.02939,0.023 -0.459042,2.88266 -1.079366,5.74456 -1.393462,8.65704 -0.208234,1.9308 -0.155959,2.681 -0.147199,4.57028 0.105562,1.26308 0.08522,2.54172 0.33365,3.78744 -0.850796,1.35179 -1.627078,2.75688 -2.28645,4.23643 -0.131001,0.69281 -0.438346,1.26691 -0.765424,1.86495 -0.05127,0.10664 1.469715,0.92398 1.521026,0.81735 0.346419,-0.61488 0.709908,-1.21736 0.87337,-1.92251 1.417701,-2.89007 3.317941,-5.44314 5.210752,-8.01236 0.883492,-1.29658 1.832828,-2.55424 2.708418,-3.85653 1.107516,-1.6472 2.027518,-3.39908 2.992995,-5.13436 0.193113,-0.34708 0.405812,-0.68342 0.608414,-1.02458 0.04841,-0.10825 -1.502047,-0.87955 -1.550476,-0.7713 -0.206502,0.28279 -0.428002,0.55718 -0.618225,0.85189 -1.077268,1.66912 -2.034882,3.4096 -3.169625,5.04227 -5.275125,7.5898 2.56131,-3.95352 -2.688792,3.81048 -0.405176,0.54606 -0.795476,1.1043 -1.187385,1.65773 0.0057,-0.41925 -0.01037,-0.83405 -0.06866,-1.19725 0.0316,-1.74797 0.01168,-2.53677 0.206078,-4.31701 0.318097,-2.91274 0.912394,-5.78609 1.148132,-8.7146 0.0169,-0.11501 -1.493179,-0.43072 -1.697665,-0.36839 z m 18.311245,1.32389 c -0.01339,0.004 -0.02833,0.0155 -0.02939,0.023 -0.469696,3.69471 -1.355483,7.23628 -2.453275,10.75223 -0.169184,0.56067 -0.347961,1.11767 -0.510288,1.68075 -0.120069,0.41659 -0.227524,0.8336 -0.333641,1.2433 -0.189546,-0.39868 -0.396783,-0.77222 -0.451401,-0.74828 -1.261,0.25583 -2.526539,0.38484 -3.827111,0.40292 -0.207645,0.0295 -1.232491,0.30379 -1.403278,0.0576 -0.519676,-0.74923 0.277647,-2.04615 0.23552,-2.7859 0.776209,-3.25886 1.89873,-6.39846 2.737851,-9.63556 0.01772,-0.12066 -1.679948,-0.4545 -1.697665,-0.33385 -1.120553,3.10315 -2.141384,6.23557 -2.835985,9.4859 -0.180548,1.35068 -0.846615,3.24974 0.529907,4.32852 0.845995,0.66299 1.908136,0.5701 2.865424,0.65619 1.23677,0.0128 2.410879,-0.12365 3.591594,-0.36838 -0.02817,0.13087 -0.05241,0.25831 -0.07846,0.3914 -0.205743,1.0484 -0.287074,2.08764 -0.559354,3.11976 -0.79008,2.091 -1.468972,4.20076 -1.864481,6.42371 -0.08456,0.24486 -0.170573,0.49191 -0.255144,0.73677 -0.0369,0.11705 1.631331,0.7387 1.668224,0.62165 0.111865,-0.31724 0.221802,-0.63826 0.33365,-0.9555 0.391599,-2.18845 1.10149,-4.26008 1.844863,-6.33161 0.253789,-1.03959 0.338548,-2.07994 0.578972,-3.11976 0.2018,-0.87272 0.459483,-1.71603 0.726163,-2.56718 0.174671,-0.55742 0.36091,-1.11338 0.539728,-1.66924 0.271537,-0.85598 0.962415,-2.99424 1.187384,-3.84502 0.620332,-2.34595 0.856111,-4.7712 1.128505,-7.19502 0.01657,-0.1131 -1.467102,-0.42969 -1.668232,-0.36838 z m 9.410761,1.79587 c -0.73385,0.016 -1.46346,0.0706 -2.18832,0.1842 -0.11137,0.0385 0.50686,1.66174 0.61822,1.62319 1.87249,-0.0995 3.75492,0.0325 5.63272,0.19571 0.12881,-0.0205 -0.25389,-1.88544 -0.38271,-1.86496 -1.22642,-0.0875 -2.45682,-0.1648 -3.67991,-0.13814 z m -4.28833,0.33385 c -0.0134,0.004 -0.0185,0.0155 -0.0196,0.023 -0.4744,3.63127 -1.65556,7.05549 -2.688782,10.52199 -0.129834,0.47602 -0.272615,0.94833 -0.39253,1.4275 -0.113595,0.45387 -0.181544,0.91891 -0.304202,1.36992 -0.381246,1.40185 -0.996818,2.72775 -1.462155,4.09828 -0.371865,0.93776 -0.38412,1.97821 -0.588785,2.95859 -0.0609,0.29186 -0.164678,0.57693 -0.284576,0.85189 -0.114525,-0.003 -0.228929,-0.01 -0.343463,-0.0115 -0.05396,0.003 -0.04384,0.35233 -0.0098,0.73677 -0.07005,0.13734 -0.139932,0.27887 -0.206077,0.41444 -0.570139,0.77163 -0.2597,0.46291 -0.863548,0.94398 -0.08017,0.0875 1.195565,1.30775 1.275703,1.22028 0.874031,-0.79375 0.47177,-0.33213 1.177572,-1.40447 0.01649,-0.0342 0.03241,-0.0694 0.04907,-0.10361 2.938953,0.18182 5.875473,0.26285 8.812153,0.61013 1.10714,0.0655 2.16229,0.48101 3.23833,0.73678 -0.0712,0.17285 -0.14691,0.34385 -0.21589,0.51804 -0.0406,0.11556 1.60807,0.78325 1.6486,0.66769 0.13615,-0.34958 0.28402,-0.69289 0.43178,-1.03607 0.12302,-0.0292 0.23924,-0.0685 0.36308,-0.0921 0.0378,-0.0144 -0.0265,-0.22989 -0.11776,-0.48351 0.11476,-0.25445 0.23327,-0.5073 0.35328,-0.75979 0.34566,-0.97256 0.53162,-1.9514 0.81448,-2.94708 0.24773,-0.872 0.51737,-1.73674 0.78505,-2.60172 1.06196,-0.12536 2.11602,-0.28044 3.17945,-0.41443 0.11935,-0.0409 -0.53813,-1.79071 -0.65748,-1.74983 -0.65106,0.0781 -1.30284,0.16174 -1.95281,0.24175 0.0214,-0.0769 0.0478,-0.15318 0.0687,-0.23024 0.91625,-3.42002 1.39367,-6.9995 2.7771,-10.2572 0.0484,-0.10826 -1.50203,-0.87957 -1.55046,-0.77131 -1.69447,3.23088 -2.18051,6.94537 -3.08132,10.47594 -0.0928,0.33891 -0.19743,0.67548 -0.29439,1.01305 -0.8731,0.093 -1.7496,0.18013 -2.62991,0.23025 -0.11136,0.0385 0.50687,1.67325 0.61823,1.63471 0.49585,0.0263 0.99214,0.0186 1.48177,0 -0.17732,0.62055 -0.35291,1.23782 -0.51028,1.86494 -0.24436,0.97375 -0.36678,1.95086 -0.70654,2.88952 -0.0447,0.0914 -0.084,0.18443 -0.12757,0.27629 -1.3998,-0.37289 -2.76717,-0.96452 -4.21963,-1.05911 -2.57112,-0.33438 -5.15001,-0.45131 -7.722914,-0.51804 0.06033,-0.18007 0.115481,-0.36529 0.157012,-0.55258 0.19526,-0.88051 0.171886,-1.83133 0.529906,-2.67078 0.499911,-1.41584 1.145866,-2.77519 1.560286,-4.22492 0.11436,-0.40005 0.17862,-0.81749 0.28458,-1.22027 3.14268,0.17805 6.2595,0.15185 9.39113,0.0346 l 0.93225,-0.11512 c 0.11699,-0.0338 -0.44234,-1.73752 -0.55935,-1.70378 -0.30083,0.003 -0.60195,-0.003 -0.9028,0 -2.77519,0.0445 -5.54891,0.007 -8.32151,0.0346 1.1064,-3.417 2.2592,-6.85003 2.48271,-10.51048 0.0166,-0.1131 -1.47692,-0.41816 -1.67804,-0.35687 z m 18.91966,4.89261 c -0.0481,0.002 -0.0763,0.008 -0.0785,0.023 -0.69795,4.10612 -2.43352,7.87545 -3.88599,11.70772 -0.97866,3.08819 -2.35708,6.00303 -2.91449,9.23265 -0.10495,1.18766 -0.11844,0.65911 -0.0294,1.60016 0.003,0.12025 1.68118,0.16629 1.67804,0.0461 0.002,-0.66592 -0.0151,-0.2531 0.0883,-1.23179 0.62498,-3.11506 2.0748,-5.91396 3.03225,-8.91031 1.53424,-3.90851 3.30794,-7.81748 3.72898,-12.09913 0.0155,-0.10557 -1.28244,-0.38193 -1.61916,-0.36839 z m 5.3972,0.18419 c -0.0489,0.002 -0.0763,0.008 -0.0785,0.023 -0.96162,5.32291 -2.65843,10.44424 -4.65141,15.40309 -1.1259,2.4679 -1.99826,5.04954 -3.26777,7.43677 -0.12875,0.36902 -0.5073,1.10044 0.0981,1.45051 1.5423,0.89182 3.46821,-0.59156 4.61215,-1.2548 0.69458,-0.40272 1.37844,-0.82501 2.07057,-1.2318 2.31581,-1.59397 4.63825,-3.18411 7.02617,-4.67388 -0.11294,0.41561 -0.22584,0.82584 -0.33364,1.24331 -0.57735,2.66108 -1.8408,5.15375 -2.10982,7.89724 -0.0224,0.0311 -0.0203,0.032 -0.0393,0.0576 0.27911,0.01 0.55742,0.11389 0.83412,0.18419 -0.3254,0.01 -1.53359,0.3602 -1.50141,0.46048 0.42041,0.29712 0.78027,0.74966 1.26589,0.89794 0.5679,0.17338 0.98905,-1.01546 1.1187,-1.32388 0.31557,-2.56473 1.97224,-5.02985 2.41402,-7.57492 0.30279,-1.14254 0.62712,-2.27676 0.96168,-3.40755 0.12721,-0.0726 0.25501,-0.14695 0.38271,-0.21873 0.0308,-0.0229 -0.075,-0.17796 -0.20607,-0.3799 1.02385,-3.41819 2.13763,-6.81232 3.09113,-10.25721 0.038,-0.11711 -1.63028,-0.73877 -1.66824,-0.62165 -1.20765,3.39796 -2.38067,6.80609 -3.41495,10.26873 -3.20453,1.68909 -6.20816,3.72107 -9.11637,5.87113 -1.01155,0.64365 -2.00253,1.33136 -3.03225,1.94553 0.097,-0.17049 0.18969,-0.33862 0.27477,-0.51804 0.85225,-1.79724 1.587,-3.65685 2.48271,-5.43368 2.0677,-5.05514 3.87881,-10.31942 4.43552,-15.86356 0.0158,-0.10735 -1.30624,-0.39367 -1.64859,-0.3799 z m 3.32664,26.35102 c -0.0231,-7.3e-4 -0.0455,-0.0122 -0.0687,-0.0115 -0.0604,0.002 -0.30872,0.5189 0.0687,0.0115 z m 14.55282,-19.80068 c -1.20037,0.13475 -2.40793,0.26527 -3.59159,0.48351 -0.49906,-0.1255 -1.20526,-0.25142 -1.21682,-0.17268 -0.0288,0.15343 -0.0589,0.30719 -0.0883,0.46048 -0.0194,0.005 -0.0394,0.006 -0.0589,0.0115 -0.0238,0.008 -0.0113,0.0973 0.0196,0.21872 -0.0506,0.26405 -0.10068,0.52931 -0.14719,0.79433 -0.25048,1.42667 -0.421,2.87338 -0.69673,4.29398 -0.11666,0.60103 -0.25734,1.20257 -0.40234,1.79588 -0.30721,0.0387 -0.61336,0.0853 -0.92243,0.11512 -0.0902,0.0312 0.29959,1.08677 0.51028,1.47354 -0.29788,1.08561 -0.62082,2.15616 -0.93224,3.23487 -0.46103,1.36374 -1.1406,2.6102 -1.82524,3.85653 -0.0557,0.11162 1.54385,0.99805 1.59953,0.88643 0.14758,-0.24353 0.29646,-0.48023 0.44159,-0.72526 0.082,0.14977 0.14834,0.24171 0.17664,0.23025 4.64984,-0.72371 9.24848,-1.76854 13.98366,-1.98008 0.45427,0.0361 0.89996,0.0791 1.35421,0.11512 0.12691,-0.0193 -0.22637,-1.86119 -0.35327,-1.84192 l -1.5701,-0.14965 c -4.28897,0.0957 -8.4772,0.86539 -12.60983,1.83041 0.25645,-0.51954 0.48294,-1.0461 0.67711,-1.60018 0.38882,-1.26884 0.75336,-2.54972 1.07944,-3.8335 2.43172,-0.26288 4.79685,-0.88017 7.20281,-1.27783 0.11995,-0.0455 -0.59641,-1.80678 -0.71636,-1.76134 -2.02175,0.31846 -4.02024,0.76675 -6.03505,1.11666 0.3844,-1.74863 0.68813,-3.51836 0.87337,-5.31855 1.29823,-0.16906 2.59847,-0.28823 3.90561,-0.40292 0.12685,-0.0407 -0.53063,-1.89418 -0.65748,-1.85344 z m -86.365074,19.17903 c -8.591582,0.31364 -17.232531,1.28919 -25.40611,4.61633 -1.369017,0.61028 -2.758938,1.14501 -4.101875,1.83041 -5.859861,2.9907 -11.359506,7.09236 -16.181798,11.99552 -0.251073,0.37972 4.331645,4.54707 4.582717,4.16735 5.197506,-3.22767 10.098701,-7.13943 15.55376,-9.79673 1.184863,-0.57717 2.411779,-1.00531 3.621033,-1.50807 1.238415,-0.4368 2.459991,-0.96673 3.719162,-1.31237 1.270544,-0.34876 2.569107,-0.52203 3.85655,-0.77131 5.458818,-1.05695 10.580345,-1.62934 16.113104,-1.64621 8.244967,0.5091 16.513903,0.7383 24.738819,1.58866 8.547285,1.11149 16.228962,4.63472 23.865462,9.05996 6.34644,4.0341 12.46777,8.56493 19.41031,11.10909 1.47935,0.54213 2.99516,0.92062 4.4944,1.38145 9.61525,1.93644 19.48051,0.59843 29.00751,-1.41598 4.90038,-1.18833 9.8154,-2.56523 14.57245,-4.45515 -1.43743,1.83101 -2.90784,3.6253 -4.38645,5.41065 -1.71901,2.21636 -3.25628,4.61249 -4.80842,6.98779 -0.11368,0.21315 2.45736,2.10112 2.57103,1.88798 0.10079,-0.147 0.20339,-0.29046 0.30421,-0.43746 0.1546,0.0919 0.272,0.15281 0.29439,0.11512 0.0616,-0.0758 0.3382,-0.40737 0.55935,-0.67921 -0.11848,0.42652 -0.23025,0.8543 -0.32383,1.23179 -0.0453,0.22551 2.67294,0.97379 2.71822,0.74828 0.62496,-2.72857 2.54223,-3.78895 3.84674,-6.14742 4.47748,-6.11839 8.35473,-12.80552 13.12011,-18.63797 0.0466,-0.0704 -0.23358,-0.40373 -0.61823,-0.78281 0.35011,-0.52308 0.70234,-1.03991 1.05001,-1.56563 0.0961,-0.20932 -2.4259,-1.8095 -2.52197,-1.60018 -0.27644,0.33181 -0.56769,0.658 -0.84393,0.99004 0.0733,-0.4477 0.11086,-0.78723 0.0491,-0.80584 -3.69771,-0.10799 -7.41807,-0.13473 -11.05936,-1.02458 -1.94924,-0.47634 -3.25132,-1.10053 -5.10281,-1.87645 -2.57309,-1.58651 -1.33995,-0.76281 -3.71916,-2.45207 -0.16033,-0.16573 -2.16221,2.49356 -2.00188,2.65928 2.35044,1.791 1.65802,1.27856 3.73879,2.65928 -0.31924,0.66835 -0.581,1.31563 -0.50046,1.36993 2.64482,1.72172 5.35574,2.94913 8.15468,3.81048 -5.77569,2.26673 -11.71734,3.97392 -17.70283,5.23797 -7.72996,1.48854 -15.65072,2.85658 -23.47293,1.64621 -1.31948,-0.32962 -2.65655,-0.55921 -3.95468,-0.99003 -6.78852,-2.25289 -12.74195,-6.71682 -18.84115,-10.70617 -8.13398,-4.85297 -16.598166,-8.82262 -25.700503,-10.32629 -9.531153,-1.03986 -19.128345,-1.26116 -28.693501,-1.56564 z"\n       id="path2985"\n       inkscape:connector-curvature="0" />\n  </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="drink">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M147.289 35.5444c-3.60593,3.50908 -8.53589,4.87917 -13.9714,4.87917 -6.9225,0 -13.1942,-2.80396 -16.799,-8.13786 -3.5894,5.43548 -9.91898,8.13786 -16.9206,8.13786 -6.91305,0 -13.147,-2.87246 -16.7458,-8.20636 -3.57759,5.50989 -9.90716,8.20636 -16.9631,8.20636 -5.13665,0 -9.81031,-1.1315 -13.3596,-4.30397l-2.66104 -19.1553c3.66145,4.85909 9.47488,7.9914 16.0206,7.9914 7.05596,0 13.3855,-3.48664 16.9631,-8.99771 3.59885,5.32918 9.83275,8.99771 16.7458,8.99771 7.00163,0 13.3312,-3.49727 16.9206,-8.92802 3.60475,5.32681 9.87646,8.92802 16.799,8.92802 7.05832,0 13.2615,-3.64609 16.8379,-9.15598l-2.86656 19.7446z"/>\n  <polygon class="fil0" points="152.404,197.5 180.166,2.49805 159.601,2.69057 134.609,176.936 65.3828,176.936 40.4011,2.69057 19.8368,2.49805 47.5988,197.5 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="drink2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="148.622,54.3075 130.437,197.5 69.075,197.5 50.8858,54.3075 125.925,54.2957 140.745,2.49805 149.117,4.90279 134.953,54.2697 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="enter">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="75.6325,53.9591 75.6325,36.5838 180.083,36.5838 180.083,163.413 77.3605,163.413 77.3605,149.51 59.9532,149.51 59.9532,172.094 59.9532,179.044 68.6568,179.044 188.798,179.044 197.502,179.044 197.502,172.094 197.502,29.6329 197.502,20.9529 188.798,20.9529 66.9171,20.9529 58.2135,20.9529 58.2135,29.6329 58.2135,53.9591 "/>\n  <polygon class="fil0" points="51.252,132.139 72.1388,111.295 2.50041,111.295 2.50041,93.9114 72.1388,93.9114 51.252,71.3309 75.6325,71.3309 101.741,99.1319 75.6325,132.139 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="fingers">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M122.469 41.9862c3.54097,-10.0737 11.9836,-35.4015 25.3278,-35.4015 9.53393,0 14.1603,8.16502 14.1603,16.8852 0,15.247 -12.5281,45.7539 -17.4308,61.2749l6.26462 1.90868c4.90161,1.08662 7.62644,1.9075 9.80441,6.53391 4.08665,8.17329 5.72485,20.973 5.72485,30.2306 0,16.069 -5.99532,37.8558 -16.8911,50.1146 -13.0678,14.432 -32.4085,23.9671 -51.7421,23.9671 -15.7985,0 -34.3148,-4.6335 -45.213,-16.6159 -9.52803,-10.6206 -18.7927,-31.8617 -18.7927,-46.0232 0,-10.3501 7.35596,-19.6088 17.706,-19.3383 -1.09135,-4.35712 -2.18269,-8.71306 -2.18269,-13.0761 0,-4.07956 1.36182,-6.26344 3.81617,-9.52685 2.17797,-2.9953 8.98826,-9.25992 13.3442,-9.25992 3.54097,0 8.17329,1.63112 11.4367,2.44844 -4.35594,-17.7025 -19.8793,-49.5689 -19.8793,-67.0009 0,-8.44259 7.35124,-16.6088 16.3395,-16.6088 5.99532,0 10.8969,5.98824 13.6218,10.6206 4.62523,8.17211 10.6194,24.7809 13.6135,34.0408l9.25992 25.3337 11.7119 -30.5069zm16.8852 69.1789l0 0 2.17797 4.35712 -1.08662 2.45317c-8.71779,1.6323 -13.0737,3.26459 -19.884,9.52921 -7.08076,6.53509 -17.9718,18.7927 -17.9718,29.1427 0,5.17327 3.26459,12.5292 4.35712,17.973l-2.45435 2.45317c-8.71424,-7.62526 -10.891,-13.3442 -11.4379,-24.5116l-6.26344 0c0.270475,2.44844 0.816148,7.62644 -0.816148,10.0749 -2.17915,3.81617 -7.89809,6.81147 -11.9836,6.81147 -5.44847,0 -13.0749,-4.6335 -17.1604,-8.17447 -4.08074,-3.81027 -7.35124,-9.80323 -9.80441,-14.706l0 -5.98824 2.17797 0.270475c2.72364,6.53982 14.1674,17.9765 20.9706,17.9765 2.72482,0 8.17329,-2.17915 8.17329,-5.44847 0,-2.72482 -13.3454,-20.425 -15.7926,-23.6955 -2.45553,-3.26459 -4.9087,-5.98824 -9.26582,-5.98824 -4.62641,0 -11.4367,7.07958 -11.4367,11.4367 0,3.26932 5.17327,18.7927 7.08076,22.3325 2.45317,5.71894 9.80441,17.432 14.706,20.973 7.35833,5.71776 21.5187,8.16502 30.7774,8.16502 17.9765,0 35.9483,-6.53391 47.6602,-20.4238 10.0761,-11.9836 15.7997,-30.7774 15.7997,-46.2996 0,-10.3513 -1.6382,-20.6966 -12.2588,-24.5116 -10.3501,-3.81027 -31.8688,-6.2658 -43.3043,-7.35124l-9.52921 -0.814967c-1.36182,2.44726 -2.17797,4.35594 -2.17797,7.07958 0,5.71894 5.44138,10.891 10.3442,13.3442 7.62644,3.54097 16.3454,3.54097 24.5116,3.54097l13.8911 0zm-81.4317 -8.17211l0 0c0,5.99296 9.80559,19.6088 13.3442,24.5116 4.08783,5.17799 11.1686,15.2529 18.5186,15.2529 3.26932,0 6.26344,-2.45435 6.26344,-5.71894 0,-5.17917 -12.5292,-25.8734 -15.5222,-31.0514 -4.08665,-6.80557 -5.98824,-11.4367 -14.4367,-12.7997 -2.99412,2.17915 -8.16739,5.71894 -8.16739,9.80559zm26.9601 -74.6215l0 0c-1.90159,-5.17799 -4.90161,-16.0678 -11.9824,-16.0678 -3.81027,0 -5.71776,4.35476 -5.71776,7.35006 0,10.0796 5.17091,24.5116 8.71188,34.316l7.08667 19.3383 2.44726 6.26462c1.363,-1.36182 1.9075,-1.9075 3.81617,-1.9075l13.3454 1.36182 -17.7072 -50.6555zm12.5292 87.6952l0 0 6.26462 14.9777 12.2588 -11.4367 -18.5234 -3.54097zm46.2996 -58.5572l0 0c1.9075,-6.26462 9.25755,-28.0526 9.25755,-33.4999 0,-3.54097 -2.17797,-6.80557 -5.98824,-6.80557 -8.17211,0 -14.1615,22.3336 -15.7985,27.5057l-12.7997 35.4097 16.3395 2.44726 8.98944 -25.0573z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="flower">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M97.9626 24.8293c-1.76104,-27.6817 -23.8821,-21.6108 -23.8821,-21.6108 -21.7632,7.86384 -11.6517,28.0136 -11.6517,28.0136l35.0436 60.095 0.490161 -66.4978z"/>\n  <path class="fil0" d="M175.159 98.3748c27.9085,-1.77403 21.7691,-23.7002 21.7691,-23.7002 -7.95124,-21.5789 -28.2605,-11.5359 -28.2605,-11.5359l-60.5639 34.8133 67.0553 0.422838z"/>\n  <path class="fil0" d="M134.302 33.1302c11.7509,-25.1659 -10.6064,-30.2861 -10.6064,-30.2861 -22.9171,-3.3768 -23.7144,19.1163 -23.7144,19.1163l1.92167 69.3927 32.3991 -58.2229z"/>\n  <path class="fil0" d="M94.1346 95.0511l-57.7103 -32.4168c0,0 -21.0557,-10.3158 -5.69768,-32.1794 0,0 15.606,-12.2812 28.4837,3.19373l34.9243 61.4025z"/>\n  <path class="fil0" d="M90.9125 98.0004c0,0 -58.7001,-34.3881 -59.1961,-33.8979 0,0 -21.7939,-10.5627 -28.7282,11.5465 0,0 -4.45988,17.6824 13.6206,22.8415l74.3037 -0.490161z"/>\n  <path class="fil0" d="M92.1503 101.929l-74.3014 0c0,0 -21.0545,4.17759 -13.1281,26.2797 0,0 5.44847,15.9674 24.5211,8.59849l62.9084 -34.8782z"/>\n  <path class="fil0" d="M94.6283 106.106l-60.682 32.6648c0,0 -16.0974,11.0576 -4.4587,28.988 0,0 18.0828,18.4218 33.6853,-6.14414 15.6037,-24.56 31.4554,-55.5087 31.4554,-55.5087z"/>\n  <path class="fil0" d="M97.3531 110.771l-33.6853 56.4973c0,0 -11.8855,17.6824 7.43037,28.4884 0,0 20.8053,9.82685 26.7486,-17.1899l-0.493705 -67.7958z"/>\n  <path class="fil0" d="M101.318 109.793l-0.497248 66.5604c0,0 0.497248,25.5474 24.2742,20.3895 0,0 17.5844,-4.18114 12.8777,-24.5624l-36.6546 -62.3875z"/>\n  <path class="fil0" d="M104.289 105.861l32.1995 57.7197c0,0 13.3714,19.6502 30.7136,6.38863 0,0 17.334,-14.4934 -2.23348,-30.7018l-60.6796 -33.4066z"/>\n  <path class="fil0" d="M108.251 102.178l66.8722 -0.249215c0,0 25.5132,-0.48898 19.3242,25.5474 0,0 -6.93785,18.6651 -28.7305,8.35282l-57.4658 -33.6511z"/>\n  <path class="fil0" d="M104.537 93.824l0.315357 -0.559847 31.6361 -56.4205c0,0 8.42133,-18.6698 30.214,-6.87761 0,0 17.3434,13.9997 -1.976,31.4376l-60.1895 32.4203z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="folder">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M25.6467 2.49805c1.0878,0 6.35202,2.43073 15.8009,7.28155 9.44535,4.85555 18.5222,9.63078 27.2329,14.3233 8.70479,4.69138 15.2068,8.2288 19.4954,10.604l8.83353 -11.3162 43.1094 22.9785 0.970874 16.9206 15.7655 8.65282 0 77.9675c4.34177,0 7.92053,0.707486 10.7304,2.11183 2.81223,1.4067 6.54808,3.80436 11.2087,7.19651 1.15158,0.835046 3.13467,2.08112 5.94453,3.74176 2.81223,1.66301 4.86854,3.27758 6.18076,4.8461 1.30513,1.56852 1.96301,3.5953 1.96301,6.08863 0,2.49805 -0.707486,4.49885 -2.11419,5.99887 -1.40434,1.50592 -3.62601,3.05554 -6.66383,4.6524 -3.039,1.59923 -5.32327,2.91026 -6.85517,3.93546 -2.75317,2.04923 -5.53705,4.06184 -8.3481,6.04375 -2.81105,1.98663 -5.81579,2.97404 -9.01424,2.97404l-18.7974 0 -133.97 -66.1245 0 -110.827c0,-1.72679 0.631895,-3.1831 1.90041,-4.37129 1.2697,-1.18702 2.77916,-1.77994 4.53429,-1.77994 1.0382,0 2.95632,0.579926 5.75438,1.73978l0 -8.18392c0,-3.63664 2.11183,-5.45437 6.33785,-5.45437zm-12.4324 17.9919l0 0 0 106.159 125.649 62.5989 0 -101.052 -17.856 -9.80677 -5.66225 6.05674 -32.4499 -17.3116 -1.05237 -9.42527 -68.6285 -37.2192zm136.675 53.8681l0 0 -15.7277 -8.45204 -0.961425 -16.3312 -34.1778 -18.3498 -8.73314 11.3174 -66.0478 -35.1109 0 12.1962 63.3584 33.605 1.15276 11.4273 23.9978 12.5777 7.29573 -6.83627 24.6215 12.1997 0 108.183 5.22169 0 0 -116.426z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="frame">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M2.50041 127.801l0 -55.7048c0,-19.9017 3.04254,-32.8774 9.13236,-38.9294 6.08863,-6.0532 19.0856,-9.08275 38.9968,-9.08275l98.7386 0c19.9065,0 32.9046,3.02955 38.9979,9.08275 6.08863,6.05202 9.1359,19.0277 9.1359,38.9294l0 55.7048c0,19.9017 -3.04727,32.8999 -9.1359,38.9838 -6.09336,6.08509 -19.0915,9.12881 -38.9979,9.12881l-98.7386 0c-19.9112,0 -32.9081,-3.04372 -38.9968,-9.12881 -6.08981,-6.08391 -9.13236,-19.082 -9.13236,-38.9838zm48.102 43.1862l0 0 98.8968 0c18.2269,0 29.966,-2.63506 35.2078,-7.9099 5.24295,-5.27366 7.86975,-17.0222 7.86975,-35.2408l0 -55.7804c0,-18.2186 -2.62679,-29.9435 -7.86975,-35.1865 -5.24177,-5.23823 -16.9808,-7.85912 -35.2078,-7.85912l-98.8968 0c-18.2352,0 -29.9884,2.62089 -35.2621,7.85912 -5.27957,5.24295 -7.91463,16.9679 -7.91463,35.1865l0 55.7804c0,18.2186 2.63506,29.9672 7.91463,35.2408 5.27366,5.27484 17.0269,7.9099 35.2621,7.9099z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="hanger">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M195.958 158.47c-2.60908,5.09413 -5.8843,7.67841 -9.81386,7.75636l-170.687 2.54057c-1.19529,-0.0129922 -2.44136,-0.355515 -3.74531,-1.02284 -3.67916,-1.88505 -6.35084,-4.62878 -8.0162,-8.24652 -1.66655,-3.61538 -1.58978,-7.19888 0.226773,-10.7481 1.75631,-3.42522 5.05752,-6.65911 9.91071,-9.69811l80.1313 -49.8618 -0.161812 -10.1564c0.00944889,-1.19056 -0.364964,-2.05513 -1.12796,-2.59608 1.41379,0.724021 -0.122836,-0.0614178 -4.60634,-2.35868 -5.43075,-2.78152 -9.08865,-7.1351 -10.9678,-13.0619 -1.88505,-5.928 -1.38899,-11.6918 1.47993,-17.295 2.86774,-5.59729 7.25675,-9.3674 13.1741,-11.3032 5.91501,-1.93112 11.5902,-1.50828 17.0281,1.27914 4.72563,2.41892 8.33392,6.44651 10.8202,12.0745 2.48742,5.63036 2.54411,10.7717 0.167718,15.4111 -1.58505,3.09451 -3.50318,4.06302 -5.74965,2.91262 -1.06654,-0.546855 -1.60749,-2.39648 -1.62875,-5.55949 -0.0685045,-4.52956 -0.272837,-7.63589 -0.608273,-9.30598 -0.972055,-3.64491 -3.05435,-6.28942 -6.24572,-7.92408 -3.31184,-1.69726 -6.85281,-1.85435 -10.6229,-0.474807 -3.76893,1.38072 -6.44178,3.61775 -8.0292,6.71698 -3.96735,7.74573 0.0330711,14.6836 12.0084,20.8159 3.55751,1.82246 5.35752,3.41814 5.40713,4.78705l0.296459 15.6332 82.966 50.5787c9.23393,5.62918 12.0343,12.0001 8.39416,19.1068zm-11.0965 -4.84138l0 0c1.03229,-2.01498 0.00826778,-3.96381 -3.06735,-5.83942 -13.258,-7.9914 -26.5774,-16.0088 -39.9511,-24.0592 -16.3962,-9.74417 -29.7475,-17.2619 -40.0515,-22.538 -2.84412,-1.45749 -5.67524,-1.33466 -8.49337,0.367326 -14.0233,8.40007 -28.0479,16.8001 -42.0688,25.1955 -23.6742,14.3942 -36.0877,22.7175 -37.2416,24.9722 -1.15513,2.25474 0.161812,4.35122 3.952,6.29296 1.77875,0.910637 26.94,0.989772 75.4825,0.235041 27.6392,-0.526776 55.3363,-1.01694 83.0983,-1.48111 4.52484,-0.0767723 7.30636,-1.12442 8.34101,-3.1453z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="headphones">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M197.502 155.811c0,3.93192 -1.57678,7.46817 -4.71854,10.5993 -3.14294,3.14176 -6.87053,4.70673 -11.1839,4.70673l-20.0387 0 0 -66.5887c0,-19.6442 -5.55595,-36.1337 -16.656,-49.4921 -11.1131,-13.3584 -26.1805,-20.0376 -45.2023,-20.0376 -19.0336,0 -34.0054,6.58234 -44.9035,19.7387 -10.9087,13.1682 -16.3572,29.764 -16.3572,49.7909l0 66.5887 -20.6246 0c-4.32523,0 -7.95715,-1.4693 -10.8969,-4.40909 -2.95042,-2.93979 -4.41972,-6.57171 -4.41972,-10.8969l0 -35.3318c0,-4.31342 1.38663,-8.04101 4.18114,-11.1851 2.78388,-3.12876 6.55989,-4.70673 11.3399,-4.70673l12.5458 0c0,-21.6864 6.39218,-39.7302 19.2013,-54.115 12.8092,-14.3871 29.6447,-21.5919 50.5315,-21.5919 20.8868,0 37.6255,7.20478 50.2327,21.5919 12.606,14.3848 18.9143,32.4286 18.9143,54.115l11.9375 0c4.37248,0 8.1603,1.57797 11.3387,4.70673 3.17837,3.14412 4.77878,6.87171 4.77878,11.1851l0 35.3318z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="heart">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M184.285 17.634c-8.66582,-8.69653 -19.3041,-12.9698 -31.9195,-12.8363 -19.6584,0.207876 -36.4526,10.9194 -50.3543,32.1865l0.00118111 -0.158269 -3.37325 6.36147c0,0 -1.54608,-2.80514 -3.63428,-6.5847l0.0177167 0.455909c-5.13547,-10.5013 -11.6824,-18.3379 -19.6395,-23.5325 -7.95597,-5.19335 -16.7198,-7.7351 -26.2561,-7.63471 -12.5399,0.134647 -23.4758,4.1268 -32.8231,12.0119 -9.32606,7.89219 -13.9312,17.9871 -13.8013,30.2955 0.0448822,4.25673 1.36418,10.3973 3.94609,18.4194 4.64059,11.9942 17.0021,27.6097 37.0845,46.8771 20.099,19.2439 34.068,33.6074 41.9247,43.0622 7.85557,9.45244 12.9946,22.3443 15.43,38.646 1.86498,-14.3493 9.3237,-28.6786 22.3868,-42.9948 13.0631,-14.3411 27.9853,-30.1904 44.7854,-47.5728 16.8013,-17.3824 26.1604,-30.7278 28.0632,-40.0302 0.983866,-3.29176 1.43151,-7.68077 1.37245,-13.1977 -0.146458,-13.819 -4.54492,-25.0762 -13.2107,-33.7739z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="label1">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="91.6318,185.511 85.9767,196.595 83.4881,184.377 76.7002,194.785 75.3455,182.342 67.6517,192.069 67.6517,179.628 58.8288,188.45 60.1883,176.007 50.4595,184.153 52.9481,171.937 42.5413,178.949 46.1626,166.958 35.3046,173.068 40.0539,161.53 28.5179,166.508 34.3987,155.422 22.4092,159.268 29.4215,148.863 17.2053,151.577 24.8978,141.847 12.456,143.207 21.2765,134.386 8.8359,134.61 18.3368,126.692 5.89493,125.788 16.0749,118.549 3.85869,116.514 14.7167,110.404 2.72837,107.238 14.0387,102.036 2.50041,97.737 14.2655,93.8913 3.17955,88.2361 15.3946,85.5208 4.76342,78.9597 17.2053,77.6026 7.25203,69.9124 19.695,69.6856 10.4186,61.0906 23.0884,61.9942 14.7167,52.7201 27.1597,54.7563 19.695,44.5752 31.6833,47.9685 25.3502,37.1093 37.1129,41.6342 31.9101,30.3227 42.9948,35.7511 38.9235,23.9896 49.5535,30.5495 46.6138,18.3344 56.5693,26.0258 54.7575,13.5828 63.8072,22.1801 63.1292,9.73708 71.4986,19.0124 72.1766,6.57052 79.4168,16.7505 81.225,4.3087 87.5605,15.1667 90.5015,2.9516 95.9299,14.2619 100.001,2.49923 104.075,14.2619 109.503,2.9516 112.444,15.1667 118.777,4.3087 120.588,16.7505 127.828,6.57052 128.505,19.0124 136.875,9.73708 136.196,22.1801 145.246,13.5828 143.435,26.0258 153.39,18.3344 150.449,30.5495 161.082,23.9896 157.011,35.7511 168.093,30.3227 162.891,41.6342 174.655,37.1093 168.32,47.9685 180.311,44.5752 172.846,54.7563 185.287,52.7201 176.916,61.9942 189.358,61.0906 180.311,69.6856 192.752,69.9124 182.799,77.6026 195.241,78.9597 184.608,85.5208 196.824,88.2361 185.739,93.8913 197.502,97.737 185.966,102.036 197.276,107.238 185.287,110.404 196.145,116.514 183.93,118.549 194.11,125.788 181.667,126.692 191.17,134.61 178.725,134.386 187.548,143.207 175.107,141.847 182.799,151.577 170.582,148.863 177.594,159.268 165.606,155.422 171.487,166.508 159.949,161.53 164.7,173.068 153.841,166.958 157.461,178.949 147.055,171.937 149.543,184.153 139.818,176.007 141.174,188.45 132.351,179.628 132.351,192.069 124.659,182.342 123.302,194.785 116.515,184.377 114.028,196.595 108.372,185.511 104.754,197.498 100.001,185.965 95.2519,197.498 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="label2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="89.6381,175.597 78.0986,195.144 76.2148,172.536 61.3788,189.729 63.734,167.119 45.8354,181.486 52.1933,159.581 32.1747,170.652 42.3015,150.162 20.634,157.462 34.2948,139.092 11.6859,142.391 28.4081,126.848 5.56185,125.905 24.8754,113.657 2.50041,108.711 23.4604,100 2.50041,91.2846 24.8754,86.3393 5.56185,74.0923 28.4081,73.1486 11.6859,57.6075 34.2948,60.904 20.634,42.5342 42.3015,49.8346 32.1747,29.3471 52.1933,40.4141 45.8354,18.5116 63.734,32.8786 61.3788,10.2709 76.2148,27.462 78.0986,4.85319 89.6381,24.4006 95.2921,2.49687 103.299,23.9305 112.956,3.20436 116.725,25.8132 129.912,6.9721 129.674,29.816 146.161,14.0375 141.686,36.4101 160.761,23.6931 152.52,44.8893 173.245,35.705 161.47,55.2524 183.609,49.8346 168.534,67.0281 191.143,65.6155 173.245,79.7439 195.853,82.5715 175.599,93.1685 197.502,100 175.599,106.828 195.853,117.426 173.245,120.251 191.143,134.383 168.534,132.971 183.609,150.162 161.47,144.745 173.245,164.293 152.52,155.108 160.761,176.302 141.686,163.588 146.161,185.96 129.674,170.182 129.912,193.026 116.725,174.186 112.956,196.794 103.299,176.067 95.2921,197.501 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="label3">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="95.4374,166.484 81.3904,196.213 79.0506,163.206 57.9808,188.485 64.0682,156.182 37.1471,175.38 51.1929,145.649 20.5265,157.589 41.3613,132.071 8.58786,136.05 35.2739,116.622 2.50041,112.173 33.168,100.001 2.50041,87.8275 35.2739,83.3794 8.58786,63.9489 41.3613,67.9293 20.5265,42.4137 51.1929,54.3524 37.1471,24.6215 64.0682,43.8169 57.9808,11.5123 79.0506,36.7952 81.3904,3.78901 95.4374,33.5176 105.738,2.38348 112.057,34.6869 129.849,6.83037 127.977,39.8377 152.088,17.3647 142.02,48.735 171.05,33.0499 153.494,60.9052 185.329,52.9481 161.451,75.4211 194.458,75.6549 165.666,91.5728 197.502,100.001 165.666,108.428 194.458,124.345 161.451,124.582 185.329,147.055 153.494,139.095 171.05,166.951 142.02,151.266 152.088,182.635 127.977,160.162 129.849,193.17 112.057,165.312 105.738,197.618 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="lightning">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="2.50041,96.0988 81.7495,113.208 40.4176,60.9607 161.576,95.3925 160.51,78.7979 197.502,113.01 151.025,122.858 158.091,107.71 84.3148,94.6059 120.352,139.036 17.3895,129.921 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="lowast">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="196.166,71.56 172.719,30.9357 123.464,59.3709 123.464,2.49805 76.5478,2.49805 76.5478,59.3709 27.2943,30.9357 3.83743,71.56 53.0957,99.9976 3.83743,128.441 27.2943,169.07 76.5478,140.621 76.5478,197.5 123.464,197.5 123.464,140.621 172.719,169.07 196.166,128.441 146.917,99.9976 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="mail">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n    .fil1 {fill:#FEFEFE;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="187.231,177.833 188.945,177.833 190.659,177.833 192.364,177.833 194.077,176.117 195.788,174.419 197.502,172.692 197.502,170.994 197.502,169.277 197.502,167.565 197.502,165.869 197.502,164.157 197.502,162.439 197.502,160.743 195.788,159.031 194.077,157.315 194.077,155.602 192.364,155.602 190.659,153.889 188.945,153.889 187.231,153.889 12.7572,153.889 11.0505,153.889 9.34377,155.602 7.62644,155.602 5.91855,157.315 5.91855,159.031 4.20712,160.743 4.20712,162.439 2.50041,164.157 2.50041,165.869 2.50041,167.565 2.50041,169.277 4.20712,170.994 4.20712,172.692 5.91855,174.419 5.91855,176.117 7.62644,176.117 9.34377,177.833 11.0505,177.833 12.7572,177.833 "/>\n  <polygon class="fil0" points="127.372,176.117 194.077,105.995 117.093,22.1647 7.62644,141.913 38.4192,176.117 "/>\n  <polygon class="fil1" points="113.694,39.2956 23.0281,138.501 113.694,138.501 "/>\n  <polygon class="fil1" points="122.247,42.7102 122.247,102.568 178.694,102.568 "/>\n  <polygon class="fil1" points="176.981,111.12 123.946,111.12 123.946,148.765 91.4535,148.765 91.4535,169.277 123.946,169.277 "/>\n  <polygon class="fil1" points="45.2637,169.277 81.1825,169.277 81.1825,148.765 26.4545,148.765 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-drink">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231984680">\n   <g>\n    <path id="_231984992" class="fil0" d="M122.803 57.6123c15.2174,0 27.553,-12.3355 27.553,-27.5577 0,-15.2198 -12.3355,-27.5565 -27.553,-27.5565 -15.2198,0 -27.5577,12.3367 -27.5577,27.5565 0,15.2222 12.3379,27.5577 27.5577,27.5577z"/>\n    <polygon id="_231984848" class="fil0" points="17.5986,65.3285 25.5663,107.739 46.237,107.739 54.0843,65.3285 "/>\n   </g>\n   <path id="_231984776" class="fil0" d="M87.0845 196.134l0 -87.7554 -4.65949 0 -7.33116 21.1667c-2.73782,7.94416 -9.61897,13.9088 -18.3616,13.9088 0,0 -25.6018,0 -33.3699,0 -6.66619,0 -12.0698,-5.40477 -12.0698,-12.0686 0,-6.66501 5.40359,-11.9032 12.0698,-11.9032 4.20358,0 17.7899,0 30.0994,0l9.93787 -28.7258c4.09255,-15.0249 17.0328,-26.0825 33.3381,-26.0825 9.42645,0 49.3279,0 59.0072,0 19.4954,0 32.9648,15.8068 32.9648,35.3022 0,9.93315 0,78.7955 0,85.4546 0,6.66856 -5.24532,12.0686 -11.9044,12.0686 -6.66856,0 -12.0698,-5.40004 -12.0698,-12.0686 0,-7.76581 0,-77.0522 0,-77.0522l-6.21501 0 0 87.7554 -71.436 0z"/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-hand">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231992888">\n   <path id="_231992768" class="fil0" d="M118.151 34.8959c8.94456,0 16.2001,-7.25321 16.2001,-16.2025 0,-8.9481 -7.25557,-16.1954 -16.2001,-16.1954 -8.94102,0 -16.1978,7.2473 -16.1978,16.1954 0,8.94928 7.25675,16.2025 16.1978,16.2025z"/>\n   <path id="_231992744" class="fil0" d="M135.794 38.5279c-5.6091,0 -25.3219,0 -30.7857,0 -7.13273,0 -13.4458,3.6579 -17.1403,9.19141 -5.40359,8.11306 -11.1981,16.8592 -14.269,21.4927 -7.86384,0 -19.9313,0 -22.9514,0 -3.8646,0 -6.99809,3.039 -6.99809,6.89887 0,3.86342 3.13349,6.991 6.99809,6.991 4.49767,0 26.8124,-0.0413389 26.8124,-0.0413389 2.22994,-0.04252 4.39492,-1.14332 5.71422,-3.14294 2.48152,-3.75712 10.6772,-16.0572 10.6772,-16.0572l3.60357 0c0,0 0,116.606 0,124.272 0,5.17799 4.23665,9.3674 9.40401,9.3674 5.17799,0 9.3733,-4.1894 9.3733,-9.3674 0,-7.66541 0,-72.1647 0,-72.1647l3.84098 0c0,0 0,64.4993 0,72.1647 0,5.17799 4.19885,9.3674 9.37094,9.3674 5.17209,0 9.40992,-4.1894 9.40992,-9.3674 0,-7.66541 0,-124.272 0,-124.272l3.60239 0c0,0 0,40.1566 0,44.6578 0,3.85987 3.13585,6.99691 6.99336,6.99691 3.86105,0 6.90005,-3.13703 6.90005,-6.99691 0,-3.86224 0,-43.7732 0,-49.5287 0,-11.2973 -9.25283,-20.4616 -20.5561,-20.4616z"/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-run">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231999224">\n   <g>\n    <g>\n     <g>\n      <path id="_231999392" class="fil0" d="M149.594 39.4728c9.06739,0 16.4234,-7.35596 16.4234,-16.434 0,-9.06858 -7.35596,-16.4234 -16.4234,-16.4234 -9.07212,0 -16.4281,7.35478 -16.4281,16.4234 0,9.07802 7.35596,16.434 16.4281,16.434z"/>\n      <g>\n       <path id="_231998888" class="fil0" d="M93.0527 51.6807l-25.5687 29.5266c-1.51891,1.84962 -3.8079,3.01774 -6.38155,3.01774 -4.56972,0 -8.27369,-3.70633 -8.27369,-8.26542 0,-2.47207 1.08072,-4.68547 2.79215,-6.19847l27.5553 -31.7211c1.51891,-1.8319 3.81381,-3.01302 6.38627,-3.01302l39.8932 0c2.92325,0 5.56776,1.16812 7.49179,3.04845l25.4447 25.427 21.0746 -21.045c1.4882,-1.25316 3.39688,-2.00435 5.48981,-2.00435 4.72208,0 8.54534,3.82798 8.54534,8.54416 0,2.05632 -0.726384,3.93428 -1.92521,5.40595l-25.427 25.6065c-7.71738,7.7103 -13.9194,1.17875 -13.9194,1.17875l-15.5895 -15.684 -24.3817 28.192 22.3325 22.3289c0,0 4.69019,4.36303 2.02915,13.0725l-12.5316 55.8016c-0.995677,4.84256 -5.27484,8.48274 -10.4127,8.48274 -5.86422,0 -10.6217,-4.75752 -10.6217,-10.6217 0,-0.927173 0.120473,-1.82364 0.338979,-2.68112l10.2828 -45.7622 -25.375 -24.6781 -21.8175 24.3427c0,0 -3.52207,4.36303 -12.906,4.02641l-44.261 0.0661423c-4.94059,0.0921267 -9.42881,-3.28821 -10.5544,-8.29613 -1.27914,-5.72839 2.23703,-11.3328 7.96069,-12.6143 0.902369,-0.197246 1.80474,-0.281105 2.68703,-0.250396l38.072 0.102757 56.293 -65.2623 -14.7226 -0.0732289z"/>\n       <path id="_231999032" class="fil0" d="M92.3015 109.639c-0.00472445,0 -0.00472445,0 -0.00472445,0 0,0 0,0 0.00472445,0zm0 0c-0.00472445,0 -0.00472445,0 -0.00472445,0l0.00472445 0c0,0 0,0 -0.00472445,0 0.00472445,0 0.00472445,0 0.00472445,0z"/>\n      </g>\n     </g>\n    </g>\n   </g>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-woman">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:white;stroke-width:0.900007}\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231994136">\n   <g>\n    <g>\n     <path id="_231990656" class="fil0" d="M41.6743 35.0507c8.74023,0 15.8234,-7.08903 15.8234,-15.8257 0,-8.73905 -7.08313,-15.8269 -15.8234,-15.8269 -8.74023,0 -15.8234,7.08785 -15.8234,15.8269 0,8.73668 7.08313,15.8257 15.8234,15.8257z"/>\n     <path id="_231988640" class="fil0" d="M59.1536 39.1007c11.1887,0 20.3647,9.07684 20.3647,20.2702 0,5.70477 0,45.246 0,49.0716 0,3.8268 -3.00829,6.92604 -6.83509,6.92604 -3.82798,0 -6.92958,-3.09924 -6.92958,-6.92604 0,-4.45988 0,-44.2421 0,-44.2421l-3.5705 0c0,0 0,115.523 0,123.114 0,5.12721 -4.20003,9.28472 -9.3237,9.28472 -5.12366,0 -9.28472,-4.15751 -9.28472,-9.28472 0,-7.591 0,-71.4891 0,-71.4891l-3.80318 0c0,0 0,63.8981 0,71.4891 0,5.12721 -4.15988,9.28472 -9.28236,9.28472 -5.12484,0 -9.3237,-4.15751 -9.3237,-9.28472 0,-7.591 0,-123.114 0,-123.114l-3.5705 0c0,0 0,39.7822 0,44.2421 0,3.8268 -3.10278,6.92604 -6.92958,6.92604 -3.8268,0 -6.83509,-3.09924 -6.83509,-6.92604 0,-3.82562 0,-43.3669 0,-49.0716 0,-11.1934 9.16897,-20.2702 20.3647,-20.2702 5.41185,0 29.4002,0 34.9585,0z"/>\n    </g>\n   </g>\n  </g>\n  <g id="_231990440">\n   <g>\n    <g>\n     <g>\n      <path id="_231990008" class="fil0 str0" d="M151.032 34.4743c-8.90558,0 -16.1198,-7.15636 -16.1198,-15.9863 0,-8.83117 7.21423,-15.9899 16.1198,-15.9899 8.90086,0 16.1151,7.15872 16.1151,15.9899 0,8.82999 -7.21423,15.9863 -16.1151,15.9863z"/>\n     </g>\n     <path id="_231990392" class="fil0 str0" d="M138.732 37.9952c0,0 -14.7922,-0.551579 -19.8616,17.1131l-12.697 44.1972c-1.21064,4.13153 1.07481,7.28864 4.68075,8.32447 3.6083,1.0382 7.29809,-0.781896 8.2477,-4.08901l12.345 -43.0834 3.36735 -0.00472445 -21.4088 74.6037 20.1462 0.00236222 0.0141733 0.0141733 0 54.7575c0,4.16814 3.57404,7.65006 7.93116,7.66778 3.84452,0.0129922 7.89927,-3.88231 7.89927,-8.05164l0 0.0153545 0 -54.4055 3.22562 0 0 54.4055 0 -0.0153545c0,4.16932 4.06066,8.06463 7.89809,8.05164 4.36775,-0.0177167 7.93825,-3.49963 7.93825,-7.66778l0 -54.7575 0.0129922 -0.0141733 20.1509 -0.00236222 -21.4076 -74.6037 3.36262 0.00472445 12.3414 43.0834c0.943708,3.30711 4.63823,5.12721 8.24298,4.08901 3.61302,-1.03583 5.89375,-4.19295 4.68193,-8.32447l-12.6934 -44.1972c-5.07051,-17.6647 -19.8616,-17.1131 -19.8616,-17.1131l-24.5565 0z"/>\n    </g>\n   </g>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="mark">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M62.8977 158.334c8.60558,-19.3572 17.8761,-38.0247 27.8152,-56.0107 9.93315,-17.9789 20.6258,-35.0483 32.0719,-51.2095 11.4473,-16.1564 20.1887,-27.2364 26.2183,-33.2329 6.02958,-5.99178 10.2036,-9.50204 12.5103,-10.519 2.30553,-1.01812 7.40675,-2.08702 15.3048,-3.19609 7.89691,-1.10788 13.3088,-1.66773 16.2391,-1.66773 1.86143,0 2.79451,0.715754 2.79451,2.13191 0,0.889377 -0.334255,1.75159 -0.996858,2.59608 -0.670871,0.843314 -2.59608,2.68585 -5.7839,5.51933 -16.0419,14.9139 -33.6782,36.9239 -52.9126,66.0277 -19.2356,29.1038 -35.32,59.6757 -48.2543,91.7039 -5.23114,12.7808 -8.82527,20.4592 -10.7706,23.0281 -1.9512,2.66104 -8.10951,3.99452 -18.4738,3.99452 -7.44809,0 -11.9056,-0.753549 -13.3678,-2.25474 -1.46222,-1.5071 -4.40555,-5.62327 -8.83826,-12.3485 -7.26502,-11.2336 -15.6462,-21.8565 -25.1282,-31.8605 -4.78586,-5.04335 -7.17525,-8.85007 -7.17525,-11.4154 0,-3.54215 2.60199,-7.15045 7.82014,-10.8213 5.21697,-3.6709 9.54574,-5.50752 12.9993,-5.50752 4.41854,0 9.8552,2.43545 16.3088,7.30518 6.45478,4.86972 13.656,14.1131 21.6191,27.7372z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="monster">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!-- Created with Inkscape (http://www.inkscape.org/) -->\n\n<svg\n   xmlns:dc="http://purl.org/dc/elements/1.1/"\n   xmlns:cc="http://creativecommons.org/ns#"\n   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n   xmlns:svg="http://www.w3.org/2000/svg"\n   xmlns="http://www.w3.org/2000/svg"\n   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"\n   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"\n   width="200"\n   height="200"\n   id="svg2"\n   version="1.1"\n   inkscape:version="0.48.4 r9939"\n   sodipodi:docname="monster.svg">\n  <defs\n     id="defs4" />\n  <sodipodi:namedview\n     id="base"\n     pagecolor="#ffffff"\n     bordercolor="#666666"\n     borderopacity="1.0"\n     inkscape:pageopacity="0.0"\n     inkscape:pageshadow="2"\n     inkscape:zoom="0.63516094"\n     inkscape:cx="325.30097"\n     inkscape:cy="299.43109"\n     inkscape:document-units="px"\n     inkscape:current-layer="layer1"\n     showgrid="false"\n     inkscape:window-width="1366"\n     inkscape:window-height="684"\n     inkscape:window-x="-8"\n     inkscape:window-y="-8"\n     inkscape:window-maximized="1" />\n  <metadata\n     id="metadata7">\n    <rdf:RDF>\n      <cc:Work\n         rdf:about="">\n        <dc:format>image/svg+xml</dc:format>\n        <dc:type\n           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />\n        <dc:title></dc:title>\n      </cc:Work>\n    </rdf:RDF>\n  </metadata>\n  <g\n     inkscape:label="Layer 1"\n     inkscape:groupmode="layer"\n     id="layer1"\n     transform="translate(0,-852.36218)">\n    <path\n       style="fill:#552200"\n       d="m 133.82196,859.03231 c -0.81806,0 -1.63621,0.047 -1.63621,0.15289 -1.30942,4.95455 -3.31364,9.70355 -5.35945,14.43293 -0.53584,1.18089 -1.07265,2.36425 -1.60282,3.54707 -0.54524,-0.33448 -1.08325,-0.60291 -1.56943,-0.68801 -1.09376,-0.19145 -2.04238,-0.28781 -2.93851,-0.30578 -0.47703,-0.11201 -0.96839,-0.20484 -1.45256,-0.29049 -0.98451,-0.17416 -1.97757,-0.23322 -2.9719,-0.35165 -0.91158,0.003 -1.82699,-0.044 -2.73816,-0.0306 -0.30372,0.004 -0.61516,0.0111 -0.91828,0.0306 -1.91918,0.123 -5.00046,0.74288 -6.8287,1.13139 -2.70928,0.57575 -5.38763,1.21434 -8.080899,1.84998 -1.477349,0.34868 -2.949497,0.71319 -4.424459,1.07024 -3.646652,0.79377 -5.079802,1.13744 -8.715353,1.78883 -2.324435,0.41647 -4.656999,0.75735 -6.995656,1.05495 -0.217223,0.0276 -0.433795,0.0493 -0.651145,0.0764 -1.060938,0.13255 -2.124987,0.25495 -3.188953,0.38223 -1.053349,0.12601 -2.102793,0.26748 -3.155555,0.39752 -1.073071,0.18806 -2.161088,0.32797 -3.222344,0.5657 -3.940736,0.88274 -7.650379,2.31842 -11.152981,4.12806 -2.148524,-3.67009 -4.191057,-7.3927 -6.194244,-11.13048 -0.06091,-0.20133 -3.166383,0.59371 -3.105471,0.79504 0.942632,3.43376 2.294184,6.77323 3.95697,9.9685 0.456256,0.87675 0.948287,1.73653 1.435865,2.59915 -0.435414,0.26944 -0.873877,0.53088 -1.302295,0.81032 -0.556685,0.38735 -1.128879,0.76315 -1.686303,1.14668 -2.376389,-1.27223 -4.711264,-2.59791 -6.97896,-4.03632 -1.01325,-0.60868 -2.036907,-1.195 -3.038689,-1.81941 -3.02836,-1.88755 -5.994883,-3.95077 -9.316408,-5.39705 -0.168924,-0.14275 -2.372812,2.05889 -2.203883,2.20163 3.762414,2.7254 7.533429,5.44069 11.386726,8.05736 2.033834,1.41169 4.148966,2.70575 6.311116,3.9293 -1.810715,1.4663 -3.607057,2.94988 -5.593188,4.2198 -0.707248,0.56997 -1.269638,0.96051 -1.803176,1.69709 -1.421961,1.96311 -2.00397,4.30198 -2.654675,6.58961 -0.156145,0.37458 -0.304877,0.76425 -0.450792,1.14668 -0.09937,0.33809 -0.218357,0.66715 -0.300532,1.00908 -0.03645,0.15171 -0.05563,0.30543 -0.08348,0.45868 -0.03337,0.0861 -0.0654,0.17452 -0.100174,0.25991 -0.05377,0.20046 -0.14089,0.51318 -0.200354,0.73388 -0.0057,0.0157 -0.0112,0.03 -0.01668,0.0458 -0.140484,0.40396 -0.240154,0.83659 -0.333919,1.23842 -0.01761,0.0754 -0.03175,0.15708 -0.05009,0.22934 -0.611364,2.27178 -1.309648,4.83027 -1.702997,6.62019 -0.06898,0.3139 -0.134642,0.63348 -0.200353,0.94792 -0.002,0.005 0.002,0.0105 0,0.0153 -0.179796,0.48396 -0.291908,1.05168 -0.384009,1.48305 -0.26244,1.2291 0.05656,0.75197 -0.317226,1.25371 -0.287533,0.86513 -0.55989,1.75435 -0.734631,2.64501 -0.08057,0.41069 -0.07942,0.82894 -0.166957,1.23842 -0.05525,0.2584 -0.182672,0.51277 -0.267141,0.76446 l -0.200354,0.9785 c -0.451393,1.62229 -0.43492,3.28227 -0.333919,4.93838 -0.0034,0.10426 0.197203,0.20242 0.534273,0.2905 -0.07917,1.08288 -0.15113,2.17228 -0.200354,3.25658 -0.154593,2.83382 -0.158894,5.65146 -0.283829,8.48546 -0.108223,2.45502 -0.178161,2.91621 -0.317226,5.45821 -0.06629,1.21158 -0.124931,2.41162 -0.18366,3.62352 -0.321228,11.39655 -0.03621,22.80675 1.001767,34.17115 0.46586,5.7036 0.462088,5.4973 0.434098,5.2136 -0.0088,0.012 0.03743,0.8098 0.333919,4.8925 0.287387,3.95736 0.71286,7.91326 0.834806,11.87966 0.03606,1.1727 0.01076,2.3432 0.01668,3.5165 0.0181,5.1421 0.01707,10.2876 0.233744,15.4267 0,0.028 0.104446,0.047 0.267137,0.061 -10e-6,0.2196 9e-6,0.4377 0,0.6574 -5e-6,0.1505 0.438369,0.2852 1.118634,0.3822 0.06176,0.4213 0.34094,1.3521 0.434099,1.3301 0.188998,0.044 0.377824,0.082 0.567669,0.1224 -0.0039,0.04 -4.9e-4,0.069 0.01668,0.076 0.367178,0.1045 0.729132,0.2349 1.101941,0.3211 2.168271,0.5015 4.408808,0.8129 6.611649,1.1467 3.912159,0.5927 2.502625,0.3777 6.611645,0.902 1.2372,0.1586 2.467648,0.3422 3.706531,0.4893 2.712666,0.3221 5.433218,0.5776 8.147684,0.8867 4.501301,0.5126 8.992152,1.1018 13.49043,1.636 9.618603,1.1824 19.257496,2.2198 28.917601,3.0731 8.15861,0.6479 16.32905,1.1857 24.49315,1.7735 6.29065,0.5303 12.60343,0.3565 18.89996,0.046 4.34384,-0.011 8.63826,-0.6124 12.93946,-1.0855 2.37464,-0.2969 4.76374,-0.1257 7.14592,-0.046 1.1456,0.069 2.29196,0.075 3.43939,0.076 0.23676,0.06 1.17175,-3.013 0.93499,-3.073 -0.92493,-0.038 -1.8468,-0.082 -2.77156,-0.1224 0.0498,-0.2246 0.10452,-0.4485 0.15027,-0.6727 0.24123,-0.013 0.4341,-0.041 0.4341,-0.076 0.0404,-0.7207 0.009,-1.4384 -0.0501,-2.1557 0.29341,-2.0777 0.42234,-4.1737 0.4341,-6.2685 -0.0729,-1.5532 -0.0154,-0.8105 -0.15027,-2.2017 -0.001,-0.022 -0.0807,-0.038 -0.18365,-0.046 0.008,-0.082 0.005,-0.1633 0.0167,-0.2446 0.1292,-1.7339 0.32168,-3.4658 0.0501,-5.1983 -0.089,-0.6146 -0.20185,-1.2345 -0.30052,-1.85 -0.0121,-0.122 -0.0336,-0.245 -0.0501,-0.3669 -0.0186,-0.117 -0.0317,-0.2347 -0.0501,-0.3516 -0.29608,-1.8892 -0.52862,-3.7801 -0.4174,-5.6876 0.0411,-0.1128 0.0393,-0.1264 0.10018,-0.2905 0.12459,-0.4607 0.27397,-0.9091 0.36731,-1.376 0.18079,-0.9043 0.28413,-1.8407 0.26713,-2.7673 0.0409,-0.1636 0.0674,-0.284 0.11688,-0.474 0.88606,-3.4012 2.24785,-6.692 3.08877,-10.10606 0.46661,-2.1215 0.8848,-3.7588 1.11864,-5.9322 0.13302,-1.2363 0.19911,-2.4743 0.23374,-3.7153 2.9e-4,-0.01 0.0164,-0.02 0.0167,-0.031 0.10416,-0.3593 0.18458,-0.7491 0.28383,-1.4525 0.1174,-0.8322 -0.0899,-1.8852 0.0167,-2.7368 0.0238,-1.4744 0.0554,-2.944 0.0167,-4.4185 -0.0425,-1.2452 -0.13095,-2.4855 -0.16696,-3.7306 0.072,-1.4801 0.5237,-2.9216 0.60106,-4.4032 0.0665,-1.7837 -0.0294,-3.5988 -0.65115,-5.2748 0.0376,-7.7577 -0.13145,-15.52017 -1.53604,-23.19355 -0.33857,-1.80339 -0.62015,-3.61921 -1.01846,-5.41234 -1.78526,-8.03699 -4.7823,-15.79486 -7.06244,-23.71342 -0.60593,-2.20933 -0.86288,-3.10561 -1.11864,-4.03633 -0.0443,-0.24825 -0.0992,-0.50893 -0.18365,-0.82561 -0.0649,-0.2434 -0.14627,-0.48649 -0.23375,-0.71859 -0.004,-0.0107 -0.0126,-0.0199 -0.0167,-0.0306 -0.22548,-0.81695 -0.40778,-1.50512 -0.90159,-3.28716 -1.06867,-3.8565 -2.05193,-7.85405 -4.02375,-11.43625 -0.55253,-1.00378 -1.29339,-1.91704 -1.93675,-2.87436 -2.10552,-2.20711 -2.39203,-2.8456 -5.15909,-4.40326 -0.99879,-0.56226 -2.06928,-0.99783 -3.13886,-1.43718 0.28238,-0.48877 0.57151,-0.97783 0.8515,-1.46775 1.51104,-2.64404 3.05495,-5.31553 4.2742,-8.08795 0.18587,-0.42266 0.31981,-0.85421 0.48418,-1.28428 0.0885,-0.19757 -2.96683,-1.34425 -3.05538,-1.14668 -2.47168,3.39161 -4.80968,6.84404 -7.07914,10.35073 -1.26372,-0.41494 -2.53971,-0.83043 -3.8067,-1.23842 1.19638,-2.82479 2.37278,-5.65523 3.47278,-8.51604 0.0356,-0.0925 1.61082,-4.15435 1.75309,-4.57144 0.13204,-0.38712 0.20764,-0.78432 0.31723,-1.17727 0.0885,-0.19757 -2.96683,-1.34424 -3.05539,-1.14668 -2.69635,4.4572 -4.86236,9.16139 -7.02905,13.85194 -1.89719,-0.67324 -1.50824,-0.54184 -4.37437,-1.62065 0.59021,-1.43032 1.17551,-2.85593 1.73639,-4.29624 1.89507,-5.09005 3.88185,-10.30669 3.94027,-15.74779 0,-0.10594 -0.81815,-0.15289 -1.63621,-0.15289 z m -19.81824,18.30107 c 0.26223,-0.001 0.52206,-0.01 0.78471,0 -0.34018,0.11727 -0.65236,0.26353 -0.96837,0.41281 -0.82479,-0.0361 -1.64721,-0.0925 -2.47102,-0.1376 0.72758,-0.11395 1.43948,-0.21319 2.07031,-0.25992 0.19487,-0.0144 0.38899,-0.0143 0.58437,-0.0153 z m 0.8181,0.0153 c 0.0781,0.003 0.15562,-0.003 0.23375,0 -0.0891,0.0375 -0.17076,0.0832 -0.26714,0.0917 -0.0318,0.003 0.006,-0.0534 0.0334,-0.0917 z m 31.18828,9.72387 c 2.07992,0.8314 3.74753,1.55946 5.47631,2.99667 0.78047,0.64883 1.39015,1.4468 2.08701,2.17106 0.11324,0.17089 0.23268,0.336 0.35062,0.50454 -0.24717,-0.22658 -0.52039,-0.42936 -0.83481,-0.59628 l -1.13533,-0.82561 c -0.0691,4.9e-4 -0.13857,0.0284 -0.20035,0 -0.25506,-0.11733 -0.4395,-0.47034 -0.71793,-0.41281 -0.21345,0.0441 0.27114,0.30928 0.36731,0.48925 0.002,0.003 -3.6e-4,0.0109 0,0.0153 -0.0797,-0.0345 -0.15652,-0.0703 -0.23374,-0.10703 -0.16655,-0.1625 -0.32018,-0.32441 -0.48419,-0.48925 0.008,0.0813 0.0144,0.0916 0.0167,0.12232 -0.0806,-0.13525 -0.12617,-0.31152 -0.0835,-0.55041 -0.54876,-0.38827 -1.04143,-0.81974 -1.60282,-1.19255 -0.0185,-0.0123 -0.0457,-0.0229 -0.0668,-0.0306 -0.23299,-0.25656 -0.47204,-0.50311 -0.73464,-0.73388 -0.35736,-0.31404 -0.81418,-0.53346 -1.21881,-0.79503 -0.34779,-0.15521 -0.67957,-0.3425 -1.01846,-0.51983 0.009,-0.0161 0.024,-0.0298 0.0334,-0.0459 z m 24.76028,75.58936 c 9.8e-4,0.077 0.0158,0.1529 0.0167,0.2294 -0.009,-0.051 -0.0242,-0.1017 -0.0334,-0.1529 0.008,-0.025 0.009,-0.052 0.0167,-0.077 z"\n       id="path2991"\n       inkscape:connector-curvature="0" />\n    <path\n       style="fill:#000000"\n       d="m 64.168729,920.11133 c -0.688284,-0.0205 -1.371069,0.0536 -2.052141,0.23376 -0.319809,0.0846 -0.626595,0.19753 -0.940567,0.2987 -0.628483,0.29577 -1.233761,0.65021 -1.795622,1.05193 -0.264715,-0.46301 -0.538197,-0.86459 -0.612793,-0.83116 -2.3508,0.49469 -4.037339,1.66937 -5.401118,3.46749 -0.294006,0.38765 -0.543368,0.8053 -0.812304,1.20777 -0.815055,1.63764 -1.387386,3.49884 -0.769554,5.28565 0.379732,1.09821 0.715648,1.31082 1.496352,2.1688 0.37436,0.23751 0.718475,0.52719 1.125826,0.71428 1.914579,0.87931 4.708426,0.59373 6.71221,0.15584 0.510026,-0.11146 1.009341,-0.27494 1.510604,-0.41558 1.696372,-0.48082 3.354706,-1.15633 4.745575,-2.18179 0.771046,-0.56848 0.968982,-0.8283 1.610362,-1.49349 1.000695,-1.14051 1.92724,-2.35975 1.995134,-3.87007 0.01194,-0.26563 -0.02862,-0.52666 -0.04276,-0.7922 -0.330573,-2.09967 -1.568541,-3.1185 -3.448735,-4.19475 -1.032468,-0.48331 -2.173344,-0.77094 -3.320477,-0.80518 z m -8.450829,6.29861 c -0.108814,0.28165 -0.210231,0.55376 -0.285018,0.83116 -0.02911,0.0574 -0.05583,0.11004 -0.08551,0.16883 -0.292186,0.74824 -0.595644,1.62496 -0.669795,2.48049 -0.195451,-1.03734 0.307905,-2.12852 0.74105,-3.05191 0.09185,-0.13633 0.203152,-0.28361 0.29927,-0.42857 z m 5.41537,2.02595 c 0.197203,-0.0118 0.389396,0.0251 0.584289,0.052 -0.06858,0.0925 -0.138747,0.18423 -0.213764,0.27272 -0.07443,0.003 -0.15363,0.009 -0.228016,0.013 -0.07507,0.004 -0.17089,0.0576 -0.228015,0.013 -0.09187,-0.0717 -0.08248,-0.19515 -0.01424,-0.33766 0.03234,-0.004 0.06777,-0.0111 0.09976,-0.013 z"\n       id="path3107"\n       inkscape:connector-curvature="0" />\n    <path\n       style="fill:#333333"\n       id="path3148"\n       d="m 56.55501,928.59801 c 1.547786,0.39757 2.83969,1.31792 4.398944,1.67258 0.162535,0.006 0.326004,0.0348 0.487598,0.0179 0.09038,-0.009 -0.274788,0.042 -0.269244,-0.0408 0.0057,-0.0861 0.187598,-0.0298 0.276026,-0.0605 0.484466,-0.16841 0.938776,-0.41566 1.363691,-0.68239 0.552932,-0.40462 1.147632,-0.75828 1.724103,-1.1342 0.14317,-0.12403 2.067895,1.72108 1.924726,1.84511 l 0,0 c -0.552889,0.33243 -1.053555,0.72824 -1.576829,1.09638 -0.21506,0.16216 -0.414768,0.34289 -0.645171,0.48649 -0.464148,0.28927 -1.764393,0.89677 -2.277046,0.96073 -0.983102,0.12266 -1.481997,0.002 -2.362371,-0.13333 -1.744192,-0.48493 -3.411836,-1.24892 -4.926016,-2.16973 -0.144182,-0.12125 1.737406,-1.97945 1.881589,-1.85821 z"\n       inkscape:connector-curvature="0" />\n    <g\n       id="g3234"\n       transform="matrix(0.48925166,0,0,0.48925166,-56.824832,738.03426)">\n      <path\n         inkscape:connector-curvature="0"\n         id="path3109"\n         d="m 404.91414,367.82749 c -2.99858,0.10484 -5.80413,1.23152 -9.05884,2.30936 -1.96812,0.82127 -3.93068,1.7216 -5.7965,2.78715 -3.20302,0.72146 -6.2147,2.17099 -8.65105,4.22054 -0.7505,0.63135 -1.3712,1.36342 -2.06809,2.04391 -0.60209,0.79174 -1.29407,1.51964 -1.80594,2.36244 -2.73717,4.50669 -2.42491,8.67714 -1.3399,13.51104 1.08015,3.21921 3.13584,6.04226 6.67034,7.37931 2.74829,1.03965 4.32659,0.78295 7.4568,0.90251 5.97454,-0.50509 12.04636,-2.35813 17.0982,-5.3354 1.09377,-0.64461 2.09885,-1.41736 3.14583,-2.12354 3.60458,-2.47829 6.62741,-5.53497 7.86459,-9.58249 0.68739,-2.24884 0.50571,-2.98431 0.49518,-5.28232 -0.49373,-4.19006 -2.5111,-8.05587 -6.14603,-10.75043 -0.65941,-0.48882 -1.39087,-0.86975 -2.09723,-1.30067 -2.07794,-0.88935 -3.96822,-1.20431 -5.76736,-1.14141 z m 0.37866,17.22725 c -0.0483,0.054 -0.0966,0.10562 -0.14564,0.15926 -0.12651,0.098 -0.25026,0.19602 -0.37866,0.29199 -0.09,-0.0776 -0.17215,-0.17084 -0.26216,-0.2389 0.13333,-0.0248 0.27556,-0.0265 0.4078,-0.0531 0.12432,-0.0528 0.25462,-0.10592 0.37866,-0.15926 z m -9.17535,2.2828 c 0.10191,0.0965 0.19338,0.19338 0.29128,0.29199 -0.0502,0.0918 -0.0938,0.16955 -0.14564,0.26544 -0.0238,0.0637 0.17972,0.18529 0.46605,0.31854 0.13046,0.36025 0.23474,0.80559 0.0291,1.00868 -0.17206,0.16996 -0.40442,0.28993 -0.61169,0.42471 -0.20402,0.0497 -0.40539,0.11555 -0.61169,0.15926 0.0191,0.0223 0.0584,0.032 0.0873,0.0531 -0.32843,0.1378 -0.65639,0.27042 -0.99036,0.39817 -0.0226,-0.0446 -0.04,-0.0831 -0.0582,-0.13273 0.47617,-0.90644 0.98446,-1.84592 1.54379,-2.78715 z"\n         style="fill:#000000" />\n      <path\n         inkscape:connector-curvature="0"\n         d="m 387.47176,389.522 c 2.75597,1.51852 5.2175,3.6319 8.40971,4.39336 0.45569,0.1087 0.93177,0.12674 1.39766,0.19011 -0.23004,-0.0711 -0.75796,-6.6e-4 -0.69011,-0.2132 0.082,-0.25692 0.5689,-0.14056 0.83753,-0.24857 0.33944,-0.1365 0.6726,-0.29181 0.97932,-0.48203 0.76698,-0.47567 1.42703,-1.39204 2.05036,-1.9978 0.65696,-0.74418 1.42867,-1.38629 2.2023,-2.02573 0.2745,-0.2721 4.49721,3.26568 4.2227,3.53779 l 0,0 c -0.75104,0.47662 -1.29769,0.83664 -1.76384,1.60572 -0.99719,0.96669 -1.73597,2.13904 -2.86003,3.00361 -0.46827,0.36016 -1.00951,0.63761 -1.55008,0.90056 -2.65535,1.29164 -2.20977,0.83395 -5.90314,0.99707 -0.73972,-0.15758 -1.49575,-0.26141 -2.21916,-0.47271 -3.77953,-1.10399 -6.9358,-3.41177 -9.64236,-5.98666 -0.24842,-0.29184 4.28072,-3.49337 4.52914,-3.20152 z"\n         id="path3150"\n         style="fill:#333333" />\n    </g>\n    <g\n       id="g3238"\n       transform="matrix(0.48925166,0,0,0.48925166,-60.738846,720.4212)">\n      <path\n         inkscape:connector-curvature="0"\n         id="path3115"\n         d="m 405.99256,468.69494 c -1.5568,0 -3.09375,0.0923 -3.09375,0.3125 -0.0809,0.79703 -0.1848,1.60778 -0.25,2.40625 -0.0116,0.14247 -0.0207,0.15079 -0.0312,0.28125 -4.2277,-0.81008 -8.48043,-1.66818 -12.8125,-1.25 -2.52171,0.0179 -4.96088,0.0545 -7.34375,-0.1875 -6.63089,-0.19542 -13.24115,-0.348 -19.875,-0.0937 -4.7176,0.07 -9.43886,0.21349 -14.15625,0.0625 -6.12407,-0.23012 -12.24579,-0.34315 -18.375,-0.28125 -6.37111,0.10777 -12.75556,0.23646 -19.125,0.375 -5.67281,-0.0982 -11.3269,-0.32425 -17,-0.40625 -9.52916,-0.24101 -19.09307,-0.3925 -28.625,-0.25 -4.84991,0.25024 -9.80833,0.49228 -14.34375,2.40625 -0.0957,0.055 0.0295,0.45497 0.28125,1 -1.12014,0.0739 -2.22531,0.17969 -3.34375,0.28125 -0.17017,0.0437 -0.0119,1.08703 0.25,2.25 -1.7389,-0.0428 -3.78125,0.0593 -3.78125,0.3125 -0.66721,6.01703 -0.86651,12.06985 -0.96875,18.125 -0.0935,0.51179 -0.13381,1.028 -0.125,1.5625 -0.1647,0.25152 -0.32445,0.50303 -0.4375,0.78125 -1.03376,2.54406 -0.0616,6.82468 0.4375,9.625 -0.0718,9.85404 0.25265,19.71206 0.46875,29.5625 0.14008,3.19573 0.0533,6.39196 0.0625,9.59375 -0.29682,2.11609 -0.77885,4.20348 -1.28125,6.28125 -0.12898,0.53346 -0.35919,1.22102 -0.53125,1.90625 -0.2044,0.40246 -0.37395,0.80317 -0.21875,1.09375 -0.0202,0.20998 -0.0162,0.4066 0,0.59375 0.38984,0.0695 0.76768,0.18268 1.15625,0.28125 0.55128,0.30153 1.16776,0.51354 1.78125,0.71875 0.66749,3.60866 1.45636,7.17037 2.5,10.6875 0.421,1.39177 0.44526,2.8134 0.34375,4.25 -0.0294,0.41601 -0.11175,0.83335 -0.0937,1.25 0.0212,0.48869 0.14335,0.9542 0.21875,1.4375 0.0204,0.18054 1.15785,0.17512 2.40625,0.0625 0.11516,0.85518 0.31447,1.68147 0.46875,2.53125 1.28252,2.69171 1.26386,3.83997 6.6875,2.0625 1.0564,-0.34621 1.10732,-1.92328 1.5625,-2.9375 0.20479,-0.45631 0.38048,-0.90971 0.5625,-1.375 7.82665,0.53064 15.69057,0.55258 23.53125,0.65625 11.48504,0.0293 22.95316,-0.0995 34.4375,-0.1875 4.30835,-0.0644 8.62885,-0.0831 12.9375,-0.0937 3.07353,1.17491 6.3604,1.716 9.6875,1.625 1.40675,-0.0385 2.81663,-0.22339 4.21875,-0.34375 0.12127,-0.10038 0.28971,-0.19596 0.4375,-0.28125 0.64913,-0.0729 1.27294,-0.43739 2.03125,-0.96875 7.18733,0.52981 14.35677,1.26298 21.5625,1.5 5.40669,0.20199 10.78504,-0.32223 16.15625,-0.84375 2.33875,-0.0882 4.27075,-0.0469 6.625,0 0.0835,1.4339 0.25406,2.87032 0.59375,4.28125 0.34113,0.54094 0.39174,1.62535 1.03125,1.625 1.88316,-10e-4 3.77266,-0.71943 5.40625,-1.65625 0.58517,-0.33559 0.51313,-1.23253 0.71875,-1.875 0.2447,-0.7646 0.44444,-1.53903 0.625,-2.3125 0.73233,-0.002 1.45518,0.004 2.1875,0 1.27321,1.9e-4 2.54734,0.0211 3.8125,-0.125 0.41781,-0.11025 -1.14469,-6.0165 -1.5625,-5.90625 -0.77448,-0.0732 -1.53855,-0.0645 -2.3125,-0.0625 -0.34441,-0.2449 -0.71938,-0.51412 -1,-0.6875 0.0239,-0.15509 0.0384,-0.31362 0.0625,-0.46875 2.138,-0.25277 1.8497,-0.49945 2.84375,0.75 -0.53739,-1.14046 -0.25525,-3.46209 -0.25,-4.5 0.51725,-4.74151 1.47647,-9.44575 1.6875,-14.21875 0.0656,-5.32425 -0.36204,-10.65333 0,-15.96875 0.41879,-2.61298 0.81247,-5.22874 1.21875,-7.84375 0.29264,-1.22845 0.60058,-2.44857 0.84375,-3.6875 0.32891,-1.67577 0.92751,-4.91895 0.71875,-6.90625 -0.0349,-0.33219 -0.0491,-0.91893 -0.34375,-0.96875 0.74733,-5.92432 1.42138,-11.85114 1.84375,-17.8125 0.30696,-5.75736 0.69331,-11.54606 0.65625,-17.3125 0.59218,10e-4 1.18906,0.0313 1.78125,0.0312 2.00054,-0.005 0.9858,-0.0242 2.96875,-0.0312 0.13676,-0.0351 0.0389,-0.7145 -0.125,-1.5625 0.0711,-0.004 0.042,0.004 0.125,0 0.42092,-0.13531 -1.48533,-6.07281 -1.90625,-5.9375 -1.75406,0.15377 -0.89481,0.0845 -2.59375,0.25 -0.22549,0.0189 -0.38984,0.0154 -0.59375,0.0312 -0.0885,-1.0593 -0.17774,-2.12977 -0.3125,-3.1875 0,-0.22017 -1.5682,-0.3125 -3.125,-0.3125 z m -58.84375,11.15625 c 0.26051,-0.002 0.52074,0.002 0.78125,0 -0.21629,0.0689 -0.42116,0.13668 -0.625,0.21875 -0.68799,-0.0661 -1.37359,-0.12973 -2.0625,-0.1875 0.63565,-0.007 1.27059,-0.0262 1.90625,-0.0312 z m 44.625,60.9375 c 0.0172,0.23917 0.0434,0.47975 0.0625,0.71875 -0.0492,0.0746 -0.10682,0.14434 -0.15625,0.21875 -0.1518,-0.11322 -0.29524,-0.22503 -0.4375,-0.3125 0.17294,-0.21092 0.35768,-0.41465 0.53125,-0.625 z"\n         style="fill:#d40000" />\n      <path\n         sodipodi:nodetypes="cccccccccsccscsccccccccccccsscscccccsccccccscccssccscccscsccscccccsccsccccccccccccccccccccccccccccccccccccccccccccccccccsccccccccccccccc"\n         inkscape:connector-curvature="0"\n         id="path3156"\n         d="m 262.21596,470.0397 c 0.0522,-0.15584 0.0632,-0.27189 0.03,-0.28652 -0.90232,-0.0467 -1.08133,-0.11497 -1.80404,0.11461 -1.10092,-0.0326 -2.20721,0.006 -3.3074,-0.0573 -1.92814,-0.0762 -3.84408,-0.0696 -5.77292,-0.0286 -1.74527,0.0362 -3.49295,-0.0332 -5.23171,0.14327 -0.19635,0.65327 -0.47504,1.04578 -0.60135,1.34665 -0.27473,0.10837 -0.46167,0.3606 -0.69154,0.54439 -0.067,0.4294 -0.2301,0.85563 -0.21047,1.28935 0.0166,0.36835 0.52496,1.06885 0.72161,1.34665 0.40069,0.56603 0.83717,1.11398 1.26283,1.66182 -0.0234,1.00774 0.36254,1.82534 0.69154,2.92252 0.28251,0.60539 0.49764,1.22947 0.84189,1.80509 0.38352,0.64128 1.23743,1.89513 2.25504,2.80791 -0.10478,0.48326 -0.0329,0.96185 0.30068,1.37531 0.28616,0.35469 0.70554,0.64692 1.17262,0.77361 0.39682,1.05082 0.80953,2.08168 1.23276,3.12308 -0.0632,0.57086 0.0727,1.0992 0.60135,1.40396 0.61754,1.31476 1.2262,2.652 1.80403,3.98265 -0.13804,0.19112 -0.2778,0.39631 -0.39087,0.60169 -0.70795,1.28589 -0.26146,2.19525 1.62363,2.32083 1.1962,2.75763 2.41655,5.49197 3.87868,8.13722 0.15468,0.29289 0.34808,0.5728 0.51115,0.85956 -0.33862,0.58204 -0.5621,1.14184 -0.54122,1.60452 0.08,1.76854 1.50589,1.96443 2.9466,1.66183 0.26557,0.25337 0.54067,0.48996 0.84188,0.7163 0.34579,0.087 0.6997,0.31453 1.05236,0.25787 1.70412,-0.27392 1.81216,-0.78533 2.85639,-1.83374 0.45721,-0.45904 0.91775,-0.89509 1.3831,-1.34665 2.06126,-2.00022 1.56983,-1.55052 3.84861,-3.69613 2.27621,-2.52837 4.85725,-4.7935 7.27628,-7.19169 1.95532,-1.93847 3.73636,-4.01409 5.68272,-5.95965 1.65573,-1.77256 3.02887,-3.76371 5.02123,-5.2147 1.15773,-1.04325 2.50182,-1.86739 3.69828,-2.86521 0.97038,-0.93831 0.51421,-0.51104 1.44323,-1.2607 0.14485,-0.16336 0.40759,-0.50847 0.69155,-0.80226 0.0561,0.0508 0.12502,0.092 0.15033,0.14326 0.1314,0.26588 0.22073,0.55635 0.33074,0.83091 1.26823,3.97292 2.52881,7.9595 3.93882,11.89065 1.34057,2.58601 2.10708,5.4631 3.72834,7.908 0.91941,1.14494 2.31676,2.66911 3.93882,2.89387 0.59974,0.0831 1.22806,0.003 1.8341,0 0.4478,-0.24995 0.96156,-0.4203 1.35303,-0.74496 0.37041,-0.30717 2.6296,-3.00602 2.82632,-3.23769 1.76984,-2.08431 3.55631,-4.14862 5.38205,-6.18887 2.65058,-3.00033 5.67028,-5.65976 8.71951,-8.28048 1.26869,-1.10701 1.26299,-1.09944 1.23276,-1.06013 0.0323,-0.002 0.26447,-0.14073 1.20269,-0.85956 0.27402,-0.20995 1.51089,-1.31662 1.95438,-1.48991 0.76627,-0.29944 0.60197,-0.004 0.57127,0.34382 0.19731,0.24104 0.42871,0.4873 0.60135,0.74496 1.07034,1.59736 1.84028,3.36993 2.82632,5.01413 0.55903,0.93217 2.00403,3.12498 2.58579,4.0113 0.60595,0.96212 1.31144,1.85199 2.07464,2.6933 0.20877,0.8638 0.62649,1.63884 1.68377,1.66183 0.2973,0.26192 0.58932,0.52618 0.90202,0.77361 1.34844,1.06694 2.82606,1.95582 4.20942,2.97982 1.2256,0.89653 2.42016,1.78354 4.11922,1.48992 1.60993,-0.27823 3.91572,-2.82623 4.90097,-3.83939 4.07866,-4.63581 7.80654,-9.52164 11.5759,-14.38339 0.87502,-0.74542 1.50472,-1.74105 2.37532,-2.49274 0.3372,-0.29114 0.71411,-0.54161 1.14255,-0.68765 0.0607,-0.0207 0.211,0.003 0.18041,0.0573 -0.0467,0.0827 -0.17872,0.0519 -0.27061,0.0859 0.9801,1.76057 1.77996,3.66692 2.46552,5.55852 1.42084,3.4965 3.1074,7.00301 5.41211,10.05691 1.06961,1.47221 2.55669,2.60009 4.6003,2.17757 1.03978,-0.21497 3.18066,-1.65462 3.93881,-2.12026 5.76985,-4.09502 10.31017,-9.48977 15.09378,-14.5553 1.17388,-1.09991 1.83959,-2.58394 2.82632,-3.81074 0.42359,-0.52664 1.0194,-1.01001 1.50337,-1.48991 1.07413,-0.68176 2.11414,-1.43067 3.06686,-2.26352 0.0374,-0.0422 -0.1995,-0.27005 -0.48108,-0.51574 0.64116,9.1e-4 1.28315,-6.5e-4 1.92431,0 0.15615,-0.0382 -0.41514,-2.1585 -0.57128,-2.12026 -1.80179,0.003 -3.61032,-0.004 -5.41211,0 -2.43592,0.005 -4.87049,0.0164 -7.30635,0 -3.65722,-0.0197 -7.31738,-0.007 -10.97456,-0.0286 -3.4409,0.002 -6.87264,-1.8e-4 -10.31308,0.0573 -2.34216,0.0131 -4.69392,-0.0114 -7.03574,-0.0573 -4.77024,-0.0775 -9.54126,-0.0642 -14.31203,-0.0286 -4.28785,0.0376 -8.55163,0.0843 -12.83873,-0.0286 -5.24572,-0.0952 -10.50901,-0.17213 -15.75526,-0.0286 -8.15322,0.16458 -16.32032,0.4709 -24.47477,0.22922 -3.08991,-0.17998 -3.21047,-0.1397 -6.13373,-0.48709 -0.3037,-0.0361 -0.59983,-0.10035 -0.90202,-0.14326 -0.12816,-0.16447 -0.24496,-0.34697 -0.33074,-0.51574 -0.26559,0.11131 -0.52287,0.25108 -0.78175,0.37248 -1.65387,-0.26169 -3.31045,-0.58031 -4.99117,-0.68765 -0.60618,-0.0387 -1.22658,0.005 -1.8341,0 -11.58719,-0.6385 -16.82087,-0.22228 -27.57165,-0.0862 z m 84.459,3.55287 c 0.45204,0.007 0.90107,0.0224 1.35303,0.0286 -0.1621,0.008 -0.31907,0.0188 -0.48108,0.0286 -0.28859,-0.0289 -0.58162,-0.0438 -0.87195,-0.0573 z m 54.39172,0 c 0.65134,-0.004 1.30278,0.003 1.95438,0 -0.0398,0.0107 -0.0803,0.018 -0.12027,0.0286 -0.59249,0.004 -1.18243,0.0709 -1.77397,0.11461 -0.016,-0.0464 -0.0404,-0.0982 -0.0601,-0.14326 z m -92.06603,0.51574 c 0.47094,0.0118 0.94221,0.0206 1.41317,0.0286 -0.15882,0.0118 -0.32319,0.0387 -0.48108,0.0573 -0.10066,2.2e-4 -0.20006,3e-5 -0.30067,0 -0.0799,0.003 -0.16067,-0.003 -0.24054,0 -0.12974,-0.0304 -0.26077,-0.0568 -0.39088,-0.0859 z m 66.0879,5.18604 c 0.0705,-0.002 0.13993,0.002 0.21047,0 -0.006,0.0865 -0.0256,0.17133 -0.03,0.25787 -0.0451,-0.0663 -0.0656,-0.13879 -0.12027,-0.20057 -0.0178,-0.0201 -0.0412,-0.0382 -0.0601,-0.0573 z m -77.06246,0.51574 c 9.3e-4,0.009 -9.3e-4,0.0192 0,0.0286 -0.0507,-0.002 -0.0997,3e-4 -0.15033,0 0.0325,-0.0193 0.092,-0.0286 0.15033,-0.0286 z m 38.99727,1.74778 c 0.0458,0.0159 0.1502,0.13084 0.24054,0.20056 -0.0246,0.005 -0.0345,0.0241 -0.0601,0.0286 -0.095,0.0168 -0.27114,-0.26066 -0.18041,-0.22922 z m 47.26578,14.66991 c 0.3151,0.069 0.63825,0.1112 0.96215,0.11461 -0.27483,0.0933 -0.52842,0.12403 -0.69155,0.0573 -0.0967,-0.0396 -0.18247,-0.11004 -0.2706,-0.17191 z m -73.78512,5.84504 c -0.0275,0.0736 -0.0914,0.11106 -0.18041,0.11461 0.059,-0.0355 0.12454,-0.0714 0.18041,-0.11461 z m -44.71006,6.33213 c 0.0821,0.0346 0.17947,0.0447 0.24054,0.0859 -0.0471,0.0701 -0.10329,0.15917 -0.15033,0.22922 -0.097,-0.0526 -0.18012,-0.11224 -0.27061,-0.17192 0.0614,-0.0459 0.11955,-0.0962 0.1804,-0.14326 z"\n         style="fill:#ffffff" />\n      <path\n         inkscape:connector-curvature="0"\n         id="path3172"\n         d="m 386.14881,533.60119 c -0.49569,0.0218 -0.88769,0.35977 -1.34375,0.6875 -3.01,2.73868 -5.85389,5.64544 -8.53125,8.71875 -4.03642,4.06838 -7.75318,8.39927 -11.09375,13.0625 -3.15696,3.87709 -6.41726,7.75356 -8.5,12.34375 -0.22188,0.46268 -0.43655,0.79703 -0.5625,1.0625 -0.19178,-0.34972 -0.38296,-0.71576 -0.625,-1.03125 -1.47779,-1.30825 -3.28949,-2.19037 -4.59375,-3.71875 -0.0768,-0.1048 -1.64735,-2.25735 -1.71875,-2.375 -1.06023,-1.74659 -1.7215,-3.7307 -2.96875,-5.375 -1.64522,-2.11688 -3.34567,-4.19544 -4.0625,-6.84375 -1.46432,-3.77689 -2.4166,-7.91213 -5.03125,-11.09375 -0.67907,-0.1349 -1.33957,-0.43645 -2.03125,-0.40625 -1.30378,0.057 -2.68707,3.01935 -3.25,4 -0.23954,0.35658 -1.10493,1.64865 -1.28125,1.96875 -0.72421,1.31471 -1.15971,2.80935 -2.09375,4 -1.62184,1.81503 -3.08709,3.69227 -3.96875,6 -1.67134,2.94244 -3.64364,5.66721 -5.625,8.40625 -1.88094,2.94779 -3.66883,5.94294 -5,9.1875 -0.09,-0.35756 -0.18371,-0.68978 -0.3125,-0.84375 -0.55971,-1.94511 -0.0367,0.1116 -0.5,-2.375 -0.36211,-1.94344 -1.1454,-3.78134 -1.53125,-5.71875 -1.14456,-3.40825 -2.62266,-6.70672 -3.0625,-10.3125 -0.88996,-4.19168 -1.64029,-8.44434 -3.0625,-12.5 -0.36672,-0.71302 -1.0493,-2.44997 -1.96875,-2.8125 -2.24941,-0.88691 -3.05788,1.09978 -3.96875,2.5625 -0.5657,1.16653 -1.31162,2.22653 -1.90625,3.375 -0.62281,1.20291 -1.08419,2.48795 -1.71875,3.6875 -0.3353,0.60705 -1.0529,1.8475 -1.3125,2.46875 -0.52796,1.26345 -0.74261,2.66823 -1.40625,3.875 -0.30316,0.5562 -0.50532,1.13351 -0.8125,1.6875 -0.87862,1.58457 -2.11856,2.98786 -3.0625,4.53125 -2.10927,3.06801 -3.27481,6.45518 -4.25,10.03125 -0.14974,0.59751 -0.28763,1.22374 -0.46875,1.8125 -0.12152,0.39502 -0.2864,0.77139 -0.4375,1.15625 -0.0464,-0.12953 -0.10427,-0.24823 -0.15625,-0.375 -0.41021,-0.87971 -0.72091,-1.81994 -1.15625,-2.6875 -0.92428,-1.84194 -2.33739,-3.40806 -3.5,-5.09375 -1.85669,-3.02141 -3.49499,-6.19974 -4.71875,-9.53125 -1.33473,-3.44302 -2.43769,-6.9533 -3.09375,-10.59375 -0.92945,-2.37476 -1.91968,-3.40826 -4.40625,-1.9375 -1.54685,1.47189 -2.21538,2.96773 -3.28125,4.8125 -1.1623,2.01164 -2.44636,3.94822 -3.59375,5.96875 -3.49162,5.55059 -6.77077,11.22955 -10.40625,16.6875 -0.0136,0.0252 0.061,0.084 0.15625,0.15625 -0.0303,0.0455 -0.0502,0.11745 -0.25,0.40625 -0.18543,0.26798 -0.31113,0.36971 -0.46875,0.65625 -0.0983,0.17877 -0.1607,0.37905 -0.25,0.5625 -0.14523,0.28972 -0.18993,0.63951 -0.3125,0.9375 -0.004,0.009 -0.0211,-7.8e-4 -0.0312,0 -0.0288,0.0506 -0.0603,0.0773 -0.0937,0.125 -0.0329,0.0471 -0.061,0.10905 -0.0937,0.15625 -0.14866,0.21479 -0.18498,0.28886 -0.25,0.4375 -0.0385,0.0625 -0.0865,0.12391 -0.125,0.1875 -0.0715,0.11807 -0.20395,0.2764 -0.15625,0.3125 -0.0144,0.0296 -0.0168,0.0641 -0.0312,0.0937 -0.213,0.57542 -0.57968,1.0275 -0.0937,1.65625 0.12337,0.15963 0.35842,0.20843 0.53125,0.3125 0.43473,0.0773 0.855,0.0359 1.28125,0 0.10716,0.0375 0.23268,0.0708 0.34375,0.0937 0.0911,0.0185 0.18845,0.0253 0.28125,0.0312 0.11654,0.007 0.22738,0.0219 0.34375,0.0312 0.0468,0.0675 0.12239,0.11695 0.21875,0.21875 0.02,0.003 0.0421,-0.002 0.0625,0 0.0439,0.084 0.18705,0.0208 0.28125,0.0312 0.50737,0.0563 1.02144,0.0778 1.53125,0.0937 0.54771,0.0146 1.10848,0.0245 1.65625,0.0312 0.0409,0.0887 0.10022,0.16261 0.125,0.15625 5.53174,0.18593 11.05949,0.18625 16.59375,0.15625 2.73606,-0.0238 5.48266,-0.0174 8.21875,-0.0312 2.00951,-0.0101 3.97773,-0.13519 5.96875,0.15625 4.00601,0.87889 7.99041,1.54905 12.09375,1.65625 4.07189,-0.0494 8.14921,-0.44105 12.21875,-0.5625 2.79702,-0.0757 5.57852,0.002 8.375,0.0625 2.93109,0.0658 5.88101,0.0483 8.8125,0.0312 2.71614,-0.0197 5.40881,-0.0332 8.125,-0.0312 2.8403,0.004 5.69094,0.0303 8.53125,0.0312 3.05598,0 6.10027,7.6e-4 9.15625,0 2.66165,-4.4e-4 5.33835,-3.7e-4 8,0 3.05252,4.3e-4 6.10373,1.3e-4 9.15625,0 2.66135,-1.4e-4 5.3074,-2e-5 7.96875,0 3.0532,4e-5 6.10305,0 9.15625,0 l 8.59375,0 7.96875,0 2.875,0 c 0.16209,0.0416 0.75584,-2.2709 0.59375,-2.3125 l -2.875,0 -2.5,0 c -0.0134,-0.0169 -0.0436,-0.0146 -0.0625,-0.0312 -0.006,0.0165 -0.025,0.0142 -0.0312,0.0312 -0.0979,-0.0889 -0.17926,-0.1981 -0.28125,-0.28125 0.008,-0.0115 0.023,-0.0199 0.0312,-0.0312 -0.0824,-0.0905 -0.15953,-0.17106 -0.25,-0.25 0.44111,-0.2213 0.84313,-0.43568 0.8125,-0.5 -0.65628,-1.08379 -1.13019,-2.22369 -1.65625,-3.375 -0.35914,-0.93111 -0.89729,-1.79303 -1.25,-2.71875 -0.40141,-1.05352 -0.61519,-2.16603 -1.1875,-3.15625 -0.47196,-1.33147 -0.38771,-1.30437 -1.09375,-2.5 -0.82964,-1.40494 -1.82005,-2.61795 -2.03125,-4.3125 -0.45125,-3.11736 -0.87675,-6.31784 -2.0625,-9.25 -0.0982,-0.50952 -0.21855,-1.02593 -0.40625,-1.4375 -0.0927,-0.20322 -0.27906,-0.34765 -0.40625,-0.53125 -0.0208,9.2e-4 -0.0415,-3.3e-4 -0.0625,0 -1.18907,-2.6663 -2.25971,-5.40944 -2.9375,-8.25 -0.12051,-0.73244 -0.75748,-4.92636 -1.375,-5.34375 -0.43422,-0.2935 -0.76508,-0.38811 -1.0625,-0.375 z m 14.96875,42 c 0.0309,0.0339 0.0641,0.0579 0.0937,0.0937 0.0438,0.0531 0.12592,0.13347 0.1875,0.1875 0.48066,-1.31463 0.18393,-0.92057 -0.28125,-0.28125 z m -17.21875,-31.03125 c 0.003,0.0331 -0.004,0.0903 0,0.125 -0.0105,-10e-4 -0.0207,8.3e-4 -0.0312,0 0.009,-0.0421 0.0226,-0.0828 0.0312,-0.125 z m 3,9.34375 c 0.004,0.009 -0.004,0.0218 0,0.0312 0.005,0.022 0.0259,0.0405 0.0312,0.0625 -0.1565,0.0998 -0.31498,0.20871 -0.46875,0.3125 0.13032,-0.13425 0.31463,-0.2784 0.4375,-0.40625 z m -50.125,0.53125 c 0.004,0.0124 0.0276,0.0189 0.0312,0.0312 -0.0288,0.0335 -0.0651,0.0601 -0.0937,0.0937 0.0236,-0.0399 0.0388,-0.0851 0.0625,-0.125 z m 12.625,12.09375 c 0.0825,0.0851 0.16466,0.16837 0.25,0.25 -0.0442,-0.0204 -0.0812,-0.0412 -0.125,-0.0625 -0.0208,-0.01 -0.0414,-0.0224 -0.0625,-0.0312 -0.0252,-0.0502 -0.0374,-0.10598 -0.0625,-0.15625 z m -38.03125,5.90625 c 0.0971,0.009 0.11471,0.0692 0.1875,0.21875 -0.10551,-0.11564 -0.15752,-0.17959 -0.1875,-0.21875 z m 2.8125,0.9375 c 0.0421,0.007 0.0876,0.0153 0.125,0.0312 -0.0251,0.028 -0.0387,0.0646 -0.0625,0.0937 -0.0167,-0.0402 -0.0468,-0.0794 -0.0625,-0.125 z m -0.46875,2.21875 c 0.13986,0.0806 0.28584,0.15347 0.4375,0.21875 -0.19804,-0.005 -0.39571,0.004 -0.59375,0 0.0638,-0.0659 0.11468,-0.14284 0.15625,-0.21875 z m -22.40625,0.0625 c 0.0287,0.0335 0.0633,0.0601 0.0937,0.0937 -0.16643,-0.0245 -0.33367,-0.0364 -0.5,-0.0625 0.16307,-6.1e-4 0.28333,-0.0244 0.40625,-0.0312 z m 92.65625,0.0625 c 1.12422,-0.008 2.25078,0.004 3.375,0 0.72348,0.0235 1.43194,0.0369 2.15625,0.0312 0.0871,0.0533 0.1812,0.11302 0.28125,0.125 0.27872,0.0334 0.53157,-2.7e-4 0.75,-0.0625 0.01,0.0314 0.0209,0.0625 0.0312,0.0937 l -4.3125,0 c -2.66083,0 -5.33918,6e-5 -8,0 -0.36478,-10e-6 -0.72897,0 -1.09375,0 0.71069,-0.0526 1.41483,-0.0978 2.125,-0.15625 1.56145,-0.008 3.12604,-0.0198 4.6875,-0.0312 z m -88.34375,0.46875 c 0.5967,-0.0356 1.18406,0.0156 1.78125,0.0312 0.86721,0.0262 1.72637,0.003 2.59375,0 -0.67712,0.0302 -1.3536,0.0741 -2.03125,0.0937 -0.79216,-0.011 -1.56839,-0.0773 -2.34375,-0.125 z"\n         style="fill:#ffffff" />\n    </g>\n    <path\n       style="fill:#803300"\n       d="m 119.01454,880.13129 c -6.28698,0.29976 -12.54075,0.80621 -18.69858,2.21692 -9.814553,2.16198 -19.663139,4.49503 -29.018741,8.22555 -0.548955,0.31548 3.900177,8.08235 4.449132,7.76687 0.586178,0.04 1.171342,0.14951 1.758248,0.12231 4.910745,-0.22759 9.774587,-1.34398 14.585814,-2.23221 0.243016,-0.0449 0.186889,-0.0348 0.412806,-0.0765 0.261246,0.54508 0.541201,0.96887 0.840901,1.28429 0.0085,0.25997 0.05656,0.54791 0.152892,0.88677 0.108413,0.38134 0.654966,0.10035 1.131394,-0.0917 0.525564,0.15109 1.087572,0.14165 1.697092,0.10703 -0.346914,0.0968 -3.893303,1.06769 -4.525578,1.78882 -1.341773,1.53037 0.114416,2.4389 1.635935,2.85907 1.01938,0.2815 2.123059,0.0606 3.180136,0.0917 3.916249,-0.28764 7.897929,-0.30859 11.787909,-0.90206 1.69517,-0.25861 2.53245,-0.58244 4.11277,-1.07023 0.16269,-0.0852 -1.04515,-2.37855 -1.20784,-2.29337 -3.14501,0.79707 -6.36806,1.0476 -9.60156,1.25371 3.81603,-0.92281 7.61667,-1.86 11.43625,-2.76733 1.44372,-0.17539 2.87661,-0.3877 4.31153,-0.67272 2.34397,-0.4656 1.73087,-0.28219 3.39419,-1.00909 -0.24026,-0.33923 -0.43759,-0.73584 -0.64215,-1.1161 0.88028,-0.15141 1.76121,-0.32708 2.62973,-0.53512 1.24428,-0.29804 5.26212,-1.01528 2.99667,-3.54707 -0.47217,-0.52768 -1.36436,-0.3687 -2.04874,-0.55041 -0.3822,-0.008 -0.76632,-0.008 -1.14669,0 -0.51079,-2.84744 -2.99886,-9.94543 -3.62352,-9.73917 z"\n       id="path3245"\n       inkscape:connector-curvature="0" />\n  </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="movie">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M42.3523 17.9045c-22.0242,0 -39.8519,17.8596 -39.8519,39.8543 0,22.0159 17.8277,39.8495 39.8519,39.8495 22.0206,0 39.8483,-17.8336 39.8483,-39.8495 0,-21.9947 -17.8277,-39.8543 -39.8483,-39.8543zm1.06891 63.7588l0 0c-12.9225,0 -23.3836,-10.4587 -23.3836,-23.3588 0,-12.9249 10.4611,-23.4155 23.3836,-23.4155 12.9284,0 23.3907,10.4906 23.3907,23.4155 0,12.9001 -10.4623,23.3588 -23.3907,23.3588z"/>\n  <path class="fil0" d="M56.1229 58.3044c0,7.01935 -5.70713,12.7548 -12.7466,12.7548 -7.05714,0 -12.7584,-5.73548 -12.7584,-12.7548 0,-7.07368 5.70123,-12.7513 12.7584,-12.7513 7.03943,0 12.7466,5.6776 12.7466,12.7513z"/>\n  <path class="fil0" d="M121.509 17.9045c-22.0183,0 -39.8519,17.8596 -39.8519,39.8543 0,22.0159 17.8336,39.8495 39.8519,39.8495 22.01,0 39.8531,-17.8336 39.8531,-39.8495 0,-21.9947 -17.8431,-39.8543 -39.8531,-39.8543zm1.06772 63.7588l0 0c-12.9308,0 -23.3836,-10.4587 -23.3836,-23.3588 0,-12.9249 10.4528,-23.4155 23.3836,-23.4155 12.9296,0 23.3813,10.4906 23.3813,23.4155 0,12.9001 -10.4517,23.3588 -23.3813,23.3588z"/>\n  <path class="fil0" d="M135.28 58.3044c0,7.01935 -5.70123,12.7548 -12.7584,12.7548 -7.04415,0 -12.7466,-5.73548 -12.7466,-12.7548 0,-7.07368 5.70241,-12.7513 12.7466,-12.7513 7.05714,0 12.7584,5.6776 12.7584,12.7513z"/>\n  <polygon class="fil0" points="30.6711,179.981 28.0053,129.495 28.0053,95.4929 98.6618,95.4929 142.78,95.4929 142.257,101.871 160.306,101.871 190.077,82.2136 197.502,82.2136 197.502,182.093 161.906,166.7 139.591,166.151 139.591,178.904 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="note">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n    .fil1 {fill:#FEFEFE;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M42.8684 88.6082c4.86146,0 7.29336,0.738195 7.29336,2.21104 0,3.03428 -1.79765,4.8024 -5.35044,5.39296l-1.45867 0 -1.92876 -7.15872c0.30827,-0.268112 0.809061,-0.445279 1.4445,-0.445279z"/>\n  <path class="fil0" d="M17.0978 43.8712c0,-0.614178 -0.650793,-0.762998 -1.94647,-0.46772 -1.28387,0.322443 -1.93112,0.793707 -1.93112,1.47285 1.28151,7.57211 6.79375,11.3469 16.5167,11.3469l1.94765 6.98273c-3.89058,2.29844 -5.8217,4.74571 -5.8217,7.39612 0.64843,0.324806 1.20946,0.679139 1.6949,0.975598 0.485437,0.35079 0.884653,0.676777 1.20828,0.970874 0,-2.12128 1.29804,-4.06657 3.90476,-5.89375l1.96065 7.63234c-7.1599,0 -11.0375,-2.62325 -11.6989,-7.72211 0,-0.970874 -0.0897645,-1.85553 -0.237403,-2.6516 -0.161812,-0.825597 -0.411027,-1.5319 -0.735833,-2.20868 -0.309451,-1.56379 -0.473626,-2.86065 -0.473626,-3.83389 0,-0.973236 0,-1.62167 0,-1.91458 -0.660241,-0.324806 -1.22009,-0.647249 -1.70789,-0.942527 -0.486618,-0.355515 -1.05946,-0.676777 -1.69371,-1.02993 0,0.353152 -0.103938,1.32521 -0.26575,2.9138 -0.147639,1.59332 -0.0732289,3.39215 0.26575,5.30673 0,0.676777 0.294097,1.44214 0.969693,2.41892 0.636619,0.970874 0.974417,1.94175 0.974417,2.9138 1.29686,7.04651 6.48312,10.6111 15.5446,10.6111l1.94529 7.69022c-3.88704,2.2701 -5.83351,4.53783 -5.83351,6.77722 0.647249,0.325987 1.20828,0.617721 1.70907,0.973236 0.471264,0.29764 0.897645,0.617721 1.23781,0.943708 0,-1.68072 1.26733,-3.38979 3.87523,-5.07051l1.93112 6.75005c-6.48548,0 -10.1965,-2.50632 -11.171,-7.54494 0,-0.294097 -0.175986,-0.99922 -0.500791,-2.09175 -0.323625,-1.12206 -0.64843,-1.97482 -0.972055,-2.59254 -0.322443,-1.6193 -0.471264,-2.91616 -0.471264,-4.03586 0,-1.06418 0,-1.77049 0,-2.12482 -0.663785,-0.294097 -1.22363,-0.588194 -1.72324,-0.91418 -0.487799,-0.292916 -1.04765,-0.646068 -1.68072,-0.941346 0,0.676777 0,1.85553 0,3.652 0,1.76812 0.147639,3.65672 0.472445,5.57367 0.322443,0.676777 0.646068,1.41497 0.986228,2.20868 0.294097,0.79725 0.485437,1.67836 0.485437,2.65278 1.26733,7.4847 6.46895,11.2005 15.5611,11.2005l1.92876 6.83391c-3.88822,2.2701 -5.83469,4.68665 -5.83469,7.28037 0.649611,0.324806 1.22481,0.676777 1.71025,0.942527 0.471264,0.38268 1.04765,0.676777 1.69371,1.0004 0,-1.70671 1.13505,-3.38861 3.4205,-5.03862l1.92876 6.75005c-6.80675,0 -10.5213,-2.77089 -11.1851,-8.22054 0,-0.325987 -0.160631,-0.976779 -0.485437,-1.91931 -0.309451,-0.968512 -0.64843,-1.76576 -0.955519,-2.41655 -0.34016,-1.6193 -0.413389,-2.88782 -0.251577,-3.82798 0.161812,-1.00513 0.251577,-1.65356 0.251577,-1.97836 -0.68032,-0.295278 -1.22599,-0.646068 -1.71025,-0.912999 -0.487799,-0.353152 -1.063,-0.674415 -1.69371,-1.03229 0,0.357877 -0.105119,1.29922 -0.251577,2.91853 -0.162993,1.59214 -0.0874023,3.39333 0.251577,5.30437 0.30827,0.976779 0.630714,1.85789 0.957882,2.68112 0.321262,0.798431 0.485437,1.68308 0.485437,2.65396 1.28033,7.04415 6.48312,10.578 15.5588,10.578l1.96065 7.21895c-3.90476,2.27246 -5.85123,4.68901 -5.85123,7.25203 0.649611,0.322443 1.22481,0.679139 1.71025,0.99922 0.472445,0.296459 0.884653,0.620084 1.20828,0.948433 0,-1.68072 1.28269,-3.39097 3.89058,-5.07406l1.94411 6.72171c-7.12919,0 -11.0068,-2.53467 -11.6682,-7.66187 0,-0.972055 -0.07441,-1.85553 -0.252758,-2.68112 -0.146458,-0.793707 -0.413389,-1.5319 -0.720478,-2.18151 -0.325987,-1.59096 -0.413389,-2.9764 -0.236222,-4.06539 0.147639,-1.17875 0.236222,-1.88624 0.236222,-2.18269 -0.635438,-0.323625 -1.22599,-0.558666 -1.69371,-0.706305 -0.487799,-0.147639 -1.06182,-0.440555 -1.7256,-0.737014 -0.295278,0.296459 -0.559847,1.02993 -0.721659,2.20868 -0.162993,1.09489 -0.0885834,3.15475 0.249215,6.07328 0,0.353152 0.325987,0.973236 0.987409,1.94529 0.618903,1.00158 0.957882,1.94175 0.957882,2.94805 1.31103,7.80833 6.6473,11.6965 16.0478,11.6965l1.9571 6.86935c-4.22602,1.94057 -6.31895,4.21303 -6.31895,6.80438 0.618903,0.327168 1.2071,0.679139 1.67954,1.00158 0.487799,0.355515 0.898826,0.617721 1.22245,0.94607 0,-1.53308 1.45985,-2.94687 4.37602,-4.21539l1.94647 6.77604c-7.13155,0 -11.0221,-2.59136 -11.6706,-7.71975 0,-0.294097 -0.160631,-1.03229 -0.486618,-2.21104 -0.323625,-1.09135 -0.64843,-1.976 -0.972055,-2.62207 -0.322443,-1.59096 -0.487799,-2.9764 -0.487799,-4.12562 0,-1.12206 0,-1.82718 0,-2.12128 -0.322443,-0.351971 -0.734651,-0.561028 -1.2071,-0.705124 -0.49961,-0.209057 -1.06182,-0.445279 -1.69371,-0.739376 0,0.294097 -0.105119,1.23899 -0.26575,2.82994 -0.147639,1.67954 -0.0732289,3.41696 0.26575,5.3339 0.322443,0.99922 0.631895,1.85435 0.957882,2.67994 0.30827,0.766541 0.484256,1.68072 0.484256,2.62443 1.29686,7.39494 6.66147,11.1107 16.0478,11.1107l1.92994 6.71934c-4.21421,1.94411 -6.30714,4.39137 -6.30714,7.24848 0.64843,0.323625 1.22599,0.675596 1.71025,1.00276 0.455909,0.324806 1.0441,0.618903 1.6949,0.910637 0,-1.64883 1.29568,-3.3579 3.90357,-5.03626l1.93112 6.74533c-7.14691,0 -11.0375,-2.59018 -11.654,-7.68667 0,-0.355515 -0.178348,-1.09371 -0.503154,-2.18388 -0.323625,-1.17757 -0.633076,-2.03387 -0.9567,-2.70829 -0.677958,-3.48192 -0.811424,-5.42366 -0.500791,-5.7213 -0.650793,-0.351971 -1.23781,-0.646068 -1.69726,-0.970874 -0.485437,-0.321262 -1.05946,-0.679139 -1.70789,-1.0004 -0.646068,0.679139 -0.485437,3.44648 0.500791,8.27723 0.324806,0.64843 0.620084,1.38899 0.959063,2.18388 0.322443,0.824416 0.500791,1.67836 0.500791,2.6823 1.28033,7.454 6.64612,11.1698 16.0312,11.1698l1.92994 7.77762 119.617 -32.0329 -42.7881 -162.969 -120.075 32.3282 1.94411 6.77722c-3.90357,1.5945 -5.83469,3.71578 -5.83469,6.25044 0.618903,0.35079 1.21064,0.679139 1.67954,0.99922 0.486618,0.29764 0.898826,0.591737 1.22481,0.943708 0,-1.88387 1.30985,-3.2705 3.90476,-4.24492l1.92876 6.75123c-6.80675,0 -10.682,-2.79923 -11.6682,-8.43196z"/>\n  <path class="fil0" d="M35.0861 65.8304l1.47403 0c4.84846,0 7.28037,0.970874 7.28037,2.79805 0,3.47719 -1.60749,5.30437 -4.86382,5.65871l-1.45867 0 -2.43191 -8.45676z"/>\n  <path class="fil0" d="M60.3725 155.27c4.84846,0 7.29455,0.706305 7.29455,2.03151 0,3.62365 -1.79883,5.778 -5.33508,6.45359l-1.47403 0 -1.92994 -7.95361c0.310632,-0.353152 0.796069,-0.5315 1.4445,-0.5315z"/>\n  <path class="fil1" d="M69.1092 189.187c7.47171,-1.26379 10.5391,-4.74098 9.23866,-10.5213 -0.970874,-4.47641 -5.31855,-6.06501 -13.1127,-4.83075 -0.64843,0 -1.14922,0.354333 -1.45867,0.885834l-1.92876 -6.841 1.45631 0c7.44455,-1.23308 10.5225,-4.80004 9.21031,-10.6064 -0.959063,-4.86146 -5.34925,-6.65793 -13.1139,-5.33508 -0.662604,0 -1.1504,0 -1.45749,0l-1.94647 -6.80557 1.45867 0c2.91735,-0.649611 5.25949,-2.03506 7.04297,-4.15633 1.7823,-2.09411 2.35632,-4.45161 1.71025,-7.04297 -0.973236,-4.53783 -5.35044,-6.1595 -13.1316,-4.86264l-0.970874 0 -1.94411 -6.80438 1.45867 0c2.59254,-0.296459 4.86146,-1.59332 6.80793,-3.86342 1.94411,-2.2701 2.75317,-4.39019 2.42955,-6.33548 -0.986228,-5.51107 -5.83469,-7.09966 -14.5867,-4.83193l-1.92876 -6.80911 1.45749 0c7.42565,-1.29922 10.5202,-4.89216 9.2233,-10.6973 -0.972055,-4.53665 -5.52524,-6.15832 -13.5993,-4.86146l-0.986228 0 -1.93112 -7.31108 0.957882 0c2.57837,-0.322443 4.86146,-1.58978 6.80675,-3.85987 1.94411,-2.2701 2.75435,-4.38901 2.43191,-6.33666 -0.959063,-4.53783 -5.67288,-6.12761 -14.0718,-4.86146l-1.96065 -6.80793 0.974417 0c7.11502,-1.94529 10.1954,-5.33508 9.2233,-10.1965 -0.972055,-5.1839 -5.68941,-6.77958 -14.1025,-4.86027l-0.972055 -2.94805 112.812 -30.0912 40.844 154.367 -112.809 29.6176 -0.48898 -2.39175 0.957882 0z"/>\n  <path class="fil0" d="M64.7355 178.552c0.322443,-0.325987 0.824416,-0.445279 1.47285,-0.445279 4.86146,0 7.29218,0.738195 7.29218,2.21104 0,3.2705 -1.60631,5.06933 -4.86027,5.36225l-1.47521 0 -2.42955 -7.12801z"/>\n  <path class="fil0" d="M53.0768 133.372l0.974417 0c5.18744,-0.647249 7.79652,0.0921267 7.79652,2.18151 0,3.00593 -1.80001,4.80358 -5.36579,5.36343l-1.45867 0 -1.94647 -7.54494z"/>\n  <path class="fil0" d="M48.7031 110.564c4.86264,0 7.29336,0.942527 7.29336,2.80042 0,3.44648 -1.60631,5.30201 -4.84728,5.65871l-1.94529 0 -1.96065 -7.98786c0.310632,-0.291735 0.825597,-0.471264 1.45985,-0.471264z"/>\n  <path class="fil0" d="M29.2668 43.8712l1.45867 0c4.84728,0 7.3099,0.711029 7.3099,2.00671 0,3.97798 -1.65119,6.16068 -4.87799,6.42525l-1.47285 0 -2.41774 -8.43196z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="off">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="110.358,2.49805 89.644,2.49805 89.644,113.28 110.358,113.28 "/>\n  <path class="fil0" d="M137.838 38.1322l-0.00590556 0.0153545 -8.91267 17.8194c20.9187,10.6241 35.3365,32.3589 35.3365,57.3134 0,35.3578 -28.903,64.2525 -64.2572,64.2525 -35.3495,0 -64.2466,-28.8947 -64.2466,-64.2525 0,-25.0596 14.5265,-46.8653 35.5798,-57.441l-0.152363 -0.05315 -9.04613 -17.6434c-27.429,13.9324 -46.3492,42.4267 -46.3492,75.1376 0,46.3149 37.9007,84.2192 84.2144,84.2192 46.3173,0 84.2192,-37.9042 84.2192,-84.2192 0,-32.7227 -18.9391,-61.2288 -46.3799,-75.1482z"/>\n  <polygon class="fil0" points="128.92,55.967 128.915,55.967 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="pen">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M153.193 13.8355l0 -2.30789 -3.07207 -2.01616 -4.32877 -2.50041c-4.2272,-2.04923 -7.78471,-3.55278 -10.6631,-4.51303l-14.1285 27.7668 -1.15276 2.02088 -5.86068 11.7261 -5.1898 9.98748 0.770085 0.388586 -0.770085 1.53663 -55.83 109.162 2.30671 1.05709 -4.90043 9.80086 1.91931 1.6323 -3.26695 6.44178 0 0 -2.20868 12.5859 -0.00708667 0.00826778 0.887015 0.887015 0.274018 -0.317719 8.83944 -9.32015c0,0.257482 -2.43663,-0.512602 0,0 0.576382,-0.830321 1.60159,-2.88427 3.07798,-6.15005l2.78624 0.479531 4.90043 -9.70874 2.68939 1.44568 55.2524 -108.301 1.43978 -2.49687 0.771266 0.383861 16.8178 -33.0558 3.64964 -6.72643 0.577564 0.387405 -15.3745 29.8798c-0.771266,1.34765 -1.02875,2.21577 -0.771266,2.59726 0,0.259845 0.35079,0.320081 1.05709,0.190159l0.480712 -0.383861 18.7419 -36.709c0.252758,-0.635438 0.188978,-1.11615 -0.194883,-1.43859 -0.706305,0 -1.21773,-0.124017 -1.53663,-0.38268l0 -0.387405 2.01734 -3.64964zm-31.0384 53.4299l0 0 -52.563 103.007c-0.0649611,0.516146 -0.257482,0.706305 -0.576382,0.576382 -0.193702,-0.38268 -4.51775,-2.59136 -12.9698,-6.63076l0 -0.285829c23.8266,-46.1212 35.6483,-69.2828 35.4582,-69.4777l9.0296 -17.1025 11.0517 -21.9073 0.387405 0 2.78506 1.63112 9.51031 4.70791c0.38268,0.0649611 0.576382,0.258663 0.576382,0.576382l-2.68939 4.90516zm4.89925 -7.30399l0 0 -0.479531 0.576382 -0.383861 -0.387405 -14.1273 -7.11029 -0.0909456 -0.188978 24.3108 -47.5657 0.38268 0c5.44374,2.37167 10.1835,4.83429 14.2194,7.39612l0.0968512 0.576382 -23.9281 46.7035z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="people-hands-up">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231991976">\n   <path id="_231984320" class="fil0" d="M69.9041 39.8035c8.50164,0 15.3875,-6.89297 15.3875,-15.3946 0,-8.49692 -6.88588,-15.3911 -15.3875,-15.3911 -8.50282,0 -15.3934,6.89415 -15.3934,15.3911 0,8.50164 6.89061,15.3946 15.3934,15.3946z"/>\n   <path id="_231984056" class="fil0" d="M81.3337 43.2618l-22.4612 0.0118111 -38.3318 -38.3271c-3.0012,-3.15239 -7.97959,-3.2764 -11.1308,-0.27638 -3.15475,2.99884 -3.27995,7.98077 -0.275199,11.1296l40.0302 40.0928 0.00472445 132.951c0,4.78114 3.8705,8.65637 8.65755,8.65637 4.77523,0 8.65046,-3.87523 8.65046,-8.65637l0.00944889 -72.1128 6.99336 0 0.0767723 72.1128c0,4.78114 3.87168,8.65637 8.65282,8.65637 4.77523,0 8.6481,-3.87523 8.6481,-8.65637l-0.05315 -132.951 40.0291 -40.0928c2.99884,-3.14884 2.87483,-8.13077 -0.277561,-11.1296 -3.14412,-3.00002 -8.13313,-2.87601 -11.1284,0.27638l-38.0944 38.3153z"/>\n  </g>\n  <g id="_231990296">\n   <path id="_231993176" class="fil0" d="M148.224 85.4936c6.03902,0 10.9288,-4.89571 10.9288,-10.9359 0,-6.0343 -4.8898,-10.93 -10.9288,-10.93 -6.04021,0 -10.9336,4.89571 -10.9336,10.93 0,6.04021 4.89335,10.9359 10.9336,10.9359z"/>\n   <path id="_231977144" class="fil0" d="M156.341 87.9503l-15.9545 0.00590556 -27.2246 -27.2223c-2.13191,-2.23703 -5.66934,-2.32797 -7.90636,-0.194883 -2.24057,2.12954 -2.33033,5.66697 -0.196065,7.904l28.4329 28.4778 0.00236222 94.4311c0,3.39451 2.74963,6.14769 6.14887,6.14769 3.39333,0 6.14414,-2.75317 6.14414,-6.14769l0.00826778 -51.2213 4.96657 0 0.0555122 51.2213c0,3.39451 2.74963,6.14769 6.14532,6.14769 3.39097,0 6.14296,-2.75317 6.14296,-6.14769l-0.0389767 -94.4311 28.4317 -28.4778c2.12954,-2.23703 2.04214,-5.77445 -0.197246,-7.904 -2.23348,-2.13309 -5.77682,-2.04214 -7.904,0.194883l-27.0569 27.2164z"/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="photo">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#FEFEFE;stroke-width:3.31302}\n    .fil1 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M155.461 70.4273c0,16.1387 -13.0844,29.2219 -29.2231,29.2219 -16.1387,0 -29.2242,-13.0832 -29.2242,-29.2219 0,-16.1399 13.0855,-29.2231 29.2242,-29.2231 16.1387,0 29.2231,13.0832 29.2231,29.2231z"/>\n  <path class="fil1 str0" d="M155.461 70.4273c0,16.1387 -13.0844,29.2219 -29.2231,29.2219 -16.1387,0 -29.2242,-13.0832 -29.2242,-29.2219 0,-16.1399 13.0855,-29.2231 29.2242,-29.2231 16.1387,0 29.2231,13.0832 29.2231,29.2231"/>\n  <path class="fil0" d="M146.963 32.653l-21.3025 -30.155 -22.5439 30.155 -40.4247 0 0 -16.2615 -18.6238 0 0 16.2615 0 2.3634 0 14.4852 53.7618 0c6.6532,-8.8359 17.1982,-14.5773 29.112,-14.5773 11.9127,0 22.4565,5.74138 29.1073,14.5773l20.1628 0 0 -16.8486 -29.249 0z"/>\n  <path class="fil0" d="M176.205 54.4233l-16.6537 0c2.34333,4.83783 3.69452,10.2438 3.69452,15.9816 0,20.2962 -16.4576,36.7503 -36.7538,36.7503 -20.2986,0 -36.7527,-16.4541 -36.7527,-36.7503 0,-5.73784 1.35001,-11.1438 3.69216,-15.9816l-48.435 0 0 56.5682 55.5713 0 -2.6953 0.296459c0,0 4.84728,3.09215 9.95205,6.29178l-56.2186 -0.674415 0 3.54806 59.7914 -0.641344c4.06421,2.5264 7.58392,4.66067 8.05518,4.77878l0.296459 0.0413389 0 29.8372 -0.415751 0.396854 -29.0825 35.881c-0.664966,0.820873 -5.66815,5.71658 -5.16618,6.12288l9.71228 0.0236222c1.00631,-0.0236222 1.44686,0.0708667 2.11301,-0.746463l24.3179 -29.9991 0 29.3908c0,0.979142 0.523232,1.77403 1.17048,1.77403l6.23509 0c0.643706,0 1.16694,-0.794888 1.16694,-1.77403l0 -29.8172 21.7384 30.7254c0.564571,0.798431 0.97796,0.941346 1.60395,1.03583l4.44452 0.0165356c0.322443,-0.229136 -1.22245,-3.26695 -1.79057,-4.06657l-23.523 -33.2507c0.304727,-0.668509 0.481894,-1.40552 0.481894,-2.18742l0 -33.4042 20.9895 -13.3029 -3.14412 -0.296459 25.6041 0 0 -56.5682z"/>\n  <path class="fil0" d="M26.7404 113.455c0,0 -6.37092,5.04925 -0.388586,10.7965 0,0 22.9159,3.34136 25.1683,-3.72759l-0.232679 -3.57523c0,0 -2.56301,-5.82524 -24.547,-3.49373z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="quote">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M2.50041 30.9156l194.619 0 0.38268 0 0 98.3878 -135.479 0c-1.55789,4.21893 -2.33624,8.27014 -2.33624,12.1607 0,6.12643 1.67127,11.7048 5.02209,16.7328 3.34845,5.02681 7.59219,8.65755 12.7383,10.8887 -10.4505,-0.12756 -18.9037,-1.79175 -25.3644,-4.99965 -6.4595,-3.2079 -11.2595,-7.67604 -14.3907,-13.4033 -3.13467,-5.72839 -5.12839,-12.7265 -5.98233,-20.9966l-29.2089 -0.38268 0 -98.3878zm57.8083 93.4153l132.221 0 0 -88.4428 -185.057 0 0 88.4428 28.5427 0c0,24.6297 10.0961,38.144 30.2861,40.5369 -6.78076,-5.36107 -10.167,-13.1316 -10.167,-23.3092 0,-6.69454 1.38781,-12.4383 4.17405,-17.2277z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="quote2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M80.4715 183.292c-11.8336,-0.543311 -20.6635,-4.52366 -26.4793,-11.9363 -5.8217,-7.4162 -9.36267,-18.0001 -10.6276,-31.7518l-2.33624 0c-6.84809,0 -13.2308,-1.74214 -19.147,-5.23941 -5.92209,-3.49018 -10.6347,-8.22999 -14.1296,-14.2194 -3.50318,-5.98351 -5.25122,-12.4383 -5.25122,-19.3631l0 -45.6819c0,-6.82683 1.74214,-13.1977 5.23469,-19.1257 3.49018,-5.92091 8.1851,-10.6111 14.0895,-14.0729 5.90556,-3.46302 12.267,-5.19571 19.0927,-5.19571l118.163 0c6.81974,0 13.18,1.73269 19.0868,5.19571 5.9032,3.46184 10.5993,8.15203 14.0954,14.0729 3.49137,5.928 5.23941,12.2989 5.23941,19.1257l0 45.6819c0,6.92486 -1.74805,13.3796 -5.23941,19.3631 -3.49018,5.98942 -8.18628,10.7292 -14.0907,14.2194 -5.90556,3.49727 -12.2718,5.23941 -19.0915,5.23941l-81.518 0c-3.3957,7.01935 -5.08823,13.4127 -5.08823,19.1848 0,6.63785 2.66459,14.8076 7.99731,24.5033zm-6.04965 -3.79019c-3.66853,-7.00399 -5.49926,-14.1792 -5.49926,-21.5411 0,-7.15754 1.83072,-15.0556 5.49926,-23.6848l81.4837 0c7.13155,0 13.4871,-1.59332 19.069,-4.77878 5.5843,-3.18546 9.90126,-7.56384 12.9651,-13.1316 3.0579,-5.55949 4.5898,-11.7367 4.5898,-18.5305l0 -39.5271c0,-7.00517 -1.57088,-13.3076 -4.71145,-18.9072 -3.14176,-5.59611 -7.49297,-9.95087 -13.0548,-13.0607 -5.56067,-3.10632 -11.8418,-4.66185 -18.8458,-4.66185l-111.837 0c-6.59415,0 -12.704,1.66064 -18.332,4.97248 -5.62563,3.3142 -10.0772,7.7977 -13.3572,13.4588 -3.27995,5.66107 -4.91815,11.7273 -4.91815,18.1986l0 39.5271c0,6.57052 1.6323,12.6521 4.90161,18.2482 3.26814,5.59256 7.70321,10.0276 13.3017,13.291 5.60083,3.26932 11.6836,4.90161 18.2541,4.90161l3.14176 0c0.75473,9.14062 2.20395,16.8049 4.33468,22.9974 2.13073,6.19493 5.07878,11.0906 8.84062,14.6859 3.76184,3.59649 8.48629,6.10989 14.1745,7.54258z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="scraper">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M171.76 164.153c2.89845,3.95672 4.34885,8.14258 4.34885,12.5611 0,5.48272 -2.09884,10.3217 -6.29414,14.5064 -4.19649,4.18586 -9.04023,6.27879 -14.5336,6.27879 -6.56816,0 -12.1347,-3.04136 -16.7104,-9.12999l-111.016 -147.052c-2.44608,-3.19491 -3.66381,-6.69454 -3.66381,-10.5013 0,-7.00045 3.20554,-13.4741 9.61543,-19.4092 6.40989,-5.93627 13.2733,-8.90913 20.5998,-8.90913 6.86344,0 12.5895,2.97286 17.171,8.91976l73.7037 97.8693c0.453547,0.611816 0.685045,1.29686 0.685045,2.05513 0,2.74727 -1.37481,4.11854 -4.12208,4.11854 -1.06891,0 -1.98781,-0.458271 -2.74608,-1.37718l-72.5616 -96.3669c-3.3579,-4.42208 -7.55439,-6.63549 -12.5871,-6.63549 -5.18744,0 -9.92134,2.02324 -14.1911,6.06619 -4.27562,4.04885 -6.41107,8.66109 -6.41107,13.8485 0,3.36262 1.06536,6.48903 3.20436,9.38866l104.381 138.713c4.72799,6.25635 9.76307,9.38157 15.1076,9.38157 3.05199,0 5.6091,-1.1008 7.67132,-3.3142 2.05513,-2.21577 3.08861,-5.0776 3.08861,-8.58904 0,-4.26854 -1.6819,-8.69653 -5.03508,-13.2781l-98.6594 -130.932c-1.676,-2.13545 -3.58467,-3.20436 -5.72012,-3.20436 -4.58035,0 -6.86816,2.2134 -6.86816,6.63549 0,1.6819 0.607091,3.28585 1.82954,4.80831l65.4655 87.2097c0.453547,0.76536 0.685045,1.53072 0.685045,2.28899 0,2.44608 -1.14332,3.66381 -3.43113,3.66381 -1.22363,0 -2.21931,-0.532681 -2.97876,-1.60277l-67.5265 -89.7255c-1.83427,-2.44018 -2.74727,-5.11303 -2.74727,-8.01266 0,-3.81499 1.52363,-7.21069 4.57563,-10.1835 3.05317,-2.97286 6.48903,-4.46578 10.3064,-4.46578 4.26972,0 7.9288,1.98309 10.9843,5.94217l104.381 138.433z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="search">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.9524;stroke-linecap:round}\n    .fil2 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n    .fil1 {fill:#FEFEFE;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M164.336 14.3375c23.1569,18.5883 26.8632,52.4307 8.27841,75.5923 -18.5931,23.1557 -52.4355,26.8632 -75.5971,8.27369 -23.1545,-18.5883 -26.862,-52.4307 -8.27014,-75.59 18.586,-23.1581 52.4272,-26.8656 75.5888,-8.27605z"/>\n  <path class="fil1" d="M157.499 22.8533c18.4572,14.8123 21.41,41.783 6.59533,60.2379 -14.8088,18.4561 -41.7795,21.4088 -60.2379,6.59651 -18.4572,-14.8159 -21.4112,-41.7842 -6.59533,-60.2379 14.8147,-18.4561 41.7854,-21.4076 60.2379,-6.59651z"/>\n  <path class="fil2 str0" d="M152.808 28.6857c15.2363,12.2304 17.6718,34.4908 5.44492,49.7248"/>\n  <path class="fil0" d="M18.9037 195.526c3.86696,3.10042 9.50441,2.48033 12.6036,-1.37954l59.867 -74.5789c3.09924,-3.86224 2.47915,-9.50441 -1.37954,-12.6048 -3.86696,-3.09924 -9.50441,-2.4827 -12.6048,1.37954l-59.8658 74.5801c-3.09333,3.86105 -2.48033,9.50441 1.37954,12.6036z"/>\n  <path class="fil0" d="M89.7893 107.212c2.42837,1.95002 5.97643,1.56025 7.92526,-0.865755 1.94293,-2.426 1.55907,-5.97643 -0.869298,-7.92172 -2.42837,-1.95002 -5.97524,-1.56025 -7.92526,0.865755 -1.94293,2.42837 -1.55907,5.97288 0.869298,7.92172z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="sex">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M51.1551 147.686l0 9.79023 -10.9643 0 0 -9.79023 -10.0961 0 0 -11.2572 10.0961 0 0 -8.32093c-10.7339,-1.23899 -19.6986,-5.88075 -26.8963,-13.93 -7.19651,-8.04809 -10.7942,-17.5702 -10.7942,-28.5652 0,-11.8879 4.15515,-22.0407 12.4631,-30.4621 8.30912,-8.41896 18.3982,-12.6296 30.2683,-12.6296 11.8702,0 21.9592,4.21066 30.2683,12.6296 8.30912,8.42133 12.4643,18.5742 12.4643,30.4621 0,10.8473 -3.489,20.2572 -10.4646,28.2321 -6.97683,7.97368 -15.7584,12.704 -26.3447,14.1887l0 8.39534 10.3926 0 0 11.2572 -10.3926 0zm24.6699 -62.1489l0 0c0,-8.60912 -2.9705,-15.8611 -8.91149,-21.749 -5.94217,-5.8902 -13.1706,-8.83472 -21.6852,-8.83472 -8.46385,0 -15.6308,2.9575 -21.4974,8.87133 -5.8654,5.91383 -8.7981,13.1505 -8.7981,21.7124 0,8.46148 2.9327,15.6249 8.7981,21.4891 5.86658,5.8654 13.0336,8.7981 21.4974,8.7981 8.46503,0 15.6828,-2.9327 21.6474,-8.7981 5.9658,-5.86422 8.94928,-13.0277 8.94928,-21.4891z"/>\n  <path class="fil0" d="M164.619 74.827l16.6052 -15.9533 -9.2044 -0.835046 5.68469 -6.02249 19.7978 0 0 19.2746 -6.29296 5.93981 -1.13032 -9.45007 -14.6233 15.8127c3.56696,3.96145 6.3532,8.4792 8.35991,13.5521 2.00671,5.07524 3.00947,10.4328 3.00947,16.0749 0,12.3284 -4.34413,22.786 -13.0288,31.3727 -8.68708,8.58904 -19.1931,12.8836 -31.5156,12.8836 -12.3261,0 -22.7801,-4.29452 -31.368,-12.8836 -8.58668,-8.58786 -12.88,-19.0466 -12.88,-31.3739 0,-12.3261 4.29334,-22.7836 12.8788,-31.3727 8.58668,-8.58786 19.0395,-12.8824 31.3621,-12.8824 4.10673,0 7.97959,0.483075 11.6174,1.44686 3.63782,0.964968 7.21305,2.43663 10.728,4.41618zm9.48078 38.7287l0 0c0,-8.76267 -3.08624,-16.1989 -9.25637,-22.3136 -6.17013,-6.11225 -13.6926,-9.17133 -22.5628,-9.17133 -8.7733,0 -16.2202,3.05908 -22.3395,9.17133 -6.1217,6.11462 -9.18078,13.5509 -9.18078,22.3136 0,8.76385 3.05908,16.2509 9.18078,22.4624 6.11934,6.21383 13.5662,9.31897 22.3395,9.31897 8.91976,0 16.4529,-3.09333 22.5994,-9.28236 6.14651,-6.18666 9.21976,-13.6867 9.21976,-22.499z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="snatch">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.16696}\n    .fil0 {fill:none;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0 str0" d="M2.50041 69.988c0,0 9.79023,-6.85399 26.2396,-10.1091 0,0 12.6851,-4.80122 15.019,-5.74375 2.3327,-0.942527 2.3327,-0.942527 2.3327,-0.942527 0,0 24.703,-9.0733 33.4668,-9.67803 0,0 6.32722,-1.39253 9.83866,-2.90672 0,0 11.2808,-3.14294 16.7009,5.06579 0,0 3.42168,3.62956 9.14889,7.42683 0,0 12.7253,11.4792 15.7206,16.1718 0,0 2.31734,2.6953 5.015,4.72445 0,0 4.34885,4.34413 4.08428,9.267 0,0 0.576382,9.87291 0.19134,11.445 0,0 0.532681,5.01618 1.60986,7.06069 0,0 3.17128,10.1706 1.19883,14.9989"/>\n  <line class="fil0 str0" x1="143.067" y1="116.768" x2="197.502" y2= "145.2" />\n  <path class="fil0 str0" d="M3.36735 69.4824c0,0 13.2816,-3.82208 25.4695,18.4112 0,0 10.8084,18.4336 3.43703,25.3667 0,0 9.28236,-12.9792 20.9647,-6.47367 0,0 11.1839,9.07684 31.0668,6.72643 0,0 5.33626,1.9323 10.1292,1.5756 0,0 4.7646,0.752368 5.29492,1.42088 0,0 -10.0891,9.44889 -0.161812,16.258 0,0 3.75475,3.36499 7.05596,-0.702761 0,0 0.587012,2.79687 2.19805,4.60161"/>\n  <line class="fil0 str0" x1="108.822" y1="136.666" x2="96.3197" y2= "159.986" />\n  <path class="fil0 str0" d="M127.197 99.2653c-6.46659,-7.01698 -3.9957,-14.4131 -3.9957,-14.4131 -8.69416,0.00590556 -16.0737,-11.3611 -16.0737,-11.3611 -5.67052,3.59294 -10.1788,-0.266931 -10.1788,-0.266931"/>\n  <polyline class="fil0 str0" points="96.9492,73.2242 96.2618,87.9031 96.4354,89.0357 "/>\n  <path class="fil0 str0" d="M96.4354 89.0357c9.61307,7.78353 25.3632,12.3343 25.3632,12.3343 16.2745,6.12761 8.05164,19.5309 8.05164,19.5309 -6.96502,10.4162 -22.2226,-0.142915 -22.2226,-0.142915 -1.17402,-0.336617 -7.89809,-4.24846 -7.89809,-4.24846"/>\n  <path class="fil0 str0" d="M126.038 103.175c0,0 -0.844495,-2.32325 0.858668,-3.49018"/>\n  <path class="fil0 str0" d="M126.841 99.2736c0,0 2.52876,2.61734 7.90518,0.713391"/>\n  <path class="fil0 str0" d="M122.915 84.7176c0,0 2.93152,-0.872842 5.24768,-2.98231"/>\n  <path class="fil0 str0" d="M107.128 73.4911c0,0 -0.910637,-4.80712 0.00472445,-6.1654"/>\n  <line class="fil0 str0" x1="131.761" y1="110.507" x2="143.067" y2= "116.768" />\n  <path class="fil0 str0" d="M141.563 115.784c0,0 -0.856306,-7.02289 1.45867,-9.13117"/>\n  <path class="fil0 str0" d="M112.797 97.9023c0,0 -4.11617,-6.79494 1.0878,-10.2851 0,0 2.30553,-2.00789 4.62996,-1.13269"/>\n  <path class="fil0 str0" d="M101.655 92.4208c0,0 1.20237,-3.40042 5.55949,-3.502"/>\n  <path class="fil0 str0" d="M111.961 88.9613c0,0 -2.67994,1.7634 -9.55047,-7.01817"/>\n  <line class="fil0 str0" x1="102.411" y1="81.9432" x2="101.036" y2= "79.4085" />\n  <path class="fil0 str0" d="M96.6551 84.5121c0,0 5.2028,-3.03782 5.33154,-9.39102"/>\n  <path class="fil0 str0" d="M102.337 90.8806c0,0 -4.565,-5.98706 -4.46815,-7.23785"/>\n  <path class="fil0 str0" d="M96.1602 88.3483c0,0 -1.20001,0.770085 -4.26263,-3.77838"/>\n  <path class="fil0 str0" d="M96.3197 87.4046c0,0 -3.47011,-4.95004 -4.75161,-13.995"/>\n  <line class="fil0 str0" x1="96.8819" y1="72.9124" x2="97.2716" y2= "57.7445" />\n  <path class="fil0 str0" d="M117.745 122.434c0,0 -2.5512,0.210238 -3.44058,-4.34177 0,0 -0.168899,-6.84336 3.24215,-10.5414 0,0 2.49805,-3.2516 4.93468,-2.46144 0,0 3.61656,0.0342522 5.57957,2.45907"/>\n  <line class="fil0 str0" x1="128.061" y1="107.548" x2="128.236" y2= "107.775" />\n  <path class="fil0 str0" d="M128.236 107.775c1.91694,2.64805 2.43309,3.86932 1.49411,8.05754 0,0 -0.532681,5.04453 -5.64217,6.82919 0,0 -3.60948,1.04646 -6.34257,-0.227955"/>\n  <path class="fil0 str0" d="M103.602 113.619c0,0 -1.47521,-7.80006 5.09768,-12.1973"/>\n  <path class="fil0 str0" d="M53.7477 107.047c0,0 -1.65356,-0.257482 -6.93431,-6.46304"/>\n  <path class="fil0 str0" d="M76.4522 108.864c0,0 3.97444,4.10082 8.42133,4.67956"/>\n  <path class="fil0 str0" d="M106.624 132.065c0,0 -0.0814967,-6.58115 2.31616,-10.415"/>\n  <line class="fil0 str0" x1="108.712" y1="136.45" x2="115.004" y2= "124.577" />\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="sound">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:6.30596}\n    .fil1 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="2.49923,148.272 2.49923,60.2355 50.7689,60.2355 135.952,6.30005 135.952,193.701 53.6024,145.431 "/>\n  <path class="fil1 str0" d="M150.517 63.0477c0,0 46.5724,30.2613 1.19174,74.8423"/>\n  <path class="fil1 str0" d="M164.849 43.5417c0,0 29.053,16.3194 32.6388,53.3496 0,0 1.5886,46.9704 -32.2503,62.495"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="stamp1">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil1 {fill:#403F49}\n    .fil0 {fill:#F00}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil1" d="M21.4951 137.588c0,0 -2.40238,11.791 4.95476,18.9285 7.35714,7.13273 16.108,6.21265 17.934,5.57721 0,-0.00118111 -21.8199,-2.34451 -22.8888,-24.5057zm36.8684 36.6546c0,0 3.79491,11.4273 13.7222,13.9525 9.92961,2.52167 17.0671,-2.63034 18.3261,-4.09373 0,0 -20.0848,8.83235 -32.0483,-9.85874zm52.1071 12.3568c0,0 10.1174,6.52564 19.4352,2.26537 9.32133,-4.26145 10.7824,-10.7186 10.8461,-12.6497 0,0 -9.24338,17.4391 -30.2813,10.3843zm46.5169 -23.3222c0,0 12.0237,0.656698 18.0072,-7.66069 5.9906,-8.31739 4.06657,-14.6505 3.16538,-16.3608 0,-0.00118111 0.602367,19.734 -21.1726,24.0214zm22.6195 -103.426c0,0 1.10906,-12.1182 -7.06659,-18.4773 -8.18156,-6.35911 -14.6564,-4.64886 -16.4139,-3.80082 0,0 19.9631,0.126379 23.4805,22.2781zm-37.2676 -33.044c0,0 -2.74845,-11.8619 -12.5139,-15.3296 -9.75834,-3.47247 -17.4214,1.05119 -18.8316,2.40829 0,0 21.0474,-7.0158 31.3455,12.9214zm-51.8567 -12.7194c0,0 -10.1576,-6.71108 -19.6265,-2.51104 -9.4737,4.20358 -11.9162,12.756 -12.0072,14.7131 0,-0.00118111 10.4446,-19.5793 31.6337,-12.2021zm-46.8015 21.6498c0,0 -12.13,-1.00749 -18.4194,7.23077 -6.2847,8.22999 -4.32169,16.91 -3.4642,18.6663 0,-0.00118111 -0.24449,-22.1848 21.8836,-25.8971zm121.744 64.2643c0,36.0782 -29.353,65.4289 -65.4241,65.4289 -36.0759,-0.00118111 -65.4241,-29.3494 -65.4241,-65.4289 0,-36.0771 29.3483,-65.4253 65.4241,-65.4253 36.0712,0 65.4241,29.3483 65.4241,65.4253zm-39.6027 -61.1178c-8.18274,-3.46066 -16.8675,-5.21343 -25.8215,-5.21343 -8.95401,-0.00118111 -17.6423,1.75277 -25.8226,5.21343 -7.89927,3.34018 -14.9883,8.1225 -21.0781,14.2147 -6.0969,6.09099 -10.8804,13.1847 -14.2206,21.084 -3.45829,8.17565 -5.20988,16.8651 -5.20988,25.8191 0,8.95519 1.75159,17.6446 5.20988,25.8215 3.34136,7.89219 8.12369,14.9942 14.2206,21.0864 6.08981,6.08863 13.1788,10.8698 21.0781,14.2147 8.18038,3.46066 16.8675,5.21343 25.8226,5.21343 8.95401,0 17.6375,-1.75277 25.8215,-5.21343 7.89455,-3.34491 14.993,-8.12605 21.0828,-14.2147 6.08981,-6.09336 10.8745,-13.193 14.2147,-21.0864 3.46066,-8.17684 5.20988,-16.8663 5.20988,-25.8215 0.00118111,-8.95519 -1.74923,-17.6423 -5.20988,-25.8191 -3.34018,-7.89927 -8.12605,-14.993 -14.2147,-21.084 -6.08981,-6.09336 -13.1883,-10.8745 -21.0828,-14.2147zm-25.8215 131.337c-38.7157,0 -70.2183,-31.4967 -70.2183,-70.2195 0,-38.7133 31.5026,-70.2159 70.2183,-70.2159 38.7192,-0.00118111 70.2183,31.5038 70.2183,70.2159 0,38.7227 -31.4991,70.2195 -70.2183,70.2195zm72.5899 -72.8368c-0.0307089,-0.826778 -0.0720478,-1.64883 -0.132285,-2.46734 -0.121655,-1.75986 -0.304727,-3.50318 -0.549217,-5.24059 -0.119292,-0.826778 -0.245671,-1.64765 -0.390948,-2.46616 -0.314176,-1.76104 -0.694494,-3.5079 -1.1315,-5.23941 -0.213781,-0.826778 -0.444098,-1.64647 -0.679139,-2.46262 -0.774809,-2.63624 -1.70553,-5.2276 -2.78152,-7.77998 -3.65908,-8.6481 -8.89377,-16.4163 -15.5659,-23.0896 -6.67092,-6.66738 -14.4344,-11.908 -23.0872,-15.5623 -8.95637,-3.78901 -18.4667,-5.70713 -28.2723,-5.70713 -9.80795,0 -19.3171,1.91813 -28.2723,5.70713 -8.64928,3.65318 -16.4198,8.89495 -23.0884,15.5623 -6.66856,6.67328 -11.9068,14.4415 -15.5682,23.0896 -1.07717,2.5512 -2.00198,5.14374 -2.77679,7.77998 -0.238585,0.816148 -0.462996,1.63584 -0.676777,2.46262 -0.441736,1.73033 -0.820873,3.47955 -1.1315,5.23941 -0.14882,0.81851 -0.278742,1.63938 -0.395672,2.46616 -0.248033,1.73742 -0.431106,3.48192 -0.546855,5.24059 -0.0578745,0.817329 -0.103938,1.64056 -0.135828,2.46734 -0.0283467,0.869298 -0.04252,1.7445 -0.04252,2.61734 0,0.878747 0.0141733,1.75395 0.04252,2.62207 0.03189,0.820873 0.0779534,1.64529 0.135828,2.46498 0.115749,1.75986 0.298821,3.50436 0.546855,5.24177 0.11693,0.822054 0.246852,1.64647 0.395672,2.46616 0.310632,1.75986 0.688588,3.50908 1.1315,5.23469 0.213781,0.827959 0.438192,1.65119 0.676777,2.4638 0.774809,2.64215 1.69962,5.23114 2.77679,7.78234 3.66145,8.64574 8.8985,16.4151 15.5682,23.0907 6.66856,6.66501 14.4391,11.9068 23.0884,15.5611 8.95519,3.78546 18.4643,5.70949 28.2723,5.70949 9.80559,0 19.3159,-1.92285 28.2723,-5.70949 8.65282,-3.65436 16.4151,-8.89495 23.0872,-15.5611 6.6721,-6.67564 11.9068,-14.445 15.5659,-23.0907 1.07599,-2.55238 2.00671,-5.1402 2.78152,-7.78234 0.235041,-0.813786 0.465358,-1.63466 0.679139,-2.4638 0.437011,-1.7256 0.817329,-3.47483 1.1315,-5.23469 0.145277,-0.820873 0.270475,-1.64411 0.390948,-2.46616 0.24449,-1.7386 0.427562,-3.48192 0.549217,-5.24177 0.0602367,-0.819691 0.105119,-1.64293 0.132285,-2.46498 0.0271656,-0.868117 0.0484256,-1.74332 0.0484256,-2.62207 0,-0.872842 -0.02126,-1.74805 -0.0484256,-2.61734zm-142.972 20.647l-17.6694 0c0.726384,0.73347 1.41733,1.56261 2.05277,2.4638l16.2946 0c-0.239766,-0.813786 -0.464177,-1.63466 -0.677958,-2.4638zm-1.52718 -7.70085l-23.1864 0c0.451185,0.885834 0.951976,1.70789 1.49293,2.46616l22.0892 0c-0.14882,-0.820873 -0.278742,-1.64411 -0.395672,-2.46616zm-0.681501 -7.70793l-24.7514 0c0.0413389,0.367326 0.0909456,0.734651 0.147639,1.09607l0.0165356 0.126379c0.0484256,0.282286 0.0992134,0.558666 0.158269,0.831503l0.0838589 0.412208 24.4797 0c-0.0578745,-0.819691 -0.103938,-1.64293 -0.134647,-2.46616zm0.134647 -7.70557l-24.625 0c-0.14882,0.804337 -0.261026,1.62285 -0.324806,2.46734l24.8152 0c0.0307089,-0.826778 0.0767723,-1.64883 0.134647,-2.46734zm0.942527 -7.70793l-22.5651 0c-0.503154,0.762998 -0.961425,1.58623 -1.363,2.46734l23.5325 -0.00118111c0.11693,-0.825597 0.246852,-1.64647 0.395672,-2.46616zm1.80946 -7.70085l-16.6312 0c-0.721659,0.922448 -1.50356,1.74805 -2.32088,2.46262l18.2742 -0.00118111c0.213781,-0.825597 0.438192,-1.64529 0.677958,-2.46144zm140.09 2.46144l17.6659 0c-0.729927,-0.73347 -1.41733,-1.55789 -2.05159,-2.46144l-16.2934 0c0.235041,0.816148 0.465358,1.63584 0.679139,2.46144zm1.52245 7.70557l23.1876 0c-0.452366,-0.888196 -0.951976,-1.71261 -1.49529,-2.46498l-22.0821 -0.00118111c0.144096,0.819691 0.269293,1.64056 0.389767,2.46616zm0.681501 7.70912l24.7478 0c-0.0389767,-0.370869 -0.0862212,-0.738195 -0.144096,-1.09843l-0.0141733 -0.121655c-0.0519689,-0.28701 -0.103938,-0.564571 -0.157088,-0.836227l-0.0862212 -0.411027 -24.4774 0c0.0590556,0.817329 0.100394,1.64056 0.131103,2.46734zm-0.131103 7.70439l24.6226 0c0.146458,-0.800794 0.256301,-1.62403 0.325987,-2.46498l-24.8175 -0.00118111c-0.0271656,0.822054 -0.0720478,1.64647 -0.131103,2.46616zm-0.940165 7.70793l22.5557 0c0.506697,-0.761817 0.960244,-1.58505 1.37363,-2.46616l-23.5396 0c-0.119292,0.822054 -0.245671,1.64647 -0.389767,2.46616zm17.145 5.23469l-18.2777 0c-0.213781,0.827959 -0.444098,1.65119 -0.679139,2.4638l16.6277 0c0.724021,-0.922448 1.50474,-1.74568 2.32915,-2.4638z"/>\n  <path class="fil0" d="M100.001 34.5759c-36.0759,0 -65.4241,29.3483 -65.4241,65.4253 0,36.0782 29.3483,65.4289 65.4241,65.4289 36.0712,-0.00118111 65.4241,-29.3494 65.4241,-65.4289 0,-36.0771 -29.353,-65.4253 -65.4241,-65.4253zm66.33 65.4253c0,8.95519 -1.75041,17.6446 -5.21106,25.8215 -3.34018,7.89219 -8.12605,14.9942 -14.2147,21.0864 -6.08981,6.08863 -13.1883,10.8698 -21.0828,14.2147 -8.18274,3.46066 -16.8675,5.21343 -25.8215,5.21343 -8.95401,0 -17.6423,-1.75277 -25.8226,-5.21343 -7.89927,-3.34491 -14.9883,-8.12605 -21.0781,-14.2147 -6.0969,-6.09336 -10.8804,-13.193 -14.2206,-21.0864 -3.45829,-8.17684 -5.20988,-16.8663 -5.20988,-25.8215 0,-8.95519 1.75159,-17.6423 5.20988,-25.8191 3.34136,-7.89927 8.12369,-14.993 14.2206,-21.084 6.08981,-6.09336 13.1788,-10.8745 21.0781,-14.2147 8.18038,-3.46066 16.8675,-5.21343 25.8226,-5.21343 8.95401,-0.00118111 17.6375,1.75277 25.8215,5.21343 7.89455,3.34018 14.993,8.1225 21.0828,14.2147 6.08981,6.09099 10.8745,13.1847 14.2147,21.084 3.46066,8.17565 5.20988,16.8651 5.21106,25.8191zm-66.33 -70.2171c-38.7157,0 -70.2183,31.505 -70.2183,70.2171 0,38.7227 31.5026,70.2195 70.2183,70.2195 38.7192,0 70.2183,-31.4967 70.2183,-70.2195 0,-38.7133 -31.4991,-70.2159 -70.2183,-70.2171zm-70.3824 52.1851l-18.2742 0c-0.413389,0.355515 -0.833865,0.689769 -1.26261,0.986228l-0.0330711 0.0200789c-0.0826778,0.0673234 -0.161812,0.131103 -0.252758,0.178348 -0.04252,0.0377956 -0.08504,0.0755911 -0.129922,0.1063l0 0 -0.0153545 0.00944889c-1.39135,0.98859 -2.66223,2.32443 -3.72877,3.94019l22.5651 -0.00118111c0.310632,-1.75986 0.688588,-3.50672 1.1315,-5.23941zm-1.52718 7.70557l-23.5325 0c-0.00708667,0.00826778 -0.0118111,0.0177167 -0.0177167,0.0271656 -0.721659,1.57088 -1.2697,3.32837 -1.62167,5.21461l24.625 0c0.115749,-1.75986 0.298821,-3.50318 0.546855,-5.24177zm-0.725203 10.3265c0,-0.872842 0.0141733,-1.74805 0.04252,-2.61734l-24.8128 0c-0.0578745,0.66969 -0.0897645,1.3571 -0.09567,2.05159l0.00590556 0.141733 -0.00590556 0.235041c-0.00118111,0.953157 0.0578745,1.89568 0.158269,2.81105l24.7514 -0.00118111c-0.0295278,-0.866936 -0.0437011,-1.74214 -0.0437011,-2.62089zm0.178348 5.08705l-24.4797 0 0.0188978 0.0980323 0.137009 0.571658 0.192521 0.735833 0.114568 0.38268c0.0874023,0.295278 0.179529,0.58465 0.279923,0.876385l0.0885834 0.237403c0.118111,0.330711 0.251577,0.65906 0.376775,0.970874l0.05315 0.11693c0.150001,0.359058 0.311813,0.708667 0.479531,1.04765l0 0.00472445 0.00236222 0.00708667c0.0307089,0.06378 0.0661423,0.128741 0.0968512,0.192521l23.1864 0c-0.248033,-1.7386 -0.431106,-3.48192 -0.546855,-5.24177zm0.942527 7.70793l-22.0892 0c1.0193,1.41379 2.18151,2.59254 3.43703,3.47011l0.2126 0.151182c0.656698,0.468901 1.28741,1.01339 1.90159,1.6134l17.6694 0c-0.441736,-1.7256 -0.820873,-3.47483 -1.1315,-5.23469zm138.44 15.4796c-3.66027,8.64692 -8.89495,16.4163 -15.5671,23.0919 -6.67092,6.66501 -14.4344,11.9068 -23.0872,15.5611 -8.95637,3.78546 -18.4667,5.70949 -28.2723,5.70949 -9.80795,0 -19.3171,-1.92285 -28.2723,-5.70949 -8.64928,-3.65436 -16.4198,-8.89495 -23.0884,-15.5611 -6.66856,-6.67564 -11.9068,-14.445 -15.5682,-23.0907 -1.07717,-2.55238 -2.00198,-5.1402 -2.77679,-7.78234l-16.2934 0c1.26615,1.80474 2.32679,3.92602 3.10632,6.26344 0.207876,0.641344 0.375594,1.27796 0.518508,1.9134l-0.0330711 0.0141733c0.803156,3.77129 0.674415,7.43037 -0.367326,10.3808l-0.00944889 0.0330711c-0.0188978,0.103938 -0.0578745,0.203151 -0.0968512,0.296459 -0.0188978,0.0543311 -0.0307089,0.108662 -0.0484256,0.154726l0 0 -0.00708667 0.0177167c-0.801975,2.39411 -0.955519,5.21815 -0.349609,8.20754 0.59528,2.9953 1.95474,6.1406 4.06893,9.08393l0.0885834 0.112206 0.125198 0.19134c0.790164,1.08072 1.65356,2.07876 2.5512,2.97876l0.0968512 0.0944889c0.200789,0.199608 0.405121,0.394491 0.614178,0.582288l0.383861 0.349609 0.44646 0.38268 0.583469 0.481894 0.322443 0.242128 0.740557 0.540949 0.214962 0.139371c0.294097,0.199608 0.58465,0.387405 0.874023,0.571658l0.114568 0.0590556c0.336617,0.203151 0.666147,0.39331 1.0004,0.566934l0.00472445 0.00118111 0.01063 0.00354333c2.60908,1.36773 5.26421,2.03033 7.67014,1.99844l0.258663 -0.00826778c3.72286,-0.0342522 7.94179,1.45041 11.7922,4.20948 3.83743,2.85475 6.55281,6.47131 7.63234,10.0631l0.00944889 0.0259845c0.0460634,0.1063 0.0732289,0.203151 0.0921267,0.305908 0.02126,0.0496067 0.0484256,0.100394 0.0625989,0.152363l0 -0.00118111 0.00354333 0.0224411c0.759455,2.40356 2.29962,4.77405 4.552,6.83391 2.24529,2.05986 5.20162,3.81027 8.6481,4.93587 1.27678,0.415751 2.56065,0.714573 3.81972,0.912999l0.12756 0.0248033c0.285829,0.0437011 0.562209,0.07441 0.83977,0.111024l0.516146 0.0543311 0.589375 0.0496067 0.760636 0.0377956 0.40394 0.00708667 0.915362 0 0.259845 -0.00236222c0.348428,-0.0141733 0.696856,-0.0330711 1.03583,-0.0590556l0.131103 -0.00826778c0.389767,-0.0413389 0.768904,-0.0826778 1.14332,-0.134647l0.00590556 -0.00118111 0.00472445 -0.00236222c2.91971,-0.429925 5.45437,-1.46104 7.38077,-2.90317l0.205513 -0.157088c3.02128,-2.24411 7.37604,-3.54333 12.1784,-3.54924 0.617721,0.00354333 1.21891,0.0177167 1.81537,0.0661423l-0.0826778 -3.97444 0.0826778 4.04885c3.84334,0.402759 7.28037,1.65356 9.76071,3.56578l0.0236222 0.0177167c0.0944889,0.0543311 0.179529,0.119292 0.25512,0.185435 0.0496067,0.0283467 0.09567,0.0614178 0.137009,0.0921267l0 0 0.0129922 0.01063c2.02443,1.51182 4.66067,2.5323 7.69022,2.89018 3.02601,0.359058 6.44533,0.0484256 9.90598,-1.05119 1.2756,-0.409846 2.49333,-0.909456 3.63192,-1.48702l0.115749 -0.0578745 0.747644 -0.401578 0.450004 -0.252758 0.51024 -0.30827 0.634257 -0.406302 0.334255 -0.230317c0.257482,-0.173623 0.503154,-0.353152 0.7441,-0.533862l0.20197 -0.15945c0.285829,-0.210238 0.549217,-0.429925 0.817329,-0.657879l0.0933078 -0.0803156c0.295278,-0.248033 0.576382,-0.516146 0.849219,-0.777171l0.00118111 -0.00472445 0.00590556 -0.00708667c2.11655,-2.04805 3.57877,-4.36185 4.29688,-6.66501l0.0767723 -0.248033c1.14213,-3.58704 3.9083,-7.1788 7.80833,-9.99693 0.587012,-0.427562 1.18702,-0.820873 1.78938,-1.18111l0.02126 0.03189c3.34255,-1.93466 6.86108,-2.94687 9.98748,-2.86656l0.0389767 -0.00118111c0.109843,-0.00708667 0.211419,-0.00354333 0.310632,0.00472445 0.0566934,-0.00472445 0.109843,-0.00826778 0.164175,-0.00826778l0.00590556 0 0.0141733 0c2.51695,0.0330711 5.25358,-0.693313 7.91227,-2.19096 2.65986,-1.49056 5.23941,-3.75003 7.38431,-6.66619l0.0814967 -0.112206 0.139371 -0.186616c0.794888,-1.08426 1.47521,-2.2075 2.05632,-3.34727l0.0578745 -0.112206c0.133466,-0.251577 0.249215,-0.511421 0.368507,-0.762998l0.218506 -0.472445 0.219687 -0.546855 0.278742 -0.70158 0.128741 -0.38268c0.102757,-0.292916 0.203151,-0.582288 0.288191,-0.87166l0.0696856 -0.250396c0.0968512,-0.338979 0.186616,-0.670871 0.268112,-1.00867l0.0307089 -0.121655c0.08504,-0.381499 0.161812,-0.757093 0.224411,-1.12796l0.00236222 0 0 -0.0153545c0.501972,-2.89845 0.314176,-5.63154 -0.458271,-7.91345l-0.0885834 -0.243309c-1.18229,-3.53389 -1.07009,-8.00085 0.356696,-12.5162 0.216143,-0.638981 0.447641,-1.2567 0.706305,-1.85553l0.0354333 0.0118111c0.784258,-1.75513 1.73387,-3.35554 2.8075,-4.74334l-16.6277 0c-0.774809,2.64215 -1.70553,5.23114 -2.78034,7.78116zm-133.854 -56.5481c3.66027,-8.6481 8.89731,-16.4163 15.5671,-23.0896 6.66856,-6.66738 14.4391,-11.908 23.0884,-15.5623 8.95519,-3.78901 18.4643,-5.70713 28.2723,-5.70713 9.80559,0 19.3159,1.91813 28.2723,5.70713 8.65282,3.65318 16.4151,8.89495 23.0872,15.5623 6.6721,6.67328 11.9068,14.4415 15.5659,23.0896 1.07599,2.5512 2.00671,5.14374 2.78152,7.77998l16.2934 0c-1.26851,-1.80474 -2.32679,-3.92247 -3.10632,-6.26225 -0.203151,-0.638981 -0.376775,-1.27914 -0.519689,-1.91222l0.0342522 -0.00944889c-0.806699,-3.7772 -0.681501,-7.43746 0.364964,-10.3843l0.0118111 -0.0307089c0.0188978,-0.107481 0.0555122,-0.206695 0.0944889,-0.29764 0.0153545,-0.0555122 0.0295278,-0.111024 0.0484256,-0.15945l0 0 0.00354333 -0.0188978c0.80788,-2.39175 0.957882,-5.21697 0.357877,-8.20754 -0.598824,-2.98703 -1.95828,-6.1406 -4.07484,-9.08039l-0.0826778 -0.108662 -0.133466 -0.198427c-0.790164,-1.08072 -1.65119,-2.07639 -2.5512,-2.97876l-0.0921267 -0.0944889c-0.203151,-0.197246 -0.405121,-0.39331 -0.614178,-0.581107l-0.383861 -0.347247 -0.44646 -0.385042 -0.587012 -0.475988 -0.3189 -0.243309 -0.745281 -0.54213 -0.2126 -0.145277c-0.289372,-0.196065 -0.587012,-0.383861 -0.876385,-0.56339l-0.109843 -0.0696856c-0.337798,-0.193702 -0.666147,-0.381499 -1.0004,-0.559847l-0.00944889 -0.00354333 -0.00590556 -0.00236222c-2.60908,-1.36655 -5.26421,-2.02797 -7.67014,-1.99135l-0.256301 0c-3.72523,0.0389767 -7.94298,-1.45041 -11.7981,-4.20712 -0.54213,-0.402759 -1.05355,-0.812605 -1.54489,-1.23781l0.0236222 -0.0377956c-2.86538,-2.58427 -4.91461,-5.61619 -5.80044,-8.61739l-0.00944889 -0.03189c-0.04252,-0.102757 -0.07441,-0.203151 -0.0944889,-0.300002 -0.0200789,-0.0519689 -0.0389767,-0.103938 -0.0507878,-0.155907l-0.00590556 0 -0.00354333 -0.0188978c-0.751187,-2.40711 -2.28427,-4.78232 -4.52602,-6.85045 -2.23703,-2.07167 -5.18744,-3.82444 -8.63275,-4.96894l-0.131103 -0.0437011 -0.219687 -0.0708667c-1.27796,-0.424019 -2.56183,-0.716935 -3.81972,-0.921267l-0.125198 -0.0224411c-0.288191,-0.0366145 -0.565752,-0.0779534 -0.844495,-0.113387l-0.519689 -0.0566934 -0.588194 -0.04252 -0.75473 -0.0413389 -0.40394 -0.0129922 -0.912999 0 -0.261026 0.00826778c-0.351971,0.0141733 -0.70158,0.0366145 -1.04292,0.0602367l-0.12756 0.01063c-0.389767,0.0377956 -0.770085,0.0838589 -1.14095,0.137009l-0.00826778 0 -0.00590556 0c-2.91735,0.431106 -5.45319,1.46104 -7.3784,2.90553l-0.206695 0.155907c-2.99294,2.21813 -7.27565,3.50554 -12.0166,3.54097 -0.668509,-0.00590556 -1.32875,-0.0354333 -1.97718,-0.0944889l0 -0.0389767c-3.83861,-0.405121 -7.28155,-1.65001 -9.75953,-3.56105l-0.0271656 -0.0236222c-0.0944889,-0.0555122 -0.181891,-0.113387 -0.250396,-0.184253 -0.0484256,-0.0283467 -0.0968512,-0.0614178 -0.139371,-0.0944889l-0.00236222 0 -0.0118111 -0.00826778c-2.02324,-1.51064 -4.65949,-2.53348 -7.69494,-2.8949 -3.0201,-0.356696 -6.43824,-0.0413389 -9.8989,1.05355l-0.128741 0.0460634 -0.224411 0.0708667c-1.27796,0.407484 -2.49096,0.92481 -3.62956,1.49883l-0.11693 0.0578745c-0.252758,0.128741 -0.500791,0.266931 -0.745281,0.408665l-0.453547 0.251577 -0.503154 0.305908 -0.6378 0.413389 -0.331892 0.229136 -0.739376 0.536225 -0.205513 0.160631c-0.274018,0.217325 -0.544492,0.438192 -0.812605,0.65906l-0.0944889 0.0874023c-0.291735,0.253939 -0.571658,0.516146 -0.844495,0.781896l0 0 -0.01063 0.00472445c-2.10474,2.06222 -3.55515,4.38311 -4.26499,6.68037l-0.0779534 0.251577c-1.11261,3.54688 -3.82208,7.11029 -7.63352,9.92842 -0.543311,0.388586 -1.09961,0.751187 -1.65474,1.08426l-0.0224411 -0.03189c-3.34609,1.93702 -6.86226,2.95278 -9.98748,2.86538l-0.0354333 0c-0.108662,0.0129922 -0.2126,0.00826778 -0.315357,-0.00354333 -0.0543311,0.00354333 -0.103938,0.00944889 -0.161812,0.00944889l0 0 -0.0177167 0c-2.52167,-0.0236222 -5.25831,0.696856 -7.91581,2.18978 -2.65632,1.49293 -5.23469,3.75239 -7.38549,6.66738l-0.0791345 0.114568 -0.139371 0.185435c-0.79725,1.0819 -1.47285,2.2075 -2.05868,3.34373l-0.0590556 0.114568c-0.12756,0.257482 -0.248033,0.507878 -0.364964,0.766541l-0.214962 0.471264 -0.222049 0.544492 -0.279923 0.702761 -0.133466 0.380318c-0.101576,0.294097 -0.203151,0.58465 -0.283467,0.872842l-0.0732289 0.250396c-0.0933078,0.336617 -0.185435,0.675596 -0.268112,1.00985l-0.0259845 0.122836c-0.0826778,0.380318 -0.164175,0.751187 -0.225592,1.1256l0 0.00590556 -0.00590556 0.00590556c-0.498429,2.90317 -0.307089,5.63626 0.465358,7.91581l0.08504 0.24449c1.17993,3.53389 1.06772,8.00203 -0.36142,12.5198 -0.210238,0.6378 -0.44646,1.25434 -0.702761,1.85316l-0.0377956 -0.0118111c-0.783077,1.75631 -1.73505,3.35436 -2.80514,4.74098l16.6312 0c0.773628,-2.63624 1.69844,-5.2276 2.77679,-7.77998zm138.446 15.4808l22.0821 0c-1.01694,-1.41615 -2.18388,-2.59018 -3.43231,-3.47247l-0.216143 -0.146458c-0.65906,-0.46772 -1.28859,-1.01339 -1.90041,-1.6193l-17.6659 -0.00118111c0.437011,1.73151 0.817329,3.48074 1.13269,5.23941zm0.940165 7.70793l24.4774 0 -0.02126 -0.0980323 -0.134647 -0.572839 -0.19134 -0.73347 -0.115749 -0.383861c-0.0885834,-0.29764 -0.184253,-0.588194 -0.282286,-0.87166l-0.0874023 -0.24449c-0.11693,-0.327168 -0.246852,-0.650793 -0.377956,-0.970874l-0.0519689 -0.11693c-0.145277,-0.359058 -0.311813,-0.708667 -0.477169,-1.04646l-0.00354333 -0.00236222 -0.00472445 -0.00944889c-0.0307089,-0.0625989 -0.06378,-0.126379 -0.0921267,-0.190159l-23.1876 -0.00118111c0.24449,1.7386 0.427562,3.4831 0.550398,5.24177zm0.179529 5.08469c0,0.878747 -0.02126,1.75395 -0.0484256,2.62207l24.8175 -0.00118111c0.0555122,-0.672053 0.0885834,-1.3571 0.0885834,-2.05395l0 -0.142915 0.00472445 -0.232679c0.00354333,-0.955519 -0.0543311,-1.89214 -0.162993,-2.80868l-24.7478 0c0.0271656,0.869298 0.0484256,1.7445 0.0484256,2.61734zm-0.729927 10.3288l23.5396 0c0.00118111,-0.0118111 0.00826778,-0.0200789 0.00826778,-0.0295278 0.72284,-1.57088 1.2756,-3.32601 1.62521,-5.21225l-24.6226 0c-0.122836,1.75986 -0.305908,3.50436 -0.550398,5.24177zm-1.52245 7.70085l18.2777 0c0.406302,-0.353152 0.825597,-0.685045 1.25316,-0.979142l0.0307089 -0.0248033c0.0826778,-0.0649611 0.167718,-0.132285 0.252758,-0.178348 0.0472445,-0.0377956 0.0897645,-0.07441 0.129922,-0.101576l0 -0.00118111 0.0236222 -0.0118111c1.38781,-0.989772 2.65632,-2.32443 3.7205,-3.93783l-22.5557 0c-0.315357,1.75986 -0.695675,3.50908 -1.13269,5.23469z"/>\n  <path class="fil1" d="M69.7943 59.5174c0,0 -0.0519689,-0.583469 0.39331,-0.840952 0,0 -0.381499,-0.34016 -0.237403,-0.796069 0.359058,-0.224411 0.809061,0.0921267 0.809061,0.0921267 0.145277,-0.51024 0.698037,-0.624808 0.698037,-0.624808 -0.336617,0.887015 0.153545,1.65592 0.698037,2.00789 1.03229,0.600005 3.7831,1.61222 8.72251,-0.480712 4.28035,-1.82482 9.96268,-6.6473 13.7824,-5.31264 3.79255,1.32403 3.53979,5.88194 0.745281,6.48076 -2.8075,0.591737 -3.36735,-1.3134 -3.36735,-2.07049 0,-0.336617 0.179529,-1.05709 0.824416,-1.17875 0.48898,-0.0814967 1.05001,0.377956 1.06182,0.842133l-0.0862212 0.237403c0,0 0.88229,0.177167 1.05119,-0.377956 0.154726,-0.544492 -0.41457,-1.89332 -2.64097,-1.48938 -2.20395,0.389767 -8.36109,3.49609 -10.395,4.14334 -1.92876,0.615359 -6.47485,1.96773 -9.93551,-0.41457l0 0c-0.00944889,-0.00590556 -0.0165356,-0.00708667 -0.0342522,-0.0200789 -0.0980323,-0.0673234 -0.197246,-0.140552 -0.312995,-0.22323 -0.500791,-0.309451 -1.16221,-0.416932 -1.77639,0.0259845zm34.1719 -8.6103c0,0 -1.44686,-1.37481 -3.08034,-0.64843 0,0 -0.103938,-1.80001 -1.5697,-2.3823 -1.36891,0.526776 -1.50828,2.45553 -1.50828,2.45553 -1.6382,-0.721659 -3.13231,0.575201 -3.13231,0.575201 4.46106,1.41497 4.80949,7.12447 3.79255,8.1355 -1.0193,1.01576 -0.598824,1.77639 -0.181891,1.99608 0.4252,0.2126 1.02993,1.19056 1.02993,1.19056 0,-0.00118111 0.596461,-0.976779 1.04292,-1.19056 0.422838,-0.220868 0.830321,-0.979142 -0.185435,-1.99608 -1.03702,-1.01221 -0.688588,-6.72053 3.79255,-8.1355zm24.7514 8.6103c0,0 0.0448822,-0.583469 -0.405121,-0.840952 0,0 0.392129,-0.34016 0.243309,-0.796069 -0.353152,-0.224411 -0.814967,0.0921267 -0.814967,0.0921267 -0.131103,-0.51024 -0.695675,-0.624808 -0.695675,-0.624808 0.333073,0.887015 -0.153545,1.65592 -0.696856,2.00789 -1.02639,0.600005 -3.77483,1.61222 -8.7166,-0.480712 -4.28271,-1.82482 -9.96386,-6.6473 -13.7824,-5.31264 -3.802,1.32403 -3.54688,5.88194 -0.737014,6.48076 2.80278,0.591737 3.34845,-1.3134 3.35672,-2.07049 0,-0.336617 -0.179529,-1.05709 -0.826778,-1.17875 -0.483075,-0.0814967 -1.05119,0.377956 -1.06182,0.842133l0.0921267 0.237403c0,0 -0.890558,0.177167 -1.05828,-0.377956 -0.14882,-0.544492 0.428744,-1.89332 2.62679,-1.48938 2.2264,0.389767 8.38353,3.49609 10.4139,4.14334 1.9323,0.615359 6.47485,1.96773 9.93433,-0.41457l0.00118111 0c0.0118111,-0.00590556 0.0118111,-0.00708667 0.0153545,-0.0200789 0.107481,-0.0673234 0.210238,-0.140552 0.32953,-0.22323 0.504335,-0.309451 1.16221,-0.416932 1.7823,0.0259845z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="t-short">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M51.3205 172.289l0 -83.4184 -30.3558 18.4372 -18.8883 -26.7569 51.0441 -45.4208 25.8581 -6.9721c0,0 18.6616,18.8883 40.2487,-0.448822l31.2546 8.54298 47.4453 44.072 -18.6627 26.9837 -31.4802 -17.7651 -0.224411 82.5255 -96.2393 0.220868z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="tag">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.16696}\n    .fil1 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="116.382,54.6453 116.378,54.6453 "/>\n  <polygon class="fil1 str0" points="102.121,12.3899 138.86,2.49805 182.665,35.0011 186.904,70.3258 99.2949,197.5 13.0985,138.15 "/>\n  <path class="fil1 str0" d="M156.284 36.7361c0,4.68547 -3.79491,8.4792 -8.47802,8.4792 -4.68311,0 -8.4792,-3.79373 -8.4792,-8.4792 0,-4.68193 3.79609,-8.47802 8.4792,-8.47802 4.68311,0 8.47802,3.79609 8.47802,8.47802"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="tear">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M146.973 150.752c0,6.46777 -1.24253,12.4997 -3.71223,18.1017 -2.47797,5.61028 -5.85831,10.5521 -10.1375,14.8253 -4.28625,4.27917 -9.23629,7.65124 -14.8454,10.1209 -5.61737,2.47089 -11.6635,3.69924 -18.1312,3.69924 -6.47485,0 -12.5635,-1.22836 -18.2753,-3.69924 -5.71067,-2.4697 -10.7115,-5.84178 -14.9919,-10.1209 -4.28744,-4.27326 -7.6666,-9.21503 -10.1363,-14.8253 -2.47915,-5.60201 -3.71342,-11.6339 -3.71342,-18.1017 0,-4.37366 1.14095,-11.0741 3.42286,-20.1002 2.28073,-9.02487 5.18744,-19.0513 8.71188,-30.0746 3.51735,-11.0245 7.32525,-22.3313 11.4237,-33.9286 4.09137,-11.5902 7.89927,-22.1423 11.4237,-31.6479 3.51617,-9.50322 7.56502,-20.3376 12.1347,-32.503 4.56382,12.1655 8.6103,22.9998 12.1347,32.503 3.51735,9.50559 7.28273,20.0576 11.2784,31.6479 3.99688,11.5973 7.754,22.9041 11.2784,33.9286 3.51617,11.0233 6.42407,21.0498 8.70479,30.0746 2.28191,9.02606 3.42995,15.7265 3.42995,20.1002z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="wave">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M195.933 88.685c-7.64415,11.8229 -16.3312,20.9907 -30.0652,25.2262 -12.9958,4.01814 -28.5014,3.2894 -41.6247,0.546855 -14.8501,-3.10869 -26.4616,-11.0576 -37.7212,-20.8206 -9.3485,-8.0977 -18.9864,-16.6773 -30.7621,-21.0356 -21.5033,-7.98077 -51.9146,1.05355 -53.2221,27.8943 -0.55276,11.3387 4.96421,24.0852 16.3123,28.1034 9.89535,3.50318 21.058,1.43151 26.4711,-8.18628 1.93584,-3.4394 -1.99962,-7.67959 -5.51225,-5.51107 -9.89535,6.1158 -22.9018,-0.990953 -24.1301,-12.1584 -1.28623,-11.7343 11.0517,-20.3293 21.4443,-21.0521 22.4895,-1.56025 40.8759,21.2482 58.2099,32.3117 18.5328,11.8277 40.7991,12.045 61.7651,7.9288 18.5529,-3.64137 31.8841,-15.8304 40.2972,-32.3896 0.496067,-0.972055 -0.872842,-1.77639 -1.46222,-0.857487z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="woman-pray">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_230854104">\n   <g>\n    <g>\n     <path id="_230854320" class="fil0" d="M93.5877 72.5758l22.6147 -12.7442 0 12.7194c-0.129922,2.59845 1.20237,5.17327 3.62365,6.53982 3.75239,2.11773 23.3104,13.3395 28.6786,16.3915 3.40869,1.94057 7.73864,0.729927 9.66976,-2.67994 1.92757,-3.40633 0.728746,-7.73982 -2.6823,-9.66504 -3.1453,-1.78466 -17.3801,-9.9426 -25.0762,-14.3399 -0.0200789,-7.79297 -0.0625989,-25.7541 -0.0625989,-27.0687l-0.0224411 0c-0.0921267,-2.51813 -0.759455,-5.05752 -2.08348,-7.40793 -4.43035,-7.8414 -14.3729,-10.6111 -22.212,-6.18312l-36.0712 20.3175c-8.63275,4.87209 -15.1607,13.043 -17.8832,22.7955l-13.9525 47.587 26.3175 0c0,15.43 0,65.6922 0,69.7529 0,4.9276 3.98389,8.90913 8.90558,8.90913 4.91697,0 8.90676,-3.98153 8.90676,-8.90913 0,-4.64649 0,-56.0343 0,-69.7529l25.2463 0 -13.917 -46.2618z"/>\n     <path id="_230854272" class="fil0" d="M144.151 37.9491c9.78905,0 17.7226,-7.93707 17.7226,-17.7249 0,-9.78669 -7.93353,-17.7261 -17.7226,-17.7261 -9.78551,0 -17.7214,7.93943 -17.7214,17.7261 0,9.78787 7.93589,17.7249 17.7214,17.7249z"/>\n    </g>\n   </g>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n  </div>\n');
/*--|/home/user/ngn-env/ngn/more/scripts/js/common/tpl.php| (with request data)--*/
Ngn.toObj('Ngn.tpls.svgItem', '<div class="selectItems">\n    <div class="item" data-name="@">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M185.86 77.0793c0,20.5844 -7.27683,38.1605 -21.8163,52.7284 -14.5466,14.5714 -32.0896,21.8529 -52.6327,21.8529 -14.2466,0 -26.4392,-5.07642 -36.5814,-15.2293 -10.1398,-10.1528 -15.2104,-22.3573 -15.2104,-36.6133 0,-14.2572 5.07642,-26.4628 15.234,-36.6145 10.1528,-10.1517 22.3632,-15.2304 36.6251,-15.2304 13.5698,0 25.3467,4.65712 35.3282,13.956 9.98394,9.30125 15.4466,20.7439 16.4009,34.329 2.24411,-6.16068 3.37207,-12.5387 3.37207,-19.1399 0,-15.28 -5.39532,-28.3207 -16.1741,-39.1243 -10.7835,-10.8072 -23.7935,-16.2131 -39.0346,-16.2131 -21.4821,0 -39.8424,7.65242 -55.0823,22.949 -15.247,15.2954 -22.864,33.7184 -22.864,55.2689 0,21.5565 7.61108,39.9806 22.8462,55.276 15.2293,15.2966 33.5719,22.9431 55.0363,22.9431 17.5655,0 33.4491,-5.5087 47.6425,-16.5356 1.64293,-1.58623 4.14925,-3.83861 7.52604,-6.74887 2.42246,-2.11301 4.67248,-3.17719 6.7536,-3.17719 2.68349,0 5.01972,1.02993 7.0099,3.0768 1.98899,2.04569 2.98349,4.3772 2.98349,6.98628 0,2.35277 -0.994496,4.66775 -2.98349,6.9284 -8.03865,8.97645 -18.5435,16.0761 -31.5038,21.299 -12.28,4.96894 -24.7278,7.45281 -37.3479,7.45281 -26.7971,0 -49.7047,-9.53275 -68.7194,-28.5983 -19.0206,-19.0667 -28.525,-42.0322 -28.525,-68.8954 0,-26.8656 9.4985,-49.8382 28.5085,-68.9025 19.0076,-19.0643 41.9058,-28.6053 68.6911,-28.6053 20.5608,0 38.1204,7.28864 52.6776,21.8577 14.5584,14.569 21.8399,32.1451 21.8399,52.7236zm-42.2011 22.7388l0 0c0,-8.94338 -3.17719,-16.6064 -9.52212,-22.9892 -6.34375,-6.378 -13.9666,-9.57291 -22.8569,-9.57291 -8.89613,0 -16.5202,3.19491 -22.864,9.57291 -6.34257,6.38273 -9.51622,14.0458 -9.51622,22.9892 0,9.03196 3.17365,16.7175 9.51622,23.0553 6.34375,6.33903 14.0127,9.50441 22.9951,9.50441 8.89023,0 16.4895,-3.189 22.7943,-9.57291 6.29769,-6.378 9.45362,-14.0399 9.45362,-22.9868z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="airplane">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M158.016 83.6227l-10.4245 -0.7441 -60.8024 -71.2021c-4.79649,-6.11816 -9.43236,-9.17842 -13.8922,-9.17842l-8.44022 0 38.5338 82.3306 -53.4642 3.96735 -20.888 -23.3695 -16.18 0 21.4183 32.757 -21.3864 35.9719 16.1612 0 20.8809 -23.3683 53.4583 3.97208 -38.5338 82.7404 8.44022 0c4.45988,0 9.09574,-3.06026 13.8922,-9.1796l60.8024 -71.201 10.4245 -0.7441c2.47561,-0.330711 4.75161,-0.622446 6.81974,-0.869298 2.06813,-0.246852 4.7587,-0.784258 8.06463,-1.61458 3.30711,-0.823235 6.57407,-2.56065 9.80205,-5.20516 3.2268,-2.64451 4.84256,-5.54296 4.84256,-8.68708 0,-9.25755 -9.84811,-14.7155 -29.529,-16.3761z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="alert">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M74.3864 72.4636l0 5.778 -54.8178 0 0 -5.778 54.8178 0zm-30.2932 -49.0445l0 0 39.9168 37.7483 -3.85397 3.84688 -39.6724 -37.994 3.60948 -3.60121zm39.9168 56.7453l0 0c0,-3.68625 0.878747,-6.44887 2.64097,-8.29731 1.7634,-1.8449 4.00751,-2.76853 6.73234,-2.76853l13.2261 -0.237403c3.84688,0.160631 6.41226,0.762998 7.69376,1.8012 1.28269,1.04528 1.92403,3.00711 1.92403,5.89257l18.7525 120.943 -69.9667 0 18.997 -117.334zm20.6765 -22.8439l0 0 -7.45636 0 0 -54.8225 7.45636 0 0 54.8225zm55.0611 -30.3002l0 0 -36.0641 37.994 -3.84688 -3.84688 36.0641 -37.7483 3.84688 3.60121zm20.6824 45.4433l0 0 0 5.778 -52.8996 0 0 -5.778 52.8996 0z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow1">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="2.49923,118.923 125.327,118.923 62.5529,181.695 115.81,181.695 197.502,100 115.81,18.3025 62.5529,18.3025 125.327,81.0786 2.49923,81.0786 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow10">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M100.15 113.08c-3.57523,-3.56932 -3.57523,-9.36503 0,-12.9367 3.5705,-3.56696 9.36267,-3.56696 12.9344,0l18.2423 18.2435 0 -25.8002c0,-5.0528 4.09137,-9.14417 9.1418,-9.14417 5.06106,0 9.15362,4.09137 9.15362,9.14417l0 25.8002 18.2423 -18.2435c3.57168,-3.5705 9.36622,-3.5705 12.9367,0 3.5705,3.57168 3.5705,9.36031 0,12.9367l-18.2021 18.1997 25.76 0.0448822c5.05161,0 9.14299,4.09137 9.14299,9.14653 0,5.05161 -4.09137,9.14653 -9.14299,9.14653l-25.7789 0 18.221 18.2446c3.5705,3.5705 3.5705,9.36149 0,12.932 -3.5705,3.57641 -9.36503,3.57641 -12.9367,0l-18.1986 -18.1974 -0.0437011 25.7565c0,5.05161 -4.09255,9.14653 -9.15362,9.14653 -5.05043,0 -9.1418,-4.09491 -9.1418,-9.14653l0 -25.8014 -18.2423 18.2423c-3.57168,3.57641 -9.36385,3.57641 -12.9344,0 -3.57523,-3.5705 -3.57523,-9.36149 0,-12.932l18.2399 -18.2446 -25.7978 0c-5.04925,0 -9.14535,-4.09491 -9.14535,-9.14653 0,-5.05516 4.0961,-9.14653 9.14535,-9.14653l25.7825 0 -18.2246 -18.2446z"/>\n  <path class="fil0" d="M89.9109 20.8289c0,-5.05043 -4.09491,-9.14535 -9.14653,-9.14535 -5.04925,0 -9.14653,4.09491 -9.14653,9.14535l0 37.8487 -53.5032 -53.4985c-3.5705,-3.57641 -9.36149,-3.57641 -12.932,0 -3.57641,3.56578 -3.57641,9.35795 0,12.9332l53.4784 53.5032 -37.8286 0c-5.05043,0 -9.14653,4.0961 -9.14653,9.14771 0,5.05043 4.0961,9.14535 9.14653,9.14535l59.906 -0.03189c2.33624,0 4.67838,-0.890558 6.47013,-2.6764 1.77167,-1.77994 2.66813,-4.10909 2.6764,-6.43706l0.0259845 -59.9343z"/>\n  <path class="fil0" d="M100.15 113.08c-3.57523,-3.56932 -3.57523,-9.36503 0,-12.9367 3.5705,-3.56696 9.36267,-3.56696 12.9344,0l18.2423 18.2435 0 -25.8002c0,-5.0528 4.09137,-9.14417 9.1418,-9.14417 5.06106,0 9.15362,4.09137 9.15362,9.14417l0 25.8002 18.2423 -18.2435c3.57168,-3.5705 9.36622,-3.5705 12.9367,0 3.5705,3.57168 3.5705,9.36031 0,12.9367l-18.2021 18.1997 25.76 0.0448822c5.05161,0 9.14299,4.09137 9.14299,9.14653 0,5.05161 -4.09137,9.14653 -9.14299,9.14653l-25.7789 0 18.221 18.2446c3.5705,3.5705 3.5705,9.36149 0,12.932 -3.5705,3.57641 -9.36503,3.57641 -12.9367,0l-18.1986 -18.1974 -0.0437011 25.7565c0,5.05161 -4.09255,9.14653 -9.15362,9.14653 -5.05043,0 -9.1418,-4.09491 -9.1418,-9.14653l0 -25.8014 -18.2423 18.2423c-3.57168,3.57641 -9.36385,3.57641 -12.9344,0 -3.57523,-3.5705 -3.57523,-9.36149 0,-12.932l18.2399 -18.2446 -25.7978 0c-5.04925,0 -9.14535,-4.09491 -9.14535,-9.14653 0,-5.05516 4.0961,-9.14653 9.14535,-9.14653l25.7825 0 -18.2246 -18.2446z"/>\n  <path class="fil0" d="M89.9109 20.8289c0,-5.05043 -4.09491,-9.14535 -9.14653,-9.14535 -5.04925,0 -9.14653,4.09491 -9.14653,9.14535l0 37.8487 -53.5032 -53.4985c-3.5705,-3.57641 -9.36149,-3.57641 -12.932,0 -3.57641,3.56578 -3.57641,9.35795 0,12.9332l53.4784 53.5032 -37.8286 0c-5.05043,0 -9.14653,4.0961 -9.14653,9.14771 0,5.05043 4.0961,9.14535 9.14653,9.14535l59.906 -0.03189c2.33624,0 4.67838,-0.890558 6.47013,-2.6764 1.77167,-1.77994 2.66813,-4.10909 2.6764,-6.43706l0.0259845 -59.9343z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.16696}\n    .str1 {stroke:#2B2A29;stroke-width:12.4997}\n    .fil0 {fill:none;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0 str0" d="M180.363 100.054c0.0519689,-2.04096 -0.668509,-4.10082 -2.15907,-5.70123"/>\n  <polyline class="fil0 str0" points="178.204,94.3531 178.212,94.3378 125.682,41.8066 125.637,41.8539 122.781,38.9956 "/>\n  <path class="fil0 str0" d="M122.781 38.9956c-0.204332,-0.25512 -0.413389,-0.503154 -0.646068,-0.738195 -3.15002,-3.14648 -8.25361,-3.14648 -11.3954,0 -3.0827,3.07798 -3.14294,8.01975 -0.197246,11.1816"/>\n  <polyline class="fil0 str0" points="110.543,49.439 110.528,49.4508 153.286,92.2094 149.378,92.2094 68.3344,92.2094 45.4669,92.2094 45.4669,92.2743 28.6738,92.2743 "/>\n  <path class="fil0 str0" d="M28.6738 92.2743c-0.314176,-0.0413389 -0.644887,-0.0649611 -0.976779,-0.0649611 -4.45043,0 -8.05754,3.6083 -8.05754,8.05872 0,4.3524 3.45003,7.89337 7.7729,8.04691"/>\n  <polyline class="fil0 str0" points="27.4124,108.315 27.4124,108.33 50.2787,108.33 131.314,108.33 152.744,108.33 114.28,146.791 114.325,146.837 111.467,149.696 "/>\n  <path class="fil0 str0" d="M111.467 149.696c-0.253939,0.198427 -0.503154,0.408665 -0.737014,0.643706 -3.14884,3.15002 -3.14884,8.25361 0,11.4036 3.07443,3.07325 8.02211,3.13467 11.178,0.193702"/>\n  <polyline class="fil0 str0" points="121.908,161.937 121.925,161.947 174.453,109.417 174.409,109.37 177.266,106.509 "/>\n  <path class="fil0 str0" d="M177.266 106.509c0.25512,-0.197246 0.503154,-0.408665 0.735833,-0.641344 1.60749,-1.60395 2.38939,-3.71342 2.36104,-5.81343"/>\n  <path class="fil0 str1" d="M2.50041 99.9976c0,-53.8504 43.6515,-97.5019 97.4972,-97.5019 53.8516,0 97.5043,43.6515 97.5043,97.5019 0,53.854 -43.6527,97.5043 -97.5043,97.5043 -53.8457,0 -97.4972,-43.6503 -97.4972,-97.5043"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow3">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M27.1963 163.713c24.8742,-24.5636 52.0622,-48.2543 60.6229,-52.8311 14.0387,-7.50478 24.5459,-5.40713 32.542,-5.16736l-6.13824 19.7576c-1.03465,4.1398 0,7.24848 2.58545,9.83866 3.62719,3.09924 9.84457,2.06222 13.4635,-1.0441l67.2301 -47.9035 -68.1738 -47.1618c-3.62011,-3.1075 -9.83275,-4.14334 -13.4517,-1.03702 -2.59372,2.59018 -3.62601,5.69532 -2.59372,9.83866l7.41502 19.1742c0,0 -27.1986,-0.963787 -45.3972,8.13668 -18.2045,9.09692 -72.8002,63.0489 -72.8002,63.0489l24.6959 25.3502z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow4">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M168.033 78.1731c-2.36222,1.69017 -5.07996,2.36931 -8.12369,1.35119l-16.2356 -5.41303 0 41.2893c0,14.8879 -12.5328,27.4112 -27.416,27.4112l-41.9649 0c-5.4154,0 -7.78234,2.36695 -7.78234,7.78353l0 49.4047 -37.2286 0 0 -67.0068c0,-14.8891 12.521,-27.4077 27.4183,-27.4077l41.9578 0c6.08981,0 7.78234,-1.6949 7.78234,-7.78353l0 -23.6907 -16.2415 5.41303c-3.04491,1.01812 -5.75438,0.338979 -8.12369,-1.35119 -3.38507,-2.70947 -3.38507,-7.78353 -1.01812,-11.1721l44 -67.0021 43.994 67.0021c2.36695,3.38861 2.36695,8.46267 -1.01812,11.1721z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow5">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M140.02 65.4631l4.03586 13.9596 -7.52486 0c-12.3556,0 -24.1762,6.98509 -29.5502,18.5328 -1.33702,2.95396 -2.13899,6.18194 -2.94451,9.39929 -0.811424,3.7642 -3.23152,6.98628 -7.52486,6.98628 -4.56145,0 -6.44651,-4.02405 -7.51541,-6.98628 -2.15199,-5.63745 -2.95396,-9.93433 -6.7158,-18.5281 -7.79297,-17.9954 -29.8136,-23.9057 -46.7413,-15.0415 -6.17603,3.22325 -12.0863,10.4776 -13.9714,13.6985 -1.87324,3.22325 -4.56027,4.83311 -8.5855,4.83311l-10.4812 0 0 26.053 13.9702 0c11.0068,0 19.871,-4.83193 25.7825,-12.893 0.800794,-1.07009 2.1508,-3.22443 2.68703,-4.29334 1.88269,-4.29925 4.03586,-5.10713 6.71226,-5.10713 2.68703,0 5.64217,1.07481 6.72289,5.10713 1.07009,3.49018 3.21262,14.5005 5.89965,19.6017 4.5709,8.59731 8.59613,13.4304 17.1946,17.7308 16.9241,8.32211 37.3302,1.60867 45.9287,-15.8458 1.61458,-3.23034 2.68585,-7.25439 3.22207,-11.0139 0.533862,-3.21971 2.15199,-4.83665 4.83901,-4.83665 2.68703,0 8.59613,0 8.59613,0l-4.03586 13.9655c-1.07127,2.68703 0,4.83901 1.61576,6.18312 1.60631,1.87797 4.29334,1.87797 7.79534,-0.54213l48.0712 -33.3003 -48.0712 -33.305c-3.502,-2.42246 -6.18903,-2.42246 -7.79534,-0.539768 -1.61576,1.34056 -2.68703,3.49137 -1.61576,6.18194z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow6">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M87.8062 30.1916c77.827,18.1064 96.7094,78.199 96.7094,108.159l0 59.1489 -38.4275 0 0 -59.1489c0,-2.2512 -2.45907,-55.3752 -68.6911,-70.7864l0.376775 17.4025c0,4.552 -1.13505,7.58746 -5.68587,8.72369 -3.03191,0.75473 -6.06737,-0.383861 -8.72487,-3.78783l-47.8775 -61.8973 73.451 -24.7159c3.79137,-1.51891 7.95951,-0.759455 9.85874,1.51773 1.89214,3.03309 2.27364,6.44178 0,9.85401l-10.9891 15.5304z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow7">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M147.7 52.0764l-26.3636 0 35.9341 36.0806 -58.6764 0 0 -72.1163 -23.8762 0 0 72.1163 -24.1384 0c-13.3572,0 -24.7242,4.63823 -34.1058,13.91 -9.31661,9.40519 -13.9737,20.7486 -13.9737,34.0408 0,13.291 4.64767,24.5671 13.9513,33.8424 9.36385,9.33551 20.712,14.0056 34.0455,14.0056 13.2639,0 24.6498,-4.66539 34.1459,-13.9962 4.74453,-4.73035 8.25833,-9.88 10.5343,-15.4525 2.27482,-5.57248 3.41696,-11.6942 3.41696,-18.3722l0 -24.1018 58.6764 0 -33.5896 35.842 29.588 0 44.2326 -47.7299 -49.8016 -48.0689zm-72.9821 84.0774l0 0c0,6.67801 -2.32088,12.3202 -6.96383,16.9253 -4.83665,4.67012 -10.5887,7.00045 -17.2572,7.00045 -6.73352,0 -12.4548,-2.33033 -17.1568,-7.00045 -4.64177,-4.60515 -6.96383,-10.2473 -6.96383,-16.9253 0,-6.61423 2.32207,-12.3214 6.96383,-17.1202 4.83547,-4.66539 10.5521,-7.00045 17.1568,-7.00045l24.2211 0 0 24.1207z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow8">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_265655072">\n   <polygon id="_265656344" class="fil0" points="197.502,93.4578 181.155,108.652 179.233,102.304 169.616,105.189 159.809,108.075 150.193,110.382 140.578,112.499 130.772,114.038 121.155,115.383 111.349,116.151 101.732,116.344 92.5023,116.151 83.2707,115.383 74.2305,114.42 64.9989,112.884 55.7697,110.96 46.7295,108.843 37.5003,106.345 28.2711,103.461 22.8829,105.189 2.50041,95.9594 13.845,93.6492 6.53863,83.6522 27.8825,93.4578 31.1554,100.96 39.807,103.652 48.6535,105.96 57.5001,107.882 66.3466,109.614 75.1931,111.151 84.0396,112.112 92.885,112.69 101.732,113.075 111.349,112.69 120.772,111.921 130.386,110.767 140.002,109.228 149.619,107.113 159.233,104.806 168.848,102.113 178.271,99.2287 175.963,91.7275 "/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="arrow9">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M164.192 26.386c0.0566934,0.114568 1.90513,-1.70553 5.5465,-5.46028 9.26936,9.4985 16.2202,20.2336 20.8561,32.203 4.63232,11.9706 6.93667,24.1844 6.90714,36.6369 -0.0295278,12.4536 -2.40238,24.6522 -7.12092,36.5944 -4.72327,11.941 -11.8028,22.6325 -21.2411,32.0695 -9.49614,9.49732 -20.2596,16.6371 -32.288,21.4136 -12.0273,4.77523 -24.2931,7.16226 -36.8034,7.16226 -12.5103,0 -24.7797,-2.37285 -36.8082,-7.12092 -12.0284,-4.74571 -22.7907,-11.8973 -32.2845,-21.4549 -18.769,-18.7655 -28.251,-41.5114 -28.4518,-68.2375 -0.199608,-26.7262 8.91385,-49.6457 27.3404,-68.7537l-8.61621 -2.64333 22.0939 -5.79926 -3.92365 21.834 -3.41105 -8.44377c-17.745,17.7462 -26.588,38.985 -26.5313,63.7198 0.0578745,24.7372 8.87369,45.9204 26.4439,63.5485 17.5714,17.5714 38.9436,26.4734 64.1072,26.699 25.1636,0.226773 46.5878,-8.47211 64.2726,-26.1037 17.5702,-17.6848 26.3423,-38.9932 26.3116,-63.9288 -0.0295278,-24.938 -8.82763,-46.25 -26.399,-63.9348z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="atom">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M165.653 40.218c9.17251,1.44804 15.4489,5.13311 18.834,11.0552 3.38625,5.93036 3.43822,13.2107 0.15945,21.8517 -3.27877,8.63983 -9.11582,17.6163 -17.5088,26.927 8.32329,9.31307 14.1226,18.2883 17.4013,26.9293 3.27995,8.63983 3.22798,15.9237 -0.154726,21.8506 -3.46066,5.92564 -9.74063,9.6296 -18.8375,11.1107 -9.0981,1.47993 -19.7836,0.844495 -32.0566,-1.90631 -3.81027,11.993 -8.64101,21.5671 -14.4958,28.7258 -5.85595,7.1599 -12.2032,10.7375 -19.0454,10.7375 -6.84572,0 -13.1741,-3.57759 -18.9935,-10.7375 -5.81816,-7.15872 -10.6335,-16.6997 -14.4403,-28.6231 -12.2765,2.61498 -22.9809,3.17955 -32.1156,1.69608 -9.13472,-1.48111 -15.3934,-5.1839 -18.7797,-11.1107 -3.38625,-5.92327 -3.45593,-13.1883 -0.209057,-21.7962 3.24097,-8.60322 9.0981,-17.5631 17.5631,-26.8762 -8.46503,-9.3107 -14.3399,-18.2872 -17.6186,-26.927 -3.27995,-8.64101 -3.2268,-15.9214 0.158269,-21.8517 3.38625,-5.92209 9.66267,-9.60716 18.834,-11.0552 9.16897,-1.44686 19.8911,-0.863393 32.1676,1.74686 3.73704,-11.9186 8.52999,-21.4773 14.3848,-28.6738 5.85595,-7.19297 12.2032,-10.793 19.049,-10.793 6.84218,0 13.1895,3.58231 19.0454,10.741 5.85477,7.1599 10.6855,16.7009 14.4958,28.6195 12.2729,-2.54057 22.9915,-3.08743 32.1629,-1.64056zm-129.507 4.70791l0 0c-8.11306,0.989772 -13.5757,3.91775 -16.3974,8.78511 -2.89609,4.93941 -2.71892,11.1473 0.527957,18.6226 3.24097,7.4788 8.7792,15.3415 16.6112,23.5903 6.63194,-6.69808 14.1781,-13.1517 22.6407,-19.362 0.989772,-10.0135 2.7886,-19.7836 5.39768,-29.3057 -11.0753,-2.54057 -20.6683,-3.31538 -28.7801,-2.33033zm0.635438 59.254l0 0c-7.76108,8.25243 -13.245,16.1174 -16.4541,23.5939 -3.21144,7.47762 -3.37089,13.6513 -0.475988,18.5175 2.82049,4.93941 8.27132,7.88392 16.3501,8.8359 8.07526,0.953157 17.6494,0.121655 28.7246,-2.48978 -2.60908,-9.30716 -4.40791,-18.9687 -5.39768,-28.9916 -8.46267,-6.20202 -16.0466,-12.6934 -22.747,-19.4659zm4.23429 -4.12799l0 0c4.93232,5.01146 10.8922,10.0879 17.8785,15.2352 -0.4252,-4.6524 -0.635438,-9.76543 -0.635438,-15.3415 0,-2.53821 0.0330711,-5.02209 0.107481,-7.45872 0.0696856,-2.43309 0.177167,-4.88508 0.316538,-7.35478 -6.70045,4.8709 -12.5907,9.84338 -17.6671,14.9198zm41.1582 30.6841l0 0c5.85241,3.45593 11.8111,6.56108 17.882,9.31188 6.2032,-2.82168 12.1288,-5.92327 17.7745,-9.31188 6.27643,-3.66617 11.8808,-7.22958 16.8226,-10.6867 0.561028,-5.78154 0.844495,-12.4832 0.844495,-20.1037 0,-7.54612 -0.283467,-14.2111 -0.844495,-19.9986 -5.29256,-3.52089 -10.9336,-7.08431 -16.9289,-10.6843 -5.78627,-3.24215 -11.6765,-6.31068 -17.6682,-9.20558 -6.07091,2.8949 -11.9599,5.96343 -17.6718,9.20558 -6.42052,3.80909 -12.0627,7.40675 -16.9289,10.7918 -0.564571,5.64335 -0.845676,12.2729 -0.845676,19.8911 0,7.62053 0.281105,14.2855 0.845676,19.9974 4.44098,3.17601 10.0123,6.77604 16.7186,10.793zm-2.96459 -66.8675l0 0c4.09019,-2.46734 8.53235,-4.82957 13.3324,-7.09021 -7.47644,-3.17483 -14.8135,-5.81934 -22.0065,-7.93825 -1.90395,7.40675 -3.35199,15.1312 -4.33822,23.1734 3.87759,-2.68112 8.21581,-5.39414 13.0123,-8.14495zm13.3324 79.4581l0 0c-5.07996,-2.39648 -9.55874,-4.79413 -13.4363,-7.19297 -4.37602,-2.40002 -8.64338,-5.04453 -12.8056,-7.93471 0.845676,7.61817 2.22285,15.2706 4.12799,22.9584 6.91305,-1.8319 14.2832,-4.44216 22.114,-7.83077zm7.51423 -90.1483l0 0c10.0123,-4.37011 19.3253,-7.65006 27.9321,-9.83984 -3.24569,-10.9288 -7.31817,-19.6572 -12.2221,-26.1852 -4.90279,-6.52446 -10.1753,-9.78905 -15.8174,-9.78905 -5.64217,0 -10.9005,3.26459 -15.7667,9.78905 -4.86618,6.528 -8.9233,15.1856 -12.1655,25.975 9.0981,2.53939 18.4431,5.89375 28.0396,10.0501zm0 93.6409l0 0c-9.17251,4.1646 -18.4832,7.47998 -27.9357,9.94614 3.17483,10.9336 7.19533,19.6442 12.0615,26.1345 4.86618,6.49257 10.1245,9.73354 15.7667,9.73354 5.64217,0 10.9147,-3.24097 15.8174,-9.73354 4.90398,-6.49021 8.97645,-15.2009 12.2221,-26.1345 -9.38275,-2.39884 -18.6946,-5.71422 -27.9321,-9.94614zm20.9494 -10.6855l0 0c-5.15083,3.03428 -9.66622,5.43193 -13.5426,7.19297 7.75636,3.38861 15.1277,5.99887 22.1128,7.83077 1.69017,-6.55635 3.10278,-14.1781 4.23192,-22.8557 -4.02169,2.61026 -8.28904,5.22169 -12.8021,7.83195zm8.57015 -87.2936l0 0c-6.77249,1.90631 -14.1084,4.51539 -22.01,7.83077 5.22169,2.6823 9.6296,5.08114 13.2261,7.19769 4.79531,2.75081 9.13472,5.46382 13.0159,8.14495 -0.920086,-7.82841 -2.33033,-15.5517 -4.23192,-23.1734zm33.54 47.0838l0 0c7.82959,-8.24888 13.3489,-16.1115 16.5568,-23.5903 3.20908,-7.47526 3.40514,-13.6832 0.583469,-18.6226 -2.82049,-4.86736 -8.28904,-7.77644 -16.4009,-8.72842 -8.11187,-0.953157 -17.7049,-0.122836 -28.7778,2.48388 2.60671,9.10165 4.44216,18.8718 5.50162,29.3093 8.18156,5.92682 15.6922,12.3107 22.5368,19.1482zm0.688588 59.254l0 0c8.07408,-0.986228 13.5237,-3.9142 16.3442,-8.78393 2.82168,-4.86618 2.63034,-11.0351 -0.578745,-18.5127 -3.21144,-7.47644 -8.69534,-15.3781 -16.4541,-23.7014 -6.70399,6.77249 -14.2513,13.2261 -22.6431,19.3631 -1.06064,10.0867 -2.85947,19.7872 -5.39532,29.0943 11.0729,2.68112 20.647,3.53034 28.727,2.54057zm-13.1198 -47.3496l0 0c2.99884,-2.57364 5.76382,-5.165 8.30321,-7.77644 -4.79531,-4.72563 -10.6843,-9.76897 -17.6671,-15.1312 0.351971,5.64689 0.529138,10.6524 0.529138,15.0249 0,4.86972 -0.177167,10.1233 -0.529138,15.7655 3.24215,-2.67994 6.36501,-5.30555 9.36385,-7.88274z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="briefcase">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M84.4601 31.8132c0.500791,-3.40278 2.25356,-5.10476 5.27012,-5.10476 4.33586,0 8.26188,-0.0307089 11.7721,-0.121655 3.50908,-0.0720478 8.27841,-0.132285 14.295,-0.132285 2.33742,0 3.91893,1.04528 4.75516,3.10514 0.837408,2.07521 1.26143,4.07602 1.26143,5.98587 0,1.89687 -0.0885834,3.51026 -0.253939,4.83783l-37.3456 0c-0.337798,-2.31262 -0.256301,-5.16382 0.245671,-8.57015zm17.0423 112.275l0 0c16.3773,-0.0909456 29.4935,-0.18071 39.3558,-0.253939 9.85992,-0.0909456 18.0415,-0.133466 24.5648,-0.133466 6.35438,0 10.4458,-1.92639 12.2812,-5.76264 1.83663,-3.83861 2.76262,-7.25793 2.76262,-10.2591l0 -71.11c0,-2.85238 -0.925992,-6.18194 -2.76262,-10.0194 -1.83545,-3.85161 -5.92682,-5.67406 -12.2812,-5.5087 -6.18666,0 -12.3686,-0.0602367 -18.5494,-0.134647 -6.18903,-0.0885834 -12.3686,-0.134647 -18.5505,-0.134647 0.509059,-3.49137 0.381499,-7.92762 -0.37205,-13.258 -0.755911,-5.34335 -3.30003,-8.01739 -7.64297,-8.01739l-35.5869 0c-3.189,0 -5.31618,1.46458 -6.40753,4.37602 -1.08072,2.93979 -1.61812,5.98587 -1.61812,9.13708 0,3.17955 0,5.77682 0,7.76227 -6.18903,0 -12.3698,0.0460634 -18.5517,0.134647 -6.18666,0.07441 -12.3686,0.134647 -18.5482,0.134647 -6.01658,-0.165356 -10.0265,1.6571 -12.0343,5.5087 -2.0008,3.83743 -3.00002,7.16699 -3.00002,10.0194l0 71.6025c0,2.85238 0.954338,6.15123 2.88073,9.90008 1.91813,3.76066 5.9717,5.62918 12.1536,5.62918 6.17958,0 12.3615,0.04252 18.5482,0.133466 6.18194,0.0732289 12.3627,0.11693 18.5517,0.11693 0.164175,0.166537 8.43668,0.210238 24.8069,0.137009zm-99.002 36.4125l0 0 14.5348 0 0 -14.3623 -14.5348 0 0 14.3623zm30.0782 0l0 0 14.5418 0 0 -14.3623 -14.5418 0 0 14.3623zm30.0829 0l0 0 14.5348 0 0 -14.3623 -14.5348 0 0 14.3623zm30.0687 0l0 0 14.543 0 0 -14.3623 -14.543 0 0 14.3623zm30.0841 0l0 0 14.5348 0 0 -14.3623 -14.5348 0 0 14.3623zm30.077 0l0 0 14.5418 0 0 -14.3623 -14.5418 0 0 14.3623zm30.077 0l0 0 14.5336 0 0 -14.3623 -14.5336 0 0 14.3623z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="calc">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M36.0912 2.49805l127.821 0 0 195.002 -127.821 0 0 -195.002zm122.173 189.948l0 0 0 -184.894 -116.823 0 0 184.894 116.823 0zm-103.445 -165.573l0 0 90.6633 0 0 23.4829 -90.6633 0 0 -23.4829zm0 30.618l0 0 17.2407 0 0 17.5383 -17.2407 0 0 -17.5383zm0 24.9687l0 0 17.2407 0 0 17.2419 -17.2407 0 0 -17.2419zm0 24.3758l0 0 17.2407 0 0 17.5395 -17.2407 0 0 -17.5395zm0 24.3746l0 0 17.2407 0 0 17.5383 -17.2407 0 0 -17.5383zm0 24.6734l0 0 41.2255 0 0 17.5383 -41.2255 0 0 -17.5383zm85.3129 -110.877l0 0 0 -12.4855 -80.1207 0 0 12.4855 80.1207 0zm-60.9383 12.4844l0 0 17.2419 0 0 17.5383 -17.2419 0 0 -17.5383zm0 24.9687l0 0 17.2419 0 0 17.2419 -17.2419 0 0 -17.2419zm0 24.3758l0 0 17.2419 0 0 17.5395 -17.2419 0 0 -17.5395zm0 24.3746l0 0 17.2419 0 0 17.5383 -17.2419 0 0 -17.5383zm24.3746 -73.7191l0 0 17.5395 0 0 17.5383 -17.5395 0 0 -17.5383zm0 24.9687l0 0 17.5395 0 0 17.2419 -17.5395 0 0 -17.2419zm0 24.3758l0 0 17.5395 0 0 17.5395 -17.5395 0 0 -17.5395zm0 24.3746l0 0 17.5395 0 0 17.5383 -17.5395 0 0 -17.5383zm0 24.6734l0 0 17.5395 0 0 17.5383 -17.5395 0 0 -17.5383zm24.6722 -24.2778l0 0 17.2419 0 0 41.8161 -17.2419 0 0 -41.8161zm0.196065 -74.1148l0 0 17.2407 0 0 17.5383 -17.2407 0 0 -17.5383zm0 24.9687l0 0 17.2407 0 0 17.2419 -17.2407 0 0 -17.2419zm0 24.3758l0 0 17.2407 0 0 17.5395 -17.2407 0 0 -17.5395z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cart">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M193.61 75.6797l-51.5626 0 -29.1073 -68.3793c-6.31068,-3.15829 -5.95871,4.20712 -5.95871,4.20712l24.899 64.5253 -68.0332 0 28.4022 -65.9308c0.709848,-10.1682 -6.31068,-2.8016 -6.31068,-2.8016l-30.5069 67.6871 -47.7086 0 -4.09019 1.04528c-2.79805,5.1461 0.470082,9.36503 0.470082,9.36503l8.41542 0 0.930716 1.6323 17.3175 89.7787c2.32679,5.83942 6.77131,4.21184 6.77131,4.21184l10.7552 0 0 10.519 1.86852 -0.118111 0.119292 1.98781 8.06227 0 0 -2.21458 2.10356 0 0 -10.206 82.9247 0 0 12.0946 2.17915 0 0 2.19332 7.72447 0 0 -2.45553 1.75159 0 0 -11.921 13.6844 0c3.15239,-0.703943 4.90516,-4.20948 4.90516,-4.20948l14.7249 -91.8846 5.26894 0c8.75558,-5.60437 0,-9.12645 0,-9.12645zm-171.728 9.00834l0 0 17.9942 0 0.237403 38.1121 -11.6989 0 -6.53273 -38.1121zm18.4655 84.1743l0 0 -3.97326 0 -6.31186 -39.9854 10.2851 0 0 39.9854zm19.6301 0.465358l0 0 -11.9198 0 0 -40.4507 11.9198 0 0 40.4507zm0 -46.7638l0 0 -11.6847 0 0 -37.1779 11.6847 0 0 37.1779zm64.7781 -37.1779l0 0 11.6847 0 0 37.1779 -11.6847 0 0 -37.1779zm-58.2135 0l0 0 11.6847 0 0 37.1779 -11.6847 0 0 -37.1779zm12.1536 83.9416l0 0 -11.9328 0 0 -40.4507 11.9328 0 0 40.4507zm7.94652 -83.9416l0 0 11.6836 0 0 37.1779 -11.6836 0 0 -37.1779zm12.1584 83.9416l0 0 -11.9375 0 0 -40.4507 11.9375 0 0 40.4507zm18.2305 0l0 0 -11.9198 0 0 -40.4507 11.9198 0 0 40.4507zm0 -46.7638l0 0 -11.6836 0 0 -37.1779 11.6836 0 0 37.1779zm19.6442 46.7638l0 0 -11.9198 0 0 -40.4507 11.9198 0 0 40.4507zm18.469 0l0 0 -11.9328 0 0 -40.4507 11.9328 0 0 40.4507zm0.468901 -46.7638l0 0 -11.6965 0 0 -37.1779 11.6965 0 0 37.1779zm10.9808 46.0634l0 0 -5.60674 0 0.23386 -39.7503 11.4639 0 -6.09099 39.7503zm6.78076 -46.5334l0 0 -11.9186 0.239766 -0.235041 -37.6456 18.2352 0 -6.08154 37.4058z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="coil">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M112.854 54.6311c-39.2117,0 -70.9978,31.7896 -70.9978,71.0002 0,13.0466 3.53625,25.2675 9.68157,35.7735 -3.70279,-2.23348 -10.1694,-8.24652 -16.6501,-24.4561 0,0 -22.1399,-41.4098 12.4985,-87.5086 0,0 18.7561,-29.953 68.4974,-32.0365l0 -14.8466c0,0 -69.2769,-4.68429 -95.5826,69.5403 0,0 -21.358,62.7666 32.8172,104.956 0,0 46.8771,35.4204 90.3728,13.0229 0,0 4.67484,-1.66419 10.9442,-6.91659 17.8147,-12.8989 29.4179,-33.8542 29.4179,-57.5284 0,-39.2105 -31.7884,-71.0002 -70.999,-71.0002zm-26.6671 117.058l0 0c-9.94732,0 -18.0096,-8.06109 -18.0096,-18.0084 0,-9.94496 8.06227,-18.0108 18.0096,-18.0108 9.94496,0 18.0084,8.06581 18.0084,18.0108 0,9.94732 -8.06345,18.0084 -18.0084,18.0084zm2.77089 -53.3343l0 0c-9.9485,0 -18.0096,-8.06227 -18.0096,-18.0096 0,-9.94378 8.06109,-18.0096 18.0096,-18.0096 9.94496,0 18.0096,8.06581 18.0096,18.0096 0,9.94732 -8.06463,18.0096 -18.0096,18.0096zm26.8998 17.5478l0 0c-3.44412,0 -6.23509,-2.79097 -6.23509,-6.23391 0,-3.44176 2.79097,-6.23509 6.23509,-6.23509 3.44176,0 6.23391,2.79333 6.23391,6.23509 0,3.44294 -2.79215,6.23391 -6.23391,6.23391zm22.9714 37.8641l0 0c-9.94732,0 -18.0096,-8.06227 -18.0096,-18.0084 0,-9.94496 8.06227,-18.0084 18.0096,-18.0084 9.94614,0 18.0096,8.06345 18.0096,18.0084 0,9.94614 -8.06345,18.0084 -18.0096,18.0084zm2.07876 -52.6421l0 0c-9.94732,0 -18.0096,-8.06109 -18.0096,-18.0084 0,-9.94496 8.06227,-18.0096 18.0096,-18.0096 9.94378,0 18.0096,8.06463 18.0096,18.0096 0,9.94732 -8.06581,18.0084 -18.0096,18.0084z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cross">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M131.831 97.4594l20.8632 44.6708c-0.800794,1.87561 -1.86852,2.94215 -3.74176,3.74294l0 2.14608c-1.07363,1.06654 -5.35162,2.66931 -5.35162,4.27681 0,1.06891 0.801975,2.6764 1.3382,3.74294 -0.536225,3.21262 -5.61619,6.68864 -8.82881,6.68864 -3.47719,0 -8.82881,-9.62842 -10.1658,-11.7674l-25.1423 -38.7924 -52.9634 82.1262c-3.21262,2.40356 -10.1658,3.20554 -13.9088,3.20554 -3.47719,0 -4.01342,-2.66931 -5.61737,-5.34571 -1.60749,-2.40947 -4.01224,-5.35044 -4.01224,-8.2914 0,-1.60867 0.264569,-2.67522 0.800794,-4.28389 0.536225,-2.14017 1.60395,-3.74294 -0.264569,-5.34571 -0.536225,-0.536225 -1.3382,-1.07363 -1.3382,-1.87442 0,-3.47719 4.54492,-9.89535 6.41816,-13.1068l6.41698 -10.9666c10.969,-19.2604 31.3018,-43.3362 45.7456,-60.721l3.20672 -3.74885 -19.7907 -54.5674c-0.80788,-2.13899 -2.94687,-6.68864 -2.94687,-9.09338 0,-1.87442 2.41065,-4.27799 3.47719,-5.61619l1.87442 -1.60867c0.536225,-0.536225 1.07245,-0.801975 1.87324,-0.801975 1.87324,0 2.94215,1.33702 4.27917,2.41065 1.60277,-1.3382 2.40947,-1.3382 4.27917,-1.3382 1.60867,-0.806699 1.60867,-0.806699 2.40947,-1.87324 0.801975,-1.3382 1.3382,-2.14017 2.94215,-2.14017 2.93979,0 3.74176,2.6764 4.81421,4.81421l10.9678 21.9356 9.36503 18.1879 6.68273 -8.29258 13.1068 -14.9812c2.94687,-3.47601 23.2738,-28.0868 25.6845,-28.0868 1.60277,0 7.75518,3.74767 9.35795,5.08587l2.94687 -2.6764c0.530319,-0.801975 2.13899,-2.67522 2.94097,-2.67522 0.801975,0 1.3382,1.60277 1.60277,2.13899 1.07245,2.6764 5.35162,5.61619 5.35162,7.49061 0,1.60277 -1.87324,3.21262 -2.94097,4.27917 -2.94687,2.67522 -6.68864,7.76108 -9.09928,10.9678l-37.9834 49.2216 -2.94097 4.27799 8.2914 16.5852z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cross2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M160.644 197.5l-24.4608 -24.5589c-5.58311,2.68939 -11.3906,4.81775 -17.4214,6.37918 -6.03312,1.56143 -12.2895,2.34451 -18.762,2.34451 -6.48076,0 -12.73,-0.783077 -18.762,-2.34451 -6.03194,-1.56143 -11.8395,-3.68979 -17.4226,-6.37918l-24.4608 24.5589 -36.5401 -36.6464 24.4762 -24.5482c-2.67522,-5.59729 -4.8024,-11.4273 -6.36383,-17.4757 -1.56261,-6.04729 -2.34333,-12.3261 -2.34333,-18.8316 0,-6.49611 0.780715,-12.7749 2.34333,-18.8222 1.56143,-6.04611 3.68861,-11.8784 6.36383,-17.4828l-24.4762 -24.547 36.5401 -36.6475 24.4608 24.56c5.58311,-2.68349 11.3906,-4.81067 17.4226,-6.37092 6.03194,-1.56261 12.2812,-2.35277 18.762,-2.35277 6.47249,0 12.7288,0.790164 18.762,2.35277 6.03076,1.56025 11.8383,3.68743 17.4214,6.37092l24.4608 -24.56 36.5401 36.6475 -24.4762 24.547c2.6764,5.60437 4.79531,11.4367 6.35674,17.4828 1.56261,6.04729 2.35041,12.3261 2.35041,18.8222 0,6.50556 -0.787801,12.7844 -2.35041,18.8316 -1.56143,6.04847 -3.68034,11.8784 -6.35674,17.4757l24.4762 24.5482 -36.5401 36.6464zm-28.7211 -97.5019l0 0c0,-4.28389 -0.843314,-8.40597 -2.52167,-12.358 -1.68545,-3.95082 -3.98271,-7.39258 -6.89061,-10.3312 -2.91498,-2.92916 -6.33312,-5.24177 -10.2461,-6.93785 -3.92129,-1.69253 -8.01148,-2.54175 -12.2647,-2.54175 -4.48586,0 -8.63156,0.849219 -12.4359,2.54175 -3.80436,1.69608 -7.16817,4.00869 -10.0761,6.93785 -2.91616,2.93861 -5.21343,6.38037 -6.89061,10.3312 -1.68663,3.952 -2.52049,8.07408 -2.52049,12.358 0,4.51893 0.833865,8.70125 2.52049,12.5375 1.67718,3.83389 3.97444,7.2225 6.89061,10.154 2.9079,2.93861 6.2717,5.25004 10.0761,6.94257 3.80436,1.6949 7.95006,2.53821 12.4359,2.53821 4.25318,0 8.34337,-0.843314 12.2647,-2.53821 3.91302,-1.69253 7.33116,-4.00397 10.2461,-6.94257 2.9079,-2.93152 5.20516,-6.32013 6.89061,-10.154 1.67836,-3.83625 2.52167,-8.01857 2.52167,-12.5375z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="cruchenie">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!-- Created with Inkscape (http://www.inkscape.org/) -->\n\n<svg\n   xmlns:dc="http://purl.org/dc/elements/1.1/"\n   xmlns:cc="http://creativecommons.org/ns#"\n   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n   xmlns:svg="http://www.w3.org/2000/svg"\n   xmlns="http://www.w3.org/2000/svg"\n   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"\n   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"\n   width="200"\n   height="200"\n   id="svg2"\n   version="1.1"\n   inkscape:version="0.48.4 r9939"\n   sodipodi:docname="cruchenie.svg">\n  <defs\n     id="defs4" />\n  <sodipodi:namedview\n     id="base"\n     pagecolor="#ffffff"\n     bordercolor="#666666"\n     borderopacity="1.0"\n     inkscape:pageopacity="0.0"\n     inkscape:pageshadow="2"\n     inkscape:zoom="0.35"\n     inkscape:cx="375"\n     inkscape:cy="520"\n     inkscape:document-units="px"\n     inkscape:current-layer="layer1"\n     showgrid="false"\n     inkscape:window-width="1366"\n     inkscape:window-height="684"\n     inkscape:window-x="-8"\n     inkscape:window-y="-8"\n     inkscape:window-maximized="1" />\n  <metadata\n     id="metadata7">\n    <rdf:RDF>\n      <cc:Work\n         rdf:about="">\n        <dc:format>image/svg+xml</dc:format>\n        <dc:type\n           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />\n        <dc:title></dc:title>\n      </cc:Work>\n    </rdf:RDF>\n  </metadata>\n  <g\n     inkscape:label="Layer 1"\n     inkscape:groupmode="layer"\n     id="layer1"\n     transform="translate(0,-852.36218)">\n    <path\n       style="fill:#666666"\n       d="m 57.726711,905.07953 c -0.04809,0.002 -0.07625,0.008 -0.07854,0.023 -0.900066,6.14261 -2.839755,11.98921 -4.886915,17.76304 -1.03199,2.93561 -2.169826,5.83983 -3.002816,8.85275 -0.902523,3.26444 -0.0073,0.46986 -0.578973,2.22182 -0.04245,0.11331 1.566901,0.81555 1.609354,0.70223 0.694086,-1.38382 0.159706,-0.22075 0.863548,-2.24484 0.794422,-2.28458 1.683475,-4.52582 2.521967,-6.7921 0.543875,-0.29003 1.075684,-0.59839 1.579914,-0.94398 1.22756,3.43964 2.791342,6.75989 4.317756,10.08453 0.242874,0.4297 0.483298,0.85964 0.726171,1.28935 0.02155,0.0512 0.342998,-0.0485 0.686918,-0.17268 -0.06294,0.39312 -0.0989,0.78818 -0.07854,1.18574 -0.0065,0.11762 1.641823,0.30183 1.648607,0.18419 0.659764,-2.89606 1.60065,-5.69772 2.355142,-8.56494 0.530388,-2.06601 0.931123,-3.43977 1.305136,-5.56032 0.534257,-3.02921 0.795663,-6.1315 1.197197,-9.18659 0.01796,-0.12267 -1.70911,-0.46803 -1.727104,-0.34536 -0.628161,3.00908 -0.935302,6.09313 -1.491586,9.11753 -0.358853,1.9508 -0.783622,3.48717 -1.265891,5.39913 -0.526812,2.03736 -1.101392,4.06045 -1.579905,6.11289 -1.531876,-3.57803 -3.157191,-7.12051 -4.671041,-10.70619 0.08981,-0.0891 0.178214,-0.18238 0.264958,-0.27628 3.301294,-3.25516 6.367219,-6.75957 9.106555,-10.52199 0.06245,-0.10322 -1.419294,-1.07023 -1.481782,-0.96701 -2.988659,3.45589 -5.966166,6.91792 -9.175247,10.16511 -0.19464,0.22233 -0.405413,0.42683 -0.618226,0.62165 1.931068,-5.50647 3.665519,-11.13617 4.072442,-17.07232 0.01551,-0.10558 -1.282447,-0.38194 -1.619167,-0.36839 z m 16.122926,6.82663 c -1.906959,0.0293 -3.751569,0.74733 -5.505149,1.32388 -0.111366,0.0385 0.506867,1.66174 0.618225,1.62319 1.951208,-0.52391 4.70026,-1.64766 6.7416,-0.94398 0.143002,0.12437 0.348982,0.19381 0.42196,0.36838 0.141884,0.33936 -0.188133,1.87767 -0.196264,1.911 -0.449923,1.86163 -1.223233,3.65663 -1.864489,5.44519 -0.963395,2.10677 -1.933003,4.51975 -3.689726,6.08986 -0.438191,0.39163 -1.126252,0.67739 -1.658412,0.92096 -0.879786,0.16264 -1.376652,-0.26991 -2.011687,-0.82886 -0.08082,-0.0986 -1.395798,0.99505 -1.314949,1.09364 0.29692,0.26677 0.548611,0.59763 0.892988,0.79432 1.118929,0.63908 2.28792,0.74182 3.454208,0.43746 0.856796,-0.39916 1.40757,-0.59111 2.149073,-1.25481 1.907089,-1.70701 3.025839,-4.24253 4.033181,-6.56185 0.751528,-2.19928 2.886967,-6.83721 1.521034,-9.15206 -0.225435,-0.38204 -0.667732,-0.58288 -1.000941,-0.87491 -0.588876,-0.12229 -1.171147,-0.31131 -1.766357,-0.36839 -0.27464,-0.0263 -0.551876,-0.0272 -0.824295,-0.023 z m 5.348137,2.08367 c -0.01363,0.004 -0.02833,0.0154 -0.02939,0.023 -0.459042,2.88266 -1.079366,5.74456 -1.393462,8.65704 -0.208234,1.9308 -0.155959,2.681 -0.147199,4.57028 0.105562,1.26308 0.08522,2.54172 0.33365,3.78744 -0.850796,1.35179 -1.627078,2.75688 -2.28645,4.23643 -0.131001,0.69281 -0.438346,1.26691 -0.765424,1.86495 -0.05127,0.10664 1.469715,0.92398 1.521026,0.81735 0.346419,-0.61488 0.709908,-1.21736 0.87337,-1.92251 1.417701,-2.89007 3.317941,-5.44314 5.210752,-8.01236 0.883492,-1.29658 1.832828,-2.55424 2.708418,-3.85653 1.107516,-1.6472 2.027518,-3.39908 2.992995,-5.13436 0.193113,-0.34708 0.405812,-0.68342 0.608414,-1.02458 0.04841,-0.10825 -1.502047,-0.87955 -1.550476,-0.7713 -0.206502,0.28279 -0.428002,0.55718 -0.618225,0.85189 -1.077268,1.66912 -2.034882,3.4096 -3.169625,5.04227 -5.275125,7.5898 2.56131,-3.95352 -2.688792,3.81048 -0.405176,0.54606 -0.795476,1.1043 -1.187385,1.65773 0.0057,-0.41925 -0.01037,-0.83405 -0.06866,-1.19725 0.0316,-1.74797 0.01168,-2.53677 0.206078,-4.31701 0.318097,-2.91274 0.912394,-5.78609 1.148132,-8.7146 0.0169,-0.11501 -1.493179,-0.43072 -1.697665,-0.36839 z m 18.311245,1.32389 c -0.01339,0.004 -0.02833,0.0155 -0.02939,0.023 -0.469696,3.69471 -1.355483,7.23628 -2.453275,10.75223 -0.169184,0.56067 -0.347961,1.11767 -0.510288,1.68075 -0.120069,0.41659 -0.227524,0.8336 -0.333641,1.2433 -0.189546,-0.39868 -0.396783,-0.77222 -0.451401,-0.74828 -1.261,0.25583 -2.526539,0.38484 -3.827111,0.40292 -0.207645,0.0295 -1.232491,0.30379 -1.403278,0.0576 -0.519676,-0.74923 0.277647,-2.04615 0.23552,-2.7859 0.776209,-3.25886 1.89873,-6.39846 2.737851,-9.63556 0.01772,-0.12066 -1.679948,-0.4545 -1.697665,-0.33385 -1.120553,3.10315 -2.141384,6.23557 -2.835985,9.4859 -0.180548,1.35068 -0.846615,3.24974 0.529907,4.32852 0.845995,0.66299 1.908136,0.5701 2.865424,0.65619 1.23677,0.0128 2.410879,-0.12365 3.591594,-0.36838 -0.02817,0.13087 -0.05241,0.25831 -0.07846,0.3914 -0.205743,1.0484 -0.287074,2.08764 -0.559354,3.11976 -0.79008,2.091 -1.468972,4.20076 -1.864481,6.42371 -0.08456,0.24486 -0.170573,0.49191 -0.255144,0.73677 -0.0369,0.11705 1.631331,0.7387 1.668224,0.62165 0.111865,-0.31724 0.221802,-0.63826 0.33365,-0.9555 0.391599,-2.18845 1.10149,-4.26008 1.844863,-6.33161 0.253789,-1.03959 0.338548,-2.07994 0.578972,-3.11976 0.2018,-0.87272 0.459483,-1.71603 0.726163,-2.56718 0.174671,-0.55742 0.36091,-1.11338 0.539728,-1.66924 0.271537,-0.85598 0.962415,-2.99424 1.187384,-3.84502 0.620332,-2.34595 0.856111,-4.7712 1.128505,-7.19502 0.01657,-0.1131 -1.467102,-0.42969 -1.668232,-0.36838 z m 9.410761,1.79587 c -0.73385,0.016 -1.46346,0.0706 -2.18832,0.1842 -0.11137,0.0385 0.50686,1.66174 0.61822,1.62319 1.87249,-0.0995 3.75492,0.0325 5.63272,0.19571 0.12881,-0.0205 -0.25389,-1.88544 -0.38271,-1.86496 -1.22642,-0.0875 -2.45682,-0.1648 -3.67991,-0.13814 z m -4.28833,0.33385 c -0.0134,0.004 -0.0185,0.0155 -0.0196,0.023 -0.4744,3.63127 -1.65556,7.05549 -2.688782,10.52199 -0.129834,0.47602 -0.272615,0.94833 -0.39253,1.4275 -0.113595,0.45387 -0.181544,0.91891 -0.304202,1.36992 -0.381246,1.40185 -0.996818,2.72775 -1.462155,4.09828 -0.371865,0.93776 -0.38412,1.97821 -0.588785,2.95859 -0.0609,0.29186 -0.164678,0.57693 -0.284576,0.85189 -0.114525,-0.003 -0.228929,-0.01 -0.343463,-0.0115 -0.05396,0.003 -0.04384,0.35233 -0.0098,0.73677 -0.07005,0.13734 -0.139932,0.27887 -0.206077,0.41444 -0.570139,0.77163 -0.2597,0.46291 -0.863548,0.94398 -0.08017,0.0875 1.195565,1.30775 1.275703,1.22028 0.874031,-0.79375 0.47177,-0.33213 1.177572,-1.40447 0.01649,-0.0342 0.03241,-0.0694 0.04907,-0.10361 2.938953,0.18182 5.875473,0.26285 8.812153,0.61013 1.10714,0.0655 2.16229,0.48101 3.23833,0.73678 -0.0712,0.17285 -0.14691,0.34385 -0.21589,0.51804 -0.0406,0.11556 1.60807,0.78325 1.6486,0.66769 0.13615,-0.34958 0.28402,-0.69289 0.43178,-1.03607 0.12302,-0.0292 0.23924,-0.0685 0.36308,-0.0921 0.0378,-0.0144 -0.0265,-0.22989 -0.11776,-0.48351 0.11476,-0.25445 0.23327,-0.5073 0.35328,-0.75979 0.34566,-0.97256 0.53162,-1.9514 0.81448,-2.94708 0.24773,-0.872 0.51737,-1.73674 0.78505,-2.60172 1.06196,-0.12536 2.11602,-0.28044 3.17945,-0.41443 0.11935,-0.0409 -0.53813,-1.79071 -0.65748,-1.74983 -0.65106,0.0781 -1.30284,0.16174 -1.95281,0.24175 0.0214,-0.0769 0.0478,-0.15318 0.0687,-0.23024 0.91625,-3.42002 1.39367,-6.9995 2.7771,-10.2572 0.0484,-0.10826 -1.50203,-0.87957 -1.55046,-0.77131 -1.69447,3.23088 -2.18051,6.94537 -3.08132,10.47594 -0.0928,0.33891 -0.19743,0.67548 -0.29439,1.01305 -0.8731,0.093 -1.7496,0.18013 -2.62991,0.23025 -0.11136,0.0385 0.50687,1.67325 0.61823,1.63471 0.49585,0.0263 0.99214,0.0186 1.48177,0 -0.17732,0.62055 -0.35291,1.23782 -0.51028,1.86494 -0.24436,0.97375 -0.36678,1.95086 -0.70654,2.88952 -0.0447,0.0914 -0.084,0.18443 -0.12757,0.27629 -1.3998,-0.37289 -2.76717,-0.96452 -4.21963,-1.05911 -2.57112,-0.33438 -5.15001,-0.45131 -7.722914,-0.51804 0.06033,-0.18007 0.115481,-0.36529 0.157012,-0.55258 0.19526,-0.88051 0.171886,-1.83133 0.529906,-2.67078 0.499911,-1.41584 1.145866,-2.77519 1.560286,-4.22492 0.11436,-0.40005 0.17862,-0.81749 0.28458,-1.22027 3.14268,0.17805 6.2595,0.15185 9.39113,0.0346 l 0.93225,-0.11512 c 0.11699,-0.0338 -0.44234,-1.73752 -0.55935,-1.70378 -0.30083,0.003 -0.60195,-0.003 -0.9028,0 -2.77519,0.0445 -5.54891,0.007 -8.32151,0.0346 1.1064,-3.417 2.2592,-6.85003 2.48271,-10.51048 0.0166,-0.1131 -1.47692,-0.41816 -1.67804,-0.35687 z m 18.91966,4.89261 c -0.0481,0.002 -0.0763,0.008 -0.0785,0.023 -0.69795,4.10612 -2.43352,7.87545 -3.88599,11.70772 -0.97866,3.08819 -2.35708,6.00303 -2.91449,9.23265 -0.10495,1.18766 -0.11844,0.65911 -0.0294,1.60016 0.003,0.12025 1.68118,0.16629 1.67804,0.0461 0.002,-0.66592 -0.0151,-0.2531 0.0883,-1.23179 0.62498,-3.11506 2.0748,-5.91396 3.03225,-8.91031 1.53424,-3.90851 3.30794,-7.81748 3.72898,-12.09913 0.0155,-0.10557 -1.28244,-0.38193 -1.61916,-0.36839 z m 5.3972,0.18419 c -0.0489,0.002 -0.0763,0.008 -0.0785,0.023 -0.96162,5.32291 -2.65843,10.44424 -4.65141,15.40309 -1.1259,2.4679 -1.99826,5.04954 -3.26777,7.43677 -0.12875,0.36902 -0.5073,1.10044 0.0981,1.45051 1.5423,0.89182 3.46821,-0.59156 4.61215,-1.2548 0.69458,-0.40272 1.37844,-0.82501 2.07057,-1.2318 2.31581,-1.59397 4.63825,-3.18411 7.02617,-4.67388 -0.11294,0.41561 -0.22584,0.82584 -0.33364,1.24331 -0.57735,2.66108 -1.8408,5.15375 -2.10982,7.89724 -0.0224,0.0311 -0.0203,0.032 -0.0393,0.0576 0.27911,0.01 0.55742,0.11389 0.83412,0.18419 -0.3254,0.01 -1.53359,0.3602 -1.50141,0.46048 0.42041,0.29712 0.78027,0.74966 1.26589,0.89794 0.5679,0.17338 0.98905,-1.01546 1.1187,-1.32388 0.31557,-2.56473 1.97224,-5.02985 2.41402,-7.57492 0.30279,-1.14254 0.62712,-2.27676 0.96168,-3.40755 0.12721,-0.0726 0.25501,-0.14695 0.38271,-0.21873 0.0308,-0.0229 -0.075,-0.17796 -0.20607,-0.3799 1.02385,-3.41819 2.13763,-6.81232 3.09113,-10.25721 0.038,-0.11711 -1.63028,-0.73877 -1.66824,-0.62165 -1.20765,3.39796 -2.38067,6.80609 -3.41495,10.26873 -3.20453,1.68909 -6.20816,3.72107 -9.11637,5.87113 -1.01155,0.64365 -2.00253,1.33136 -3.03225,1.94553 0.097,-0.17049 0.18969,-0.33862 0.27477,-0.51804 0.85225,-1.79724 1.587,-3.65685 2.48271,-5.43368 2.0677,-5.05514 3.87881,-10.31942 4.43552,-15.86356 0.0158,-0.10735 -1.30624,-0.39367 -1.64859,-0.3799 z m 3.32664,26.35102 c -0.0231,-7.3e-4 -0.0455,-0.0122 -0.0687,-0.0115 -0.0604,0.002 -0.30872,0.5189 0.0687,0.0115 z m 14.55282,-19.80068 c -1.20037,0.13475 -2.40793,0.26527 -3.59159,0.48351 -0.49906,-0.1255 -1.20526,-0.25142 -1.21682,-0.17268 -0.0288,0.15343 -0.0589,0.30719 -0.0883,0.46048 -0.0194,0.005 -0.0394,0.006 -0.0589,0.0115 -0.0238,0.008 -0.0113,0.0973 0.0196,0.21872 -0.0506,0.26405 -0.10068,0.52931 -0.14719,0.79433 -0.25048,1.42667 -0.421,2.87338 -0.69673,4.29398 -0.11666,0.60103 -0.25734,1.20257 -0.40234,1.79588 -0.30721,0.0387 -0.61336,0.0853 -0.92243,0.11512 -0.0902,0.0312 0.29959,1.08677 0.51028,1.47354 -0.29788,1.08561 -0.62082,2.15616 -0.93224,3.23487 -0.46103,1.36374 -1.1406,2.6102 -1.82524,3.85653 -0.0557,0.11162 1.54385,0.99805 1.59953,0.88643 0.14758,-0.24353 0.29646,-0.48023 0.44159,-0.72526 0.082,0.14977 0.14834,0.24171 0.17664,0.23025 4.64984,-0.72371 9.24848,-1.76854 13.98366,-1.98008 0.45427,0.0361 0.89996,0.0791 1.35421,0.11512 0.12691,-0.0193 -0.22637,-1.86119 -0.35327,-1.84192 l -1.5701,-0.14965 c -4.28897,0.0957 -8.4772,0.86539 -12.60983,1.83041 0.25645,-0.51954 0.48294,-1.0461 0.67711,-1.60018 0.38882,-1.26884 0.75336,-2.54972 1.07944,-3.8335 2.43172,-0.26288 4.79685,-0.88017 7.20281,-1.27783 0.11995,-0.0455 -0.59641,-1.80678 -0.71636,-1.76134 -2.02175,0.31846 -4.02024,0.76675 -6.03505,1.11666 0.3844,-1.74863 0.68813,-3.51836 0.87337,-5.31855 1.29823,-0.16906 2.59847,-0.28823 3.90561,-0.40292 0.12685,-0.0407 -0.53063,-1.89418 -0.65748,-1.85344 z m -86.365074,19.17903 c -8.591582,0.31364 -17.232531,1.28919 -25.40611,4.61633 -1.369017,0.61028 -2.758938,1.14501 -4.101875,1.83041 -5.859861,2.9907 -11.359506,7.09236 -16.181798,11.99552 -0.251073,0.37972 4.331645,4.54707 4.582717,4.16735 5.197506,-3.22767 10.098701,-7.13943 15.55376,-9.79673 1.184863,-0.57717 2.411779,-1.00531 3.621033,-1.50807 1.238415,-0.4368 2.459991,-0.96673 3.719162,-1.31237 1.270544,-0.34876 2.569107,-0.52203 3.85655,-0.77131 5.458818,-1.05695 10.580345,-1.62934 16.113104,-1.64621 8.244967,0.5091 16.513903,0.7383 24.738819,1.58866 8.547285,1.11149 16.228962,4.63472 23.865462,9.05996 6.34644,4.0341 12.46777,8.56493 19.41031,11.10909 1.47935,0.54213 2.99516,0.92062 4.4944,1.38145 9.61525,1.93644 19.48051,0.59843 29.00751,-1.41598 4.90038,-1.18833 9.8154,-2.56523 14.57245,-4.45515 -1.43743,1.83101 -2.90784,3.6253 -4.38645,5.41065 -1.71901,2.21636 -3.25628,4.61249 -4.80842,6.98779 -0.11368,0.21315 2.45736,2.10112 2.57103,1.88798 0.10079,-0.147 0.20339,-0.29046 0.30421,-0.43746 0.1546,0.0919 0.272,0.15281 0.29439,0.11512 0.0616,-0.0758 0.3382,-0.40737 0.55935,-0.67921 -0.11848,0.42652 -0.23025,0.8543 -0.32383,1.23179 -0.0453,0.22551 2.67294,0.97379 2.71822,0.74828 0.62496,-2.72857 2.54223,-3.78895 3.84674,-6.14742 4.47748,-6.11839 8.35473,-12.80552 13.12011,-18.63797 0.0466,-0.0704 -0.23358,-0.40373 -0.61823,-0.78281 0.35011,-0.52308 0.70234,-1.03991 1.05001,-1.56563 0.0961,-0.20932 -2.4259,-1.8095 -2.52197,-1.60018 -0.27644,0.33181 -0.56769,0.658 -0.84393,0.99004 0.0733,-0.4477 0.11086,-0.78723 0.0491,-0.80584 -3.69771,-0.10799 -7.41807,-0.13473 -11.05936,-1.02458 -1.94924,-0.47634 -3.25132,-1.10053 -5.10281,-1.87645 -2.57309,-1.58651 -1.33995,-0.76281 -3.71916,-2.45207 -0.16033,-0.16573 -2.16221,2.49356 -2.00188,2.65928 2.35044,1.791 1.65802,1.27856 3.73879,2.65928 -0.31924,0.66835 -0.581,1.31563 -0.50046,1.36993 2.64482,1.72172 5.35574,2.94913 8.15468,3.81048 -5.77569,2.26673 -11.71734,3.97392 -17.70283,5.23797 -7.72996,1.48854 -15.65072,2.85658 -23.47293,1.64621 -1.31948,-0.32962 -2.65655,-0.55921 -3.95468,-0.99003 -6.78852,-2.25289 -12.74195,-6.71682 -18.84115,-10.70617 -8.13398,-4.85297 -16.598166,-8.82262 -25.700503,-10.32629 -9.531153,-1.03986 -19.128345,-1.26116 -28.693501,-1.56564 z"\n       id="path2985"\n       inkscape:connector-curvature="0" />\n  </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="drink">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M147.289 35.5444c-3.60593,3.50908 -8.53589,4.87917 -13.9714,4.87917 -6.9225,0 -13.1942,-2.80396 -16.799,-8.13786 -3.5894,5.43548 -9.91898,8.13786 -16.9206,8.13786 -6.91305,0 -13.147,-2.87246 -16.7458,-8.20636 -3.57759,5.50989 -9.90716,8.20636 -16.9631,8.20636 -5.13665,0 -9.81031,-1.1315 -13.3596,-4.30397l-2.66104 -19.1553c3.66145,4.85909 9.47488,7.9914 16.0206,7.9914 7.05596,0 13.3855,-3.48664 16.9631,-8.99771 3.59885,5.32918 9.83275,8.99771 16.7458,8.99771 7.00163,0 13.3312,-3.49727 16.9206,-8.92802 3.60475,5.32681 9.87646,8.92802 16.799,8.92802 7.05832,0 13.2615,-3.64609 16.8379,-9.15598l-2.86656 19.7446z"/>\n  <polygon class="fil0" points="152.404,197.5 180.166,2.49805 159.601,2.69057 134.609,176.936 65.3828,176.936 40.4011,2.69057 19.8368,2.49805 47.5988,197.5 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="drink2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="148.622,54.3075 130.437,197.5 69.075,197.5 50.8858,54.3075 125.925,54.2957 140.745,2.49805 149.117,4.90279 134.953,54.2697 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="enter">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="75.6325,53.9591 75.6325,36.5838 180.083,36.5838 180.083,163.413 77.3605,163.413 77.3605,149.51 59.9532,149.51 59.9532,172.094 59.9532,179.044 68.6568,179.044 188.798,179.044 197.502,179.044 197.502,172.094 197.502,29.6329 197.502,20.9529 188.798,20.9529 66.9171,20.9529 58.2135,20.9529 58.2135,29.6329 58.2135,53.9591 "/>\n  <polygon class="fil0" points="51.252,132.139 72.1388,111.295 2.50041,111.295 2.50041,93.9114 72.1388,93.9114 51.252,71.3309 75.6325,71.3309 101.741,99.1319 75.6325,132.139 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="fingers">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M122.469 41.9862c3.54097,-10.0737 11.9836,-35.4015 25.3278,-35.4015 9.53393,0 14.1603,8.16502 14.1603,16.8852 0,15.247 -12.5281,45.7539 -17.4308,61.2749l6.26462 1.90868c4.90161,1.08662 7.62644,1.9075 9.80441,6.53391 4.08665,8.17329 5.72485,20.973 5.72485,30.2306 0,16.069 -5.99532,37.8558 -16.8911,50.1146 -13.0678,14.432 -32.4085,23.9671 -51.7421,23.9671 -15.7985,0 -34.3148,-4.6335 -45.213,-16.6159 -9.52803,-10.6206 -18.7927,-31.8617 -18.7927,-46.0232 0,-10.3501 7.35596,-19.6088 17.706,-19.3383 -1.09135,-4.35712 -2.18269,-8.71306 -2.18269,-13.0761 0,-4.07956 1.36182,-6.26344 3.81617,-9.52685 2.17797,-2.9953 8.98826,-9.25992 13.3442,-9.25992 3.54097,0 8.17329,1.63112 11.4367,2.44844 -4.35594,-17.7025 -19.8793,-49.5689 -19.8793,-67.0009 0,-8.44259 7.35124,-16.6088 16.3395,-16.6088 5.99532,0 10.8969,5.98824 13.6218,10.6206 4.62523,8.17211 10.6194,24.7809 13.6135,34.0408l9.25992 25.3337 11.7119 -30.5069zm16.8852 69.1789l0 0 2.17797 4.35712 -1.08662 2.45317c-8.71779,1.6323 -13.0737,3.26459 -19.884,9.52921 -7.08076,6.53509 -17.9718,18.7927 -17.9718,29.1427 0,5.17327 3.26459,12.5292 4.35712,17.973l-2.45435 2.45317c-8.71424,-7.62526 -10.891,-13.3442 -11.4379,-24.5116l-6.26344 0c0.270475,2.44844 0.816148,7.62644 -0.816148,10.0749 -2.17915,3.81617 -7.89809,6.81147 -11.9836,6.81147 -5.44847,0 -13.0749,-4.6335 -17.1604,-8.17447 -4.08074,-3.81027 -7.35124,-9.80323 -9.80441,-14.706l0 -5.98824 2.17797 0.270475c2.72364,6.53982 14.1674,17.9765 20.9706,17.9765 2.72482,0 8.17329,-2.17915 8.17329,-5.44847 0,-2.72482 -13.3454,-20.425 -15.7926,-23.6955 -2.45553,-3.26459 -4.9087,-5.98824 -9.26582,-5.98824 -4.62641,0 -11.4367,7.07958 -11.4367,11.4367 0,3.26932 5.17327,18.7927 7.08076,22.3325 2.45317,5.71894 9.80441,17.432 14.706,20.973 7.35833,5.71776 21.5187,8.16502 30.7774,8.16502 17.9765,0 35.9483,-6.53391 47.6602,-20.4238 10.0761,-11.9836 15.7997,-30.7774 15.7997,-46.2996 0,-10.3513 -1.6382,-20.6966 -12.2588,-24.5116 -10.3501,-3.81027 -31.8688,-6.2658 -43.3043,-7.35124l-9.52921 -0.814967c-1.36182,2.44726 -2.17797,4.35594 -2.17797,7.07958 0,5.71894 5.44138,10.891 10.3442,13.3442 7.62644,3.54097 16.3454,3.54097 24.5116,3.54097l13.8911 0zm-81.4317 -8.17211l0 0c0,5.99296 9.80559,19.6088 13.3442,24.5116 4.08783,5.17799 11.1686,15.2529 18.5186,15.2529 3.26932,0 6.26344,-2.45435 6.26344,-5.71894 0,-5.17917 -12.5292,-25.8734 -15.5222,-31.0514 -4.08665,-6.80557 -5.98824,-11.4367 -14.4367,-12.7997 -2.99412,2.17915 -8.16739,5.71894 -8.16739,9.80559zm26.9601 -74.6215l0 0c-1.90159,-5.17799 -4.90161,-16.0678 -11.9824,-16.0678 -3.81027,0 -5.71776,4.35476 -5.71776,7.35006 0,10.0796 5.17091,24.5116 8.71188,34.316l7.08667 19.3383 2.44726 6.26462c1.363,-1.36182 1.9075,-1.9075 3.81617,-1.9075l13.3454 1.36182 -17.7072 -50.6555zm12.5292 87.6952l0 0 6.26462 14.9777 12.2588 -11.4367 -18.5234 -3.54097zm46.2996 -58.5572l0 0c1.9075,-6.26462 9.25755,-28.0526 9.25755,-33.4999 0,-3.54097 -2.17797,-6.80557 -5.98824,-6.80557 -8.17211,0 -14.1615,22.3336 -15.7985,27.5057l-12.7997 35.4097 16.3395 2.44726 8.98944 -25.0573z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="flower">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M97.9626 24.8293c-1.76104,-27.6817 -23.8821,-21.6108 -23.8821,-21.6108 -21.7632,7.86384 -11.6517,28.0136 -11.6517,28.0136l35.0436 60.095 0.490161 -66.4978z"/>\n  <path class="fil0" d="M175.159 98.3748c27.9085,-1.77403 21.7691,-23.7002 21.7691,-23.7002 -7.95124,-21.5789 -28.2605,-11.5359 -28.2605,-11.5359l-60.5639 34.8133 67.0553 0.422838z"/>\n  <path class="fil0" d="M134.302 33.1302c11.7509,-25.1659 -10.6064,-30.2861 -10.6064,-30.2861 -22.9171,-3.3768 -23.7144,19.1163 -23.7144,19.1163l1.92167 69.3927 32.3991 -58.2229z"/>\n  <path class="fil0" d="M94.1346 95.0511l-57.7103 -32.4168c0,0 -21.0557,-10.3158 -5.69768,-32.1794 0,0 15.606,-12.2812 28.4837,3.19373l34.9243 61.4025z"/>\n  <path class="fil0" d="M90.9125 98.0004c0,0 -58.7001,-34.3881 -59.1961,-33.8979 0,0 -21.7939,-10.5627 -28.7282,11.5465 0,0 -4.45988,17.6824 13.6206,22.8415l74.3037 -0.490161z"/>\n  <path class="fil0" d="M92.1503 101.929l-74.3014 0c0,0 -21.0545,4.17759 -13.1281,26.2797 0,0 5.44847,15.9674 24.5211,8.59849l62.9084 -34.8782z"/>\n  <path class="fil0" d="M94.6283 106.106l-60.682 32.6648c0,0 -16.0974,11.0576 -4.4587,28.988 0,0 18.0828,18.4218 33.6853,-6.14414 15.6037,-24.56 31.4554,-55.5087 31.4554,-55.5087z"/>\n  <path class="fil0" d="M97.3531 110.771l-33.6853 56.4973c0,0 -11.8855,17.6824 7.43037,28.4884 0,0 20.8053,9.82685 26.7486,-17.1899l-0.493705 -67.7958z"/>\n  <path class="fil0" d="M101.318 109.793l-0.497248 66.5604c0,0 0.497248,25.5474 24.2742,20.3895 0,0 17.5844,-4.18114 12.8777,-24.5624l-36.6546 -62.3875z"/>\n  <path class="fil0" d="M104.289 105.861l32.1995 57.7197c0,0 13.3714,19.6502 30.7136,6.38863 0,0 17.334,-14.4934 -2.23348,-30.7018l-60.6796 -33.4066z"/>\n  <path class="fil0" d="M108.251 102.178l66.8722 -0.249215c0,0 25.5132,-0.48898 19.3242,25.5474 0,0 -6.93785,18.6651 -28.7305,8.35282l-57.4658 -33.6511z"/>\n  <path class="fil0" d="M104.537 93.824l0.315357 -0.559847 31.6361 -56.4205c0,0 8.42133,-18.6698 30.214,-6.87761 0,0 17.3434,13.9997 -1.976,31.4376l-60.1895 32.4203z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="folder">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M25.6467 2.49805c1.0878,0 6.35202,2.43073 15.8009,7.28155 9.44535,4.85555 18.5222,9.63078 27.2329,14.3233 8.70479,4.69138 15.2068,8.2288 19.4954,10.604l8.83353 -11.3162 43.1094 22.9785 0.970874 16.9206 15.7655 8.65282 0 77.9675c4.34177,0 7.92053,0.707486 10.7304,2.11183 2.81223,1.4067 6.54808,3.80436 11.2087,7.19651 1.15158,0.835046 3.13467,2.08112 5.94453,3.74176 2.81223,1.66301 4.86854,3.27758 6.18076,4.8461 1.30513,1.56852 1.96301,3.5953 1.96301,6.08863 0,2.49805 -0.707486,4.49885 -2.11419,5.99887 -1.40434,1.50592 -3.62601,3.05554 -6.66383,4.6524 -3.039,1.59923 -5.32327,2.91026 -6.85517,3.93546 -2.75317,2.04923 -5.53705,4.06184 -8.3481,6.04375 -2.81105,1.98663 -5.81579,2.97404 -9.01424,2.97404l-18.7974 0 -133.97 -66.1245 0 -110.827c0,-1.72679 0.631895,-3.1831 1.90041,-4.37129 1.2697,-1.18702 2.77916,-1.77994 4.53429,-1.77994 1.0382,0 2.95632,0.579926 5.75438,1.73978l0 -8.18392c0,-3.63664 2.11183,-5.45437 6.33785,-5.45437zm-12.4324 17.9919l0 0 0 106.159 125.649 62.5989 0 -101.052 -17.856 -9.80677 -5.66225 6.05674 -32.4499 -17.3116 -1.05237 -9.42527 -68.6285 -37.2192zm136.675 53.8681l0 0 -15.7277 -8.45204 -0.961425 -16.3312 -34.1778 -18.3498 -8.73314 11.3174 -66.0478 -35.1109 0 12.1962 63.3584 33.605 1.15276 11.4273 23.9978 12.5777 7.29573 -6.83627 24.6215 12.1997 0 108.183 5.22169 0 0 -116.426z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="frame">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M2.50041 127.801l0 -55.7048c0,-19.9017 3.04254,-32.8774 9.13236,-38.9294 6.08863,-6.0532 19.0856,-9.08275 38.9968,-9.08275l98.7386 0c19.9065,0 32.9046,3.02955 38.9979,9.08275 6.08863,6.05202 9.1359,19.0277 9.1359,38.9294l0 55.7048c0,19.9017 -3.04727,32.8999 -9.1359,38.9838 -6.09336,6.08509 -19.0915,9.12881 -38.9979,9.12881l-98.7386 0c-19.9112,0 -32.9081,-3.04372 -38.9968,-9.12881 -6.08981,-6.08391 -9.13236,-19.082 -9.13236,-38.9838zm48.102 43.1862l0 0 98.8968 0c18.2269,0 29.966,-2.63506 35.2078,-7.9099 5.24295,-5.27366 7.86975,-17.0222 7.86975,-35.2408l0 -55.7804c0,-18.2186 -2.62679,-29.9435 -7.86975,-35.1865 -5.24177,-5.23823 -16.9808,-7.85912 -35.2078,-7.85912l-98.8968 0c-18.2352,0 -29.9884,2.62089 -35.2621,7.85912 -5.27957,5.24295 -7.91463,16.9679 -7.91463,35.1865l0 55.7804c0,18.2186 2.63506,29.9672 7.91463,35.2408 5.27366,5.27484 17.0269,7.9099 35.2621,7.9099z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="hanger">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M195.958 158.47c-2.60908,5.09413 -5.8843,7.67841 -9.81386,7.75636l-170.687 2.54057c-1.19529,-0.0129922 -2.44136,-0.355515 -3.74531,-1.02284 -3.67916,-1.88505 -6.35084,-4.62878 -8.0162,-8.24652 -1.66655,-3.61538 -1.58978,-7.19888 0.226773,-10.7481 1.75631,-3.42522 5.05752,-6.65911 9.91071,-9.69811l80.1313 -49.8618 -0.161812 -10.1564c0.00944889,-1.19056 -0.364964,-2.05513 -1.12796,-2.59608 1.41379,0.724021 -0.122836,-0.0614178 -4.60634,-2.35868 -5.43075,-2.78152 -9.08865,-7.1351 -10.9678,-13.0619 -1.88505,-5.928 -1.38899,-11.6918 1.47993,-17.295 2.86774,-5.59729 7.25675,-9.3674 13.1741,-11.3032 5.91501,-1.93112 11.5902,-1.50828 17.0281,1.27914 4.72563,2.41892 8.33392,6.44651 10.8202,12.0745 2.48742,5.63036 2.54411,10.7717 0.167718,15.4111 -1.58505,3.09451 -3.50318,4.06302 -5.74965,2.91262 -1.06654,-0.546855 -1.60749,-2.39648 -1.62875,-5.55949 -0.0685045,-4.52956 -0.272837,-7.63589 -0.608273,-9.30598 -0.972055,-3.64491 -3.05435,-6.28942 -6.24572,-7.92408 -3.31184,-1.69726 -6.85281,-1.85435 -10.6229,-0.474807 -3.76893,1.38072 -6.44178,3.61775 -8.0292,6.71698 -3.96735,7.74573 0.0330711,14.6836 12.0084,20.8159 3.55751,1.82246 5.35752,3.41814 5.40713,4.78705l0.296459 15.6332 82.966 50.5787c9.23393,5.62918 12.0343,12.0001 8.39416,19.1068zm-11.0965 -4.84138l0 0c1.03229,-2.01498 0.00826778,-3.96381 -3.06735,-5.83942 -13.258,-7.9914 -26.5774,-16.0088 -39.9511,-24.0592 -16.3962,-9.74417 -29.7475,-17.2619 -40.0515,-22.538 -2.84412,-1.45749 -5.67524,-1.33466 -8.49337,0.367326 -14.0233,8.40007 -28.0479,16.8001 -42.0688,25.1955 -23.6742,14.3942 -36.0877,22.7175 -37.2416,24.9722 -1.15513,2.25474 0.161812,4.35122 3.952,6.29296 1.77875,0.910637 26.94,0.989772 75.4825,0.235041 27.6392,-0.526776 55.3363,-1.01694 83.0983,-1.48111 4.52484,-0.0767723 7.30636,-1.12442 8.34101,-3.1453z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="headphones">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M197.502 155.811c0,3.93192 -1.57678,7.46817 -4.71854,10.5993 -3.14294,3.14176 -6.87053,4.70673 -11.1839,4.70673l-20.0387 0 0 -66.5887c0,-19.6442 -5.55595,-36.1337 -16.656,-49.4921 -11.1131,-13.3584 -26.1805,-20.0376 -45.2023,-20.0376 -19.0336,0 -34.0054,6.58234 -44.9035,19.7387 -10.9087,13.1682 -16.3572,29.764 -16.3572,49.7909l0 66.5887 -20.6246 0c-4.32523,0 -7.95715,-1.4693 -10.8969,-4.40909 -2.95042,-2.93979 -4.41972,-6.57171 -4.41972,-10.8969l0 -35.3318c0,-4.31342 1.38663,-8.04101 4.18114,-11.1851 2.78388,-3.12876 6.55989,-4.70673 11.3399,-4.70673l12.5458 0c0,-21.6864 6.39218,-39.7302 19.2013,-54.115 12.8092,-14.3871 29.6447,-21.5919 50.5315,-21.5919 20.8868,0 37.6255,7.20478 50.2327,21.5919 12.606,14.3848 18.9143,32.4286 18.9143,54.115l11.9375 0c4.37248,0 8.1603,1.57797 11.3387,4.70673 3.17837,3.14412 4.77878,6.87171 4.77878,11.1851l0 35.3318z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="heart">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M184.285 17.634c-8.66582,-8.69653 -19.3041,-12.9698 -31.9195,-12.8363 -19.6584,0.207876 -36.4526,10.9194 -50.3543,32.1865l0.00118111 -0.158269 -3.37325 6.36147c0,0 -1.54608,-2.80514 -3.63428,-6.5847l0.0177167 0.455909c-5.13547,-10.5013 -11.6824,-18.3379 -19.6395,-23.5325 -7.95597,-5.19335 -16.7198,-7.7351 -26.2561,-7.63471 -12.5399,0.134647 -23.4758,4.1268 -32.8231,12.0119 -9.32606,7.89219 -13.9312,17.9871 -13.8013,30.2955 0.0448822,4.25673 1.36418,10.3973 3.94609,18.4194 4.64059,11.9942 17.0021,27.6097 37.0845,46.8771 20.099,19.2439 34.068,33.6074 41.9247,43.0622 7.85557,9.45244 12.9946,22.3443 15.43,38.646 1.86498,-14.3493 9.3237,-28.6786 22.3868,-42.9948 13.0631,-14.3411 27.9853,-30.1904 44.7854,-47.5728 16.8013,-17.3824 26.1604,-30.7278 28.0632,-40.0302 0.983866,-3.29176 1.43151,-7.68077 1.37245,-13.1977 -0.146458,-13.819 -4.54492,-25.0762 -13.2107,-33.7739z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="label1">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="91.6318,185.511 85.9767,196.595 83.4881,184.377 76.7002,194.785 75.3455,182.342 67.6517,192.069 67.6517,179.628 58.8288,188.45 60.1883,176.007 50.4595,184.153 52.9481,171.937 42.5413,178.949 46.1626,166.958 35.3046,173.068 40.0539,161.53 28.5179,166.508 34.3987,155.422 22.4092,159.268 29.4215,148.863 17.2053,151.577 24.8978,141.847 12.456,143.207 21.2765,134.386 8.8359,134.61 18.3368,126.692 5.89493,125.788 16.0749,118.549 3.85869,116.514 14.7167,110.404 2.72837,107.238 14.0387,102.036 2.50041,97.737 14.2655,93.8913 3.17955,88.2361 15.3946,85.5208 4.76342,78.9597 17.2053,77.6026 7.25203,69.9124 19.695,69.6856 10.4186,61.0906 23.0884,61.9942 14.7167,52.7201 27.1597,54.7563 19.695,44.5752 31.6833,47.9685 25.3502,37.1093 37.1129,41.6342 31.9101,30.3227 42.9948,35.7511 38.9235,23.9896 49.5535,30.5495 46.6138,18.3344 56.5693,26.0258 54.7575,13.5828 63.8072,22.1801 63.1292,9.73708 71.4986,19.0124 72.1766,6.57052 79.4168,16.7505 81.225,4.3087 87.5605,15.1667 90.5015,2.9516 95.9299,14.2619 100.001,2.49923 104.075,14.2619 109.503,2.9516 112.444,15.1667 118.777,4.3087 120.588,16.7505 127.828,6.57052 128.505,19.0124 136.875,9.73708 136.196,22.1801 145.246,13.5828 143.435,26.0258 153.39,18.3344 150.449,30.5495 161.082,23.9896 157.011,35.7511 168.093,30.3227 162.891,41.6342 174.655,37.1093 168.32,47.9685 180.311,44.5752 172.846,54.7563 185.287,52.7201 176.916,61.9942 189.358,61.0906 180.311,69.6856 192.752,69.9124 182.799,77.6026 195.241,78.9597 184.608,85.5208 196.824,88.2361 185.739,93.8913 197.502,97.737 185.966,102.036 197.276,107.238 185.287,110.404 196.145,116.514 183.93,118.549 194.11,125.788 181.667,126.692 191.17,134.61 178.725,134.386 187.548,143.207 175.107,141.847 182.799,151.577 170.582,148.863 177.594,159.268 165.606,155.422 171.487,166.508 159.949,161.53 164.7,173.068 153.841,166.958 157.461,178.949 147.055,171.937 149.543,184.153 139.818,176.007 141.174,188.45 132.351,179.628 132.351,192.069 124.659,182.342 123.302,194.785 116.515,184.377 114.028,196.595 108.372,185.511 104.754,197.498 100.001,185.965 95.2519,197.498 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="label2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="89.6381,175.597 78.0986,195.144 76.2148,172.536 61.3788,189.729 63.734,167.119 45.8354,181.486 52.1933,159.581 32.1747,170.652 42.3015,150.162 20.634,157.462 34.2948,139.092 11.6859,142.391 28.4081,126.848 5.56185,125.905 24.8754,113.657 2.50041,108.711 23.4604,100 2.50041,91.2846 24.8754,86.3393 5.56185,74.0923 28.4081,73.1486 11.6859,57.6075 34.2948,60.904 20.634,42.5342 42.3015,49.8346 32.1747,29.3471 52.1933,40.4141 45.8354,18.5116 63.734,32.8786 61.3788,10.2709 76.2148,27.462 78.0986,4.85319 89.6381,24.4006 95.2921,2.49687 103.299,23.9305 112.956,3.20436 116.725,25.8132 129.912,6.9721 129.674,29.816 146.161,14.0375 141.686,36.4101 160.761,23.6931 152.52,44.8893 173.245,35.705 161.47,55.2524 183.609,49.8346 168.534,67.0281 191.143,65.6155 173.245,79.7439 195.853,82.5715 175.599,93.1685 197.502,100 175.599,106.828 195.853,117.426 173.245,120.251 191.143,134.383 168.534,132.971 183.609,150.162 161.47,144.745 173.245,164.293 152.52,155.108 160.761,176.302 141.686,163.588 146.161,185.96 129.674,170.182 129.912,193.026 116.725,174.186 112.956,196.794 103.299,176.067 95.2921,197.501 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="label3">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="95.4374,166.484 81.3904,196.213 79.0506,163.206 57.9808,188.485 64.0682,156.182 37.1471,175.38 51.1929,145.649 20.5265,157.589 41.3613,132.071 8.58786,136.05 35.2739,116.622 2.50041,112.173 33.168,100.001 2.50041,87.8275 35.2739,83.3794 8.58786,63.9489 41.3613,67.9293 20.5265,42.4137 51.1929,54.3524 37.1471,24.6215 64.0682,43.8169 57.9808,11.5123 79.0506,36.7952 81.3904,3.78901 95.4374,33.5176 105.738,2.38348 112.057,34.6869 129.849,6.83037 127.977,39.8377 152.088,17.3647 142.02,48.735 171.05,33.0499 153.494,60.9052 185.329,52.9481 161.451,75.4211 194.458,75.6549 165.666,91.5728 197.502,100.001 165.666,108.428 194.458,124.345 161.451,124.582 185.329,147.055 153.494,139.095 171.05,166.951 142.02,151.266 152.088,182.635 127.977,160.162 129.849,193.17 112.057,165.312 105.738,197.618 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="lightning">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="2.50041,96.0988 81.7495,113.208 40.4176,60.9607 161.576,95.3925 160.51,78.7979 197.502,113.01 151.025,122.858 158.091,107.71 84.3148,94.6059 120.352,139.036 17.3895,129.921 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="lowast">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="196.166,71.56 172.719,30.9357 123.464,59.3709 123.464,2.49805 76.5478,2.49805 76.5478,59.3709 27.2943,30.9357 3.83743,71.56 53.0957,99.9976 3.83743,128.441 27.2943,169.07 76.5478,140.621 76.5478,197.5 123.464,197.5 123.464,140.621 172.719,169.07 196.166,128.441 146.917,99.9976 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="mail">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n    .fil1 {fill:#FEFEFE;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="187.231,177.833 188.945,177.833 190.659,177.833 192.364,177.833 194.077,176.117 195.788,174.419 197.502,172.692 197.502,170.994 197.502,169.277 197.502,167.565 197.502,165.869 197.502,164.157 197.502,162.439 197.502,160.743 195.788,159.031 194.077,157.315 194.077,155.602 192.364,155.602 190.659,153.889 188.945,153.889 187.231,153.889 12.7572,153.889 11.0505,153.889 9.34377,155.602 7.62644,155.602 5.91855,157.315 5.91855,159.031 4.20712,160.743 4.20712,162.439 2.50041,164.157 2.50041,165.869 2.50041,167.565 2.50041,169.277 4.20712,170.994 4.20712,172.692 5.91855,174.419 5.91855,176.117 7.62644,176.117 9.34377,177.833 11.0505,177.833 12.7572,177.833 "/>\n  <polygon class="fil0" points="127.372,176.117 194.077,105.995 117.093,22.1647 7.62644,141.913 38.4192,176.117 "/>\n  <polygon class="fil1" points="113.694,39.2956 23.0281,138.501 113.694,138.501 "/>\n  <polygon class="fil1" points="122.247,42.7102 122.247,102.568 178.694,102.568 "/>\n  <polygon class="fil1" points="176.981,111.12 123.946,111.12 123.946,148.765 91.4535,148.765 91.4535,169.277 123.946,169.277 "/>\n  <polygon class="fil1" points="45.2637,169.277 81.1825,169.277 81.1825,148.765 26.4545,148.765 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-drink">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231984680">\n   <g>\n    <path id="_231984992" class="fil0" d="M122.803 57.6123c15.2174,0 27.553,-12.3355 27.553,-27.5577 0,-15.2198 -12.3355,-27.5565 -27.553,-27.5565 -15.2198,0 -27.5577,12.3367 -27.5577,27.5565 0,15.2222 12.3379,27.5577 27.5577,27.5577z"/>\n    <polygon id="_231984848" class="fil0" points="17.5986,65.3285 25.5663,107.739 46.237,107.739 54.0843,65.3285 "/>\n   </g>\n   <path id="_231984776" class="fil0" d="M87.0845 196.134l0 -87.7554 -4.65949 0 -7.33116 21.1667c-2.73782,7.94416 -9.61897,13.9088 -18.3616,13.9088 0,0 -25.6018,0 -33.3699,0 -6.66619,0 -12.0698,-5.40477 -12.0698,-12.0686 0,-6.66501 5.40359,-11.9032 12.0698,-11.9032 4.20358,0 17.7899,0 30.0994,0l9.93787 -28.7258c4.09255,-15.0249 17.0328,-26.0825 33.3381,-26.0825 9.42645,0 49.3279,0 59.0072,0 19.4954,0 32.9648,15.8068 32.9648,35.3022 0,9.93315 0,78.7955 0,85.4546 0,6.66856 -5.24532,12.0686 -11.9044,12.0686 -6.66856,0 -12.0698,-5.40004 -12.0698,-12.0686 0,-7.76581 0,-77.0522 0,-77.0522l-6.21501 0 0 87.7554 -71.436 0z"/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-hand">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231992888">\n   <path id="_231992768" class="fil0" d="M118.151 34.8959c8.94456,0 16.2001,-7.25321 16.2001,-16.2025 0,-8.9481 -7.25557,-16.1954 -16.2001,-16.1954 -8.94102,0 -16.1978,7.2473 -16.1978,16.1954 0,8.94928 7.25675,16.2025 16.1978,16.2025z"/>\n   <path id="_231992744" class="fil0" d="M135.794 38.5279c-5.6091,0 -25.3219,0 -30.7857,0 -7.13273,0 -13.4458,3.6579 -17.1403,9.19141 -5.40359,8.11306 -11.1981,16.8592 -14.269,21.4927 -7.86384,0 -19.9313,0 -22.9514,0 -3.8646,0 -6.99809,3.039 -6.99809,6.89887 0,3.86342 3.13349,6.991 6.99809,6.991 4.49767,0 26.8124,-0.0413389 26.8124,-0.0413389 2.22994,-0.04252 4.39492,-1.14332 5.71422,-3.14294 2.48152,-3.75712 10.6772,-16.0572 10.6772,-16.0572l3.60357 0c0,0 0,116.606 0,124.272 0,5.17799 4.23665,9.3674 9.40401,9.3674 5.17799,0 9.3733,-4.1894 9.3733,-9.3674 0,-7.66541 0,-72.1647 0,-72.1647l3.84098 0c0,0 0,64.4993 0,72.1647 0,5.17799 4.19885,9.3674 9.37094,9.3674 5.17209,0 9.40992,-4.1894 9.40992,-9.3674 0,-7.66541 0,-124.272 0,-124.272l3.60239 0c0,0 0,40.1566 0,44.6578 0,3.85987 3.13585,6.99691 6.99336,6.99691 3.86105,0 6.90005,-3.13703 6.90005,-6.99691 0,-3.86224 0,-43.7732 0,-49.5287 0,-11.2973 -9.25283,-20.4616 -20.5561,-20.4616z"/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-run">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231999224">\n   <g>\n    <g>\n     <g>\n      <path id="_231999392" class="fil0" d="M149.594 39.4728c9.06739,0 16.4234,-7.35596 16.4234,-16.434 0,-9.06858 -7.35596,-16.4234 -16.4234,-16.4234 -9.07212,0 -16.4281,7.35478 -16.4281,16.4234 0,9.07802 7.35596,16.434 16.4281,16.434z"/>\n      <g>\n       <path id="_231998888" class="fil0" d="M93.0527 51.6807l-25.5687 29.5266c-1.51891,1.84962 -3.8079,3.01774 -6.38155,3.01774 -4.56972,0 -8.27369,-3.70633 -8.27369,-8.26542 0,-2.47207 1.08072,-4.68547 2.79215,-6.19847l27.5553 -31.7211c1.51891,-1.8319 3.81381,-3.01302 6.38627,-3.01302l39.8932 0c2.92325,0 5.56776,1.16812 7.49179,3.04845l25.4447 25.427 21.0746 -21.045c1.4882,-1.25316 3.39688,-2.00435 5.48981,-2.00435 4.72208,0 8.54534,3.82798 8.54534,8.54416 0,2.05632 -0.726384,3.93428 -1.92521,5.40595l-25.427 25.6065c-7.71738,7.7103 -13.9194,1.17875 -13.9194,1.17875l-15.5895 -15.684 -24.3817 28.192 22.3325 22.3289c0,0 4.69019,4.36303 2.02915,13.0725l-12.5316 55.8016c-0.995677,4.84256 -5.27484,8.48274 -10.4127,8.48274 -5.86422,0 -10.6217,-4.75752 -10.6217,-10.6217 0,-0.927173 0.120473,-1.82364 0.338979,-2.68112l10.2828 -45.7622 -25.375 -24.6781 -21.8175 24.3427c0,0 -3.52207,4.36303 -12.906,4.02641l-44.261 0.0661423c-4.94059,0.0921267 -9.42881,-3.28821 -10.5544,-8.29613 -1.27914,-5.72839 2.23703,-11.3328 7.96069,-12.6143 0.902369,-0.197246 1.80474,-0.281105 2.68703,-0.250396l38.072 0.102757 56.293 -65.2623 -14.7226 -0.0732289z"/>\n       <path id="_231999032" class="fil0" d="M92.3015 109.639c-0.00472445,0 -0.00472445,0 -0.00472445,0 0,0 0,0 0.00472445,0zm0 0c-0.00472445,0 -0.00472445,0 -0.00472445,0l0.00472445 0c0,0 0,0 -0.00472445,0 0.00472445,0 0.00472445,0 0.00472445,0z"/>\n      </g>\n     </g>\n    </g>\n   </g>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="man-woman">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:white;stroke-width:0.900007}\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231994136">\n   <g>\n    <g>\n     <path id="_231990656" class="fil0" d="M41.6743 35.0507c8.74023,0 15.8234,-7.08903 15.8234,-15.8257 0,-8.73905 -7.08313,-15.8269 -15.8234,-15.8269 -8.74023,0 -15.8234,7.08785 -15.8234,15.8269 0,8.73668 7.08313,15.8257 15.8234,15.8257z"/>\n     <path id="_231988640" class="fil0" d="M59.1536 39.1007c11.1887,0 20.3647,9.07684 20.3647,20.2702 0,5.70477 0,45.246 0,49.0716 0,3.8268 -3.00829,6.92604 -6.83509,6.92604 -3.82798,0 -6.92958,-3.09924 -6.92958,-6.92604 0,-4.45988 0,-44.2421 0,-44.2421l-3.5705 0c0,0 0,115.523 0,123.114 0,5.12721 -4.20003,9.28472 -9.3237,9.28472 -5.12366,0 -9.28472,-4.15751 -9.28472,-9.28472 0,-7.591 0,-71.4891 0,-71.4891l-3.80318 0c0,0 0,63.8981 0,71.4891 0,5.12721 -4.15988,9.28472 -9.28236,9.28472 -5.12484,0 -9.3237,-4.15751 -9.3237,-9.28472 0,-7.591 0,-123.114 0,-123.114l-3.5705 0c0,0 0,39.7822 0,44.2421 0,3.8268 -3.10278,6.92604 -6.92958,6.92604 -3.8268,0 -6.83509,-3.09924 -6.83509,-6.92604 0,-3.82562 0,-43.3669 0,-49.0716 0,-11.1934 9.16897,-20.2702 20.3647,-20.2702 5.41185,0 29.4002,0 34.9585,0z"/>\n    </g>\n   </g>\n  </g>\n  <g id="_231990440">\n   <g>\n    <g>\n     <g>\n      <path id="_231990008" class="fil0 str0" d="M151.032 34.4743c-8.90558,0 -16.1198,-7.15636 -16.1198,-15.9863 0,-8.83117 7.21423,-15.9899 16.1198,-15.9899 8.90086,0 16.1151,7.15872 16.1151,15.9899 0,8.82999 -7.21423,15.9863 -16.1151,15.9863z"/>\n     </g>\n     <path id="_231990392" class="fil0 str0" d="M138.732 37.9952c0,0 -14.7922,-0.551579 -19.8616,17.1131l-12.697 44.1972c-1.21064,4.13153 1.07481,7.28864 4.68075,8.32447 3.6083,1.0382 7.29809,-0.781896 8.2477,-4.08901l12.345 -43.0834 3.36735 -0.00472445 -21.4088 74.6037 20.1462 0.00236222 0.0141733 0.0141733 0 54.7575c0,4.16814 3.57404,7.65006 7.93116,7.66778 3.84452,0.0129922 7.89927,-3.88231 7.89927,-8.05164l0 0.0153545 0 -54.4055 3.22562 0 0 54.4055 0 -0.0153545c0,4.16932 4.06066,8.06463 7.89809,8.05164 4.36775,-0.0177167 7.93825,-3.49963 7.93825,-7.66778l0 -54.7575 0.0129922 -0.0141733 20.1509 -0.00236222 -21.4076 -74.6037 3.36262 0.00472445 12.3414 43.0834c0.943708,3.30711 4.63823,5.12721 8.24298,4.08901 3.61302,-1.03583 5.89375,-4.19295 4.68193,-8.32447l-12.6934 -44.1972c-5.07051,-17.6647 -19.8616,-17.1131 -19.8616,-17.1131l-24.5565 0z"/>\n    </g>\n   </g>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="mark">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M62.8977 158.334c8.60558,-19.3572 17.8761,-38.0247 27.8152,-56.0107 9.93315,-17.9789 20.6258,-35.0483 32.0719,-51.2095 11.4473,-16.1564 20.1887,-27.2364 26.2183,-33.2329 6.02958,-5.99178 10.2036,-9.50204 12.5103,-10.519 2.30553,-1.01812 7.40675,-2.08702 15.3048,-3.19609 7.89691,-1.10788 13.3088,-1.66773 16.2391,-1.66773 1.86143,0 2.79451,0.715754 2.79451,2.13191 0,0.889377 -0.334255,1.75159 -0.996858,2.59608 -0.670871,0.843314 -2.59608,2.68585 -5.7839,5.51933 -16.0419,14.9139 -33.6782,36.9239 -52.9126,66.0277 -19.2356,29.1038 -35.32,59.6757 -48.2543,91.7039 -5.23114,12.7808 -8.82527,20.4592 -10.7706,23.0281 -1.9512,2.66104 -8.10951,3.99452 -18.4738,3.99452 -7.44809,0 -11.9056,-0.753549 -13.3678,-2.25474 -1.46222,-1.5071 -4.40555,-5.62327 -8.83826,-12.3485 -7.26502,-11.2336 -15.6462,-21.8565 -25.1282,-31.8605 -4.78586,-5.04335 -7.17525,-8.85007 -7.17525,-11.4154 0,-3.54215 2.60199,-7.15045 7.82014,-10.8213 5.21697,-3.6709 9.54574,-5.50752 12.9993,-5.50752 4.41854,0 9.8552,2.43545 16.3088,7.30518 6.45478,4.86972 13.656,14.1131 21.6191,27.7372z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="monster">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!-- Created with Inkscape (http://www.inkscape.org/) -->\n\n<svg\n   xmlns:dc="http://purl.org/dc/elements/1.1/"\n   xmlns:cc="http://creativecommons.org/ns#"\n   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n   xmlns:svg="http://www.w3.org/2000/svg"\n   xmlns="http://www.w3.org/2000/svg"\n   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"\n   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"\n   width="200"\n   height="200"\n   id="svg2"\n   version="1.1"\n   inkscape:version="0.48.4 r9939"\n   sodipodi:docname="monster.svg">\n  <defs\n     id="defs4" />\n  <sodipodi:namedview\n     id="base"\n     pagecolor="#ffffff"\n     bordercolor="#666666"\n     borderopacity="1.0"\n     inkscape:pageopacity="0.0"\n     inkscape:pageshadow="2"\n     inkscape:zoom="0.63516094"\n     inkscape:cx="325.30097"\n     inkscape:cy="299.43109"\n     inkscape:document-units="px"\n     inkscape:current-layer="layer1"\n     showgrid="false"\n     inkscape:window-width="1366"\n     inkscape:window-height="684"\n     inkscape:window-x="-8"\n     inkscape:window-y="-8"\n     inkscape:window-maximized="1" />\n  <metadata\n     id="metadata7">\n    <rdf:RDF>\n      <cc:Work\n         rdf:about="">\n        <dc:format>image/svg+xml</dc:format>\n        <dc:type\n           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />\n        <dc:title></dc:title>\n      </cc:Work>\n    </rdf:RDF>\n  </metadata>\n  <g\n     inkscape:label="Layer 1"\n     inkscape:groupmode="layer"\n     id="layer1"\n     transform="translate(0,-852.36218)">\n    <path\n       style="fill:#552200"\n       d="m 133.82196,859.03231 c -0.81806,0 -1.63621,0.047 -1.63621,0.15289 -1.30942,4.95455 -3.31364,9.70355 -5.35945,14.43293 -0.53584,1.18089 -1.07265,2.36425 -1.60282,3.54707 -0.54524,-0.33448 -1.08325,-0.60291 -1.56943,-0.68801 -1.09376,-0.19145 -2.04238,-0.28781 -2.93851,-0.30578 -0.47703,-0.11201 -0.96839,-0.20484 -1.45256,-0.29049 -0.98451,-0.17416 -1.97757,-0.23322 -2.9719,-0.35165 -0.91158,0.003 -1.82699,-0.044 -2.73816,-0.0306 -0.30372,0.004 -0.61516,0.0111 -0.91828,0.0306 -1.91918,0.123 -5.00046,0.74288 -6.8287,1.13139 -2.70928,0.57575 -5.38763,1.21434 -8.080899,1.84998 -1.477349,0.34868 -2.949497,0.71319 -4.424459,1.07024 -3.646652,0.79377 -5.079802,1.13744 -8.715353,1.78883 -2.324435,0.41647 -4.656999,0.75735 -6.995656,1.05495 -0.217223,0.0276 -0.433795,0.0493 -0.651145,0.0764 -1.060938,0.13255 -2.124987,0.25495 -3.188953,0.38223 -1.053349,0.12601 -2.102793,0.26748 -3.155555,0.39752 -1.073071,0.18806 -2.161088,0.32797 -3.222344,0.5657 -3.940736,0.88274 -7.650379,2.31842 -11.152981,4.12806 -2.148524,-3.67009 -4.191057,-7.3927 -6.194244,-11.13048 -0.06091,-0.20133 -3.166383,0.59371 -3.105471,0.79504 0.942632,3.43376 2.294184,6.77323 3.95697,9.9685 0.456256,0.87675 0.948287,1.73653 1.435865,2.59915 -0.435414,0.26944 -0.873877,0.53088 -1.302295,0.81032 -0.556685,0.38735 -1.128879,0.76315 -1.686303,1.14668 -2.376389,-1.27223 -4.711264,-2.59791 -6.97896,-4.03632 -1.01325,-0.60868 -2.036907,-1.195 -3.038689,-1.81941 -3.02836,-1.88755 -5.994883,-3.95077 -9.316408,-5.39705 -0.168924,-0.14275 -2.372812,2.05889 -2.203883,2.20163 3.762414,2.7254 7.533429,5.44069 11.386726,8.05736 2.033834,1.41169 4.148966,2.70575 6.311116,3.9293 -1.810715,1.4663 -3.607057,2.94988 -5.593188,4.2198 -0.707248,0.56997 -1.269638,0.96051 -1.803176,1.69709 -1.421961,1.96311 -2.00397,4.30198 -2.654675,6.58961 -0.156145,0.37458 -0.304877,0.76425 -0.450792,1.14668 -0.09937,0.33809 -0.218357,0.66715 -0.300532,1.00908 -0.03645,0.15171 -0.05563,0.30543 -0.08348,0.45868 -0.03337,0.0861 -0.0654,0.17452 -0.100174,0.25991 -0.05377,0.20046 -0.14089,0.51318 -0.200354,0.73388 -0.0057,0.0157 -0.0112,0.03 -0.01668,0.0458 -0.140484,0.40396 -0.240154,0.83659 -0.333919,1.23842 -0.01761,0.0754 -0.03175,0.15708 -0.05009,0.22934 -0.611364,2.27178 -1.309648,4.83027 -1.702997,6.62019 -0.06898,0.3139 -0.134642,0.63348 -0.200353,0.94792 -0.002,0.005 0.002,0.0105 0,0.0153 -0.179796,0.48396 -0.291908,1.05168 -0.384009,1.48305 -0.26244,1.2291 0.05656,0.75197 -0.317226,1.25371 -0.287533,0.86513 -0.55989,1.75435 -0.734631,2.64501 -0.08057,0.41069 -0.07942,0.82894 -0.166957,1.23842 -0.05525,0.2584 -0.182672,0.51277 -0.267141,0.76446 l -0.200354,0.9785 c -0.451393,1.62229 -0.43492,3.28227 -0.333919,4.93838 -0.0034,0.10426 0.197203,0.20242 0.534273,0.2905 -0.07917,1.08288 -0.15113,2.17228 -0.200354,3.25658 -0.154593,2.83382 -0.158894,5.65146 -0.283829,8.48546 -0.108223,2.45502 -0.178161,2.91621 -0.317226,5.45821 -0.06629,1.21158 -0.124931,2.41162 -0.18366,3.62352 -0.321228,11.39655 -0.03621,22.80675 1.001767,34.17115 0.46586,5.7036 0.462088,5.4973 0.434098,5.2136 -0.0088,0.012 0.03743,0.8098 0.333919,4.8925 0.287387,3.95736 0.71286,7.91326 0.834806,11.87966 0.03606,1.1727 0.01076,2.3432 0.01668,3.5165 0.0181,5.1421 0.01707,10.2876 0.233744,15.4267 0,0.028 0.104446,0.047 0.267137,0.061 -10e-6,0.2196 9e-6,0.4377 0,0.6574 -5e-6,0.1505 0.438369,0.2852 1.118634,0.3822 0.06176,0.4213 0.34094,1.3521 0.434099,1.3301 0.188998,0.044 0.377824,0.082 0.567669,0.1224 -0.0039,0.04 -4.9e-4,0.069 0.01668,0.076 0.367178,0.1045 0.729132,0.2349 1.101941,0.3211 2.168271,0.5015 4.408808,0.8129 6.611649,1.1467 3.912159,0.5927 2.502625,0.3777 6.611645,0.902 1.2372,0.1586 2.467648,0.3422 3.706531,0.4893 2.712666,0.3221 5.433218,0.5776 8.147684,0.8867 4.501301,0.5126 8.992152,1.1018 13.49043,1.636 9.618603,1.1824 19.257496,2.2198 28.917601,3.0731 8.15861,0.6479 16.32905,1.1857 24.49315,1.7735 6.29065,0.5303 12.60343,0.3565 18.89996,0.046 4.34384,-0.011 8.63826,-0.6124 12.93946,-1.0855 2.37464,-0.2969 4.76374,-0.1257 7.14592,-0.046 1.1456,0.069 2.29196,0.075 3.43939,0.076 0.23676,0.06 1.17175,-3.013 0.93499,-3.073 -0.92493,-0.038 -1.8468,-0.082 -2.77156,-0.1224 0.0498,-0.2246 0.10452,-0.4485 0.15027,-0.6727 0.24123,-0.013 0.4341,-0.041 0.4341,-0.076 0.0404,-0.7207 0.009,-1.4384 -0.0501,-2.1557 0.29341,-2.0777 0.42234,-4.1737 0.4341,-6.2685 -0.0729,-1.5532 -0.0154,-0.8105 -0.15027,-2.2017 -0.001,-0.022 -0.0807,-0.038 -0.18365,-0.046 0.008,-0.082 0.005,-0.1633 0.0167,-0.2446 0.1292,-1.7339 0.32168,-3.4658 0.0501,-5.1983 -0.089,-0.6146 -0.20185,-1.2345 -0.30052,-1.85 -0.0121,-0.122 -0.0336,-0.245 -0.0501,-0.3669 -0.0186,-0.117 -0.0317,-0.2347 -0.0501,-0.3516 -0.29608,-1.8892 -0.52862,-3.7801 -0.4174,-5.6876 0.0411,-0.1128 0.0393,-0.1264 0.10018,-0.2905 0.12459,-0.4607 0.27397,-0.9091 0.36731,-1.376 0.18079,-0.9043 0.28413,-1.8407 0.26713,-2.7673 0.0409,-0.1636 0.0674,-0.284 0.11688,-0.474 0.88606,-3.4012 2.24785,-6.692 3.08877,-10.10606 0.46661,-2.1215 0.8848,-3.7588 1.11864,-5.9322 0.13302,-1.2363 0.19911,-2.4743 0.23374,-3.7153 2.9e-4,-0.01 0.0164,-0.02 0.0167,-0.031 0.10416,-0.3593 0.18458,-0.7491 0.28383,-1.4525 0.1174,-0.8322 -0.0899,-1.8852 0.0167,-2.7368 0.0238,-1.4744 0.0554,-2.944 0.0167,-4.4185 -0.0425,-1.2452 -0.13095,-2.4855 -0.16696,-3.7306 0.072,-1.4801 0.5237,-2.9216 0.60106,-4.4032 0.0665,-1.7837 -0.0294,-3.5988 -0.65115,-5.2748 0.0376,-7.7577 -0.13145,-15.52017 -1.53604,-23.19355 -0.33857,-1.80339 -0.62015,-3.61921 -1.01846,-5.41234 -1.78526,-8.03699 -4.7823,-15.79486 -7.06244,-23.71342 -0.60593,-2.20933 -0.86288,-3.10561 -1.11864,-4.03633 -0.0443,-0.24825 -0.0992,-0.50893 -0.18365,-0.82561 -0.0649,-0.2434 -0.14627,-0.48649 -0.23375,-0.71859 -0.004,-0.0107 -0.0126,-0.0199 -0.0167,-0.0306 -0.22548,-0.81695 -0.40778,-1.50512 -0.90159,-3.28716 -1.06867,-3.8565 -2.05193,-7.85405 -4.02375,-11.43625 -0.55253,-1.00378 -1.29339,-1.91704 -1.93675,-2.87436 -2.10552,-2.20711 -2.39203,-2.8456 -5.15909,-4.40326 -0.99879,-0.56226 -2.06928,-0.99783 -3.13886,-1.43718 0.28238,-0.48877 0.57151,-0.97783 0.8515,-1.46775 1.51104,-2.64404 3.05495,-5.31553 4.2742,-8.08795 0.18587,-0.42266 0.31981,-0.85421 0.48418,-1.28428 0.0885,-0.19757 -2.96683,-1.34425 -3.05538,-1.14668 -2.47168,3.39161 -4.80968,6.84404 -7.07914,10.35073 -1.26372,-0.41494 -2.53971,-0.83043 -3.8067,-1.23842 1.19638,-2.82479 2.37278,-5.65523 3.47278,-8.51604 0.0356,-0.0925 1.61082,-4.15435 1.75309,-4.57144 0.13204,-0.38712 0.20764,-0.78432 0.31723,-1.17727 0.0885,-0.19757 -2.96683,-1.34424 -3.05539,-1.14668 -2.69635,4.4572 -4.86236,9.16139 -7.02905,13.85194 -1.89719,-0.67324 -1.50824,-0.54184 -4.37437,-1.62065 0.59021,-1.43032 1.17551,-2.85593 1.73639,-4.29624 1.89507,-5.09005 3.88185,-10.30669 3.94027,-15.74779 0,-0.10594 -0.81815,-0.15289 -1.63621,-0.15289 z m -19.81824,18.30107 c 0.26223,-0.001 0.52206,-0.01 0.78471,0 -0.34018,0.11727 -0.65236,0.26353 -0.96837,0.41281 -0.82479,-0.0361 -1.64721,-0.0925 -2.47102,-0.1376 0.72758,-0.11395 1.43948,-0.21319 2.07031,-0.25992 0.19487,-0.0144 0.38899,-0.0143 0.58437,-0.0153 z m 0.8181,0.0153 c 0.0781,0.003 0.15562,-0.003 0.23375,0 -0.0891,0.0375 -0.17076,0.0832 -0.26714,0.0917 -0.0318,0.003 0.006,-0.0534 0.0334,-0.0917 z m 31.18828,9.72387 c 2.07992,0.8314 3.74753,1.55946 5.47631,2.99667 0.78047,0.64883 1.39015,1.4468 2.08701,2.17106 0.11324,0.17089 0.23268,0.336 0.35062,0.50454 -0.24717,-0.22658 -0.52039,-0.42936 -0.83481,-0.59628 l -1.13533,-0.82561 c -0.0691,4.9e-4 -0.13857,0.0284 -0.20035,0 -0.25506,-0.11733 -0.4395,-0.47034 -0.71793,-0.41281 -0.21345,0.0441 0.27114,0.30928 0.36731,0.48925 0.002,0.003 -3.6e-4,0.0109 0,0.0153 -0.0797,-0.0345 -0.15652,-0.0703 -0.23374,-0.10703 -0.16655,-0.1625 -0.32018,-0.32441 -0.48419,-0.48925 0.008,0.0813 0.0144,0.0916 0.0167,0.12232 -0.0806,-0.13525 -0.12617,-0.31152 -0.0835,-0.55041 -0.54876,-0.38827 -1.04143,-0.81974 -1.60282,-1.19255 -0.0185,-0.0123 -0.0457,-0.0229 -0.0668,-0.0306 -0.23299,-0.25656 -0.47204,-0.50311 -0.73464,-0.73388 -0.35736,-0.31404 -0.81418,-0.53346 -1.21881,-0.79503 -0.34779,-0.15521 -0.67957,-0.3425 -1.01846,-0.51983 0.009,-0.0161 0.024,-0.0298 0.0334,-0.0459 z m 24.76028,75.58936 c 9.8e-4,0.077 0.0158,0.1529 0.0167,0.2294 -0.009,-0.051 -0.0242,-0.1017 -0.0334,-0.1529 0.008,-0.025 0.009,-0.052 0.0167,-0.077 z"\n       id="path2991"\n       inkscape:connector-curvature="0" />\n    <path\n       style="fill:#000000"\n       d="m 64.168729,920.11133 c -0.688284,-0.0205 -1.371069,0.0536 -2.052141,0.23376 -0.319809,0.0846 -0.626595,0.19753 -0.940567,0.2987 -0.628483,0.29577 -1.233761,0.65021 -1.795622,1.05193 -0.264715,-0.46301 -0.538197,-0.86459 -0.612793,-0.83116 -2.3508,0.49469 -4.037339,1.66937 -5.401118,3.46749 -0.294006,0.38765 -0.543368,0.8053 -0.812304,1.20777 -0.815055,1.63764 -1.387386,3.49884 -0.769554,5.28565 0.379732,1.09821 0.715648,1.31082 1.496352,2.1688 0.37436,0.23751 0.718475,0.52719 1.125826,0.71428 1.914579,0.87931 4.708426,0.59373 6.71221,0.15584 0.510026,-0.11146 1.009341,-0.27494 1.510604,-0.41558 1.696372,-0.48082 3.354706,-1.15633 4.745575,-2.18179 0.771046,-0.56848 0.968982,-0.8283 1.610362,-1.49349 1.000695,-1.14051 1.92724,-2.35975 1.995134,-3.87007 0.01194,-0.26563 -0.02862,-0.52666 -0.04276,-0.7922 -0.330573,-2.09967 -1.568541,-3.1185 -3.448735,-4.19475 -1.032468,-0.48331 -2.173344,-0.77094 -3.320477,-0.80518 z m -8.450829,6.29861 c -0.108814,0.28165 -0.210231,0.55376 -0.285018,0.83116 -0.02911,0.0574 -0.05583,0.11004 -0.08551,0.16883 -0.292186,0.74824 -0.595644,1.62496 -0.669795,2.48049 -0.195451,-1.03734 0.307905,-2.12852 0.74105,-3.05191 0.09185,-0.13633 0.203152,-0.28361 0.29927,-0.42857 z m 5.41537,2.02595 c 0.197203,-0.0118 0.389396,0.0251 0.584289,0.052 -0.06858,0.0925 -0.138747,0.18423 -0.213764,0.27272 -0.07443,0.003 -0.15363,0.009 -0.228016,0.013 -0.07507,0.004 -0.17089,0.0576 -0.228015,0.013 -0.09187,-0.0717 -0.08248,-0.19515 -0.01424,-0.33766 0.03234,-0.004 0.06777,-0.0111 0.09976,-0.013 z"\n       id="path3107"\n       inkscape:connector-curvature="0" />\n    <path\n       style="fill:#333333"\n       id="path3148"\n       d="m 56.55501,928.59801 c 1.547786,0.39757 2.83969,1.31792 4.398944,1.67258 0.162535,0.006 0.326004,0.0348 0.487598,0.0179 0.09038,-0.009 -0.274788,0.042 -0.269244,-0.0408 0.0057,-0.0861 0.187598,-0.0298 0.276026,-0.0605 0.484466,-0.16841 0.938776,-0.41566 1.363691,-0.68239 0.552932,-0.40462 1.147632,-0.75828 1.724103,-1.1342 0.14317,-0.12403 2.067895,1.72108 1.924726,1.84511 l 0,0 c -0.552889,0.33243 -1.053555,0.72824 -1.576829,1.09638 -0.21506,0.16216 -0.414768,0.34289 -0.645171,0.48649 -0.464148,0.28927 -1.764393,0.89677 -2.277046,0.96073 -0.983102,0.12266 -1.481997,0.002 -2.362371,-0.13333 -1.744192,-0.48493 -3.411836,-1.24892 -4.926016,-2.16973 -0.144182,-0.12125 1.737406,-1.97945 1.881589,-1.85821 z"\n       inkscape:connector-curvature="0" />\n    <g\n       id="g3234"\n       transform="matrix(0.48925166,0,0,0.48925166,-56.824832,738.03426)">\n      <path\n         inkscape:connector-curvature="0"\n         id="path3109"\n         d="m 404.91414,367.82749 c -2.99858,0.10484 -5.80413,1.23152 -9.05884,2.30936 -1.96812,0.82127 -3.93068,1.7216 -5.7965,2.78715 -3.20302,0.72146 -6.2147,2.17099 -8.65105,4.22054 -0.7505,0.63135 -1.3712,1.36342 -2.06809,2.04391 -0.60209,0.79174 -1.29407,1.51964 -1.80594,2.36244 -2.73717,4.50669 -2.42491,8.67714 -1.3399,13.51104 1.08015,3.21921 3.13584,6.04226 6.67034,7.37931 2.74829,1.03965 4.32659,0.78295 7.4568,0.90251 5.97454,-0.50509 12.04636,-2.35813 17.0982,-5.3354 1.09377,-0.64461 2.09885,-1.41736 3.14583,-2.12354 3.60458,-2.47829 6.62741,-5.53497 7.86459,-9.58249 0.68739,-2.24884 0.50571,-2.98431 0.49518,-5.28232 -0.49373,-4.19006 -2.5111,-8.05587 -6.14603,-10.75043 -0.65941,-0.48882 -1.39087,-0.86975 -2.09723,-1.30067 -2.07794,-0.88935 -3.96822,-1.20431 -5.76736,-1.14141 z m 0.37866,17.22725 c -0.0483,0.054 -0.0966,0.10562 -0.14564,0.15926 -0.12651,0.098 -0.25026,0.19602 -0.37866,0.29199 -0.09,-0.0776 -0.17215,-0.17084 -0.26216,-0.2389 0.13333,-0.0248 0.27556,-0.0265 0.4078,-0.0531 0.12432,-0.0528 0.25462,-0.10592 0.37866,-0.15926 z m -9.17535,2.2828 c 0.10191,0.0965 0.19338,0.19338 0.29128,0.29199 -0.0502,0.0918 -0.0938,0.16955 -0.14564,0.26544 -0.0238,0.0637 0.17972,0.18529 0.46605,0.31854 0.13046,0.36025 0.23474,0.80559 0.0291,1.00868 -0.17206,0.16996 -0.40442,0.28993 -0.61169,0.42471 -0.20402,0.0497 -0.40539,0.11555 -0.61169,0.15926 0.0191,0.0223 0.0584,0.032 0.0873,0.0531 -0.32843,0.1378 -0.65639,0.27042 -0.99036,0.39817 -0.0226,-0.0446 -0.04,-0.0831 -0.0582,-0.13273 0.47617,-0.90644 0.98446,-1.84592 1.54379,-2.78715 z"\n         style="fill:#000000" />\n      <path\n         inkscape:connector-curvature="0"\n         d="m 387.47176,389.522 c 2.75597,1.51852 5.2175,3.6319 8.40971,4.39336 0.45569,0.1087 0.93177,0.12674 1.39766,0.19011 -0.23004,-0.0711 -0.75796,-6.6e-4 -0.69011,-0.2132 0.082,-0.25692 0.5689,-0.14056 0.83753,-0.24857 0.33944,-0.1365 0.6726,-0.29181 0.97932,-0.48203 0.76698,-0.47567 1.42703,-1.39204 2.05036,-1.9978 0.65696,-0.74418 1.42867,-1.38629 2.2023,-2.02573 0.2745,-0.2721 4.49721,3.26568 4.2227,3.53779 l 0,0 c -0.75104,0.47662 -1.29769,0.83664 -1.76384,1.60572 -0.99719,0.96669 -1.73597,2.13904 -2.86003,3.00361 -0.46827,0.36016 -1.00951,0.63761 -1.55008,0.90056 -2.65535,1.29164 -2.20977,0.83395 -5.90314,0.99707 -0.73972,-0.15758 -1.49575,-0.26141 -2.21916,-0.47271 -3.77953,-1.10399 -6.9358,-3.41177 -9.64236,-5.98666 -0.24842,-0.29184 4.28072,-3.49337 4.52914,-3.20152 z"\n         id="path3150"\n         style="fill:#333333" />\n    </g>\n    <g\n       id="g3238"\n       transform="matrix(0.48925166,0,0,0.48925166,-60.738846,720.4212)">\n      <path\n         inkscape:connector-curvature="0"\n         id="path3115"\n         d="m 405.99256,468.69494 c -1.5568,0 -3.09375,0.0923 -3.09375,0.3125 -0.0809,0.79703 -0.1848,1.60778 -0.25,2.40625 -0.0116,0.14247 -0.0207,0.15079 -0.0312,0.28125 -4.2277,-0.81008 -8.48043,-1.66818 -12.8125,-1.25 -2.52171,0.0179 -4.96088,0.0545 -7.34375,-0.1875 -6.63089,-0.19542 -13.24115,-0.348 -19.875,-0.0937 -4.7176,0.07 -9.43886,0.21349 -14.15625,0.0625 -6.12407,-0.23012 -12.24579,-0.34315 -18.375,-0.28125 -6.37111,0.10777 -12.75556,0.23646 -19.125,0.375 -5.67281,-0.0982 -11.3269,-0.32425 -17,-0.40625 -9.52916,-0.24101 -19.09307,-0.3925 -28.625,-0.25 -4.84991,0.25024 -9.80833,0.49228 -14.34375,2.40625 -0.0957,0.055 0.0295,0.45497 0.28125,1 -1.12014,0.0739 -2.22531,0.17969 -3.34375,0.28125 -0.17017,0.0437 -0.0119,1.08703 0.25,2.25 -1.7389,-0.0428 -3.78125,0.0593 -3.78125,0.3125 -0.66721,6.01703 -0.86651,12.06985 -0.96875,18.125 -0.0935,0.51179 -0.13381,1.028 -0.125,1.5625 -0.1647,0.25152 -0.32445,0.50303 -0.4375,0.78125 -1.03376,2.54406 -0.0616,6.82468 0.4375,9.625 -0.0718,9.85404 0.25265,19.71206 0.46875,29.5625 0.14008,3.19573 0.0533,6.39196 0.0625,9.59375 -0.29682,2.11609 -0.77885,4.20348 -1.28125,6.28125 -0.12898,0.53346 -0.35919,1.22102 -0.53125,1.90625 -0.2044,0.40246 -0.37395,0.80317 -0.21875,1.09375 -0.0202,0.20998 -0.0162,0.4066 0,0.59375 0.38984,0.0695 0.76768,0.18268 1.15625,0.28125 0.55128,0.30153 1.16776,0.51354 1.78125,0.71875 0.66749,3.60866 1.45636,7.17037 2.5,10.6875 0.421,1.39177 0.44526,2.8134 0.34375,4.25 -0.0294,0.41601 -0.11175,0.83335 -0.0937,1.25 0.0212,0.48869 0.14335,0.9542 0.21875,1.4375 0.0204,0.18054 1.15785,0.17512 2.40625,0.0625 0.11516,0.85518 0.31447,1.68147 0.46875,2.53125 1.28252,2.69171 1.26386,3.83997 6.6875,2.0625 1.0564,-0.34621 1.10732,-1.92328 1.5625,-2.9375 0.20479,-0.45631 0.38048,-0.90971 0.5625,-1.375 7.82665,0.53064 15.69057,0.55258 23.53125,0.65625 11.48504,0.0293 22.95316,-0.0995 34.4375,-0.1875 4.30835,-0.0644 8.62885,-0.0831 12.9375,-0.0937 3.07353,1.17491 6.3604,1.716 9.6875,1.625 1.40675,-0.0385 2.81663,-0.22339 4.21875,-0.34375 0.12127,-0.10038 0.28971,-0.19596 0.4375,-0.28125 0.64913,-0.0729 1.27294,-0.43739 2.03125,-0.96875 7.18733,0.52981 14.35677,1.26298 21.5625,1.5 5.40669,0.20199 10.78504,-0.32223 16.15625,-0.84375 2.33875,-0.0882 4.27075,-0.0469 6.625,0 0.0835,1.4339 0.25406,2.87032 0.59375,4.28125 0.34113,0.54094 0.39174,1.62535 1.03125,1.625 1.88316,-10e-4 3.77266,-0.71943 5.40625,-1.65625 0.58517,-0.33559 0.51313,-1.23253 0.71875,-1.875 0.2447,-0.7646 0.44444,-1.53903 0.625,-2.3125 0.73233,-0.002 1.45518,0.004 2.1875,0 1.27321,1.9e-4 2.54734,0.0211 3.8125,-0.125 0.41781,-0.11025 -1.14469,-6.0165 -1.5625,-5.90625 -0.77448,-0.0732 -1.53855,-0.0645 -2.3125,-0.0625 -0.34441,-0.2449 -0.71938,-0.51412 -1,-0.6875 0.0239,-0.15509 0.0384,-0.31362 0.0625,-0.46875 2.138,-0.25277 1.8497,-0.49945 2.84375,0.75 -0.53739,-1.14046 -0.25525,-3.46209 -0.25,-4.5 0.51725,-4.74151 1.47647,-9.44575 1.6875,-14.21875 0.0656,-5.32425 -0.36204,-10.65333 0,-15.96875 0.41879,-2.61298 0.81247,-5.22874 1.21875,-7.84375 0.29264,-1.22845 0.60058,-2.44857 0.84375,-3.6875 0.32891,-1.67577 0.92751,-4.91895 0.71875,-6.90625 -0.0349,-0.33219 -0.0491,-0.91893 -0.34375,-0.96875 0.74733,-5.92432 1.42138,-11.85114 1.84375,-17.8125 0.30696,-5.75736 0.69331,-11.54606 0.65625,-17.3125 0.59218,10e-4 1.18906,0.0313 1.78125,0.0312 2.00054,-0.005 0.9858,-0.0242 2.96875,-0.0312 0.13676,-0.0351 0.0389,-0.7145 -0.125,-1.5625 0.0711,-0.004 0.042,0.004 0.125,0 0.42092,-0.13531 -1.48533,-6.07281 -1.90625,-5.9375 -1.75406,0.15377 -0.89481,0.0845 -2.59375,0.25 -0.22549,0.0189 -0.38984,0.0154 -0.59375,0.0312 -0.0885,-1.0593 -0.17774,-2.12977 -0.3125,-3.1875 0,-0.22017 -1.5682,-0.3125 -3.125,-0.3125 z m -58.84375,11.15625 c 0.26051,-0.002 0.52074,0.002 0.78125,0 -0.21629,0.0689 -0.42116,0.13668 -0.625,0.21875 -0.68799,-0.0661 -1.37359,-0.12973 -2.0625,-0.1875 0.63565,-0.007 1.27059,-0.0262 1.90625,-0.0312 z m 44.625,60.9375 c 0.0172,0.23917 0.0434,0.47975 0.0625,0.71875 -0.0492,0.0746 -0.10682,0.14434 -0.15625,0.21875 -0.1518,-0.11322 -0.29524,-0.22503 -0.4375,-0.3125 0.17294,-0.21092 0.35768,-0.41465 0.53125,-0.625 z"\n         style="fill:#d40000" />\n      <path\n         sodipodi:nodetypes="cccccccccsccscsccccccccccccsscscccccsccccccscccssccscccscsccscccccsccsccccccccccccccccccccccccccccccccccccccccccccccccccsccccccccccccccc"\n         inkscape:connector-curvature="0"\n         id="path3156"\n         d="m 262.21596,470.0397 c 0.0522,-0.15584 0.0632,-0.27189 0.03,-0.28652 -0.90232,-0.0467 -1.08133,-0.11497 -1.80404,0.11461 -1.10092,-0.0326 -2.20721,0.006 -3.3074,-0.0573 -1.92814,-0.0762 -3.84408,-0.0696 -5.77292,-0.0286 -1.74527,0.0362 -3.49295,-0.0332 -5.23171,0.14327 -0.19635,0.65327 -0.47504,1.04578 -0.60135,1.34665 -0.27473,0.10837 -0.46167,0.3606 -0.69154,0.54439 -0.067,0.4294 -0.2301,0.85563 -0.21047,1.28935 0.0166,0.36835 0.52496,1.06885 0.72161,1.34665 0.40069,0.56603 0.83717,1.11398 1.26283,1.66182 -0.0234,1.00774 0.36254,1.82534 0.69154,2.92252 0.28251,0.60539 0.49764,1.22947 0.84189,1.80509 0.38352,0.64128 1.23743,1.89513 2.25504,2.80791 -0.10478,0.48326 -0.0329,0.96185 0.30068,1.37531 0.28616,0.35469 0.70554,0.64692 1.17262,0.77361 0.39682,1.05082 0.80953,2.08168 1.23276,3.12308 -0.0632,0.57086 0.0727,1.0992 0.60135,1.40396 0.61754,1.31476 1.2262,2.652 1.80403,3.98265 -0.13804,0.19112 -0.2778,0.39631 -0.39087,0.60169 -0.70795,1.28589 -0.26146,2.19525 1.62363,2.32083 1.1962,2.75763 2.41655,5.49197 3.87868,8.13722 0.15468,0.29289 0.34808,0.5728 0.51115,0.85956 -0.33862,0.58204 -0.5621,1.14184 -0.54122,1.60452 0.08,1.76854 1.50589,1.96443 2.9466,1.66183 0.26557,0.25337 0.54067,0.48996 0.84188,0.7163 0.34579,0.087 0.6997,0.31453 1.05236,0.25787 1.70412,-0.27392 1.81216,-0.78533 2.85639,-1.83374 0.45721,-0.45904 0.91775,-0.89509 1.3831,-1.34665 2.06126,-2.00022 1.56983,-1.55052 3.84861,-3.69613 2.27621,-2.52837 4.85725,-4.7935 7.27628,-7.19169 1.95532,-1.93847 3.73636,-4.01409 5.68272,-5.95965 1.65573,-1.77256 3.02887,-3.76371 5.02123,-5.2147 1.15773,-1.04325 2.50182,-1.86739 3.69828,-2.86521 0.97038,-0.93831 0.51421,-0.51104 1.44323,-1.2607 0.14485,-0.16336 0.40759,-0.50847 0.69155,-0.80226 0.0561,0.0508 0.12502,0.092 0.15033,0.14326 0.1314,0.26588 0.22073,0.55635 0.33074,0.83091 1.26823,3.97292 2.52881,7.9595 3.93882,11.89065 1.34057,2.58601 2.10708,5.4631 3.72834,7.908 0.91941,1.14494 2.31676,2.66911 3.93882,2.89387 0.59974,0.0831 1.22806,0.003 1.8341,0 0.4478,-0.24995 0.96156,-0.4203 1.35303,-0.74496 0.37041,-0.30717 2.6296,-3.00602 2.82632,-3.23769 1.76984,-2.08431 3.55631,-4.14862 5.38205,-6.18887 2.65058,-3.00033 5.67028,-5.65976 8.71951,-8.28048 1.26869,-1.10701 1.26299,-1.09944 1.23276,-1.06013 0.0323,-0.002 0.26447,-0.14073 1.20269,-0.85956 0.27402,-0.20995 1.51089,-1.31662 1.95438,-1.48991 0.76627,-0.29944 0.60197,-0.004 0.57127,0.34382 0.19731,0.24104 0.42871,0.4873 0.60135,0.74496 1.07034,1.59736 1.84028,3.36993 2.82632,5.01413 0.55903,0.93217 2.00403,3.12498 2.58579,4.0113 0.60595,0.96212 1.31144,1.85199 2.07464,2.6933 0.20877,0.8638 0.62649,1.63884 1.68377,1.66183 0.2973,0.26192 0.58932,0.52618 0.90202,0.77361 1.34844,1.06694 2.82606,1.95582 4.20942,2.97982 1.2256,0.89653 2.42016,1.78354 4.11922,1.48992 1.60993,-0.27823 3.91572,-2.82623 4.90097,-3.83939 4.07866,-4.63581 7.80654,-9.52164 11.5759,-14.38339 0.87502,-0.74542 1.50472,-1.74105 2.37532,-2.49274 0.3372,-0.29114 0.71411,-0.54161 1.14255,-0.68765 0.0607,-0.0207 0.211,0.003 0.18041,0.0573 -0.0467,0.0827 -0.17872,0.0519 -0.27061,0.0859 0.9801,1.76057 1.77996,3.66692 2.46552,5.55852 1.42084,3.4965 3.1074,7.00301 5.41211,10.05691 1.06961,1.47221 2.55669,2.60009 4.6003,2.17757 1.03978,-0.21497 3.18066,-1.65462 3.93881,-2.12026 5.76985,-4.09502 10.31017,-9.48977 15.09378,-14.5553 1.17388,-1.09991 1.83959,-2.58394 2.82632,-3.81074 0.42359,-0.52664 1.0194,-1.01001 1.50337,-1.48991 1.07413,-0.68176 2.11414,-1.43067 3.06686,-2.26352 0.0374,-0.0422 -0.1995,-0.27005 -0.48108,-0.51574 0.64116,9.1e-4 1.28315,-6.5e-4 1.92431,0 0.15615,-0.0382 -0.41514,-2.1585 -0.57128,-2.12026 -1.80179,0.003 -3.61032,-0.004 -5.41211,0 -2.43592,0.005 -4.87049,0.0164 -7.30635,0 -3.65722,-0.0197 -7.31738,-0.007 -10.97456,-0.0286 -3.4409,0.002 -6.87264,-1.8e-4 -10.31308,0.0573 -2.34216,0.0131 -4.69392,-0.0114 -7.03574,-0.0573 -4.77024,-0.0775 -9.54126,-0.0642 -14.31203,-0.0286 -4.28785,0.0376 -8.55163,0.0843 -12.83873,-0.0286 -5.24572,-0.0952 -10.50901,-0.17213 -15.75526,-0.0286 -8.15322,0.16458 -16.32032,0.4709 -24.47477,0.22922 -3.08991,-0.17998 -3.21047,-0.1397 -6.13373,-0.48709 -0.3037,-0.0361 -0.59983,-0.10035 -0.90202,-0.14326 -0.12816,-0.16447 -0.24496,-0.34697 -0.33074,-0.51574 -0.26559,0.11131 -0.52287,0.25108 -0.78175,0.37248 -1.65387,-0.26169 -3.31045,-0.58031 -4.99117,-0.68765 -0.60618,-0.0387 -1.22658,0.005 -1.8341,0 -11.58719,-0.6385 -16.82087,-0.22228 -27.57165,-0.0862 z m 84.459,3.55287 c 0.45204,0.007 0.90107,0.0224 1.35303,0.0286 -0.1621,0.008 -0.31907,0.0188 -0.48108,0.0286 -0.28859,-0.0289 -0.58162,-0.0438 -0.87195,-0.0573 z m 54.39172,0 c 0.65134,-0.004 1.30278,0.003 1.95438,0 -0.0398,0.0107 -0.0803,0.018 -0.12027,0.0286 -0.59249,0.004 -1.18243,0.0709 -1.77397,0.11461 -0.016,-0.0464 -0.0404,-0.0982 -0.0601,-0.14326 z m -92.06603,0.51574 c 0.47094,0.0118 0.94221,0.0206 1.41317,0.0286 -0.15882,0.0118 -0.32319,0.0387 -0.48108,0.0573 -0.10066,2.2e-4 -0.20006,3e-5 -0.30067,0 -0.0799,0.003 -0.16067,-0.003 -0.24054,0 -0.12974,-0.0304 -0.26077,-0.0568 -0.39088,-0.0859 z m 66.0879,5.18604 c 0.0705,-0.002 0.13993,0.002 0.21047,0 -0.006,0.0865 -0.0256,0.17133 -0.03,0.25787 -0.0451,-0.0663 -0.0656,-0.13879 -0.12027,-0.20057 -0.0178,-0.0201 -0.0412,-0.0382 -0.0601,-0.0573 z m -77.06246,0.51574 c 9.3e-4,0.009 -9.3e-4,0.0192 0,0.0286 -0.0507,-0.002 -0.0997,3e-4 -0.15033,0 0.0325,-0.0193 0.092,-0.0286 0.15033,-0.0286 z m 38.99727,1.74778 c 0.0458,0.0159 0.1502,0.13084 0.24054,0.20056 -0.0246,0.005 -0.0345,0.0241 -0.0601,0.0286 -0.095,0.0168 -0.27114,-0.26066 -0.18041,-0.22922 z m 47.26578,14.66991 c 0.3151,0.069 0.63825,0.1112 0.96215,0.11461 -0.27483,0.0933 -0.52842,0.12403 -0.69155,0.0573 -0.0967,-0.0396 -0.18247,-0.11004 -0.2706,-0.17191 z m -73.78512,5.84504 c -0.0275,0.0736 -0.0914,0.11106 -0.18041,0.11461 0.059,-0.0355 0.12454,-0.0714 0.18041,-0.11461 z m -44.71006,6.33213 c 0.0821,0.0346 0.17947,0.0447 0.24054,0.0859 -0.0471,0.0701 -0.10329,0.15917 -0.15033,0.22922 -0.097,-0.0526 -0.18012,-0.11224 -0.27061,-0.17192 0.0614,-0.0459 0.11955,-0.0962 0.1804,-0.14326 z"\n         style="fill:#ffffff" />\n      <path\n         inkscape:connector-curvature="0"\n         id="path3172"\n         d="m 386.14881,533.60119 c -0.49569,0.0218 -0.88769,0.35977 -1.34375,0.6875 -3.01,2.73868 -5.85389,5.64544 -8.53125,8.71875 -4.03642,4.06838 -7.75318,8.39927 -11.09375,13.0625 -3.15696,3.87709 -6.41726,7.75356 -8.5,12.34375 -0.22188,0.46268 -0.43655,0.79703 -0.5625,1.0625 -0.19178,-0.34972 -0.38296,-0.71576 -0.625,-1.03125 -1.47779,-1.30825 -3.28949,-2.19037 -4.59375,-3.71875 -0.0768,-0.1048 -1.64735,-2.25735 -1.71875,-2.375 -1.06023,-1.74659 -1.7215,-3.7307 -2.96875,-5.375 -1.64522,-2.11688 -3.34567,-4.19544 -4.0625,-6.84375 -1.46432,-3.77689 -2.4166,-7.91213 -5.03125,-11.09375 -0.67907,-0.1349 -1.33957,-0.43645 -2.03125,-0.40625 -1.30378,0.057 -2.68707,3.01935 -3.25,4 -0.23954,0.35658 -1.10493,1.64865 -1.28125,1.96875 -0.72421,1.31471 -1.15971,2.80935 -2.09375,4 -1.62184,1.81503 -3.08709,3.69227 -3.96875,6 -1.67134,2.94244 -3.64364,5.66721 -5.625,8.40625 -1.88094,2.94779 -3.66883,5.94294 -5,9.1875 -0.09,-0.35756 -0.18371,-0.68978 -0.3125,-0.84375 -0.55971,-1.94511 -0.0367,0.1116 -0.5,-2.375 -0.36211,-1.94344 -1.1454,-3.78134 -1.53125,-5.71875 -1.14456,-3.40825 -2.62266,-6.70672 -3.0625,-10.3125 -0.88996,-4.19168 -1.64029,-8.44434 -3.0625,-12.5 -0.36672,-0.71302 -1.0493,-2.44997 -1.96875,-2.8125 -2.24941,-0.88691 -3.05788,1.09978 -3.96875,2.5625 -0.5657,1.16653 -1.31162,2.22653 -1.90625,3.375 -0.62281,1.20291 -1.08419,2.48795 -1.71875,3.6875 -0.3353,0.60705 -1.0529,1.8475 -1.3125,2.46875 -0.52796,1.26345 -0.74261,2.66823 -1.40625,3.875 -0.30316,0.5562 -0.50532,1.13351 -0.8125,1.6875 -0.87862,1.58457 -2.11856,2.98786 -3.0625,4.53125 -2.10927,3.06801 -3.27481,6.45518 -4.25,10.03125 -0.14974,0.59751 -0.28763,1.22374 -0.46875,1.8125 -0.12152,0.39502 -0.2864,0.77139 -0.4375,1.15625 -0.0464,-0.12953 -0.10427,-0.24823 -0.15625,-0.375 -0.41021,-0.87971 -0.72091,-1.81994 -1.15625,-2.6875 -0.92428,-1.84194 -2.33739,-3.40806 -3.5,-5.09375 -1.85669,-3.02141 -3.49499,-6.19974 -4.71875,-9.53125 -1.33473,-3.44302 -2.43769,-6.9533 -3.09375,-10.59375 -0.92945,-2.37476 -1.91968,-3.40826 -4.40625,-1.9375 -1.54685,1.47189 -2.21538,2.96773 -3.28125,4.8125 -1.1623,2.01164 -2.44636,3.94822 -3.59375,5.96875 -3.49162,5.55059 -6.77077,11.22955 -10.40625,16.6875 -0.0136,0.0252 0.061,0.084 0.15625,0.15625 -0.0303,0.0455 -0.0502,0.11745 -0.25,0.40625 -0.18543,0.26798 -0.31113,0.36971 -0.46875,0.65625 -0.0983,0.17877 -0.1607,0.37905 -0.25,0.5625 -0.14523,0.28972 -0.18993,0.63951 -0.3125,0.9375 -0.004,0.009 -0.0211,-7.8e-4 -0.0312,0 -0.0288,0.0506 -0.0603,0.0773 -0.0937,0.125 -0.0329,0.0471 -0.061,0.10905 -0.0937,0.15625 -0.14866,0.21479 -0.18498,0.28886 -0.25,0.4375 -0.0385,0.0625 -0.0865,0.12391 -0.125,0.1875 -0.0715,0.11807 -0.20395,0.2764 -0.15625,0.3125 -0.0144,0.0296 -0.0168,0.0641 -0.0312,0.0937 -0.213,0.57542 -0.57968,1.0275 -0.0937,1.65625 0.12337,0.15963 0.35842,0.20843 0.53125,0.3125 0.43473,0.0773 0.855,0.0359 1.28125,0 0.10716,0.0375 0.23268,0.0708 0.34375,0.0937 0.0911,0.0185 0.18845,0.0253 0.28125,0.0312 0.11654,0.007 0.22738,0.0219 0.34375,0.0312 0.0468,0.0675 0.12239,0.11695 0.21875,0.21875 0.02,0.003 0.0421,-0.002 0.0625,0 0.0439,0.084 0.18705,0.0208 0.28125,0.0312 0.50737,0.0563 1.02144,0.0778 1.53125,0.0937 0.54771,0.0146 1.10848,0.0245 1.65625,0.0312 0.0409,0.0887 0.10022,0.16261 0.125,0.15625 5.53174,0.18593 11.05949,0.18625 16.59375,0.15625 2.73606,-0.0238 5.48266,-0.0174 8.21875,-0.0312 2.00951,-0.0101 3.97773,-0.13519 5.96875,0.15625 4.00601,0.87889 7.99041,1.54905 12.09375,1.65625 4.07189,-0.0494 8.14921,-0.44105 12.21875,-0.5625 2.79702,-0.0757 5.57852,0.002 8.375,0.0625 2.93109,0.0658 5.88101,0.0483 8.8125,0.0312 2.71614,-0.0197 5.40881,-0.0332 8.125,-0.0312 2.8403,0.004 5.69094,0.0303 8.53125,0.0312 3.05598,0 6.10027,7.6e-4 9.15625,0 2.66165,-4.4e-4 5.33835,-3.7e-4 8,0 3.05252,4.3e-4 6.10373,1.3e-4 9.15625,0 2.66135,-1.4e-4 5.3074,-2e-5 7.96875,0 3.0532,4e-5 6.10305,0 9.15625,0 l 8.59375,0 7.96875,0 2.875,0 c 0.16209,0.0416 0.75584,-2.2709 0.59375,-2.3125 l -2.875,0 -2.5,0 c -0.0134,-0.0169 -0.0436,-0.0146 -0.0625,-0.0312 -0.006,0.0165 -0.025,0.0142 -0.0312,0.0312 -0.0979,-0.0889 -0.17926,-0.1981 -0.28125,-0.28125 0.008,-0.0115 0.023,-0.0199 0.0312,-0.0312 -0.0824,-0.0905 -0.15953,-0.17106 -0.25,-0.25 0.44111,-0.2213 0.84313,-0.43568 0.8125,-0.5 -0.65628,-1.08379 -1.13019,-2.22369 -1.65625,-3.375 -0.35914,-0.93111 -0.89729,-1.79303 -1.25,-2.71875 -0.40141,-1.05352 -0.61519,-2.16603 -1.1875,-3.15625 -0.47196,-1.33147 -0.38771,-1.30437 -1.09375,-2.5 -0.82964,-1.40494 -1.82005,-2.61795 -2.03125,-4.3125 -0.45125,-3.11736 -0.87675,-6.31784 -2.0625,-9.25 -0.0982,-0.50952 -0.21855,-1.02593 -0.40625,-1.4375 -0.0927,-0.20322 -0.27906,-0.34765 -0.40625,-0.53125 -0.0208,9.2e-4 -0.0415,-3.3e-4 -0.0625,0 -1.18907,-2.6663 -2.25971,-5.40944 -2.9375,-8.25 -0.12051,-0.73244 -0.75748,-4.92636 -1.375,-5.34375 -0.43422,-0.2935 -0.76508,-0.38811 -1.0625,-0.375 z m 14.96875,42 c 0.0309,0.0339 0.0641,0.0579 0.0937,0.0937 0.0438,0.0531 0.12592,0.13347 0.1875,0.1875 0.48066,-1.31463 0.18393,-0.92057 -0.28125,-0.28125 z m -17.21875,-31.03125 c 0.003,0.0331 -0.004,0.0903 0,0.125 -0.0105,-10e-4 -0.0207,8.3e-4 -0.0312,0 0.009,-0.0421 0.0226,-0.0828 0.0312,-0.125 z m 3,9.34375 c 0.004,0.009 -0.004,0.0218 0,0.0312 0.005,0.022 0.0259,0.0405 0.0312,0.0625 -0.1565,0.0998 -0.31498,0.20871 -0.46875,0.3125 0.13032,-0.13425 0.31463,-0.2784 0.4375,-0.40625 z m -50.125,0.53125 c 0.004,0.0124 0.0276,0.0189 0.0312,0.0312 -0.0288,0.0335 -0.0651,0.0601 -0.0937,0.0937 0.0236,-0.0399 0.0388,-0.0851 0.0625,-0.125 z m 12.625,12.09375 c 0.0825,0.0851 0.16466,0.16837 0.25,0.25 -0.0442,-0.0204 -0.0812,-0.0412 -0.125,-0.0625 -0.0208,-0.01 -0.0414,-0.0224 -0.0625,-0.0312 -0.0252,-0.0502 -0.0374,-0.10598 -0.0625,-0.15625 z m -38.03125,5.90625 c 0.0971,0.009 0.11471,0.0692 0.1875,0.21875 -0.10551,-0.11564 -0.15752,-0.17959 -0.1875,-0.21875 z m 2.8125,0.9375 c 0.0421,0.007 0.0876,0.0153 0.125,0.0312 -0.0251,0.028 -0.0387,0.0646 -0.0625,0.0937 -0.0167,-0.0402 -0.0468,-0.0794 -0.0625,-0.125 z m -0.46875,2.21875 c 0.13986,0.0806 0.28584,0.15347 0.4375,0.21875 -0.19804,-0.005 -0.39571,0.004 -0.59375,0 0.0638,-0.0659 0.11468,-0.14284 0.15625,-0.21875 z m -22.40625,0.0625 c 0.0287,0.0335 0.0633,0.0601 0.0937,0.0937 -0.16643,-0.0245 -0.33367,-0.0364 -0.5,-0.0625 0.16307,-6.1e-4 0.28333,-0.0244 0.40625,-0.0312 z m 92.65625,0.0625 c 1.12422,-0.008 2.25078,0.004 3.375,0 0.72348,0.0235 1.43194,0.0369 2.15625,0.0312 0.0871,0.0533 0.1812,0.11302 0.28125,0.125 0.27872,0.0334 0.53157,-2.7e-4 0.75,-0.0625 0.01,0.0314 0.0209,0.0625 0.0312,0.0937 l -4.3125,0 c -2.66083,0 -5.33918,6e-5 -8,0 -0.36478,-10e-6 -0.72897,0 -1.09375,0 0.71069,-0.0526 1.41483,-0.0978 2.125,-0.15625 1.56145,-0.008 3.12604,-0.0198 4.6875,-0.0312 z m -88.34375,0.46875 c 0.5967,-0.0356 1.18406,0.0156 1.78125,0.0312 0.86721,0.0262 1.72637,0.003 2.59375,0 -0.67712,0.0302 -1.3536,0.0741 -2.03125,0.0937 -0.79216,-0.011 -1.56839,-0.0773 -2.34375,-0.125 z"\n         style="fill:#ffffff" />\n    </g>\n    <path\n       style="fill:#803300"\n       d="m 119.01454,880.13129 c -6.28698,0.29976 -12.54075,0.80621 -18.69858,2.21692 -9.814553,2.16198 -19.663139,4.49503 -29.018741,8.22555 -0.548955,0.31548 3.900177,8.08235 4.449132,7.76687 0.586178,0.04 1.171342,0.14951 1.758248,0.12231 4.910745,-0.22759 9.774587,-1.34398 14.585814,-2.23221 0.243016,-0.0449 0.186889,-0.0348 0.412806,-0.0765 0.261246,0.54508 0.541201,0.96887 0.840901,1.28429 0.0085,0.25997 0.05656,0.54791 0.152892,0.88677 0.108413,0.38134 0.654966,0.10035 1.131394,-0.0917 0.525564,0.15109 1.087572,0.14165 1.697092,0.10703 -0.346914,0.0968 -3.893303,1.06769 -4.525578,1.78882 -1.341773,1.53037 0.114416,2.4389 1.635935,2.85907 1.01938,0.2815 2.123059,0.0606 3.180136,0.0917 3.916249,-0.28764 7.897929,-0.30859 11.787909,-0.90206 1.69517,-0.25861 2.53245,-0.58244 4.11277,-1.07023 0.16269,-0.0852 -1.04515,-2.37855 -1.20784,-2.29337 -3.14501,0.79707 -6.36806,1.0476 -9.60156,1.25371 3.81603,-0.92281 7.61667,-1.86 11.43625,-2.76733 1.44372,-0.17539 2.87661,-0.3877 4.31153,-0.67272 2.34397,-0.4656 1.73087,-0.28219 3.39419,-1.00909 -0.24026,-0.33923 -0.43759,-0.73584 -0.64215,-1.1161 0.88028,-0.15141 1.76121,-0.32708 2.62973,-0.53512 1.24428,-0.29804 5.26212,-1.01528 2.99667,-3.54707 -0.47217,-0.52768 -1.36436,-0.3687 -2.04874,-0.55041 -0.3822,-0.008 -0.76632,-0.008 -1.14669,0 -0.51079,-2.84744 -2.99886,-9.94543 -3.62352,-9.73917 z"\n       id="path3245"\n       inkscape:connector-curvature="0" />\n  </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="movie">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M42.3523 17.9045c-22.0242,0 -39.8519,17.8596 -39.8519,39.8543 0,22.0159 17.8277,39.8495 39.8519,39.8495 22.0206,0 39.8483,-17.8336 39.8483,-39.8495 0,-21.9947 -17.8277,-39.8543 -39.8483,-39.8543zm1.06891 63.7588l0 0c-12.9225,0 -23.3836,-10.4587 -23.3836,-23.3588 0,-12.9249 10.4611,-23.4155 23.3836,-23.4155 12.9284,0 23.3907,10.4906 23.3907,23.4155 0,12.9001 -10.4623,23.3588 -23.3907,23.3588z"/>\n  <path class="fil0" d="M56.1229 58.3044c0,7.01935 -5.70713,12.7548 -12.7466,12.7548 -7.05714,0 -12.7584,-5.73548 -12.7584,-12.7548 0,-7.07368 5.70123,-12.7513 12.7584,-12.7513 7.03943,0 12.7466,5.6776 12.7466,12.7513z"/>\n  <path class="fil0" d="M121.509 17.9045c-22.0183,0 -39.8519,17.8596 -39.8519,39.8543 0,22.0159 17.8336,39.8495 39.8519,39.8495 22.01,0 39.8531,-17.8336 39.8531,-39.8495 0,-21.9947 -17.8431,-39.8543 -39.8531,-39.8543zm1.06772 63.7588l0 0c-12.9308,0 -23.3836,-10.4587 -23.3836,-23.3588 0,-12.9249 10.4528,-23.4155 23.3836,-23.4155 12.9296,0 23.3813,10.4906 23.3813,23.4155 0,12.9001 -10.4517,23.3588 -23.3813,23.3588z"/>\n  <path class="fil0" d="M135.28 58.3044c0,7.01935 -5.70123,12.7548 -12.7584,12.7548 -7.04415,0 -12.7466,-5.73548 -12.7466,-12.7548 0,-7.07368 5.70241,-12.7513 12.7466,-12.7513 7.05714,0 12.7584,5.6776 12.7584,12.7513z"/>\n  <polygon class="fil0" points="30.6711,179.981 28.0053,129.495 28.0053,95.4929 98.6618,95.4929 142.78,95.4929 142.257,101.871 160.306,101.871 190.077,82.2136 197.502,82.2136 197.502,182.093 161.906,166.7 139.591,166.151 139.591,178.904 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="note">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n    .fil1 {fill:#FEFEFE;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M42.8684 88.6082c4.86146,0 7.29336,0.738195 7.29336,2.21104 0,3.03428 -1.79765,4.8024 -5.35044,5.39296l-1.45867 0 -1.92876 -7.15872c0.30827,-0.268112 0.809061,-0.445279 1.4445,-0.445279z"/>\n  <path class="fil0" d="M17.0978 43.8712c0,-0.614178 -0.650793,-0.762998 -1.94647,-0.46772 -1.28387,0.322443 -1.93112,0.793707 -1.93112,1.47285 1.28151,7.57211 6.79375,11.3469 16.5167,11.3469l1.94765 6.98273c-3.89058,2.29844 -5.8217,4.74571 -5.8217,7.39612 0.64843,0.324806 1.20946,0.679139 1.6949,0.975598 0.485437,0.35079 0.884653,0.676777 1.20828,0.970874 0,-2.12128 1.29804,-4.06657 3.90476,-5.89375l1.96065 7.63234c-7.1599,0 -11.0375,-2.62325 -11.6989,-7.72211 0,-0.970874 -0.0897645,-1.85553 -0.237403,-2.6516 -0.161812,-0.825597 -0.411027,-1.5319 -0.735833,-2.20868 -0.309451,-1.56379 -0.473626,-2.86065 -0.473626,-3.83389 0,-0.973236 0,-1.62167 0,-1.91458 -0.660241,-0.324806 -1.22009,-0.647249 -1.70789,-0.942527 -0.486618,-0.355515 -1.05946,-0.676777 -1.69371,-1.02993 0,0.353152 -0.103938,1.32521 -0.26575,2.9138 -0.147639,1.59332 -0.0732289,3.39215 0.26575,5.30673 0,0.676777 0.294097,1.44214 0.969693,2.41892 0.636619,0.970874 0.974417,1.94175 0.974417,2.9138 1.29686,7.04651 6.48312,10.6111 15.5446,10.6111l1.94529 7.69022c-3.88704,2.2701 -5.83351,4.53783 -5.83351,6.77722 0.647249,0.325987 1.20828,0.617721 1.70907,0.973236 0.471264,0.29764 0.897645,0.617721 1.23781,0.943708 0,-1.68072 1.26733,-3.38979 3.87523,-5.07051l1.93112 6.75005c-6.48548,0 -10.1965,-2.50632 -11.171,-7.54494 0,-0.294097 -0.175986,-0.99922 -0.500791,-2.09175 -0.323625,-1.12206 -0.64843,-1.97482 -0.972055,-2.59254 -0.322443,-1.6193 -0.471264,-2.91616 -0.471264,-4.03586 0,-1.06418 0,-1.77049 0,-2.12482 -0.663785,-0.294097 -1.22363,-0.588194 -1.72324,-0.91418 -0.487799,-0.292916 -1.04765,-0.646068 -1.68072,-0.941346 0,0.676777 0,1.85553 0,3.652 0,1.76812 0.147639,3.65672 0.472445,5.57367 0.322443,0.676777 0.646068,1.41497 0.986228,2.20868 0.294097,0.79725 0.485437,1.67836 0.485437,2.65278 1.26733,7.4847 6.46895,11.2005 15.5611,11.2005l1.92876 6.83391c-3.88822,2.2701 -5.83469,4.68665 -5.83469,7.28037 0.649611,0.324806 1.22481,0.676777 1.71025,0.942527 0.471264,0.38268 1.04765,0.676777 1.69371,1.0004 0,-1.70671 1.13505,-3.38861 3.4205,-5.03862l1.92876 6.75005c-6.80675,0 -10.5213,-2.77089 -11.1851,-8.22054 0,-0.325987 -0.160631,-0.976779 -0.485437,-1.91931 -0.309451,-0.968512 -0.64843,-1.76576 -0.955519,-2.41655 -0.34016,-1.6193 -0.413389,-2.88782 -0.251577,-3.82798 0.161812,-1.00513 0.251577,-1.65356 0.251577,-1.97836 -0.68032,-0.295278 -1.22599,-0.646068 -1.71025,-0.912999 -0.487799,-0.353152 -1.063,-0.674415 -1.69371,-1.03229 0,0.357877 -0.105119,1.29922 -0.251577,2.91853 -0.162993,1.59214 -0.0874023,3.39333 0.251577,5.30437 0.30827,0.976779 0.630714,1.85789 0.957882,2.68112 0.321262,0.798431 0.485437,1.68308 0.485437,2.65396 1.28033,7.04415 6.48312,10.578 15.5588,10.578l1.96065 7.21895c-3.90476,2.27246 -5.85123,4.68901 -5.85123,7.25203 0.649611,0.322443 1.22481,0.679139 1.71025,0.99922 0.472445,0.296459 0.884653,0.620084 1.20828,0.948433 0,-1.68072 1.28269,-3.39097 3.89058,-5.07406l1.94411 6.72171c-7.12919,0 -11.0068,-2.53467 -11.6682,-7.66187 0,-0.972055 -0.07441,-1.85553 -0.252758,-2.68112 -0.146458,-0.793707 -0.413389,-1.5319 -0.720478,-2.18151 -0.325987,-1.59096 -0.413389,-2.9764 -0.236222,-4.06539 0.147639,-1.17875 0.236222,-1.88624 0.236222,-2.18269 -0.635438,-0.323625 -1.22599,-0.558666 -1.69371,-0.706305 -0.487799,-0.147639 -1.06182,-0.440555 -1.7256,-0.737014 -0.295278,0.296459 -0.559847,1.02993 -0.721659,2.20868 -0.162993,1.09489 -0.0885834,3.15475 0.249215,6.07328 0,0.353152 0.325987,0.973236 0.987409,1.94529 0.618903,1.00158 0.957882,1.94175 0.957882,2.94805 1.31103,7.80833 6.6473,11.6965 16.0478,11.6965l1.9571 6.86935c-4.22602,1.94057 -6.31895,4.21303 -6.31895,6.80438 0.618903,0.327168 1.2071,0.679139 1.67954,1.00158 0.487799,0.355515 0.898826,0.617721 1.22245,0.94607 0,-1.53308 1.45985,-2.94687 4.37602,-4.21539l1.94647 6.77604c-7.13155,0 -11.0221,-2.59136 -11.6706,-7.71975 0,-0.294097 -0.160631,-1.03229 -0.486618,-2.21104 -0.323625,-1.09135 -0.64843,-1.976 -0.972055,-2.62207 -0.322443,-1.59096 -0.487799,-2.9764 -0.487799,-4.12562 0,-1.12206 0,-1.82718 0,-2.12128 -0.322443,-0.351971 -0.734651,-0.561028 -1.2071,-0.705124 -0.49961,-0.209057 -1.06182,-0.445279 -1.69371,-0.739376 0,0.294097 -0.105119,1.23899 -0.26575,2.82994 -0.147639,1.67954 -0.0732289,3.41696 0.26575,5.3339 0.322443,0.99922 0.631895,1.85435 0.957882,2.67994 0.30827,0.766541 0.484256,1.68072 0.484256,2.62443 1.29686,7.39494 6.66147,11.1107 16.0478,11.1107l1.92994 6.71934c-4.21421,1.94411 -6.30714,4.39137 -6.30714,7.24848 0.64843,0.323625 1.22599,0.675596 1.71025,1.00276 0.455909,0.324806 1.0441,0.618903 1.6949,0.910637 0,-1.64883 1.29568,-3.3579 3.90357,-5.03626l1.93112 6.74533c-7.14691,0 -11.0375,-2.59018 -11.654,-7.68667 0,-0.355515 -0.178348,-1.09371 -0.503154,-2.18388 -0.323625,-1.17757 -0.633076,-2.03387 -0.9567,-2.70829 -0.677958,-3.48192 -0.811424,-5.42366 -0.500791,-5.7213 -0.650793,-0.351971 -1.23781,-0.646068 -1.69726,-0.970874 -0.485437,-0.321262 -1.05946,-0.679139 -1.70789,-1.0004 -0.646068,0.679139 -0.485437,3.44648 0.500791,8.27723 0.324806,0.64843 0.620084,1.38899 0.959063,2.18388 0.322443,0.824416 0.500791,1.67836 0.500791,2.6823 1.28033,7.454 6.64612,11.1698 16.0312,11.1698l1.92994 7.77762 119.617 -32.0329 -42.7881 -162.969 -120.075 32.3282 1.94411 6.77722c-3.90357,1.5945 -5.83469,3.71578 -5.83469,6.25044 0.618903,0.35079 1.21064,0.679139 1.67954,0.99922 0.486618,0.29764 0.898826,0.591737 1.22481,0.943708 0,-1.88387 1.30985,-3.2705 3.90476,-4.24492l1.92876 6.75123c-6.80675,0 -10.682,-2.79923 -11.6682,-8.43196z"/>\n  <path class="fil0" d="M35.0861 65.8304l1.47403 0c4.84846,0 7.28037,0.970874 7.28037,2.79805 0,3.47719 -1.60749,5.30437 -4.86382,5.65871l-1.45867 0 -2.43191 -8.45676z"/>\n  <path class="fil0" d="M60.3725 155.27c4.84846,0 7.29455,0.706305 7.29455,2.03151 0,3.62365 -1.79883,5.778 -5.33508,6.45359l-1.47403 0 -1.92994 -7.95361c0.310632,-0.353152 0.796069,-0.5315 1.4445,-0.5315z"/>\n  <path class="fil1" d="M69.1092 189.187c7.47171,-1.26379 10.5391,-4.74098 9.23866,-10.5213 -0.970874,-4.47641 -5.31855,-6.06501 -13.1127,-4.83075 -0.64843,0 -1.14922,0.354333 -1.45867,0.885834l-1.92876 -6.841 1.45631 0c7.44455,-1.23308 10.5225,-4.80004 9.21031,-10.6064 -0.959063,-4.86146 -5.34925,-6.65793 -13.1139,-5.33508 -0.662604,0 -1.1504,0 -1.45749,0l-1.94647 -6.80557 1.45867 0c2.91735,-0.649611 5.25949,-2.03506 7.04297,-4.15633 1.7823,-2.09411 2.35632,-4.45161 1.71025,-7.04297 -0.973236,-4.53783 -5.35044,-6.1595 -13.1316,-4.86264l-0.970874 0 -1.94411 -6.80438 1.45867 0c2.59254,-0.296459 4.86146,-1.59332 6.80793,-3.86342 1.94411,-2.2701 2.75317,-4.39019 2.42955,-6.33548 -0.986228,-5.51107 -5.83469,-7.09966 -14.5867,-4.83193l-1.92876 -6.80911 1.45749 0c7.42565,-1.29922 10.5202,-4.89216 9.2233,-10.6973 -0.972055,-4.53665 -5.52524,-6.15832 -13.5993,-4.86146l-0.986228 0 -1.93112 -7.31108 0.957882 0c2.57837,-0.322443 4.86146,-1.58978 6.80675,-3.85987 1.94411,-2.2701 2.75435,-4.38901 2.43191,-6.33666 -0.959063,-4.53783 -5.67288,-6.12761 -14.0718,-4.86146l-1.96065 -6.80793 0.974417 0c7.11502,-1.94529 10.1954,-5.33508 9.2233,-10.1965 -0.972055,-5.1839 -5.68941,-6.77958 -14.1025,-4.86027l-0.972055 -2.94805 112.812 -30.0912 40.844 154.367 -112.809 29.6176 -0.48898 -2.39175 0.957882 0z"/>\n  <path class="fil0" d="M64.7355 178.552c0.322443,-0.325987 0.824416,-0.445279 1.47285,-0.445279 4.86146,0 7.29218,0.738195 7.29218,2.21104 0,3.2705 -1.60631,5.06933 -4.86027,5.36225l-1.47521 0 -2.42955 -7.12801z"/>\n  <path class="fil0" d="M53.0768 133.372l0.974417 0c5.18744,-0.647249 7.79652,0.0921267 7.79652,2.18151 0,3.00593 -1.80001,4.80358 -5.36579,5.36343l-1.45867 0 -1.94647 -7.54494z"/>\n  <path class="fil0" d="M48.7031 110.564c4.86264,0 7.29336,0.942527 7.29336,2.80042 0,3.44648 -1.60631,5.30201 -4.84728,5.65871l-1.94529 0 -1.96065 -7.98786c0.310632,-0.291735 0.825597,-0.471264 1.45985,-0.471264z"/>\n  <path class="fil0" d="M29.2668 43.8712l1.45867 0c4.84728,0 7.3099,0.711029 7.3099,2.00671 0,3.97798 -1.65119,6.16068 -4.87799,6.42525l-1.47285 0 -2.41774 -8.43196z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="off">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="110.358,2.49805 89.644,2.49805 89.644,113.28 110.358,113.28 "/>\n  <path class="fil0" d="M137.838 38.1322l-0.00590556 0.0153545 -8.91267 17.8194c20.9187,10.6241 35.3365,32.3589 35.3365,57.3134 0,35.3578 -28.903,64.2525 -64.2572,64.2525 -35.3495,0 -64.2466,-28.8947 -64.2466,-64.2525 0,-25.0596 14.5265,-46.8653 35.5798,-57.441l-0.152363 -0.05315 -9.04613 -17.6434c-27.429,13.9324 -46.3492,42.4267 -46.3492,75.1376 0,46.3149 37.9007,84.2192 84.2144,84.2192 46.3173,0 84.2192,-37.9042 84.2192,-84.2192 0,-32.7227 -18.9391,-61.2288 -46.3799,-75.1482z"/>\n  <polygon class="fil0" points="128.92,55.967 128.915,55.967 "/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="pen">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M153.193 13.8355l0 -2.30789 -3.07207 -2.01616 -4.32877 -2.50041c-4.2272,-2.04923 -7.78471,-3.55278 -10.6631,-4.51303l-14.1285 27.7668 -1.15276 2.02088 -5.86068 11.7261 -5.1898 9.98748 0.770085 0.388586 -0.770085 1.53663 -55.83 109.162 2.30671 1.05709 -4.90043 9.80086 1.91931 1.6323 -3.26695 6.44178 0 0 -2.20868 12.5859 -0.00708667 0.00826778 0.887015 0.887015 0.274018 -0.317719 8.83944 -9.32015c0,0.257482 -2.43663,-0.512602 0,0 0.576382,-0.830321 1.60159,-2.88427 3.07798,-6.15005l2.78624 0.479531 4.90043 -9.70874 2.68939 1.44568 55.2524 -108.301 1.43978 -2.49687 0.771266 0.383861 16.8178 -33.0558 3.64964 -6.72643 0.577564 0.387405 -15.3745 29.8798c-0.771266,1.34765 -1.02875,2.21577 -0.771266,2.59726 0,0.259845 0.35079,0.320081 1.05709,0.190159l0.480712 -0.383861 18.7419 -36.709c0.252758,-0.635438 0.188978,-1.11615 -0.194883,-1.43859 -0.706305,0 -1.21773,-0.124017 -1.53663,-0.38268l0 -0.387405 2.01734 -3.64964zm-31.0384 53.4299l0 0 -52.563 103.007c-0.0649611,0.516146 -0.257482,0.706305 -0.576382,0.576382 -0.193702,-0.38268 -4.51775,-2.59136 -12.9698,-6.63076l0 -0.285829c23.8266,-46.1212 35.6483,-69.2828 35.4582,-69.4777l9.0296 -17.1025 11.0517 -21.9073 0.387405 0 2.78506 1.63112 9.51031 4.70791c0.38268,0.0649611 0.576382,0.258663 0.576382,0.576382l-2.68939 4.90516zm4.89925 -7.30399l0 0 -0.479531 0.576382 -0.383861 -0.387405 -14.1273 -7.11029 -0.0909456 -0.188978 24.3108 -47.5657 0.38268 0c5.44374,2.37167 10.1835,4.83429 14.2194,7.39612l0.0968512 0.576382 -23.9281 46.7035z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="people-hands-up">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_231991976">\n   <path id="_231984320" class="fil0" d="M69.9041 39.8035c8.50164,0 15.3875,-6.89297 15.3875,-15.3946 0,-8.49692 -6.88588,-15.3911 -15.3875,-15.3911 -8.50282,0 -15.3934,6.89415 -15.3934,15.3911 0,8.50164 6.89061,15.3946 15.3934,15.3946z"/>\n   <path id="_231984056" class="fil0" d="M81.3337 43.2618l-22.4612 0.0118111 -38.3318 -38.3271c-3.0012,-3.15239 -7.97959,-3.2764 -11.1308,-0.27638 -3.15475,2.99884 -3.27995,7.98077 -0.275199,11.1296l40.0302 40.0928 0.00472445 132.951c0,4.78114 3.8705,8.65637 8.65755,8.65637 4.77523,0 8.65046,-3.87523 8.65046,-8.65637l0.00944889 -72.1128 6.99336 0 0.0767723 72.1128c0,4.78114 3.87168,8.65637 8.65282,8.65637 4.77523,0 8.6481,-3.87523 8.6481,-8.65637l-0.05315 -132.951 40.0291 -40.0928c2.99884,-3.14884 2.87483,-8.13077 -0.277561,-11.1296 -3.14412,-3.00002 -8.13313,-2.87601 -11.1284,0.27638l-38.0944 38.3153z"/>\n  </g>\n  <g id="_231990296">\n   <path id="_231993176" class="fil0" d="M148.224 85.4936c6.03902,0 10.9288,-4.89571 10.9288,-10.9359 0,-6.0343 -4.8898,-10.93 -10.9288,-10.93 -6.04021,0 -10.9336,4.89571 -10.9336,10.93 0,6.04021 4.89335,10.9359 10.9336,10.9359z"/>\n   <path id="_231977144" class="fil0" d="M156.341 87.9503l-15.9545 0.00590556 -27.2246 -27.2223c-2.13191,-2.23703 -5.66934,-2.32797 -7.90636,-0.194883 -2.24057,2.12954 -2.33033,5.66697 -0.196065,7.904l28.4329 28.4778 0.00236222 94.4311c0,3.39451 2.74963,6.14769 6.14887,6.14769 3.39333,0 6.14414,-2.75317 6.14414,-6.14769l0.00826778 -51.2213 4.96657 0 0.0555122 51.2213c0,3.39451 2.74963,6.14769 6.14532,6.14769 3.39097,0 6.14296,-2.75317 6.14296,-6.14769l-0.0389767 -94.4311 28.4317 -28.4778c2.12954,-2.23703 2.04214,-5.77445 -0.197246,-7.904 -2.23348,-2.13309 -5.77682,-2.04214 -7.904,0.194883l-27.0569 27.2164z"/>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="photo">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#FEFEFE;stroke-width:3.31302}\n    .fil1 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M155.461 70.4273c0,16.1387 -13.0844,29.2219 -29.2231,29.2219 -16.1387,0 -29.2242,-13.0832 -29.2242,-29.2219 0,-16.1399 13.0855,-29.2231 29.2242,-29.2231 16.1387,0 29.2231,13.0832 29.2231,29.2231z"/>\n  <path class="fil1 str0" d="M155.461 70.4273c0,16.1387 -13.0844,29.2219 -29.2231,29.2219 -16.1387,0 -29.2242,-13.0832 -29.2242,-29.2219 0,-16.1399 13.0855,-29.2231 29.2242,-29.2231 16.1387,0 29.2231,13.0832 29.2231,29.2231"/>\n  <path class="fil0" d="M146.963 32.653l-21.3025 -30.155 -22.5439 30.155 -40.4247 0 0 -16.2615 -18.6238 0 0 16.2615 0 2.3634 0 14.4852 53.7618 0c6.6532,-8.8359 17.1982,-14.5773 29.112,-14.5773 11.9127,0 22.4565,5.74138 29.1073,14.5773l20.1628 0 0 -16.8486 -29.249 0z"/>\n  <path class="fil0" d="M176.205 54.4233l-16.6537 0c2.34333,4.83783 3.69452,10.2438 3.69452,15.9816 0,20.2962 -16.4576,36.7503 -36.7538,36.7503 -20.2986,0 -36.7527,-16.4541 -36.7527,-36.7503 0,-5.73784 1.35001,-11.1438 3.69216,-15.9816l-48.435 0 0 56.5682 55.5713 0 -2.6953 0.296459c0,0 4.84728,3.09215 9.95205,6.29178l-56.2186 -0.674415 0 3.54806 59.7914 -0.641344c4.06421,2.5264 7.58392,4.66067 8.05518,4.77878l0.296459 0.0413389 0 29.8372 -0.415751 0.396854 -29.0825 35.881c-0.664966,0.820873 -5.66815,5.71658 -5.16618,6.12288l9.71228 0.0236222c1.00631,-0.0236222 1.44686,0.0708667 2.11301,-0.746463l24.3179 -29.9991 0 29.3908c0,0.979142 0.523232,1.77403 1.17048,1.77403l6.23509 0c0.643706,0 1.16694,-0.794888 1.16694,-1.77403l0 -29.8172 21.7384 30.7254c0.564571,0.798431 0.97796,0.941346 1.60395,1.03583l4.44452 0.0165356c0.322443,-0.229136 -1.22245,-3.26695 -1.79057,-4.06657l-23.523 -33.2507c0.304727,-0.668509 0.481894,-1.40552 0.481894,-2.18742l0 -33.4042 20.9895 -13.3029 -3.14412 -0.296459 25.6041 0 0 -56.5682z"/>\n  <path class="fil0" d="M26.7404 113.455c0,0 -6.37092,5.04925 -0.388586,10.7965 0,0 22.9159,3.34136 25.1683,-3.72759l-0.232679 -3.57523c0,0 -2.56301,-5.82524 -24.547,-3.49373z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="quote">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M2.50041 30.9156l194.619 0 0.38268 0 0 98.3878 -135.479 0c-1.55789,4.21893 -2.33624,8.27014 -2.33624,12.1607 0,6.12643 1.67127,11.7048 5.02209,16.7328 3.34845,5.02681 7.59219,8.65755 12.7383,10.8887 -10.4505,-0.12756 -18.9037,-1.79175 -25.3644,-4.99965 -6.4595,-3.2079 -11.2595,-7.67604 -14.3907,-13.4033 -3.13467,-5.72839 -5.12839,-12.7265 -5.98233,-20.9966l-29.2089 -0.38268 0 -98.3878zm57.8083 93.4153l132.221 0 0 -88.4428 -185.057 0 0 88.4428 28.5427 0c0,24.6297 10.0961,38.144 30.2861,40.5369 -6.78076,-5.36107 -10.167,-13.1316 -10.167,-23.3092 0,-6.69454 1.38781,-12.4383 4.17405,-17.2277z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="quote2">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M80.4715 183.292c-11.8336,-0.543311 -20.6635,-4.52366 -26.4793,-11.9363 -5.8217,-7.4162 -9.36267,-18.0001 -10.6276,-31.7518l-2.33624 0c-6.84809,0 -13.2308,-1.74214 -19.147,-5.23941 -5.92209,-3.49018 -10.6347,-8.22999 -14.1296,-14.2194 -3.50318,-5.98351 -5.25122,-12.4383 -5.25122,-19.3631l0 -45.6819c0,-6.82683 1.74214,-13.1977 5.23469,-19.1257 3.49018,-5.92091 8.1851,-10.6111 14.0895,-14.0729 5.90556,-3.46302 12.267,-5.19571 19.0927,-5.19571l118.163 0c6.81974,0 13.18,1.73269 19.0868,5.19571 5.9032,3.46184 10.5993,8.15203 14.0954,14.0729 3.49137,5.928 5.23941,12.2989 5.23941,19.1257l0 45.6819c0,6.92486 -1.74805,13.3796 -5.23941,19.3631 -3.49018,5.98942 -8.18628,10.7292 -14.0907,14.2194 -5.90556,3.49727 -12.2718,5.23941 -19.0915,5.23941l-81.518 0c-3.3957,7.01935 -5.08823,13.4127 -5.08823,19.1848 0,6.63785 2.66459,14.8076 7.99731,24.5033zm-6.04965 -3.79019c-3.66853,-7.00399 -5.49926,-14.1792 -5.49926,-21.5411 0,-7.15754 1.83072,-15.0556 5.49926,-23.6848l81.4837 0c7.13155,0 13.4871,-1.59332 19.069,-4.77878 5.5843,-3.18546 9.90126,-7.56384 12.9651,-13.1316 3.0579,-5.55949 4.5898,-11.7367 4.5898,-18.5305l0 -39.5271c0,-7.00517 -1.57088,-13.3076 -4.71145,-18.9072 -3.14176,-5.59611 -7.49297,-9.95087 -13.0548,-13.0607 -5.56067,-3.10632 -11.8418,-4.66185 -18.8458,-4.66185l-111.837 0c-6.59415,0 -12.704,1.66064 -18.332,4.97248 -5.62563,3.3142 -10.0772,7.7977 -13.3572,13.4588 -3.27995,5.66107 -4.91815,11.7273 -4.91815,18.1986l0 39.5271c0,6.57052 1.6323,12.6521 4.90161,18.2482 3.26814,5.59256 7.70321,10.0276 13.3017,13.291 5.60083,3.26932 11.6836,4.90161 18.2541,4.90161l3.14176 0c0.75473,9.14062 2.20395,16.8049 4.33468,22.9974 2.13073,6.19493 5.07878,11.0906 8.84062,14.6859 3.76184,3.59649 8.48629,6.10989 14.1745,7.54258z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="scraper">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M171.76 164.153c2.89845,3.95672 4.34885,8.14258 4.34885,12.5611 0,5.48272 -2.09884,10.3217 -6.29414,14.5064 -4.19649,4.18586 -9.04023,6.27879 -14.5336,6.27879 -6.56816,0 -12.1347,-3.04136 -16.7104,-9.12999l-111.016 -147.052c-2.44608,-3.19491 -3.66381,-6.69454 -3.66381,-10.5013 0,-7.00045 3.20554,-13.4741 9.61543,-19.4092 6.40989,-5.93627 13.2733,-8.90913 20.5998,-8.90913 6.86344,0 12.5895,2.97286 17.171,8.91976l73.7037 97.8693c0.453547,0.611816 0.685045,1.29686 0.685045,2.05513 0,2.74727 -1.37481,4.11854 -4.12208,4.11854 -1.06891,0 -1.98781,-0.458271 -2.74608,-1.37718l-72.5616 -96.3669c-3.3579,-4.42208 -7.55439,-6.63549 -12.5871,-6.63549 -5.18744,0 -9.92134,2.02324 -14.1911,6.06619 -4.27562,4.04885 -6.41107,8.66109 -6.41107,13.8485 0,3.36262 1.06536,6.48903 3.20436,9.38866l104.381 138.713c4.72799,6.25635 9.76307,9.38157 15.1076,9.38157 3.05199,0 5.6091,-1.1008 7.67132,-3.3142 2.05513,-2.21577 3.08861,-5.0776 3.08861,-8.58904 0,-4.26854 -1.6819,-8.69653 -5.03508,-13.2781l-98.6594 -130.932c-1.676,-2.13545 -3.58467,-3.20436 -5.72012,-3.20436 -4.58035,0 -6.86816,2.2134 -6.86816,6.63549 0,1.6819 0.607091,3.28585 1.82954,4.80831l65.4655 87.2097c0.453547,0.76536 0.685045,1.53072 0.685045,2.28899 0,2.44608 -1.14332,3.66381 -3.43113,3.66381 -1.22363,0 -2.21931,-0.532681 -2.97876,-1.60277l-67.5265 -89.7255c-1.83427,-2.44018 -2.74727,-5.11303 -2.74727,-8.01266 0,-3.81499 1.52363,-7.21069 4.57563,-10.1835 3.05317,-2.97286 6.48903,-4.46578 10.3064,-4.46578 4.26972,0 7.9288,1.98309 10.9843,5.94217l104.381 138.433z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="search">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.9524;stroke-linecap:round}\n    .fil2 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n    .fil1 {fill:#FEFEFE;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M164.336 14.3375c23.1569,18.5883 26.8632,52.4307 8.27841,75.5923 -18.5931,23.1557 -52.4355,26.8632 -75.5971,8.27369 -23.1545,-18.5883 -26.862,-52.4307 -8.27014,-75.59 18.586,-23.1581 52.4272,-26.8656 75.5888,-8.27605z"/>\n  <path class="fil1" d="M157.499 22.8533c18.4572,14.8123 21.41,41.783 6.59533,60.2379 -14.8088,18.4561 -41.7795,21.4088 -60.2379,6.59651 -18.4572,-14.8159 -21.4112,-41.7842 -6.59533,-60.2379 14.8147,-18.4561 41.7854,-21.4076 60.2379,-6.59651z"/>\n  <path class="fil2 str0" d="M152.808 28.6857c15.2363,12.2304 17.6718,34.4908 5.44492,49.7248"/>\n  <path class="fil0" d="M18.9037 195.526c3.86696,3.10042 9.50441,2.48033 12.6036,-1.37954l59.867 -74.5789c3.09924,-3.86224 2.47915,-9.50441 -1.37954,-12.6048 -3.86696,-3.09924 -9.50441,-2.4827 -12.6048,1.37954l-59.8658 74.5801c-3.09333,3.86105 -2.48033,9.50441 1.37954,12.6036z"/>\n  <path class="fil0" d="M89.7893 107.212c2.42837,1.95002 5.97643,1.56025 7.92526,-0.865755 1.94293,-2.426 1.55907,-5.97643 -0.869298,-7.92172 -2.42837,-1.95002 -5.97524,-1.56025 -7.92526,0.865755 -1.94293,2.42837 -1.55907,5.97288 0.869298,7.92172z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="sex">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M51.1551 147.686l0 9.79023 -10.9643 0 0 -9.79023 -10.0961 0 0 -11.2572 10.0961 0 0 -8.32093c-10.7339,-1.23899 -19.6986,-5.88075 -26.8963,-13.93 -7.19651,-8.04809 -10.7942,-17.5702 -10.7942,-28.5652 0,-11.8879 4.15515,-22.0407 12.4631,-30.4621 8.30912,-8.41896 18.3982,-12.6296 30.2683,-12.6296 11.8702,0 21.9592,4.21066 30.2683,12.6296 8.30912,8.42133 12.4643,18.5742 12.4643,30.4621 0,10.8473 -3.489,20.2572 -10.4646,28.2321 -6.97683,7.97368 -15.7584,12.704 -26.3447,14.1887l0 8.39534 10.3926 0 0 11.2572 -10.3926 0zm24.6699 -62.1489l0 0c0,-8.60912 -2.9705,-15.8611 -8.91149,-21.749 -5.94217,-5.8902 -13.1706,-8.83472 -21.6852,-8.83472 -8.46385,0 -15.6308,2.9575 -21.4974,8.87133 -5.8654,5.91383 -8.7981,13.1505 -8.7981,21.7124 0,8.46148 2.9327,15.6249 8.7981,21.4891 5.86658,5.8654 13.0336,8.7981 21.4974,8.7981 8.46503,0 15.6828,-2.9327 21.6474,-8.7981 5.9658,-5.86422 8.94928,-13.0277 8.94928,-21.4891z"/>\n  <path class="fil0" d="M164.619 74.827l16.6052 -15.9533 -9.2044 -0.835046 5.68469 -6.02249 19.7978 0 0 19.2746 -6.29296 5.93981 -1.13032 -9.45007 -14.6233 15.8127c3.56696,3.96145 6.3532,8.4792 8.35991,13.5521 2.00671,5.07524 3.00947,10.4328 3.00947,16.0749 0,12.3284 -4.34413,22.786 -13.0288,31.3727 -8.68708,8.58904 -19.1931,12.8836 -31.5156,12.8836 -12.3261,0 -22.7801,-4.29452 -31.368,-12.8836 -8.58668,-8.58786 -12.88,-19.0466 -12.88,-31.3739 0,-12.3261 4.29334,-22.7836 12.8788,-31.3727 8.58668,-8.58786 19.0395,-12.8824 31.3621,-12.8824 4.10673,0 7.97959,0.483075 11.6174,1.44686 3.63782,0.964968 7.21305,2.43663 10.728,4.41618zm9.48078 38.7287l0 0c0,-8.76267 -3.08624,-16.1989 -9.25637,-22.3136 -6.17013,-6.11225 -13.6926,-9.17133 -22.5628,-9.17133 -8.7733,0 -16.2202,3.05908 -22.3395,9.17133 -6.1217,6.11462 -9.18078,13.5509 -9.18078,22.3136 0,8.76385 3.05908,16.2509 9.18078,22.4624 6.11934,6.21383 13.5662,9.31897 22.3395,9.31897 8.91976,0 16.4529,-3.09333 22.5994,-9.28236 6.14651,-6.18666 9.21976,-13.6867 9.21976,-22.499z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="snatch">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.16696}\n    .fil0 {fill:none;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0 str0" d="M2.50041 69.988c0,0 9.79023,-6.85399 26.2396,-10.1091 0,0 12.6851,-4.80122 15.019,-5.74375 2.3327,-0.942527 2.3327,-0.942527 2.3327,-0.942527 0,0 24.703,-9.0733 33.4668,-9.67803 0,0 6.32722,-1.39253 9.83866,-2.90672 0,0 11.2808,-3.14294 16.7009,5.06579 0,0 3.42168,3.62956 9.14889,7.42683 0,0 12.7253,11.4792 15.7206,16.1718 0,0 2.31734,2.6953 5.015,4.72445 0,0 4.34885,4.34413 4.08428,9.267 0,0 0.576382,9.87291 0.19134,11.445 0,0 0.532681,5.01618 1.60986,7.06069 0,0 3.17128,10.1706 1.19883,14.9989"/>\n  <line class="fil0 str0" x1="143.067" y1="116.768" x2="197.502" y2= "145.2" />\n  <path class="fil0 str0" d="M3.36735 69.4824c0,0 13.2816,-3.82208 25.4695,18.4112 0,0 10.8084,18.4336 3.43703,25.3667 0,0 9.28236,-12.9792 20.9647,-6.47367 0,0 11.1839,9.07684 31.0668,6.72643 0,0 5.33626,1.9323 10.1292,1.5756 0,0 4.7646,0.752368 5.29492,1.42088 0,0 -10.0891,9.44889 -0.161812,16.258 0,0 3.75475,3.36499 7.05596,-0.702761 0,0 0.587012,2.79687 2.19805,4.60161"/>\n  <line class="fil0 str0" x1="108.822" y1="136.666" x2="96.3197" y2= "159.986" />\n  <path class="fil0 str0" d="M127.197 99.2653c-6.46659,-7.01698 -3.9957,-14.4131 -3.9957,-14.4131 -8.69416,0.00590556 -16.0737,-11.3611 -16.0737,-11.3611 -5.67052,3.59294 -10.1788,-0.266931 -10.1788,-0.266931"/>\n  <polyline class="fil0 str0" points="96.9492,73.2242 96.2618,87.9031 96.4354,89.0357 "/>\n  <path class="fil0 str0" d="M96.4354 89.0357c9.61307,7.78353 25.3632,12.3343 25.3632,12.3343 16.2745,6.12761 8.05164,19.5309 8.05164,19.5309 -6.96502,10.4162 -22.2226,-0.142915 -22.2226,-0.142915 -1.17402,-0.336617 -7.89809,-4.24846 -7.89809,-4.24846"/>\n  <path class="fil0 str0" d="M126.038 103.175c0,0 -0.844495,-2.32325 0.858668,-3.49018"/>\n  <path class="fil0 str0" d="M126.841 99.2736c0,0 2.52876,2.61734 7.90518,0.713391"/>\n  <path class="fil0 str0" d="M122.915 84.7176c0,0 2.93152,-0.872842 5.24768,-2.98231"/>\n  <path class="fil0 str0" d="M107.128 73.4911c0,0 -0.910637,-4.80712 0.00472445,-6.1654"/>\n  <line class="fil0 str0" x1="131.761" y1="110.507" x2="143.067" y2= "116.768" />\n  <path class="fil0 str0" d="M141.563 115.784c0,0 -0.856306,-7.02289 1.45867,-9.13117"/>\n  <path class="fil0 str0" d="M112.797 97.9023c0,0 -4.11617,-6.79494 1.0878,-10.2851 0,0 2.30553,-2.00789 4.62996,-1.13269"/>\n  <path class="fil0 str0" d="M101.655 92.4208c0,0 1.20237,-3.40042 5.55949,-3.502"/>\n  <path class="fil0 str0" d="M111.961 88.9613c0,0 -2.67994,1.7634 -9.55047,-7.01817"/>\n  <line class="fil0 str0" x1="102.411" y1="81.9432" x2="101.036" y2= "79.4085" />\n  <path class="fil0 str0" d="M96.6551 84.5121c0,0 5.2028,-3.03782 5.33154,-9.39102"/>\n  <path class="fil0 str0" d="M102.337 90.8806c0,0 -4.565,-5.98706 -4.46815,-7.23785"/>\n  <path class="fil0 str0" d="M96.1602 88.3483c0,0 -1.20001,0.770085 -4.26263,-3.77838"/>\n  <path class="fil0 str0" d="M96.3197 87.4046c0,0 -3.47011,-4.95004 -4.75161,-13.995"/>\n  <line class="fil0 str0" x1="96.8819" y1="72.9124" x2="97.2716" y2= "57.7445" />\n  <path class="fil0 str0" d="M117.745 122.434c0,0 -2.5512,0.210238 -3.44058,-4.34177 0,0 -0.168899,-6.84336 3.24215,-10.5414 0,0 2.49805,-3.2516 4.93468,-2.46144 0,0 3.61656,0.0342522 5.57957,2.45907"/>\n  <line class="fil0 str0" x1="128.061" y1="107.548" x2="128.236" y2= "107.775" />\n  <path class="fil0 str0" d="M128.236 107.775c1.91694,2.64805 2.43309,3.86932 1.49411,8.05754 0,0 -0.532681,5.04453 -5.64217,6.82919 0,0 -3.60948,1.04646 -6.34257,-0.227955"/>\n  <path class="fil0 str0" d="M103.602 113.619c0,0 -1.47521,-7.80006 5.09768,-12.1973"/>\n  <path class="fil0 str0" d="M53.7477 107.047c0,0 -1.65356,-0.257482 -6.93431,-6.46304"/>\n  <path class="fil0 str0" d="M76.4522 108.864c0,0 3.97444,4.10082 8.42133,4.67956"/>\n  <path class="fil0 str0" d="M106.624 132.065c0,0 -0.0814967,-6.58115 2.31616,-10.415"/>\n  <line class="fil0 str0" x1="108.712" y1="136.45" x2="115.004" y2= "124.577" />\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="sound">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:6.30596}\n    .fil1 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="2.49923,148.272 2.49923,60.2355 50.7689,60.2355 135.952,6.30005 135.952,193.701 53.6024,145.431 "/>\n  <path class="fil1 str0" d="M150.517 63.0477c0,0 46.5724,30.2613 1.19174,74.8423"/>\n  <path class="fil1 str0" d="M164.849 43.5417c0,0 29.053,16.3194 32.6388,53.3496 0,0 1.5886,46.9704 -32.2503,62.495"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="stamp1">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil1 {fill:#403F49}\n    .fil0 {fill:#F00}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil1" d="M21.4951 137.588c0,0 -2.40238,11.791 4.95476,18.9285 7.35714,7.13273 16.108,6.21265 17.934,5.57721 0,-0.00118111 -21.8199,-2.34451 -22.8888,-24.5057zm36.8684 36.6546c0,0 3.79491,11.4273 13.7222,13.9525 9.92961,2.52167 17.0671,-2.63034 18.3261,-4.09373 0,0 -20.0848,8.83235 -32.0483,-9.85874zm52.1071 12.3568c0,0 10.1174,6.52564 19.4352,2.26537 9.32133,-4.26145 10.7824,-10.7186 10.8461,-12.6497 0,0 -9.24338,17.4391 -30.2813,10.3843zm46.5169 -23.3222c0,0 12.0237,0.656698 18.0072,-7.66069 5.9906,-8.31739 4.06657,-14.6505 3.16538,-16.3608 0,-0.00118111 0.602367,19.734 -21.1726,24.0214zm22.6195 -103.426c0,0 1.10906,-12.1182 -7.06659,-18.4773 -8.18156,-6.35911 -14.6564,-4.64886 -16.4139,-3.80082 0,0 19.9631,0.126379 23.4805,22.2781zm-37.2676 -33.044c0,0 -2.74845,-11.8619 -12.5139,-15.3296 -9.75834,-3.47247 -17.4214,1.05119 -18.8316,2.40829 0,0 21.0474,-7.0158 31.3455,12.9214zm-51.8567 -12.7194c0,0 -10.1576,-6.71108 -19.6265,-2.51104 -9.4737,4.20358 -11.9162,12.756 -12.0072,14.7131 0,-0.00118111 10.4446,-19.5793 31.6337,-12.2021zm-46.8015 21.6498c0,0 -12.13,-1.00749 -18.4194,7.23077 -6.2847,8.22999 -4.32169,16.91 -3.4642,18.6663 0,-0.00118111 -0.24449,-22.1848 21.8836,-25.8971zm121.744 64.2643c0,36.0782 -29.353,65.4289 -65.4241,65.4289 -36.0759,-0.00118111 -65.4241,-29.3494 -65.4241,-65.4289 0,-36.0771 29.3483,-65.4253 65.4241,-65.4253 36.0712,0 65.4241,29.3483 65.4241,65.4253zm-39.6027 -61.1178c-8.18274,-3.46066 -16.8675,-5.21343 -25.8215,-5.21343 -8.95401,-0.00118111 -17.6423,1.75277 -25.8226,5.21343 -7.89927,3.34018 -14.9883,8.1225 -21.0781,14.2147 -6.0969,6.09099 -10.8804,13.1847 -14.2206,21.084 -3.45829,8.17565 -5.20988,16.8651 -5.20988,25.8191 0,8.95519 1.75159,17.6446 5.20988,25.8215 3.34136,7.89219 8.12369,14.9942 14.2206,21.0864 6.08981,6.08863 13.1788,10.8698 21.0781,14.2147 8.18038,3.46066 16.8675,5.21343 25.8226,5.21343 8.95401,0 17.6375,-1.75277 25.8215,-5.21343 7.89455,-3.34491 14.993,-8.12605 21.0828,-14.2147 6.08981,-6.09336 10.8745,-13.193 14.2147,-21.0864 3.46066,-8.17684 5.20988,-16.8663 5.20988,-25.8215 0.00118111,-8.95519 -1.74923,-17.6423 -5.20988,-25.8191 -3.34018,-7.89927 -8.12605,-14.993 -14.2147,-21.084 -6.08981,-6.09336 -13.1883,-10.8745 -21.0828,-14.2147zm-25.8215 131.337c-38.7157,0 -70.2183,-31.4967 -70.2183,-70.2195 0,-38.7133 31.5026,-70.2159 70.2183,-70.2159 38.7192,-0.00118111 70.2183,31.5038 70.2183,70.2159 0,38.7227 -31.4991,70.2195 -70.2183,70.2195zm72.5899 -72.8368c-0.0307089,-0.826778 -0.0720478,-1.64883 -0.132285,-2.46734 -0.121655,-1.75986 -0.304727,-3.50318 -0.549217,-5.24059 -0.119292,-0.826778 -0.245671,-1.64765 -0.390948,-2.46616 -0.314176,-1.76104 -0.694494,-3.5079 -1.1315,-5.23941 -0.213781,-0.826778 -0.444098,-1.64647 -0.679139,-2.46262 -0.774809,-2.63624 -1.70553,-5.2276 -2.78152,-7.77998 -3.65908,-8.6481 -8.89377,-16.4163 -15.5659,-23.0896 -6.67092,-6.66738 -14.4344,-11.908 -23.0872,-15.5623 -8.95637,-3.78901 -18.4667,-5.70713 -28.2723,-5.70713 -9.80795,0 -19.3171,1.91813 -28.2723,5.70713 -8.64928,3.65318 -16.4198,8.89495 -23.0884,15.5623 -6.66856,6.67328 -11.9068,14.4415 -15.5682,23.0896 -1.07717,2.5512 -2.00198,5.14374 -2.77679,7.77998 -0.238585,0.816148 -0.462996,1.63584 -0.676777,2.46262 -0.441736,1.73033 -0.820873,3.47955 -1.1315,5.23941 -0.14882,0.81851 -0.278742,1.63938 -0.395672,2.46616 -0.248033,1.73742 -0.431106,3.48192 -0.546855,5.24059 -0.0578745,0.817329 -0.103938,1.64056 -0.135828,2.46734 -0.0283467,0.869298 -0.04252,1.7445 -0.04252,2.61734 0,0.878747 0.0141733,1.75395 0.04252,2.62207 0.03189,0.820873 0.0779534,1.64529 0.135828,2.46498 0.115749,1.75986 0.298821,3.50436 0.546855,5.24177 0.11693,0.822054 0.246852,1.64647 0.395672,2.46616 0.310632,1.75986 0.688588,3.50908 1.1315,5.23469 0.213781,0.827959 0.438192,1.65119 0.676777,2.4638 0.774809,2.64215 1.69962,5.23114 2.77679,7.78234 3.66145,8.64574 8.8985,16.4151 15.5682,23.0907 6.66856,6.66501 14.4391,11.9068 23.0884,15.5611 8.95519,3.78546 18.4643,5.70949 28.2723,5.70949 9.80559,0 19.3159,-1.92285 28.2723,-5.70949 8.65282,-3.65436 16.4151,-8.89495 23.0872,-15.5611 6.6721,-6.67564 11.9068,-14.445 15.5659,-23.0907 1.07599,-2.55238 2.00671,-5.1402 2.78152,-7.78234 0.235041,-0.813786 0.465358,-1.63466 0.679139,-2.4638 0.437011,-1.7256 0.817329,-3.47483 1.1315,-5.23469 0.145277,-0.820873 0.270475,-1.64411 0.390948,-2.46616 0.24449,-1.7386 0.427562,-3.48192 0.549217,-5.24177 0.0602367,-0.819691 0.105119,-1.64293 0.132285,-2.46498 0.0271656,-0.868117 0.0484256,-1.74332 0.0484256,-2.62207 0,-0.872842 -0.02126,-1.74805 -0.0484256,-2.61734zm-142.972 20.647l-17.6694 0c0.726384,0.73347 1.41733,1.56261 2.05277,2.4638l16.2946 0c-0.239766,-0.813786 -0.464177,-1.63466 -0.677958,-2.4638zm-1.52718 -7.70085l-23.1864 0c0.451185,0.885834 0.951976,1.70789 1.49293,2.46616l22.0892 0c-0.14882,-0.820873 -0.278742,-1.64411 -0.395672,-2.46616zm-0.681501 -7.70793l-24.7514 0c0.0413389,0.367326 0.0909456,0.734651 0.147639,1.09607l0.0165356 0.126379c0.0484256,0.282286 0.0992134,0.558666 0.158269,0.831503l0.0838589 0.412208 24.4797 0c-0.0578745,-0.819691 -0.103938,-1.64293 -0.134647,-2.46616zm0.134647 -7.70557l-24.625 0c-0.14882,0.804337 -0.261026,1.62285 -0.324806,2.46734l24.8152 0c0.0307089,-0.826778 0.0767723,-1.64883 0.134647,-2.46734zm0.942527 -7.70793l-22.5651 0c-0.503154,0.762998 -0.961425,1.58623 -1.363,2.46734l23.5325 -0.00118111c0.11693,-0.825597 0.246852,-1.64647 0.395672,-2.46616zm1.80946 -7.70085l-16.6312 0c-0.721659,0.922448 -1.50356,1.74805 -2.32088,2.46262l18.2742 -0.00118111c0.213781,-0.825597 0.438192,-1.64529 0.677958,-2.46144zm140.09 2.46144l17.6659 0c-0.729927,-0.73347 -1.41733,-1.55789 -2.05159,-2.46144l-16.2934 0c0.235041,0.816148 0.465358,1.63584 0.679139,2.46144zm1.52245 7.70557l23.1876 0c-0.452366,-0.888196 -0.951976,-1.71261 -1.49529,-2.46498l-22.0821 -0.00118111c0.144096,0.819691 0.269293,1.64056 0.389767,2.46616zm0.681501 7.70912l24.7478 0c-0.0389767,-0.370869 -0.0862212,-0.738195 -0.144096,-1.09843l-0.0141733 -0.121655c-0.0519689,-0.28701 -0.103938,-0.564571 -0.157088,-0.836227l-0.0862212 -0.411027 -24.4774 0c0.0590556,0.817329 0.100394,1.64056 0.131103,2.46734zm-0.131103 7.70439l24.6226 0c0.146458,-0.800794 0.256301,-1.62403 0.325987,-2.46498l-24.8175 -0.00118111c-0.0271656,0.822054 -0.0720478,1.64647 -0.131103,2.46616zm-0.940165 7.70793l22.5557 0c0.506697,-0.761817 0.960244,-1.58505 1.37363,-2.46616l-23.5396 0c-0.119292,0.822054 -0.245671,1.64647 -0.389767,2.46616zm17.145 5.23469l-18.2777 0c-0.213781,0.827959 -0.444098,1.65119 -0.679139,2.4638l16.6277 0c0.724021,-0.922448 1.50474,-1.74568 2.32915,-2.4638z"/>\n  <path class="fil0" d="M100.001 34.5759c-36.0759,0 -65.4241,29.3483 -65.4241,65.4253 0,36.0782 29.3483,65.4289 65.4241,65.4289 36.0712,-0.00118111 65.4241,-29.3494 65.4241,-65.4289 0,-36.0771 -29.353,-65.4253 -65.4241,-65.4253zm66.33 65.4253c0,8.95519 -1.75041,17.6446 -5.21106,25.8215 -3.34018,7.89219 -8.12605,14.9942 -14.2147,21.0864 -6.08981,6.08863 -13.1883,10.8698 -21.0828,14.2147 -8.18274,3.46066 -16.8675,5.21343 -25.8215,5.21343 -8.95401,0 -17.6423,-1.75277 -25.8226,-5.21343 -7.89927,-3.34491 -14.9883,-8.12605 -21.0781,-14.2147 -6.0969,-6.09336 -10.8804,-13.193 -14.2206,-21.0864 -3.45829,-8.17684 -5.20988,-16.8663 -5.20988,-25.8215 0,-8.95519 1.75159,-17.6423 5.20988,-25.8191 3.34136,-7.89927 8.12369,-14.993 14.2206,-21.084 6.08981,-6.09336 13.1788,-10.8745 21.0781,-14.2147 8.18038,-3.46066 16.8675,-5.21343 25.8226,-5.21343 8.95401,-0.00118111 17.6375,1.75277 25.8215,5.21343 7.89455,3.34018 14.993,8.1225 21.0828,14.2147 6.08981,6.09099 10.8745,13.1847 14.2147,21.084 3.46066,8.17565 5.20988,16.8651 5.21106,25.8191zm-66.33 -70.2171c-38.7157,0 -70.2183,31.505 -70.2183,70.2171 0,38.7227 31.5026,70.2195 70.2183,70.2195 38.7192,0 70.2183,-31.4967 70.2183,-70.2195 0,-38.7133 -31.4991,-70.2159 -70.2183,-70.2171zm-70.3824 52.1851l-18.2742 0c-0.413389,0.355515 -0.833865,0.689769 -1.26261,0.986228l-0.0330711 0.0200789c-0.0826778,0.0673234 -0.161812,0.131103 -0.252758,0.178348 -0.04252,0.0377956 -0.08504,0.0755911 -0.129922,0.1063l0 0 -0.0153545 0.00944889c-1.39135,0.98859 -2.66223,2.32443 -3.72877,3.94019l22.5651 -0.00118111c0.310632,-1.75986 0.688588,-3.50672 1.1315,-5.23941zm-1.52718 7.70557l-23.5325 0c-0.00708667,0.00826778 -0.0118111,0.0177167 -0.0177167,0.0271656 -0.721659,1.57088 -1.2697,3.32837 -1.62167,5.21461l24.625 0c0.115749,-1.75986 0.298821,-3.50318 0.546855,-5.24177zm-0.725203 10.3265c0,-0.872842 0.0141733,-1.74805 0.04252,-2.61734l-24.8128 0c-0.0578745,0.66969 -0.0897645,1.3571 -0.09567,2.05159l0.00590556 0.141733 -0.00590556 0.235041c-0.00118111,0.953157 0.0578745,1.89568 0.158269,2.81105l24.7514 -0.00118111c-0.0295278,-0.866936 -0.0437011,-1.74214 -0.0437011,-2.62089zm0.178348 5.08705l-24.4797 0 0.0188978 0.0980323 0.137009 0.571658 0.192521 0.735833 0.114568 0.38268c0.0874023,0.295278 0.179529,0.58465 0.279923,0.876385l0.0885834 0.237403c0.118111,0.330711 0.251577,0.65906 0.376775,0.970874l0.05315 0.11693c0.150001,0.359058 0.311813,0.708667 0.479531,1.04765l0 0.00472445 0.00236222 0.00708667c0.0307089,0.06378 0.0661423,0.128741 0.0968512,0.192521l23.1864 0c-0.248033,-1.7386 -0.431106,-3.48192 -0.546855,-5.24177zm0.942527 7.70793l-22.0892 0c1.0193,1.41379 2.18151,2.59254 3.43703,3.47011l0.2126 0.151182c0.656698,0.468901 1.28741,1.01339 1.90159,1.6134l17.6694 0c-0.441736,-1.7256 -0.820873,-3.47483 -1.1315,-5.23469zm138.44 15.4796c-3.66027,8.64692 -8.89495,16.4163 -15.5671,23.0919 -6.67092,6.66501 -14.4344,11.9068 -23.0872,15.5611 -8.95637,3.78546 -18.4667,5.70949 -28.2723,5.70949 -9.80795,0 -19.3171,-1.92285 -28.2723,-5.70949 -8.64928,-3.65436 -16.4198,-8.89495 -23.0884,-15.5611 -6.66856,-6.67564 -11.9068,-14.445 -15.5682,-23.0907 -1.07717,-2.55238 -2.00198,-5.1402 -2.77679,-7.78234l-16.2934 0c1.26615,1.80474 2.32679,3.92602 3.10632,6.26344 0.207876,0.641344 0.375594,1.27796 0.518508,1.9134l-0.0330711 0.0141733c0.803156,3.77129 0.674415,7.43037 -0.367326,10.3808l-0.00944889 0.0330711c-0.0188978,0.103938 -0.0578745,0.203151 -0.0968512,0.296459 -0.0188978,0.0543311 -0.0307089,0.108662 -0.0484256,0.154726l0 0 -0.00708667 0.0177167c-0.801975,2.39411 -0.955519,5.21815 -0.349609,8.20754 0.59528,2.9953 1.95474,6.1406 4.06893,9.08393l0.0885834 0.112206 0.125198 0.19134c0.790164,1.08072 1.65356,2.07876 2.5512,2.97876l0.0968512 0.0944889c0.200789,0.199608 0.405121,0.394491 0.614178,0.582288l0.383861 0.349609 0.44646 0.38268 0.583469 0.481894 0.322443 0.242128 0.740557 0.540949 0.214962 0.139371c0.294097,0.199608 0.58465,0.387405 0.874023,0.571658l0.114568 0.0590556c0.336617,0.203151 0.666147,0.39331 1.0004,0.566934l0.00472445 0.00118111 0.01063 0.00354333c2.60908,1.36773 5.26421,2.03033 7.67014,1.99844l0.258663 -0.00826778c3.72286,-0.0342522 7.94179,1.45041 11.7922,4.20948 3.83743,2.85475 6.55281,6.47131 7.63234,10.0631l0.00944889 0.0259845c0.0460634,0.1063 0.0732289,0.203151 0.0921267,0.305908 0.02126,0.0496067 0.0484256,0.100394 0.0625989,0.152363l0 -0.00118111 0.00354333 0.0224411c0.759455,2.40356 2.29962,4.77405 4.552,6.83391 2.24529,2.05986 5.20162,3.81027 8.6481,4.93587 1.27678,0.415751 2.56065,0.714573 3.81972,0.912999l0.12756 0.0248033c0.285829,0.0437011 0.562209,0.07441 0.83977,0.111024l0.516146 0.0543311 0.589375 0.0496067 0.760636 0.0377956 0.40394 0.00708667 0.915362 0 0.259845 -0.00236222c0.348428,-0.0141733 0.696856,-0.0330711 1.03583,-0.0590556l0.131103 -0.00826778c0.389767,-0.0413389 0.768904,-0.0826778 1.14332,-0.134647l0.00590556 -0.00118111 0.00472445 -0.00236222c2.91971,-0.429925 5.45437,-1.46104 7.38077,-2.90317l0.205513 -0.157088c3.02128,-2.24411 7.37604,-3.54333 12.1784,-3.54924 0.617721,0.00354333 1.21891,0.0177167 1.81537,0.0661423l-0.0826778 -3.97444 0.0826778 4.04885c3.84334,0.402759 7.28037,1.65356 9.76071,3.56578l0.0236222 0.0177167c0.0944889,0.0543311 0.179529,0.119292 0.25512,0.185435 0.0496067,0.0283467 0.09567,0.0614178 0.137009,0.0921267l0 0 0.0129922 0.01063c2.02443,1.51182 4.66067,2.5323 7.69022,2.89018 3.02601,0.359058 6.44533,0.0484256 9.90598,-1.05119 1.2756,-0.409846 2.49333,-0.909456 3.63192,-1.48702l0.115749 -0.0578745 0.747644 -0.401578 0.450004 -0.252758 0.51024 -0.30827 0.634257 -0.406302 0.334255 -0.230317c0.257482,-0.173623 0.503154,-0.353152 0.7441,-0.533862l0.20197 -0.15945c0.285829,-0.210238 0.549217,-0.429925 0.817329,-0.657879l0.0933078 -0.0803156c0.295278,-0.248033 0.576382,-0.516146 0.849219,-0.777171l0.00118111 -0.00472445 0.00590556 -0.00708667c2.11655,-2.04805 3.57877,-4.36185 4.29688,-6.66501l0.0767723 -0.248033c1.14213,-3.58704 3.9083,-7.1788 7.80833,-9.99693 0.587012,-0.427562 1.18702,-0.820873 1.78938,-1.18111l0.02126 0.03189c3.34255,-1.93466 6.86108,-2.94687 9.98748,-2.86656l0.0389767 -0.00118111c0.109843,-0.00708667 0.211419,-0.00354333 0.310632,0.00472445 0.0566934,-0.00472445 0.109843,-0.00826778 0.164175,-0.00826778l0.00590556 0 0.0141733 0c2.51695,0.0330711 5.25358,-0.693313 7.91227,-2.19096 2.65986,-1.49056 5.23941,-3.75003 7.38431,-6.66619l0.0814967 -0.112206 0.139371 -0.186616c0.794888,-1.08426 1.47521,-2.2075 2.05632,-3.34727l0.0578745 -0.112206c0.133466,-0.251577 0.249215,-0.511421 0.368507,-0.762998l0.218506 -0.472445 0.219687 -0.546855 0.278742 -0.70158 0.128741 -0.38268c0.102757,-0.292916 0.203151,-0.582288 0.288191,-0.87166l0.0696856 -0.250396c0.0968512,-0.338979 0.186616,-0.670871 0.268112,-1.00867l0.0307089 -0.121655c0.08504,-0.381499 0.161812,-0.757093 0.224411,-1.12796l0.00236222 0 0 -0.0153545c0.501972,-2.89845 0.314176,-5.63154 -0.458271,-7.91345l-0.0885834 -0.243309c-1.18229,-3.53389 -1.07009,-8.00085 0.356696,-12.5162 0.216143,-0.638981 0.447641,-1.2567 0.706305,-1.85553l0.0354333 0.0118111c0.784258,-1.75513 1.73387,-3.35554 2.8075,-4.74334l-16.6277 0c-0.774809,2.64215 -1.70553,5.23114 -2.78034,7.78116zm-133.854 -56.5481c3.66027,-8.6481 8.89731,-16.4163 15.5671,-23.0896 6.66856,-6.66738 14.4391,-11.908 23.0884,-15.5623 8.95519,-3.78901 18.4643,-5.70713 28.2723,-5.70713 9.80559,0 19.3159,1.91813 28.2723,5.70713 8.65282,3.65318 16.4151,8.89495 23.0872,15.5623 6.6721,6.67328 11.9068,14.4415 15.5659,23.0896 1.07599,2.5512 2.00671,5.14374 2.78152,7.77998l16.2934 0c-1.26851,-1.80474 -2.32679,-3.92247 -3.10632,-6.26225 -0.203151,-0.638981 -0.376775,-1.27914 -0.519689,-1.91222l0.0342522 -0.00944889c-0.806699,-3.7772 -0.681501,-7.43746 0.364964,-10.3843l0.0118111 -0.0307089c0.0188978,-0.107481 0.0555122,-0.206695 0.0944889,-0.29764 0.0153545,-0.0555122 0.0295278,-0.111024 0.0484256,-0.15945l0 0 0.00354333 -0.0188978c0.80788,-2.39175 0.957882,-5.21697 0.357877,-8.20754 -0.598824,-2.98703 -1.95828,-6.1406 -4.07484,-9.08039l-0.0826778 -0.108662 -0.133466 -0.198427c-0.790164,-1.08072 -1.65119,-2.07639 -2.5512,-2.97876l-0.0921267 -0.0944889c-0.203151,-0.197246 -0.405121,-0.39331 -0.614178,-0.581107l-0.383861 -0.347247 -0.44646 -0.385042 -0.587012 -0.475988 -0.3189 -0.243309 -0.745281 -0.54213 -0.2126 -0.145277c-0.289372,-0.196065 -0.587012,-0.383861 -0.876385,-0.56339l-0.109843 -0.0696856c-0.337798,-0.193702 -0.666147,-0.381499 -1.0004,-0.559847l-0.00944889 -0.00354333 -0.00590556 -0.00236222c-2.60908,-1.36655 -5.26421,-2.02797 -7.67014,-1.99135l-0.256301 0c-3.72523,0.0389767 -7.94298,-1.45041 -11.7981,-4.20712 -0.54213,-0.402759 -1.05355,-0.812605 -1.54489,-1.23781l0.0236222 -0.0377956c-2.86538,-2.58427 -4.91461,-5.61619 -5.80044,-8.61739l-0.00944889 -0.03189c-0.04252,-0.102757 -0.07441,-0.203151 -0.0944889,-0.300002 -0.0200789,-0.0519689 -0.0389767,-0.103938 -0.0507878,-0.155907l-0.00590556 0 -0.00354333 -0.0188978c-0.751187,-2.40711 -2.28427,-4.78232 -4.52602,-6.85045 -2.23703,-2.07167 -5.18744,-3.82444 -8.63275,-4.96894l-0.131103 -0.0437011 -0.219687 -0.0708667c-1.27796,-0.424019 -2.56183,-0.716935 -3.81972,-0.921267l-0.125198 -0.0224411c-0.288191,-0.0366145 -0.565752,-0.0779534 -0.844495,-0.113387l-0.519689 -0.0566934 -0.588194 -0.04252 -0.75473 -0.0413389 -0.40394 -0.0129922 -0.912999 0 -0.261026 0.00826778c-0.351971,0.0141733 -0.70158,0.0366145 -1.04292,0.0602367l-0.12756 0.01063c-0.389767,0.0377956 -0.770085,0.0838589 -1.14095,0.137009l-0.00826778 0 -0.00590556 0c-2.91735,0.431106 -5.45319,1.46104 -7.3784,2.90553l-0.206695 0.155907c-2.99294,2.21813 -7.27565,3.50554 -12.0166,3.54097 -0.668509,-0.00590556 -1.32875,-0.0354333 -1.97718,-0.0944889l0 -0.0389767c-3.83861,-0.405121 -7.28155,-1.65001 -9.75953,-3.56105l-0.0271656 -0.0236222c-0.0944889,-0.0555122 -0.181891,-0.113387 -0.250396,-0.184253 -0.0484256,-0.0283467 -0.0968512,-0.0614178 -0.139371,-0.0944889l-0.00236222 0 -0.0118111 -0.00826778c-2.02324,-1.51064 -4.65949,-2.53348 -7.69494,-2.8949 -3.0201,-0.356696 -6.43824,-0.0413389 -9.8989,1.05355l-0.128741 0.0460634 -0.224411 0.0708667c-1.27796,0.407484 -2.49096,0.92481 -3.62956,1.49883l-0.11693 0.0578745c-0.252758,0.128741 -0.500791,0.266931 -0.745281,0.408665l-0.453547 0.251577 -0.503154 0.305908 -0.6378 0.413389 -0.331892 0.229136 -0.739376 0.536225 -0.205513 0.160631c-0.274018,0.217325 -0.544492,0.438192 -0.812605,0.65906l-0.0944889 0.0874023c-0.291735,0.253939 -0.571658,0.516146 -0.844495,0.781896l0 0 -0.01063 0.00472445c-2.10474,2.06222 -3.55515,4.38311 -4.26499,6.68037l-0.0779534 0.251577c-1.11261,3.54688 -3.82208,7.11029 -7.63352,9.92842 -0.543311,0.388586 -1.09961,0.751187 -1.65474,1.08426l-0.0224411 -0.03189c-3.34609,1.93702 -6.86226,2.95278 -9.98748,2.86538l-0.0354333 0c-0.108662,0.0129922 -0.2126,0.00826778 -0.315357,-0.00354333 -0.0543311,0.00354333 -0.103938,0.00944889 -0.161812,0.00944889l0 0 -0.0177167 0c-2.52167,-0.0236222 -5.25831,0.696856 -7.91581,2.18978 -2.65632,1.49293 -5.23469,3.75239 -7.38549,6.66738l-0.0791345 0.114568 -0.139371 0.185435c-0.79725,1.0819 -1.47285,2.2075 -2.05868,3.34373l-0.0590556 0.114568c-0.12756,0.257482 -0.248033,0.507878 -0.364964,0.766541l-0.214962 0.471264 -0.222049 0.544492 -0.279923 0.702761 -0.133466 0.380318c-0.101576,0.294097 -0.203151,0.58465 -0.283467,0.872842l-0.0732289 0.250396c-0.0933078,0.336617 -0.185435,0.675596 -0.268112,1.00985l-0.0259845 0.122836c-0.0826778,0.380318 -0.164175,0.751187 -0.225592,1.1256l0 0.00590556 -0.00590556 0.00590556c-0.498429,2.90317 -0.307089,5.63626 0.465358,7.91581l0.08504 0.24449c1.17993,3.53389 1.06772,8.00203 -0.36142,12.5198 -0.210238,0.6378 -0.44646,1.25434 -0.702761,1.85316l-0.0377956 -0.0118111c-0.783077,1.75631 -1.73505,3.35436 -2.80514,4.74098l16.6312 0c0.773628,-2.63624 1.69844,-5.2276 2.77679,-7.77998zm138.446 15.4808l22.0821 0c-1.01694,-1.41615 -2.18388,-2.59018 -3.43231,-3.47247l-0.216143 -0.146458c-0.65906,-0.46772 -1.28859,-1.01339 -1.90041,-1.6193l-17.6659 -0.00118111c0.437011,1.73151 0.817329,3.48074 1.13269,5.23941zm0.940165 7.70793l24.4774 0 -0.02126 -0.0980323 -0.134647 -0.572839 -0.19134 -0.73347 -0.115749 -0.383861c-0.0885834,-0.29764 -0.184253,-0.588194 -0.282286,-0.87166l-0.0874023 -0.24449c-0.11693,-0.327168 -0.246852,-0.650793 -0.377956,-0.970874l-0.0519689 -0.11693c-0.145277,-0.359058 -0.311813,-0.708667 -0.477169,-1.04646l-0.00354333 -0.00236222 -0.00472445 -0.00944889c-0.0307089,-0.0625989 -0.06378,-0.126379 -0.0921267,-0.190159l-23.1876 -0.00118111c0.24449,1.7386 0.427562,3.4831 0.550398,5.24177zm0.179529 5.08469c0,0.878747 -0.02126,1.75395 -0.0484256,2.62207l24.8175 -0.00118111c0.0555122,-0.672053 0.0885834,-1.3571 0.0885834,-2.05395l0 -0.142915 0.00472445 -0.232679c0.00354333,-0.955519 -0.0543311,-1.89214 -0.162993,-2.80868l-24.7478 0c0.0271656,0.869298 0.0484256,1.7445 0.0484256,2.61734zm-0.729927 10.3288l23.5396 0c0.00118111,-0.0118111 0.00826778,-0.0200789 0.00826778,-0.0295278 0.72284,-1.57088 1.2756,-3.32601 1.62521,-5.21225l-24.6226 0c-0.122836,1.75986 -0.305908,3.50436 -0.550398,5.24177zm-1.52245 7.70085l18.2777 0c0.406302,-0.353152 0.825597,-0.685045 1.25316,-0.979142l0.0307089 -0.0248033c0.0826778,-0.0649611 0.167718,-0.132285 0.252758,-0.178348 0.0472445,-0.0377956 0.0897645,-0.07441 0.129922,-0.101576l0 -0.00118111 0.0236222 -0.0118111c1.38781,-0.989772 2.65632,-2.32443 3.7205,-3.93783l-22.5557 0c-0.315357,1.75986 -0.695675,3.50908 -1.13269,5.23469z"/>\n  <path class="fil1" d="M69.7943 59.5174c0,0 -0.0519689,-0.583469 0.39331,-0.840952 0,0 -0.381499,-0.34016 -0.237403,-0.796069 0.359058,-0.224411 0.809061,0.0921267 0.809061,0.0921267 0.145277,-0.51024 0.698037,-0.624808 0.698037,-0.624808 -0.336617,0.887015 0.153545,1.65592 0.698037,2.00789 1.03229,0.600005 3.7831,1.61222 8.72251,-0.480712 4.28035,-1.82482 9.96268,-6.6473 13.7824,-5.31264 3.79255,1.32403 3.53979,5.88194 0.745281,6.48076 -2.8075,0.591737 -3.36735,-1.3134 -3.36735,-2.07049 0,-0.336617 0.179529,-1.05709 0.824416,-1.17875 0.48898,-0.0814967 1.05001,0.377956 1.06182,0.842133l-0.0862212 0.237403c0,0 0.88229,0.177167 1.05119,-0.377956 0.154726,-0.544492 -0.41457,-1.89332 -2.64097,-1.48938 -2.20395,0.389767 -8.36109,3.49609 -10.395,4.14334 -1.92876,0.615359 -6.47485,1.96773 -9.93551,-0.41457l0 0c-0.00944889,-0.00590556 -0.0165356,-0.00708667 -0.0342522,-0.0200789 -0.0980323,-0.0673234 -0.197246,-0.140552 -0.312995,-0.22323 -0.500791,-0.309451 -1.16221,-0.416932 -1.77639,0.0259845zm34.1719 -8.6103c0,0 -1.44686,-1.37481 -3.08034,-0.64843 0,0 -0.103938,-1.80001 -1.5697,-2.3823 -1.36891,0.526776 -1.50828,2.45553 -1.50828,2.45553 -1.6382,-0.721659 -3.13231,0.575201 -3.13231,0.575201 4.46106,1.41497 4.80949,7.12447 3.79255,8.1355 -1.0193,1.01576 -0.598824,1.77639 -0.181891,1.99608 0.4252,0.2126 1.02993,1.19056 1.02993,1.19056 0,-0.00118111 0.596461,-0.976779 1.04292,-1.19056 0.422838,-0.220868 0.830321,-0.979142 -0.185435,-1.99608 -1.03702,-1.01221 -0.688588,-6.72053 3.79255,-8.1355zm24.7514 8.6103c0,0 0.0448822,-0.583469 -0.405121,-0.840952 0,0 0.392129,-0.34016 0.243309,-0.796069 -0.353152,-0.224411 -0.814967,0.0921267 -0.814967,0.0921267 -0.131103,-0.51024 -0.695675,-0.624808 -0.695675,-0.624808 0.333073,0.887015 -0.153545,1.65592 -0.696856,2.00789 -1.02639,0.600005 -3.77483,1.61222 -8.7166,-0.480712 -4.28271,-1.82482 -9.96386,-6.6473 -13.7824,-5.31264 -3.802,1.32403 -3.54688,5.88194 -0.737014,6.48076 2.80278,0.591737 3.34845,-1.3134 3.35672,-2.07049 0,-0.336617 -0.179529,-1.05709 -0.826778,-1.17875 -0.483075,-0.0814967 -1.05119,0.377956 -1.06182,0.842133l0.0921267 0.237403c0,0 -0.890558,0.177167 -1.05828,-0.377956 -0.14882,-0.544492 0.428744,-1.89332 2.62679,-1.48938 2.2264,0.389767 8.38353,3.49609 10.4139,4.14334 1.9323,0.615359 6.47485,1.96773 9.93433,-0.41457l0.00118111 0c0.0118111,-0.00590556 0.0118111,-0.00708667 0.0153545,-0.0200789 0.107481,-0.0673234 0.210238,-0.140552 0.32953,-0.22323 0.504335,-0.309451 1.16221,-0.416932 1.7823,0.0259845z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="t-short">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M51.3205 172.289l0 -83.4184 -30.3558 18.4372 -18.8883 -26.7569 51.0441 -45.4208 25.8581 -6.9721c0,0 18.6616,18.8883 40.2487,-0.448822l31.2546 8.54298 47.4453 44.072 -18.6627 26.9837 -31.4802 -17.7651 -0.224411 82.5255 -96.2393 0.220868z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="tag">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .str0 {stroke:#2B2A29;stroke-width:4.16696}\n    .fil1 {fill:none;fill-rule:nonzero}\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <polygon class="fil0" points="116.382,54.6453 116.378,54.6453 "/>\n  <polygon class="fil1 str0" points="102.121,12.3899 138.86,2.49805 182.665,35.0011 186.904,70.3258 99.2949,197.5 13.0985,138.15 "/>\n  <path class="fil1 str0" d="M156.284 36.7361c0,4.68547 -3.79491,8.4792 -8.47802,8.4792 -4.68311,0 -8.4792,-3.79373 -8.4792,-8.4792 0,-4.68193 3.79609,-8.47802 8.4792,-8.47802 4.68311,0 8.47802,3.79609 8.47802,8.47802"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="tear">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M146.973 150.752c0,6.46777 -1.24253,12.4997 -3.71223,18.1017 -2.47797,5.61028 -5.85831,10.5521 -10.1375,14.8253 -4.28625,4.27917 -9.23629,7.65124 -14.8454,10.1209 -5.61737,2.47089 -11.6635,3.69924 -18.1312,3.69924 -6.47485,0 -12.5635,-1.22836 -18.2753,-3.69924 -5.71067,-2.4697 -10.7115,-5.84178 -14.9919,-10.1209 -4.28744,-4.27326 -7.6666,-9.21503 -10.1363,-14.8253 -2.47915,-5.60201 -3.71342,-11.6339 -3.71342,-18.1017 0,-4.37366 1.14095,-11.0741 3.42286,-20.1002 2.28073,-9.02487 5.18744,-19.0513 8.71188,-30.0746 3.51735,-11.0245 7.32525,-22.3313 11.4237,-33.9286 4.09137,-11.5902 7.89927,-22.1423 11.4237,-31.6479 3.51617,-9.50322 7.56502,-20.3376 12.1347,-32.503 4.56382,12.1655 8.6103,22.9998 12.1347,32.503 3.51735,9.50559 7.28273,20.0576 11.2784,31.6479 3.99688,11.5973 7.754,22.9041 11.2784,33.9286 3.51617,11.0233 6.42407,21.0498 8.70479,30.0746 2.28191,9.02606 3.42995,15.7265 3.42995,20.1002z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="wave">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:#2B2A29;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <path class="fil0" d="M195.933 88.685c-7.64415,11.8229 -16.3312,20.9907 -30.0652,25.2262 -12.9958,4.01814 -28.5014,3.2894 -41.6247,0.546855 -14.8501,-3.10869 -26.4616,-11.0576 -37.7212,-20.8206 -9.3485,-8.0977 -18.9864,-16.6773 -30.7621,-21.0356 -21.5033,-7.98077 -51.9146,1.05355 -53.2221,27.8943 -0.55276,11.3387 4.96421,24.0852 16.3123,28.1034 9.89535,3.50318 21.058,1.43151 26.4711,-8.18628 1.93584,-3.4394 -1.99962,-7.67959 -5.51225,-5.51107 -9.89535,6.1158 -22.9018,-0.990953 -24.1301,-12.1584 -1.28623,-11.7343 11.0517,-20.3293 21.4443,-21.0521 22.4895,-1.56025 40.8759,21.2482 58.2099,32.3117 18.5328,11.8277 40.7991,12.045 61.7651,7.9288 18.5529,-3.64137 31.8841,-15.8304 40.2972,-32.3896 0.496067,-0.972055 -0.872842,-1.77639 -1.46222,-0.857487z"/>\n </g>\n</svg>\n    </svg>\n  </div>\n    <div class="item" data-name="woman-pray">\n    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="30px" height="30px" viewBox="0 0 200 200"\n    xmlns:xlink="http://www.w3.org/1999/xlink">\n      <?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="200px" height="200px" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"\nviewBox="0 0 200 200"\n xmlns:xlink="http://www.w3.org/1999/xlink">\n <defs>\n  <style type="text/css">\n   <![CDATA[\n    .fil0 {fill:black;fill-rule:nonzero}\n   ]]>\n  </style>\n </defs>\n <g id="Layer_x0020_1">\n  <metadata id="CorelCorpID_0Corel-Layer"/>\n  <g id="_230854104">\n   <g>\n    <g>\n     <path id="_230854320" class="fil0" d="M93.5877 72.5758l22.6147 -12.7442 0 12.7194c-0.129922,2.59845 1.20237,5.17327 3.62365,6.53982 3.75239,2.11773 23.3104,13.3395 28.6786,16.3915 3.40869,1.94057 7.73864,0.729927 9.66976,-2.67994 1.92757,-3.40633 0.728746,-7.73982 -2.6823,-9.66504 -3.1453,-1.78466 -17.3801,-9.9426 -25.0762,-14.3399 -0.0200789,-7.79297 -0.0625989,-25.7541 -0.0625989,-27.0687l-0.0224411 0c-0.0921267,-2.51813 -0.759455,-5.05752 -2.08348,-7.40793 -4.43035,-7.8414 -14.3729,-10.6111 -22.212,-6.18312l-36.0712 20.3175c-8.63275,4.87209 -15.1607,13.043 -17.8832,22.7955l-13.9525 47.587 26.3175 0c0,15.43 0,65.6922 0,69.7529 0,4.9276 3.98389,8.90913 8.90558,8.90913 4.91697,0 8.90676,-3.98153 8.90676,-8.90913 0,-4.64649 0,-56.0343 0,-69.7529l25.2463 0 -13.917 -46.2618z"/>\n     <path id="_230854272" class="fil0" d="M144.151 37.9491c9.78905,0 17.7226,-7.93707 17.7226,-17.7249 0,-9.78669 -7.93353,-17.7261 -17.7226,-17.7261 -9.78551,0 -17.7214,7.93943 -17.7214,17.7261 0,9.78787 7.93589,17.7249 17.7214,17.7249z"/>\n    </g>\n   </g>\n  </g>\n </g>\n</svg>\n    </svg>\n  </div>\n  </div>\n');
/*--|/home/user/ngn-env/ngn/more/scripts/js/common/tpl.php| (with request data)--*/
Ngn.toObj('Ngn.tpls.svgUploadForm', '');
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
/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.FieldSet.js|--*/
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
 *   <a href="#" class="add">Добавить</a>
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
    addTitle: 'Добавить',
    cleanupTitle: 'Очистить поля строки',
    deleteTitle: 'Удалить строку',
    addRowNumber: false
  },

  changed: false,
  eSampleRow: null,
  buttons: [], // array of Ngn.Btn objects

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
    this.createCleanupButton(this.esRows[0]);
    this.removeTrash(this.eSampleRow);
    for (var i = 0; i < this.esRows.length; i++) {
      if (this.options.addRowNumber) this.addRowNumber(this.esRows[i]);
      this.moveStyles(this.esRows[i]);
    }
    return;
    if (this.esRows.length > 0) {
      for (var i = 1; i < this.esRows.length; i++) {
        this.removeTrash(this.esRows[i]);
        this.createDeleteButton(this.esRows[i]);
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
    return;
    var style;
    esEls = eRow.getElements(this.options.elementContainerSelector);
    for (var j = 0; j < this.options.moveElementToRowStyles.length; j++) {
      style = this.options.moveElementToRowStyles[j];
      eRow.setStyles(esEls[0].getStyles(style));
      for (var k = 0; k < esEls.length; k++)
        esEls[k].setStyle(style, '0');
    }
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
      //Ngn.addTips(Ngn.Btn.btn(btn)).inject(els[els.length - 1], 'after'), function() {
      //Ngn.Btn.btn(btn).inject(els[els.length - 1], 'after'), function() {
      Ngn.Btn.btn(btn).inject(eRowBtns), function() {
        fieldSet.fireEvent(btn.cls);
        action.bind(this)();
      }, options || {}));
  },

  createDeleteButton: function(eRow) {
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
    var els = eRow.getElements(this.options.elementContainerSelector);
    //реализовать через css
    //var eLabel = eRow.getElement(this.options.removeExceptFirstRow);
    //if (eLabel) eBtn.setStyle('margin-top', (eBtn.getStyle('margin-top').toInt() + eLabel.getSizeWithMargin().y) + 'px');
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
      //c(eElement.get('class').replace('-' + curN + '-', '-' + nextN + '-'));
      //c('(.*)-' + lastRowN + '-(.*)');
      eElement.set('class', eElement.get('class').replace(new RegExp('(.*)-0-(.*)'), '$1-' + nextRowN + '-$2'));
    });
    eNewRow.getElements(Ngn.Frm.selector).each(function(eInput, i) {
      Ngn.Frm.emptify(eInput);
      //if (eInput.get('value')) eInput.set('value', '');
      //if (eInput.get('checked')) eInput.set('checked', false);
      //c(nextRowN);
      eInput.set('name', this.getInputName(eInput, nextRowN));
      //eInput.set('id', lastRowElements[i].get('id').replace('-' + lastRowN + '-', '-' + nextRowN + '-'));
      eLabel = eInput.getNext('label');
      //if (eLabel) eLabel.set('for', eInput.get('id'));
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
    selectTitle: 'Нажмите, чтобы сменить',
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
    console.debug(this.value);
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
/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.js|--*/
// from common

if (!Ngn.sd) Ngn.sd = {};

Ngn.blink = function(el, duration) {
  if (!duration) duration = 1000;
  var element = $(el);
  var on = true;
  (function() {
    element.setStyle('visibility', on ? 'hidden' : 'visible');
    on = !on;
  }).periodical(duration);
};

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

  fontSettingsAction: 'json_fontSettings',

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

  _fontSettingsAction: function() {
    if (Ngn.sd.openedPropDialog) Ngn.sd.openedPropDialog.close();
    Ngn.sd.openedPropDialog = new Ngn.sd.FontSettingsDialog(Object.merge({
      onClose: function() {
        Ngn.sd.openedPropDialog = false;
      },
      dialogClass: 'settingsDialog compactFields dialog',
      id: this.finalData().data.type + this.id(),
      baseZIndex: 210,
      force: false,
      url: this.ctrl + '/' + this.fontSettingsAction + '/' + this.id(),
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
    }, this.fontSettingsDialogOptions()));
  },

  initFontBtn: function() {
    if (!this.eBtns) return;
    this.btnFontSettings = new Ngn.Btn( //
      Ngn.Btn.btn2('Font Settings', 'font').inject(this.eBtns), //
      this._fontSettingsAction.bind(this) //
    );
  },

  styleEl: function() {
    return this.el;
  }

});

Ngn.sd.FontSettingsDialog = new Class({
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
    }
    this.message.getElement('[name=fontSize]').addEvent('change', function() {
      obj.fireEvent('changeSize', this.get('value'));
    });
    this.message.getElement('[name=color]').addEvent('change', function() {
      obj.fireEvent('changeColor', this.get('value'));
    });
    //this.message.getElement('[name=shadow]').addEvent('change', function() {
    //  obj.fireEvent('changeShadow', this.get('value'));
    //});
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
    Ngn.sd.initLayersPanel();
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
    Ngn.sd.initLayersPanel();
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
    Ngn.sd.initLayersPanel();
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
    if (!confirm('Вы уверены?')) return;
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

Ngn.sd.BlockBGallery = new Class({
  Extends: Ngn.sd.BlockB,

  init: function() {
    this.parent();
    var carousel = new Ngn.Carousel(this.el.getElement('.cont'));
    $('prev').addEvent('click', function() {
      carousel.toPrevious();
    });
    $('next').addEvent('click', function() {
      carousel.toNext();
    });
  }

});

Ngn.sd.BlockBFont = new Class({
  Extends: Ngn.sd.BlockB,
  fontSettingsAction: 'json_cufonSettings',
  fontSettingsDialogOptions: function() {
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
    }.bind(this));
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
  init: function() {
    this.parent();
    if (this.data.font.blink) Ngn.blink(this.el.getElement('.cont'), 500);
  },
  hasAnimation: function() {
    return this.data.font.blink ? true : false;
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

Ngn.sd.BlockBBlog = new Class({
  Extends: Ngn.sd.BlockB,

  initBtns: function() {
    this.parent();
    new Ngn.Btn(Ngn.Btn.btn2('Настройки блога', 'settings').inject(this.eBtns, 'top'), function() {
      new Ngn.Dialog.RequestForm({
        url: '/blogSettings',
        dialogClass: 'settingsDialog compactFields dialog',
        width: 400
      });
    });
  },
  _resize: function(size) {
    delete size.h;
    this.parent(size);
  },
  replaceContent: function() {
    this.parent();
    this.el.getElements('.pNums a').each(function(el) {
      el.addEvent('click', function(e) {
        new Event(e).stop();
        new Ngn.Request({
          url: el.get('href').replace(/^\/(\w+)\//g, '/blog/'),
          onComplete: function() {
          }
        }).send();
      });
    });
  },
  editAction: function() {
  }

});

Ngn.sd.BlockBButton = new Class({
  Extends: Ngn.sd.BlockB,

  defaultData: function() {
    return {
      size: {
        w: 150,
        h: 40
      }
    };
  },

  _resize: function(size) {
    this.el.getElement('.btn').sdSetStyles({
      width: size.w + 'px',
      height: size.h + 'px'
    });
    var eSpan = this.el.getElement('.btn span');
    eSpan.sdSetStyle('margin-top', (Math.floor(size.h / 2 - (eSpan.getSize().y / 2)) - 1) + 'px');
    this.parent(size);
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

Ngn.sd.initPageTitle = document.getElement('head title').get('text');

Ngn.getParam = function(val) {
  var result = "Not found",
    tmp = [];
  location.search
    //.replace ( "?", "" )
    // this is better, there might be a question mark inside
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
    });
  return result;
};

Ngn.sd.loadData = function(ownPageId, onComplete) {
  onComplete = onComplete || function() {
  };
  //if () $('layout1').dispose();
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
      //for (i = 0; i < data.items.layout.length; i++) {
      //  new Ngn.sd.Layout(data.items.layout[i], {
      //    cls: i == 0 ? data.layout : ''
      //  });
      //}
      //for (i = 0; i < data.items.layoutContent.length; i++) {
      //  Ngn.sd.layoutContent = new Ngn.sd.LayoutContent(data.items.layoutContent[i]);
      //}
      //for (i = 0; i < data.items.blockContainer.length; i++) {
      //  v = data.items.blockContainer[i];
      //  Ngn.sd.blockContainers[v.id] = new Ngn.sd.BlockContainer(v);
      //}

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
      // window.location = window.location.href.replace(/#pg\d+/, '') + '#pg' + ownPageId;
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

Ngn.sd.PagesSet = new Class({
  Extends: Ngn.FieldSet,
  initRows: function() {
    this.parent();
    for (var i = 0; i < this.esRows.length; i++) {
      this.createRowButton(this.esRows[i], {
        caption: 'Перейти к редактированию раздела',
        cls: 'edit'
      }, function() {
        Ngn.sd.loadData(this.options.n);
      }, {
        n: this.esRows[i].retrieve('n')
      });
    }
  },
  setActive: function(n) {
    for (var i = 0; i < this.esRows.length; i++) {
      this.esRows[i].removeClass('active');
    }
    this.esRows[n - 1].addClass('active');
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
  document.title = size.w + 'x' + size.h;
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
    return a[key1][key2] < b[key1][key2] ? -1 : a[key1][key2] > b[key1][key2] ? 1 : 0
  });
  return r;
};

Ngn.sd.initLayersPanel = function() {
  Ngn.sd.eLayers.set('html', '');
  var title;
  var item;
  var sortedBlocks = Ngn.sd.sortBySubKey(Ngn.sd.blocks, '_data', 'orderKey');
  new Element('div', {
    html: 'Layers',
    'class': 'lTitle'
  }).inject(Ngn.sd.eLayers);
  var eLayers = new Element('div', {
    'class': 'layers'
  }).inject(Ngn.sd.eLayers);
  for (var i = 0; i < sortedBlocks.length; i++) {
    item = sortedBlocks[i]._data;
    if (item.data.type == 'image' || item.data.type == 'background' || item.data.type == 'button') {
      title = '<span class="ico">' + //
      item.html + '</span>' + //
        // item.id + ' ' + //
      Ngn.String.ucfirst(item.data.type);
    } else if (item.data.type == 'font') {
      var text = item.html.replace(/<br \/>/g, " ").substring(0, 10);
      title = '<span class="ico">' + //
      '<img src="/sd/img/font.png?v3"></span>' + //
        // item.id + ' ' + //
      (text ? text : 'empty')
    } else {
      throw new Error('Unsupported layer type "' + item.data.type + '"');
    }
    var eItem = new Element('div', {
      'class': 'item ' + 'item_' + item.data.type,
      'data-id': item.id,
      'data-type': item.data.type
    });
    new Element('div', {
      'class': 'title',
      html: title
    }).inject(eItem);
    var eBtns = new Element('div', {
      'class': 'btns'
    }).inject(eItem);
    if (Ngn.sd.blocks[item.id].finalData().data.type == 'font') {
      new Ngn.Btn( //
        Ngn.Btn.btn2('Edit', 'edit').inject(eBtns), //
        Ngn.sd.blocks[item.id]._fontSettingsAction.bind(Ngn.sd.blocks[item.id]) //
      );
    } else {
      new Element('a', {
        'class': 'smIcons dummy'
      }).inject(eBtns);
    }
    new Ngn.Btn( //
      Ngn.Btn.btn2('Delete', 'delete').inject(eBtns), //
      Ngn.sd.blocks[item.id].deleteAction.bind(Ngn.sd.blocks[item.id]) //
    );
    eItem.inject(eLayers);
  }
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
};

Ngn.sd.changeBannerBackground = function(backgroundUrl) {
  new Ngn.Request.JSON({
    url: '/cpanel/' + Ngn.sd.bannerId + '/json_createBackgroundBlock?backgroundUrl=' + backgroundUrl,
    onComplete: function() {
      Ngn.sd.reinit();
    }
  }).send();
};

Ngn.sd.buildPanel = function() {
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

  //===================
  document.getElement('.profileBar').inject(Ngn.sd.ePanel);
  //===================

  // -- layers control
  Ngn.sd.eLayers = new Element('div', {'class': 'cont'}).inject($('layers'));
  Ngn.sd.loadData(pg ? pg[1] : 1, function(data) {
    Ngn.sd.initLayersPanel();
  });
  Ngn.sd.bindKeys();


  window.fireEvent('sdPanelComplete');
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

Ngn.sd.bindKeys = function() {
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
};

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

Ngn.sd.init = function(bannerId) {
  Ngn.sd.bannerId = bannerId;
  Ngn.sd.buildPanel();
  if (window.location.hash == '#preview') {
    Ngn.sd.previewSwitch();
  }
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

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/carousel/Ngn.Carousel.js|--*/
Ngn.Carousel = new Class({
  Extends: Fx.Scroll,

  options: {
    mode: 'horizontal',
    id: 'carousel',
    childSelector: false,
    loopOnScrollEnd: true,
    periodical: false
  },

  initialize: function(element, options) {
    this.parent(element, options);
    this.cacheElements();
    if (!this.elements[0]) throw new Error('No elements was found');
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].store('initIndex', i);
    }
    this.currentIndex = 0;
    this.elementWidth = this.elements[0].getSize().x;
    this.visibleElementsN = Math.round(this.element.getSize().x / this.elementWidth);
    if (this.options.periodical) this.toNext.periodical(this.options.periodical, this);
    if (this.elements) this.toElementForce(this.elements[this.currentIndex]);
  },

  cacheElements: function() {
    var els;
    if (this.options.childSelector) {
      els = this.element.getElements(this.options.childSelector);
      //} else if (this.options.mode == 'horizontal'){
      //  els = this.element.getElements(':first-child > *');
    } else {
      els = this.element.getChildren();
    }
    if (els[0] && this.options.changeContainerWidth && this.options.elementsOnPage) {
      this.element.setStyle('width', (els[0].getSize().x * this.options.elementsOnPage) + 'px');
      this.element.getFirst().setStyle('width', (els[0].getSize().x * els.length) + 'px');
    }
    this.elements = els;
    return this;
  },

  curEl: null,

  setSelectedElement: function(el) {
    if (this.curEl) this.curEl.removeClass('sel');
    this.curEl = el.addClass('sel');
  },

  toNext: function() {
    if (!this.check()) return this;
    this.currentIndex = this.getNextIndex();
    if (!this.elements[this.currentIndex]) return;
    this.toElement(this.elements[this.currentIndex]);
    this.fireEvent('next');
    return this;
  },

  toPrevious: function() {
    if (!this.check()) return this;
    this.currentIndex = this.getPreviousIndex();
    if (!this.elements[this.currentIndex]) return;
    this.toElement(this.elements[this.currentIndex]);
    this.fireEvent('previous');
    return this;
  },

  toElement: function(el) {
    this.parent(el);
    this.setSelectedElement(el);
    this.fireEvent('toElement');
  },

  toElementForce: function(el){
    var axes = ['x', 'y'];
    var scroll = this.element.getScroll();
    var position = Object.map(document.id(el).getPosition(this.element), function(value, axis){
      return axes.contains(axis) ? value + scroll[axis] : false;
    });
    this.set(this.calculateScroll(position.x, position.y));
    this.setSelectedElement(el);
  },

  setRight: function() {
    this.set(this.element.getScrollSize().x, 0);
  },

  getNextIndex: function() {
    this.currentIndex++;
    if (this.currentIndex == this.elements.length || this.checkScroll()) {
      this.fireEvent('loop');
      this.fireEvent('nextLoop');
      return 0;
    } else {
      return this.currentIndex;
    }
    ;
  },

  getPreviousIndex: function() {
    this.currentIndex--;
    var check = this.checkScroll();
    if (this.currentIndex < 0 || check) {
      this.fireEvent('loop');
      this.fireEvent('previousLoop');
      return (check) ? this.getOffsetIndex() : this.elements.length - 1;
    } else {
      return this.currentIndex;
    }
  },

  getOffsetIndex: function() {
    var visible = (this.options.mode == 'horizontal') ? this.element.getStyle('width').toInt() / this.elements[0].getStyle('width').toInt() : this.element.getStyle('height').toInt() / this.elements[0].getStyle('height').toInt();
    return this.currentIndex + 1 - visible;
  },

  checkLink: function() {
    return (this.timer && this.options.link == 'ignore');
  },

  checkScroll: function() {
    if (!this.options.loopOnScrollEnd) return false;
    if (this.options.mode == 'horizontal') {
      var scroll = this.element.getScroll().x;
      var total = this.element.getScrollSize().x - this.element.getSize().x;
    } else {
      var scroll = this.element.getScroll().y;
      var total = this.element.getScrollSize().y - this.element.getSize().y;
    }
    return (scroll == total);
  },

  getCurrent: function() {
    return this.elements[this.currentIndex];
  }

});

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
/*--|/home/user/ngn-env/bc/sd/js/plugins/text.js|--*/
Ngn.sd.blockTypes.push({
  title: 'Font',
  data: {
    type: 'font'
  }
});
window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add text', 'text'), function() {
    var data = Ngn.sd.getBlockType('font');
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
/*--|/home/user/ngn-env/bc/sd/js/plugins/image.js|--*/
window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add image', 'image'), null, {
    fileUpload: {
      url: '/pageBlock/' + Ngn.sd.bannerId + '/json_createImage',
      onRequest: function() {
        Ngn.Request.Iface.loading(true);
      }.bind(this),
      onComplete: function(v) {
        var block = Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), v);
        block.creationEvent();
        Ngn.Request.Iface.loading(false);
      }.bind(this)
    }
  });
});
/*--|/home/user/ngn-env/bc/sd/js/plugins/background.js|--*/
Ngn.sd.BlockBBackground = new Class({
  Extends: Ngn.sd.BlockBImage
});

Ngn.sd.BackgroundInsertDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    id: 'background',
    title: 'Insert background',
    okText: 'Insert',
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
/*--|/home/user/ngn-env/bc/sd/js/plugins/button.js|--*/
Ngn.sd.BlockBButton = new Class({
  Extends: Ngn.sd.BlockBImage
});

Ngn.sd.addBannerButton = function(buttonUrl) {
  new Ngn.Request.JSON({
    url: '/cpanel/' + Ngn.sd.bannerId + '/json_createButtonBlock?buttonUrl=' + buttonUrl,
    onComplete: function() {
      Ngn.sd.reinit();
    }
  }).send();
};

Ngn.sd.ButtonInsertDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    id: 'button',
    title: 'Insert button',
    okText: 'Insert',
    width: 400,
    height: 300,
    url: '/cpanel/' + Ngn.sd.bannerId + '/ajax_buttonSelect',
    onRequest: function() {
      this.initImages();
    },
    ok: function() {
      Ngn.sd.addBannerButton(Ngn.sd.selectedButtonUrl);
    }.bind(this)
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
    Ngn.sd.selectedButtonUrl = el.get('src');
    el.addClass('selected');
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add button', 'button'), function() {
    new Ngn.sd.ButtonInsertDialog();
  });
});
/*--|/home/user/ngn-env/bc/sd/js/plugins/clipart.js|--*/
Ngn.sd.ClipartInsertDialog = new Class({
  Extends: Ngn.sd.ButtonInsertDialog,
  options: {
    title: 'Insert clipart',
    url: '/cpanel/' + Ngn.sd.bannerId + '/ajax_clipartSelect',
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add clipart', 'clipart'), function() {
    new Ngn.sd.ClipartInsertDialog();
  });
});
/*--|/home/user/ngn-env/bc/sd/js/plugins/fromTemplate.js|--*/
Ngn.sd.CreateFromTemplateDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    id: 'template',
    title: 'Create from template',
    okText: 'Create',
    width: 400,
    height: 300,
    url: '/cpanel/' + Ngn.sd.bannerId + '/ajax_buttonSelect',
    onRequest: function() {
    },
    ok: function() {
    }.bind(this)
  }
});

window.addEvent('sdPanelComplete', function() {
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
  var url;
  if (Ngn.sd.animation.exists()) {
    url = '/render/' + Ngn.sd.bannerId + '/ajax_animated/' + Ngn.sd.animation.framesCount();
  } else {
    url = '/render/' + Ngn.sd.bannerId;
  }
  new Ngn.Dialog.HtmlPage({
    url: url,
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

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.El.Textarea.js|--*/
Ngn.Form.El.Textarea = new Class({
  Extends: Ngn.Form.El,

  resizebleOptions: {},

  init: function() {
    if (this.form.options.dialog && this.form.options.dialog.options.vResize) return;
    //new Ngn.ResizableTextarea(this.eRow); // реализовать настройку в Ngn.Form.ElInit...
  }

});
