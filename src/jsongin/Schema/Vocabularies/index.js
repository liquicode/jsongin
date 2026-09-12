'use strict';

/*
	Every keyword definition the evaluator has, by definition name. Dialects.js maps each
	draft's keywords onto these names, so a keyword which changed meaning between drafts is
	written here twice under two names and each draft picks its own.

	A definition is:

		Subschemas   where it keeps subschemas, for the resolver to index: null, 'single',
		             'array', 'map', 'single-or-array' or 'dependencies'.
		Priority     its place in the evaluation order of one schema object.
		Apply        function ( Context, Keyword, Instance, Value, Schema, Local ) -> output
*/

const DEFINITIONS = {};

function add( Definitions )
{
	let names = Object.keys( Definitions );
	for ( let index = 0; index < names.length; index++ )
	{
		if ( DEFINITIONS[ names[ index ] ] ) { throw new Error( `The keyword definition [${names[ index ]}] is declared twice.` ); }
		DEFINITIONS[ names[ index ] ] = Definitions[ names[ index ] ];
	}
}

add( require( './Core.js' ) );
add( require( './Applicator.js' ) );
add( require( './Validation.js' ) );
add( require( './Unevaluated.js' ) );
add( require( './MetaData.js' ) );
add( require( './Format.js' ) );
add( require( './Content.js' ) );
add( require( './MongoDb.js' ) );

module.exports = DEFINITIONS;
