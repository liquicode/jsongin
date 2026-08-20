'use strict';
/*md

## Operators > Expression > $dateTrunc

Usage: `$dateTrunc: { date: expression, unit: string, binSize: number, timezone: string, startOfWeek: string }`

Truncates a date to the start of the unit it falls in.

`binSize` groups several units into one bin, so `{ unit: 'hour', binSize: 2 }` truncates to
  even hours. ***The bins are counted from a fixed reference instant***, not from the date
  itself, so every date in a collection falls into the same bins and can be grouped by them.

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
				if ( ( jsongin.ShortType( Args ) !== 'o' ) || !( 'date' in Args ) || !( 'unit' in Args ) )
				{
					throw new Error( `$dateTrunc: requires a date and a unit.` );
				}

				let read = date.ReadDateArgs( Document, Args, '$dateTrunc', [ 'unit', 'binSize', 'startOfWeek' ] );
				if ( read === null ) { return null; }

				let unit = date.ReadUnit( Document, Args.unit, '$dateTrunc' );
				if ( unit === null ) { return null; }

				let bin_size = undefined;
				if ( 'binSize' in Args )
				{
					bin_size = jsongin.Evaluate( Document, Args.binSize );
					let short_type = jsongin.ShortType( bin_size );
					if ( 'lu'.includes( short_type ) ) { return null; }
					if ( ( short_type !== 'n' ) || !Number.isInteger( bin_size ) || ( bin_size < 1 ) )
					{
						throw new Error( `$dateTrunc: requires a whole bin size of one or more but found ${JSON.stringify( bin_size )}.` );
					}
				}

				let start_day = date.ReadStartOfWeek( Document, Args.startOfWeek, '$dateTrunc' );

				return date.Truncate( read.Date, unit, bin_size, read.Zone, start_day, '$dateTrunc' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateTrunc: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
