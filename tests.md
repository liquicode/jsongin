# @liquicode/jsongin

> Version: 0.1.0

# Test Results

## Unit Tests

```
010) Javascript Compatibility Tests
    ===, !==
      Matching
        ✔ should match two booleans
        ✔ should match two numerics
        ✔ should match two strings
        ✔ should match two nulls
        ✔ should not match two objects
        ✔ should not match two arrays
        ✔ should match two undefineds
      Coercion
        ✔ should not coerce booleans to numerics (b → n)
        ✔ should not coerce booleans to strings (b → s)
        ✔ should not coerce numerics to strings (n → s)
        ✔ should not coerce booleans to null (l → b)
        ✔ should not coerce numerics to null (l → n)
        ✔ should not match null and undefined (l == u)
        ✔ false !== 0, true !== 1
        ✔ 0 !== "", 3.14 !== "3.14"
    ==, !=
      Matching
        ✔ should match two booleans
        ✔ should match two numerics
        ✔ should match two strings
        ✔ should match two nulls
        ✔ should not match two objects
        ✔ should not match two arrays
        ✔ should match two undefineds
      Coercion
        ✔ should coerce booleans to numerics (b → n)
        ✔ should coerce booleans to strings (b → s)
        ✔ should coerce numerics to strings (n → s)
        ✔ should not coerce booleans to null (l → b)
        ✔ should not coerce numerics to null (l → n)
        ✔ should match null and undefined (l == u)
    >=, <=, >, <
      Matching
        ✔ should match two booleans
        ✔ should match two numerics
        ✔ should match two strings
        ✔ should match two nulls
        ✔ should match two objects
        ✔ should match two arrays
        ✔ should not match two undefineds
      Coercion
        ✔ should coerce booleans to numerics (b → n)
        ✔ should coerce booleans to strings (b → s)
        ✔ should coerce numerics to strings (n → s)
        ✔ should coerce booleans to null (l → b)
        ✔ should coerce numerics to null (l → n)
        ✔ should not match null and undefined (l == u)
    All Coercion
      ✔ b → l
      ✔ n → b
      ✔ n → l
      ✔ s → b
      ✔ s → n
      ✔ l → u
      ✔ Rules
    Json stringify/parse
      ✔ should stringify special fields
      ✔ should not stringify regular expressions (21ms)
      ✔ should not stringify functions

  100) Core Tests
    ShortType Tests
      ✔ should support (b)oolean short type
      ✔ should support (n)umeric short type
      ✔ should support (s)tring short type
      ✔ should support nul(l) short type
      ✔ should support (o)bject short type
      ✔ should support (a)rray short type
      ✔ should support (f)unction short type
      ✔ should support (r)egex short type
      ✔ should support (u)ndefined short type
    AsNumber Tests
      ✔ should convert numeric values
      ✔ should convert zero, which is a number and not a missing value
      ✔ should convert numeric string values
      ✔ should return null for non-numeric string values
      ✔ should return null for boolean values
      ✔ should return null for objects and arrays
      ✔ should return null for missing and invalid values
    AsBoolean Tests
      ✔ should return boolean values unchanged
      ✔ should treat zero as false and other numbers as true
      ✔ should treat null and missing values as false
      ✔ should treat the empty string and the empty array as true
      ✔ should treat other values as true
    AsDate Tests
      ✔ should convert numeric timestamps
      ✔ should convert the zero timestamp, which is a date and not a missing value
      ✔ should convert date string values
      ✔ should convert Date objects
      ✔ should return null for values which are not dates
    Parse Tests
      Equivalence with Javascript's JSON.parse()
        ✔ should parse boolean value: true
        ✔ should parse number value: 3.14
        ✔ should parse string value: "text"
        ✔ should parse empty array: []
        ✔ should parse empty object: {}
        ✔ should parse a complex object
        ✔ should parse multi-line text
        ✔ should parse javascript object syntax
      Functionality Beyond Javascript's JSON.parse()
        ✔ It should parse an object written with JS (not JSON) syntax
        ✔ It should parse an object followed by unrelated text
        ✔ It should read the bare literals
      Escape Sequences
        ✔ should decode the escapes which JSON defines
        ✔ should decode an escaped quote inside a single quoted string
        ✔ should read an unrecognized escape as the character itself
        ✔ should round trip an escaped value through Format and Parse
      Forgiving Parsing
        ✔ should return the string unchanged when it cannot be read
        ✔ should return an argument which is not a string unchanged
        ✔ should never throw, whatever it is given
        ✔ should report the reason to OpLog
        ✔ should stay silent when no OpLog is configured
    Format Tests
      Stringify Primitives
        ✔ should stringify null [null]
        ✔ should stringify empty string [""]
        ✔ should stringify empty array [[]]
        ✔ should stringify empty object [{}]
        ✔ should stringify [true]
        ✔ should stringify [3.14]
        ✔ should stringify ["Hello World!"]
      Equivalence with Javascript's JSON.stringify()
        ✔ should stringify null the same way
        ✔ should stringify empty string "" the same way
        ✔ should stringify empty array [] the same way
        ✔ should stringify empty object {} the same way
        ✔ should stringify true the same way
        ✔ should stringify 3.14 the same way
        ✔ should stringify "Hello World!" the same way
        ✔ should stringify complex objects in the same way
        ✔ should stringify (with whitespace) complex objects in the same way
        ✔ should escape a string value the same way
        ✔ should escape a field name the same way
        ✔ should produce output which JSON.parse() can read back
      Functionality Beyond Javascript's JSON.stringify()
        ✔ should stringify complex objects with Javascript syntax
    ResolveCandidates Tests
      ✔ It returns the value itself for an ordinary path
      ✔ It returns the document itself for an empty path
      ✔ It returns nothing for a field which is not there
      ✔ It offers an array and each of its elements
      ✔ It expands an array exactly one level
      ✔ It keeps a gathered value distinct from a real array
      ✔ It traverses an array at every path element
      ✔ It does not descend into an array inside an array without an index
      ✔ It indexes an array by number
      ✔ It does not index an array from the end
      ✔ It skips elements which cannot hold the field
      ✔ It resolves a path against an array document
      ✔ It rejects an invalid path
    SplitPath Tests
      ✔ It returns an array of path components
      ✔ It returns array indexes as numerics in the output array
      ✔ It only converts canonical integer text to an index
      ✔ It reaches fields whose names look numeric
      ✔ Array indexes within a path can be positive or negative
      ✔ If the path is undefined, null, or empty "", then it returns an empty array []
      ✔ It throws an error when an invalid path is given
    JoinPaths Tests
      ✔ It returns a combined path in dot-notation
      ✔ It allows numeric array indexes
      ✔ It allows document paths
      ✔ It allows an array of document paths
      ✔ Undefined and nulls are ignored
      ✔ It throws an error when an invalid path segment is given
    GetValue Tests
      ✔ It returns fields from a document
      ✔ It returns elements of an array
      ✔ It does not index an array from the end
      ✔ It returns fields from inside an array of objects
      ✔ It might return undefined array elements when missing data is encountered
      ✔ If the path is undefined, null, or empty "", then it returns the entire document
      ✔ If the path is specified but not found, it returns undefined
      ✔ It throws an error when an invalid path is given
    SetValue Tests
      ✔ It sets fields in a document
      ✔ It creates document fields if they don't exist
      ✔ It removes document fields when set to undefined
      ✔ It sets elements of an array
      ✔ It creates array elements and grows the array if the elements don't exist
      ✔ It refuses a negative array index
      ✔ It sets a document field which is literally named -1
      ✔ Array elements can be set to undefined, but they are not removed
      ✔ It sets fields inside an array of objects
      ✔ It rejects a field name against an array
      ✔ It still reads through an array by field name, which MongoDB does too
      ✔ It returns false when an empty path is given
      ✔ It throws an error when an invalid document is given
      ✔ It throws an error when an invalid path is given
    SafeClone Tests
      ✔ It can clone a simple object
      ✔ It can clone nested objects
      ✔ It can clone an array
      ✔ It can clone an array of objects
      ✔ It can clone non-value fields
      ✔ It can clone dates
      ✔ It can clone dates which are nested and within arrays
      ✔ It clones dates by value, not by reference
      ✔ It can clone a date given as the document itself
      ✔ It can selectively clone with the Exceptions parameter
      ✔ It should throw an error if an invalid Exceptions paramter is provided
    Flatten/Expand Tests
      ✔ It flattens a hierarchical document
      ✔ It preserves empty objects and arrays
      ✔ It round trips a document containing empty containers
      ✔ The flattened result does not alias its source
      ✔ A document which is itself an array expands back as an object
      ✔ An object whose keys are canonical integers expands back as an array
      ✔ Use Expand() to turn a flattened document back into a hierarchical document
      ✔ It should flatten an empty document
      ✔ It should expand an empty document
      ✔ It should flatten an array
      ✔ It should flatten an empty array
      ✔ It should not flatten a non-document
    Hybridize/Unhybridize Tests
      ✔ It hybridizes a hierarchical document
      ✔ Use Unhybridize() to turn a Hybridized document back into a hierarchical document
      ✔ It should Hybridize an empty document
      ✔ It should Unhybridize an empty document
      ✔ It Hybridizes and Unhybridizes a complex document
      ✔ It keeps a string which parses as JSON but is not an envelope
      ✔ It keeps an object which carries an unrecognized type name
      ✔ It keeps a plain string (7ms)
      ✔ It carries a value which is not a string across unchanged
      ✔ It round trips an Error with its message
      ✔ It round trips a function with its source
      ✔ It round trips a regular expression with its source and flags
      ✔ It round trips an object, an array, and a date
      ✔ It round trips an undefined value, keeping the field
      ✔ It reports a function which cannot be rebuilt from its source
    Sort Tests
      ✔ It sorts the caller's array in place and returns that same array
      ✔ It sorts an array of objects
      ✔ It sorts across multiple keys
      ✔ It sorts in reverse order
    CompareValues Tests
      ✔ should compare values of the same type
      ✔ should treat null and missing values as equivalent
      ✔ should order values of different types by MongoDB comparison order
      ✔ should compare dates by their timestamp
      ✔ should compare arrays element by element
      ✔ should compare objects field by field
    Sort Ordering Tests
      ✔ should sort documents which are missing the sort field, as null
      ✔ should sort values of different types by MongoDB comparison order
      ✔ should sort an array field by its smallest element when ascending
      ✔ should sort an array field by its largest element when descending
      ✔ should sort dates
      ✔ should sort a field holding an empty array below every other value
      ✔ should sort an empty array below a missing field
      ✔ should place an empty array last when sorting descending
      ✔ should still compare an empty array as an array outside of sorting
      ✔ should sort the array in place and return it
      ✔ should ignore sort fields with a direction of zero
    Sort Keys Through an Array Tests
      ✔ should reduce through every array the path crosses
      ✔ should expand only one level when the path crosses no array
      ✔ should expand a level for each array the path crosses
      ✔ should treat an empty array element as an ordinary array value
      ✔ should sort a field holding only an empty array with the arrays
      ✔ should sort an empty array reached through a path below every value
      ✔ should sort an empty array crossed by a path as null
      ✔ should order mixed types among the candidates by value order
      ✔ should still honor an explicit array index in the sort path
    Distinct Tests
      ✔ It gets a distinct array of objects
      ✔ It gets a distinct array using multiple keys
    Merge Tests
      ✔ It can merge with null objects
      ✔ It can merge with empty objects
      ✔ It can add new fields
      ✔ It can add new sub-fields
      ✔ It can update existing fields
      ✔ It can update existing sub-fields
      ✔ It requires both parameters to be objects
      ✔ It treats a missing document as an empty one
      ✔ It replaces arrays rather than merging them member-wise
      ✔ It treats null as a value rather than a deletion
      ✔ It skips undefined values rather than storing them
      ✔ It overwrites dates and regular expressions
      ✔ It handles a value which changes type
      ✔ It does not modify either of the given documents
      ✔ It is idempotent
    Storage Round-Trip Tests
      Valid JSON by default
        ✔ should omit an undefined field, as JSON.stringify does
        ✔ should write null for an undefined array element, as JSON.stringify does
        ✔ should omit a function and a symbol field, as JSON.stringify does
        ✔ should produce text which native JSON.parse accepts
      Typed Values
        ✔ should round-trip every ShortType
        ✔ should keep an undefined field apart from a null one
        ✔ should write the MongoDB Extended JSON date form
        ✔ should keep the milliseconds when there are some
        ✔ should write a time before the epoch in the canonical form
        ✔ should read the canonical form back as a date
        ✔ should not write tagged forms when TypedValues is off
      Strict
        ✔ should throw rather than return the text it could not read
        ✔ should throw on a value which cannot be represented
      Backward Compatibility
        ✔ should still read the positional boolean arguments
      Boundaries
        ✔ should state what happens to a regular expression carrying the g flag
      Compared with MongoDB Extended JSON
        ✔ should write a date exactly as the driver writes it
        ✔ should write a regular expression in the driver's form
        ✔ should differ from the driver on an undefined value, deliberately
        ✔ should differ from the driver on the g flag, deliberately

  110) Text Tests
    Compare Tests (case sensitive)
      ✔ should compare text
    Compare Tests (case insensitive)
      ✔ should compare text
    FindBetween Tests (case sensitive)
      ✔ should find the entire string
      ✔ should find text at start of string
      ✔ should find text in middle of string
    FindBetween Tests (case insensitive)
      ✔ should find the entire string
      ✔ should find text at start of string
      ✔ should find text in middle of string
    Matches Tests (case sensitive)
      ✔ should match entire string
      ✔ should match text at start of string
      ✔ should match text in middle of string
      ✔ should match text at end of string
    Matches Tests (case insensitive)
      ✔ should match entire string
      ✔ should match text at start of string
      ✔ should match text in middle of string
      ✔ should match text at end of string
    SearchReplacements Tests (case sensitive)
      ✔ should replace entire string
      ✔ should replace text at start of string
      ✔ should replace text in middle of string
      ✔ should replace text at end of string
      ✔ should replace multiple strings
    SearchReplacements Tests (case insensitive)
      ✔ should replace entire string
      ✔ should replace text at start of string
      ✔ should replace text in middle of string
      ✔ should replace text at end of string
      ✔ should replace multiple strings
    SearchReplace Tests (case sensitive)
      ✔ should replace entire string
      ✔ should replace text at start of string
      ✔ should replace text in middle of string
      ✔ should replace text at end of string
    SearchReplace Tests (case insensitive)
      ✔ should replace entire string
      ✔ should replace text at start of string
      ✔ should replace text in middle of string
      ✔ should replace text at end of string
    Regular Expression Characters in the Search Text
      ✔ should match a metacharacter as itself
      ✔ should not throw on a search text which is not a valid expression
      ✔ should never write the text undefined into the result
      ✔ should escape the search text when matching without regard to case
      ✔ should escape every key of a replacement map
      ✔ should return the text unchanged for an empty replacement map
      ✔ should reject parameters of the wrong type
      ✔ should reject Matches parameters of the wrong type
    Detached Function Tests
      ✔ should support SearchReplace when detached
      ✔ should support SearchReplace as a callback
      ✔ should support every Text function when detached
    Text Parameter Validation
      ✔ should refuse a Compare parameter which is not a string
      ✔ should refuse a FindBetween parameter which is not a string
      ✔ should treat a missing FindBetween delimiter as an empty one
      ✔ should return null when FindBetween cannot find a delimiter

  120) Date Handling Tests
    Data Types
      ✔ should give a Date its own short type
      ✔ should not classify numbers or strings which look like dates
      ✔ should report the date BSON type
      ✔ should convert dates with AsDate
      ✔ should treat a date as true
    Comparison and Equality
      ✔ should compare dates by their time value
      ✔ should order dates above booleans and below regular expressions
      ✔ should equate equal dates strictly
      ✔ should equate equal dates loosely, and only equal ones
      ✔ should not equate a date to a non-date
    Query
      ✔ should match a date field
      ✔ should support date range queries
      ✔ should support $ne on dates
      ✔ should support $in and $nin on dates
      ✔ should match a date within an array field
      ✔ should select dates with $type
      ✔ should support $expr on dates
    Filter and Sort
      ✔ should filter by date
      ✔ should sort by date
    Evaluate
      ✔ should return a literal date unchanged
      ✔ should resolve a date field reference
      ✔ should subtract two dates into milliseconds
      ✔ should add milliseconds to a date
      ✔ should compare dates within an expression
      ✔ should select the smallest and largest date
    Document Mechanics
      ✔ should clone dates by value with SafeClone
      ✔ should keep dates through Update
      ✔ should set a date with an update operator
      ✔ should keep dates through Merge
      ✔ should keep a date as a leaf value when flattening
      ✔ should round trip a date through Flatten and Expand
      ✔ should round trip a date through Hybridize and Unhybridize
      ✔ should format a date the way JSON.stringify does
      ✔ should not descend into a date when resolving a path
      ✔ should set a date as a value
    Projection
      ✔ should keep a date through an inclusion projection
      ✔ should keep a date through an exclusion projection
      ✔ should compute with a date in a projection
    Aggregate
      ✔ should carry dates through the pass-through stages
      ✔ should carry dates through the cloning stages
      ✔ should compute with dates in a pipeline
      ✔ should accumulate dates
      ✔ should group by a date, without confusing it for its ISO string
      ✔ should not modify a date in the input documents
    Snapshots
      ✔ should not report a difference between two equal dates
      ✔ should carry a date into the patch as a date, by value
      ✔ should apply and undo a date change, keeping the type
      ✔ should restore a removed date
      ✔ should not modify a date in either document
    Known Conversions
      ✔ should convert a date to a string with Clone, which uses stringify and parse
      ✔ should format a date as an ISO string, which Parse reads back as a string

  130) Engine Function Tests
    Default Settings Tests
      ✔ should not carry a PathExtensions setting
      ✔ should default the OpLog and OpError hooks to null
      ✔ should export a configured engine, not a factory
      ✔ should give a new engine its own operator registry
    Browser Globals
      ✔ should publish the module export rather than a second engine
      ✔ should publish the factory as well
      ✔ should share one operator registry between the two globals
    IsQuery Tests
      ✔ should identify an object which uses a query operator
      ✔ should not identify a plain document as a query
      ✔ should only inspect the top level of the object
      ✔ should return false for values which are not objects
    Filter Tests
      ✔ should return only the documents which match
      ✔ should return an empty array when nothing matches
      ✔ should match everything with an empty query
      ✔ should filter an empty array
      ✔ should support query operators
      ✔ should return the original document objects, not copies
      ✔ should let a write through the result reach the source document
      ✔ should return a new array, so the result can be reordered safely
      ✔ should not modify the array it was given
      ✔ should throw when the parameters are wrong
    Distinct Tests
      ✔ should return one entry per unique value
      ✔ should treat a combination of fields as the unique key
      ✔ should support nested field paths
      ✔ should return only the fields named in the criteria
      ✔ should return an empty array for no documents
      ✔ should throw when the parameters are wrong
      ✔ should not run one field value into the next when building the key
      ✔ should not run one string value into the next when building the key
      ✔ should distinguish a date from its ISO string
      ✔ should distinguish a number from its text
      ✔ should not alias the given documents
      ✔ should preserve a date in the returned values
    Update Tests
      ✔ should apply an update operator
      ✔ should apply several update operators in one call
      ✔ should return a copy and leave the original document unchanged
      ✔ should return the document unchanged when there are no updates
      ✔ should refuse an unknown update operator
      ✔ should refuse an update document which is not made of operators
      ✔ should refuse two operators which write to conflicting paths
      ✔ should allow two operators which write to different paths
      ✔ should leave the document untouched when it refuses
      ✔ should return null when the parameters are wrong
    StrictEquals and LooseEquals Tests
      ✔ should compare primitives strictly
      ✔ should compare primitives loosely
      ✔ should equate null and undefined
      ✔ should compare objects by value
      ✔ should require key order to match strictly, but not loosely
      ✔ should compare arrays by value
      ✔ should not equate an object with one which has more keys
      ✔ should answer the same in either order
      ✔ should equate a null member with a missing member, unlike StrictEquals
      ✔ should not match an array by one of its elements, unlike the $eqx operator
      ✔ should ignore element order loosely
      ✔ should compare dates and regular expressions by value
    BsonType Tests
      ✔ should return the BSON type number and alias
      ✔ should distinguish integers from doubles
      ✔ should report dates as the date BSON type
      ✔ should work when detached from the engine
      ✔ should work when passed as a callback
      ✔ should report NaN and the infinities as doubles
      ✔ should report an integer inside the int32 range as an int
      ✔ should report a number outside the int32 range as a double
    CompareValues Tests
      ✔ should order NaN below every other number
      ✔ should keep NaN within the number type rank
      ✔ should give Sort a total order when a NaN is present
    StrictEquals Symmetry Tests
      ✔ should be symmetric
      ✔ should leave the $eq query operator alone
      ✔ should let Diff see a change between those values
      ✔ should still compare ordinary values as before
    Clone Tests
      ✔ should copy a document by value
      ✔ should not share nested structure with the original
    Expand Tests
      ✔ should expand dot notation into nested objects
      ✔ should expand numeric path elements into arrays
      ✔ should reverse Flatten
    DeleteValue Tests
      ✔ should remove a field
      ✔ should remove the key rather than setting it to undefined
      ✔ should remove a nested field, leaving its parent
      ✔ should remove a field from an array document
      ✔ should leave a hole rather than shortening an array
      ✔ should return false for a field which was not there
      ✔ should report a field holding undefined as present
      ✔ should not reach into an array by field name
      ✔ should refuse a negative array index
      ✔ should accept a numeric path
      ✔ should return false for an empty path
      ✔ should return false when the parent path does not resolve
      ✔ should throw when the document is not an object or array
      ✔ should throw when the path is not a string or a number
    CompareValues Ordering Tests
      ✔ should order values of different types by the BSON type order
      ✔ should compare arrays element-wise
      ✔ should break an array tie on length
      ✔ should compare objects by their key names
      ✔ should compare objects by their values when the keys match
      ✔ should break an object tie on key count
      ✔ should treat null and missing values as equivalent
      ✔ should compare dates by their time value
    Javascript Values Which BSON Has No Place For
      ✔ should name a symbol and an undefined in ShortType
      ✔ should return a symbol from SafeClone as it is
      ✔ should clone a null and a string as themselves
      ✔ should give a BsonType for a symbol and none for a function
      ✔ should refuse to compare a value which has no place in the ordering
      ✔ should carry a symbol through a Hybridize round trip
    Engine Function Paths and Criteria
      ✔ should compare two regular expressions by their text
      ✔ should return false from SetValue for a path which names nothing
      ✔ should refuse a SortCriteria which is not an object
      ✔ should sort a document whose key path runs past the end of an array
      ✔ should keep the order of two documents which both offer no sort key
      ✔ should refuse a data type it has no ShortType for
      ✔ should take the SafeClone exceptions in every form
      ✔ should leave an excepted path uncloned
      ✔ should except a path which names an array element
      ✔ should sort documents which offer no key below those which do
      ✔ should format a value which JSON has no representation for
      ✔ should take a ResolveCandidates path in every form

  140) Snapshot Tests
    Diff Tests
      ✔ should return an empty patch for identical documents
      ✔ should ignore key order
      ✔ should set a changed field
      ✔ should set an added field
      ✔ should unset a removed field
      ✔ should describe a change at the deepest path which changed
      ✔ should describe several changes at once
      ✔ should not distinguish a key holding undefined from a missing key
      ✔ should set a field which changed to null
      ✔ should not confuse values of different types
      ✔ should throw when either parameter is not an object
    Diff Array Tests
      ✔ should replace an array whose element changed
      ✔ should replace an array which grew
      ✔ should replace an array which shrank
      ✔ should emit nothing for an unchanged array
      ✔ should treat element order as a change
      ✔ should not alias the array it emits
    Diff Object Tests
      ✔ should set a whole object which was added
      ✔ should set an empty object which was added
      ✔ should unset the keys of an object which was emptied, leaving the object
      ✔ should unset a whole object which was removed
      ✔ should set the whole value when the type changed
      ✔ should not alias the object it emits
    Diff Date Tests
      ✔ should emit nothing for two equal dates
      ✔ should set a changed date
      ✔ should clone the date it emits
      ✔ should not confuse a date with its ISO string
    Invert Tests
      ✔ should undo a changed field
      ✔ should undo an added field by unsetting it
      ✔ should undo a removed field by setting it back
      ✔ should return an empty patch when the patch changed nothing
      ✔ should undo a nested change
      ✔ should throw when Before is not an object
      ✔ should throw when the patch is not a valid update document
    Invert Tests: patches which Diff did not write
      ✔ should undo $inc
      ✔ should undo $mul
      ✔ should undo $push
      ✔ should undo $pop
      ✔ should undo $rename
      ✔ should undo $min and $max
      ✔ should undo several operators at once
    Round Trip Properties
      ✔ should round trip: no change
      ✔ should round trip: scalar change
      ✔ should round trip: field added
      ✔ should round trip: field removed
      ✔ should round trip: nested change
      ✔ should round trip: nested removal
      ✔ should round trip: object emptied
      ✔ should round trip: object filled
      ✔ should round trip: object removed
      ✔ should round trip: type change
      ✔ should round trip: null introduced
      ✔ should round trip: array changed
      ✔ should round trip: array emptied
      ✔ should round trip: array of objects
      ✔ should round trip: dates
      ✔ should round trip: date removed
      ✔ should round trip: deeply nested
      ✔ should round trip: nothing in common
      ✔ should round trip: empty to full
      ✔ should round trip: full to empty
      ✔ should leave a real Date in place through a round trip
      ✔ should remove the key of an unset field, not merely blank it
    Immutability
      ✔ should not modify either document given to Diff
      ✔ should not modify the document given to Invert
      ✔ should not alias the documents it was given

  150) Error Handling Tests
    OpError Reporting
      ✔ should report a Diff failure to the OpError log, and rethrow
      ✔ should report a Invert failure to the OpError log, and rethrow
      ✔ should report a Aggregate failure to the OpError log, and rethrow
      ✔ should report a Filter failure to the OpError log, and rethrow
      ✔ should report a Sort failure to the OpError log, and rethrow
      ✔ should report a Distinct failure to the OpError log, and rethrow
      ✔ should report a Evaluate failure to the OpError log, and rethrow
      ✔ should report a Flatten failure to the OpError log, and rethrow
      ✔ should report a Expand failure to the OpError log, and rethrow
      ✔ should report a GetValue failure to the OpError log, and rethrow
      ✔ should report a SetValue failure to the OpError log, and rethrow
      ✔ should report a DeleteValue failure to the OpError log, and rethrow
      ✔ should report a SplitPath failure to the OpError log, and rethrow
      ✔ should report a JoinPaths failure to the OpError log, and rethrow
      ✔ should stay silent when no OpError is configured
    Declared Type Checking
      ✔ should declare types which every operator actually accepts
      ✔ should give every operator a declaration to check against
      ✔ should reject a query value the operator does not take
      ✔ should refuse an update operator whose value it does not take
      ✔ should throw for a stage argument it does not take
      ✔ should throw for an expression argument it does not take
      ✔ should throw for an accumulator argument it does not take
      ✔ should let a declared type through
    Expression Operator Argument Validation
      ✔ should reject a non-array argument to $eq
      ✔ should reject the wrong argument count to $eq
      ✔ should reject a non-array argument to $ne
      ✔ should reject the wrong argument count to $ne
      ✔ should reject a non-array argument to $gt
      ✔ should reject the wrong argument count to $gt
      ✔ should reject a non-array argument to $gte
      ✔ should reject the wrong argument count to $gte
      ✔ should reject a non-array argument to $lt
      ✔ should reject the wrong argument count to $lt
      ✔ should reject a non-array argument to $lte
      ✔ should reject the wrong argument count to $lte
      ✔ should reject a non-array argument to $cmp
      ✔ should reject the wrong argument count to $cmp
      ✔ should reject a malformed $cond
      ✔ should reject a malformed $switch
      ✔ should reject a malformed $ifNull
      ✔ should reject two date operands to $add
    Update Operator Argument Validation
      ✔ should cover every registered update operator
      ✔ should reject a non-object UpdateFields for $set
      ✔ should reject a non-object UpdateFields for $unset
      ✔ should reject a non-object UpdateFields for $rename
      ✔ should reject a non-object UpdateFields for $inc
      ✔ should reject a non-object UpdateFields for $min
      ✔ should reject a non-object UpdateFields for $max
      ✔ should reject a non-object UpdateFields for $mul
      ✔ should reject a non-object UpdateFields for $bit
      ✔ should reject a non-object UpdateFields for $currentDate
      ✔ should reject a non-object UpdateFields for $addToSet
      ✔ should reject a non-object UpdateFields for $pop
      ✔ should reject a non-object UpdateFields for $push
      ✔ should reject a non-object UpdateFields for $pullAll
      ✔ should reject a non-object UpdateFields for $pull
    Operator OpError Reporting
      ✔ should report from every expression operator which rejects its argument (116ms)
      ✔ should report from every update operator which rejects its argument (8ms)
      ✔ should report from every accumulator which rejects its argument (14ms)
      ✔ should report from every stage which rejects its argument (16ms)
      ✔ should report from the query operators which reject their argument (24ms)
    Aggregation Argument Validation
      ✔ should reject a non-array Documents to every accumulator
      ✔ should reject a document in the pipeline which is not an object
      ✔ should reject a malformed argument to every stage
    Operators Called Directly
      ✔ should answer false for a $type value which is not a number, string or array
      ✔ should answer false for a $regex value which is not a string or regexp
      ✔ should run a query handed directly to $ImplicitEq
    Query Parameters
      ✔ should return false when the document is not an object
      ✔ should refuse a criteria which is not an object
      ✔ should refuse an implicit $eq against undefined

  160) Variable Scope Tests
    Building a Frame
      ✔ should build an empty frame with no parent
      ✔ should take null as no parent
      ✔ should refuse variables which are not a document
      ✔ should refuse a parent which is not a scope or null
      ✔ should copy the bindings rather than hold them
      ✔ should keep a binding whose value is nothing
    Resolving a Name
      ✔ should resolve a name bound in this frame
      ✔ should report an unbound name as not found
      ✔ should distinguish a name bound to nothing from an unbound name
      ✔ should not resolve a name inherited from Object.prototype
      ✔ should resolve a name bound in an outer frame
      ✔ should resolve the innermost binding of a shadowed name
      ✔ should leave the outer frame alone when an inner one shadows it
      ✔ should walk more than one frame to find a name
    The Signature Contract
      ✔ should take a scope on every expression operator
      ✔ should take a scope on every stage operator
      ✔ should take a scope on every accumulator
    The System Frames
      ✔ should bind NOW and REMOVE on a pipeline frame
      ✔ should take the instant it is given
      ✔ should read the clock when it is given anything else
      ✔ should bind ROOT and CURRENT on a document frame
      ✔ should share one instant across every document of a pipeline
      ✔ should make its own pipeline frame when it is given none
      ✔ should let a binding frame shadow a system name
    Scope Storage
      ✔ should answer every name the same way after a round trip
      ✔ should keep a variable bound to nothing apart from an unbound one
      ✔ should bring $$NOW back as a date and not as a string
      ✔ should keep the frames chained rather than flattened
      ✔ should restore the methods, which are the engine's and are never stored
      ✔ should evaluate an expression to the same answer after a round trip
      ✔ should take a scope which has no parent

  200) Comparison Operator Tests
    $eq Tests
      ✔ should equate boolean values
      ✔ should not equate boolean values and numeric values
      ✔ should not equate boolean values and string values
      ✔ should equate numeric values
      ✔ should not equate numeric values and string values
      ✔ should equate string values
      ✔ should equate null values
      ✔ should equate object values
      ✔ should equate object values, but values must be strictly === to each other
      ✔ should equate complex object
      ✔ should equate complex arrays
      ✔ should not equate object values with keys in different order
      ✔ should equate array values
      ✔ should not equate arrays with elements in different order
      ✔ should equate arrays, but values must be strictly === to each other
      ✔ should not equate function values
      ✔ should equate undefined values
      ✔ should equate null and undefined values
      ✔ should equate two regexp values with the same source and flags
      ✔ should not equate regexp values which differ in source or flags
      ✔ should not pattern match a string with a regexp match value
      ✔ should not equate a regexp with a non-regexp value
      ✔ should match through a path which crosses an array
      ✔ should match an array field by element or as a whole
      ✔ should match through two levels of array
      ✔ should not descend into an array inside an array without an index
      ✔ should match null against a field which is not there
      ✔ should tell a gathered value from a real array
    $eqx Tests
      ✔ should equate boolean values
      ✔ should equate boolean values and numeric values
      ✔ should equate boolean values and string values
      ✔ should equate numeric values
      ✔ should equate numeric values and string values
      ✔ should equate string values
      ✔ should equate null values
      ✔ should equate object values
      ✔ should equate object values and values can be loosely == to each other
      ✔ should equate object values with keys in different order
      ✔ should equate complex object
      ✔ should equate complex arrays
      ✔ should equate array values
      ✔ should equate arrays with elements in different order
      ✔ should equate arrays and values can be loosely == to each other
      ✔ should not equate function values
      ✔ should equate undefined values
      ✔ should equate null and undefined values
      ✔ should match an element of an array field, as $eq does
      ✔ should follow a path which crosses an array, as $eq does
      ✔ should match a missing field against null, as $eq does
      ✔ should coerce where $eq does not
      ✔ should take ExpandArrays, as $eq does
    $ne Tests
      ✔ should equate boolean values
      ✔ should not equate boolean values and numeric values
      ✔ should not equate boolean values and string values
      ✔ should equate numeric values
      ✔ should not equate numeric values and string values
      ✔ should equate string values
      ✔ should equate null values
      ✔ should equate object values
      ✔ should equate object values, but values must be strictly === to each other
      ✔ should not equate object values with keys in different order
      ✔ should equate array values
      ✔ should not equate arrays with elements in different order
      ✔ should equate arrays, but values must be strictly === to each other
      ✔ should not equate function values
      ✔ should equate undefined values
      ✔ should equate null and undefined values
    $nex Tests
      ✔ should equate boolean values
      ✔ should equate boolean values and numeric values
      ✔ should equate boolean values and string values
      ✔ should equate numeric values
      ✔ should equate numeric values and string values
      ✔ should equate string values
      ✔ should equate null values
      ✔ should equate object values
      ✔ should equate object values and values can be loosely == to each other
      ✔ should equate object values with keys in different order
      ✔ should equate array values
      ✔ should equate arrays with elements in different order
      ✔ should equate arrays and values can be loosely == to each other
      ✔ should not equate function values
      ✔ should equate undefined values
      ✔ should equate null and undefined values
    $gte Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should compare objects
      ✔ should compare arrays
      ✔ should not compare functions
      ✔ should compare undefined values
      ✔ should compare null and undefined values
      ✔ should match through a path which crosses an array
      ✔ should reach the elements of a field which holds an array
      ✔ should satisfy a null match value with a missing field
    $gt Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should not compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should compare objects
      ✔ should compare arrays
      ✔ should not compare functions
      ✔ should not compare undefined values
      ✔ should not compare null and undefined values
      ✔ should match through a path which crosses an array
      ✔ should reach the elements of a field which holds an array
      ✔ should bracket the comparison by type
      ✔ should not match a missing field
    $lte Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should compare objects
      ✔ should compare arrays
      ✔ should not compare functions
      ✔ should compare undefined values
      ✔ should compare null and undefined values
      ✔ should match through a path which crosses an array
      ✔ should reach the elements of a field which holds an array
      ✔ should satisfy a null match value with a missing field
    $lt Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should not compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should compare objects
      ✔ should compare arrays
      ✔ should not compare functions
      ✔ should not compare undefined values
      ✔ should not compare null and undefined values
      ✔ should match through a path which crosses an array
      ✔ should reach the elements of a field which holds an array
      ✔ should bracket the comparison by type
      ✔ should not match a missing field
    $in Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should compare objects
      ✔ should compare arrays
      ✔ should not compare functions
      ✔ should compare undefined values
      ✔ should treat null and undefined as equivalent
    Implicit Equality Tests
      ✔ should match through two levels of array
      ✔ should agree with the explicit form
      ✔ should not descend into an array inside an array without an index
    $regex Tests
      ✔ should pattern match a string field
      ✔ should pattern match the elements of an array field
      ✔ should apply the flags given by $options
      ✔ should refuse $options without a $regex beside it
      ✔ should refuse $options which is not a string
      ✔ should refuse $options beside a regexp which carries its own flags
      ✔ should refuse a flag which is not valid
      ✔ should test each document independently of the last
      ✔ should match a regexp field only when it is the same regexp
      ✔ should not pattern match a non string value
    $type Tests
      ✔ should match a type by alias and by number
      ✔ should accept a list of types
      ✔ should treat number as an alias for every numeric type
      ✔ should find an array field with the array type
      ✔ should also match the types of an array field elements
      ✔ should match through a path which crosses an array
      ✔ should reach the elements of a field which holds an array
      ✔ should not match a missing field
      ✔ should match a Date by alias and by number
      ✔ should distinguish int from double and never report long
    $all Tests
      ✔ should require every value to be present
      ✔ should select against a field which is not an array
      ✔ should match a field which really holds an array
      ✔ should gather values from across array elements
      ✔ should match an element which is itself an array
      ✔ should select nothing for an empty match array
      ✔ should not match a missing field
      ✔ should reject a non array match value
      ✔ should not appear at the top level of a query
    $size Tests
      ✔ should measure an array field
      ✔ should not measure a value which is not an array
      ✔ should not measure a value gathered from array elements
      ✔ should measure a field which really holds an array
      ✔ should reject a non numeric match value
    $exists Tests
      ✔ should find a field which is there
      ✔ should not find a field which is not there
      ✔ should find a field holding null
      ✔ should find a field through a path which crosses an array
      ✔ should not find a field which no array element holds
      ✔ should not find a field below an array inside an array
      ✔ should treat a field holding undefined as present
      ✔ should coerce a non boolean match value rather than rejecting it
    Date Comparison Tests
      ✔ should equate dates with $eq
      ✔ should equate dates with $eqx
      ✔ should not equate a date to a non-date
      ✔ should differentiate dates with $ne and $nex
      ✔ should order dates with $gt and $gte
      ✔ should order dates with $lt and $lte
      ✔ should find dates with $in and $nin
      ✔ should not compare a date against a value of another type
    ImplicitEq Type Combination Tests
      ✔ should not match a primitive field against an array
      ✔ should not match a primitive field against an object
      ✔ should find a date within an array holding other types
      ✔ should match a regular expression when any element of an array matches
      ✔ should not match a regular expression when no element of an array matches
      ✔ should filter documents by a regular expression on an array field
      ✔ should match an object field against an object
      ✔ should return false for a type pairing it cannot compare
    eqx Type Combination Tests
      ✔ should not equate a date to a non-date
      ✔ should not equate a primitive to a non-primitive
      ✔ should not equate arrays of different lengths
      ✔ should equate arrays holding the same values in a different order
      ✔ should not equate arrays of the same length holding different values

  210) Logical Operator Tests
    $and Tests
      ✔ should refuse an empty list of conditions
      ✔ should be true when all of its conditions are true
      ✔ should be false when one of its conditions is false
    $or Tests
      ✔ should refuse an empty list of conditions
      ✔ should be true when one of its conditions are true
      ✔ should be false when all of its conditions are false
    $nor Tests
      ✔ should refuse an empty list of conditions
      ✔ should be true when none of its conditions are true
      ✔ should be false when one of its conditions is true
    $noop Tests
      ✔ should ignore a commented out clause at the top level of a query
      ✔ should not affect the rest of the query
      ✔ should ignore a commented out clause within a field
      ✔ should accept any value
      ✔ should still reject an undefined value
      ✔ should be callable directly

  220) Expression Operator Tests
    Evaluate Tests
      ✔ should resolve field references
      ✔ should resolve missing field references to undefined
      ✔ should treat non-$ values as literals
      ✔ should return literal values with $literal, without evaluating them
      ✔ should evaluate arrays element-wise
      ✔ should evaluate the field values of an expression object
      ✔ should throw when an expression operator is not recognized
      ✔ should throw when a variable is not defined
      ✔ should throw when a variable reference names nothing
      ✔ should resolve the system variables without being given a scope
      ✔ should resolve a variable it is given a scope for
      ✔ should carry a scope down through an operator
      ✔ should gather a field reference through an array
      ✔ should omit elements which do not have the field
      ✔ should evaluate a reference to a missing field as undefined
      ✔ should keep a field which really holds an array whole
      ✔ should gather through two levels of array
      ✔ should not index an array by number
      ✔ should read a document field which is literally named with a number
      ✔ should leave GetValue reading the same way it always has
    $add Tests
      ✔ should add numbers
      ✔ should add zero
      ✔ should return null when an operand is null or missing
      ✔ should add milliseconds to a date
      ✔ should throw when an operand is not numeric
      ✔ should be callable directly from the operator registry
    $subtract Tests
      ✔ should subtract numbers
      ✔ should return the milliseconds between two dates
      ✔ should subtract milliseconds from a date
      ✔ should return null when an operand is null or missing
      ✔ should throw when the argument count is wrong
    $multiply Tests
      ✔ should multiply numbers
      ✔ should multiply by zero
      ✔ should return null when an operand is null or missing
    $divide Tests
      ✔ should divide numbers
      ✔ should return zero when the dividend is zero
      ✔ should return null when an operand is null or missing
      ✔ should throw when dividing by zero
    $mod Tests
      ✔ should return the remainder
      ✔ should throw when dividing by zero
    $abs Tests
      ✔ should return the absolute value
      ✔ should accept a single argument within an array
      ✔ should return null when the operand is null or missing
    $min and $max Tests
      ✔ should select the smallest and largest values
      ✔ should select from the values of a single array operand
      ✔ should ignore null and missing values
      ✔ should return null when all of the values are null or missing
      ✔ should select zero, which is a value and not a missing value
    $eq and $ne Tests
      ✔ should compare primitive values
      ✔ should not equate values of different types
      ✔ should not equate a null and a missing value
      ✔ should compare document fields to each other
      ✔ should compare arrays and objects by value
      ✔ should throw when the argument count is wrong
    $gt, $gte, $lt, $lte, and $cmp Tests
      ✔ should compare numbers
      ✔ should compare document fields to each other
      ✔ should return -1, 0, and 1 from $cmp
      ✔ should order values of different types
      ✔ should agree with $eq when values are equal
      ✔ should compare dates
    $and, $or, and $not Tests
      ✔ should evaluate logical expressions
      ✔ should treat false, zero, null, and missing values as false
      ✔ should treat the empty string and the empty array as true
      ✔ should combine comparison expressions
    $cond Tests
      ✔ should select a branch using the array form
      ✔ should select a branch using the object form
      ✔ should not evaluate the branch which is not selected
      ✔ should throw when the argument count is wrong
    $ifNull Tests
      ✔ should return the first value which is not null or missing
      ✔ should accept more than two expressions
      ✔ should return zero rather than treating it as a missing value
    $switch Tests
      ✔ should return the first matching branch
      ✔ should throw when no branch matches and no default was given
      ✔ should throw when the branches are malformed
    $ceil and $floor Tests
      ✔ should round up to the next integer with $ceil
      ✔ should round down to the previous integer with $floor
    $round Tests
      ✔ should round half to even
      ✔ should round to a positive decimal place
      ✔ should round to a negative place, left of the decimal point
    $trunc Tests
      ✔ should discard the digits past the decimal point
      ✔ should truncate to a positive decimal place
      ✔ should truncate to a negative place, left of the decimal point
    $size (expression) Tests
      ✔ should return the length of an array
      ✔ should throw when the operand is not an array
    $arrayElemAt Tests
      ✔ should return the element at a position
      ✔ should count a negative position back from the end
      ✔ should give a missing value for a position outside the array
    $concatArrays Tests
      ✔ should join arrays end to end
    $in (expression) Tests
      ✔ should be true when the array holds the value
    $bsonSize Javascript Value Tests
      ✔ should not count a field which is undefined
      ✔ should refuse a value which has no encoding
    Numeric Conversion Type Boundary Tests
      ✔ should convert the value correctly, which is the part that matters
      ✔ should report a number type from the value, not from the conversion
      ✔ should never report a number as a long
    $literal Tests
      ✔ should return a $-string as text rather than as a field reference
      ✔ should return an operator-shaped document as data
    System Variables Without a Scope Tests
      ✔ should resolve $$ROOT and $$CURRENT against the document it was handed
      ✔ should read the $getField shorthand from that same document
      ✔ should remove a field with a $setField value of $$REMOVE
      ✔ should remove the same field with $unsetField
      ✔ should bind a variable with $let and fold an array with $reduce
      ✔ should still refuse a variable nobody bound

  230) Accumulator Operator Tests
    $sum Tests
      ✔ should sum the numeric values in a group
      ✔ should count the documents in a group with $sum: 1
      ✔ should sum the result of an expression
      ✔ should ignore non-numeric values
      ✔ should not coerce numeric strings
      ✔ should return zero for an empty group
      ✔ should return zero when nothing in the group is numeric
      ✔ should ignore what the expression operator $add throws on
    $avg Tests
      ✔ should average the numeric values in a group
      ✔ should ignore non-numeric values, and not count them in the divisor
      ✔ should return null for an empty group
      ✔ should return null when nothing in the group is numeric
      ✔ should ignore what the expression operator $add throws on
    $min Tests
      ✔ should return the smallest value in a group
      ✔ should ignore null and missing values
      ✔ should order mixed types by the BSON type order
      ✔ should return null for an empty group
      ✔ should return null when every value is null or missing
    $max Tests
      ✔ should return the largest value in a group
      ✔ should ignore null and missing values
      ✔ should order mixed types by the BSON type order
      ✔ should return null for an empty group
      ✔ should return null when every value is null or missing
    $count Tests
      ✔ should count the documents in a group
      ✔ should return zero for an empty group
      ✔ should throw when the argument is not an empty object
    $push Tests
      ✔ should collect every value in group order
      ✔ should keep nulls
      ✔ should not push a missing value
      ✔ should push the result of an expression
      ✔ should return an empty array for an empty group
    $first Tests
      ✔ should return the value from the first document in the group
      ✔ should return null when the first value is null
      ✔ should return a missing value when the first document does not have the field
      ✔ should return null for an empty group
    $last Tests
      ✔ should return the value from the last document in the group
      ✔ should return null when the last value is null
      ✔ should return a missing value when the last document does not have the field
      ✔ should return null for an empty group
    $addToSet Tests
      ✔ should collect the distinct values, compared by content
      ✔ should recognize an equal document as already present
      ✔ should keep a null and skip a missing value
      ✔ should return an empty array for an empty group

  240) Aggregate Stage Tests
    Pipeline Dispatch
      ✔ should return the documents when the pipeline is empty
      ✔ should run the stages in order
      ✔ should throw when Documents is not an array
      ✔ should throw when Pipeline is not an array
      ✔ should throw when a stage is not an object
      ✔ should throw when a stage has more than one key
      ✔ should throw when a stage is not recognized
    $match Tests
      ✔ should select the matching documents
      ✔ should support $expr
      ✔ should not clone the selected documents
      ✔ should throw when the argument is not an object
    $project Tests
      ✔ should include fields
      ✔ should exclude fields
      ✔ should compute fields from expressions
      ✔ should clone the documents it emits
      ✔ should throw when the projection is not valid
      ✔ should throw when the argument is not an object
    $addFields and $set Tests
      ✔ should add a computed field, keeping the existing fields
      ✔ should overwrite an existing field
      ✔ should not add a field whose expression evaluates to a missing value
      ✔ should evaluate every expression against the original document
      ✔ should set a nested field
      ✔ should clone the documents it emits
      ✔ should clone a field added from a field reference
      ✔ should keep a date on a field added from a field reference
      ✔ should behave identically as $set
      ✔ should throw when the argument is not an object
    $unwind Tests
      ✔ should emit one document per array element
      ✔ should emit a non-array value once, unchanged
      ✔ should emit nothing for an empty array, a null, or a missing field
      ✔ should preserve empty arrays, nulls, and missing fields when asked to
      ✔ should include the array index when asked to
      ✔ should set the array index to null for a document which was not unwound
      ✔ should unwind a nested path
      ✔ should clone the documents it emits
      ✔ should throw when the path does not begin with a $
      ✔ should throw when the argument is not a string or an object
      ✔ should throw when the options are not valid
    $group Tests
      ✔ should group the documents by a field
      ✔ should gather every document into one group with a null _id
      ✔ should group by a computed expression
      ✔ should group a missing group key with the nulls
      ✔ should not group values of different types together
      ✔ should emit the groups in the order they were first seen
      ✔ should support several accumulators at once
      ✔ should write a null for a field whose accumulated value is missing
      ✔ should not alias the documents it grouped
      ✔ should throw when _id is not given
      ✔ should throw when a field is not an accumulator object
      ✔ should throw when an accumulator is not recognized
      ✔ should throw when the argument is not an object
    $sort Tests
      ✔ should sort ascending and descending
      ✔ should sort documents which are missing the sort field as though it were null
      ✔ should sort mixed types by the BSON type order
      ✔ should sort by several fields
      ✔ should reduce an array sort field to one key, smallest ascending and largest descending
      ✔ should leave the input array ordering untouched
      ✔ should throw when the argument is not an object
    $limit and $skip Tests
      ✔ should limit the documents
      ✔ should skip the documents
      ✔ should throw when the count is not a non-negative integer
    Input Immutability
      ✔ should not modify the input array or its documents
      ✔ should not reorder the input array when sorting it
      ✔ should not reorder the array given to the $sort stage directly
      ✔ should carry dates through the pipeline as dates

  250) Update Operator Tests
    Field Update Operator Tests
      $set Tests
        ✔ should set values
        ✔ should set nested values
        ✔ should not alias the update document
        ✔ should apply the same update document twice independently
        ✔ should store a date as a date
      $unset Tests
        ✔ should unset values
        ✔ should set nested values
        ✔ should null an array element rather than leaving a hole
        ✔ should leave an array alone for a negative index
        ✔ should null an element of an array reached through an index
        ✔ should remove a numeric key from an object rather than nulling it
        ✔ should leave an array alone for an index which is out of range
        ✔ should leave the document alone for a path which runs below a scalar
        ✔ should not reach into an array by field name to find an element
        ✔ should leave an array alone for a negative index part way along the path
        ✔ should leave the document alone for an empty path
      $bit Tests
        ✔ should report a write it could not make
      $rename Tests
        ✔ should leave a source field which is not there alone
        ✔ should rename values
        ✔ should rename nested values
        ✔ should move values and create topography
      $inc Tests
        ✔ should increment values
        ✔ should increment nested values
        ✔ should decrement values
      $inc and $mul Refusal Tests
        ✔ should refuse a field which is not numeric
        ✔ should refuse an operand which is not numeric
        ✔ should refuse the whole update when one field of several is bad
      $min Tests
        ✔ should set min values
        ✔ should set min nested values
        ✔ should set a field which is not there
        ✔ should compare strings
        ✔ should compare dates
        ✔ should compare booleans
        ✔ should treat null as lower than any number
        ✔ should compare across types by the BSON ordering
        ✔ should reject a path which reaches into an array
        ✔ should not alias the update specification
      $max Tests
        ✔ should set min values
        ✔ should set min nested values
        ✔ should set a field which is not there
        ✔ should compare strings
        ✔ should compare dates
        ✔ should treat null as lower than any number
        ✔ should compare across types by the BSON ordering
        ✔ should reject a path which reaches into an array
      $mul Tests
        ✔ should multiply values
        ✔ should multiply nested values
      $currentDate Tests
        ✔ should set the current date
        ✔ should set the current date for nested values
        ✔ should give each field its own Date rather than a shared one
        ✔ should store a value which answers to a date query
        ✔ should report an invalid date specification and fail
        ✔ should apply the valid fields even when another one is invalid
    Array Update Operator Tests
      $addToSet Tests
        ✔ should add to a set of values
        ✔ should not add to a set of values if the value already exists
        ✔ should compare values by content rather than by reference
        ✔ should still add a value which differs in content
        ✔ should compare strictly, without type coercion
        ✔ should be idempotent
        ✔ should store a copy rather than the value it was given
        ✔ should add every new element of $each
        ✔ should not add a value repeated within one $each
        ✔ should test the elements of $each by content
        ✔ should treat an object with no $each as a single value
        ✔ should reject a $each which is not an array
        ✔ should not alias the update document through $each
      $pop Tests
        ✔ should remove from the end of an array
        ✔ should remove from the beginning of an array
      $push Tests
        ✔ should push values to the end of an array
        ✔ should not alias the update document
        ✔ should push a date as a date
        ✔ should treat an object with no $each as a single value
        ✔ should push every element of $each
        ✔ should insert at $position
        ✔ should sort with $sort
        ✔ should trim with $slice
        ✔ should apply $sort before $slice
        ✔ should store a modifier written without $each as a value
        ✔ should reject a malformed modifier rather than storing it
        ✔ should not alias the update document through $each
        ✔ should keep a date pushed through $each
        ✔ should append a document without $each as a value, not read it as a modifier
        ✔ should reject an unrecognized $ field within a modifier document
      $pullAll Tests
        ✔ should pull values from the array
        ✔ should pull an object by its content
        ✔ should pull an array by its content
        ✔ should pull a date by its value
        ✔ should pull every instance of a value
        ✔ should not pull a value which only looks alike
        ✔ should leave the array alone when nothing matches
        ✔ should work through the Update function
    OpLog Failure Paths
      ✔ should log rather than throw when $set cannot store its value
      ✔ should log rather than throw when $unset cannot store its value
      ✔ should log rather than throw when $rename cannot store its value
      ✔ should log rather than throw when $inc cannot store its value
      ✔ should log rather than throw when $min cannot store its value
      ✔ should log rather than throw when $max cannot store its value
      ✔ should log rather than throw when $mul cannot store its value
      ✔ should log rather than throw when $currentDate cannot store its value
      ✔ should log rather than throw when $addToSet cannot store its value
      ✔ should log rather than throw when $pop cannot store its value
      ✔ should log rather than throw when $pullAll cannot store its value
      ✔ should log rather than throw when $push cannot store its value

  260) Extension Operator Tests
    $exprx Query Tests
      ✔ should evaluate against the entire document at the top level
      ✔ should evaluate against a sub-document when used within a field
      ✔ should match when any element of an array sub-document matches
      ✔ should not match when no element of an array sub-document matches
      ✔ should not match when the field is missing or is not a document
      ✔ should skip an array element which is not a document
    $expr and $exprx Placement Tests
      ✔ should not allow $expr to appear within a field
      ✔ should give $expr and $exprx the same meaning at the top level
      ✔ should resolve the same field name differently at each level

  300) Process Runtime Tests
    Starting a Run
      ✔ should begin ready, at the first step
      ✔ should carry the name of the process it belongs to
      ✔ should stamp null for a process with no name
      ✔ should clone the input rather than work on it
      ✔ should take no input as an empty state
      ✔ should carry a scope holding the instant the run began
      ✔ should fail a process which is not a document with Steps
      ✔ should fail an input which is not a document
    The $do Step
      ✔ should compute a field from the state
      ✔ should store a literal
      ✔ should remove a field whose expression produces nothing
      ✔ should evaluate every field against the state as it was at the top of the step
      ✔ should see the variables the run carries
      ✔ should advance to the next step
      ✔ should refuse an argument which is not a document
    The $when Step
      ✔ should enter the Then branch when the check matches
      ✔ should enter the Else branch when the check does not match
      ✔ should push the branch onto the cursor
      ✔ should advance past the step when a false check has no Else
      ✔ should advance past a branch which is present but empty
      ✔ should leave a branch and carry on with the step after it
      ✔ should nest, and unwind two levels at once
      ✔ should take a query holding $expr
      ✔ should refuse a Check which is not a query document
    The $while Step
      ✔ should run the body until the check stops matching
      ✔ should run the body no times at all when the check is false to begin with
      ✔ should push the body onto the cursor
      ✔ should return to the loop step when the body ends, rather than past it
      ✔ should carry on with the step after the loop once the check fails
      ✔ should refuse an empty body as a bad process
      ✔ should refuse a missing body as a bad process
      ✔ should refuse a missing check as a bad process
      ✔ should be stopped by the step budget when the check never fails
      ✔ should be stopped at the budget the caller named
      ✔ should never be stopped by a budget when stepped one step at a time
    The $forEach Step
      ✔ should run the body once for each element
      ✔ should write each element to the field named by As
      ✔ should write the position to the field named by Index
      ✔ should remove As and Index from the state when the loop ends
      ✔ should leave the state alone when the array is empty
      ✔ should keep the iteration in the cursor
      ✔ should start at the first element even when the input already carries the Index field
      ✔ should run a loop inside a loop
      ✔ should run a branch inside a loop
      ✔ should suspend inside a pass and resume into the next one
      ✔ should carry a run suspended in the middle of a pass through storage
      ✔ should see an array the body has added to
      ✔ should fail when In does not produce an array
      ✔ should refuse a missing As as a bad process
      ✔ should refuse an empty body as a bad process
      ✔ should refuse an Index which is not a field name as a bad process
    The $throw Step
      ✔ should halt the run when nothing catches it
      ✔ should call a thrown string Thrown
      ✔ should take a Code and a Message from a thrown document
      ✔ should evaluate the message as an expression
      ✔ should name the cursor it was thrown at
      ✔ should refuse a reserved code as a bad process
      ✔ should refuse a reserved code even inside a try
    The $try Step
      ✔ should run the Catch branch when a step fails
      ✔ should write the error to the field named by As
      ✔ should let a $when in the handler test the code
      ✔ should carry on with the step after the try
      ✔ should not run the Catch branch when the body succeeds
      ✔ should show the handler the state as the failure left it
      ✔ should catch an operator which refused
      ✔ should catch a call the host reported as failed
      ✔ should catch a failure reported to a run which was stored while waiting
      ✔ should take no As at all
      ✔ should not catch a failure raised inside its own Catch
      ✔ should let the try around it catch a failure raised inside a Catch
      ✔ should catch a failure raised inside a loop in its body
      ✔ should leave an abandoned loop's As field on the state
      ✔ should catch on every pass of a loop it sits inside
    What a $try Does Not Catch
      ✔ should not catch an operator which is not registered
      ✔ should not catch a fault in the process document
      ✔ should not catch a step which is not a document with one key
      ✔ should not catch the step budget running out
    Arguments the $try Step Refuses
      ✔ should refuse a missing Do
      ✔ should refuse an empty Do
      ✔ should refuse a missing Catch
      ✔ should refuse an empty Catch
      ✔ should refuse an As which is not a field name
    The $call Step
      ✔ should suspend rather than call
      ✔ should evaluate With against the state
      ✔ should carry Into when there is one, and leave it off when there is not
      ✔ should leave the cursor on the call until it is resumed
      ✔ should take no With as an empty With
      ✔ should refuse a call with no Name
    The $return Step
      ✔ should halt with the value it evaluates
      ✔ should evaluate an expression document
      ✔ should stop the steps after it from running
      ✔ should carry no Result at all when the expression produces nothing
      ✔ should return the state for $$ROOT
    Running Off the End
      ✔ should return the state, the way { $return: $$ROOT } would
      ✔ should finish a process which has no steps at all
      ✔ should empty the cursor when it is over
    Resuming
      ✔ should write the result into the state and carry on
      ✔ should finish the process it was resumed into
      ✔ should drop the Waiting descriptor
      ✔ should discard the result of a call which named no Into
      ✔ should remove the field when the result is nothing
      ✔ should write into a dotted path
      ✔ should refuse a run which is not waiting
      ✔ should fail the run when the host reports the call failed
      ✔ should take a code and a message from the host
      ✔ should not modify the run it was given
    Stepping and Executing
      ✔ should make stepping a halted run a no-op
      ✔ should return a new value rather than the run it was given
      ✔ should agree with repeated stepping
      ✔ should fail a run which does not halt within the budget
      ✔ should take a budget large enough to finish
      ✔ should step the same run twice to the same answer
      ✔ should keep two runs of one process apart
    Failure
      ✔ should never throw, whatever it is handed
      ✔ should always return a run
      ✔ should refuse a run which belongs to another process
      ✔ should refuse a run whose Status is not a status
      ✔ should report a step operator which is not registered
      ✔ should report a step which is not a document with one key
      ✔ should report a cursor which addresses nothing
      ✔ should name the cursor the failure happened at
      ✔ should keep the state a failed run had reached
    Storage
      ✔ should write a run down and read it back unchanged
      ✔ should step a stored run to the same place as the run it came from
      ✔ should keep $$NOW across storage, so a resumed run agrees with itself
      ✔ should carry a state holding the values plain JSON cannot
      ✔ should write a waiting run down with what it is waiting for
    Fanning Out Through the Host
      ✔ should resume the parent with the result of every child run
      ✔ should leave the parent state untouched while the children run
      ✔ should let the parent branch on what the children returned
      ✔ should write the parent down while its children are outstanding
      ✔ should offer a failed child to the parent $try

  510) Projection Computed Field Tests
    Computed Fields
      ✔ should compute a field from an expression
      ✔ should treat a computed field as an inclusion projection
      ✔ should compute a field while suppressing _id
      ✔ should rename a field with a field reference
      ✔ should build a nested output field
      ✔ should set a computed field which evaluates to null
      ✔ should omit a computed field which evaluates to a missing value
      ✔ should support $literal within a projection
    Projection Validation
      ✔ should reject a projection combining inclusion and exclusion
      ✔ should reject an expression within an exclusion projection
      ✔ should allow _id to be suppressed alongside an inclusion
      ✔ should accept booleans in place of 1 and 0
      ✔ should reject an unsupported projection operator by name
      ✔ should not mistake a computed field for a projection operator
      ✔ should not treat a document of several $ keys as a projection operator
    Projection Parameters
      ✔ should return null when the document is not an object
      ✔ should return null when the projection is neither an object nor missing
      ✔ should return the whole document when the projection is missing
      ✔ should not alias the document when the projection is missing
    Projected Document Shape
      ✔ should remove excluded fields rather than leaving them undefined
      ✔ should include a field through an array, keeping the array
      ✔ should give an empty object for an element which lacks the field
      ✔ should drop an element which cannot carry the field
      ✔ should include through two levels of array
      ✔ should descend into an array inside an array
      ✔ should gather two fields from the same array into one object
      ✔ should treat a numeric path element as a field name
      ✔ should omit a field whose path runs below a scalar
      ✔ should keep an ordinary path working
      ✔ should not alias the document it projected from
      ✔ should exclude a field through an array, keeping the array
      ✔ should exclude through two levels of array
      ✔ should not exclude an array element by index
      ✔ should not add an _id to a document which does not have one
      ✔ should omit an included field which is not in the document
      ✔ should keep dates through a projection
      ✔ should not alias the source document
      ✔ should not alias the source document through a computed field
      ✔ should not alias an array through a computed field
      ✔ should keep a date through a computed field


  1388 passing (498ms)
```

