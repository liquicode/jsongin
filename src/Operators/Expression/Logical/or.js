'use strict';
/*md

## Operators > Expression > $or

Usage: `$or: [ expression1, expression2, ... ]`

Returns true when any of the expressions is true.
Evaluation stops at the first expression which is true.
Only `false`, `0`, `null`, and missing values are false.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Logical',
		ArgTypes: 'a',
		ArgCount: null,

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let expressions = Args;
				if ( jsongin.ShortType( expressions ) !== 'a' ) { expressions = [ expressions ]; }

				for ( let index = 0; index < expressions.length; index++ )
				{
					let value = jsongin.Evaluate( Document, expressions[ index ] );
					if ( jsongin.AsBoolean( value ) === true ) { return true; }
				}

				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$or: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
