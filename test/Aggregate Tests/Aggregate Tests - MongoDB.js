'use strict';

const Driver = require( '../Drivers/MongoDB-Driver.js' )();


//---------------------------------------------------------------------
// This suite runs the same pipelines against a real MongoDB server.
// It is not part of `npm test`, which only runs the files in `test/*.js`.
// Start a MongoDB server at localhost:27017 and run it directly:
//		npx mocha -u bdd "test/Aggregate Tests/Aggregate Tests - MongoDB.js" --timeout 0
//---------------------------------------------------------------------
describe( 'MongoDB Aggregate Tests', () =>
{
	require( './test-suite/Ad-Hoc Tests.js' )( Driver );
} );
