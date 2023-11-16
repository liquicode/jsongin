'use strict';

const Driver = require( '../Drivers/MongoDB-Driver.js' )();


//---------------------------------------------------------------------
describe( 'MongoDB Update Tests', () =>
{
	require( './test-suite/Ad-Hoc Tests.js' )( Driver );
} );
