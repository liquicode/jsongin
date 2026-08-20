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
	A family leaves this file by being built. Three have, all on 2026-08-20: the String family,
	the twenty-one arithmetic and trigonometry operators, and the nine Type operators, each
	graduating to its own file under `test-suite/`. In every case the suite was written here
	against the server first, the operators were built until it went green under jsongin, and
	only then did it move to where a later regression in it would be caught. A gap suite is
	retired by implementing the operators it names, and by nothing else.

	***One assertion did not survive graduation***, and that is worth knowing before writing
	the next family. The Type suite asked what `$type` says about a converted number, MongoDB
	answered `'long'`, and jsongin has no such type to report. A gap suite can only hold what
	an operator will one day satisfy; a difference the data model makes permanent belongs in a
	unit test which asserts jsongin's own answer, and in the documentation. See
	`test/Unit Tests/220) Expression Operator Tests.js`.

	`.reviews/2026-08-19/review.md` classifies the 151 operators still unimplemented into what
	is buildable now, what needs care, what waits on variable scope in Evaluate, and what the
	single-document model rules out.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Aggregate Gaps', function ()
	{
		require( './test-suite/Redact Gap Tests.js' )( Driver );
	} );

};
