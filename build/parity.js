'use strict';

/*
	Measures how much of jsongin's behavior is verified identical to MongoDB's.

	The Parity Tests are driver switchable: one shared suite is run against several engines.
	This script runs each shared suite against the jsongin driver and against the MongoDB
	driver, matches the results test by test, and reports where the two engines disagree.

	MongoDB is the source of truth. A test which passes under MongoDB and fails under jsongin
	is a parity gap. A test which fails under MongoDB is not a jsongin defect at all: it means
	the test asserts something MongoDB does not actually do, and the test is what needs fixing.

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

// The jsongin driver is deliberately given no settings, so it uses the engine the package
// exports rather than a configured one. Parity is a claim about the defaults.


//---------------------------------------------------------------------
// Writes a temporary runner which loads one area against one driver.
//
// Neither runner names its engine in a describe(), so a test has the same full title under
// both. That is what lets the two reports be matched test by test below.
//
// Extensions are left off for both. A suite with no MongoDB counterpart has no baseline to be
// measured against, so including it would only ever add tests which cannot be compared.
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

	let filename = LIB_PATH.join( PARITY, Area.Folder, `~parity-${DriverName}.js` );
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
function compare_area( Area, Verbose )
{
	let jsongin_file = write_runner( Area, 'jsongin' );
	let mongodb_file = write_runner( Area, 'MongoDB' );

	let summary = { Area: Area.Name, Compared: 0, Agree: 0, Gaps: [], TestBugs: [], Missing: [] };
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
// How many tests the jsongin runner has which the comparison does not cover.
// That difference is the extension suites, which is the honest way to report them: they are
// counted from the same run rather than from a second list which could go stale.
function count_extension_tests()
{
	let filename = LIB_PATH.join( PARITY, '~parity-extensions.js' );
	let lines = [];
	lines.push( `'use strict';` );
	lines.push( `const Driver = require( './Drivers/jsongin-Driver.js' )();` );
	for ( let index = 0; index < AREAS.length; index++ )
	{
		lines.push( `require( './${AREAS[ index ].Folder}/${AREAS[ index ].File}' )( Driver, { Extensions: true } );` );
	}
	LIB_FS.writeFileSync( filename, lines.join( NEWLINE ) + NEWLINE );

	try
	{
		let results = run_suite( filename );
		let total = Object.keys( results ).length;

		let compared = 0;
		for ( let index = 0; index < AREAS.length; index++ )
		{
			let plain = write_runner( AREAS[ index ], 'jsongin' );
			try { compared += Object.keys( run_suite( plain ) ).length; }
			finally { LIB_FS.unlinkSync( plain ); }
		}

		return ( total - compared );
	}
	finally
	{
		LIB_FS.unlinkSync( filename );
	}
}


//---------------------------------------------------------------------
function main()
{
	let verbose = process.argv.includes( '--verbose' );

	console.log( '' );
	console.log( 'Measuring jsongin against MongoDB ...' );
	console.log( '' );

	let totals = { Compared: 0, Agree: 0, Gaps: 0, TestBugs: 0, Missing: 0 };
	let summaries = [];

	for ( let index = 0; index < AREAS.length; index++ )
	{
		let area = AREAS[ index ];
		if ( verbose ) { console.log( `   ${area.Name}` ); }
		let summary = compare_area( area, verbose );
		summaries.push( summary );
		totals.Compared += summary.Compared;
		totals.Agree += summary.Agree;
		totals.Gaps += summary.Gaps.length;
		totals.TestBugs += summary.TestBugs.length;
		totals.Missing += summary.Missing.length;
	}

	console.log( '   area          compared   agree   gaps   test bugs' );
	console.log( '   ----------------------------------------------------' );
	for ( let index = 0; index < summaries.length; index++ )
	{
		let summary = summaries[ index ];
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

	let parity = 100;
	if ( totals.Compared > 0 ) { parity = ( totals.Agree / totals.Compared ) * 100; }
	console.log( `   parity   ${parity.toFixed( 1 )}%   (${totals.Agree} of ${totals.Compared} compared behaviors agree)` );
	console.log( '' );

	// The extension suites are excluded by construction: both runners above are built without
	// Options.Extensions, so a suite with no MongoDB counterpart never enters the comparison.
	// Report the difference rather than leaving it to be inferred from the totals.
	let extension_tests = count_extension_tests();
	if ( extension_tests > 0 )
	{
		console.log( `   not compared   ${extension_tests} extension tests, which have no MongoDB behavior to be measured against` );
		console.log( '' );
	}

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

	if ( ( totals.Gaps > 0 ) || ( totals.TestBugs > 0 ) ) { process.exitCode = 1; }
}


//---------------------------------------------------------------------
main();
