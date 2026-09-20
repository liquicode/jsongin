'use strict';
/*md

## Operators > Stage > $lookup

Usage: `$lookup: { from: <documents>, localField: 'field', foreignField: 'field', as: 'field' }`
  or `$lookup: { from: <documents>, let: { name: expression, ... }, pipeline: [ stage, ... ], as: 'field' }`

Joins each document with the documents of a second set, gathering what it matched into an array
  at `as`.

***`from` is the documents themselves, or a `$$variable` naming them.*** MongoDB names a
  collection there; `jsongin` works on arrays, so it takes the array - written inline, or bound
  in the scope the pipeline was given:

```js
// docs-check: skip - shown for its shape; the runnable form is in the guide.
jsongin.Aggregate( bookings,
	[ { $lookup: { from: '$$Telescopes', localField: 'Telescope', foreignField: 'Name', as: 'Telescope' } } ],
	jsongin.Scope.NewPipeline().Child( { Telescopes: telescopes } ) );
```

Everything else is MongoDB's, measured against MongoDB 8.3.8 on 2026-09-20:

- The ***equality form*** matches where the local field's value is among the foreign field's.
  An array on either side matches element by element, and a ***missing field counts as null***,
  so a document with no local field matches foreign documents whose field is null or missing.
- The ***pipeline form*** runs a pipeline over the second set, with `let` bound as variables.
  Both forms may be given together, and both apply.
- `as` is ***always written***, holding an empty array where nothing matched. It may be a dotted
  path, and it replaces whatever was there.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// The documents to join with: an array written into the stage, or a '$$name' bound in the
	// scope the pipeline is running in.
	//
	// ***This is the whole of the difference from MongoDB***, which names a collection here and
	// reads it from the database. Everything below is the same either way.
	function documents_from( From, Scope )
	{
		let from_type = jsongin.ShortType( From );

		if ( from_type === 'a' ) { return From; }

		if ( from_type === 's' )
		{
			if ( From.startsWith( '$$' ) === false )
			{
				throw new Error( `$lookup from [${From}] is not a variable. jsongin has no collections: give the documents themselves, or a '$$name' bound in the scope.` );
			}
			let name = From.slice( 2 );
			let found = ( Scope && ( typeof Scope.Lookup === 'function' ) ) ? Scope.Lookup( name ) : { Found: false };
			if ( found.Found !== true ) { throw new Error( `$lookup from [${From}] is not defined.` ); }
			if ( jsongin.ShortType( found.Value ) !== 'a' ) { throw new Error( `$lookup from [${From}] must be an array of documents.` ); }
			return found.Value;
		}

		throw new Error( `$lookup requires a from of documents, or a '$$name' bound in the scope.` );
	}


	//---------------------------------------------------------------------
	// The stage's arguments, checked before any document is looked at.
	function read_args( Args )
	{
		if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$lookup requires a document of arguments.` ); }
		if ( jsongin.ShortType( Args.as ) !== 's' ) { throw new Error( `$lookup requires an 'as' naming where the matches go.` ); }

		let has_key = ( typeof Args.localField !== 'undefined' ) || ( typeof Args.foreignField !== 'undefined' );
		let has_pipeline = ( typeof Args.pipeline !== 'undefined' );

		if ( has_key )
		{
			if ( jsongin.ShortType( Args.localField ) !== 's' ) { throw new Error( `$lookup requires a localField beside a foreignField.` ); }
			if ( jsongin.ShortType( Args.foreignField ) !== 's' ) { throw new Error( `$lookup requires a foreignField beside a localField.` ); }
		}
		if ( has_pipeline && ( jsongin.ShortType( Args.pipeline ) !== 'a' ) ) { throw new Error( `$lookup pipeline must be an array of stages.` ); }
		if ( ( typeof Args.let !== 'undefined' ) && ( jsongin.ShortType( Args.let ) !== 'o' ) ) { throw new Error( `$lookup let must be a document of variables.` ); }

		// ***The server refuses this too***, saying "must specify 'pipeline' when 'from' is
		// empty": a lookup which says neither how to match nor what to run has nothing to do.
		if ( !has_key && !has_pipeline ) { throw new Error( `$lookup requires a localField and a foreignField, or a pipeline.` ); }

		return { HasKey: has_key, HasPipeline: has_pipeline };
	}


	//---------------------------------------------------------------------
	// The values a local field can mean, as the equality match reads them.
	//
	// ***A missing field is one null value.*** Measured: a document with no local field matched
	// foreign documents whose field was null ***and*** those with no such field. An array is
	// read element by element, which ResolveCandidates does already - the same rule an ordinary
	// query path follows.
	function local_values( Document, LocalField )
	{
		let candidates = jsongin.ResolveCandidates( Document, LocalField );
		let values = [];
		for ( let index = 0; index < candidates.length; index++ )
		{
			if ( typeof candidates[ index ] === 'undefined' ) { continue; }
			values.push( candidates[ index ] );
		}
		if ( values.length === 0 ) { return [ null ]; }
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
				let join_documents = documents_from( Args.from, Scope );

				let joined = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					let document = Documents[ index ];
					let found = join_documents;

					// ***The equality match, as $in over the local values.*** Measured on 8.3.8:
					// this is exactly what the server does, including an array on either side
					// and a missing field reading as null - all of which jsongin's own $in
					// already answers the same way.
					if ( shape.HasKey )
					{
						let criteria = {};
						criteria[ Args.foreignField ] = { $in: local_values( document, Args.localField ) };
						found = jsongin.Filter( found, criteria );
					}

					// ***The pipeline form, with `let` bound.*** Both forms may be given, and
					// the pipeline runs over what the key match left.
					if ( shape.HasPipeline )
					{
						let variables = {};
						if ( jsongin.ShortType( Args.let ) === 'o' )
						{
							let names = Object.keys( Args.let );
							for ( let name_index = 0; name_index < names.length; name_index++ )
							{
								variables[ names[ name_index ] ] = jsongin.Evaluate( document, Args.let[ names[ name_index ] ], Scope.ForDocument( document ) );
							}
						}
						found = jsongin.Aggregate( found, Args.pipeline, Scope.Child( variables ) );
					}

					// ***as is always written***, an empty array where nothing matched, and it
					// replaces whatever was there. A clone, because this stage produces
					// documents rather than selecting them.
					let answer = jsongin.SafeClone( document );
					let matches = [];
					for ( let found_index = 0; found_index < found.length; found_index++ )
					{
						matches.push( jsongin.SafeClone( found[ found_index ] ) );
					}
					jsongin.SetValue( answer, Args.as, matches );
					joined.push( answer );
				}

				return joined;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$lookup: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
