'use strict';

/*
	Measures how much of jsongin's behavior is verified identical to MongoDB's.

	The Parity Tests are driver switchable: one shared suite is run against several engines.
	This script runs each shared suite against the jsongin driver and against the MongoDB
	driver, matches the results test by test, and reports where the two engines disagree.

	MongoDB is the source of truth. A test which passes under MongoDB and fails under jsongin
	is a parity gap. A test which fails under MongoDB is not a jsongin defect at all: it means
	the test asserts something MongoDB does not actually do, and the test is what needs fixing.

	The report ends on two numbers, and they answer two different questions:

		parity     of the operators jsongin ***does*** implement, how many behave exactly as
		           MongoDB behaves. It is expected to read 100%, and a drop is a regression.

		coverage   of ***all*** the operators MongoDB documents, how many jsongin implements at
		           all. It is expected to read well under 100% and rises only when an operator
		           is built. Computed by build/api-coverage.js from the operator reference.

	Between them sits the ROADMAP section: the gap inventory, which states what MongoDB does
	with operators jsongin has not built yet. Those tests are ***expected*** to fail under
	jsongin, so they are reported apart from the parity gaps and never counted into the parity
	number - measuring a missing operator must not be able to make parity look like a
	regression. See test/Parity Tests/Aggregate Tests/Aggregate Gaps.js.

	Usage:
		npm run parity-report
		npm run parity-report -- --verbose      (list every compared test, not just the gaps)

	Requires a MongoDB server at localhost:27017. See test/Parity Tests/Drivers/MongoDB-Driver.js.

	Note what this does and does not measure. It reports the share of shared-suite assertions
	which both engines satisfy. It cannot report behavior no shared suite exercises yet, so a
	high score means "nothing known is broken", not "nothing is broken". Growing the shared
	suites is what makes the number mean more.
*/

const LIB_FS = require( 'fs' );
const LIB_PATH = require( 'path' );
const LIB_CHILD_PROCESS = require( 'child_process' );

const LIB_API_COVERAGE = require( './api-coverage.js' );

const REPO = LIB_PATH.resolve( __dirname, '..' );
const PARITY = LIB_PATH.join( REPO, 'test', 'Parity Tests' );
const NEWLINE = String.fromCharCode( 10 );


//---------------------------------------------------------------------
// The areas to compare. Each one is an area file under test/Parity Tests/ which takes a
// Driver and runs its shared suites against it.
//
// The suite inventory lives in those area files rather than here, so that this script and the
// checked in runners cannot drift apart about what the suites are.
const AREAS = [
	{ Name: 'Query', Folder: 'Query Tests', File: 'Query Tests.js' },
	{ Name: 'Update', Folder: 'Update Tests', File: 'Update Tests.js' },
	{ Name: 'Projection', Folder: 'Projection Tests', File: 'Projection Tests.js' },
	{ Name: 'Aggregate', Folder: 'Aggregate Tests', File: 'Aggregate Tests.js' },
];

// The gap areas, compared the same way and reported separately. An area with no gap file yet
// is skipped rather than being an error, so a family can be written down the day it is
// measured instead of every area needing a placeholder first.
const GAP_AREAS = [
	{ Name: 'Query', Folder: 'Query Tests', File: 'Query Gaps.js' },
	{ Name: 'Update', Folder: 'Update Tests', File: 'Update Gaps.js' },
	{ Name: 'Projection', Folder: 'Projection Tests', File: 'Projection Gaps.js' },
	{ Name: 'Aggregate', Folder: 'Aggregate Tests', File: 'Aggregate Gaps.js' },
];

// The jsongin driver is deliberately given no settings, so it uses the engine the package
// exports rather than a configured one. Parity is a claim about the defaults.


//---------------------------------------------------------------------
// Answers whether an area's file is present. Only the gap areas can be absent.
function area_exists( Area )
{
	return LIB_FS.existsSync( LIB_PATH.join( PARITY, Area.Folder, Area.File ) );
}


//---------------------------------------------------------------------
// Writes a temporary runner which loads one area against one driver.
//
// Neither runner names its engine in a describe(), so a test has the same full title under
// both. That is what lets the two reports be matched test by test below.
function write_runner( Area, DriverName )
{
	let lines = [];
	lines.push( `'use strict';` );

	if ( DriverName === 'jsongin' )
	{
		lines.push( `const Driver = require( '../Drivers/jsongin-Driver.js' )();` );
	}
	else
	{
		lines.push( `const Driver = require( '../Drivers/MongoDB-Driver.js' )();` );
	}

	lines.push( `require( './${Area.File}' )( Driver );` );

	let basename = Area.File.replace( /\.js$/, '' );
	let filename = LIB_PATH.join( PARITY, Area.Folder, `~parity-${basename}-${DriverName}.js` );
	LIB_FS.writeFileSync( filename, lines.join( NEWLINE ) + NEWLINE );
	return filename;
}


