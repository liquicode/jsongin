'use strict';

/*
	The projection parity suites, and the inventory of which suites those are.

	This file names no engine. It takes a Driver and runs the shared suites against it, the
	same way each file under test-suite/ does, so that one inventory serves every engine.
	Pick the engine in one of the top level runners instead:

		test/Parity Tests/MongoDB-Tests.js      the baseline, requires a live server
		test/Parity Tests/jsongin-Tests.js      the engine under test

	Options.Extensions includes the suites which exercise jsongin extensions. Those have no
	MongoDB counterpart and so no baseline to be measured against, so they run only under the
	jsongin driver. There are none in this area today; the parameter is here so that every
	area file has the same shape.
*/

module.exports = function ( Driver, Options = {} )
{

	//---------------------------------------------------------------------
	describe( 'Projection Tests', function ()
	{
		require( './test-suite/Ad-Hoc Tests.js' )( Driver );
	} );

};
