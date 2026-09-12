'use strict';

/*
	Runs the claimed sets of the official JSON-Schema-Test-Suite against ValidateDocument.

	The suite is vendored under test/json-schema-test-suite/ and read by
	build/json-schema-suite.js, which this file and build/json-schema-report.js share. The
	report measures every set; this file asserts only the ones in CLAIMED, so that a claimed
	set going red is a regression which fails npm test, while a set not yet built cannot.

	The claim list is SUITE.CLAIMED in build/json-schema-suite.js, the one place it is stated,
	so this file and the report cannot disagree about what is claimed.
*/

const assert = require( 'assert' );
const jsongin = require( '../../src/jsongin' );
const SUITE = require( '../../build/json-schema-suite.js' );

const CLAIMED = SUITE.CLAIMED;


describe( '170) JSON Schema Suite Tests', () =>
{

	for ( let claim_index = 0; claim_index < CLAIMED.length; claim_index++ )
	{
		let claim = CLAIMED[ claim_index ];
		let cases = SUITE.LoadCases( claim.Draft, claim.Set );

		//---------------------------------------------------------------------
		describe( `${claim.Draft} ${claim.Set}`, () =>
		{
			// One describe per case file, so a failure names the keyword it is about.
			let files = [];
			for ( let index = 0; index < cases.length; index++ )
			{
				if ( files.includes( cases[ index ].File ) === false ) { files.push( cases[ index ].File ); }
			}
			for ( let file_index = 0; file_index < files.length; file_index++ )
			{
				let file = files[ file_index ];
				describe( file, () =>
				{
					for ( let index = 0; index < cases.length; index++ )
					{
						let this_case = cases[ index ];
						if ( this_case.File !== file ) { continue; }
						let exception = SUITE.FindException( this_case );
						if ( exception )
						{
							// An excepted case is asserted to still fail, so that the day it passes the
							// exception is noticed and removed rather than hiding a case which now works.
							it( `:  (excepted: )`, () =>
							{
								let result = SUITE.RunCase( jsongin, this_case );
								assert.ok( result.Passed === false, 'This excepted case passes now; remove its exception.' );
							} );
							continue;
						}
						it( `: `, () =>
						{
							let result = SUITE.RunCase( jsongin, this_case );
							assert.ok( result.Passed, result.Reason );
						} );
					}
				} );
			}
		} );
	}

} );
