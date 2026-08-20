'use strict';
/*md

## Operators > Expression > $dateDiff

Usage: `$dateDiff: { startDate: expression, endDate: expression, unit: string, timezone: string, startOfWeek: string }`

The difference between two dates, in a given time unit.

***This counts boundaries crossed, not elapsed time.*** One second before midnight to one
  second after is one day, and two dates eleven months apart can be one year apart. That is
  what makes `$dateDiff` useful for grouping and surprising for measuring.

An end date before the start date gives a negative answer.
`startOfWeek` names the day a week begins on when the unit is `week`, and defaults to Sunday.

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
					throw new Error( `$dateDiff: requires a document of arguments.` );
				}
				if ( !( 'startDate' in Args ) || !( 'endDate' in Args ) || !( 'unit' in Args ) )
				{
					throw new Error( `$dateDiff: requires a startDate, an endDate, and a unit.` );
				}

				let allowed = [ 'startDate', 'endDate', 'unit', 'timezone', 'startOfWeek' ];
				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( !allowed.includes( keys[ index ] ) )
					{
						throw new Error( `$dateDiff: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}

				let start = date.ReadDateArgs( Document, { date: Args.startDate, timezone: Args.timezone }, '$dateDiff' );
				if ( start === null ) { return null; }

				let end = date.ReadDateArgs( Document, { date: Args.endDate, timezone: Args.timezone }, '$dateDiff' );
				if ( end === null ) { return null; }

				let unit = date.ReadUnit( Document, Args.unit, '$dateDiff' );
				if ( unit === null ) { return null; }

				let start_day = date.ReadStartOfWeek( Document, Args.startOfWeek, '$dateDiff' );

				return date.Difference( start.Date, end.Date, unit, start.Zone, start_day, '$dateDiff' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateDiff: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
