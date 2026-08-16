'use strict';

/*
	The query parity suites, and the inventory of which suites those are.

	This file names no engine. It takes a Driver and runs the shared suites against it, the
	same way each file under test-suite/ does, so that one inventory serves every engine.
	Pick the engine in one of the top level runners instead:

		test/Parity Tests/MongoDB-Tests.js      the baseline, requires a live server
		test/Parity Tests/jsongin-Tests.js      the engine under test

	Options.Extensions includes the suites which exercise jsongin extensions. Those have no
	MongoDB counterpart and so no baseline to be measured against, so they run only under the
	jsongin driver.
*/

module.exports = function ( Driver, Options = {} )
{

	//---------------------------------------------------------------------
	describe( 'Query Tests', function ()
	{
		require( './test-suite/Ad-Hoc Tests.js' )( Driver );
		require( './test-suite/RainbowTests.js' )( Driver );
		require( './test-suite/MongoDB Reference.js' )( Driver );
		require( './test-suite/MongoDB Tutorials.js' )( Driver );
		require( './test-suite/Expr Tests.js' )( Driver );

		// $exprx is a jsongin extension. There is no MongoDB behavior to compare it against.
		if ( Options.Extensions === true )
		{
			require( './test-suite/Exprx Tests.js' )( Driver );
		}
	} );

};
