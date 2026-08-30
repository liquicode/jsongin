'use strict';

/*
	Checks that the type declaration and the ESM wrapper both describe the engine which is
	actually running.

	***This exists because both of those files are written by hand, and both drift silently.***
	The standing decision is that jsongin stays Javascript and ships a hand-written `.d.ts`
	rather than a generated one - so nothing regenerates when a function is added, and nothing
	complains either. A declaration nobody checks is a comment, and an ESM wrapper which has
	fallen behind is worse than a comment: `import { NewOperator }` fails at the consumer's
	build with a message about our package, and every test here still passes.

	Three rules, each mechanical:

		1. ***Every engine member is declared.*** Loaded from src/jsongin.js and compared
		   against the members of the JsonginEngine interface in types/jsongin.d.ts.

		2. ***Every declared member exists.*** The same comparison in the other direction,
		   which is the one that catches a rename: without it a declaration keeps describing
		   the old name forever and a consumer's editor offers a function which is not there.

		3. ***Every engine member is re-exported by src/jsongin.mjs, and declared as a named
		   export.*** Three lists which have to agree: what the engine has, what the wrapper
		   re-exports, and what the declaration names. This is the rule that makes writing the
		   wrapper by hand a safe thing to do.

	EXCLUDED_FROM_NAMED_EXPORTS is the one deliberate difference between the engine and the
	other two lists, and it is named here rather than inferred. OpLog and OpError are mutable
	settings: a named ESM export binds once at load, so `import { OpLog }` would hand back the
	null it held then and go on doing so after the caller had assigned a logger. They are
	reached through the default export. See the header of src/jsongin.mjs.

	Needs no server, and constructs nothing but the engine.

	Usage:
		npm run types-check
*/

const LIB_FS = require( 'fs' );
const LIB_PATH = require( 'path' );

const REPO = LIB_PATH.resolve( __dirname, '..' );
const ENGINE_FILE = LIB_PATH.join( REPO, 'src', 'jsongin.js' );
const WRAPPER_FILE = LIB_PATH.join( REPO, 'src', 'jsongin.mjs' );
const TYPES_FILE = LIB_PATH.join( REPO, 'types', 'jsongin.d.ts' );

// Members which the engine has and the named-export lists deliberately do not. See above.
const EXCLUDED_FROM_NAMED_EXPORTS = [ 'OpLog', 'OpError' ];


//---------------------------------------------------------------------
// Returns the engine's member names, as the running library reports them.
function read_engine_members()
{
	let engine = require( ENGINE_FILE );
	return Object.keys( engine );
}


