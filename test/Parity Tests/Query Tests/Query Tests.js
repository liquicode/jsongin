'use strict';

/*
	The query parity suites, and the inventory of which suites those are.

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
	describe( 'Query Tests', function ()
	{
		require( './test-suite/Ad-Hoc Tests.js' )( Driver );
		require( './test-suite/RainbowTests.js' )( Driver );
		require( './test-suite/MongoDB Reference.js' )( Driver );
		require( './test-suite/MongoDB Tutorials.js' )( Driver );
		require( './test-suite/Expr Tests.js' )( Driver );
		require( './test-suite/Comparison Operator Tests.js' )( Driver );
		require( './test-suite/Path Semantics Tests.js' )( Driver );
		require( './test-suite/Query Rejection Tests.js' )( Driver );
	} );

};
