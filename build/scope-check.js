'use strict';

/*
	Checks that the expression variable scope is passed along everywhere it has to be.

	***This exists because the failure it looks for is silent.*** An operator which does not
	forward its Scope loses every variable underneath it, and nothing goes wrong until somebody
	writes a '$$name' inside that particular operator - which may be a year later, in a user's
	pipeline, and reads as "$map is broken" rather than as "$dateAdd dropped the scope". There
	are ~175 operators and helpers which each have to remember, so remembering is not a plan.

	Four rules, each mechanical:

		1. Every `jsongin.Evaluate(` call passes three arguments. Two means the caller is
		   making a fresh root scope by accident, which is exactly how a variable goes missing.

		2. Every helper which evaluates takes `Scope` as its last parameter, and every helper
		   which mentions a Scope declares one. ***The test is what the body does, not what its
		   first parameter is called.*** The sweep which built all this decided by parameter
		   name - a helper taking a Document got a Scope - which was the right first cut and is
		   the wrong rule to keep: a query range test and an update arithmetic helper both take
		   a Document and neither one ever evaluates anything.

		3. Every operator module declares its `Evaluate` / `Stage` / `Accumulate` with a
		   trailing `Scope`. The unit test in `test/Unit Tests/160) Variable Scope Tests.js`
		   asserts the same thing against the live registries, which catches a registered
		   operator; this catches a source file which is not registered yet.

		4. Every call of such a helper passes as many arguments as it declares. This is the
		   rule which found eighteen real ones: `date.ReadDateArgs` has an optional
		   `ExtraFields` ahead of its scope, seventeen operators left it off, and appending an
		   argument put each scope in the optional slot instead. Nothing threw - the scope was
		   simply somewhere else - which is the exact failure mode this file exists for.

	What it deliberately does NOT check is whether an operator forwards its scope into the
	helper it calls, because reading that statically means reading the code. That hole is
	closed at run time instead: `jsongin.Scope.Require()` at the top of every evaluating helper
	refuses a call which arrives without one, so a forgotten forward fails loudly the first
	time any test touches the operator which forgot.

	Needs no server.

	Usage:
		node build/scope-check.js
		node build/scope-check.js --verbose
*/

const LIB_FS = require( 'fs' );
const LIB_PATH = require( 'path' );

const SOURCE_FOLDER = LIB_PATH.resolve( __dirname, '..', 'src' );
const PROJECT_FOLDER = LIB_PATH.resolve( __dirname, '..' );

// The declarations which must carry a scope, and the parameter list each one starts with.
const OPERATOR_DECLARATIONS = [
	{ Member: 'Evaluate', First: 'Document' },
	{ Member: 'Stage', First: 'Documents' },
	{ Member: 'Accumulate', First: 'Documents' },
];

// Helpers reached under more than one name. Seven modules write
// `helper.Operands = arithmetic.Operands`, so one function answers to eight spellings and a
// check which only knew the declaring module's name would miss seven of them.
const HELPER_ALIASES = {
	'array.Operands': 'arithmetic.Operands',
	'datasize.Operands': 'arithmetic.Operands',
	'date.Operands': 'arithmetic.Operands',
	'object.Operands': 'arithmetic.Operands',
	'set.Operands': 'arithmetic.Operands',
	'string.Operands': 'arithmetic.Operands',
	'type.Operands': 'arithmetic.Operands',
};


//---------------------------------------------------------------------
function source_files( Folder )
{
	let found = [];
	let entries = LIB_FS.readdirSync( Folder, { withFileTypes: true } );
	for ( let index = 0; index < entries.length; index++ )
	{
		let entry = entries[ index ];
		let path = LIB_PATH.join( Folder, entry.name );
		if ( entry.isDirectory() === true )
		{
			found = found.concat( source_files( path ) );
			continue;
		}
		if ( entry.name.endsWith( '.js' ) === false ) { continue; }
		found.push( path );
	}
	return found;
};