//---------------------------------------------------------------------
// Returns the member names declared on the JsonginEngine interface.
//
// The interface sits one tab in, its members two. Reading the block by indentation rather
// than by brace counting keeps this from having to understand TypeScript, which it does not
// need to do: it is comparing a list of names.
function read_declared_members()
{
	let text = LIB_FS.readFileSync( TYPES_FILE, 'utf8' );
	let lines = text.split( /\r?\n/ );

	let members = [];
	let inside = false;

	for ( let index = 0; index < lines.length; index++ )
	{
		let line = lines[ index ];

		if ( inside === false )
		{
			if ( /^\texport interface JsonginEngine\b/.test( line ) ) { inside = true; }
			continue;
		}

		// The interface's own closing brace, at one tab.
		if ( line === '\t}' ) { break; }

		// A member is an identifier at two tabs, followed by a call, a generic, or a type.
		let found = line.match( /^\t\t([A-Za-z_][A-Za-z0-9_]*)\s*[(<:]/ );
		if ( found ) { members.push( found[ 1 ] ); }
	}

	return members;
}


//---------------------------------------------------------------------
// Returns the names declared as named exports in the .d.ts, outside the interface.
function read_declared_named_exports()
{
	let text = LIB_FS.readFileSync( TYPES_FILE, 'utf8' );
	let names = [];
	let pattern = /^\texport const ([A-Za-z_][A-Za-z0-9_]*)\s*:/gm;
	let found = pattern.exec( text );
	while ( found !== null )
	{
		names.push( found[ 1 ] );
		found = pattern.exec( text );
	}
	return names;
}


//---------------------------------------------------------------------
// Returns the names re-exported by the ESM wrapper.
function read_wrapper_exports()
{
	let text = LIB_FS.readFileSync( WRAPPER_FILE, 'utf8' );
	let names = [];
	let pattern = /^export const ([A-Za-z_][A-Za-z0-9_]*)\s*=/gm;
	let found = pattern.exec( text );
	while ( found !== null )
	{
		names.push( found[ 1 ] );
		found = pattern.exec( text );
	}
	return names;
}


//---------------------------------------------------------------------
// Returns the members of ListA which are not in ListB.
function missing_from( ListA, ListB )
{
	let missing = [];
	for ( let index = 0; index < ListA.length; index++ )
	{
		if ( ListB.includes( ListA[ index ] ) === false ) { missing.push( ListA[ index ] ); }
	}
	return missing;
}


//---------------------------------------------------------------------
// Runs the three rules and returns the findings.
function Check()
{
	let engine_members = read_engine_members();
	let declared_members = read_declared_members();
	let declared_exports = read_declared_named_exports();
	let wrapper_exports = read_wrapper_exports();

	// What the engine has, minus the two deliberate exclusions.
	let expected_named = missing_from( engine_members, EXCLUDED_FROM_NAMED_EXPORTS );

	let findings = [];

	function report( Message, Names )
	{
		if ( Names.length === 0 ) { return; }
		findings.push( { Message: Message, Names: Names } );
	}

	// Rule 1 and 2: the interface and the engine describe the same surface.
	report(
		'On the engine but not declared in the JsonginEngine interface',
		missing_from( engine_members, declared_members ) );
	report(
		'Declared in the JsonginEngine interface but not on the engine',
		missing_from( declared_members, engine_members ) );

	// Rule 3: the wrapper and the declaration's named exports both match the engine.
	report(
		'On the engine but not re-exported by src/jsongin.mjs',
		missing_from( expected_named, wrapper_exports ) );
	report(
		'Re-exported by src/jsongin.mjs but not on the engine',
		missing_from( wrapper_exports, engine_members ) );
	report(
		'On the engine but not declared as a named export in the .d.ts',
		missing_from( expected_named, declared_exports ) );
	report(
		'Declared as a named export in the .d.ts but not on the engine',
		missing_from( declared_exports, engine_members ) );

	// The exclusions are excluded from both lists or they are not exclusions.
	report(
		'Excluded from named exports, yet re-exported by src/jsongin.mjs',
		missing_from( EXCLUDED_FROM_NAMED_EXPORTS, missing_from( EXCLUDED_FROM_NAMED_EXPORTS, wrapper_exports ) ) );
	report(
		'Excluded from named exports, yet declared as a named export in the .d.ts',
		missing_from( EXCLUDED_FROM_NAMED_EXPORTS, missing_from( EXCLUDED_FROM_NAMED_EXPORTS, declared_exports ) ) );

	return {
		EngineMembers: engine_members,
		DeclaredMembers: declared_members,
		DeclaredExports: declared_exports,
		WrapperExports: wrapper_exports,
		Excluded: EXCLUDED_FROM_NAMED_EXPORTS,
		Findings: findings,
	};
}


//---------------------------------------------------------------------
// Main.
function main()
{
	let result = Check();

	console.log( '' );
	console.log( 'Types Check' );
	console.log( '' );
	console.log( `   engine members                : ${result.EngineMembers.length}` );
	console.log( `   declared on the interface     : ${result.DeclaredMembers.length}` );
	console.log( `   named exports in the .d.ts    : ${result.DeclaredExports.length}` );
	console.log( `   re-exported by jsongin.mjs    : ${result.WrapperExports.length}` );
	console.log( `   excluded by decision          : ${result.Excluded.length} (${result.Excluded.join( ', ' )})` );
	console.log( '' );

	if ( result.Findings.length === 0 )
	{
		console.log( '   The engine, the declaration, and the ESM wrapper agree.' );
		console.log( '' );
		return;
	}

	for ( let index = 0; index < result.Findings.length; index++ )
	{
		let finding = result.Findings[ index ];
		console.log( `   ${finding.Message}:` );
		console.log( `      ${finding.Names.join( ', ' )}` );
	}
	console.log( '' );

	process.exitCode = 1;
}


//---------------------------------------------------------------------
module.exports = {
	Check: Check,
};

if ( require.main === module ) { main(); }
