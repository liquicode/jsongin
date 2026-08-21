'use strict';
/*md

## Operators > Expression > $switch

Usage: `$switch: { branches: [ { case: expression, then: expression }, ... ], default: expression }`

Evaluates each branch's `case` expression in order and returns the value of the `then`
  expression belonging to the first `case` which is true.
If no `case` is true, then the value of the `default` expression is returned.
If no `case` is true and no `default` was given, then an error is thrown.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$switch: requires an object with a [branches] field.` ); }
				if ( jsongin.ShortType( Args.branches ) !== 'a' ) { throw new Error( `$switch: requires a [branches] array.` ); }
				if ( Args.branches.length === 0 ) { throw new Error( `$switch: requires at least one branch.` ); }

				for ( let index = 0; index < Args.branches.length; index++ )
				{
					let branch = Args.branches[ index ];
					if ( jsongin.ShortType( branch ) !== 'o' ) { throw new Error( `$switch: each branch must be an object.` ); }
					if ( typeof branch.case === 'undefined' ) { throw new Error( `$switch: each branch requires a [case] field.` ); }
					if ( typeof branch.then === 'undefined' ) { throw new Error( `$switch: each branch requires a [then] field.` ); }

					let condition = jsongin.Evaluate( Document, branch.case, Scope );
					if ( jsongin.AsBoolean( condition ) === true )
					{
						return jsongin.Evaluate( Document, branch.then, Scope );
					}
				}

				if ( typeof Args.default === 'undefined' )
				{
					throw new Error( `$switch: no branch matched and no [default] was given.` );
				}

				return jsongin.Evaluate( Document, Args.default, Scope );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$switch: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
