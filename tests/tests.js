QUnit.module("DataWatcher");

QUnit.test("Simple object", function(assert) {
	assert.expect(16);
	
	var struct = {
			foo: 1,
			bar: 2
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("*", function (e) {
		if (e.path[0] === "foo") {
			assert.deepEqual(e.path, ["foo"]);
			assert.strictEqual(e.oldValue, 1);
			assert.strictEqual(e.newValue, 3);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "bar") {
			assert.deepEqual(e.path, ["bar"]);
			assert.strictEqual(e.oldValue, 2);
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		} else if (e.path[0] === "baz") {
			assert.deepEqual(e.path, ["baz"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.strictEqual(e.newValue, 4);
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("foo", function (e) {
		assert.deepEqual(e.path, ["foo"]);
		assert.strictEqual(e.oldValue, 1);
		assert.strictEqual(e.newValue, 3);
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data.foo = 3;
	delete data.bar;
	data.baz = 4;
});

QUnit.test("Simple array", function(assert) {
	assert.expect(16);
	
	var struct = [1, 2],
		w = new DataWatcher(struct),
		data = w.getData(),
		testPush = false;
	
	w.watch("*", function (e) {
		if (e.path[0] === "0") {
			assert.deepEqual(e.path, ["0"]);
			assert.strictEqual(e.oldValue, 1);
			assert.strictEqual(e.newValue, 3);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (!testPush) {
			assert.deepEqual(e.path, ["1"]);
			assert.strictEqual(e.oldValue, 2);
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			assert.deepEqual(e.path, ["1"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.strictEqual(e.newValue, 4);
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("0", function (e) {
		assert.deepEqual(e.path, ["0"]);
		assert.strictEqual(e.oldValue, 1);
		assert.strictEqual(e.newValue, 3);
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data[0] = 3;
	data.pop();
	testPush = true;
	data.push(4);
});

QUnit.test("Types", function(assert) {
	assert.expect(3);
	
	var toString = Object.prototype.toString,
		dataArray = new DataWatcher([1]).getData(),
		dataObject = new DataWatcher({a: 1}).getData();
	
	assert.strictEqual(toString.call(dataArray), "[object Array]");
	assert.ok(Array.isArray(dataArray));
	assert.strictEqual(toString.call(dataObject), "[object Object]");
});

QUnit.test("Shorthand operators", function(assert) {
	assert.expect(8);
	
	var struct = {
			foo: "test",
			bar: 0
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("*", function (e) {
		if (e.path[0] === "foo") {
			assert.deepEqual(e.path, ["foo"]);
			assert.strictEqual(e.oldValue, "test");
			assert.strictEqual(e.newValue, "testtest");
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			assert.deepEqual(e.path, ["bar"]);
			assert.strictEqual(e.oldValue, 0);
			assert.strictEqual(e.newValue, 1);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data.foo += "test";
	data.bar++;
});

QUnit.test("Nested objects", function(assert) {
	assert.expect(36);
	
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
			assert.deepEqual(e.path, ["people", "Jessy"]);
			assert.deepEqual(e.oldValue, {age: 40});
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			assert.deepEqual(e.path, ["people", "Mary"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.deepEqual(e.newValue, {age: 50});
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("people.Jack.age", function (e) {
		assert.deepEqual(e.path, ["people", "Jack", "age"]);
		assert.strictEqual(e.oldValue, 20);
		assert.strictEqual(e.newValue, 25);
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	w.watch("people.*", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			assert.deepEqual(e.path, ["people", "Jessy"]);
			assert.deepEqual(e.oldValue, {age: 40});
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		} else if (e.type === DataWatcher.type.ADDED) {
			assert.deepEqual(e.path, ["people", "Mary"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.deepEqual(e.newValue, {age: 50});
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		} else if (e.path[1] === "Jack") {
			assert.deepEqual(e.path, ["people", "Jack", "age"]);
			assert.strictEqual(e.oldValue, 20);
			assert.strictEqual(e.newValue, 25);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			assert.deepEqual(e.path, ["people", "Peter", "age"]);
			assert.strictEqual(e.oldValue, 30);
			assert.strictEqual(e.newValue, 35);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	w.watch("people.*.age.", function (e) {
		if (e.path[1] === "Jack") {
			assert.deepEqual(e.path, ["people", "Jack", "age"]);
			assert.strictEqual(e.oldValue, 20);
			assert.strictEqual(e.newValue, 25);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			assert.deepEqual(e.path, ["people", "Peter", "age"]);
			assert.strictEqual(e.oldValue, 30);
			assert.strictEqual(e.newValue, 35);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data.people.Jack.age = 25;
	data.people.Peter.age = 35;
	delete data.people.Jessy;
	data.people.Mary = {age: 50};
});

QUnit.test("Array of objects", function(assert) {
	assert.expect(40);
	
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
			assert.deepEqual(e.path, ["people", "2"]);
			assert.deepEqual(e.oldValue, {name: "Jessy", age: 40});
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			assert.deepEqual(e.path, ["people", "2"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.deepEqual(e.newValue, {name: "Mary", age: 50});
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("people[2]", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			assert.deepEqual(e.path, ["people", "2"]);
			assert.deepEqual(e.oldValue, {name: "Jessy", age: 40});
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		} else {
			assert.deepEqual(e.path, ["people", "2"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.deepEqual(e.newValue, {name: "Mary", age: 50});
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	w.watch("people.*", function (e) {
		if (e.type === DataWatcher.type.DELETED) {
			assert.deepEqual(e.path, ["people", "2"]);
			assert.deepEqual(e.oldValue, {name: "Jessy", age: 40});
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		} else if (e.type === DataWatcher.type.ADDED) {
			assert.deepEqual(e.path, ["people", "2"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.deepEqual(e.newValue, {name: "Mary", age: 50});
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		} else if (e.path[1] === "0") {
			assert.deepEqual(e.path, ["people", "0", "name"]);
			assert.strictEqual(e.oldValue, "Jack");
			assert.strictEqual(e.newValue, "John");
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			assert.deepEqual(e.path, ["people", "1", "age"]);
			assert.strictEqual(e.oldValue, 30);
			assert.strictEqual(e.newValue, 35);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	w.watch("people.*.name", function (e) {
		assert.deepEqual(e.path, ["people", "0", "name"]);
		assert.strictEqual(e.oldValue, "Jack");
		assert.strictEqual(e.newValue, "John");
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	w.watch("people.*[age]", function (e) {
		assert.deepEqual(e.path, ["people", "1", "age"]);
		assert.strictEqual(e.oldValue, 30);
		assert.strictEqual(e.newValue, 35);
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data.people[0].name = "John";
	data.people[1].age = 35;
	data.people.pop();
	data.people.push({name: "Mary", age: 50});
});

QUnit.test("Watch added data", function(assert) {
	assert.expect(12);
	
	var struct = {
			foo: "test"
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("foo", function (e) {
		if (e.path.length === 1) {
			assert.deepEqual(e.path, ["foo"]);
			assert.strictEqual(e.oldValue, "test");
			assert.deepEqual(e.newValue, {bar: "bar"});
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			assert.deepEqual(e.path, ["foo", "bar"]);
			assert.strictEqual(e.oldValue, "bar");
			assert.strictEqual(e.newValue, "baz");
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	w.watch("foo.bar", function (e) {
		assert.deepEqual(e.path, ["foo", "bar"]);
		assert.strictEqual(e.oldValue, "bar");
		assert.strictEqual(e.newValue, "baz");
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data.foo = {bar: "bar"};
	data.foo.bar = "baz";
});

QUnit.test("Object iteration", function(assert) {
	assert.expect(8);
	
	var struct = {
			foo: "fooVal",
			bar: "barVal",
			baz: "bazVal"
		},
		w = new DataWatcher(struct),
		data = w.getData(),
		keys = Object.keys(data),
		counter = 0;
	
	assert.deepEqual(keys, ["foo", "bar", "baz"]);
	assert.deepEqual(data, struct);
	
	for (var prop in data) {
		assert.strictEqual(prop, keys[counter]);
		assert.strictEqual(data[prop], keys[counter] + "Val");
		counter++;
	}
});

QUnit.test("Array iteration", function(assert) {
	assert.expect(5);
	
	var struct = ["foo", "bar", "baz"],
		w = new DataWatcher(struct),
		data = w.getData();
	
	assert.deepEqual(data, struct);
	assert.strictEqual(data.length, 3);
	
	for (var i = 0; i < data.length; i++) {
		assert.strictEqual(data[i], struct[i]);
	}
});

QUnit.test("Escaped path selectors", function(assert) {
	assert.expect(8);
	
	var struct = {
			"*": 1,
			"a[b]c": 2
		},
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch("[*]", function (e) {
		assert.deepEqual(e.path, ["*"]);
		assert.strictEqual(e.oldValue, 1);
		assert.strictEqual(e.newValue, 3);
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	w.watch("[a\\[b\\]c]", function (e) {
		assert.deepEqual(e.path, ["a[b]c"]);
		assert.strictEqual(e.oldValue, 2);
		assert.strictEqual(e.newValue, 4);
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});
	
	data["*"] = 3;
	data["a[b]c"] = 4;
});

QUnit.test("Empty selector", function(assert) {
	assert.expect(4);

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
		assert.deepEqual(e.path, ["foo"]);
		assert.strictEqual(e.oldValue, 1);
		assert.strictEqual(e.newValue, 2);
		assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
	});

	data.foo = 2;
	data.bar.baz = 2;
});

QUnit.test("Invalid data", function(assert) {
	assert.expect(4);
	
	var tests = ["string", 1, function(){}, null];
	
	tests.forEach(function (data) {
		assert.throws(function () {
			new DataWatcher(data);
		});
	});
});

QUnit.test("Array.fill", function(assert) {
	assert.expect(9);
	
	var struct = [1, 2],
		w = new DataWatcher(struct),
		data = w.getData(),
		counter = 0;
	
	w.watch(function (e) {
		if (!counter) {
			assert.deepEqual(e.path, ["0"]);
			assert.strictEqual(e.oldValue, 1);
			assert.strictEqual(e.newValue, 3);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else {
			assert.deepEqual(e.path, ["1"]);
			assert.strictEqual(e.oldValue, 2);
			assert.strictEqual(e.newValue, 3);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
		counter++;
	});
	
	data.fill(3);
	assert.deepEqual(data, [3, 3]);
});

QUnit.test("Array.reverse", function(assert) {
	assert.expect(17);
	
	var struct = [1, 2, 3, 4],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "0") {
			assert.deepEqual(e.path, ["0"]);
			assert.strictEqual(e.oldValue, 1);
			assert.strictEqual(e.newValue, 4);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "1") {
			assert.deepEqual(e.path, ["1"]);
			assert.strictEqual(e.oldValue, 2);
			assert.strictEqual(e.newValue, 3);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "2") {
			assert.deepEqual(e.path, ["2"]);
			assert.strictEqual(e.oldValue, 3);
			assert.strictEqual(e.newValue, 2);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "3") {
			assert.deepEqual(e.path, ["3"]);
			assert.strictEqual(e.oldValue, 4);
			assert.strictEqual(e.newValue, 1);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data.reverse();
	assert.deepEqual(data, [4, 3, 2, 1]);
});

QUnit.test("Array.shift", function(assert) {
	assert.expect(14);
	
	var struct = [1, 2, 3],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "0") {
			assert.deepEqual(e.path, ["0"]);
			assert.strictEqual(e.oldValue, 1);
			assert.strictEqual(e.newValue, 2);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "1") {
			assert.deepEqual(e.path, ["1"]);
			assert.strictEqual(e.oldValue, 2);
			assert.strictEqual(e.newValue, 3);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "2") {
			assert.deepEqual(e.path, ["2"]);
			assert.strictEqual(e.oldValue, 3);
			assert.strictEqual(e.newValue, undefined);
			assert.strictEqual(e.type, DataWatcher.type.DELETED);
		}
	});
	
	assert.strictEqual(data.shift(), 1);
	assert.deepEqual(data, [2, 3]);
});

QUnit.test("Array.unshift", function(assert) {
	assert.expect(14);
	
	var struct = [1, 2],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "0") {
			assert.deepEqual(e.path, ["0"]);
			assert.strictEqual(e.oldValue, 1);
			assert.strictEqual(e.newValue, 3);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "1") {
			assert.deepEqual(e.path, ["1"]);
			assert.strictEqual(e.oldValue, 2);
			assert.strictEqual(e.newValue, 1);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "2") {
			assert.deepEqual(e.path, ["2"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.strictEqual(e.newValue, 2);
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	assert.strictEqual(data.unshift(3), 3);
	assert.deepEqual(data, [3, 1, 2]);
});

QUnit.test("Array.splice", function(assert) {
	assert.expect(14);
	
	var struct = [1, 2, 3, 4],
		w = new DataWatcher(struct),
		data = w.getData();
	
	w.watch(function (e) {
		if (e.path[0] === "2") {
			assert.deepEqual(e.path, ["2"]);
			assert.strictEqual(e.oldValue, 3);
			assert.strictEqual(e.newValue, 5);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "3") {
			assert.deepEqual(e.path, ["3"]);
			assert.strictEqual(e.oldValue, 4);
			assert.strictEqual(e.newValue, 6);
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		} else if (e.path[0] === "4") {
			assert.deepEqual(e.path, ["4"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.strictEqual(e.newValue, 7);
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		}
	});
	
	assert.deepEqual(data.splice(2, 2, 5, 6, 7), [3, 4]);
	assert.deepEqual(data, [1, 2, 5, 6, 7]);
});

QUnit.test("Array.sort", function(assert) {
	assert.expect(1);
	
	var struct = [4, 3, 2, 1],
		w = new DataWatcher(struct),
		data = w.getData();
	
	data.sort();
	assert.deepEqual(data, [1, 2, 3, 4]);
});

QUnit.test("Proxies interaction", function(assert) {
	assert.expect(12);
	
	var struct1 = [],
		struct2 = {foo: "foo"},
		w1 = new DataWatcher(struct1),
		w2 = new DataWatcher(struct2),
		data1 = w1.getData(),
		data2 = w2.getData();
	
	w1.watch(function (e) {
		assert.deepEqual(e.path, ["0"]);
		assert.strictEqual(e.oldValue, undefined);
		assert.deepEqual(e.newValue, struct2);
		assert.strictEqual(e.type, DataWatcher.type.ADDED);
	});
	
	w1.watch("*", function (e) {
		if (e.type === DataWatcher.type.ADDED) {
			assert.deepEqual(e.path, ["0"]);
			assert.strictEqual(e.oldValue, undefined);
			assert.deepEqual(e.newValue, struct2);
			assert.strictEqual(e.type, DataWatcher.type.ADDED);
		} else {
			assert.deepEqual(e.path, ["0", "foo"]);
			assert.strictEqual(e.oldValue, "foo");
			assert.deepEqual(e.newValue, "bar");
			assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
		}
	});
	
	data1.push(data2);
	data1[0].foo = "bar";
});

QUnit.test("Deep value comparison", function(assert) {
	assert.expect(21);

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
				assert.deepEqual(e.path, ["arr"]);
				assert.deepEqual(e.oldValue, [1, 2]);
				assert.deepEqual(e.newValue, [3, [4, 5]]);
				assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
			} else {
				assert.deepEqual(e.path, ["arr", "1"]);
				assert.deepEqual(e.oldValue, [4, 5]);
				assert.deepEqual(e.newValue, [6]);
				assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
			}
		} else {
			if (e.path.length === 1) {
				assert.deepEqual(e.path, ["obj"]);
				assert.deepEqual(e.oldValue, {a: 1, b: 2});
				assert.deepEqual(e.newValue, {a: {c: 3}, b: {d: 4}});
				assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
			} else if (e.path[1] === "a") {
				assert.deepEqual(e.path, ["obj", "a"]);
				assert.deepEqual(e.oldValue, {c: 3});
				assert.deepEqual(e.newValue, {e: 5});
				assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
			} else {
				assert.deepEqual(e.path, ["obj", "b"]);
				assert.deepEqual(e.oldValue, {d: 4});
				assert.deepEqual(e.newValue, {d: 4, f: 6});
				assert.strictEqual(e.type, DataWatcher.type.MODIFIED);
			}
		}
	});

	data.arr = [1, 2];
	data.obj = {a: 1, b: 2};
	assert.notOk(called);

	data.arr = [3, [4, 5]];
	data.obj = {a: {c: 3}, b: {d: 4}};

	data.arr[1] = [6];
	data.obj.a = {e: 5};
	data.obj.b = {d: 4, f: 6};
});

QUnit.test("Readonly properties", function(assert) {
	assert.expect(5);

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
	assert.strictEqual(data.foo, "bar");

	delete data.foo;
	assert.strictEqual(data.foo, "bar");
	
	Object.defineProperty(data, "foo2", {
		enumerable: true,
		writable: false,
		value: "bar"
	});
	
	data.foo2 = "baz";
	assert.strictEqual(data.foo, "bar");

	delete data.foo2;
	assert.strictEqual(data.foo, "bar");

	assert.notOk(called);
});

QUnit.test("Check support", function(assert) {
	assert.ok(DataWatcher.supported());
});