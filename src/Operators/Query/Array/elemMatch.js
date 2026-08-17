'use strict';
/*md

## Operators > Query > $elemMatch

Usage: `$elemMatch: { criteria }`

Matches an array field which has ***a single element*** satisfying all of the criteria at once.

That "at once" is the whole point: `{ v: [ 1, 9 ] }` does not match
  `{ $elemMatch: { $gt: 2, $lt: 5 } }` because no one element is both, while
  `{ v: [ 1, 4, 9 ] }` does.

***Within `$elemMatch` an element is a value, not a container.*** An element which is itself an
  array is not looked inside, so a nested array needs a nested `$elemMatch`:

```js
jsongin.Query( { v: [ [ { x: 1 } ] ] }, { v: { $elemMatch: { x: 1 } } } );                 // false
jsongin.Query( { v: [ [ { x: 1 } ] ] }, { v: { $elemMatch: { $elemMatch: { x: 1 } } } } ); // true
```

An empty criteria matches any array which has at least one ***document*** element.

Note that this is the ***query*** `$elemMatch`. There is also a ***projection*** `$elemMatch`,
  which returns the first matching element rather than selecting a document.

*/

module.exports = function ( jsongin )
{

	const LOGICAL = [ '$and', '$or', '$nor', '$not' ];


	//---------------------------------------------------------------------
	// Answers whether one element of an array satisfies the whole criteria.
	//
	// Every criterion has to hold for the same element, which is the point of $elemMatch:
	// { a: [ 1, 9 ] } does not match { $gt: 2, $lt: 5 } while { a: [ 1, 4, 9 ] } does.
	// Verified against MongoDB 6.0.1.
	//
	// ***The element is a value, not a container.*** Within $elemMatch an element which is
	// itself an array is never looked inside, whether the criterion is a comparison, a field,
	// or one of those wrapped in a logical operator. Ordinary array semantics resume below the
	// element. Both halves of that matter, and they are why the three branches below differ:
	//
	//   - An operator is called directly with ExpandArrays false, so it resolves the element
	//     and not the element's members.
	//   - A field criterion goes through Query(), which applies ordinary semantics from the
	//     element downwards. Only a document has fields to read, so an element which is not
	//     one cannot satisfy a field criterion at all.
	//   - A logical operator is evaluated here rather than handed to Query(), because Query()
	//     would restart its branches with ordinary path semantics and lose the rule.
	//     { $or: [ { x: 1 } ] } has to miss { a: [ [ { x: 1 } ] ] } exactly as a bare
	//     { x: 1 } does.
	//
	// Verified against MongoDB 6.0.1.
	function element_matches( Element, Criteria )
	{
		let element_type = jsongin.ShortType( Element );

		// An empty criteria matches an element which can hold fields, and nothing else.
		// { a: [ { x: 1 } ] } and { a: [ [ 1, 2 ] ] } both match { $elemMatch: {} }, while
		// { a: [ 1 ] } and { a: [ null ] } do not.
		if ( Object.keys( Criteria ).length === 0 ) { return 'oa'.includes( element_type ); }

		for ( let key in Criteria )
		{
			if ( LOGICAL.includes( key ) )
			{
				if ( logical_matches( Element, key, Criteria[ key ] ) === false ) { return false; }
				continue;
			}

			if ( typeof jsongin.QueryOperators[ key ] !== 'undefined' )
			{
				if ( jsongin.QueryOperators[ key ].Query( { value: Element }, Criteria[ key ], 'value', false ) === false ) { return false; }
				continue;
			}

			if ( element_type !== 'o' ) { return false; }

			let sub_criteria = {};
			sub_criteria[ key ] = Criteria[ key ];
			if ( jsongin.Query( { value: Element }, sub_criteria, 'value' ) === false ) { return false; }
		}

		return true;
	}


	//---------------------------------------------------------------------
	// Applies a logical operator to one element, keeping the element level rule across its
	// branches. Each branch is a criteria in its own right, so it comes back through
	// element_matches rather than going out to Query().
	function logical_matches( Element, Operator, Value )
	{
		if ( Operator === '$not' )
		{
			let value_type = jsongin.ShortType( Value );
			if ( value_type === 'r' )
			{
				return ( jsongin.QueryOperators.$regex.Query( { value: Element }, Value, 'value', false ) === false );
			}
			if ( value_type !== 'o' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `$elemMatch: $not requires an object or regexp but found type [${value_type}].` ); }
				return false;
			}
			return ( element_matches( Element, Value ) === false );
		}

		if ( jsongin.ShortType( Value ) !== 'a' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `$elemMatch: ${Operator} requires an array of criteria.` ); }
			return false;
		}

		// A branch of a logical operator is a criteria in its own right, so an operator which
		// cannot stand at the top of one is refused here as it would be there. A bare
		// { $gt: 1 } is a legitimate $elemMatch criteria and is not a legitimate $or branch.
		// Verified against MongoDB 6.0.1.
		for ( let index = 0; index < Value.length; index++ )
		{
			let branch = Value[ index ];
			if ( jsongin.ShortType( branch ) !== 'o' ) { continue; }
			for ( let key in branch )
			{
				let branch_operator = jsongin.QueryOperators[ key ];
				if ( typeof branch_operator === 'undefined' ) { continue; }
				if ( branch_operator.TopLevel === true ) { continue; }
				throw new Error( `$elemMatch: Operator [${key}] cannot appear at the top level of a ${Operator} branch.` );
			}
		}

		if ( Operator === '$and' )
		{
			for ( let index = 0; index < Value.length; index++ )
			{
				if ( element_matches( Element, Value[ index ] ) === false ) { return false; }
			}
			return true;
		}

		// $or and $nor differ only in whether a match is what they are looking for.
		let any_matched = false;
		for ( let index = 0; index < Value.length; index++ )
		{
			if ( element_matches( Element, Value[ index ] ) === true ) { any_matched = true; break; }
		}
		if ( Operator === '$or' ) { return any_matched; }
		return ( any_matched === false );
	}


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'o' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$elemMatch: match requires an object but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// The arrays the path can mean, taken as the values the path lands on.
				//
				// This used to ask GetValue for one value and index into it. A path crossing an
				// array gathers every element's value into one array there, which is
				// indistinguishable from a field which genuinely holds an array, so
				// { 'a.b': { $elemMatch: { $gt: 1 } } } missed { a: [ { b: [ 1, 2 ] } ] }.
				// That is the same failure ResolveCandidates was built for.
				//
				// The candidates are taken without the array element expansion, because
				// $elemMatch asks about the elements of the array itself and an element which
				// is another array is a value to test rather than a third array to search.
				let candidates = jsongin.ResolveCandidates( Document, Path, false );

				for ( let candidate_index = 0; candidate_index < candidates.length; candidate_index++ )
				{
					let candidate = candidates[ candidate_index ];

					// A field which is not an array, or is not there, matches nothing.
					if ( jsongin.ShortType( candidate ) !== 'a' ) { continue; }

					for ( let element_index = 0; element_index < candidate.length; element_index++ )
					{
						if ( element_matches( candidate[ element_index ], MatchValue ) === true ) { return true; }
					}
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$elemMatch: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
