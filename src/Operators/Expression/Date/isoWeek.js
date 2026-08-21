'use strict';
/*md

## Operators > Expression > $isoWeek

Usage: `$isoWeek: expression`
  or `$isoWeek: { date: expression, timezone: string }`

The ISO 8601 week of the year, from 1 to 53. Week 1 is the week holding the year's first Thursday, so 2021-01-01 falls in week 53 of 2020.

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
				let read = date.ReadDateArgs( Document, Args, '$isoWeek', [], Scope );
				if ( read === null ) { return null; }

				let shifted = date.ZoneShifted( read.Date, read.Zone, '$isoWeek' );
				return ( date.IsoWeekParts( shifted ).Week );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$isoWeek: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
