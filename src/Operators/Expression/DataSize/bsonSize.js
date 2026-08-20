'use strict';
/*md

## Operators > Expression > $bsonSize

Usage: `$bsonSize: expression`

The number of bytes a document occupies once encoded as BSON.

The count is the encoding's own arithmetic: 4 bytes for the document's length, then each
  element as one type byte plus its field name plus a terminating zero plus its value, then 1
  byte to close the document.
An ***array*** is encoded as a document whose keys are `'0'`, `'1'`, and so on, which is why an
  array of two numbers costs more than the two numbers do.

A null or missing operand makes the result null.
Anything which is not a document throws, because only a document has a BSON size.

*/

module.exports = function ( jsongin )
{

	const datasize = require( './_datasize' )( jsongin );

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
				let operands = datasize.Operands( Document, Args, '$bsonSize', 1, 1 );

				let value = operands[ 0 ];
				let short_type = jsongin.ShortType( value );
				if ( 'lu'.includes( short_type ) ) { return null; }
				if ( short_type !== 'o' )
				{
					throw new Error( `$bsonSize: requires a document but found a [${short_type}] instead.` );
				}

				return datasize.DocumentSize( value, '$bsonSize' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$bsonSize: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
