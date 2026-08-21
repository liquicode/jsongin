'use strict';
/*md

## Operators > Expression > $ifNull

Usage: `$ifNull: [ expression, replacementExpression ]`
   or: `$ifNull: [ expression1, expression2, ..., replacementExpression ]`

Returns the value of the first expression which is neither null nor missing.
If all of the expressions are null or missing, then the value of the last expression is
  returned instead.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'a',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'a' ) { throw new Error( `$ifNull: requires an array of arguments.` ); }
				if ( Args.length < 2 )
				{
					throw new Error( `$ifNull: requires at least two arguments but found ${Args.length} instead.` );
				}

				// Return the first value which is neither null nor missing.
				for ( let index = 0; index < ( Args.length - 1 ); index++ )
				{
					let value = jsongin.Evaluate( Document, Args[ index ], Scope );
					if ( 'lu'.includes( jsongin.ShortType( value ) ) === false ) { return value; }
				}

				// Otherwise, return the replacement value.
				return jsongin.Evaluate( Document, Args[ Args.length - 1 ], Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$ifNull: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
