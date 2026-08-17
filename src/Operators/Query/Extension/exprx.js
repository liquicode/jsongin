'use strict';
/*md

## Operators > Query > $exprx

Usage: `$exprx: expression`

Evaluates an aggregation expression and matches when the result is true.
This is a `jsongin` extension of the `$expr` operator.

Unlike `$expr`, this operator can appear anywhere within a query:
- At the top level of a query, it evaluates the expression against the entire document,
  which is exactly what `$expr` does.
- Within a field, it evaluates the expression against the sub-document found at that field,
  so field references address the sub-document rather than the entire document.
- When that field contains an array, the expression is evaluated against each element of the
  array and the operator matches if any of those elements match.

*/

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
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// At the top level, evaluate against the entire document.
				if ( Path === '' )
				{
					return jsongin.AsBoolean( jsongin.Evaluate( Document, MatchValue ) );
				}

				// Otherwise, evaluate against the sub-document found at Path.
				let sub_document = jsongin.GetValue( Document, Path );
				let sub_document_type = jsongin.ShortType( sub_document );

				// Evaluate against each element of an array.
				if ( sub_document_type === 'a' )
				{
					for ( let index = 0; index < sub_document.length; index++ )
					{
						if ( jsongin.ShortType( sub_document[ index ] ) !== 'o' ) { continue; }
						let value = jsongin.Evaluate( sub_document[ index ], MatchValue );
						if ( jsongin.AsBoolean( value ) === true ) { return true; }
					}
					return false;
				}

				// Evaluate against a sub-document.
				if ( sub_document_type === 'o' )
				{
					return jsongin.AsBoolean( jsongin.Evaluate( sub_document, MatchValue ) );
				}

				if ( jsongin.OpLog ) { jsongin.OpLog( `$exprx: requires an object or an array but found type [${sub_document_type}] instead at [${Path}].` ); }
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$exprx: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
