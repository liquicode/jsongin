'use strict';
/*md

## Operators > Stage > $graphLookup

Usage: `$graphLookup: { from: <documents>, startWith: expression, connectFromField: 'field',
  connectToField: 'field', as: 'field', maxDepth: number, depthField: 'field',
  restrictSearchWithMatch: query }`

Follows a chain through a second set of documents, gathering everything it reaches.

Each round matches `connectToField` against the values it is looking for, and the documents it
  finds supply the next round's values through `connectFromField`. The first round looks for
  whatever `startWith` evaluates to.

***`from` is the documents themselves, or a `$$variable` naming them***, as it is for
  [`$lookup`](#$lookup): MongoDB names a collection, and `jsongin` has no collections.

Measured against MongoDB 8.3.8 on 2026-09-20
  (`jsonx/.plans/tools/lookup-parity-probe.js`), which is where every rule below comes from:

- ***A document is reached once***, and carries the ***shallowest*** depth it was reached at.
  `depthField` counts from 0 for the documents `startWith` found, and is written only when it
  is asked for.
- ***Which document a document is, is where it sits in the array.*** The server tells two
  identical documents apart by their `_id`; here their positions do that, so two documents
  which look alike are still two documents, and a cycle still ends.
- `maxDepth` bounds the rounds: `0` is the first round alone. A negative or fractional one is
  refused, as the server refuses it.
- `restrictSearchWithMatch` is a query the documents must also match, ***including in the first
  round***, and a document it excludes is never traversed through.
- An array on either side matches element by element. A `startWith` which evaluates to nothing
  finds nothing; one which evaluates to `null` looks for `null`.
- `as` is always written, holding an empty array where nothing was found, and may be a dotted
  path.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// The documents to walk: an array, or a '$$name' bound in the scope. See Stage/lookup.js.
	function documents_from( From, Scope )
	{
		let from_type = jsongin.ShortType( From );

		if ( from_type === 'a' ) { return From; }

		if ( from_type === 's' )
		{
			if ( From.startsWith( '$$' ) === false )
			{
				throw new Error( `$graphLookup from [${From}] is not a variable. jsongin has no collections: give the documents themselves, or a '$$name' bound in the scope.` );
			}
			let name = From.slice( 2 );
			let found = ( Scope && ( typeof Scope.Lookup === 'function' ) ) ? Scope.Lookup( name ) : { Found: false };
			if ( found.Found !== true ) { throw new Error( `$graphLookup from [${From}] is not defined.` ); }
			if ( jsongin.ShortType( found.Value ) !== 'a' ) { throw new Error( `$graphLookup from [${From}] must be an array of documents.` ); }
			return found.Value;
		}

		throw new Error( `$graphLookup requires a from of documents, or a '$$name' bound in the scope.` );
	}


	//---------------------------------------------------------------------
	function read_args( Args )
	{
		if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$graphLookup requires a document of arguments.` ); }
		if ( typeof Args.startWith === 'undefined' ) { throw new Error( `$graphLookup requires a startWith.` ); }
		if ( jsongin.ShortType( Args.connectFromField ) !== 's' ) { throw new Error( `$graphLookup requires a connectFromField.` ); }
		if ( jsongin.ShortType( Args.connectToField ) !== 's' ) { throw new Error( `$graphLookup requires a connectToField.` ); }
		if ( jsongin.ShortType( Args.as ) !== 's' ) { throw new Error( `$graphLookup requires an 'as' naming where what it finds goes.` ); }

		if ( typeof Args.depthField !== 'undefined' )
		{
			if ( jsongin.ShortType( Args.depthField ) !== 's' ) { throw new Error( `$graphLookup depthField must be a string.` ); }
		}

		let max_depth = null;
		if ( typeof Args.maxDepth !== 'undefined' )
		{
			if ( jsongin.ShortType( Args.maxDepth ) !== 'n' ) { throw new Error( `$graphLookup maxDepth must be a number.` ); }
			// The server refuses both: "maxDepth requires a nonnegative argument" and
			// "maxDepth could not be represented as a long long" for a fractional one.
			if ( Args.maxDepth < 0 ) { throw new Error( `$graphLookup maxDepth requires a nonnegative argument, found: ${Args.maxDepth}.` ); }
			if ( Math.floor( Args.maxDepth ) !== Args.maxDepth ) { throw new Error( `$graphLookup maxDepth must be a whole number, found: ${Args.maxDepth}.` ); }
			max_depth = Args.maxDepth;
		}

		if ( typeof Args.restrictSearchWithMatch !== 'undefined' )
		{
			if ( jsongin.ShortType( Args.restrictSearchWithMatch ) !== 'o' ) { throw new Error( `$graphLookup restrictSearchWithMatch must be a query.` ); }
		}

		return { MaxDepth: max_depth };
	}


	//---------------------------------------------------------------------
	// The values to look for next, from a field of the documents just found.
	//
	// ***An array offers its elements*** and nothing offers `undefined`: a document with no such
	// field simply leads nowhere. A `null` is a value like any other and is looked for.
	function values_of( Document, Field )
	{
		let candidates = jsongin.ResolveCandidates( Document, Field );
		let values = [];
		for ( let index = 0; index < candidates.length; index++ )
		{
			if ( typeof candidates[ index ] === 'undefined' ) { continue; }
			values.push( candidates[ index ] );
		}
		return values;
	}


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args, Scope )
		{
			try
			{
				let shape = read_args( Args );
				let walk_documents = documents_from( Args.from, Scope );

				// ***restrictSearchWithMatch narrows the set once, before the walk.*** A
				// document it excludes is neither found nor traversed through, which is the
				// same thing as it not being there - and the server applies it to the first
				// round too, which this does by construction.
				if ( jsongin.ShortType( Args.restrictSearchWithMatch ) === 'o' )
				{
					walk_documents = jsongin.Filter( walk_documents, Args.restrictSearchWithMatch, { Scope: Scope } );
				}

				let answers = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					let document = Documents[ index ];

					// The first round looks for whatever startWith evaluates to. An expression
					// is allowed, and an array offers its elements.
					let start = jsongin.Evaluate( document, Args.startWith, Scope.ForDocument( document ) );
					let looking_for = [];
					if ( jsongin.ShortType( start ) === 'a' ) { looking_for = start.slice(); }
					else if ( typeof start !== 'undefined' ) { looking_for = [ start ]; }

					// ***Position is the identity***, so a document found twice is found once
					// and keeps the depth it was first reached at - which is the shallowest,
					// because the rounds go outwards.
					let depth_of = new Map();
					let depth = 0;

					while ( looking_for.length > 0 )
					{
						if ( ( shape.MaxDepth !== null ) && ( depth > shape.MaxDepth ) ) { break; }

						let criteria = {};
						criteria[ Args.connectToField ] = { $in: looking_for };

						let next_values = [];
						for ( let walk_index = 0; walk_index < walk_documents.length; walk_index++ )
						{
							if ( depth_of.has( walk_index ) ) { continue; }
							if ( jsongin.Query( walk_documents[ walk_index ], criteria, '', { Scope: Scope } ) === false ) { continue; }
							depth_of.set( walk_index, depth );
							let found_values = values_of( walk_documents[ walk_index ], Args.connectFromField );
							for ( let value_index = 0; value_index < found_values.length; value_index++ )
							{
								next_values.push( found_values[ value_index ] );
							}
						}

						looking_for = next_values;
						depth++;
					}

					// What was found, in the order it was reached. The server answers in its
					// own order, which is not one an in-memory engine can reproduce - the
					// parity suite compares these as a set, and says so.
					let found = [];
					depth_of.forEach( function ( Depth, Position )
					{
						let reached = jsongin.SafeClone( walk_documents[ Position ] );
						if ( jsongin.ShortType( Args.depthField ) === 's' ) { jsongin.SetValue( reached, Args.depthField, Depth ); }
						found.push( reached );
					} );

					let answer = jsongin.SafeClone( document );
					jsongin.SetValue( answer, Args.as, found );
					answers.push( answer );
				}

				return answers;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$graphLookup: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
