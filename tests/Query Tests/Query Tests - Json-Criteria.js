'use strict';

const Driver = require( './Drivers/Json-Criteria-Driver.js' )( {
	PathExtensions: false,
	Explain: false,
} );


//---------------------------------------------------------------------
describe( 'Json-Criteria Tests', () =>
{
	require( './test-suite/RainbowTests.js' )( Driver );
	require( './test-suite/MongoDB Reference' )( Driver );
	require( './test-suite/MongoDB Tutorials' )( Driver );
} );
