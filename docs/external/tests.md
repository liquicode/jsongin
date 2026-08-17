# @liquicode/jsongin

> Version: 0.1.0

# Test Results

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
      ✔ should not stringify regular expressions
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
      ✔ It keeps a plain string
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
      ✔ should reject a non-object UpdateFields for $currentDate
      ✔ should reject a non-object UpdateFields for $addToSet
      ✔ should reject a non-object UpdateFields for $pop
      ✔ should reject a non-object UpdateFields for $push
      ✔ should reject a non-object UpdateFields for $pullAll
    Operator OpError Reporting
      ✔ should report from every expression operator which rejects its argument
      ✔ should report from every update operator which rejects its argument
      ✔ should report from every accumulator which rejects its argument
      ✔ should report from every stage which rejects its argument
      ✔ should report from the query operators which reject their argument (6ms)
    Aggregation Argument Validation
      ✔ should reject a non-array Documents to every accumulator
      ✔ should reject a malformed argument to every stage

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
    $all Tests
      ✔ should require every value to be present
      ✔ should select against a field which is not an array
      ✔ should match a field which really holds an array
      ✔ should gather values from across array elements
      ✔ should match an element which is itself an array
      ✔ should select nothing for an empty match array
      ✔ should not match a missing field
      ✔ should reject a non array match value
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
      ✔ should throw when system variables are used
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
      ✔ should equate null and missing values
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
      ✔ should omit a field whose accumulated value is missing
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
    $expr and $exprx Placement Tests
      ✔ should not allow $expr to appear within a field
      ✔ should give $expr and $exprx the same meaning at the top level
      ✔ should resolve the same field name differently at each level

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


  1124 passing (279ms)

```
