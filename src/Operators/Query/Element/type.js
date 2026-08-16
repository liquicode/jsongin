'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Meta',
		TopLevel: false,
		ValueTypes: 'nsa',

		// MongoDB Ref: https://www.mongodb.com/docs/manual/reference/bson-types

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// Validate Expression.
				// A single type may be given, or an array of them, and any one matching is a
				// match. Both the BSON type number and its alias are accepted.
				let match_values = MatchValue;
				if ( jsongin.ShortType( match_values ) !== 'a' ) { match_values = [ match_values ]; }

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
				// own types. Verified against MongoDB 6.0.1.
				let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );

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
