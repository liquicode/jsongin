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

	A family leaves this file by being built, and by nothing else.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Update Gaps', function ()
	{
		// No family is currently measured as a gap. See the note above.
	} );

};
