'use strict';

const Driver = require( './Drivers/jsongin-Driver.js' )( {
	PathExtensions: false,
	Explain: true,
} );


//---------------------------------------------------------------------
describe( 'jsongin Aggregate Tests', () =>
{
	require( './Aggregate Tests/test-suite/Ad-Hoc Tests.js' )( Driver );
} );
