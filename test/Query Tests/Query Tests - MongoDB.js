'use strict';

const Driver = require( '../Drivers/MongoDB-Driver.js' )();


//---------------------------------------------------------------------
describe( 'MongoDB Query Tests', () =>
{
	require( './test-suite/Ad-Hoc Tests.js' )( Driver );
	require( './test-suite/RainbowTests' )( Driver );
	require( './test-suite/MongoDB Reference' )( Driver );
	require( './test-suite/MongoDB Tutorials' )( Driver );
} );
