'use strict';

/*
	The query ***gap*** suites, and the inventory of which suites those are.

	A gap suite states what MongoDB does with an operator jsongin has not built yet. Every
	test in one is expected to pass under MongoDB and to ***fail*** under jsongin. They are
	not broken tests and they are not waiting on a bug fix: they are the feature gap, written
	down where the parity report keeps reporting it. See Standing Decision 6 in
	.plans/story.md - a gap nothing measures is a gap nobody revisits.

	This inventory is deliberately separate from `Query Tests.js`:

		test/Parity Tests/MongoDB-Tests.js      runs both, and must be green for both. A gap
		                                        test which fails here is wrong about MongoDB.
		test/Parity Tests/jsongin-Tests.js      runs only the parity inventory, never this one,
		                                        so `npm test` stays green and a red `npm test`
		                                        still always means a regression.
		build/parity.js                         runs both, and reports these separately under
		                                        its own heading so they never move the parity
		                                        number.

	A family leaves this file by being built, and by nothing else.

	***It is empty, which is the finished state of a family rather than a missing file.*** The
	bitwise operators, the query $mod, $comment, and $sampleRate were written here on
	2026-08-20 and graduated the same day to
	`test-suite/Bitwise and Miscellaneous Query Tests.js`.

	What remains unimplemented in the Query section is `$jsonSchema`, `$text`, `$where`, the
	four geospatial operators, and the two names in the Miscellaneous group which are not query
	operators at all: `$rand`, which is an expression reached through `$expr`, and `$natural`,
	which is a hint about how a collection is scanned and has no meaning for a matcher over one
	document. Neither can ever be registered here. See `.reviews/2026-08-19/review.md`.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Query Gaps', function ()
	{
		// No family is currently measured as a gap. See the note above.
	} );

};
