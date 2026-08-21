'use strict';
/*md

## Operators > Expression > $and

Usage: `$and: [ expression1, expression2, ... ]`

Returns true when all of the expressions are true.
Evaluation stops at the first expression which is false.
Only `false`, `0`, `null`, and missing values are false.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// A single argument may be given without the enclosing array, so any expression type.
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let expressions = Args;
				if ( jsongin.ShortType( expressions ) !== 'a' ) { expressions = [ expressions ]; }

				for ( let index = 0; index < expressions.length; index++ )
				{
					let value = jsongin.Evaluate( Document, expressions[ index ], Scope );
					if ( jsongin.AsBoolean( value ) === false ) { return false; }
				}

				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$and: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
