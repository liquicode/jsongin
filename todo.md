# @liquicode/jsongin


# Project TODO

- Enhance `Sort()` to explicitely set the sort priority, rather than inferring through key order.
	- ex: { key1: 1, key2: -2, key3: 3 }
- Add 'WiredArray' functionality for fluent syntax.
	- ex: Documents.Filter( ... ).Sort( ... ).Distinct( ... )
- Add `ToYaml()` and `FromYaml()` functions.
- Move the MongoDB compatibility tests to a seperate project `mongodb-compatibility-tests`.
- Add Path functions:
	- `Path.Anscestor( Path )`
	- `Path.Parent( Path )`
	- `Path.Children( Document, Path )`
	- `Path.FirstChild( Document, Path )`
	- `Path.PrevChild( Document, Path )`
	- `Path.NextChild( Document, Path )`
	- `Path.LastChild( Document, Path )`
	- `Path.Descendants( Document, Path )`
	- `Path.FirstDescendant( Document, Path )`
	- `Path.PrevDescendant( Document, Path )`
	- `Path.NextDescendant( Document, Path )`
	- `Path.LastDescendant( Document, Path )`