//---------------------------------------------------------------------
// Runs one runner under mocha's json reporter and returns a title -> outcome map.
function run_suite( Filename )
{
	let output = '';
	try
	{
		output = LIB_CHILD_PROCESS.execSync(
			`npx mocha -u bdd "${Filename}" --timeout 0 --reporter json`,
			{ cwd: REPO, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ], maxBuffer: 64 * 1024 * 1024 } );
	}
	catch ( error )
	{
		// mocha exits non-zero when tests fail, and still writes its report to stdout.
		output = ( error.stdout || '' );
	}

	let report = null;
	try
	{
		report = JSON.parse( output );
	}
	catch ( error )
	{
		throw new Error( `Could not read the mocha report for [${Filename}]. ${error.message}` );
	}

	let results = {};
	function record( Tests, Outcome )
	{
		if ( !Tests ) { return; }
		for ( let index = 0; index < Tests.length; index++ )
		{
			results[ Tests[ index ].fullTitle ] = Outcome;
		}
	}
	record( report.passes, 'pass' );
	record( report.failures, 'fail' );
	record( report.pending, 'skip' );

	return results;
}


//---------------------------------------------------------------------
// Runs one area under both drivers and sorts every test into one of four outcomes.
//
// The same comparison serves both inventories. What changes between them is what the outcomes
// are called: for a parity area, a test which fails under jsongin is a defect; for a gap area,
// it is the gap the suite was written to record. main() does that naming.
function compare_area( Area, Verbose )
{
	let jsongin_file = write_runner( Area, 'jsongin' );
	let mongodb_file = write_runner( Area, 'MongoDB' );

	let summary = { Area: Area.Name, Compared: 0, Agree: 0, AgreeTitles: [], Gaps: [], TestBugs: [], Missing: [] };
	try
	{
		let jsongin_results = run_suite( jsongin_file );
		let mongodb_results = run_suite( mongodb_file );

		let titles = Object.keys( mongodb_results );
		for ( let index = 0; index < titles.length; index++ )
		{
			let title = titles[ index ];
			let mongodb_outcome = mongodb_results[ title ];
			let jsongin_outcome = jsongin_results[ title ];

			if ( typeof jsongin_outcome === 'undefined' )
			{
				summary.Missing.push( title );
				continue;
			}
			if ( ( mongodb_outcome === 'skip' ) || ( jsongin_outcome === 'skip' ) ) { continue; }

			summary.Compared++;

			if ( mongodb_outcome === 'fail' )
			{
				// MongoDB is the source of truth, so this is the test being wrong about
				// MongoDB rather than jsongin being wrong about anything.
				summary.TestBugs.push( title );
				continue;
			}
			if ( jsongin_outcome === 'fail' )
			{
				summary.Gaps.push( title );
				continue;
			}
			summary.Agree++;
			summary.AgreeTitles.push( title );
			if ( Verbose ) { console.log( `      ok   ${title}` ); }
		}
	}
	finally
	{
		LIB_FS.unlinkSync( jsongin_file );
		LIB_FS.unlinkSync( mongodb_file );
	}

	return summary;
}


//---------------------------------------------------------------------
// Prints one area-by-area table and returns the totals under it.
function print_table( Summaries, MatchLabel, GapLabel )
{
	let totals = { Compared: 0, Agree: 0, Gaps: 0, TestBugs: 0, Missing: 0 };

	// Built from the same widths the rows below use, so the two tables line up with each
	// other even though their middle columns are named differently.
	console.log(
		`   ` + `area`.padEnd( 14 )
		+ `compared`.padStart( 8 )
		+ MatchLabel.padStart( 8 )
		+ GapLabel.padStart( 7 )
		+ `test bugs`.padStart( 12 ) );
	console.log( '   ----------------------------------------------------' );
	for ( let index = 0; index < Summaries.length; index++ )
	{
		let summary = Summaries[ index ];
		totals.Compared += summary.Compared;
		totals.Agree += summary.Agree;
		totals.Gaps += summary.Gaps.length;
		totals.TestBugs += summary.TestBugs.length;
		totals.Missing += summary.Missing.length;
		console.log(
			'   ' + summary.Area.padEnd( 14 )
			+ String( summary.Compared ).padStart( 8 )
			+ String( summary.Agree ).padStart( 8 )
			+ String( summary.Gaps.length ).padStart( 7 )
			+ String( summary.TestBugs.length ).padStart( 12 ) );
	}
	console.log( '   ----------------------------------------------------' );
	console.log(
		'   ' + 'total'.padEnd( 14 )
		+ String( totals.Compared ).padStart( 8 )
		+ String( totals.Agree ).padStart( 8 )
		+ String( totals.Gaps ).padStart( 7 )
		+ String( totals.TestBugs ).padStart( 12 ) );
	console.log( '' );

	return totals;
}


