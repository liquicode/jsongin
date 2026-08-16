'use strict';

/*
	The shared suites, run against @seald-io/nedb.

	Informational, for the same reason NeDB-Tests.js is. See that file.

	Only the query area is listed. The Seald-NeDB driver implements SetData, Find, and
	Evaluate, so there is nothing for the update, projection, or aggregate suites to run
	against.

		npx mocha -u bdd "test/Parity Tests/Seald-NeDB-Tests.js" --timeout 0
*/

const Driver = require( './Drivers/Seald-NeDB-Driver.js' )( {
	inMemoryOnly: true,
} );


//---------------------------------------------------------------------
describe( 'Seald-NeDB Parity Tests', function ()
{
	require( './Query Tests/Query Tests.js' )( Driver );
} );
