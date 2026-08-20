'use strict';
/*md

## Operators > Expression > $arrayToObject

Usage: `$arrayToObject: expression`

Converts an array of key and value pairs into a document.

A pair is written in one of two ways, and an array may not mix them:

- as a ***two element array***, `[ 'a', 1 ]`
- as a ***document***, `{ k: 'a', v: 1 }`

***A repeated key keeps the last value***, so `[ [ 'a', 1 ], [ 'a', 2 ] ]` gives `{ a: 2 }`.

A key must be a string. A null or missing operand makes the result null.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

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
				let operands = array.Operands( Document, Args, '$arrayToObject', 1, 1 );

				let pairs = array.AsArrayOrNull( operands[ 0 ], '$arrayToObject' );
				if ( pairs === null ) { return null; }

				let result = {};
				for ( let index = 0; index < pairs.length; index++ )
				{
					let pair = pairs[ index ];
					let short_type = jsongin.ShortType( pair );

					let key = null;
					let value = null;

					if ( short_type === 'a' )
					{
						if ( pair.length !== 2 )
						{
							throw new Error( `$arrayToObject: requires pairs of exactly two elements but found ${pair.length}.` );
						}
						key = pair[ 0 ];
						value = pair[ 1 ];
					}
					else if ( short_type === 'o' )
					{
						if ( !( 'k' in pair ) || !( 'v' in pair ) )
						{
							throw new Error( `$arrayToObject: requires a document pair to hold both a [k] and a [v].` );
						}
						key = pair.k;
						value = pair.v;
					}
					else
					{
						throw new Error( `$arrayToObject: requires each pair to be an array or a document but found a [${short_type}].` );
					}

					if ( jsongin.ShortType( key ) !== 's' )
					{
						throw new Error( `$arrayToObject: requires a string key but found a [${jsongin.ShortType( key )}].` );
					}

					result[ key ] = value;
				}

				return result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$arrayToObject: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
