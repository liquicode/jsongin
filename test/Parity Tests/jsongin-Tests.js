'use strict';

/*
	Every shared suite, run against jsongin.

	This is the same inventory MongoDB-Tests.js runs, against the engine under test. Where a
	test passes here and passes there, the behavior is verified identical. Where it passes
	there and fails here, jsongin is wrong.

	Extensions are on, so this also runs the suites which have no MongoDB counterpart.

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

const OPTIONS = { Extensions: true };


//---------------------------------------------------------------------
describe( 'jsongin Parity Tests', function ()
{
	require( './Query Tests/Query Tests.js' )( Driver, OPTIONS );
	require( './Update Tests/Update Tests.js' )( Driver, OPTIONS );
	require( './Projection Tests/Projection Tests.js' )( Driver, OPTIONS );
	require( './Aggregate Tests/Aggregate Tests.js' )( Driver, OPTIONS );
} );
