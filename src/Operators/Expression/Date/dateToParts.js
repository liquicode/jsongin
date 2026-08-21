'use strict';
/*md

## Operators > Expression > $dateToParts

Usage: `$dateToParts: { date: expression, timezone: string, iso8601: boolean }`

Returns a document holding the individual parts of a date.

***The ISO form answers with different fields***, not merely different values: an ISO 8601 week
  date has a week year, a week, and a day of the week, and no month or day of the month at all.

```
{ iso8601: false }   year, month, day, hour, minute, second, millisecond
{ iso8601: true }    isoWeekYear, isoWeek, isoDayOfWeek, hour, minute, second, millisecond
```

*/

module.exports = function ( jsongin )
{

	const date = require( './_date' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				let read = date.ReadDateArgs( Document, Args, '$dateToParts', [ 'iso8601' ], Scope );
				if ( read === null ) { return null; }

				let shifted = date.ZoneShifted( read.Date, read.Zone, '$dateToParts' );

				let iso = false;
				if ( ( jsongin.ShortType( Args ) === 'o' ) && ( 'iso8601' in Args ) )
				{
					iso = ( jsongin.Evaluate( Document, Args.iso8601, Scope ) === true );
				}

				if ( iso )
				{
					let parts = date.IsoWeekParts( shifted );
					return {
						isoWeekYear: parts.Year,
						isoWeek: parts.Week,
						isoDayOfWeek: parts.Day,
						hour: shifted.getUTCHours(),
						minute: shifted.getUTCMinutes(),
						second: shifted.getUTCSeconds(),
						millisecond: shifted.getUTCMilliseconds(),
					};
				}

				return {
					year: shifted.getUTCFullYear(),
					month: shifted.getUTCMonth() + 1,
					day: shifted.getUTCDate(),
					hour: shifted.getUTCHours(),
					minute: shifted.getUTCMinutes(),
					second: shifted.getUTCSeconds(),
					millisecond: shifted.getUTCMilliseconds(),
				};
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateToParts: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
