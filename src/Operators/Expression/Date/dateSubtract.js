'use strict';
/*md

## Operators > Expression > $dateSubtract

Usage: `$dateSubtract: { startDate: expression, unit: string, amount: number, timezone: string }`

Subtracts a number of time units from a date.

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
		Evaluate: function ( Document, Args )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'o' )
				{
					throw new Error( `$dateSubtract: requires a document of arguments.` );
				}
				if ( !( 'startDate' in Args ) || !( 'unit' in Args ) || !( 'amount' in Args ) )
				{
					throw new Error( `$dateSubtract: requires a startDate, a unit, and an amount.` );
				}

				let allowed = [ 'startDate', 'unit', 'amount', 'timezone' ];
				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( !allowed.includes( keys[ index ] ) )
					{
						throw new Error( `$dateSubtract: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}

				let read = date.ReadDateArgs( Document, { date: Args.startDate, timezone: Args.timezone }, '$dateSubtract' );
				if ( read === null ) { return null; }

				let unit = date.ReadUnit( Document, Args.unit, '$dateSubtract' );
				if ( unit === null ) { return null; }

				let amount = jsongin.Evaluate( Document, Args.amount );
				let short_type = jsongin.ShortType( amount );
				if ( 'lu'.includes( short_type ) ) { return null; }
				if ( short_type !== 'n' )
				{
					throw new Error( `$dateSubtract: requires a numeric amount but found a [${short_type}] instead.` );
				}

				return date.AddUnits( read.Date, unit, amount * -1, read.Zone, '$dateSubtract' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateSubtract: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
