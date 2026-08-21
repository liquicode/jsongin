'use strict';
/*md

## Operators > Expression > $week

Usage: `$week: expression`
  or `$week: { date: expression, timezone: string }`

The week of the year, from 0 to 53. ***Weeks begin on Sunday, and the days before the first Sunday of the year are week 0.*** See [$isoWeek](#$isoWeek) for the ISO 8601 reckoning, which differs.

***The date is read in UTC*** unless a `timezone` is given, which may be an IANA zone name
  such as `'America/New_York'` or an offset such as `'+05:30'`.

A null or missing date makes the result null, and so does a `timezone` which is null.
An operand which is not a date throws; a number is not converted for it.

*/

module.exports = function ( jsongin )
{

	const date = require( './_date' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let read = date.ReadDateArgs( Document, Args, '$week', [], Scope );
				if ( read === null ) { return null; }

				let shifted = date.ZoneShifted( read.Date, read.Zone, '$week' );
				return ( date.WeekNumber( shifted, 0 ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$week: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
