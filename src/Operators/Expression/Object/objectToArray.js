'use strict';
/*md

## Operators > Expression > $objectToArray

Usage: `$objectToArray: document`

Turns a document into an array of `{ k: name, v: value }` pairs, one per field.

***The pairs come back in the order the document holds its fields***, not sorted. That order
  is what makes this the inverse of [$arrayToObject](#$arrayToObject), which builds a document
  from pairs in the order they are given.

A value of any type is carried through as it is, including a sub-document or an array.

A null or missing operand makes the result null. Anything else which is not a document throws.

*/

module.exports = function ( jsongin )
{

	const object = require( './_object' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'oaslu',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let operands = object.Operands( Document, Args, '$objectToArray', 1, 1 );
				let value = operands[ 0 ];

				let short_type = jsongin.ShortType( value );
				if ( 'lu'.includes( short_type ) ) { return null; }
				if ( short_type !== 'o' )
				{
					throw new Error( `$objectToArray: requires a document but found a [${short_type}] instead.` );
				}

				let pairs = [];
				let keys = Object.keys( value );
				for ( let index = 0; index < keys.length; index++ )
				{
					pairs.push( {
						k: keys[ index ],
						v: jsongin.SafeClone( value[ keys[ index ] ] ),
					} );
				}

				return pairs;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$objectToArray: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
