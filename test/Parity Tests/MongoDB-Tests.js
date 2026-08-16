'use strict';

/*
	The parity baseline: every shared suite, run against a real MongoDB server.

	MongoDB is the source of truth. What passes here is what MongoDB actually does, which is
	what makes a failure under another engine mean something. Amend the shared suites under
	each area's test-suite/ folder to establish behavior which is not covered yet, and run it
	here first.

	Requires a server at localhost:27017. See Drivers/MongoDB-Driver.js for the settings.

	Not part of `npm test`, which runs only test/Unit Tests/*.js. Run it deliberately:

		npm run test-parity
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
} );
