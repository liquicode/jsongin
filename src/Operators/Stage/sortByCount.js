'use strict';
/*md

## Operators > Stage > $sortByCount

Usage: `$sortByCount: expression`

Groups the documents by the expression and emits one document per group, holding the group's
  value as `_id` and how many documents it held as `count`, ***most frequent first***.

A shorthand for the [$group](#$group) and [$sort](#$sort) it stands for:

```js
// docs-check: skip
{ $group: { _id: expression, count: { $sum: 1 } } }
{ $sort: { count: -1 } }
```

A document whose expression resolves to a missing value is grouped under `null`, the same rule
  `$group` follows for its `_id`.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			try
			{
				// ***Not every expression is allowed here.*** $group would take { k: 1 } as an
				// expression object and group every document under it, which is a useless
				// answer to a question nobody meant to ask; MongoDB refuses it instead, and
				// accepts only a '$'-prefixed path or a document naming an operator. The check
				// belongs in this stage rather than in $group, which has other callers.
				let argument_type = jsongin.ShortType( Args );
				let allowed = false;
				if ( ( argument_type === 's' ) && Args.startsWith( '$' ) ) { allowed = true; }
				if ( argument_type === 'o' )
				{
					let keys = Object.keys( Args );
					if ( ( keys.length === 1 ) && keys[ 0 ].startsWith( '$' ) ) { allowed = true; }
				}
				if ( allowed === false )
				{
					throw new Error( `$sortByCount requires a '$'-prefixed field path or an expression operator but found ${JSON.stringify( Args )} instead.` );
				}

				// Built as the two stages it stands for, so that the shorthand cannot disagree
				// with the long form about grouping or about a missing value.
				let grouped = jsongin.StageOperators.$group.Stage(
					Documents, { _id: Args, count: { $sum: 1 } } );

				return jsongin.StageOperators.$sort.Stage( grouped, { count: -1 } );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$sortByCount: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
