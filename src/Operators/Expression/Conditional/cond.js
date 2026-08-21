'use strict';
/*md

## Operators > Expression > $cond

Usage: `$cond: [ ifExpression, thenExpression, elseExpression ]`
   or: `$cond: { if: expression, then: expression, else: expression }`

Evaluates the `if` expression and returns the value of either the `then` expression or the
  `else` expression.
Only the branch which is selected gets evaluated.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'ao',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let if_expression = null;
				let then_expression = null;
				let else_expression = null;

				let args_type = jsongin.ShortType( Args );
				if ( args_type === 'a' )
				{
					if ( Args.length !== 3 )
					{
						throw new Error( `$cond: requires exactly three arguments but found ${Args.length} instead.` );
					}
					if_expression = Args[ 0 ];
					then_expression = Args[ 1 ];
					else_expression = Args[ 2 ];
				}
				else if ( args_type === 'o' )
				{
					if ( typeof Args.if === 'undefined' ) { throw new Error( `$cond: requires an [if] field.` ); }
					if ( typeof Args.then === 'undefined' ) { throw new Error( `$cond: requires a [then] field.` ); }
					if ( typeof Args.else === 'undefined' ) { throw new Error( `$cond: requires an [else] field.` ); }
					if_expression = Args.if;
					then_expression = Args.then;
					else_expression = Args.else;
				}
				else
				{
					throw new Error( `$cond: requires an array of three arguments or an object with if, then, and else fields.` );
				}

				let condition = jsongin.Evaluate( Document, if_expression, Scope );
				if ( jsongin.AsBoolean( condition ) === true )
				{
					return jsongin.Evaluate( Document, then_expression, Scope );
				}
				return jsongin.Evaluate( Document, else_expression, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$cond: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
