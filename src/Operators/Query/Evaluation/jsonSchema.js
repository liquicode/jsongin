'use strict';
/*md

## Operators > Query > $jsonSchema

Usage: `$jsonSchema: schema`

Matches a document which satisfies the given JSON Schema, read the way MongoDB reads one: draft
  4 of the specification with `bsonType` beside `type`, no references, and a refusal for every
  keyword it does not know. A date is a `date` and never a `string`, `type` has no `integer`, and
  a dotted name in `required` or `properties` is a path through the document.

`$jsonSchema` is a ***top level*** operator. It may also stand inside `$and`, `$or`, `$nor` and
  `$elemMatch`, where an element matches only when it is an object. Below a field, and inside
  `$not`, it is refused.

A schema MongoDB would refuse is refused here rather than answered: an unknown keyword, a
  keyword from a later draft, an empty `required` or `enum`, a bound which is not a number.

The same evaluator, in every draft of the specification, is reached through
  `jsongin.ValidateDocument( Document, Schema )`, which also says ***why*** a document failed.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: true,
		// Allowed inside $elemMatch, applied to each element, which $elemMatch refuses every
		// other top level operator. Measured on MongoDB 6.0.28, 7.0.40 and 8.3.8.
		ElementLevel: true,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				if ( jsongin.ShortType( MatchValue ) !== 'o' )
				{
					throw new Error( `$jsonSchema must be an object but found type [${jsongin.ShortType( MatchValue )}] at [${Path}].` );
				}

				// At the top of a query the instance is the document. Inside $elemMatch the
				// element arrives as the value at Path, which is how every operator is handed
				// an element there.
				let instance = ( Path === '' ) ? Document : jsongin.GetValue( Document, Path );

				// The schema is checked for what MongoDB refuses before the instance is looked
				// at, so a malformed schema throws whatever the document holds.
				let findings = jsongin.ValidateDocument( instance, MatchValue, { Dialect: 'mongodb' } );
				if ( findings.length === 0 ) { return true; }

				if ( jsongin.OpLog ) { jsongin.OpLog( `$jsonSchema: the document does not satisfy the schema at [${findings[ 0 ].keywordLocation}]: ${findings[ 0 ].error}` ); }
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$jsonSchema: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
