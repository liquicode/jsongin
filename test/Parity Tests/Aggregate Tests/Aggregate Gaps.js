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

	A family leaves this file by being built, and by nothing else.

	***It is empty, which is the finished state of a family rather than a missing file.*** The
	thirteen families written here on 2026-08-20 graduated the same day. The last two left on
	2026-08-21: `$redact` and the variable-scope suite, which were one family in two files -
	both blocked by the missing variable parameter on `Evaluate()`, Bucket C of
	.reviews/2026-08-19/review.md - and they are now `test-suite/Redact Tests.js` and
	`test-suite/Variable Scope Tests.js`.

	***With all three gap inventories empty, every operator jsongin has not built is one which
	was never written down as a gap.*** That is not the same as nothing being left: what
	remains is listed in `docs/guides/Operator-Reference.md`, where a `-` in the Supported
	column marks it, and `npm run api-coverage` counts those rows. A gap suite is the next step
	up from a row in that table - it is what a family gets when someone decides to build it -
	so the way to refill this file is to pick one and write what MongoDB does with it, against
	the server, before writing any code.

	***One assertion did not survive graduation***, and that is worth knowing before writing
	the next family. The Type suite asked what `$type` says about a converted number, MongoDB
	answered `'long'`, and jsongin has no such type to report. A gap suite can only hold what
	an operator will one day satisfy; a difference the data model makes permanent belongs in a
	unit test which asserts jsongin's own answer, and in the documentation. See
	`test/Unit Tests/220) Expression Operator Tests.js`.

	`.reviews/2026-08-19/review.md` classifies the operators still unimplemented into what is
	buildable now, what needs care, and what the single-document model rules out.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Aggregate Gaps', function ()
	{
		// No family is currently measured as a gap. See the note above.
	} );

};