## Parity Tests

```
jsongin Parity Tests
    Query Tests
      Ad-Hoc Query Tests
        ✔ should not match explicit nested fields
      Rainbow Tests
        Nested Fields (explicit)
          ✔ should not perform matching on nested fields using implicit $eq
          ✔ should not perform matching on nested fields using explicit $eq
        Nested Fields (dot notation)
          ✔ should perform matching on nested fields using implicit $eq and dot notation
          ✔ should perform matching on nested fields using explicit $eq and dot notation
        Operator $eq (===)
          ✔ should perform strict equality (===) on 'bns'
          ✔ should perform strict equality (===) on 'o'
          ✔ should perform strict equality (===) on 'a'
          ✔ should not perform loose equality (==) on 'bns'
          ✔ should not perform loose equality (==) on 'o'
          ✔ should not perform loose equality (==) on 'a'
          ✔ should equate null with an undefined field
        Operator $ne (!==)
          ✔ should perform strict inequality (!==) on 'bns'
          ✔ should perform strict inequality (!==) on 'o'
          ✔ should perform strict inequality (!==) on 'a'
          ✔ should not perform loose inequality (!=) on 'bns'
          ✔ should not perform loose inequality (!=) on 'o'
          ✔ should not perform loose inequality (!=) on 'a'
        Operator $gte (>=)
          ✔ should perform strict comparison (>=) on 'bns'
          ✔ should not perform loose comparison (>=) on 'bns'
          ✔ should equate null with an undefined field
        Operator $gt (>)
          ✔ should perform strict comparison (>=) on 'bns'
          ✔ should not perform loose comparison (>=) on 'bns'
        Operator $lte (<=)
          ✔ should perform strict comparison (<=) on 'bns'
          ✔ should not perform loose comparison (<=) on 'bns'
          ✔ should equate null with an undefined field
        Operator $lt (<)
          ✔ should perform strict comparison (<) on 'bns'
          ✔ should not perform loose comparison (<) on 'bns'
      MongoDB Reference
        Comparison Query Operators
          Comparison Operator: $eq (https://www.mongodb.com/docs/manual/reference/operator/query/eq/)
            Equals an Array Value
              ✔ Match an Array Element
              ✔ Match an Array Element Using Implicit $eq
            Regex Match Behaviour
              ✔ $eq match on a string
              ✔ $eq match on a regular expression
              ✔ Regular expression matches
          Comparison Operator: $gt (https://www.mongodb.com/docs/manual/reference/operator/query/gt/)
            ✔ Match Document Fields
          Comparison Operator: $gte (https://www.mongodb.com/docs/manual/reference/operator/query/gte/)
            ✔ Match Document Fields
          Comparison Operator: $in (https://www.mongodb.com/docs/manual/reference/operator/query/in/)
            ✔ Use the $in Operator to Match Values
            ✔ Use the $in Operator to Match Values in an Array
            ✔ Use the $in Operator with a Regular Expression
          Comparison Operator: $lt (https://www.mongodb.com/docs/manual/reference/operator/query/lt/)
            ✔ Match Document Fields
          Comparison Operator: $lte (https://www.mongodb.com/docs/manual/reference/operator/query/lte/)
            ✔ Match Document Fields
          Comparison Operator: $ne (https://www.mongodb.com/docs/manual/reference/operator/query/ne/)
            ✔ Match Document Fields
          Comparison Operator: $nin (https://www.mongodb.com/docs/manual/reference/operator/query/nin/)
            ✔ Select on Unmatching Documents
            ✔ Select on Elements Not in an Array
        Logical Query Operators
          Logical Operator: $and (https://www.mongodb.com/docs/manual/reference/operator/query/and/)
            ✔ AND Queries With Multiple Expressions Specifying the Same Field
            ✔ AND Queries With Multiple Expressions Specifying the Same Operator
          Logical Operator: $not (https://www.mongodb.com/docs/manual/reference/operator/query/not/)
            ✔ Match Document Fields
            ✔ $not and Regular Expressions
          Logical Operator: $nor (https://www.mongodb.com/docs/manual/reference/operator/query/nor/)
            ✔ $nor Query with Two Expressions
            ✔ $nor and Additional Comparisons
            ✔ $nor and $exists
          Logical Operator: $or (https://www.mongodb.com/docs/manual/reference/operator/query/or/)
            ✔ Match Document Fields
            ✔ $or versus $in
            ✔ Nested $or Clauses
        Element Query Operators
          Element Query Operator: $exists (https://www.mongodb.com/docs/manual/reference/operator/query/exists/)
            ✔ Exists and Not Equal To
            ✔ Null Values
          Element Query Operator: $type (https://www.mongodb.com/docs/manual/reference/operator/query/type/)
            ✔ Querying by Data Type (BSON Code)
            ✔ Querying by Data Type (BSON Alias)
            ✔ Querying by Data Type ("number")
            ✔ Querying by Multiple Data Type (BSON Code)
            ✔ Querying by Multiple Data Type (BSON Alias)
        Array Query Operators
          Array Query Operator: $all (https://www.mongodb.com/docs/manual/reference/operator/query/all/)
            ✔ Use $all to Match Values
            ✔ Use $all with $elemMatch
            ✔ Use $all with Scalar Values
          Array Query Operator: $elemMatch (https://www.mongodb.com/docs/manual/reference/operator/query/elemMatch/)
            ✔ Element Match
            ✔ Array of Embedded Documents
            ✔ Single Query Condition
          Array Query Operator: $size (https://www.mongodb.com/docs/manual/reference/operator/query/size/)
            ✔ Use $size to Match Array Sizes
      MongoDB Tutorials
        Query Documents (https://www.mongodb.com/docs/manual/tutorial/query-documents/)
          Select All Documents in a Collection
            ✔ Match All Documents with an Empty Object {}
          Specify Equality Condition
            ✔ Match Fields with Implicit Equality
          Specify Conditions Using Query Operators
            ✔ Match Fields with an Array of Possible Values
          Specify AND Conditions
            ✔ Match Fields with an Array of Possible Values
          Specify OR Conditions
            ✔ Match Fields against an Array of Possible Values
          Specify AND as well as OR Conditions
            ✔ Match Fields Using AND and OR
        Query on Embedded/Nested Documents (https://www.mongodb.com/docs/manual/tutorial/query-embedded-documents/)
          Query on Embedded/Nested Documents
            ✔ Specify Equality Match on a Nested Field
            ✔ Specify Match using Query Operator
            ✔ Specify AND Condition
          Match an Embedded/Nested Document
            ✔ Specify Equality Match on an Embedded Document
        Query an Array (https://www.mongodb.com/docs/manual/tutorial/query-arrays/)
          Match an Array
            ✔ Match an Array Exactly
            ✔ Match Array Elements
          Query an Array for an Element
            ✔ Match a Single Array Element
            ✔ Match Array Elements by Comparison
          Specify Multiple Conditions for Array Elements
            ✔ Query an Array with Compound Filter Conditions on the Array Elements
            ✔ Query for an Array Element that Meets Multiple Criteria
            ✔ Query for an Element by the Array Index Position
            ✔ Query an Array by Array Length
        Query an Array of Embedded Documents (https://www.mongodb.com/docs/manual/tutorial/query-array-of-documents/)
          Query for a Document Nested in an Array
            ✔ Match a Document Exactly
          Specify a Query Condition on a Field in an Array of Documents
            ✔ Specify a Query Condition on a Field Embedded in an Array of Documents
            ✔ Use the Array Index to Query for a Field in the Embedded Document
          Specify Multiple Conditions for Array of Documents
            ✔ A Single Nested Document Meets Multiple Query Conditions on Nested Fields
            ✔ Combination of Elements Satisfies the Criteria
        Query for Null or Missing Fields (https://www.mongodb.com/docs/manual/tutorial/query-for-null-fields/)
          Equality Filter
            ✔ Match Fields that are Null or Missing
          Type Check
            ✔ Match Fields that Exist And are Null
          Existence Check
            ✔ Match Fields that are Missing
      $expr Query Tests
        ✔ should compare one field to another field
        ✔ should match documents where two fields are equal
        ✔ should match computed conditions
        ✔ should combine field comparisons with arithmetic
        ✔ should appear within a top level $and
        ✔ should appear within a top level $or
        ✔ should combine with the other query operators
        ✔ should match nothing when the expression is false for every document
        ✔ should use $cond to select a comparison value
      Comparison Operator Tests
        $eq Tests
          ✔ should equate values of the same primitive type
          ✔ should not equate values across primitive types
          ✔ should equate null values
          ✔ should match null against a field which is not there
          ✔ should equate object values
          ✔ should not equate object values with keys in a different order
          ✔ should equate array values
          ✔ should not equate arrays with elements in a different order
          ✔ should equate dates by their time value
          ✔ should not equate a date with the string or number which represents it
          ✔ should keep the same rule for a date inside an object
          ✔ should match an array field by one of its elements
          ✔ should match an array field as a whole
          ✔ should not descend into an array inside an array without an index
          ✔ should match through a path which crosses an array
          ✔ should match through two levels of array
          ✔ should tell a gathered value from a real array
        $ne Tests
          ✔ should be the negation of $eq
          ✔ should not match a field which is not there when the value is null
          ✔ should not match when any element of an array equals the value
        Range Operator Tests
          ✔ should compare numbers
          ✔ should compare strings
          ✔ should compare dates
          ✔ should bracket the comparison by type
          ✔ should compare any element of an array
          ✔ should compare objects with each other
          ✔ should compare arrays with each other
          ✔ should keep the bracket between an object and an array
          ✔ should compare through a path which crosses an array
        $in and $nin Tests
          ✔ should match any of the given values
          ✔ should match nothing for an empty list
          ✔ should match when any element of an array field is in the list
          ✔ should match dates by their time value
          ✔ should pattern match a string with a regexp in the list
          ✔ should be negated by $nin
          ✔ should match a sub-document in the list
          ✔ should match an array in the list
          ✔ should match a field which is not there against null
          ✔ should match through a path which crosses an array
        $exists Tests
          ✔ should find a field which is there
          ✔ should find a field which holds null
          ✔ should not find a field which is not there
          ✔ should tell a missing field from a present one through an array
          ✔ should coerce a non-boolean value to a boolean
        $type Tests
          ✔ should select by type name
          ✔ should select an array by the type of its elements, or as an array
          ✔ should accept a list of types
          ✔ should not select a field which is not there
          ✔ should distinguish an int from a double
          ✔ should use the int32 range, not the safe-integer range, to tell int from double
          ✔ should match no plain number with the long type
          ✔ should treat number as an alias for every numeric type
        $size Tests
          ✔ should measure an array field
          ✔ should not measure a field which is not an array
          ✔ should measure the field rather than a gathered value
        $all Tests
          ✔ should require every value to be present
          ✔ should match a field which is not an array
          ✔ should select nothing for an empty list
        $elemMatch Tests
          ✔ should require one element to satisfy every condition
          ✔ should match a field of an element
          ✔ should not match a field which is not an array
          ✔ should match an array reached through a path which crosses an array
          ✔ should not match a crossing path which ends at something other than an array
          ✔ should read a dotted field within an element
          ✔ should not read a field of an element which is not a document
          ✔ should not read a field through an element which is an array
          ✔ should look inside an element which is an array when nested $elemMatch asks
          ✔ should not compare into an element which is an array
          ✔ should not match any operator into an element which is an array
          ✔ should match an operator against the element itself
          ✔ should keep the element rule through a logical operator
          ✔ should keep ordinary array rules below the element
          ✔ should match an empty criteria against a document or an array element
          ✔ should not match an empty criteria against a scalar or null element
          ✔ should apply $or to each element in turn
          ✔ should require one element to satisfy every branch of $and
          ✔ should apply $nor to each element in turn
          ✔ should apply $not with a regexp to each element in turn
          ✔ should nest a logical operator inside another
        $regex Tests
          ✔ should pattern match a string
          ✔ should not pattern match a value which is not a string
          ✔ should pattern match any element of an array
          ✔ should pattern match through a path which crosses an array
          ✔ should apply the flags given by $options
          ✔ should test each document independently of the last
      Path Semantics Tests
        ✔ should read a numeric path element as an index into an array
        ✔ should read a numeric path element as a field name on a document
        ✔ should not index an array from the end
        ✔ should read a negative path element as a field name on a document
        ✔ should reach an element of a nested array by index
        ✔ should not reach into an array inside an array without an index
        ✔ should equate a nested array element with the value it holds
        ✔ should match nothing for a path which runs below a scalar
        ✔ should cross two arrays in one path
        ✔ should negate a condition on a field which is not there
        ✔ should anchor a regexp against the whole string
        ✔ should apply the multiline flag through $options
        ✔ should apply the dotall flag through $options
        ✔ should apply the extended flag through $options
        ✔ should keep whitespace inside a character class under the extended flag
        ✔ should match every document for an empty query
      Bitwise and Miscellaneous Query Tests
        Bitwise
          ✔ should match every bit set with $bitsAllSet
          ✔ should match every bit clear with $bitsAllClear
          ✔ should match any bit set with $bitsAnySet
          ✔ should match any bit clear with $bitsAnyClear
          ✔ should read the bits of a value only when it has bits to read
          ✔ should refuse a bit specification which is not one
        Miscellaneous
          ✔ should match a remainder with the query $mod
          ✔ should select everything with $comment
          ✔ should draw from zero through one with $rand
          ✔ should refuse the miscellaneous names which are not predicates
          ✔ should select a random fraction with $sampleRate
      Query Rejection Tests
        ✔ should refuse $not at the top level of a query
        ✔ should accept $nor at the top level
        ✔ should refuse a comparison operator at the top level
        ✔ should refuse $all at the top level of a query
        ✔ should refuse an operator it does not know
        ✔ should refuse an operator value of the wrong type
        ✔ should refuse a logical operator with no conditions
        ✔ should refuse a malformed $options
        ✔ should refuse a query operator nested inside $in
        ✔ should accept a document which merely looks like a query inside $in
        ✔ should refuse a malformed logical operator inside $elemMatch
        ✔ should refuse a field level operator at the top of an $elemMatch logical branch
        ✔ should refuse a $not inside $elemMatch which is neither a document nor a regexp
        ✔ should refuse a malformed $elemMatch with no element to examine
        ✔ should still answer an $elemMatch which is merely unsatisfied
        ✔ should still answer a query which is merely unsatisfied
    Update Tests
      Ad-Hoc Update Tests
        ✔ should do simple updates
      Update Operator Tests
        $set Tests
          ✔ should set values
          ✔ should set nested values
          ✔ should create the path when it is not there
          ✔ should store a date as a date
          ✔ should set an element of an array by index
          ✔ should fill the gap with nulls when it writes past the end of an array
          ✔ should fill the gap ahead of a document it creates in an array
          ✔ should create a document for a numeric key rather than an array
          ✔ should create a document for a numeric key at depth
          ✔ should index an array which is already there
        $unset Tests
          ✔ should remove a field
          ✔ should remove a nested field
          ✔ should ignore a field which is not there
          ✔ should leave a null hole when it removes an array element
        $rename Tests
          ✔ should rename a field
          ✔ should overwrite the target field
          ✔ should ignore a source field which is not there
          ✔ should move a value and create the topography
        $inc Tests
          ✔ should increment a value
          ✔ should decrement with a negative value
          ✔ should increment a nested value
          ✔ should set a field which is not there to the increment
          ✔ should create the path for a nested field which is not there
        $mul Tests
          ✔ should multiply a value
          ✔ should set a field which is not there to zero
        $min and $max Tests
          ✔ should keep the smaller value for $min
          ✔ should keep the larger value for $max
          ✔ should set a field which is not there
          ✔ should compare strings
          ✔ should compare across types by the BSON ordering
          ✔ should treat null as lower than any number
        $push Tests
          ✔ should append a value
          ✔ should create the array when the field is not there
          ✔ should append each value with $each
          ✔ should insert at a position with $position
          ✔ should trim with $slice
          ✔ should order with $sort
          ✔ should append a modifier written without $each as a value
        $addToSet Tests
          ✔ should add a value which is not present
          ✔ should not add a value which is already present
          ✔ should add each value with $each
          ✔ should create the array when the field is not there
          ✔ should create the array for $each when the field is not there
        $pop Tests
          ✔ should remove the last element for 1
          ✔ should remove the first element for -1
        $pullAll Tests
          ✔ should remove every matching value
          ✔ should ignore a value which is not present
          ✔ should remove matching documents
          ✔ should leave a field which is not there alone
        $currentDate Tests
          ✔ should store a date for true
          ✔ should store a date for the date type
          ✔ should create the field when it is not there
          ✔ should give each field its own date
        Operator Edge Cases
          ✔ should apply $inc to a fractional value
          ✔ should rename from a nested path
          ✔ should accept an empty set of fields
          ✔ should pop nothing from an empty array
          ✔ should leave a field which is not there alone for $pop
          ✔ should not add a document which is already in the set
          ✔ should not add an array which is already in the set
          ✔ should keep the last elements for a negative $slice
          ✔ should order documents with a $sort specification
          ✔ should append at the end for a $position past the end
        Swept In From the Unit Tests
          ✔ should add a value repeated within one $each only once
          ✔ should compare strictly in $addToSet, without coercing a type
          ✔ should apply a $push $sort before its $slice
          ✔ should remove a numeric key from a document rather than nulling it
          ✔ should leave an array alone for an index which is out of range
      Bitwise Update Tests
        ✔ should apply and, or, and xor with $bit
        ✔ should create a missing field rather than refusing it
        ✔ should refuse what $bit cannot apply
      Pull Tests
        ✔ should remove every element equal to a scalar
        ✔ should remove every element a query condition selects
        ✔ should take a condition of several operators
        ✔ should take $in as a condition
        ✔ should read a bare document as a condition on the fields of each element
        ✔ should match an embedded document on several fields at once
        ✔ should remove an element equal to a whole array
        ✔ should leave an empty array when everything matches
        ✔ should leave the array alone when nothing matches
        ✔ should leave a document which does not have the field alone
        ✔ should pull from a nested array by path
        ✔ should pull several fields in one update
        ✔ should refuse a field which is not an array
        ✔ should take $elemMatch as a condition on an array of arrays
        ✔ should not reach inside a nested array to match a scalar
        ✔ should not match a scalar element against a field condition
        ✔ should read a condition which names nothing as a field condition
        ✔ should remove a null element when the condition is null
      All Positional Tests
        ✔ should set every element of an array
        ✔ should set a field of every element
        ✔ should increment a field of every element
        ✔ should multiply a field of every element
        ✔ should remove a field from every element
        ✔ should create the field on an element which does not have it
        ✔ should leave an empty array alone
        ✔ should reach a nested path below each element
        ✔ should reach through two levels of array
        ✔ should push to an array field of every element
        ✔ should refuse a field which is not an array
        ✔ should refuse a field which is not there
        ✔ should refuse writing a field below an element which cannot hold one
        ✔ should refuse a $rename through the all positional operator
        ✔ should apply the same rule to $min and $max
      Update Rejection Tests
        ✔ should refuse an unknown update operator
        ✔ should refuse two operators which touch the same path
        ✔ should refuse $inc against a field which is not numeric
        ✔ should refuse $inc with an operand which is not numeric
        ✔ should refuse $mul against a field which is not numeric
        ✔ should refuse an update document which is not made of operators
        ✔ should refuse an operator value of the wrong type
        ✔ should refuse two operators which write to a path and one below it
        ✔ should refuse a path which reaches into an array by field name
        ✔ should refuse a negative array index in an update
        ✔ should refuse an array operator against a field which is not an array
        ✔ should refuse a malformed $currentDate specification
        ✔ should refuse a malformed $push modifier
        ✔ should refuse a $pop which is neither 1 nor -1
        ✔ should refuse a path which runs below a scalar
        ✔ should refuse two operators where one path lies below the other
        ✔ should not mistake a shared prefix for a conflict
        ✔ should refuse a $pullAll whose values are not an array
        ✔ should refuse a $rename onto an empty field name
        ✔ should refuse an operator whose value is not a document of fields
        ✔ should still apply two operators which touch different paths
        ✔ should not refuse an operator which simply has nothing to do
    Projection Tests
      Ad-Hoc Projection Tests
        ✔ should do simple projection
        ✔ should project embedded fields
        ✔ should supress fields
        ✔ should supress only the _id field
        ✔ should supress the _id field and other fields
        ✔ should supress the _id field but include other fields
        ✔ should return only the _id field
        ✔ should supress the _id field while including others
      Projection Shape Tests
        ✔ should return the whole document for an empty projection
        ✔ should keep _id by default
        ✔ should suppress _id on request
        ✔ should return everything but _id when only _id is suppressed
        ✔ should omit a field which is not in the document
        ✔ should keep the array when a path crosses one
        ✔ should exclude through an array element by element
        ✔ should take the first elements of an array with $slice
        ✔ should take the last elements for a negative $slice
        ✔ should skip and then take with a two element $slice
        ✔ should keep the other fields alongside a $slice
        ✔ should include a sliced field within an inclusion projection
        ✔ should leave a field which is not an array alone through $slice
        ✔ should take the first matching element with the projection $elemMatch
        ✔ should omit the field when the projection $elemMatch matches nothing
        ✔ should make the projection an inclusion with $elemMatch
        ✔ should not exclude an array element by index
        ✔ should take two fields from the same array into one object per element
        ✔ should keep a nested document shape
        ✔ should omit the field when the projection $elemMatch names one which is not an array
        ✔ should omit the field when the projection $elemMatch names one which is absent
        ✔ should apply the projection $elemMatch within an exclusion projection
        ✔ should drop the field when a $elemMatch within an exclusion matches nothing
        ✔ should include a $elemMatch field alongside an inclusion of another field
        ✔ should read a nested document as a projection specification
        ✔ should read a nested document with several keys as a specification
        ✔ should read a nested specification which excludes
        Swept In From the Unit Tests
          ✔ should give an empty document for an element which lacks the field
          ✔ should drop an element which cannot carry the field
          ✔ should include through two levels of array
          ✔ should descend into an array inside an array
          ✔ should treat a numeric path element as a field name
      Computed Field Tests
        ✔ should compute a field from an expression
        ✔ should copy a field with a field path
        ✔ should take a nested field with a field path
        ✔ should store a literal with $literal
        ✔ should build a nested document of computed fields
        ✔ should carry an included field alongside a computed one
        ✔ should treat a truthy number and true alike
        ✔ should include a nested path
        ✔ should exclude a nested path
        ✔ should ignore an excluded field which is not in the document
        ✔ should keep _id through an exclusion which does not name it
        Refused Projections
          ✔ should refuse an inclusion and an exclusion together
          ✔ should refuse a computed field within an exclusion
          ✔ should refuse an empty sub-projection
          ✔ should refuse a $slice argument which is neither a count nor a skip and a limit
          ✔ should refuse an empty field name
    Aggregate Tests
      Ad-Hoc Aggregate Tests
        ✔ should score the living players by team
        ✔ should reshape documents with a computed projection
        ✔ should build a leaderboard with $addFields, $sort, and $limit
        ✔ should tally the tags with $unwind and $group
        ✔ should number the elements of an unwound array
        ✔ should page through the documents with $skip and $limit
        ✔ should summarize every document in a single group
        ✔ should collect values with $push, $first, and $last
        ✔ should group the teams and list their members
        ✔ should return an empty result when nothing matches
      Sort Through Array Tests
        ✔ should reduce through every array the path crosses
        ✔ should expand only one level when the path crosses no array
        ✔ should expand a level for each array the path crosses
        ✔ should treat an empty array element as an ordinary array value
        ✔ should sort a field holding only an empty array with the arrays
        ✔ should sort the existing empty array cases unchanged
        ✔ should order two empty arrays against each other
        ✔ should sort an empty array reached through a path below every value
        ✔ should sort an empty array crossed by a path as null
        ✔ should order mixed types among the candidates by value order
        ✔ should sort an empty array beside a string by the array rank
        ✔ should honor an explicit array index in the sort path
        ✔ should not index the sort path from the end of an array
      Expression Operator Tests
        Field Paths and $literal
          ✔ should read a field by its path
          ✔ should read a nested field by its path
          ✔ should read an array field whole
          ✔ should omit the field for a path which resolves to nothing
          ✔ should gather a field reference through an array
          ✔ should leave out an element which does not have the field
          ✔ should tell an empty gather from a path which traversed nothing
          ✔ should keep a gathered value which is itself an array whole
          ✔ should nest rather than flatten when gathering through two arrays
          ✔ should not index an array, with any numeric key
          ✔ should read a numeric field name on a document
          ✔ should return a field path as text with $literal
        Array and Object Expressions
          ✔ should fill a missing element of an array literal with a null
          ✔ should leave a missing field out of an expression object
          ✔ should keep a field whose value is a null
          ✔ should still produce an expression object whose every field is missing
          ✔ should produce an emptied expression object at every level
          ✔ should omit a sub-projection of a field the document does not have
          ✔ should keep an emptied object in the array position it sits in
        Arithmetic Expression Operators
          ✔ should add with $add
          ✔ should subtract with $subtract
          ✔ should multiply with $multiply
          ✔ should divide with $divide
          ✔ should refuse to divide by zero, in $divide and $mod
          ✔ should take the remainder with $mod
          ✔ should take the magnitude with $abs
          ✔ should give null for an operand which is not there
        Comparison Expression Operators
          ✔ should rank a missing value below a null, not equal to it
          ✔ should order a missing value below everything with the ranking operators
          ✔ should select a zero rather than reading it as no value
          ✔ should compare for equality with $eq and $ne
          ✔ should order with $gt, $gte, $lt, and $lte
          ✔ should rank with $cmp
          ✔ should compare across types by the BSON ordering
          ✔ should compare dates by their time value
        Boolean Expression Operators
          ✔ should combine with $and and $or
          ✔ should negate with $not
          ✔ should treat a value as true unless it is false, zero, null, or missing
        Conditional Expression Operators
          ✔ should choose with the $cond array form
          ✔ should choose with the $cond document form
          ✔ should substitute a value with $ifNull
          ✔ should take the first matching branch with $switch
          ✔ should fall through to the $switch default
        Expression $min and $max
          ✔ should take the smallest and largest of a list
          ✔ should take the smallest and largest within an array field
        Rounding Expression Operators
          ✔ should round up with $ceil
          ✔ should round down with $floor
          ✔ should give null for a null or missing operand
          ✔ should round half to even with $round
          ✔ should round to a place with $round
          ✔ should truncate toward zero with $trunc
        Array Expression Operators
          ✔ should count the elements of an array with $size
          ✔ should count an empty array as zero with $size
          ✔ should read one element with $arrayElemAt
          ✔ should index from the end for a negative $arrayElemAt position
          ✔ should omit the field for an $arrayElemAt position out of range
          ✔ should give null for an $arrayElemAt over a null or missing array
          ✔ should join arrays with $concatArrays
          ✔ should give null when any $concatArrays operand is null or missing
          ✔ should test for membership with the $in expression
          ✔ should compare by content in the $in expression
          ✔ should not match a null against an array which has none
        Null Operands
          ✔ should return null for a null operand to the arithmetic operators
          ✔ should return null for a null place given to the rounding operators
          ✔ should return null for a null position given to $arrayElemAt
          ✔ should return null when a null is subtracted from a date
        Values Which Are Not Finite
          ✔ should carry an infinity through the rounding operators
          ✔ should round a value already in exponential notation
          ✔ should carry a NaN through arithmetic
      String Operator Tests
        Joining and Splitting
          ✔ should join strings with $concat
          ✔ should propagate null through $concat
          ✔ should refuse a $concat operand which is not a string
          ✔ should split a string with $split
          ✔ should propagate null through $split
          ✔ should refuse a bad $split operand
        Case and Comparison
          ✔ should lowercase with $toLower
          ✔ should read a missing or null $toLower operand as an empty string
          ✔ should uppercase with $toUpper
          ✔ should read a missing or null $toUpper operand as an empty string
          ✔ should compare without case using $strcasecmp
          ✔ should read a missing or null $strcasecmp operand as an empty string
        Trimming
          ✔ should trim both ends with $trim
          ✔ should trim the left end with $ltrim
          ✔ should trim the right end with $rtrim
          ✔ should propagate null through the trim operators
          ✔ should refuse a bad trim argument
        Substrings
          ✔ should take a substring with $substr
          ✔ should take a substring by bytes with $substrBytes
          ✔ should take a substring by code points with $substrCP
          ✔ should read a missing or null substring operand as an empty string
          ✔ should truncate a fractional $substrBytes position
          ✔ should refuse a fractional $substrCP position
          ✔ should render a number operand rather than refusing it
          ✔ should refuse a bad substring operand
        Byte Boundaries
          ✔ should refuse a $substrBytes range which splits a character
        Operand Types
          ✔ should render a number in the operators which predate 3.4
          ✔ should refuse a number in the operators added since 3.4
          ✔ should accept a single operand outside an array
        Wider Characters
          ✔ should count three byte characters
          ✔ should count a four byte character
          ✔ should take substrings of wider characters by code point
          ✔ should take substrings of wider characters by byte
          ✔ should find wider characters at the right offset
        Patterns Which Match Nothing
          ✔ should not stall on a zero length match
          ✔ should still match an empty string
          ✔ should still report a zero length match between characters
          ✔ should report a zero length first match
        Malformed Operands
          ✔ should refuse a position which is not a number
          ✔ should refuse regex options which are not a string
          ✔ should refuse an operand which is neither a string nor a number
          ✔ should refuse a position which is not finite
        Length
          ✔ should count bytes with $strLenBytes
          ✔ should count code points with $strLenCP
          ✔ should refuse a null or missing length operand
        Searching
          ✔ should find a byte offset with $indexOfBytes
          ✔ should find a code point offset with $indexOfCP
          ✔ should search from a start position
          ✔ should search within a start and end window
          ✔ should propagate null through the search operators
          ✔ should refuse a bad search operand
        Regular Expressions
          ✔ should test a pattern with $regexMatch
          ✔ should accept a RegExp as the pattern
          ✔ should read the $regexMatch options
          ✔ should return false rather than null for a missing $regexMatch input
          ✔ should find the first match with $regexFind
          ✔ should report the capture groups of a $regexFind
          ✔ should report an idx in code points rather than bytes
          ✔ should find every match with $regexFindAll
          ✔ should return null or an empty array for a missing regex input
          ✔ should refuse a bad regex argument
        Replacing
          ✔ should replace the first occurrence with $replaceOne
          ✔ should replace every occurrence with $replaceAll
          ✔ should match literally rather than as a pattern
          ✔ should propagate null through the replace operators
          ✔ should refuse a bad replace argument
      Arithmetic and Trigonometry Operator Tests
        Roots, Powers, and Logarithms
          ✔ should take a square root with $sqrt
          ✔ should raise a number to a power with $pow
          ✔ should raise e to a power with $exp
          ✔ should take a natural logarithm with $ln
          ✔ should take a logarithm in any base with $log
          ✔ should take a base 10 logarithm with $log10
        Angles and their Inverses
          ✔ should compute a sine with $sin
          ✔ should compute a cosine with $cos
          ✔ should compute a tangent with $tan
          ✔ should compute an inverse sine with $asin
          ✔ should compute an inverse cosine with $acos
          ✔ should compute an inverse tangent with $atan
          ✔ should compute an inverse tangent of a coordinate pair with $atan2
        Hyperbolic Functions
          ✔ should compute a hyperbolic sine with $sinh
          ✔ should compute a hyperbolic cosine with $cosh
          ✔ should compute a hyperbolic tangent with $tanh
          ✔ should compute an inverse hyperbolic sine with $asinh
          ✔ should compute an inverse hyperbolic cosine with $acosh
          ✔ should compute an inverse hyperbolic tangent with $atanh
        Angle Conversion
          ✔ should convert degrees to radians with $degreesToRadians
          ✔ should convert radians to degrees with $radiansToDegrees
        Not a Number, and the Infinities
          ✔ should compute with a NaN rather than refusing it
          ✔ should carry an infinity through the unbounded operators
          ✔ should refuse an infinity which falls outside a domain
          ✔ should refuse a periodic function an infinite angle
        Operands and Arity
          ✔ should refuse an operand which is not a number
          ✔ should refuse the wrong number of operands
          ✔ should take an expression as an operand
      Type Operator Tests
        Reading a Type
          ✔ should report the type of a value with $type
          ✔ should answer whether a value is a number with $isNumber
        Converting to a Scalar
          ✔ should convert to a string with $toString
          ✔ should convert to a boolean with $toBool
          ✔ should convert to a date with $toDate
        Converting to a Number
          ✔ should convert to an int with $toInt
          ✔ should convert to a long with $toLong
          ✔ should convert to a double with $toDouble
        Converting by Name
          ✔ should convert to a named type with $convert
        The Edges of a Conversion
          ✔ should require a numeric string to be wholly numeric
          ✔ should refuse a number which does not fit the target
          ✔ should read a date string as ISO 8601 and nothing else
          ✔ should refuse a value which has no reading at all
          ✔ should refuse a number which has no date reading
          ✔ should refuse a target which names no type
          ✔ should refuse the wrong number of operands
          ✔ should let onError catch either kind of failure
        The Type of a Converted Number
          ✔ should report a type which follows from the value
      Data Size Operator Tests
        Sizes
          ✔ should count the bytes of a string with $binarySize
          ✔ should count the encoded bytes of a document with $bsonSize
      Date Operator Tests
        Reading the Parts of a Date
          ✔ should read the year with $year (83ms)
          ✔ should read the month with $month
          ✔ should read the day of the month with $dayOfMonth
          ✔ should read the day of the week with $dayOfWeek
          ✔ should read the day of the year with $dayOfYear
          ✔ should read the hour with $hour
          ✔ should read the minute with $minute
          ✔ should read the seconds with $second
          ✔ should read the milliseconds with $millisecond
        Weeks
          ✔ should read the week of the year with $week
          ✔ should read the ISO week with $isoWeek
          ✔ should read the ISO day of the week with $isoDayOfWeek
          ✔ should read the ISO week year with $isoWeekYear
        Taking a Date Apart and Putting One Together
          ✔ should take a date apart with $dateToParts
          ✔ should build a date from parts with $dateFromParts
        Dates and Strings
          ✔ should write a date through a format with $dateToString
          ✔ should read a date from a string with $dateFromString
        Date Arithmetic
          ✔ should add units to a date with $dateAdd
          ✔ should subtract units from a date with $dateSubtract
          ✔ should count unit boundaries with $dateDiff
          ✔ should truncate to a unit with $dateTrunc
          ✔ should bin and start weeks where told to
        The Edges of the Date Family
          ✔ should pull a rolled over day back to the end of the month
          ✔ should write the specifiers nothing else has asked for
          ✔ should read a format back with every numeric specifier
          ✔ should count the fixed length units by boundary too
          ✔ should take a zone through the compound operators
          ✔ should refuse a bin size which is not one
        Nulls Through the Compound Operators
          ✔ should propagate a null unit or amount
          ✔ should propagate a null format or zone
        Arguments the Compound Operators Refuse
          ✔ should refuse a call which is not a document of arguments
          ✔ should refuse an argument it does not have
          ✔ should refuse a required argument which is missing
          ✔ should refuse an argument of the wrong type
        More Zones, Bins, and Formats
          ✔ should read an offset zone in either direction
          ✔ should truncate to a quarter and to several weeks
          ✔ should refuse a string which does not match its format
          ✔ should read a literal percent and default the ISO parts
        What a Date Operand May Be
          ✔ should refuse an operand which is not a date
          ✔ should refuse a malformed object form
          ✔ should propagate a null through the object form
      Set Operator Tests
        Comparing Sets
          ✔ should compare sets with $setEquals
          ✔ should test containment with $setIsSubset
        Combining Sets
          ✔ should combine sets with $setUnion
          ✔ should find common elements with $setIntersection
          ✔ should remove elements with $setDifference
        What Order, and What Counts as the Same Element
          ✔ should return a set in BSON order rather than in the order written
          ✔ should count elements the same by content, not by type alone
          ✔ should propagate a null through the combining operators
          ✔ should refuse a null where the combining operators would have propagated it
        Testing Every Element
          ✔ should test every element with $allElementsTrue
          ✔ should test any element with $anyElementTrue
      Array Operator Tests
        Asking About an Array
          ✔ should answer whether a value is an array with $isArray
          ✔ should find an element with $indexOfArray
        Reshaping an Array
          ✔ should reverse a list with $reverseArray
          ✔ should generate numbers with $range
          ✔ should take a subset with $slice
          ✔ should tell the expression $slice from the projection $slice
          ✔ should sort elements with $sortArray
          ✔ should merge arrays element by element with $zip
          ✔ should build a document from pairs with $arrayToObject
        The Edges of the Array Family
          ✔ should answer an empty array with nothing at all
          ✔ should refuse a null input to the four N operators
          ✔ should refuse an argument the operator does not have
          ✔ should bound the search range of $indexOfArray
          ✔ should start at the front when $slice reaches back too far
          ✔ should refuse a sortBy which sorts nothing
          ✔ should require $zip inputs to be written as an array
          ✔ should refuse a pair which is not a pair
        Taking Elements From an Array
          ✔ should take the first element with $first
          ✔ should take the last element with $last
          ✔ should take the first n with $firstN
          ✔ should take the last n with $lastN
          ✔ should take the smallest n with $minN
          ✔ should take the largest n with $maxN
      Object Operator Tests
        Merging Documents ($mergeObjects)
          ✔ should combine the fields of several documents
          ✔ should let the last document win a shared field
          ✔ should keep an overwritten field in its original position
          ✔ should append a new field after the fields already there
          ✔ should merge one level only
          ✔ should ignore a null or missing operand
          ✔ should answer nothing at all with an empty document
          ✔ should take a single document without a list
          ✔ should refuse an operand which is not a document
        Taking a Document Apart ($objectToArray)
          ✔ should turn each field into a k and v pair
          ✔ should keep the fields in the order the document holds them
          ✔ should keep a value of any type as it is
          ✔ should answer an empty document with an empty array
          ✔ should answer a null or missing operand with a null
          ✔ should refuse an operand which is not a document
          ✔ should undo $arrayToObject
        Reading a Field by Name ($getField)
          ✔ should read the named field of the input document
          ✔ should read a field whose name contains a dot
          ✔ should produce no value at all for a field which is not there
          ✔ should answer a null input with a null
          ✔ should produce no value at all for a missing input
          ✔ should produce no value at all for an input which is not a document
          ✔ should take the field name from a constant only
          ✔ should refuse a field name which is not a string
          ✔ should refuse an unknown argument and a missing one
        Writing a Field by Name ($setField)
          ✔ should add a field which was not there
          ✔ should replace a field which was there, in its own position
          ✔ should append a new field after the fields already there
          ✔ should write a field whose name contains a dot
          ✔ should write a null value rather than ignoring it
          ✔ should leave the input document alone
          ✔ should answer a null or missing input with a null
          ✔ should refuse an input which is not a document
          ✔ should refuse a field name which is not a string
          ✔ should refuse an unknown argument and a missing one
        Removing a Field by Name ($unsetField)
          ✔ should remove the named field
          ✔ should keep the remaining fields in order
          ✔ should remove a field whose name contains a dot, and only that one
          ✔ should leave a document which does not have the field alone
          ✔ should answer a null or missing input with a null
          ✔ should refuse an input which is not a document
          ✔ should refuse an unknown argument and a missing one
        The Field Name Rule
          ✔ should take a constant field name in $setField and $unsetField
          ✔ should refuse a computed field name in $setField and $unsetField
          ✔ should reach a field whose name begins with a dollar sign
      Accumulator Operator Tests
        Standard Deviation
          ✔ should divide by the count with $stdDevPop
          ✔ should divide by one less than the count with $stdDevSamp
          ✔ should answer a single value with zero and null
          ✔ should ignore a value which is not a number
          ✔ should answer a group with nothing numeric in it with null
        Merging a Group ($mergeObjects)
          ✔ should merge every document in the group
          ✔ should ignore a missing or null value
          ✔ should refuse a value which is not a document
        Taking Several Values ($firstN, $lastN, $minN, $maxN)
          ✔ should take from the ends of the group with $firstN and $lastN
          ✔ should take the extremes with $minN and $maxN
          ✔ should take the whole group when n is larger than it
          ✔ should keep a missing value in $firstN but not in $minN
          ✔ should refuse an n which is not a positive whole number
          ✔ should refuse an unknown argument and a missing one
        Taking by a Sort of Their Own ($top, $bottom, $topN, $bottomN)
          ✔ should take one document by sortBy and read its output
          ✔ should ignore the order the group arrived in
          ✔ should take several with $topN and $bottomN
          ✔ should sort by several keys
          ✔ should output a computed value
          ✔ should refuse a missing sortBy or output
          ✔ should refuse a sortBy which is not a sort specification
          ✔ should accept an empty sortBy rather than refusing it
          ✔ should refuse an argument which is not a document
          ✔ should refuse an unknown argument
        The 7.0 Accumulators ($median, $percentile)
          ✔ should not be available on the baseline server
      Reshaping Stage Tests
        Removing Fields ($unset)
          ✔ should remove one field named as a string
          ✔ should remove several fields named as an array
          ✔ should remove a nested field by dotted path
          ✔ should leave a document without the field alone
          ✔ should remove _id when asked
          ✔ should refuse an empty specification
          ✔ should refuse a specification which is not a string or an array of them
        Promoting a Document ($replaceRoot and $replaceWith)
          ✔ should promote a sub-document to the top level
          ✔ should promote a computed document
          ✔ should treat $replaceWith as the same stage without the newRoot wrapper
          ✔ should refuse a new root which is missing
          ✔ should refuse a new root which is not a document
          ✔ should accept a guarded new root
          ✔ should refuse a missing or unknown argument
          ✔ should not complain about a bad new root when no document reaches it
        Counting by Value ($sortByCount)
          ✔ should group by the expression and sort by count, descending
          ✔ should produce the same rows as the $group and $sort it stands for
          ✔ should group a missing value as null
          ✔ should take an expression operator as well as a path
          ✔ should refuse an argument which is not a path or an operator
        Taking a Sample ($sample)
          ✔ should take the number of documents asked for
          ✔ should take documents which are actually in the collection
          ✔ should take the whole collection when asked for more than it holds
          ✔ should take nothing for a size of zero
          ✔ should truncate a fractional size rather than refusing it
          ✔ should refuse a negative size and one which is not a number
          ✔ should refuse a missing or unknown argument
        Several Pipelines at Once ($facet)
          ✔ should run each pipeline over the same input and name its result
          ✔ should give each branch the whole input, not what another branch left
          ✔ should answer an empty branch with an empty array
          ✔ should refuse a branch which is not a pipeline
          ✔ should refuse an empty facet and a non-document one
      Bucketing Stage Tests
        Bucketing by Boundaries ($bucket)
          ✔ should put each document in the bucket its value falls in
          ✔ should count with a default output of count
          ✔ should put a value outside every bucket into the default
          ✔ should refuse a value outside every bucket when there is no default
          ✔ should accept no default when every value falls in a bucket
          ✔ should leave out a bucket which nothing fell into
          ✔ should refuse boundaries which are too few or out of order
          ✔ should refuse a missing or unknown argument
        Bucketing by Count ($bucketAuto)
          ✔ should spread the documents across the number of buckets asked for
          ✔ should take an output the same way $bucket does
          ✔ should produce fewer buckets than asked for when it cannot fill them
          ✔ should refuse a buckets count which is not a positive whole number
          ✔ should refuse a missing or unknown argument
          ✔ should answer an empty stream with no buckets
          ✔ should not split documents which share a value across a boundary
        What Both Stages Share
          ✔ should refuse an output which is not a document of accumulators
          ✔ should accept an output which names no accumulator, and disagree about it
          ✔ should keep a field whose accumulator produced no value
          ✔ should refuse boundaries which are not an array
      Filling Stage Tests
        Supplying a Missing Value ($fill)
          ✔ should fill a missing field with a constant
          ✔ should carry the last observed value forward with locf
          ✔ should interpolate between the values on either side with linear
          ✔ should fill within a partition only
          ✔ should partition by an expression as well as by field names
          ✔ should fill a value which is null as well as one which is missing
          ✔ should refuse a method which is not one it knows
          ✔ should take a method without a sortBy, and use the order it was given
          ✔ should refuse both a value and a method for the same field
          ✔ should take an output field naming neither, and fill nothing
          ✔ should refuse a missing or unknown argument
        Adding Missing Documents ($densify)
          ✔ should add a document for each step the sequence skipped
          ✔ should step by more than one
          ✔ should take explicit bounds
          ✔ should densify each partition separately
          ✔ should step through dates with a unit
          ✔ should refuse a unit on a numeric field
          ✔ should refuse a date field without a unit
          ✔ should refuse a step which is not positive
          ✔ should refuse a missing or unknown argument
        Edges of $fill
          ✔ should refuse a malformed output specification
          ✔ should refuse a malformed sortBy and partition
          ✔ should take a sort direction other than 1 or -1
          ✔ should write a null before the first observed value with locf
          ✔ should write a null at either end with linear
          ✔ should interpolate across several missing documents at once
          ✔ should write nulls for a run of gaps before the first value
          ✔ should refuse a repeated value in the sort field with linear
          ✔ should refuse to interpolate between values which are not numbers
        Edges of $densify
          ✔ should refuse a malformed field, range, and partition
          ✔ should refuse a malformed bounds
          ✔ should refuse a field which is neither a number nor a date
          ✔ should ignore a document which does not hold the field
          ✔ should add nothing when nothing holds the field at all
          ✔ should carry the partition onto every document it adds
        The Stage Which Cannot Be Reached From Here
          ✔ should refuse $documents in a collection aggregate
      Stage and Accumulator Tests
        Stages
          ✔ should select documents with $match
          ✔ should select with an operator in $match
          ✔ should order by one key and by several with $sort
          ✔ should take and drop documents with $limit and $skip
          ✔ should add a field with $addFields without removing the others
          ✔ should count the documents with the $count stage
          ✔ should count what reaches the $count stage, not what started
          ✔ should produce nothing for a $count over an empty stream
          ✔ should compute a field with $addFields
        $unwind
          ✔ should produce one document per element
          ✔ should drop a document whose array is empty or missing
          ✔ should keep those documents with preserveNullAndEmptyArrays
          ✔ should number the elements with includeArrayIndex
          ✔ should index a preserved document as null
        Refused Stages
          ✔ should refuse a $count field name which cannot be a field name
          ✔ should refuse an empty $project specification
          ✔ should refuse an $unwind with no path after the $
        $group
          ✔ should group by a field
          ✔ should group every document together with a null key
          ✔ should group by a compound key
        Accumulators
          ✔ should total with $sum
          ✔ should average with $avg
          ✔ should take the extremes with $min and $max
          ✔ should take the ends with $first and $last
          ✔ should write a null when $first or $last finds no value
          ✔ should collect every value with $push
          ✔ should collect distinct values with $addToSet
          ✔ should compare by content in $addToSet
          ✔ should skip a missing field in $addToSet
          ✔ should keep a null but drop a missing value in $push
          ✔ should keep a null but drop a missing value in $addToSet
          ✔ should order mixed types by the BSON type order in $min and $max
          ✔ should ignore a null as well as a missing value in $min and $max
          ✔ should count the group with the $count accumulator
          ✔ should ignore a field which is not there
          ✔ should take a NaN into the total rather than skipping it
          ✔ should skip a value which is not a number
        Swept In From the Unit Tests
          ✔ should group a missing key with the nulls
          ✔ should not group values of different types together
          ✔ should not add a field whose expression produces no value in $addFields
          ✔ should sort a document missing the sort field as though it were null
          ✔ should sort mixed types by the BSON type order
      Expression Rejection Tests
        Operators Which Take a Fixed Number of Operands
          ✔ should refuse too few operands
          ✔ should refuse too many operands
          ✔ should accept the count it asks for
        Operators Which Do Not Take a Fixed Number of Operands
          ✔ should accept any number of operands for a variadic operator
          ✔ should accept an empty operand list for $and and $or
          ✔ should not count the argument of $literal
          ✔ should accept either form of $cond
          ✔ should refuse $ifNull with one operand
        Rounding and Array Operators
          ✔ should refuse the wrong number of operands
          ✔ should refuse a non numeric operand to the rounding operators
          ✔ should refuse $size against anything but an array
          ✔ should refuse a bad $arrayElemAt operand
          ✔ should refuse a $concatArrays operand which is not an array
          ✔ should refuse an $in whose second operand is not an array
          ✔ should refuse a rounding place which is not an integer
          ✔ should refuse subtracting a date from a number
      Redact Tests
        ✔ should drop a document whose top level is pruned
        ✔ should prune a sub-document while keeping the document around it
        ✔ should keep a whole sub-tree without examining it with $$KEEP
        ✔ should descend into the documents inside an array
        ✔ should leave the values which are not documents alone while descending
        ✔ should read a field path as the level being asked about
        ✔ should give the level being asked about as $$CURRENT, and the root as $$ROOT
        ✔ should refuse its three variables outside the stage
        What $redact Refuses
          ✔ should refuse an expression which does not answer with one of its three variables
          ✔ should not mind a branch it does not take
      Variable Scope Tests
        ✔ should evaluate the vars of a $let in the scope around it
        System Variables
          ✔ should give the whole document as $$ROOT
          ✔ should give the stage input as $$ROOT and not the stored document
          ✔ should give the same document as $$CURRENT
          ✔ should walk a path into a system variable
          ✔ should give a path which the variable does not have no value at all
          ✔ should give the current time as $$NOW
          ✔ should give every document in one pipeline the same $$NOW
          ✔ should give every stage in one pipeline the same $$NOW
          ✔ should leave a field out of a projection with $$REMOVE
          ✔ should remove a field conditionally with $$REMOVE
          ✔ should remove an existing field from $addFields with $$REMOVE
          ✔ should give a null for a $$REMOVE in an array position
        Binding Variables with $let
          ✔ should bind a variable and use it in the in expression
          ✔ should evaluate a variable value as an expression
          ✔ should walk a path into a bound variable
          ✔ should still read the document from inside the in expression
          ✔ should see an outer variable from an inner $let
          ✔ should shadow an outer variable and restore it afterwards
          ✔ should bind a variable to a missing value
        Transforming an Array with $map
          ✔ should map every element, which $$this names by default
          ✔ should name the element with as
          ✔ should still read the document from inside the in expression
          ✔ should shadow $$this in a nested $map
          ✔ should map an empty array to an empty array
          ✔ should answer a null input with a null
          ✔ should answer a missing input with a null
        Selecting from an Array with $filter
          ✔ should keep the elements whose cond is true
          ✔ should name the element with as
          ✔ should stop at limit matches
          ✔ should ignore a limit larger than the number of matches
          ✔ should take a null limit as no limit
          ✔ should read a cond which is not a boolean for its truthiness
          ✔ should filter an empty array to an empty array
          ✔ should answer a null input with a null
          ✔ should answer a missing input with a null
        Folding an Array with $reduce
          ✔ should carry the accumulated value in $$value
          ✔ should build a value of any shape
          ✔ should answer an empty array with the initial value
          ✔ should still read the document from inside the in expression
          ✔ should answer a null input with a null
          ✔ should answer a missing input with a null
        The Forms Which Need $$CURRENT
          ✔ should read a field of $$CURRENT with the $getField shorthand
          ✔ should read a dotted name as a name in the shorthand too
          ✔ should set a field on the whole document with $$ROOT as the input
          ✔ should remove a field by setting it to $$REMOVE
        Variable Names Which Do Not Resolve
          ✔ should refuse a variable which is not bound
          ✔ should refuse a system variable written in the wrong case
          ✔ should refuse $$this and $$value outside the operator which binds them
          ✔ should refuse $$this inside a $map which renamed the element
          ✔ should refuse a bound variable after the operator which bound it has finished
        Variable Names Which Are Not Valid
          ✔ should refuse a $let name which does not begin with a lowercase letter
          ✔ should refuse an as name which is not a valid variable name
          ✔ should refuse a name whose later characters are not letters or digits
          ✔ should accept an underscore anywhere but first
          ✔ should refuse an as which is not a string at all
          ✔ should accept a name whose later characters are uppercase or digits
        Arguments the Binding Operators Refuse
          ✔ should refuse a $let which is missing vars or in
          ✔ should refuse an argument the operator does not have
          ✔ should refuse an argument document which is missing a required argument
          ✔ should refuse an argument which is not a document
          ✔ should refuse vars which is not a document
        Inputs the Array Operators Refuse
          ✔ should refuse an input which is neither an array nor nothing
          ✔ should refuse a $filter limit which is not a positive integer
          ✔ should evaluate the limit as an expression
          ✔ should take a limit which evaluates to nothing as no limit
          ✔ should take a $map result which is nothing as a null
        The $getField Shorthand
          ✔ should refuse the object form with no input
          ✔ should refuse a shorthand name which is a field path


  988 passing (342ms)
```

## Summary

- Unit Tests: 1388 passed (passed)
- Parity Tests: 988 passed (passed)
- Total: 2376 passed
