'use strict';
/*md

## Operators > Stage > $redact

Usage: `$redact: expression`

Restricts the contents of each document by asking an expression, level by level, what to do
  with each one.

***This is not a filter.*** `$match` decides about whole documents; `$redact` walks into a
  document and asks again about every sub-document it finds, so one document can come through
  with a part of it removed. That is the reason it exists, and it is what makes a single
  pipeline able to serve callers who may see different parts of the same record.

The expression must answer with one of three system variables, which are bound only within
  this stage:

| **Variable**  | **Description**                                                            |
|---------------|------------------------------------------------------------------------------|
| `$$DESCEND`   | Keep the fields at this level, and ask again about the documents below it. |
| `$$PRUNE`     | Remove this level entirely, without asking about anything below it.        |
| `$$KEEP`      | Keep this level entirely, without asking about anything below it.          |

```js
const by_level = {
	$redact: { $cond: [ { $lte: [ '$level', 3 ] }, '$$DESCEND', '$$PRUNE' ] }
};
```

***`$$CURRENT` is the level being asked about, and `$$ROOT` stays the whole document.*** A
  bare field path such as `'$level'` reads the level, which is what makes the expression above
  ask each sub-document about its own `level` rather than about the root's.

***`$$DESCEND` descends into the documents inside an array***, element by element. An element
  which is pruned is removed from the array rather than left as a null. Values which are not
  documents are kept exactly as they are.

A document whose ***top*** level is pruned does not appear in the output at all.

***The answer is checked, not the expression.*** Only the branch which actually runs has to
  produce one of the three, so a `$cond` whose other branch produces something else is fine
  until that branch is taken. An answer which is anything else throws.

*/

module.exports = function ( jsongin )
{

	// ***Three values which cannot be mistaken for a caller's.*** The expression answers by
	// evaluating to one of these, and the answer is recognized by identity rather than by
	// shape, so a document which happens to hold an equal-looking object is still just data.
	// They are bound only in the frame this stage makes, which is what makes '$$KEEP' an
	// undefined variable everywhere else.
	const DESCEND = Object.freeze( { $redact: 'DESCEND' } );
	const PRUNE = Object.freeze( { $redact: 'PRUNE' } );
	const KEEP = Object.freeze( { $redact: 'KEEP' } );


	//---------------------------------------------------------------------
	// Asks the expression about one level, and answers what to do with it.
	//
	// Returns { Pruned: true } or { Pruned: false, Value: ... }. Pruned is reported apart from
	// the value for the reason Scope.Lookup reports Found apart from Value: a level which was
	// removed is not a level which came back empty, and only the first takes its field with it.
	function redact_level( Level, Root, Args, Scope )
	{
		let scope = Scope.Child( {
			ROOT: Root,
			CURRENT: Level,
			DESCEND: DESCEND,
			PRUNE: PRUNE,
			KEEP: KEEP,
		} );

		let answer = jsongin.Evaluate( Level, Args, scope );

		if ( answer === PRUNE ) { return { Pruned: true }; }
		if ( answer === KEEP ) { return { Pruned: false, Value: jsongin.SafeClone( Level ) }; }
		if ( answer !== DESCEND )
		{
			throw new Error( `$redact: the expression must answer with [$$DESCEND], [$$PRUNE], or [$$KEEP], but it answered with ${JSON.stringify( answer )}.` );
		}

		// Descending. The fields at this level are kept, in the order they are held, and each
		// value is asked about in turn.
		let result = {};
		let keys = Object.keys( Level );
		for ( let index = 0; index < keys.length; index++ )
		{
			let redacted = redact_value( Level[ keys[ index ] ], Root, Args, Scope );
			if ( redacted.Pruned === true ) { continue; }
			result[ keys[ index ] ] = redacted.Value;
		}

		return { Pruned: false, Value: result };
	};


	//---------------------------------------------------------------------
	// Asks about one value below a level which is descending.
	//
	// A document is a level of its own and gets asked. An array is walked, because an array of
	// documents is the ordinary way a record holds its parts. Anything else is data, and
	// $redact has no question to ask about data.
	function redact_value( Value, Root, Args, Scope )
	{
		let short_type = jsongin.ShortType( Value );

		if ( short_type === 'o' ) { return redact_level( Value, Root, Args, Scope ); }

		if ( short_type === 'a' )
		{
			let elements = [];
			for ( let index = 0; index < Value.length; index++ )
			{
				let redacted = redact_value( Value[ index ], Root, Args, Scope );
				if ( redacted.Pruned === true ) { continue; }
				elements.push( redacted.Value );
			}
			return { Pruned: false, Value: elements };
		}

		return { Pruned: false, Value: jsongin.SafeClone( Value ) };
	};


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				jsongin.Scope.Require( Scope, '$redact' );

				let results = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					let document = Documents[ index ];
					let redacted = redact_level( document, document, Args, Scope );

					// A pruned top level takes the whole document with it.
					if ( redacted.Pruned === true ) { continue; }
					results.push( redacted.Value );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$redact: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
