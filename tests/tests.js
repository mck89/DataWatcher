QUnit.module("DataWatcher");

//Node support
if (typeof module === "object") {
	var DataWatcher = require("../DataWatcher");
}

QUnit.test("Simple object", function() {
	expect(16);
	
	var struct = {
			foo: 1,
			bar: 2
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("*", function (e) {
		if (e.path[0] === "foo") {
			deepEqual(e.path, ["foo"]);
			strictEqual(e.oldValue, 1);
			strictEqual(e.newValue, 3);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "bar") {
			deepEqual(e.path, ["bar"]);
			strictEqual(e.oldValue, 2);
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		} else if (e.path[0] === "baz") {
			deepEqual(e.path, ["baz"]);
			strictEqual(e.oldValue, undefined);
			strictEqual(e.newValue, 4);
			strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("foo", function (e) {
		deepEqual(e.path, ["foo"]);
		strictEqual(e.oldValue, 1);
		strictEqual(e.newValue, 3);
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data.foo = 3;
	delete data.bar;
	data.baz = 4;
});

QUnit.test("Simple array", function() {
	expect(16);
	
	var struct = [1, 2],
		w = new DataWatcher(struct),
		data = w.getData(),
		testPush = false;
	
	w.watch("*", function (e) {
		if (e.path[0] === "0") {
			deepEqual(e.path, ["0"]);
			strictEqual(e.oldValue, 1);
			strictEqual(e.newValue, 3);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (!testPush) {
			deepEqual(e.path, ["1"]);
			strictEqual(e.oldValue, 2);
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			deepEqual(e.path, ["1"]);
			strictEqual(e.oldValue, undefined);
			strictEqual(e.newValue, 4);
			strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("0", function (e) {
		deepEqual(e.path, ["0"]);
		strictEqual(e.oldValue, 1);
		strictEqual(e.newValue, 3);
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data[0] = 3;
	data.pop();
	testPush = true;
	data.push(4);
});

QUnit.test("Types", function() {
	expect(3);
	
	var toString = Object.prototype.toString,
		dataArray = new DataWatcher([1]).getData(),
		dataObject = new DataWatcher({a: 1}).getData();
	
	strictEqual(toString.call(dataArray), "[object Array]");
	ok(Array.isArray(dataArray));
	strictEqual(toString.call(dataObject), "[object Object]");
});

QUnit.test("Shorthand operators", function() {
	expect(8);
	
	var struct = {
			foo: "test",
			bar: 0
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("*", function (e) {
		if (e.path[0] === "foo") {
			deepEqual(e.path, ["foo"]);
			strictEqual(e.oldValue, "test");
			strictEqual(e.newValue, "testtest");
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			deepEqual(e.path, ["bar"]);
			strictEqual(e.oldValue, 0);
			strictEqual(e.newValue, 1);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data.foo += "test";
	data.bar++;
});

QUnit.test("Nested objects", function() {
	expect(36);
	
	var struct = {
			people: {
				Jack: {age: 20},
				Peter: {age: 30},
				Jessy: {age: 40}
			}
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("people", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			deepEqual(e.path, ["people", "Jessy"]);
			deepEqual(e.oldValue, {age: 40});
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			deepEqual(e.path, ["people", "Mary"]);
			strictEqual(e.oldValue, undefined);
			deepEqual(e.newValue, {age: 50});
			strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("people.Jack.age", function (e) {
		deepEqual(e.path, ["people", "Jack", "age"]);
		strictEqual(e.oldValue, 20);
		strictEqual(e.newValue, 25);
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	w.watch("people.*", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			deepEqual(e.path, ["people", "Jessy"]);
			deepEqual(e.oldValue, {age: 40});
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		} else if (e.type === DataWatcher.type.ADDED) {
			deepEqual(e.path, ["people", "Mary"]);
			strictEqual(e.oldValue, undefined);
			deepEqual(e.newValue, {age: 50});
			strictEqual(e.type, DataWatcher.type.ADDED);
		} else if (e.path[1] === "Jack") {
			deepEqual(e.path, ["people", "Jack", "age"]);
			strictEqual(e.oldValue, 20);
			strictEqual(e.newValue, 25);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			deepEqual(e.path, ["people", "Peter", "age"]);
			strictEqual(e.oldValue, 30);
			strictEqual(e.newValue, 35);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	w.watch("people.*.age.", function (e) {
		if (e.path[1] === "Jack") {
			deepEqual(e.path, ["people", "Jack", "age"]);
			strictEqual(e.oldValue, 20);
			strictEqual(e.newValue, 25);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			deepEqual(e.path, ["people", "Peter", "age"]);
			strictEqual(e.oldValue, 30);
			strictEqual(e.newValue, 35);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data.people.Jack.age = 25;
	data.people.Peter.age = 35;
	delete data.people.Jessy;
	data.people.Mary = {age: 50};
});

QUnit.test("Array of objects", function() {
	expect(40);
	
	var struct = {
			people: [
				{name: "Jack", age: 20},
				{name: "Peter", age: 30},
				{name: "Jessy", age: 40}
			]
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("people", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			deepEqual(e.path, ["people", "2"]);
			deepEqual(e.oldValue, {name: "Jessy", age: 40});
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			deepEqual(e.path, ["people", "2"]);
			strictEqual(e.oldValue, undefined);
			deepEqual(e.newValue, {name: "Mary", age: 50});
			strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("people[2]", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			deepEqual(e.path, ["people", "2"]);
			deepEqual(e.oldValue, {name: "Jessy", age: 40});
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			deepEqual(e.path, ["people", "2"]);
			strictEqual(e.oldValue, undefined);
			deepEqual(e.newValue, {name: "Mary", age: 50});
			strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("people.*", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			deepEqual(e.path, ["people", "2"]);
			deepEqual(e.oldValue, {name: "Jessy", age: 40});
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		} else if (e.type === DataWatcher.type.ADDED) {
			deepEqual(e.path, ["people", "2"]);
			strictEqual(e.oldValue, undefined);
			deepEqual(e.newValue, {name: "Mary", age: 50});
			strictEqual(e.type, DataWatcher.type.ADDED);
		} else if (e.path[1] === "0") {
			deepEqual(e.path, ["people", "0", "name"]);
			strictEqual(e.oldValue, "Jack");
			strictEqual(e.newValue, "John");
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			deepEqual(e.path, ["people", "1", "age"]);
			strictEqual(e.oldValue, 30);
			strictEqual(e.newValue, 35);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	w.watch("people.*.name", function (e) {
		deepEqual(e.path, ["people", "0", "name"]);
		strictEqual(e.oldValue, "Jack");
		strictEqual(e.newValue, "John");
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	w.watch("people.*[age]", function (e) {
		deepEqual(e.path, ["people", "1", "age"]);
		strictEqual(e.oldValue, 30);
		strictEqual(e.newValue, 35);
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data.people[0].name = "John";
	data.people[1].age = 35;
	data.people.pop();
	data.people.push({name: "Mary", age: 50});
});

QUnit.test("Watch added data", function() {
	expect(12);
	
	var struct = {
			foo: "test"
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("foo", function (e) {
		if (e.path.length === 1) {
			deepEqual(e.path, ["foo"]);
			strictEqual(e.oldValue, "test");
			deepEqual(e.newValue, {bar: "bar"});
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			deepEqual(e.path, ["foo", "bar"]);
			strictEqual(e.oldValue, "bar");
			strictEqual(e.newValue, "baz");
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	w.watch("foo.bar", function (e) {
		deepEqual(e.path, ["foo", "bar"]);
		strictEqual(e.oldValue, "bar");
		strictEqual(e.newValue, "baz");
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data.foo = {bar: "bar"};
	data.foo.bar = "baz";
});

QUnit.test("Object iteration", function() {
	expect(8);
	
	var struct = {
			foo: "fooVal",
			bar: "barVal",
			baz: "bazVal"
		},
		w = new DataWatcher(struct),
		data = w.getData(),
		keys = Object.keys(data),
		counter = 0;
	
	deepEqual(keys, ["foo", "bar", "baz"]);
	deepEqual(data, struct);
	
	for (var prop in data) {
		strictEqual(prop, keys[counter]);
		strictEqual(data[prop], keys[counter] + "Val");
		counter++;
	}
});

QUnit.test("Array iteration", function() {
	expect(5);
	
	var struct = ["foo", "bar", "baz"],
		w = new DataWatcher(struct),
		data = w.getData();
	
	deepEqual(data, struct);
	strictEqual(data.length, 3);
	
	for (var i = 0; i < data.length; i++) {
		strictEqual(data[i], struct[i]);
	}
});

QUnit.test("Escaped path selectors", function() {
	expect(8);
	
	var struct = {
			"*": 1,
			"a[b]c": 2
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("[*]", function (e) {
		deepEqual(e.path, ["*"]);
		strictEqual(e.oldValue, 1);
		strictEqual(e.newValue, 3);
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	w.watch("[a\\[b\\]c]", function (e) {
		deepEqual(e.path, ["a[b]c"]);
		strictEqual(e.oldValue, 2);
		strictEqual(e.newValue, 4);
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data["*"] = 3;
	data["a[b]c"] = 4;
});

QUnit.test("Empty selector", function() {
	expect(4);

	var struct = {
			foo: 1,
			bar: {
				baz : 1
			}
		},
		w = new DataWatcher(struct),
		data = w.getData();

	data.dontCach = true;

	w.watch("", function (e) {
		deepEqual(e.path, ["foo"]);
		strictEqual(e.oldValue, 1);
		strictEqual(e.newValue, 2);
		strictEqual(e.type, DataWatcher.type.MODIFIED);
	});

	data.foo = 2;
	data.bar.baz = 2;
});

QUnit.test("Invalid data", function() {
	expect(4);
	
	var tests = ["string", 1, function(){}, null];
	
	tests.forEach(function (data) {
		throws(function () {
			new DataWatcher(data);
		});
	});
});

QUnit.test("Array.fill", function() {
	expect(9);
	
	var struct = [1, 2],
		w = new DataWatcher(struct),
		data = w.getData(),
		counter = 0;
	
	w.watch(function (e) {
		if (!counter) {
			deepEqual(e.path, ["0"]);
			strictEqual(e.oldValue, 1);
			strictEqual(e.newValue, 3);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			deepEqual(e.path, ["1"]);
			strictEqual(e.oldValue, 2);
			strictEqual(e.newValue, 3);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
		counter++;
	});
	
	data.fill(3);
	deepEqual(data, [3, 3]);
});

QUnit.test("Array.reverse", function() {
	expect(17);
	
	var struct = [1, 2, 3, 4],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "0") {
			deepEqual(e.path, ["0"]);
			strictEqual(e.oldValue, 1);
			strictEqual(e.newValue, 4);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "1") {
			deepEqual(e.path, ["1"]);
			strictEqual(e.oldValue, 2);
			strictEqual(e.newValue, 3);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "2") {
			deepEqual(e.path, ["2"]);
			strictEqual(e.oldValue, 3);
			strictEqual(e.newValue, 2);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "3") {
			deepEqual(e.path, ["3"]);
			strictEqual(e.oldValue, 4);
			strictEqual(e.newValue, 1);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data.reverse();
	deepEqual(data, [4, 3, 2, 1]);
});

QUnit.test("Array.shift", function() {
	expect(14);
	
	var struct = [1, 2, 3],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "0") {
			deepEqual(e.path, ["0"]);
			strictEqual(e.oldValue, 1);
			strictEqual(e.newValue, 2);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "1") {
			deepEqual(e.path, ["1"]);
			strictEqual(e.oldValue, 2);
			strictEqual(e.newValue, 3);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "2") {
			deepEqual(e.path, ["2"]);
			strictEqual(e.oldValue, 3);
			strictEqual(e.newValue, undefined);
			strictEqual(e.type, DataWatcher.type.DELETED);
		}
	});
	
	strictEqual(data.shift(), 1);
	deepEqual(data, [2, 3]);
});

QUnit.test("Array.unshift", function() {
	expect(14);
	
	var struct = [1, 2],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "0") {
			deepEqual(e.path, ["0"]);
			strictEqual(e.oldValue, 1);
			strictEqual(e.newValue, 3);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "1") {
			deepEqual(e.path, ["1"]);
			strictEqual(e.oldValue, 2);
			strictEqual(e.newValue, 1);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "2") {
			deepEqual(e.path, ["2"]);
			strictEqual(e.oldValue, undefined);
			strictEqual(e.newValue, 2);
			strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	strictEqual(data.unshift(3), 3);
	deepEqual(data, [3, 1, 2]);
});

QUnit.test("Array.splice", function() {
	expect(14);
	
	var struct = [1, 2, 3, 4],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "2") {
			deepEqual(e.path, ["2"]);
			strictEqual(e.oldValue, 3);
			strictEqual(e.newValue, 5);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "3") {
			deepEqual(e.path, ["3"]);
			strictEqual(e.oldValue, 4);
			strictEqual(e.newValue, 6);
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "4") {
			deepEqual(e.path, ["4"]);
			strictEqual(e.oldValue, undefined);
			strictEqual(e.newValue, 7);
			strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	deepEqual(data.splice(2, 2, 5, 6, 7), [3, 4]);
	deepEqual(data, [1, 2, 5, 6, 7]);
});

QUnit.test("Array.sort", function() {
	expect(1);
	
	var struct = [4, 3, 2, 1],
		w = new DataWatcher(struct),
		data = w.getData();
	
	data.sort();
	deepEqual(data, [1, 2, 3, 4]);
});

QUnit.test("Proxies interaction", function() {
	expect(12);
	
	var struct1 = [],
		struct2 = {foo: "foo"},
		w1 = new DataWatcher(struct1),
		w2 = new DataWatcher(struct2),
		data1 = w1.getData(),
		data2 = w2.getData();
	
	w1.watch(function (e) {
		deepEqual(e.path, ["0"]);
		strictEqual(e.oldValue, undefined);
		deepEqual(e.newValue, struct2);
		strictEqual(e.type, DataWatcher.type.ADDED);
	});
	
	w1.watch("*", function (e) {
		if (e.type === DataWatcher.type.ADDED) {
			deepEqual(e.path, ["0"]);
			strictEqual(e.oldValue, undefined);
			deepEqual(e.newValue, struct2);
			strictEqual(e.type, DataWatcher.type.ADDED);
		} else {
			deepEqual(e.path, ["0", "foo"]);
			strictEqual(e.oldValue, "foo");
			deepEqual(e.newValue, "bar");
			strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data1.push(data2);
	data1[0].foo = "bar";
});

QUnit.test("Deep value comparison", function() {
	expect(21);

	var struct = {
			arr: [1, 2],
			obj: {a: 1, b: 2}
		},
		called = false,
		w = new DataWatcher(struct),
		data = w.getData();

	w.watch("*", function (e) {
		called = true;
		if (e.path[0] === "arr") {
			if (e.path.length === 1) {
				deepEqual(e.path, ["arr"]);
				deepEqual(e.oldValue, [1, 2]);
				deepEqual(e.newValue, [3, [4, 5]]);
				strictEqual(e.type, DataWatcher.type.MODIFIED);
			} else {
				deepEqual(e.path, ["arr", "1"]);
				deepEqual(e.oldValue, [4, 5]);
				deepEqual(e.newValue, [6]);
				strictEqual(e.type, DataWatcher.type.MODIFIED);
			}
		} else {
			if (e.path.length === 1) {
				deepEqual(e.path, ["obj"]);
				deepEqual(e.oldValue, {a: 1, b: 2});
				deepEqual(e.newValue, {a: {c: 3}, b: {d: 4}});
				strictEqual(e.type, DataWatcher.type.MODIFIED);
			} else if (e.path[1] === "a") {
				deepEqual(e.path, ["obj", "a"]);
				deepEqual(e.oldValue, {c: 3});
				deepEqual(e.newValue, {e: 5});
				strictEqual(e.type, DataWatcher.type.MODIFIED);
			} else {
				deepEqual(e.path, ["obj", "b"]);
				deepEqual(e.oldValue, {d: 4});
				deepEqual(e.newValue, {d: 4, f: 6});
				strictEqual(e.type, DataWatcher.type.MODIFIED);
			}
		}
	});

	data.arr = [1, 2];
	data.obj = {a: 1, b: 2};
	strictEqual(called, false);

	data.arr = [3, [4, 5]];
	data.obj = {a: {c: 3}, b: {d: 4}};

	data.arr[1] = [6];
	data.obj.a = {e: 5};
	data.obj.b = {d: 4, f: 6};
});

QUnit.test("Readonly properties", function() {
	expect(5);

	var struct = {};

	Object.defineProperty(struct, "foo", {
		enumerable: true,
		writable: false,
		value: "bar"
	});

	var w = new DataWatcher(struct),
		called = false,
		data = w.getData();

	w.watch("*", function (e) {
		if (e.type !== "add") {
			called = true;
		}
	});

	data.foo = "baz";
	strictEqual(data.foo, "bar");

	delete data.foo;
	strictEqual(data.foo, "bar");
	
	Object.defineProperty(data, "foo2", {
		enumerable: true,
		writable: false,
		value: "bar"
	});
	
	data.foo2 = "baz";
	strictEqual(data.foo, "bar");

	delete data.foo2;
	strictEqual(data.foo, "bar");

	strictEqual(called, false);
});

QUnit.test("Check support", function() {
	ok(DataWatcher.supported());
});