//---------------------------------------------------------------------
// Reads forward from a '(' or '{' to the character which closes it.
//
// This needs a reader rather than a regular expression, because what is inside can be an
// object, an array, or another call, and every one of those brings punctuation of its own. A
// string can carry an unbalanced brace, so strings are skipped whole.
function closing_of( Text, Start )
{
	let depth = 0;
	let quote = null;
	for ( let index = Start; index < Text.length; index++ )
	{
		let character = Text[ index ];

		// ***Comments have to be skipped, and that is correctness rather than tidiness.***
		// A comment can carry an apostrophe - "this date's week" - which a reader that only
		// knows about strings takes for the start of one and then swallows the rest of the
		// file looking for its end. That is exactly how helper.IsoWeekParts came to look as
		// though it evaluated an expression: its body ran on into the next function.
		if ( ( character === '/' ) && ( Text[ index + 1 ] === '/' ) )
		{
			index = Text.indexOf( '\n', index );
			if ( index < 0 ) { return -1; }
			continue;
		}
		if ( ( character === '/' ) && ( Text[ index + 1 ] === '*' ) )
		{
			index = Text.indexOf( '*/', index );
			if ( index < 0 ) { return -1; }
			index++;
			continue;
		}
		if ( quote !== null )
		{
			if ( character === '\\' ) { index++; continue; }
			if ( character === quote ) { quote = null; }
			continue;
		}
		if ( ( character === '"' ) || ( character === '\'' ) || ( character === '`' ) ) { quote = character; continue; }
		if ( '([{'.includes( character ) === true ) { depth++; continue; }
		if ( ')]}'.includes( character ) === true )
		{
			depth--;
			if ( depth === 0 ) { return index; }
		}
	}
	return -1;
};


//---------------------------------------------------------------------
// Counts the top level arguments of the call whose opening parenthesis is at Start.
// Returns -1 when the call does not close in this file.
function count_arguments( Text, Start )
{
	let depth = 0;
	let arguments_seen = 0;
	let saw_content = false;
	let quote = null;

	for ( let index = Start; index < Text.length; index++ )
	{
		let character = Text[ index ];

		// ***Comments have to be skipped, and that is correctness rather than tidiness.***
		// A comment can carry an apostrophe - "this date's week" - which a reader that only
		// knows about strings takes for the start of one and then swallows the rest of the
		// file looking for its end. That is exactly how helper.IsoWeekParts came to look as
		// though it evaluated an expression: its body ran on into the next function.
		if ( ( character === '/' ) && ( Text[ index + 1 ] === '/' ) )
		{
			index = Text.indexOf( '\n', index );
			if ( index < 0 ) { return -1; }
			continue;
		}
		if ( ( character === '/' ) && ( Text[ index + 1 ] === '*' ) )
		{
			index = Text.indexOf( '*/', index );
			if ( index < 0 ) { return -1; }
			index++;
			continue;
		}

		if ( quote !== null )
		{
			if ( character === '\\' ) { index++; continue; }
			if ( character === quote ) { quote = null; }
			continue;
		}

		if ( ( character === '"' ) || ( character === '\'' ) || ( character === '`' ) )
		{
			quote = character;
			saw_content = true;
			continue;
		}

		if ( '([{'.includes( character ) === true ) { depth++; saw_content = true; continue; }

		if ( ')]}'.includes( character ) === true )
		{
			depth--;
			if ( depth === 0 )
			{
				if ( saw_content === true ) { arguments_seen++; }
				return arguments_seen;
			}
			continue;
		}

		if ( ( character === ',' ) && ( depth === 1 ) ) { arguments_seen++; continue; }

		if ( ' \t\r\n'.includes( character ) === false ) { saw_content = true; }
	}

	return -1;
};


//---------------------------------------------------------------------
function line_of( Text, Index )
{
	return Text.substring( 0, Index ).split( '\n' ).length;
};


