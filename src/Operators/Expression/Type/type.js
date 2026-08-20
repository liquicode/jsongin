'use strict';
/*md

## Operators > Expression > $type

Usage: `$type: expression`

Returns the BSON type of a value, by name.

***A missing field has a type of its own, and it is not null.***
Reading a field which is not there gives `'missing'`, where a field holding a null gives
  `'null'`.

***A number is an `int` or a `double`, and never a `long`.***
Which one it is follows the rule the BSON serializer uses: a whole number inside the 32 bit
  range is an `int`, and anything else - fractional, larger, `NaN`, or infinite - is a
  `double`. See [Type Conversions](#$convert) for what that means after a conversion.

*/

module.exports = function ( jsongin )
{

	const type = require( './_type' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = type.Operands( Document, Args, '$type', 1, 1 );

				// BsonType() calls an absent value 'undefined', which is the Javascript name
				// for it. MongoDB calls it 'missing'.
				if ( jsongin.ShortType( operands[ 0 ] ) === 'u' ) { return 'missing'; }

				return jsongin.BsonType( operands[ 0 ], true );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$type: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
