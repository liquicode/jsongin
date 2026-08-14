'use strict';
/*md

## Operators > Accumulator > $max

Usage: `$max: expression`

Returns the largest value in a group.
Null and missing values are ignored.
Returns `null` for an empty group and for a group in which every value is null or missing.

Values are ordered by `CompareValues()`, which follows MongoDB's BSON type order, so a group
  holding values of different types still has a well defined largest value.

Note that this is the accumulator `$max`. There is also an expression operator `$max`, which
  selects the largest of several values within one document, and an update operator `$max`,
  which conditionally modifies a document field.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Accumulator',
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args )
		{
			try
			{
				let values = accumulator.Values( Documents, Args );

				let selected = null;
				let has_value = false;
				for ( let index = 0; index < values.length; index++ )
				{
					// Null and missing values are ignored.
					if ( 'lu'.includes( jsongin.ShortType( values[ index ] ) ) ) { continue; }
					if ( has_value === false )
					{
						selected = values[ index ];
						has_value = true;
						continue;
					}
					if ( jsongin.CompareValues( values[ index ], selected ) > 0 ) { selected = values[ index ]; }
				}

				if ( has_value === false ) { return null; }
				return selected;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$max: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
