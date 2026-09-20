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

const LIB_QUERY_OPTIONS = require( '../../../QueryOptions' );

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: true,
		// Whatever Evaluate() takes, which is any expression rather than only an operator object.
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', Options )
		{
			try
			{
				let options = LIB_QUERY_OPTIONS.Normalize( Options );
				// Validate the path.
				if ( Path !== '' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$expr: cannot appear at [${Path}]. Use $exprx to evaluate an expression against a sub-document.` ); }
					return false;
				}

				// Evaluate the expression against the document.
				//
				// ***The root frame is built here, and a caller may lend it a parent.*** A query
				// still has no variables of its own - Query( Document, Criteria ) takes two
				// values, the same as MongoDB gives a query no variables - so the frame is made
				// from the document in hand, which is what lets '$$ROOT' and '$$NOW' work here.
				// A lent scope becomes that frame's parent, so a name the caller bound resolves
				// through the chain while the document keeps '$$ROOT'. It is how Join() lends
				// '$$Left', and how MongoDB's $lookup lends `let` to a pipeline. With none,
				// NewDocument builds its own pipeline frame exactly as before.
				let value = jsongin.Evaluate( Document, MatchValue, jsongin.Scope.NewDocument( Document, options.Scope ) );

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
