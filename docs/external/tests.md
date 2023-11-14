

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
    SplitPath Tests
      ✔ should not allow non-string paths
      ✔ should return an empty array for an empty path
      ✔ should not allow the $ element within a path
      ✔ should not allow the $ element at the root when path extensions are disabled
      ✔ should ignore bracketed [] array indeces when path extensions are disabled
      ✔ should split a path
      ✔ should split a path containing array indeces
    JoinPaths Tests
      ✔ should return an empty string when empty paths are provided
      ✔ should return an empty string when null is provided
      ✔ should join paths
    GetValue Tests
      ✔ should return the given document if path is an empty string "", null, or undefined
      ✔ should get document values
      ✔ should return an indexed array element, using dot notation
      ✔ should not allow the "$" root symbol when path extensions are disabled
      ✔ should not allow the [] array indexing when path extensions are disabled
      ✔ should return undefined if array index is out of bounds
    SetValue Tests
      ✔ requires a non-empty document
      ✔ requires a non-empty path
      ✔ should create a top level value
      ✔ should set a top level value
      ✔ should remove a top level value
      ✔ should create a nested value
      ✔ should set a nested value
      ✔ should remove a nested value
      ✔ should set an array value
      ✔ should insert nulls into new array elements
      ✔ should remove an array value
    ResolvePathTerminals Tests
      ✔ should not resolve when path is null
      ✔ should resolve primitive types
      ✔ should resolve entire object
      ✔ should resolve object fields
      ✔ should resolve indexed array elements
      ✔ should resolve complex structures
      ✔ should iterate over arrays
      ✔ should iterate over nested arrays

  150) Core with Path Extensions Tests
    SplitPath Tests with Path Extensions
      ✔ should not allow the $ element within a path
      ✔ should allow, but remove, the $ element at the root
      ✔ should allow bracketed [] array indeces
    JoinPaths Tests with Path Extensions
      ✔ should join paths with root $ element
      ✔ should join paths with bracketed [] array indeces
    GetValue Tests with Path Extensions
      ✔ should return the given document if path is an empty string "", null, or undefined
      ✔ should return the given document if path is $
      ✔ should get document values
      ✔ should return an indexed array element, using dot notation
      ✔ should return an indexed array element, using bracketed [] array indeces
      ✔ should return undefined if array index is out of bounds
    SetValue Tests with Path Extensions
      ✔ requires a non-empty document
      ✔ requires a non-empty path
      ✔ requires a non-root path
      ✔ should create a top level value
      ✔ should set a top level value
      ✔ should remove a top level value
      ✔ should create a nested value
      ✔ should set a nested value
      ✔ should remove a nested value
      ✔ should set an array value
      ✔ should set an array value using barcketed [] array indeces
      ✔ should insert nulls into new array elements
      ✔ should remove an array value

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

  jsongin Tests
    Rainbow Tests
      Operator $eq (===)
        ✔ should perform strict equality (===) on 'bns'
        ✔ should perform strict equality (===) on 'o'
        ✔ should perform strict equality (===) on 'a'
        ✔ should not perform loose equality (==) on 'bns'
        ✔ should not perform loose equality (==) on 'o'
        ✔ should not perform loose equality (==) on 'a'
        ✔ should equate null with undefined
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
        ✔ should equate null with undefined
      Operator $gt (>)
        ✔ should perform strict comparison (>=) on 'bns'
        ✔ should not perform loose comparison (>=) on 'bns'
      Operator $lte (<=)
        ✔ should perform strict comparison (<=) on 'bns'
        ✔ should not perform loose comparison (<=) on 'bns'
        ✔ should equate null with undefined
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


  342 passing (68ms)

