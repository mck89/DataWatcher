# DataWatcher

DataWatcher is a library that allows you to watch changes on objects and arrays, even on nested structures.

DataWatcher uses [ES6 Proxy](https://developer.mozilla.org/it/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to detect changes.

### Examples
Observe changes on objects:
```js
var struct = {foo: "bar"},
	w = new DataWatcher(struct),
	data = w.getData();

//Observe changes on the entire object
w.watch("*", function (e) {
    //The listener receives the event object
	console.log(e);
});

//Observe changes on a single property
w.watch("test", function (e) {
	console.log("Test is now: " + e.newValue);
});

data.foo = "baz";
/* Log: {path: ["foo"], oldValue: "bar", newValue: "baz", type: "mod"} */
delete data.foo;
/* Log: {path: ["foo"], oldValue: "baz", newValue: undefined, type: "del"} */
data.test = "test";
/* Log: {path: ["test"], oldValue: undefined, newValue: "test", type: "add"} */
/* Log: "Test is now: test" */
```

Observe changes on arrays:
```js
var struct = ["foo"],
	w = new DataWatcher(struct),
	data = w.getData();

//Observe changes on the entire array
w.watch("*", function (e) {
    //The listener receives the event object
	console.log(e);
});

data.push("bar");
/* Log: {path: ["1"], oldValue: undefined, newValue: "bar", type: "add"} */
data[0] = "baz";
/* Log: {path: ["1"], oldValue: "foo", newValue: "baz", type: "mod"} */
```

Observe changes on nested data:
```js
var struct = {
		people: [
			{name: "Jack", age: 20},
			{name: "Peter", age: 30},
			{name: "Jessy", age: 40}
		]
	},
	w = new DataWatcher(struct),
	data = w.getData();

//Observe changes on the entire structure
w.watch("*", function (e) {
    //The listener receives the event object
	console.log(e);
});

//Observe changes on the "name" property of every object
w.watch("people.*.name", function (e) {
	console.log("Name changed from " + e.oldValue + " to " + e.newValue);
});

data.people[0].name = "John";
/* Log: {path: ["people", "0", "name"], oldValue: "Jack", newValue: "John", type: "mod"} */
/* Log: "Name changed from Jack to John" */
data.people.pop();
/* Log: {path: ["people", "1"], oldValue: {name: "Jessy", age: 40}, newValue: undefined, type: "del"} */
```

Utilities:
```js
//Check support
if (DataWatcher.supported()) {...}

//Check if a variable is objservable (only objects and arrays are observable)
if (DataWatcher.observable(obj)) {...}

//Event type constants
w.watch("*", function (e) {
    if (e.type === DataWatcher.type.ADDED) {..}
    else if (e.type === DataWatcher.type.MODIFIED) {..}
    else if (e.type === DataWatcher.type.DELETED) {..}
});
```

### Support
- Firefox: 18+
- Chrome: 49+
- Edge: 13+ (Edge 13 has a bug with Object.prototype.toString called on arrays wrapped with DataWatcher, it returns always [Object object])
- Node: 6+