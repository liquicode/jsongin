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
      ✔ should not stringify regular expressions (27ms)
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
      Functionality Beyond Javascript's JSON.stringify()
        ✔ should stringify complex objects with Javascript syntax
        ✔ It should parse an object written with JS (not JSON) syntax
        ✔ It should parse an object followed by unrelated text
    SplitPath Tests
      ✔ It returns an array of path components
      ✔ It returns array indexes as numerics in the output array
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
      ✔ It performs reverse indexing when an array index is negative
      ✔ Array elements can be set to undefined, but they are not removed
      ✔ It sets fields inside an array of objects
      ✔ It sets fields inside all elements of an array of objects
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
      ✔ It clones dates by value, not by reference (6ms)
      ✔ It can clone a date given as the document itself
      ✔ It can selectively clone with the Exceptions parameter
      ✔ It should throw an error if an invalid Exceptions paramter is provided
    Flatten/Expand Tests
      ✔ It flattens a hierarchical document
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
    Sort Tests
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
      ✔ should not modify the array it was given
      ✔ should throw when the parameters are wrong
    Distinct Tests
      ✔ should return one entry per unique value
      ✔ should treat a combination of fields as the unique key
      ✔ should support nested field paths
      ✔ should return only the fields named in the criteria
      ✔ should return an empty array for no documents
      ✔ should throw when the parameters are wrong
    Update Tests
      ✔ should apply an update operator
      ✔ should apply several update operators in one call
      ✔ should return a copy and leave the original document unchanged
      ✔ should return the document unchanged when there are no updates
      ✔ should ignore an unknown update operator
      ✔ should return null when the parameters are wrong
    StrictEquals and LooseEquals Tests
      ✔ should compare primitives strictly
      ✔ should compare primitives loosely
      ✔ should equate null and undefined
      ✔ should compare objects by value
      ✔ should require key order to match strictly, but not loosely
      ✔ should compare arrays by value
    BsonType Tests
      ✔ should return the BSON type number and alias
      ✔ should distinguish integers from doubles
      ✔ should report dates as the date BSON type
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
      ✔ should return true for a field which was not there
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
      ✔ should report a Parse failure to the OpError log, and rethrow
      ✔ should stay silent when no OpError is configured
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
      ✔ should report from the query operators which reject their argument
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
      ✔ should not compare objects
      ✔ should not compare arrays
      ✔ should not compare functions
      ✔ should compare undefined values
      ✔ should compare null and undefined values
    $gt Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should not compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should not compare objects
      ✔ should not compare arrays
      ✔ should not compare functions
      ✔ should not compare undefined values
      ✔ should not compare null and undefined values
    $lte Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should not compare objects
      ✔ should not compare arrays
      ✔ should not compare functions
      ✔ should compare undefined values
      ✔ should compare null and undefined values
    $lt Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should not compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should not compare objects
      ✔ should not compare arrays
      ✔ should not compare functions
      ✔ should not compare undefined values
      ✔ should not compare null and undefined values
    $in Tests
      ✔ should compare two booleans
      ✔ should not compare boolean values and numeric values
      ✔ should not compare boolean values and string values
      ✔ should compare two numerics
      ✔ should not compare numeric values and string values
      ✔ should compare two strings
      ✔ should compare two nulls
      ✔ should not compare null to other types (bns)
      ✔ should not compare objects
      ✔ should not compare arrays
      ✔ should not compare functions
      ✔ should not compare undefined values
      ✔ should not compare null and undefined values
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
      ✔ should default to true when no conditions are specified
      ✔ should be true when all of its conditions are true
      ✔ should be false when one of its conditions is false
    $or Tests
      ✔ should default to false when no conditions are specified
      ✔ should be true when one of its conditions are true
      ✔ should be false when all of its conditions are false
    $nor Tests
      ✔ should default to true when no conditions are specified
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
      ✔ should carry dates through the pipeline as dates

  250) Update Operator Tests
    Field Update Operator Tests
      $set Tests
        ✔ should set values
        ✔ should set nested values
      $unset Tests
        ✔ should unset values
        ✔ should set nested values
      $rename Tests
        ✔ should rename values
        ✔ should rename nested values
        ✔ should move values and create topography
      $inc Tests
        ✔ should increment values
        ✔ should increment nested values
        ✔ should decrement values
      $min Tests
        ✔ should set min values
        ✔ should set min nested values
      $max Tests
        ✔ should set min values
        ✔ should set min nested values
      $mul Tests
        ✔ should multiply values
        ✔ should multiply nested values
      $currentDate Tests
        ✔ should set the current date
        ✔ should set the current date for nested values
    Array Update Operator Tests
      $addToSet Tests
        ✔ should add to a set of values
        ✔ should not add to a set of values if the value already exists
      $pop Tests
        ✔ should remove from the end of an array
        ✔ should remove from the beginning of an array
      $push Tests
        ✔ should push values to the end of an array
      $pullAll Tests
        ✔ should pull values from the array
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

  jsongin Query Tests
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

  jsongin Update Tests
    Ad-Hoc Update Tests
      ✔ should do simple updates

  jsongin Projection Tests
    Ad-Hoc Projection Tests
      ✔ should do simple projection
      ✔ should project embedded fields
      ✔ should supress fields
      ✔ should supress only the _id field
      ✔ should supress the _id field and other fields
      ✔ should supress the _id field but include other fields
      ✔ should return only the _id field
      ✔ should supress the _id field while including others

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
      ✔ should not add an _id to a document which does not have one
      ✔ should omit an included field which is not in the document
      ✔ should keep dates through a projection
      ✔ should not alias the source document

  jsongin Aggregate Tests
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


  961 passing (229ms)

```
