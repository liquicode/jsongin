'use strict';
/*md

## Operators > Update > $pull

Usage: `$pull: { array-field: condition, ... }`

Removes every element of an array field which the condition selects.

***The condition is a query, not a value***, which is the whole of what makes this different
from [$pullAll](#$pullAll) beside it. `$pullAll` removes elements equal to the ones listed;
`$pull` removes every element a query selects, so it reaches operators and ranges:

| **Written** | **Removes** |
|-------------|--------------|
| `{ $pull: { a: 3 } }` | every element equal to `3` |
| `{ $pull: { a: { $gt: 3 } } }` | every element greater than `3` |
| `{ $pull: { a: { b: 1 } } }` | every element whose `b` is `1` |

***A bare document is a condition on the fields of each element***, not a value to match whole,
so `{ b: 1 }` removes `{ b: 1, c: 2 }` as well as `{ b: 1 }`. Write
[$pullAll](#$pullAll) to remove documents by equality instead.

***The condition applies to an element, not through it.*** A query for `{ a: 1 }` matches a
document whose `a` is `[ 1, 2 ]`, but `{ $pull: { a: 1 } }` does not remove a `[ 1, 2 ]` element
from `a`. Only an element which is itself `1` goes.

A field which is not there is left alone, which is a no-op rather than a refusal. A field which
is there and is not an array is refused.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Whether a condition selects one array element.
	//
	// Three shapes, and telling them apart is the whole of the operator:
	//
	//   { $gt: 3 }   an operator condition, which applies to the element as a value. The
	//                element is put under a field so that Query() has one to apply it to.
	//   { b: 1 }     a field condition, which applies to the element's own fields. Query()
	//                takes it as it stands, and an element which cannot hold fields matches
	//                nothing.
	//   3            a value, matched by content the way $pullAll matches.
	//
	// A value is not put through Query() as an implicit equality, which would be the obvious
	// thing to do and is wrong: an implicit equality against an array field matches when any
	// element of it matches, so pulling 1 would take a [ 1, 2 ] element with it. Verified
	// against MongoDB 6.0.1.
	function selects( Condition, Element )
	{
		if ( jsongin.ShortType( Condition ) !== 'o' )
		{
			return ( jsongin.CompareValues( Element, Condition ) === 0 );
		}

		// ***One '$' key makes it an operator condition***, and everything else is a condition
		// on fields - including an empty document, which selects every element that has fields
		// and nothing else. Deciding it the other way round, by asking whether every key is an
		// operator, reads {} as an operator condition and matches scalars too. Verified against
		// MongoDB 6.0.1.
		let keys = Object.keys( Condition );
		let has_operator = false;
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( keys[ index ].startsWith( '$' ) ) { has_operator = true; break; }
		}

		if ( has_operator ) { return jsongin.Query( { value: Element }, { value: Condition } ); }

		if ( jsongin.ShortType( Element ) !== 'o' ) { return false; }
		return jsongin.Query( Element, Condition );
	}


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: true,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Update: function ( Document, UpdateFields )
		{
			try
			{
				if ( jsongin.ShortType( UpdateFields ) !== 'o' ) { throw new Error( `The UpdateFields parameter must be an object.` ); }

				let operation_result = true;
				for ( let field in UpdateFields )
				{
					let array = jsongin.GetValue( Document, field );

					// A field which is not there has nothing to pull from, and MongoDB reports
					// a successful update rather than an error. The same rule $pullAll follows.
					if ( jsongin.ShortType( array ) === 'u' ) { continue; }

					if ( jsongin.ShortType( array ) !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pull: The field [${field}] must be an array.` ); }
						operation_result = false;
						continue;
					}

					// Walked backwards so that removing an element does not shift the ones
					// which have not been examined yet.
					for ( let index = ( array.length - 1 ); index >= 0; index-- )
					{
						if ( selects( UpdateFields[ field ], array[ index ] ) )
						{
							array.splice( index, 1 );
						}
					}

					// ***No guard on the result.*** $pullAll has one here and it cannot fire:
					// SetValue() throws for a path it will not write - a path reaching into an
					// array by field name - rather than answering false, and every other path
					// which GetValue read above can be written back. Writing the guard anyway
					// would add a branch no test can reach.
					jsongin.SetValue( Document, field, array );
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$pull: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
