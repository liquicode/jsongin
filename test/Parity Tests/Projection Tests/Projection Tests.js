'use strict';

/*
	The projection parity suites, and the inventory of which suites those are.

	This file names no engine. It takes a Driver and runs the shared suites against it, the
	same way each file under test-suite/ does, so that one inventory serves every engine.
	Pick the engine in one of the top level runners instead:

		test/Parity Tests/MongoDB-Tests.js      the baseline, requires a live server
		test/Parity Tests/jsongin-Tests.js      the engine under test

	Every suite here asserts behavior MongoDB also implements. A jsongin extension has no
	baseline to be measured against, so it is a unit test rather than a parity test:
	see test/Unit Tests/260) Extension Operator Tests.js.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Projection Tests', function ()
	{
		require( './test-suite/Ad-Hoc Tests.js' )( Driver );
		require( './test-suite/Projection Shape Tests.js' )( Driver );
	} );

};