//---------------------------------------------------------------------
// Reads every `helper.Name = function ( ... )` in a helper module.
function helper_declarations( Text, Variable )
{
	let declared = [];
	const DECLARATION = /helper\.([A-Za-z]+) = function \(([^)]*)\)/g;
	let match = DECLARATION.exec( Text );
	while ( match !== null )
	{
		let parameters = match[ 2 ].split( ',' );
		for ( let index = 0; index < parameters.length; index++ ) { parameters[ index ] = parameters[ index ].trim(); }
		if ( ( parameters.length === 1 ) && ( parameters[ 0 ] === '' ) ) { parameters = []; }

		let brace = Text.indexOf( '{', match.index + match[ 0 ].length );
		let end = closing_of( Text, brace );

		declared.push( {
			Name: match[ 1 ],
			Qualified: `${Variable}.${match[ 1 ]}`,
			Parameters: parameters,
			TakesScope: ( parameters[ parameters.length - 1 ] === 'Scope' ),
			Index: match.index,
			Body: ( end > brace ) ? Text.substring( brace, end ) : '',
		} );

		match = DECLARATION.exec( Text );
	}
	return declared;
};


//---------------------------------------------------------------------
// Rule 1. Every jsongin.Evaluate( ... ) passes a scope.
function check_evaluate_calls( Path, Text, Findings )
{
	const CALL = 'jsongin.Evaluate(';
	let index = Text.indexOf( CALL );
	while ( index >= 0 )
	{
		let count = count_arguments( Text, index + CALL.length - 1 );
		if ( ( count >= 0 ) && ( count < 3 ) )
		{
			Findings.push( {
				Rule: 'call',
				Path: Path,
				Line: line_of( Text, index ),
				Message: `jsongin.Evaluate() called with ${count} arguments, and needs a scope as the third.`,
			} );
		}
		index = Text.indexOf( CALL, index + CALL.length );
	}
};


//---------------------------------------------------------------------
// Rule 2. A helper which evaluates, or which mentions a scope, declares one.
function check_helper_declarations( Path, Text, Declared, Findings )
{
	for ( let index = 0; index < Declared.length; index++ )
	{
		let declaration = Declared[ index ];
		if ( declaration.TakesScope === true ) { continue; }

		// 'Scope' preceded by a dot is jsongin.Scope, the component rather than a parameter.
		let mentions_scope = /(?<!\.)\bScope\b/.test( declaration.Body );
		let evaluates = declaration.Body.includes( 'jsongin.Evaluate(' );
		if ( ( mentions_scope === false ) && ( evaluates === false ) ) { continue; }

		let why = evaluates ? 'evaluates an expression' : 'uses a scope';
		Findings.push( {
			Rule: 'helper',
			Path: Path,
			Line: line_of( Text, declaration.Index ),
			Message: `helper.${declaration.Name}( ${declaration.Parameters.join( ', ' )} ) ${why} and needs a trailing Scope.`,
		} );
	}
};


//---------------------------------------------------------------------
// Rule 3. An operator declares its entry point with a scope.
function check_operator_declarations( Path, Text, Findings )
{
	for ( let index = 0; index < OPERATOR_DECLARATIONS.length; index++ )
	{
		let declaration = OPERATOR_DECLARATIONS[ index ];
		let wanted = `${declaration.Member}: function ( ${declaration.First}, Args, Scope )`;
		let short = `${declaration.Member}: function ( ${declaration.First}, Args )`;

		if ( Text.includes( short ) === false ) { continue; }
		if ( Text.includes( wanted ) === true ) { continue; }

		Findings.push( {
			Rule: 'operator',
			Path: Path,
			Line: line_of( Text, Text.indexOf( short ) ),
			Message: `${short} needs a trailing Scope.`,
		} );
	}
};


//---------------------------------------------------------------------
// Rule 4. A call of a scope-taking helper reaches the scope parameter.
function check_helper_call_arity( Path, Text, Arities, Findings )
{
	let names = Object.keys( Arities );
	for ( let index = 0; index < names.length; index++ )
	{
		let prefix = names[ index ] + '(';
		let wanted = Arities[ names[ index ] ];
		let at = Text.indexOf( prefix );
		while ( at >= 0 )
		{
			// A declaration is not a call.
			let line_start = Text.lastIndexOf( '\n', at );
			let line = Text.substring( line_start + 1, at + prefix.length + 20 );
			if ( line.includes( '= function' ) === false )
			{
				let count = count_arguments( Text, at + prefix.length - 1 );
				if ( ( count >= 0 ) && ( count !== wanted ) )
				{
					Findings.push( {
						Rule: 'arity',
						Path: Path,
						Line: line_of( Text, at ),
						Message: `${names[ index ]}() called with ${count} arguments and declares ${wanted}, so the scope is in the wrong slot.`,
					} );
				}
			}
			at = Text.indexOf( prefix, at + prefix.length );
		}
	}
};


