'use strict';
/*md

## Operators > Expression > $dateFromParts

Usage: `$dateFromParts: { year, month, day, hour, minute, second, millisecond, timezone }`
  or `$dateFromParts: { isoWeekYear, isoWeek, isoDayOfWeek, hour, minute, second, millisecond, timezone }`

Constructs a date from its individual parts.
A part which is left out defaults to the start of its range, so `{ year: 2020 }` is the first
  moment of 2020.

***A part outside its range rolls over*** rather than being refused: month 13 of 2020 is
  January of 2021. This is Javascript's own behavior and MongoDB's alike.

A `timezone` says which zone the parts are written in, so the same parts name different
  instants in different zones. Without one they are read as UTC.

Either `year` or `isoWeekYear` must be given, and the two forms cannot be mixed.

*/

module.exports = function ( jsongin )
{

	const date = require( './_date' )( jsongin );

	const CALENDAR_FIELDS = [ 'year', 'month', 'day' ];
	const ISO_FIELDS = [ 'isoWeekYear', 'isoWeek', 'isoDayOfWeek' ];
	const TIME_FIELDS = [ 'hour', 'minute', 'second', 'millisecond' ];

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
					throw new Error( `$dateFromParts: requires a document of parts.` );
				}

				let allowed = CALENDAR_FIELDS.concat( ISO_FIELDS ).concat( TIME_FIELDS ).concat( [ 'timezone' ] );
				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( !allowed.includes( keys[ index ] ) )
					{
						throw new Error( `$dateFromParts: [${keys[ index ]}] is not a part of a date.` );
					}
				}

				let is_iso = ( 'isoWeekYear' in Args );
				if ( !is_iso && !( 'year' in Args ) )
				{
					throw new Error( `$dateFromParts: requires either a year or an isoWeekYear.` );
				}

				let zone = date.ReadZone( Document, Args.timezone, '$dateFromParts' );
				if ( zone === null ) { return null; }

				// Every part is evaluated before any is used, so that a null anywhere makes
				// the whole result null rather than half a date.
				let parts = {};
				let names = ( is_iso ? ISO_FIELDS : CALENDAR_FIELDS ).concat( TIME_FIELDS );
				for ( let index = 0; index < names.length; index++ )
				{
					let name = names[ index ];
					if ( !( name in Args ) ) { continue; }

					let value = jsongin.Evaluate( Document, Args[ name ] );
					let short_type = jsongin.ShortType( value );
					if ( 'lu'.includes( short_type ) ) { return null; }
					if ( short_type !== 'n' )
					{
						throw new Error( `$dateFromParts: requires a number for [${name}] but found a [${short_type}] instead.` );
					}
					parts[ name ] = value;
				}

				let hour = parts.hour || 0;
				let minute = parts.minute || 0;
				let second = parts.second || 0;
				let millisecond = parts.millisecond || 0;

				let wall = 0;
				if ( is_iso )
				{
					// The Monday of ISO week 1 is found from the 4th of January, which every
					// ISO week 1 contains by definition.
					let fourth = new Date( Date.UTC( parts.isoWeekYear, 0, 4 ) );
					let first_monday = new Date( Date.UTC( parts.isoWeekYear, 0, 4 ) );
					first_monday.setUTCDate( fourth.getUTCDate() - ( ( fourth.getUTCDay() + 6 ) % 7 ) );

					let week = ( 'isoWeek' in parts ) ? parts.isoWeek : 1;
					let day = ( 'isoDayOfWeek' in parts ) ? parts.isoDayOfWeek : 1;
					first_monday.setUTCDate( first_monday.getUTCDate() + ( ( week - 1 ) * 7 ) + ( day - 1 ) );

					wall = Date.UTC( first_monday.getUTCFullYear(), first_monday.getUTCMonth(), first_monday.getUTCDate(),
						hour, minute, second, millisecond );
				}
				else
				{
					let month = ( 'month' in parts ) ? parts.month : 1;
					let day = ( 'day' in parts ) ? parts.day : 1;
					wall = Date.UTC( parts.year, month - 1, day, hour, minute, second, millisecond );
				}

				return date.FromZoneWallClock( wall, zone, '$dateFromParts' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateFromParts: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
