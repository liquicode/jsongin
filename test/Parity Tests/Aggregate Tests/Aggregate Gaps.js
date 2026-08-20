'use strict';

/*
	The aggregate ***gap*** suites, and the inventory of which suites those are.

	A gap suite states what MongoDB does with an operator jsongin has not built yet. Every
	test in one is expected to pass under MongoDB and to ***fail*** under jsongin. They are
	not broken tests and they are not waiting on a bug fix: they are the feature gap, written
	down where the parity report keeps reporting it. See Standing Decision 6 in
	.plans/story.md - a gap nothing measures is a gap nobody revisits.

	This inventory is deliberately separate from `Aggregate Tests.js`:

		test/Parity Tests/MongoDB-Tests.js      runs both, and must be green for both. A gap
		                                        test which fails here is wrong about MongoDB.
		test/Parity Tests/jsongin-Tests.js      runs only the parity inventory, never this one,
		                                        so `npm test` stays green and a red `npm test`
		                                        still always means a regression.
		build/parity.js                         runs both, and reports these separately under
		                                        its own heading so they never move the parity
		                                        number.

	***It is empty, and that is the finished state of a family rather than a missing file.***
	The String family was written here on 2026-08-20 and graduated on the same day: the
	twenty operators were built, the suite went green under jsongin, and it moved to
	`test-suite/String Operator Tests.js` where a later regression in it would be caught. A
	gap suite is retired by implementing the operators it names, and by nothing else.

	The next family to be measured is added below. `.reviews/2026-08-19/review.md` classifies
	the 151 operators still unimplemented into what is buildable now, what needs care, what
	waits on variable scope in Evaluate, and what the single-document model rules out.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Aggregate Gaps', function ()
	{
		// No family is currently measured as a gap. See the note above.
	} );

};
