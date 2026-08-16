'use strict';

/*
	The shared suites, run against NeDB.

	Informational. NeDB is not the engine under test and is not a baseline either: it diverges
	from MongoDB on its own account, so its failures are facts about NeDB. It is here because
	running the same suite against a third engine is what keeps the suite honest about which
	behaviors are MongoDB's and which are one implementation's habits.

	Only the query area is listed. The NeDB driver implements SetData, Find, and Evaluate, so
	there is nothing for the update, projection, or aggregate suites to run against.

		npx mocha -u bdd "test/Parity Tests/NeDB-Tests.js" --timeout 0
*/

const Driver = require( './Drivers/NeDB-Driver.js' )( {
	inMemoryOnly: true,
} );


//---------------------------------------------------------------------
describe( 'NeDB Parity Tests', function ()
{
	require( './Query Tests/Query Tests.js' )( Driver );
} );
