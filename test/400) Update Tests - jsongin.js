'use strict';

const Driver = require( './Drivers/jsongin-Driver.js' )( {
	PathExtensions: false,
	Explain: true,
} );


//---------------------------------------------------------------------
describe( 'jsongin Update Tests', () =>
{
	require( './Update Tests/test-suite/Ad-Hoc Tests.js' )( Driver );
} );
