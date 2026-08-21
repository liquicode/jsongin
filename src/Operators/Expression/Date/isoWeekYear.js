'use strict';
/*md

## Operators > Expression > $isoWeekYear

Usage: `$isoWeekYear: expression`
  or `$isoWeekYear: { date: expression, timezone: string }`

The ISO 8601 year a date's week belongs to. ***This is not always the calendar year***: ISO 8601 puts a week entirely in the year holding its Thursday, so 2021-01-01 belongs to 2020.

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
				let read = date.ReadDateArgs( Document, Args, '$isoWeekYear', [], Scope );
				if ( read === null ) { return null; }

				let shifted = date.ZoneShifted( read.Date, read.Zone, '$isoWeekYear' );
				return ( date.IsoWeekParts( shifted ).Year );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$isoWeekYear: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
