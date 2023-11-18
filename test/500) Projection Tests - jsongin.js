'use strict';

const Driver = require( './Drivers/jsongin-Driver.js' )( {
	PathExtensions: false,
	Explain: true,
} );


//---------------------------------------------------------------------
describe( 'jsongin Projection Tests', () =>
{
	require( './Projection Tests/test-suite/Ad-Hoc Tests.js' )( Driver );
} );
