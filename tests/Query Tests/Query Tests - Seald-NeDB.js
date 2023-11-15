'use strict';

const Driver = require( './Drivers/Seald-NeDB-Driver.js' )( {
	inMemoryOnly: true,
} );


//---------------------------------------------------------------------
describe( 'Seald-NeDB Tests', () =>
{
	require( './test-suite/Ad-Hoc Tests.js' )( Driver );
	require( './test-suite/RainbowTests.js' )( Driver );
	require( './test-suite/MongoDB Reference' )( Driver );
	require( './test-suite/MongoDB Tutorials' )( Driver );
} );
