'use strict';

const assert = require( 'assert' );

/*
	The date expression operators.

	Twenty-one of them, and the largest family jsongin has not built. This is a ***gap suite***:
	every test here passes under MongoDB and fails under jsongin by design. See
	`Aggregate Gaps.js` and Standing Decision 6 in .plans/story.md.

	One it() per operator, so a row turning green names the operator which was built.

	***The care point is the time zone, and it is not guessable.*** Javascript's getFullYear()
	and its relatives read a date in the machine's local zone, and MongoDB reads one in ***UTC***
	unless told otherwise. An engine which reached for the obvious Javascript call would give a
	different answer on a laptop in New York than on a server in London, for the same stored
	document. Every operator below is therefore asked twice: once with no zone, and once with a
	zone given.

	The dates used throughout:

		2020-01-02T03:04:05.678Z    a Thursday, in ISO week 1 of 2020
		2021-01-01T00:00:00.000Z    a Friday, which ISO 8601 places in week 53 of ***2020***

	The second one is there because the ISO week year and the calendar year disagree about it,
	which is the whole reason $isoWeekYear exists as a separate operator.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Date Operator Tests', () =>
	{

		let documents = [
			{
				_id: 1,
				dt: new Date( '2020-01-02T03:04:05.678Z' ),
				turn: new Date( '2021-01-01T00:00:00.000Z' ),
				empty: null,
				text: 'nope',
				number: 1577934245678,
			},
		];


		//---------------------------------------------------------------------
		async function evaluated( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $match: { _id: 1 } },
				{ $project: { _id: 0, r: Expression } },
			] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		async function refused( Expression )
		{
			try
			{
				await evaluated( Expression );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Reading the Parts of a Date', () =>
		{

			it( 'should read the year with $year', async () =>
			{
				assert.strictEqual( await evaluated( { $year: '$dt' } ), 2020 );
				assert.strictEqual( await evaluated( { $year: '$turn' } ), 2021 );
				// The object form takes the same date and adds a zone.
				assert.strictEqual( await evaluated( { $year: { date: '$dt' } } ), 2020 );
				assert.strictEqual( await evaluated( { $year: { date: '$turn', timezone: 'America/New_York' } } ), 2020 );
				assert.strictEqual( await evaluated( { $year: '$empty' } ), null );
				assert.strictEqual( await refused( { $year: '$text' } ), true );
			} );

			it( 'should read the month with $month', async () =>
			{
				// ***Months count from 1***, unlike Javascript's getUTCMonth().
				assert.strictEqual( await evaluated( { $month: '$dt' } ), 1 );
				assert.strictEqual( await evaluated( { $month: { date: '$turn', timezone: 'America/New_York' } } ), 12 );
				assert.strictEqual( await evaluated( { $month: '$empty' } ), null );
			} );

			it( 'should read the day of the month with $dayOfMonth', async () =>
			{
				assert.strictEqual( await evaluated( { $dayOfMonth: '$dt' } ), 2 );
				// Five hours behind UTC puts this one on the previous day.
				assert.strictEqual( await evaluated( { $dayOfMonth: { date: '$dt', timezone: 'America/New_York' } } ), 1 );
				assert.strictEqual( await evaluated( { $dayOfMonth: '$empty' } ), null );
			} );

			it( 'should read the day of the week with $dayOfWeek', async () =>
			{
				// ***Sunday is 1 and Saturday is 7.*** The test date is a Thursday.
				assert.strictEqual( await evaluated( { $dayOfWeek: '$dt' } ), 5 );
				assert.strictEqual( await evaluated( { $dayOfWeek: { date: '$dt', timezone: 'America/New_York' } } ), 4 );
				assert.strictEqual( await evaluated( { $dayOfWeek: '$empty' } ), null );
			} );

			it( 'should read the day of the year with $dayOfYear', async () =>
			{
				assert.strictEqual( await evaluated( { $dayOfYear: '$dt' } ), 2 );
				assert.strictEqual( await evaluated( { $dayOfYear: '$turn' } ), 1 );
				assert.strictEqual( await evaluated( { $dayOfYear: { date: '$turn', timezone: 'America/New_York' } } ), 366 );
				assert.strictEqual( await evaluated( { $dayOfYear: '$empty' } ), null );
			} );

			it( 'should read the hour with $hour', async () =>
			{
				assert.strictEqual( await evaluated( { $hour: '$dt' } ), 3 );
				assert.strictEqual( await evaluated( { $hour: { date: '$dt', timezone: 'America/New_York' } } ), 22 );
				// An offset may be given instead of a zone name.
				assert.strictEqual( await evaluated( { $hour: { date: '$dt', timezone: '+05:30' } } ), 8 );
				assert.strictEqual( await evaluated( { $hour: '$empty' } ), null );
			} );

			it( 'should read the minute with $minute', async () =>
			{
				assert.strictEqual( await evaluated( { $minute: '$dt' } ), 4 );
				// A zone whose offset is not a whole hour moves the minute too.
				assert.strictEqual( await evaluated( { $minute: { date: '$dt', timezone: '+05:30' } } ), 34 );
				assert.strictEqual( await evaluated( { $minute: '$empty' } ), null );
			} );

			it( 'should read the seconds with $second', async () =>
			{
				assert.strictEqual( await evaluated( { $second: '$dt' } ), 5 );
				assert.strictEqual( await evaluated( { $second: '$empty' } ), null );
			} );

			it( 'should read the milliseconds with $millisecond', async () =>
			{
				assert.strictEqual( await evaluated( { $millisecond: '$dt' } ), 678 );
				assert.strictEqual( await evaluated( { $millisecond: '$empty' } ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Weeks', () =>
		{

			it( 'should read the week of the year with $week', async () =>
			{
				// ***Weeks begin on Sunday, and the days before the first Sunday are week 0.***
				// 2020 opened on a Wednesday, so the 2nd is still week 0.
				assert.strictEqual( await evaluated( { $week: '$dt' } ), 0 );
				assert.strictEqual( await evaluated( { $week: '$turn' } ), 0 );
				assert.strictEqual( await evaluated( { $week: '$empty' } ), null );
			} );

			it( 'should read the ISO week with $isoWeek', async () =>
			{
				// ISO weeks begin on Monday and the first week is the one holding the first
				// Thursday, so the same date is in week 1 here and week 0 above.
				assert.strictEqual( await evaluated( { $isoWeek: '$dt' } ), 1 );
				// ***And 2021-01-01 belongs to the last week of 2020.***
				assert.strictEqual( await evaluated( { $isoWeek: '$turn' } ), 53 );
				assert.strictEqual( await evaluated( { $isoWeek: '$empty' } ), null );
			} );

			it( 'should read the ISO day of the week with $isoDayOfWeek', async () =>
			{
				// ***Monday is 1 and Sunday is 7***, where $dayOfWeek starts at Sunday.
				assert.strictEqual( await evaluated( { $isoDayOfWeek: '$dt' } ), 4 );
				assert.strictEqual( await evaluated( { $isoDayOfWeek: '$turn' } ), 5 );
				assert.strictEqual( await evaluated( { $isoDayOfWeek: '$empty' } ), null );
			} );

			it( 'should read the ISO week year with $isoWeekYear', async () =>
			{
				assert.strictEqual( await evaluated( { $isoWeekYear: '$dt' } ), 2020 );
				// The calendar year is 2021 and the ISO week year is not.
				assert.strictEqual( await evaluated( { $isoWeekYear: '$turn' } ), 2020 );
				assert.strictEqual( await evaluated( { $isoWeekYear: '$empty' } ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Taking a Date Apart and Putting One Together', () =>
		{

			it( 'should take a date apart with $dateToParts', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $dateToParts: { date: '$dt' } } ), {
					year: 2020, month: 1, day: 2,
					hour: 3, minute: 4, second: 5, millisecond: 678,
				} );

				// ***The ISO form answers with different fields***, not merely different
				// values: there is no month or day in an ISO week date.
				assert.deepStrictEqual( await evaluated( { $dateToParts: { date: '$turn', iso8601: true } } ), {
					isoWeekYear: 2020, isoWeek: 53, isoDayOfWeek: 5,
					hour: 0, minute: 0, second: 0, millisecond: 0,
				} );

				assert.strictEqual( await evaluated( { $dateToParts: { date: '$empty' } } ), null );
				assert.strictEqual( await refused( { $dateToParts: { date: '$text' } } ), true );
			} );

			it( 'should build a date from parts with $dateFromParts', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $dateFromParts: { year: 2020, month: 1, day: 2, hour: 3, minute: 4, second: 5, millisecond: 678 } } ),
					new Date( '2020-01-02T03:04:05.678Z' ) );

				// The parts which are left out default to the start of their range.
				assert.deepStrictEqual( await evaluated( { $dateFromParts: { year: 2020 } } ),
					new Date( '2020-01-01T00:00:00.000Z' ) );

				// A zone is applied to the parts, so these name the same instant.
				assert.deepStrictEqual(
					await evaluated( { $dateFromParts: { year: 2020, month: 1, day: 1, hour: 19, timezone: 'America/New_York' } } ),
					new Date( '2020-01-02T00:00:00.000Z' ) );

				// ***A part outside its range rolls over*** rather than being refused.
				assert.deepStrictEqual( await evaluated( { $dateFromParts: { year: 2020, month: 13 } } ),
					new Date( '2021-01-01T00:00:00.000Z' ) );

				// The ISO form builds from a week date.
				assert.deepStrictEqual( await evaluated( { $dateFromParts: { isoWeekYear: 2020, isoWeek: 53, isoDayOfWeek: 5 } } ),
					new Date( '2021-01-01T00:00:00.000Z' ) );

				assert.strictEqual( await evaluated( { $dateFromParts: { year: null } } ), null );
				assert.strictEqual( await refused( { $dateFromParts: { month: 1 } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Dates and Strings', () =>
		{

			it( 'should write a date through a format with $dateToString', async () =>
			{
				// With no format, the whole ISO string.
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt' } } ), '2020-01-02T03:04:05.678Z' );

				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%Y-%m-%d' } } ), '2020-01-02' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%H:%M:%S.%L' } } ), '03:04:05.678' );
				// ***Every field is padded to its width***, which is why %d gives 02.
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%j' } } ), '002' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$turn', format: '%G-W%V-%u' } } ), '2020-W53-5' );
				// A literal percent is written twice.
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%d%%' } } ), '02%' );

				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%Y-%m-%d', timezone: 'America/New_York' } } ), '2020-01-01' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$empty' } } ), null );
				// onNull answers a null date, as it does in $convert.
				assert.strictEqual( await evaluated( { $dateToString: { date: '$empty', onNull: 'no date' } } ), 'no date' );
				assert.strictEqual( await refused( { $dateToString: { date: '$dt', format: '%Q' } } ), true );
			} );

			it( 'should read a date from a string with $dateFromString', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $dateFromString: { dateString: '2020-01-02T03:04:05.678Z' } } ),
					new Date( '2020-01-02T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateFromString: { dateString: '2020-01-02' } } ),
					new Date( '2020-01-02T00:00:00.000Z' ) );

				// A zone is applied to a string which carries none.
				assert.deepStrictEqual( await evaluated( { $dateFromString: { dateString: '2020-01-02T00:00:00', timezone: 'America/New_York' } } ),
					new Date( '2020-01-02T05:00:00.000Z' ) );

				// A format says how to read it.
				assert.deepStrictEqual( await evaluated( { $dateFromString: { dateString: '02/01/2020', format: '%d/%m/%Y' } } ),
					new Date( '2020-01-02T00:00:00.000Z' ) );

				assert.strictEqual( await evaluated( { $dateFromString: { dateString: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateFromString: { dateString: '$empty', onNull: 'was null' } } ), 'was null' );
				assert.strictEqual( await evaluated( { $dateFromString: { dateString: 'not a date', onError: 'bad' } } ), 'bad' );
				assert.strictEqual( await refused( { $dateFromString: { dateString: 'not a date' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Date Arithmetic', () =>
		{

			it( 'should add units to a date with $dateAdd', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: 'day', amount: 1 } } ),
					new Date( '2020-01-03T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: 'month', amount: 1 } } ),
					new Date( '2020-02-02T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: 'year', amount: 1 } } ),
					new Date( '2021-01-02T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: 'quarter', amount: 1 } } ),
					new Date( '2020-04-02T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: 'hour', amount: 25 } } ),
					new Date( '2020-01-03T04:04:05.678Z' ) );
				// A negative amount goes backwards.
				assert.deepStrictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: 'day', amount: -1 } } ),
					new Date( '2020-01-01T03:04:05.678Z' ) );

				assert.strictEqual( await evaluated( { $dateAdd: { startDate: '$empty', unit: 'day', amount: 1 } } ), null );
				assert.strictEqual( await refused( { $dateAdd: { startDate: '$dt', unit: 'fortnight', amount: 1 } } ), true );
				assert.strictEqual( await refused( { $dateAdd: { startDate: '$dt', unit: 'day' } } ), true );
			} );

			it( 'should subtract units from a date with $dateSubtract', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $dateSubtract: { startDate: '$dt', unit: 'day', amount: 1 } } ),
					new Date( '2020-01-01T03:04:05.678Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateSubtract: { startDate: '$dt', unit: 'month', amount: 1 } } ),
					new Date( '2019-12-02T03:04:05.678Z' ) );
				assert.strictEqual( await evaluated( { $dateSubtract: { startDate: '$empty', unit: 'day', amount: 1 } } ), null );
			} );

			it( 'should count unit boundaries with $dateDiff', async () =>
			{
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'day' } } ), 365 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'year' } } ), 1 );
				// ***The difference counts boundaries crossed, not elapsed time.*** These two
				// dates are less than a year apart and the year difference is still 1.
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'month' } } ), 12 );
				// Backwards is negative.
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$turn', endDate: '$dt', unit: 'day' } } ), -365 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$empty', endDate: '$turn', unit: 'day' } } ), null );
				assert.strictEqual( await refused( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'fortnight' } } ), true );
			} );

			it( 'should truncate to a unit with $dateTrunc', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'day' } } ),
					new Date( '2020-01-02T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'month' } } ),
					new Date( '2020-01-01T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'year' } } ),
					new Date( '2020-01-01T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'hour' } } ),
					new Date( '2020-01-02T03:00:00.000Z' ) );
				assert.strictEqual( await evaluated( { $dateTrunc: { date: '$empty', unit: 'day' } } ), null );
				assert.strictEqual( await refused( { $dateTrunc: { date: '$dt', unit: 'fortnight' } } ), true );
			} );

			it( 'should bin and start weeks where told to', async () =>
			{
				// ***binSize groups several units into one bin***, counted from a reference
				// point rather than from the date itself.
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'hour', binSize: 2 } } ),
					new Date( '2020-01-02T02:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'month', binSize: 6 } } ),
					new Date( '2020-01-01T00:00:00.000Z' ) );

				// A week is truncated to its start, and which day that is can be said.
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'week' } } ),
					new Date( '2019-12-29T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'week', startOfWeek: 'monday' } } ),
					new Date( '2019-12-30T00:00:00.000Z' ) );

				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'week' } } ), 52 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'week', startOfWeek: 'monday' } } ), 52 );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'The Edges of the Date Family', () =>
		{

			it( 'should pull a rolled over day back to the end of the month', async () =>
			{
				// ***The 31st of January plus one month is not the 2nd of March.*** The day is
				// pulled back to the last day the target month has.
				assert.deepStrictEqual(
					await evaluated( { $dateAdd: { startDate: new Date( '2020-01-31T00:00:00Z' ), unit: 'month', amount: 1 } } ),
					new Date( '2020-02-29T00:00:00.000Z' ) );
				assert.deepStrictEqual(
					await evaluated( { $dateAdd: { startDate: new Date( '2021-01-31T00:00:00Z' ), unit: 'month', amount: 1 } } ),
					new Date( '2021-02-28T00:00:00.000Z' ) );
				assert.deepStrictEqual(
					await evaluated( { $dateSubtract: { startDate: new Date( '2020-03-31T00:00:00Z' ), unit: 'month', amount: 1 } } ),
					new Date( '2020-02-29T00:00:00.000Z' ) );
				// A leap day one year on has the same treatment.
				assert.deepStrictEqual(
					await evaluated( { $dateAdd: { startDate: new Date( '2020-02-29T00:00:00Z' ), unit: 'year', amount: 1 } } ),
					new Date( '2021-02-28T00:00:00.000Z' ) );
			} );

			it( 'should write the specifiers nothing else has asked for', async () =>
			{
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%w' } } ), '5' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%U' } } ), '00' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%z' } } ), '+0000' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%Z' } } ), '0' );
				// The offset follows the zone, and is negative west of Greenwich.
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%z', timezone: 'America/New_York' } } ), '-0500' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%Z', timezone: 'America/New_York' } } ), '-300' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '%z', timezone: '+05:30' } } ), '+0530' );
				// A format with no specifiers at all is returned as it stands.
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: 'no specifiers' } } ), 'no specifiers' );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '' } } ), '' );
			} );

			it( 'should read a format back with every numeric specifier', async () =>
			{
				assert.deepStrictEqual(
					await evaluated( { $dateFromString: { dateString: '2020-01-02 03:04:05.678', format: '%Y-%m-%d %H:%M:%S.%L' } } ),
					new Date( '2020-01-02T03:04:05.678Z' ) );
				// A string which does not match the format is an error, not a partial reading.
				assert.strictEqual( await refused( { $dateFromString: { dateString: '02-01-2020', format: '%Y-%m-%d' } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020-01-02 extra', format: '%Y-%m-%d' } } ), true );
			} );

			it( 'should count the fixed length units by boundary too', async () =>
			{
				let midnight = new Date( '2020-01-02T00:00:00Z' );
				let just_before = new Date( '2020-01-01T23:59:59.999Z' );
				// ***One millisecond apart, and one day apart.***
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: just_before, endDate: midnight, unit: 'day' } } ), 1 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: just_before, endDate: midnight, unit: 'hour' } } ), 1 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: just_before, endDate: midnight, unit: 'minute' } } ), 1 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: just_before, endDate: midnight, unit: 'second' } } ), 1 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: just_before, endDate: midnight, unit: 'millisecond' } } ), 1 );
				// And zero when the two are the same instant.
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$dt', unit: 'day' } } ), 0 );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'quarter' } } ), 4 );
			} );

			it( 'should take a zone through the compound operators', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $dateToParts: { date: '$dt', timezone: 'America/New_York' } } ), {
					year: 2020, month: 1, day: 1,
					hour: 22, minute: 4, second: 5, millisecond: 678,
				} );
				// Truncating to a day in a zone is that zone's midnight, not UTC's.
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'day', timezone: 'America/New_York' } } ),
					new Date( '2020-01-01T05:00:00.000Z' ) );
			} );

			it( 'should refuse a bin size which is not one', async () =>
			{
				assert.strictEqual( await refused( { $dateTrunc: { date: '$dt', unit: 'hour', binSize: 0 } } ), true );
				assert.strictEqual( await refused( { $dateTrunc: { date: '$dt', unit: 'hour', binSize: -1 } } ), true );
				assert.strictEqual( await refused( { $dateTrunc: { date: '$dt', unit: 'hour', binSize: 1.5 } } ), true );
				assert.strictEqual( await refused( { $dateTrunc: { date: '$dt', unit: 'hour', binSize: 'two' } } ), true );
				assert.strictEqual( await refused( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'week', startOfWeek: 'caturday' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		// The compound operators take several arguments each, and a null in any of them makes
		// the whole result null rather than a date built from what was left.
		describe( 'Nulls Through the Compound Operators', () =>
		{

			it( 'should propagate a null unit or amount', async () =>
			{
				assert.strictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: '$empty', amount: 1 } } ), null );
				assert.strictEqual( await evaluated( { $dateAdd: { startDate: '$dt', unit: 'day', amount: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateSubtract: { startDate: '$dt', unit: '$empty', amount: 1 } } ), null );
				assert.strictEqual( await evaluated( { $dateSubtract: { startDate: '$dt', unit: 'day', amount: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$empty', unit: 'day' } } ), null );
				assert.strictEqual( await evaluated( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'hour', binSize: '$empty' } } ), null );
			} );

			it( 'should propagate a null format or zone', async () =>
			{
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', format: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateToString: { date: '$dt', timezone: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateFromParts: { year: 2020, timezone: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateFromString: { dateString: '2020-01-02', timezone: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $dateToParts: { date: '$dt', timezone: '$empty' } } ), null );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Arguments the Compound Operators Refuse', () =>
		{

			it( 'should refuse a call which is not a document of arguments', async () =>
			{
				assert.strictEqual( await refused( { $dateAdd: 5 } ), true );
				assert.strictEqual( await refused( { $dateDiff: 5 } ), true );
				assert.strictEqual( await refused( { $dateToString: 5 } ), true );
				assert.strictEqual( await refused( { $dateFromString: 5 } ), true );
				assert.strictEqual( await refused( { $dateFromParts: 5 } ), true );
			} );

			it( 'should refuse an argument it does not have', async () =>
			{
				assert.strictEqual( await refused( { $dateAdd: { startDate: '$dt', unit: 'day', amount: 1, extra: 1 } } ), true );
				assert.strictEqual( await refused( { $dateSubtract: { startDate: '$dt', unit: 'day', amount: 1, extra: 1 } } ), true );
				assert.strictEqual( await refused( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'day', extra: 1 } } ), true );
				assert.strictEqual( await refused( { $dateToString: { date: '$dt', extra: 1 } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020-01-02', extra: 1 } } ), true );
				assert.strictEqual( await refused( { $dateFromParts: { year: 2020, extra: 1 } } ), true );
			} );

			it( 'should refuse a required argument which is missing', async () =>
			{
				assert.strictEqual( await refused( { $dateSubtract: { startDate: '$dt', unit: 'day' } } ), true );
				assert.strictEqual( await refused( { $dateDiff: { startDate: '$dt', unit: 'day' } } ), true );
				assert.strictEqual( await refused( { $dateFromParts: {} } ), true );
				assert.strictEqual( await refused( { $dateToString: { format: '%Y' } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { format: '%Y' } } ), true );
			} );

			it( 'should refuse an argument of the wrong type', async () =>
			{
				assert.strictEqual( await refused( { $dateAdd: { startDate: '$dt', unit: 'day', amount: 'one' } } ), true );
				assert.strictEqual( await refused( { $dateSubtract: { startDate: '$dt', unit: 'day', amount: 'one' } } ), true );
				assert.strictEqual( await refused( { $dateToString: { date: '$dt', format: 5 } } ), true );
				assert.strictEqual( await refused( { $dateFromParts: { year: 'nope' } } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'More Zones, Bins, and Formats', () =>
		{

			it( 'should read an offset zone in either direction', async () =>
			{
				// A negative offset, which in January is what New York is.
				assert.strictEqual( await evaluated( { $hour: { date: '$dt', timezone: '-05:00' } } ), 22 );
				assert.strictEqual( await evaluated( { $hour: { date: '$dt', timezone: '-0500' } } ), 22 );
				// And an offset written without its minutes.
				assert.strictEqual( await evaluated( { $hour: { date: '$dt', timezone: '+05' } } ), 8 );
			} );

			it( 'should truncate to a quarter and to several weeks', async () =>
			{
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'quarter' } } ),
					new Date( '2020-01-01T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'quarter', binSize: 2 } } ),
					new Date( '2020-01-01T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'week', binSize: 2 } } ),
					new Date( '2019-12-22T00:00:00.000Z' ) );
				assert.deepStrictEqual( await evaluated( { $dateTrunc: { date: '$dt', unit: 'year', binSize: 5 } } ),
					new Date( '2020-01-01T00:00:00.000Z' ) );
			} );

			it( 'should refuse a string which does not match its format', async () =>
			{
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020|01|02', format: '%Y-%m-%d' } } ), true );
				// ***Not every specifier can be read back.*** A week number describes a date
				// rather than locating one.
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020-01-02', format: '%Y-%m-%V' } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: 'xx-01-02', format: '%Y-%m-%d' } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020' } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: 5 } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020-01-02', format: 5 } } ), true );
				assert.strictEqual( await refused( { $dateDiff: { startDate: '$dt', endDate: '$turn', unit: 'week', startOfWeek: 5 } } ), true );
			} );

			it( 'should read a literal percent and default the ISO parts', async () =>
			{
				// A literal percent is written twice in a reading format as in a writing one.
				assert.deepStrictEqual( await evaluated( { $dateFromString: { dateString: '2020-01-02%', format: '%Y-%m-%d%%' } } ),
					new Date( '2020-01-02T00:00:00.000Z' ) );

				// ***A reading format must locate a whole date.*** MongoDB refuses one which
				// leaves an element out rather than defaulting it, so there is no reading of
				// a day with no month or year to put it in.
				assert.strictEqual( await refused( { $dateFromString: { dateString: '02', format: '%d' } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020', format: '%Y' } } ), true );
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020-01', format: '%Y-%m' } } ), true );
				// And the percent has to actually be there.
				assert.strictEqual( await refused( { $dateFromString: { dateString: '2020-01-02x', format: '%Y-%m-%d%%' } } ), true );

				// ***An ISO week year on its own is the Monday of its first week***, which for
				// 2020 falls in December of 2019.
				assert.deepStrictEqual( await evaluated( { $dateFromParts: { isoWeekYear: 2020 } } ),
					new Date( '2019-12-30T00:00:00.000Z' ) );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'What a Date Operand May Be', () =>
		{

			it( 'should refuse an operand which is not a date', async () =>
			{
				assert.strictEqual( await refused( { $year: '$text' } ), true );
				assert.strictEqual( await refused( { $hour: true } ), true );
				// ***A number is not a date here***, even though $toDate reads one as
				// milliseconds. These operators take a date, and nothing is converted for them.
				assert.strictEqual( await refused( { $year: '$number' } ), true );
			} );

			it( 'should refuse a malformed object form', async () =>
			{
				assert.strictEqual( await refused( { $year: { timezone: 'UTC' } } ), true );
				assert.strictEqual( await refused( { $year: { date: '$dt', zone: 'UTC' } } ), true );
				assert.strictEqual( await refused( { $year: { date: '$dt', timezone: 'Mars/Olympus' } } ), true );
				assert.strictEqual( await refused( { $year: { date: '$dt', timezone: 5 } } ), true );
			} );

			it( 'should propagate a null through the object form', async () =>
			{
				assert.strictEqual( await evaluated( { $year: { date: '$empty' } } ), null );
				assert.strictEqual( await evaluated( { $year: { date: '$missing' } } ), null );
				// ***A null timezone is not the same as no timezone.***
				assert.strictEqual( await evaluated( { $year: { date: '$dt', timezone: null } } ), null );
			} );

		} );

	} );

};
