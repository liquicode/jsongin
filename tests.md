# @liquicode/jsongin

> Version: 0.0.22

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


  451 passing (83ms)

```
