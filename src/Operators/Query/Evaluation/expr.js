'use strict';
/*md

## Operators > Query > $expr

Usage: `$expr: expression`

Evaluates an aggregation expression against the document and matches when the result is true.
This allows a query to compare one document field to another, which is not possible with the
  other query operators.

`$expr` always evaluates its expression against the entire document, so it can only appear at
  the top level of a query, or within a top level `$and`, `$or`, or `$nor`.
Use the `$exprx` operator to evaluate an expression against a sub-document.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Evaluation',
		TopLevel: true,
		// Whatever Evaluate() takes, which is any expression rather than only an operator object.
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Validate the path.
				if ( Path !== '' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$expr: cannot appear at [${Path}]. Use $exprx to evaluate an expression against a sub-document.` ); }
					return false;
				}

				// Evaluate the expression against the document.
				let value = jsongin.Evaluate( Document, MatchValue );

				return jsongin.AsBoolean( value );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$expr: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
