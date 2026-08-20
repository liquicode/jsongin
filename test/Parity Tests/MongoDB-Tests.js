'use strict';

/*
	The parity baseline: every shared suite, run against a real MongoDB server.

	MongoDB is the source of truth. What passes here is what MongoDB actually does, which is
	what makes a failure under another engine mean something. Amend the shared suites under
	each area's test-suite/ folder to establish behavior which is not covered yet, and run it
	here first.

	Requires a server at localhost:27017. See Drivers/MongoDB-Driver.js for the settings.

	This runner loads two inventories, and the difference between them matters:

		<Area> Tests.js     the parity inventory - behavior jsongin implements. Also run by
		                    jsongin-Tests.js, and therefore by `npm test`, where it is
		                    expected green.

		<Area> Gaps.js      the gap inventory - behavior MongoDB has and jsongin has not built
		                    yet. Expected green here and red under jsongin, which is the whole
		                    point. jsongin-Tests.js does not load it, so `npm test` stays a
		                    regression signal rather than a to-do list.

	Everything here must be green. A gap test which fails here is wrong about MongoDB, which is
	a test bug, and is fixed before anything else.

	Not part of `npm test`, which runs the unit tests and the jsongin parity inventory without
	needing a server. Run this one deliberately:

		npm run parity-test-mongodb
		npx mocha -u bdd "test/Parity Tests/MongoDB-Tests.js" --timeout 0

	To measure jsongin against this baseline:

		npm run parity-report
*/

const Driver = require( './Drivers/MongoDB-Driver.js' )();


//---------------------------------------------------------------------
describe( 'MongoDB Parity Tests', function ()
{
	require( './Query Tests/Query Tests.js' )( Driver );
	require( './Update Tests/Update Tests.js' )( Driver );
	require( './Projection Tests/Projection Tests.js' )( Driver );
	require( './Aggregate Tests/Aggregate Tests.js' )( Driver );

	// The gap inventory. See the note above: green here, red under jsongin.
	require( './Query Tests/Query Gaps.js' )( Driver );
	require( './Update Tests/Update Gaps.js' )( Driver );
	require( './Aggregate Tests/Aggregate Gaps.js' )( Driver );
} );
