'use strict';
/*md

## Operators > Expression > $not

Usage: `$not: expression` or `$not: [ expression ]`

Returns the opposite of the expression's boolean value.
Only `false`, `0`, `null`, and missing values are false.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let expression = Args;
				if ( jsongin.ShortType( expression ) === 'a' )
				{
					if ( expression.length !== 1 )
					{
						throw new Error( `$not: requires exactly one argument but found ${expression.length} instead.` );
					}
					expression = expression[ 0 ];
				}

				let value = jsongin.Evaluate( Document, expression, Scope );

				return ( jsongin.AsBoolean( value ) === false );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$not: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
