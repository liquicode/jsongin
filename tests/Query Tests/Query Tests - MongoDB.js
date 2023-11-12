'use strict';

const Driver = require( './Drivers/MongoDB-Driver.js' )();


//---------------------------------------------------------------------
describe( 'MongoDB Tests', () =>
{
	require( './test-suite/RainbowTests' )( Driver );
	require( './test-suite/MongoDB Reference' )( Driver );
	require( './test-suite/MongoDB Tutorials' )( Driver );
} );
