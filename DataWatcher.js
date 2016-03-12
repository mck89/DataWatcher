/*!
 * DataWatcher.js v1.0
 * (c) 2016 Marco Marchiò
 * Released under the MIT License.
 */
(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(factory);
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		global.DataWatcher = factory();
	}
})(this, function () {
	var id = 0,
		initLevel = 0,
		toString = Object.prototype.toString,
		isArray = function (obj) {
			return toString.call(obj) === '[object Array]';
		},
		isObject = function (obj) {
			return obj !== null && toString.call(obj) === '[object Object]';
		},
		isFunction = function (obj) {
			return typeof obj === "function";
		},
		//Checks if the given data is observable
		observable = function (obj) {
			//Only arrays and objects are observable
			return isArray(obj) || isObject(obj);
		},
		//Splits a string path into tokens that can be used to compare properties path
		compilePath = function (path) {
			if (isArray(path)) {
				return path;
			} else if (!path) {
				return [];
			}
			var compiled = [],
				buffer = "",
				inSquareBrackets = false,
				escaped = false,
				char;
			for (var i = 0, l = path.length; i < l; i++) {
				char = path[i];
				if (char === "." && !inSquareBrackets && !escaped) {
					buffer && compiled.push(buffer);
					buffer = "";
				} else if (char === "*" && !inSquareBrackets && !escaped) {
					compiled.push(true);
					buffer = "";
				} else if (char === "\\" && !escaped) {
					escaped = true;
				} else if (char === "[" && !escaped && !inSquareBrackets) {
					buffer && compiled.push(buffer);
					buffer = "";
					inSquareBrackets = true;
				} else if (char === "]" && !escaped && inSquareBrackets) {
					buffer && compiled.push(buffer);
					buffer = "";
					inSquareBrackets = false;
				} else {
					buffer += char;
					escaped = false;
				}
			}
			buffer && compiled.push(buffer);
			return compiled;
		},
		//Checks if the given paths match
		matchPath = function (p1, p2) {
			var l1 = p1.length,
				l2 = p2.length;

			//If changed property path length is greater than watcher filter path length then paths
			//do not match
			if (l2 > l1) {
				return false;
			}

			//Check parts with the same index in both paths
			for (var i = 0, part1, part2; i < l2; i++) {
				//If path parts do not match or watcher filter path part is different from *
				//then paths do not match
				part1 = p1[i];
				part2 = p2[i];
				if (part2 !== true && part1 !== part2) {
					return false;
				}
			}

			//If all paths parts match and paths have the same length or their length differs by 1
			//(parent property) or the watcher filter path ends with *, then paths match
			return l1 - l2 <= 1 || p2[l2 - 1] === true;
		},
		//Watchers registry
		registry = {},
		//Adds a watcher for the given DataWatcher instance id
		addWatcher = function (id, path, fn) {
			if (!(id in registry)) {
				registry[id] = [];
			}
			registry[id].push([compilePath(path), fn]);
		},
		//Notifies watchers of a property change
		notifyWatchers = function (id, path, oldVal, newVal) {
			if (!(id in registry) || !registry[id].length) {
				return;
			}

			//Create the event object
			var eventObj = {
					path: path,
					oldValue: oldVal,
					newValue: newVal,
					type: oldVal === undefined ? DataWatcher.type.ADDED : (
						  newVal === undefined ? DataWatcher.type.DELETED : DataWatcher.type.MODIFIED
					)
				};

			//For each watcher check if its path matches the changed property path, if so execute the watcher
			registry[id].forEach(function (def) {
				matchPath(path, def[0]) && def[1](eventObj);
			});
		},
		//Data deep comparison
		compare = function (a, b) {
			if (a === b) {
				return true;
			}
			if (isArray(a) && isArray(b)) {
				//Arrays comparison
				var len = a.length;
				if (len !== b.length) {
					return false;
				}
				for (var i = 0; i < len; i++) {
					if (!compare(a[i], b[i])) {
						return false;
					}
				}
				return true;
			} else if (isObject(a) && isObject(b)) {
				//Objects comparison
				var keysA = Object.keys(a),
					len = keysA.length;
				if (len !== Object.keys(b).length) {
					return false;
				}
				for (var i = 0; i < len; i++) {
					if (!(keysA[i] in b)) {
						return false;
					}
					if (!compare(a[keysA[i]], b[keysA[i]])) {
						return false;
					}
				}
				return true;
			}
			return false;
		},
		//Checks if the given property can be modified
		canModify = function (isArray, target, prop) {
			if (!isArray) {
				var descriptor = Object.getOwnPropertyDescriptor(target, prop);
				if (descriptor) {
					return descriptor.writable;
				}
			}
			return true;
		},
		//Creates proxy traps
		createTraps = function (notifier, path, isArray) {
			var handler = {
					set: function (target, prop, val) {
						var oldVal,
							success = true;
						//If the property is not writable don't proceed
						if (!canModify(isArray, target, prop)) {
							success = false;
						} else {
							oldVal = target[prop];
							if (!compare(oldVal, val)) {
								try {
									//If the value is observable create a proxy
									target[prop] = observable(val) ?
												   createProxy(val, notifier, path.concat([prop])) :
												   val;
								} catch (e) {
									success = false;
								}
								//Ignore changes to the length property for arrays
								if (!initLevel && success && (!isArray || prop !== "length")) {
									notifyWatchers(notifier.getId(), path.concat([prop + ""]), oldVal, val);
								}
							}
						}
						return success;
					},
					deleteProperty: function (target, prop) {
						var oldVal,
							success = true;
						//If the property is not writable don't proceed
						if (!canModify(isArray, target, prop)) {
							success = false;
						} else {
							oldVal = target[prop];
							try {
								delete target[prop];
							} catch (e) {
								success = false;
							}
							if (success) {
								notifyWatchers(notifier.getId(), path.concat([prop + ""]), oldVal);
							}
						}
						return success;
					}
				};
			if (isArray) {
				//This fixes some unexpected behaviours when handling arrays
				handler.get = function (target, prop) {
					return target[prop];
				};
			} else {
				//Support object property descriptor
				handler.defineProperty = function (target, prop, descriptor) {
					if ("value" in descriptor) {
						this.set(target, prop, descriptor.value);
						delete descriptor.value;
					}
					Object.defineProperty(target, prop, descriptor);
					return true;
				};
			}
			return handler;
		},
		//Recursive functions to create a proxy around the given data
		createProxy = function (obj, notifier, path) {
			var clone,
				proxy;
			initLevel++;
			if (isArray(obj)) {
				clone = [];
				proxy = new Proxy(clone, createTraps(notifier, path, true));
				obj.forEach(function (item) {
					proxy.push(item);
				});
			} else {
				clone = {};
				proxy = new Proxy(clone, createTraps(notifier, path));
				for (var prop in obj) {
					if (obj.hasOwnProperty(prop)) {
						Object.defineProperty(proxy, prop, Object.getOwnPropertyDescriptor(obj, prop));
					}
				}
			}
			initLevel--;
			return proxy;
		},
		// Class constructor
		DataWatcher = function (obj) {
			//Check if given data is observable
			if (!observable(obj)) {
				throw "You can observe only objects and arrays";
			}
			//Assign an id to the instance
			Object.defineProperty(this, "id", {
				value: ++id,
				writable: false
			});
			//Create the proxy around the data to observe
			Object.defineProperty(this, "data", {
				value: createProxy(obj, this, []),
				writable: false
			});
		};

	DataWatcher.prototype = {
		data: null,
		getData: function () {
			return this.data;
		},
		getId: function () {
			return this.id;
		},
		watch: function (path, fn, bind) {
			//Shift arguments if path is not specified
			if (isFunction(path)) {
				bind = fn;
				fn = path;
				path = [];
			}
			fn = fn.bind(bind || this);
			addWatcher(this.getId(), path, fn);
			return this;
		}
	};

	DataWatcher.observable = observable;
	
	DataWatcher.supported = function () {
		try {
			new Proxy({}, {});
			return true;
		} catch (e) {
			return false;
		}
	};
	
	DataWatcher.type = {
		MODIFIED: "mod",
		ADDED: "add",
		DELETED: "del"
	};

	return DataWatcher;
});