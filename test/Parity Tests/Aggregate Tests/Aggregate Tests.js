'use strict';

/*
	The aggregate parity suites, and the inventory of which suites those are.

	This file names no engine. It takes a Driver and runs the shared suites against it, the
	same way each file under test-suite/ does, so that one inventory serves every engine.
	Pick the engine in one of the top level runners instead:

		test/Parity Tests/MongoDB-Tests.js      the baseline, requires a live server
		test/Parity Tests/jsongin-Tests.js      the engine under test

	Note that a Driver cannot be handed over after the fact by assigning it to this module.
	describe() runs its callback while this file is being required, so the suites below take
	their Driver at that moment. Passing it in as a parameter is what makes the timing work.

	Every suite here asserts behavior MongoDB also implements. A jsongin extension has no
	baseline to be measured against, so it is a unit test rather than a parity test:
	see test/Unit Tests/260) Extension Operator Tests.js.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Aggregate Tests', function ()
	{
		require( './test-suite/Ad-Hoc Tests.js' )( Driver );
		require( './test-suite/Sort Parity Tests.js' )( Driver );
		require( './test-suite/Expression Operator Tests.js' )( Driver );
		require( './test-suite/String Operator Tests.js' )( Driver );
		require( './test-suite/Arithmetic and Trigonometry Operator Tests.js' )( Driver );
		require( './test-suite/Type Operator Tests.js' )( Driver );
		require( './test-suite/Data Size Operator Tests.js' )( Driver );
		require( './test-suite/Date Operator Tests.js' )( Driver );
		require( './test-suite/Set Operator Tests.js' )( Driver );
		require( './test-suite/Array Operator Tests.js' )( Driver );
		require( './test-suite/Object Operator Tests.js' )( Driver );
		require( './test-suite/Accumulator Operator Tests.js' )( Driver );
		require( './test-suite/Reshaping Stage Tests.js' )( Driver );
		require( './test-suite/Bucketing Stage Tests.js' )( Driver );
		require( './test-suite/Filling Stage Tests.js' )( Driver );
		require( './test-suite/Stage and Accumulator Tests.js' )( Driver );
		require( './test-suite/Expression Rejection Tests.js' )( Driver );
		require( './test-suite/Variable Scope Tests.js' )( Driver );
	} );

};
