'use strict';
/*md

## Operators > Comparison > $eq

Usage: `field: { $eq: value }`

Performs a strict equals between values in the document and values in the query.
Returns `true` if both values are strictly equal to each other.
For primitive types, `$eq` performs the javascript `===` comparison.

Notes:
- The semantics of `null` and `undefined` are equivalent (`null === undefined`)
- Returns `false` if document value and query value are of different types.
- Integers and doubles can be compared to each other (42 === 42.0).
- When comparing two objects, their fields must be in the same order.
- When comparing two arrays, their elements must be in the same order.
*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'bnsloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			// Get Document Value
			let actual_value = this.Engine.GetValue( Document, Path );
			let actual_type = this.Engine.ShortType( actual_value );

			// Validate Expression
			let match_value = MatchValue;
			let match_type = this.Engine.ShortType( match_value );

			// Compare
			if ( 'bnslru'.includes( match_type ) && ( match_type === actual_type ) ) 
			{
				// Primitive types must match exactly.
				return ( actual_value === match_value ); // Equivalence of primitive types.
			}
			else if ( 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) ) 
			{
				return true; // null and undefined are always equivalent.
			}
			else if ( ( match_type === 'o' ) && ( actual_type === 'o' ) ) 
			{
				// Objects must match exactly, including the key order.
				let result = ( JSON.stringify( match_value ) === JSON.stringify( actual_value ) );
				if ( result === true ) { return true; }
				return false;
			}
			else if ( ( match_type === 'a' ) && ( actual_type === 'a' ) ) 
			{
				// Arrays must match exactly, including the value order.
				// Or, the match array must exactly match an element of the document array.
				let match_json = JSON.stringify( match_value );
				let result = ( match_json === JSON.stringify( actual_value ) );
				if ( result === true ) { return true; }
				for ( let index = 0; index < actual_value.length; index++ )
				{
					result = ( match_json === JSON.stringify( actual_value[ index ] ) );
					if ( result === true ) { break; }
				}
				if ( result === true ) { return true; }
				return false;
			}
			if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$eq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
			return false; // Unsupported type or equivalence.
		},

		//---------------------------------------------------------------------
		ToMongoQuery: function ( Expression )
		{
			return Expression;
		},

		//---------------------------------------------------------------------
		ToSql: function ( Expression )
		{
			throw new Error( `ToSql() is not implemented.` );
		},

	};

	// Return the operator.
	return operator;
};
