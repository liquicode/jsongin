'use strict';
/*md

## Operators > Expression > $dateAdd

Usage: `$dateAdd: { startDate: expression, unit: string, amount: number, timezone: string }`

Adds a number of time units to a date.

A `unit` is one of `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second`, or
  `millisecond`. Anything else throws.

***The calendar units are added to the calendar, not as a length of time***, because a month is
  not a fixed number of milliseconds. A day of the month which the target month does not have
  is pulled back to the last day it does, so the 31st of January plus one month is the 28th or
  29th of February rather than the 2nd of March.

A null in the date, the unit, or the amount makes the result null.

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
				if ( jsongin.ShortType( Args ) !== 'o' )
				{
					throw new Error( `$dateAdd: requires a document of arguments.` );
				}
				if ( !( 'startDate' in Args ) || !( 'unit' in Args ) || !( 'amount' in Args ) )
				{
					throw new Error( `$dateAdd: requires a startDate, a unit, and an amount.` );
				}

				let allowed = [ 'startDate', 'unit', 'amount', 'timezone' ];
				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( !allowed.includes( keys[ index ] ) )
					{
						throw new Error( `$dateAdd: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}

				let read = date.ReadDateArgs( Document, { date: Args.startDate, timezone: Args.timezone }, '$dateAdd', [], Scope );
				if ( read === null ) { return null; }

				let unit = date.ReadUnit( Document, Args.unit, '$dateAdd', Scope );
				if ( unit === null ) { return null; }

				let amount = jsongin.Evaluate( Document, Args.amount, Scope );
				let short_type = jsongin.ShortType( amount );
				if ( 'lu'.includes( short_type ) ) { return null; }
				if ( short_type !== 'n' )
				{
					throw new Error( `$dateAdd: requires a numeric amount but found a [${short_type}] instead.` );
				}

				return date.AddUnits( read.Date, unit, amount * 1, read.Zone, '$dateAdd' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateAdd: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
