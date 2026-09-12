'use strict';

/*
	The update ***gap*** suites, and the inventory of which suites those are.

	A gap suite states what MongoDB does with an operator jsongin has not built yet. Every
	test in one is expected to pass under MongoDB and to ***fail*** under jsongin. See
	Standing Decision 6 in .plans/story.md - a gap nothing measures is a gap nobody revisits.

	This inventory is deliberately separate from `Update Tests.js`:

		test/Parity Tests/MongoDB-Tests.js      runs both, and must be green for both.
		test/Parity Tests/jsongin-Tests.js      runs only the parity inventory, never this one,
		                                        so a red `npm test` still always means a
		                                        regression.
		build/parity.js                         runs both, and reports these separately so
		                                        they never move the parity number.

	A family leaves this file by being built, and by nothing else. The one entry which is
	not an operator family is a ***behavior*** kept on purpose, and it says why beside the test.
*/

const assert = require( 'assert' );

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Update Gaps', function ()
	{

		// ***A behavior gap rather than an operator gap, and a deliberate one.*** MongoDB
		// refuses an update document which names no operator; jsongin applies it as a no-op,
		// because its own Diff() answers {} for two documents which do not differ and promises
		// that Update( Before, Diff( Before, After ) ) is After. Measured 2026-09-11 against
		// MongoDB 6.0.28, 7.0.40 and 8.3.8. It leaves this file only if that promise changes
		// shape. { $set: {} } is the spelling of a no-op the two engines share.
		it( 'should refuse an update document which names no operator', async () =>
		{
			await Driver.SetData( [ { a: 1 } ] );
			let refused = false;
			try { await Driver.Update( {}, {} ); }
			catch ( error ) { refused = true; }
			assert.ok( refused );
		} );

	} );

};
