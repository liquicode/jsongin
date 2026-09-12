'use strict';

/*
	Measures the JSON Schema evaluator against the official test suite, every draft and every
	set, claimed or not.

	The parity report answers how faithfully the operators follow MongoDB; this one answers how
	faithfully ValidateDocument follows the JSON Schema specification's own tests. The suite is
	vendored under test/json-schema-test-suite/ and build/json-schema-suite.js reads it.

	A set is either claimed or not. A claimed set is asserted by
	test/Unit Tests/170) JSON Schema Suite Tests.js, so a failure in it is a regression and
	makes npm test red. An unclaimed set is the roadmap: it is measured here so that it is
	revisited, and it cannot make npm test red. The claim list is CLAIMED in
	build/json-schema-suite.js, the one place it is stated.

	Usage:
		npm run json-schema-report                       the table
		npm run json-schema-report -- --verbose          plus every failing case, by file
		npm run json-schema-report -- --draft 2020-12    one draft only
		npm run json-schema-report -- --set required     one set only

	Exit code is non-zero only when a claimed case fails, so the table can be read on its own
	without the roadmap being mistaken for a failure.
*/

const LIB_PATH = require( 'path' );
const LIB_SUITE = require( './json-schema-suite.js' );

const REPO = LIB_PATH.resolve( __dirname, '..' );
const ENGINE = require( LIB_PATH.join( REPO, 'src', 'jsongin.js' ) );
const CLAIMS = LIB_SUITE.CLAIMED;


//---------------------------------------------------------------------
// Reads the command line.
function read_arguments()
{
	let options = { Verbose: false, Draft: null, Set: null };
	let args = process.argv.slice( 2 );
	for ( let index = 0; index < args.length; index++ )
	{
		if ( args[ index ] === '--verbose' ) { options.Verbose = true; }
		else if ( args[ index ] === '--draft' ) { options.Draft = args[ ++index ]; }
		else if ( args[ index ] === '--set' ) { options.Set = args[ ++index ]; }
		else { throw new Error( `Unknown argument [${args[ index ]}].` ); }
	}
	return options;
}


//---------------------------------------------------------------------
// Answers whether a draft and set are claimed by the unit test.
function is_claimed( DraftName, SetName )
{
	for ( let index = 0; index < CLAIMS.length; index++ )
	{
		if ( ( CLAIMS[ index ].Draft === DraftName ) && ( CLAIMS[ index ].Set === SetName ) ) { return true; }
	}
	return false;
}


//---------------------------------------------------------------------
// Runs one set and returns its counts and its failures grouped by file.
function measure_set( DraftName, SetName )
{
	let cases = LIB_SUITE.LoadCases( DraftName, SetName );
	let summary = { Draft: DraftName, Set: SetName, Total: cases.length, Passed: 0, Excepted: 0, Claimed: is_claimed( DraftName, SetName ), Failures: {} };
	for ( let index = 0; index < cases.length; index++ )
	{
		let this_case = cases[ index ];
		let result = LIB_SUITE.RunCase( ENGINE, this_case );
		let exception = LIB_SUITE.FindException( this_case );
		if ( exception )
		{
			// An excepted case counts as neither passed nor failed, unless it passes, which means
			// the exception is stale and is reported as a failure of the claim.
			if ( result.Passed === false ) { summary.Excepted++; continue; }
			if ( !summary.Failures[ this_case.File ] ) { summary.Failures[ this_case.File ] = []; }
			summary.Failures[ this_case.File ].push( ` /  - passes, so its exception is stale` );
			continue;
		}
		if ( result.Passed )
		{
			summary.Passed++;
			continue;
		}
		if ( !summary.Failures[ this_case.File ] ) { summary.Failures[ this_case.File ] = []; }
		summary.Failures[ this_case.File ].push( `${this_case.Group} / ${this_case.Description} - ${result.Reason}` );
	}
	return summary;
}


//---------------------------------------------------------------------
// Prints the table and returns whether any claimed case failed.
function print_table( Summaries )
{
	console.log( '' );
	console.log( '   ' + 'draft'.padEnd( 10 ) + 'set'.padEnd( 17 ) + 'passed'.padStart( 8 ) + 'excepted'.padStart( 10 ) + 'total'.padStart( 8 ) + 'claimed'.padStart( 9 ) );
	console.log( '   --------------------------------------------------------------' );
	let claimed_failed = false;
	let total_passed = 0;
	let total_excepted = 0;
	let total_cases = 0;
	for ( let index = 0; index < Summaries.length; index++ )
	{
		let summary = Summaries[ index ];
		total_passed += summary.Passed;
		total_excepted += summary.Excepted;
		total_cases += summary.Total;
		let failed = ( ( summary.Passed + summary.Excepted ) < summary.Total );
		if ( summary.Claimed && failed ) { claimed_failed = true; }
		let mark = summary.Claimed ? ( failed ? 'FAIL' : 'yes' ) : '-';
		console.log(
			'   ' + summary.Draft.padEnd( 10 )
			+ summary.Set.padEnd( 17 )
			+ String( summary.Passed ).padStart( 8 )
			+ String( summary.Excepted ).padStart( 10 )
			+ String( summary.Total ).padStart( 8 )
			+ mark.padStart( 9 ) );
	}
	console.log( '   --------------------------------------------------------------' );
	console.log( '   ' + 'total'.padEnd( 27 ) + String( total_passed ).padStart( 8 ) + String( total_excepted ).padStart( 10 ) + String( total_cases ).padStart( 8 ) );
	console.log( '' );
	return claimed_failed;
}


//---------------------------------------------------------------------
// Prints the failures of one set, grouped by file, with a per-file count.
function print_failures( Summary, Verbose )
{
	let files = Object.keys( Summary.Failures );
	if ( files.length === 0 ) { return; }
	console.log( `   ${Summary.Draft} ${Summary.Set}` );
	for ( let index = 0; index < files.length; index++ )
	{
		let failures = Summary.Failures[ files[ index ] ];
		console.log( `      ${files[ index ].padEnd( 28 )} ${String( failures.length ).padStart( 5 )} failing` );
		if ( Verbose === false ) { continue; }
		for ( let failure_index = 0; failure_index < failures.length; failure_index++ )
		{
			console.log( `         ${failures[ failure_index ]}` );
		}
	}
	console.log( '' );
}


//---------------------------------------------------------------------
function main()
{
	let options = read_arguments();
	let summaries = [];
	for ( let draft_index = 0; draft_index < LIB_SUITE.DRAFTS.length; draft_index++ )
	{
		let draft = LIB_SUITE.DRAFTS[ draft_index ];
		if ( options.Draft && ( options.Draft !== draft.Name ) ) { continue; }
		for ( let set_index = 0; set_index < LIB_SUITE.SETS.length; set_index++ )
		{
			let set = LIB_SUITE.SETS[ set_index ];
			if ( options.Set && ( options.Set !== set.Name ) ) { continue; }
			summaries.push( measure_set( draft.Name, set.Name ) );
		}
	}

	console.log( '' );
	console.log( 'JSON Schema Suite' );
	let claimed_failed = print_table( summaries );

	// The failures of a claimed set are always listed by file, because they are regressions.
	// An unclaimed set's failures are listed only when asked, because they are the roadmap.
	for ( let index = 0; index < summaries.length; index++ )
	{
		if ( summaries[ index ].Claimed || options.Verbose ) { print_failures( summaries[ index ], options.Verbose ); }
	}

	process.exit( claimed_failed ? 1 : 0 );
}

main();
