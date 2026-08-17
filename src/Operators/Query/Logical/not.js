'use strict';
/*md

## Operators > Query > $not

Usage: `$not: { operator-expression }`

Matches a field which does ***not*** satisfy the expression.

`$not` applies to a ***field***, and is not a top level operator: `{ $not: { ... } }` at the top
  level of a query is refused, as MongoDB refuses it. Use `$nor` to negate a whole query.

A field which is ***not there*** satisfies `$not`, because a missing field cannot meet the
  condition being negated.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// $not applies to a field, not to a query. MongoDB's top level operators are $and,
		// $or, $nor, $expr, $text, $where, $comment, and $jsonSchema, and it rejects
		// { $not: { ... } } with "unknown top level operator". This was declared true, so a
		// query written that way quietly returned an answer instead of being refused.
		TopLevel: false,
		ValueTypes: 'or',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Validate Expression
				let match_value = MatchValue;
				let match_type = jsongin.ShortType( match_value );

				// Compare
				let result = false;
				if ( match_type === 'o' )
				{
					result = jsongin.Query( Document, match_value, Path );
				}
				else if ( match_type === 'r' )
				{
					result = jsongin.QueryOperators.$regex.Query( Document, match_value, Path );
				}
				else
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$not: requires an object or regexp but found type [${match_type}] instead at [${Path}].` ); }
				}

				return !result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$not: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