//---------------------------------------------------------------------
function Check()
{
	let findings = [];
	let files = source_files( SOURCE_FOLDER );

	// First pass: what each helper declares, so the call sites can be measured against it.
	let arities = {};
	let declarations_by_file = {};
	for ( let index = 0; index < files.length; index++ )
	{
		let path = files[ index ];
		let name = LIB_PATH.basename( path );
		if ( name.startsWith( '_' ) === false ) { continue; }

		let text = LIB_FS.readFileSync( path, 'utf8' );
		let variable = name.substring( 1 ).replace( '.js', '' );
		let declared = helper_declarations( text, variable );
		declarations_by_file[ path ] = declared;

		for ( let d = 0; d < declared.length; d++ )
		{
			if ( declared[ d ].TakesScope === false ) { continue; }
			arities[ declared[ d ].Qualified ] = declared[ d ].Parameters.length;
			arities[ `helper.${declared[ d ].Name}` ] = declared[ d ].Parameters.length;
		}
	}

	let aliases = Object.keys( HELPER_ALIASES );
	for ( let index = 0; index < aliases.length; index++ )
	{
		let target = arities[ HELPER_ALIASES[ aliases[ index ] ] ];
		if ( typeof target !== 'undefined' ) { arities[ aliases[ index ] ] = target; }
	}

	// Second pass: the rules.
	for ( let index = 0; index < files.length; index++ )
	{
		let path = files[ index ];
		let text = LIB_FS.readFileSync( path, 'utf8' );
		let relative = LIB_PATH.relative( PROJECT_FOLDER, path ).split( '\\' ).join( '/' );

		check_evaluate_calls( relative, text, findings );
		check_operator_declarations( relative, text, findings );
		check_helper_call_arity( relative, text, arities, findings );

		if ( typeof declarations_by_file[ path ] !== 'undefined' )
		{
			check_helper_declarations( relative, text, declarations_by_file[ path ], findings );
		}
	}

	return { Files: files.length, Findings: findings };
};


//---------------------------------------------------------------------
function main()
{
	let verbose = process.argv.includes( '--verbose' );
	let result = Check();

	let counts = { call: 0, helper: 0, operator: 0, arity: 0 };
	for ( let index = 0; index < result.Findings.length; index++ )
	{
		counts[ result.Findings[ index ].Rule ]++;
	}

	console.log( '' );
	console.log( `Checking the scope signatures across ${result.Files} source files ...` );
	console.log( '' );
	console.log( `   evaluate calls without a scope   ${String( counts.call ).padStart( 5 )}` );
	console.log( `   helpers without a scope          ${String( counts.helper ).padStart( 5 )}` );
	console.log( `   operators without a scope        ${String( counts.operator ).padStart( 5 )}` );
	console.log( `   calls which miss the scope slot  ${String( counts.arity ).padStart( 5 )}` );
	console.log( '' );

	if ( result.Findings.length === 0 )
	{
		console.log( '   Every scope is passed along.' );
		console.log( '' );
		return;
	}

	// The list is the worklist. Printing it is the point: this runs while a sweep is in
	// progress, and what is left to convert is what it prints.
	let shown = verbose ? result.Findings.length : Math.min( result.Findings.length, 25 );
	for ( let index = 0; index < shown; index++ )
	{
		let finding = result.Findings[ index ];
		console.log( `   ${finding.Path}:${finding.Line}` );
		console.log( `      ${finding.Message}` );
	}
	if ( shown < result.Findings.length )
	{
		console.log( '' );
		console.log( `   ${result.Findings.length - shown} more. Run with --verbose to list them all.` );
	}
	console.log( '' );

	process.exitCode = 1;
}


//---------------------------------------------------------------------
module.exports = {
	Check: Check,
};

if ( require.main === module ) { main(); }
