'use strict';
/*md

## Operators > Expression > $dayOfMonth

Usage: `$dayOfMonth: expression`
  or `$dayOfMonth: { date: expression, timezone: string }`

The day of the month of a date, from 1 to 31.

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
				let read = date.ReadDateArgs( Document, Args, '$dayOfMonth', [], Scope );
				if ( read === null ) { return null; }

				let shifted = date.ZoneShifted( read.Date, read.Zone, '$dayOfMonth' );
				return ( shifted.getUTCDate() );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dayOfMonth: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
