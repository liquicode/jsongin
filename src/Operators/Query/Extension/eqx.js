'use strict';
/*md

## Operators > Comparison > $eqx

Usage: `field: { $eqx: value }`

Performs a match between values in the document and values in the query.
Returns `true` if both values are equal to each other.
This operator functions much in the same way as the `$eq` operator
but provides more relaxed matching than `$eq` does.
For primitive types, `$eqx` performs the javascript `==` comparison.

Notes:
- The semantics of `null` and `undefined` are equivalent (`null == undefined`)
- Booleans can be expressed numerically (`false == 0` and `true == 1`),
- Booleans can be expressed as strings (`false == "0"` and `true == "1"`),
- Integers and doubles can be compared to each other (`42 == 42.0`).
- Numerics and strings can be compared to each other (`42 == "42.0"`).
- When comparing two objects, their fields can appear in any order.
- When comparing two arrays, their elements can appear in any order.
*/

module.exports = module.exports = function ( jsongin )
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
			let flat_document = jsongin.Flatten( Document );
			let keys_document = Object.keys( flat_document );
			let flat_match = jsongin.Flatten( MatchValue );
			let keys_match = Object.keys( flat_match );
			if ( keys_match.length !== keys_document.length ) { return false; }
			for ( let index = 0; index < keys_match.length; index++ )
			{
				let key = keys_match[ index ];
				let result = ( flat_match[ key ] == flat_document[ key ] );
				if ( result === false ) { return false; }
			}
			return true;

			// // Get Document Value
			// let actual_value = this.Engine.GetValue( Document, Path );
			// let actual_type = this.Engine.ShortType( actual_value );

			// // Validate Expression
			// let match_value = MatchValue;
			// let match_type = this.Engine.ShortType( match_value );

			// if ( 'bns'.includes( match_type ) && 'bns'.includes( actual_type ) ) 
			// {
			// 	return ( actual_value == match_value ); // Equivalence of primitive types.
			// }
			// else if ( 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) ) 
			// {
			// 	return true; // null and undefined are always equivalent.
			// }
			// else if ( 'bnslu'.includes( match_type ) || 'bnslu'.includes( actual_type ) ) 
			// {
			// 	return false; // Cannot compare primitive types to non-primitive types.
			// }
			// else if ( ( match_type === 'o' ) && ( actual_type === 'o' ) ) 
			// {
			// 	// Objects can match loosely, regardless of key order.
			// 	let match_keys = Object.keys( match_value );
			// 	let actual_keys = Object.keys( actual_value );
			// 	if ( match_keys.length !== actual_keys.length ) { return false; }
			// 	for ( let index = 0; index < match_keys.length; index++ )
			// 	{
			// 		let key = match_keys[ index ];
			// 		let result = ( match_value[ key ] == actual_value[ key ] );
			// 		if ( result === false ) { return false; }
			// 	}
			// 	return true;
			// }
			// else if ( ( match_type === 'a' ) && ( actual_type === 'a' ) ) 
			// {
			// 	if ( match_value.length !== actual_value.length ) { return false; }
			// 	let working = [ ...actual_value ];
			// 	for ( let match_index = 0; match_index < match_value.length; match_index++ )
			// 	{
			// 		let matched = false;
			// 		for ( let working_index = 0; working_index < working.length; working_index++ )
			// 		{
			// 			if ( match_value[ match_index ] == working[ working_index ] )
			// 			{
			// 				matched = true;
			// 				working.splice( working_index, 1 );
			// 				break;
			// 			}
			// 		}
			// 		if ( matched === false ) { return false; }
			// 	}
			// 	return true;
			// }
			// if ( this.Engine.Settings.Explain ) { this.Engine.Explain.push( `$eqx: cannot compare [${match_type}] type with [${value_type}] type at [${Path}].` ); }
			// return false; // Unsupported type or equivalence.
		},

		//---------------------------------------------------------------------
		ToMongoQuery: function ( Expression )
		{
			throw new Error( `ToMongoQuery() is not implemented.` );
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