//---------------------------------------------------------------------
function main()
{
	let verbose = process.argv.includes( '--verbose' );

	console.log( '' );
	console.log( 'Measuring jsongin against MongoDB ...' );
	console.log( '' );

	let summaries = [];
	for ( let index = 0; index < AREAS.length; index++ )
	{
		let area = AREAS[ index ];
		if ( verbose ) { console.log( `   ${area.Name}` ); }
		summaries.push( compare_area( area, verbose ) );
	}

	let gap_summaries = [];
	for ( let index = 0; index < GAP_AREAS.length; index++ )
	{
		let area = GAP_AREAS[ index ];
		if ( !area_exists( area ) ) { continue; }
		if ( verbose ) { console.log( `   ${area.Name} gaps` ); }
		let gap_summary = compare_area( area, verbose );
		// An area whose gap inventory is empty - every family in it built - has nothing to
		// report, and a table of zeroes would only be noise.
		if ( gap_summary.Compared === 0 ) { continue; }
		gap_summaries.push( gap_summary );
	}

	//---------------------------------------------------------------------
	// The implemented surface.
	console.log( '   The implemented surface' );
	console.log( '' );
	let totals = print_table( summaries, 'agree', 'gaps' );

	let parity = 100;
	if ( totals.Compared > 0 ) { parity = ( totals.Agree / totals.Compared ) * 100; }
	console.log( `   parity     ${parity.toFixed( 1 )}%   (${totals.Agree} of ${totals.Compared} compared behaviors agree)` );
	console.log( '' );

	// Nothing is excluded from the comparison. Every parity suite asserts behavior MongoDB
	// also implements, so every one of them has a baseline. A jsongin extension is a unit
	// test, which is why this report no longer has a category for what it could not measure.

	for ( let index = 0; index < summaries.length; index++ )
	{
		let summary = summaries[ index ];
		for ( let gap_index = 0; gap_index < summary.Gaps.length; gap_index++ )
		{
			console.log( `   PARITY GAP   ${summary.Gaps[ gap_index ]}` );
		}
		for ( let bug_index = 0; bug_index < summary.TestBugs.length; bug_index++ )
		{
			console.log( `   TEST BUG     ${summary.TestBugs[ bug_index ]}   (fails against MongoDB)` );
		}
		for ( let missing_index = 0; missing_index < summary.Missing.length; missing_index++ )
		{
			console.log( `   NOT RUN      ${summary.Missing[ missing_index ]}   (absent under the jsongin driver)` );
		}
	}

	//---------------------------------------------------------------------
	// The unimplemented surface.
	let gap_totals = { Compared: 0, Agree: 0, Gaps: 0, TestBugs: 0, Missing: 0 };
	if ( gap_summaries.length > 0 )
	{
		console.log( '' );
		console.log( '   The unimplemented surface' );
		console.log( '' );
		gap_totals = print_table( gap_summaries, 'built', 'to do' );

		for ( let index = 0; index < gap_summaries.length; index++ )
		{
			let summary = gap_summaries[ index ];
			let agree_titles = summary.AgreeTitles;
			for ( let built_index = 0; built_index < agree_titles.length; built_index++ )
			{
				// A gap test which passes is an operator which now exists. It has stopped
				// measuring a gap and started measuring behavior, so it belongs in the
				// parity inventory where a later regression in it would be caught.
				console.log( `   IMPLEMENTED  ${agree_titles[ built_index ]}   (move this test into test-suite/)` );
			}
			for ( let bug_index = 0; bug_index < summary.TestBugs.length; bug_index++ )
			{
				console.log( `   TEST BUG     ${summary.TestBugs[ bug_index ]}   (fails against MongoDB)` );
			}
			for ( let missing_index = 0; missing_index < summary.Missing.length; missing_index++ )
			{
				console.log( `   NOT RUN      ${summary.Missing[ missing_index ]}   (absent under the jsongin driver)` );
			}
			if ( verbose )
			{
				for ( let gap_index = 0; gap_index < summary.Gaps.length; gap_index++ )
				{
					console.log( `   ROADMAP      ${summary.Gaps[ gap_index ]}` );
				}
			}
		}

		if ( !verbose && ( gap_totals.Gaps > 0 ) )
		{
			console.log( `   ${gap_totals.Gaps} gap tests are still red, as expected. Run with --verbose to list them.` );
		}
		console.log( '' );
	}

	//---------------------------------------------------------------------
	// How much of the surface exists at all.
	console.log( LIB_API_COVERAGE.FormatSummary( LIB_API_COVERAGE.Measure() ) );
	console.log( '' );

	// A red gap test is expected work, never a failure of this report. Only the implemented
	// surface can fail it - plus a gap test which is wrong about MongoDB, because a suite
	// which misreports the source of truth is a defect wherever it lives.
	if ( ( totals.Gaps > 0 ) || ( totals.TestBugs > 0 ) || ( gap_totals.TestBugs > 0 ) ) { process.exitCode = 1; }
}


//---------------------------------------------------------------------
main();
