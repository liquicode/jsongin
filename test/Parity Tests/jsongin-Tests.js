'use strict';

/*
	Every shared suite, run against jsongin.

	This is the same inventory MongoDB-Tests.js runs, against the engine under test. Where a
	test passes here and passes there, the behavior is verified identical. Where it passes
	there and fails here, jsongin is wrong.

	Every suite it runs is a suite MongoDB-Tests.js also runs. The jsongin extensions are not
	here: they have no baseline to be measured against, so they are unit tests instead.
	See test/Unit Tests/260) Extension Operator Tests.js.

	***The gap inventory is deliberately not here.*** <Area> Gaps.js states what MongoDB does
	with the operators jsongin has not built yet, so every test in one fails under this engine
	by design. Loading them here would make `npm test` red and cost it its only meaning: that a
	red `npm test` is a regression. MongoDB-Tests.js and build/parity.js run them instead.

	Needs no server. Run it directly, or measure it against the baseline:

		npm run parity-test-jsongin
		npm run parity-report
*/

// Deliberately unconfigured. This is the engine the package exports, exactly as a caller
// receives it from require( '@liquicode/jsongin' ).
//
// Parity is a claim about the defaults: MongoDB behavior is what jsongin does when told
// nothing. Passing settings here, even settings which only restate a default, would let a
// change to that default pass this suite unnoticed.
//
// See 'Default Settings Tests' in test/Unit Tests/130) Engine Function Tests.js, which pins
// what those defaults are.
const Driver = require( './Drivers/jsongin-Driver.js' )();

//---------------------------------------------------------------------
describe( 'jsongin Parity Tests', function ()
{
	require( './Query Tests/Query Tests.js' )( Driver );
	require( './Update Tests/Update Tests.js' )( Driver );
	require( './Projection Tests/Projection Tests.js' )( Driver );
	require( './Aggregate Tests/Aggregate Tests.js' )( Driver );
} );
