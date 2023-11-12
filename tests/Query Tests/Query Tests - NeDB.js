'use strict';

// const LIB_PATH = require( 'path' );
// const TEMP_PATH = LIB_PATH.join( __dirname, '~temp' );
// { // Make sure temp path exists.
// 	const LIB_FS = require( 'fs' );
// 	if ( !LIB_FS.existsSync( TEMP_PATH ) ) { LIB_FS.mkdirSync( TEMP_PATH ); }
// }

// const Driver = require( './test-suite/Drivers/NeDB-Driver.js' )( {
// 	filename: LIB_PATH.join( TEMP_PATH, 'NeDB-UnitTests.nedb' ),
// 	autoload: true,
// } );

const Driver = require( './Drivers/NeDB-Driver.js' )( {
	inMemoryOnly: true,
} );


//---------------------------------------------------------------------
describe( 'NeDB Tests', () =>
{
	require( './test-suite/RainbowTests.js' )( Driver );
	require( './test-suite/MongoDB Reference' )( Driver );
	require( './test-suite/MongoDB Tutorials' )( Driver );
} );
