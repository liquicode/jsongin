'use strict';

const Driver = require( './Drivers/jsongin-Driver.js' )( {
	PathExtensions: false,
	Explain: true,
} );


//---------------------------------------------------------------------
describe( 'jsongin Query Tests', () =>
{
	require( './Query Tests/test-suite/Ad-Hoc Tests.js' )( Driver );
	require( './Query Tests/test-suite/RainbowTests.js' )( Driver );
	require( './Query Tests/test-suite/MongoDB Reference.js' )( Driver );
	require( './Query Tests/test-suite/MongoDB Tutorials.js' )( Driver );
} );
