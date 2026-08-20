'use strict';

/*
	Measures how much of the operator surface MongoDB documents is implemented by jsongin.

	This is a different question from parity, and the two numbers should not be confused:

		parity     of the operators jsongin ***does*** implement, how many behave exactly as
		           MongoDB behaves. Measured by running the shared suites against both engines.
		           See build/parity.js. It is expected to read 100%, and a drop is a regression.

		coverage   of ***all*** the operators MongoDB documents, how many jsongin implements at
		           all. Measured here. It reads well under 100% and is expected to: it is the
		           roadmap number, and it rises only when an operator is built.

	The inventory is docs/guides/Operator-Reference.md, which already lists every operator
	MongoDB documents and marks each one `Yes` or `-`. Counting that table rather than keeping
	a second list is what stops the two from drifting apart. build/docs-check.js cross-checks
	the `Yes` rows against the operators actually registered, so the table cannot claim an
	operator which is not there.

	Needs no server.

	Usage:
		npm run api-coverage
*/

const LIB_FS = require( 'fs' );
const LIB_PATH = require( 'path' );

const REPO = LIB_PATH.resolve( __dirname, '..' );
const REFERENCE = LIB_PATH.join( REPO, 'docs', 'guides', 'Operator-Reference.md' );


//---------------------------------------------------------------------
// Reads the reference and returns one entry per section which has a Supported column.
//
// A counted row is a table row whose second cell is exactly `Yes` or `-`. The reference has
// tables which are not inventories - the page index at the top, the extended operators, the
// operators which share a name - and none of them carries that column, so this rule leaves
// them out without needing to name them.
function read_sections()
{
	let text = LIB_FS.readFileSync( REFERENCE, 'utf8' );
	let lines = text.split( /\r?\n/ );

	let sections = [];
	let current = null;

	for ( let index = 0; index < lines.length; index++ )
	{
		let line = lines[ index ];

		let heading = line.match( /^##\s+(.*)$/ );
		if ( heading )
		{
			current = null;
			let name = heading[ 1 ].trim();
			for ( let found = 0; found < sections.length; found++ )
			{
				if ( sections[ found ].Name === name ) { current = sections[ found ]; }
			}
			if ( current === null )
			{
				current = { Name: name, Implemented: 0, Missing: 0, MissingOperators: [] };
				// Held back until the section is known to have a Supported column, so that a
				// prose section never appears in the report with two zeroes.
			}
			continue;
		}

		if ( current === null ) { continue; }
		if ( !line.startsWith( '|' ) ) { continue; }

		let cells = line.split( '|' );
		if ( cells.length < 4 ) { continue; }

		let supported = cells[ 2 ].trim();
		if ( ( supported !== 'Yes' ) && ( supported !== '-' ) ) { continue; }

		if ( sections.indexOf( current ) < 0 ) { sections.push( current ); }

		if ( supported === 'Yes' )
		{
			current.Implemented++;
		}
		else
		{
			current.Missing++;
			current.MissingOperators.push( operator_name( cells[ 3 ] ) );
		}
	}

	return sections;
}


//---------------------------------------------------------------------
// Pulls the operator out of its cell. An implemented operator is a link into the page which
// describes it, and one which is not implemented has no page to link to, so both forms appear.
function operator_name( Cell )
{
	let text = Cell.trim();
	let link = text.match( /^\[([^\]]+)\]/ );
	if ( link ) { return link[ 1 ]; }
	return text;
}


//---------------------------------------------------------------------
// The measurement, as data. Exported so that build/parity.js prints the same number from the
// same code rather than computing its own.
function Measure()
{
	let sections = read_sections();

	let measurement = { Sections: sections, Implemented: 0, Missing: 0, Total: 0, Percent: 0 };
	for ( let index = 0; index < sections.length; index++ )
	{
		measurement.Implemented += sections[ index ].Implemented;
		measurement.Missing += sections[ index ].Missing;
	}
	measurement.Total = measurement.Implemented + measurement.Missing;
	if ( measurement.Total > 0 )
	{
		measurement.Percent = ( measurement.Implemented / measurement.Total ) * 100;
	}

	return measurement;
}


//---------------------------------------------------------------------
// The one line both this script and the parity report end on.
function FormatSummary( Measurement )
{
	return `   coverage   ${Measurement.Percent.toFixed( 1 )}%`
		+ `   (${Measurement.Implemented} of ${Measurement.Total} documented operators are implemented)`;
}


//---------------------------------------------------------------------
function FormatReport( Measurement )
{
	let lines = [];

	lines.push( '   section                          implemented   missing   total' );
	lines.push( '   ------------------------------------------------------------------' );
	for ( let index = 0; index < Measurement.Sections.length; index++ )
	{
		let section = Measurement.Sections[ index ];
		let total = section.Implemented + section.Missing;
		lines.push(
			'   ' + section.Name.padEnd( 30 )
			+ String( section.Implemented ).padStart( 13 )
			+ String( section.Missing ).padStart( 10 )
			+ String( total ).padStart( 8 ) );
	}
	lines.push( '   ------------------------------------------------------------------' );
	lines.push(
		'   ' + 'total'.padEnd( 30 )
		+ String( Measurement.Implemented ).padStart( 13 )
		+ String( Measurement.Missing ).padStart( 10 )
		+ String( Measurement.Total ).padStart( 8 ) );
	lines.push( '' );
	lines.push( FormatSummary( Measurement ) );

	return lines;
}


//---------------------------------------------------------------------
function main()
{
	let verbose = process.argv.includes( '--verbose' );
	let measurement = Measure();

	console.log( '' );
	console.log( 'Measuring how much of the MongoDB operator surface jsongin implements ...' );
	console.log( '' );

	let lines = FormatReport( measurement );
	for ( let index = 0; index < lines.length; index++ )
	{
		console.log( lines[ index ] );
	}
	console.log( '' );

	if ( verbose )
	{
		for ( let index = 0; index < measurement.Sections.length; index++ )
		{
			let section = measurement.Sections[ index ];
			for ( let missing = 0; missing < section.MissingOperators.length; missing++ )
			{
				console.log( `   NOT IMPLEMENTED   ${section.Name}   ${section.MissingOperators[ missing ]}` );
			}
		}
		console.log( '' );
	}

	// Coverage is a roadmap number, not a pass or a fail. Exiting non-zero because operators
	// remain unbuilt would make every run of this script a failure, which says nothing.
}


//---------------------------------------------------------------------
module.exports = {
	Measure: Measure,
	FormatReport: FormatReport,
	FormatSummary: FormatSummary,
};

if ( require.main === module ) { main(); }
