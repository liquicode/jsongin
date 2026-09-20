'use strict';
/*md

## Operators > Query > $type

Usage: `$type: type`
  or `$type: [ type, ... ]`

Matches a field which is of the given BSON type, named either as a string such as `'string'`
  or as its BSON type number. A list matches when the field is any one of the types.

Through an array, the field matches when the array ***itself*** is of the type or when ***any***
  element is.

A type MongoDB does not name is refused rather than matched against nothing.

Note that this is the ***query*** `$type`. There is no expression operator of this name here.

*/

const LIB_QUERY_OPTIONS = require( '../../../QueryOptions' );

module.exports = function ( jsongin )
{

	// Every BSON type MongoDB names, by alias and by number, whether or not jsongin can produce
	// a value of it. A type not in these lists is refused rather than answered.
	// MongoDB Ref: https://www.mongodb.com/docs/manual/reference/operator/query/type
	const TYPE_ALIASES = [
		'double', 'string', 'object', 'array', 'binData', 'undefined', 'objectId', 'bool', 'date',
		'null', 'regex', 'dbPointer', 'javascript', 'symbol', 'javascriptWithScope', 'int',
		'timestamp', 'long', 'decimal', 'minKey', 'maxKey', 'number',
	];
	const TYPE_CODES = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, -1, 127 ];


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'nsa',

		// MongoDB Ref: https://www.mongodb.com/docs/manual/reference/bson-types

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', Options )
		{
			let options = LIB_QUERY_OPTIONS.Normalize( Options );
			try
			{
				// Validate Expression.
				// A single type may be given, or an array of them, and any one matching is a
				// match. Both the BSON type number and its alias are accepted.
				if ( 'nsa'.includes( jsongin.ShortType( MatchValue ) ) === false )
				{
					// A direct call answers false for a value of the wrong type, which is the
					// API's promise; through Query() the ValueTypes check has already refused it.
					if ( jsongin.OpLog ) { jsongin.OpLog( `$type: requires a number, string or array but found type [${jsongin.ShortType( MatchValue )}] instead at [${Path}].` ); }
					return false;
				}
				let match_values = MatchValue;
				if ( jsongin.ShortType( match_values ) !== 'a' ) { match_values = [ match_values ]; }

				// Every type asked for must be one MongoDB names, by alias or by number. An
				// unknown type can match nothing, and MongoDB refuses it rather than
				// answering; this used to answer false. Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
				if ( match_values.length === 0 ) { throw new Error( `$type: requires at least one type at [${Path}].` ); }
				for ( let match_index = 0; match_index < match_values.length; match_index++ )
				{
					let match_value = match_values[ match_index ];
					let match_type = jsongin.ShortType( match_value );
					if ( match_type === 'n' )
					{
						if ( TYPE_CODES.includes( match_value ) === false ) { throw new Error( `$type: [${match_value}] is not a BSON type number at [${Path}].` ); }
					}
					else if ( match_type === 's' )
					{
						if ( TYPE_ALIASES.includes( match_value ) === false ) { throw new Error( `$type: [${match_value}] is not a BSON type alias at [${Path}].` ); }
					}
					else
					{
						throw new Error( `$type: requires a type number or alias but found type [${match_type}] at [${Path}].` );
					}
				}

				// $type asks about each value the path can mean.
				//
				// This used to ask GetValue for one value and, when that value was an array,
				// test its elements. A path crossing an array gathered every element's value
				// into an array, so the elements it then tested were the gathered values
				// rather than the field, and a field which genuinely held an array was never
				// tested as an array at all:
				//
				//   { a: [ { x: [ 5, 6 ] } ] } at 'a.x' gathered to [ [ 5, 6 ] ] and tested
				//   the element [ 5, 6 ], so { $type: 'int' } did not match although 5 and 6
				//   are ints, and neither did { $type: 'array' }.
				//
				// The candidate list carries the array itself as well as its elements, so both
				// answers fall out without a special case: an array field offers itself, which
				// satisfies { $type: 'array' }, and offers its elements, which satisfy their
				// own types. Verified against MongoDB 7.0.40.
				let candidates = jsongin.ResolveCandidates( Document, Path, options.ExpandArrays );

				for ( let match_index = 0; match_index < match_values.length; match_index++ )
				{
					let match_value = match_values[ match_index ];
					let match_type = jsongin.ShortType( match_value );

					if ( match_type === 'n' )
					{
						for ( let index = 0; index < candidates.length; index++ )
						{
							if ( jsongin.BsonType( candidates[ index ], false ) === match_value ) { return true; }
						}
					}
					else if ( match_type === 's' )
					{
						for ( let index = 0; index < candidates.length; index++ )
						{
							let result = jsongin.BsonType( candidates[ index ], true );
							if ( match_value === result ) { return true; }
							// 'number' is an alias for every numeric BSON type.
							if ( ( match_value === 'number' ) && [ 'int', 'long', 'double', 'decimal' ].includes( result ) ) { return true; }
						}
					}
					else
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `$type: requires a number or string but found type [${match_type}] instead at [${Path}].` ); }
						return false;
					}
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$type: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
