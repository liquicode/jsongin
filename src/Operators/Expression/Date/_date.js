'use strict';

/*
	Shared date handling for the expression date operators.
	This is a helper module, not an operator.

	***Every operator here reads a date in UTC unless it is given a time zone.***
	That is the single most important thing in this file. Javascript's getFullYear() and its
	relatives read a date in the ***machine's*** zone, so an engine built on them would answer
	differently on a laptop in New York than on a server in London, for the same stored
	document. Nothing below calls them: dates are shifted into the requested zone first and
	then read with the getUTC* family, which has no opinion about where the code is running.

	A zone is either an IANA name, read through Intl, or an offset such as '+05:30', parsed
	here. Intl is a language feature rather than a Node built-in, so this still bundles for the
	browser - the same constraint which kept Buffer out of the string operators.

	Every rule here was established against MongoDB 6.0.1 first. See
	test/Parity Tests/Aggregate Tests/test-suite/Date Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	helper.Operands = arithmetic.Operands;

	const MILLISECONDS_PER_DAY = 86400000;

	// The units the arithmetic operators accept, and how many milliseconds each is worth.
	// The calendar units - year, quarter, month - have no fixed length and are marked null,
	// which is what decides whether an operator counts milliseconds or calendar boxes.
	const UNIT_MILLISECONDS =
	{
		year: null,
		quarter: null,
		month: null,
		week: 7 * MILLISECONDS_PER_DAY,
		day: MILLISECONDS_PER_DAY,
		hour: 3600000,
		minute: 60000,
		second: 1000,
		millisecond: 1,
	};

	const WEEKDAY_NAMES = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ];

	// MongoDB bins a truncated date from this instant rather than from the date itself.
	const BIN_REFERENCE = Date.UTC( 2000, 0, 1 );


	//---------------------------------------------------------------------
	// The offset of a zone, in minutes east of UTC, at a given instant.
	//
	// An offset has to be asked for at an instant rather than once, because a named zone
	// changes its offset across a daylight saving boundary.
	helper.OffsetMinutes = function ( Instant, Zone, OperatorName )
	{
		// A zone written as an offset says what it is and needs no lookup.
		let offset = /^([+-])(\d{2}):?(\d{2})?$/.exec( Zone );
		if ( offset )
		{
			let minutes = ( Number( offset[ 2 ] ) * 60 ) + Number( offset[ 3 ] || 0 );
			return ( offset[ 1 ] === '-' ) ? -minutes : minutes;
		}

		let formatter = null;
		try
		{
			formatter = new Intl.DateTimeFormat( 'en-US', {
				timeZone: Zone,
				hourCycle: 'h23',
				year: 'numeric', month: '2-digit', day: '2-digit',
				hour: '2-digit', minute: '2-digit', second: '2-digit',
			} );
		}
		catch ( error )
		{
			throw new Error( `${OperatorName}: [${Zone}] is not a recognized time zone.` );
		}

		// Read the wall clock in that zone, then treat those numbers as though they were UTC.
		// The difference between that and the instant itself is the offset.
		let parts = {};
		let formatted = formatter.formatToParts( Instant );
		for ( let index = 0; index < formatted.length; index++ )
		{
			parts[ formatted[ index ].type ] = formatted[ index ].value;
		}

		let as_utc = Date.UTC(
			Number( parts.year ), Number( parts.month ) - 1, Number( parts.day ),
			Number( parts.hour ), Number( parts.minute ), Number( parts.second ) );

		// The instant's own milliseconds are dropped from both sides: no zone offset has ever
		// been a fraction of a second, and Intl does not report one.
		let whole_seconds = Instant.getTime() - Instant.getMilliseconds();
		return Math.round( ( as_utc - whole_seconds ) / 60000 );
	};


	//---------------------------------------------------------------------
	// Returns a Date whose getUTC* readings are the wall clock of the given zone.
	//
	// ***This is the trick the whole file rests on.*** Shifting the instant by the zone's
	// offset means every part can be read with getUTCFullYear() and its relatives, which
	// behave the same everywhere, instead of with the local getters, which do not.
	// The result is not the instant any more and must never be handed back to a caller.
	helper.ZoneShifted = function ( Instant, Zone, OperatorName )
	{
		if ( !Zone ) { return Instant; }
		return new Date( Instant.getTime() + ( helper.OffsetMinutes( Instant, Zone, OperatorName ) * 60000 ) );
	};


	//---------------------------------------------------------------------
	// The reverse: given a wall clock reading in a zone, the instant it names.
	//
	// The offset is looked up twice because the first lookup has to guess at the instant. A
	// wall clock time near a daylight saving change belongs to a different offset than the
	// one in force at the same numbers read as UTC.
	helper.FromZoneWallClock = function ( WallMilliseconds, Zone, OperatorName )
	{
		if ( !Zone ) { return new Date( WallMilliseconds ); }

		let first = helper.OffsetMinutes( new Date( WallMilliseconds ), Zone, OperatorName );
		let guess = WallMilliseconds - ( first * 60000 );
		let second = helper.OffsetMinutes( new Date( guess ), Zone, OperatorName );
		return new Date( WallMilliseconds - ( second * 60000 ) );
	};


	//---------------------------------------------------------------------
	// Reads the arguments of a part operator, which take either a date expression on its own
	// or a document of { date, timezone }.
	//
	// Returns null when the date or the zone is null or missing, which every caller
	// propagates. ***A null timezone is not the same as no timezone***: leaving it out means
	// UTC, and writing null makes the whole result null.
	helper.ReadDateArgs = function ( Document, Args, OperatorName, ExtraFields, Scope )
	{
		jsongin.Scope.Require( Scope, 'date.ReadDateArgs' );

		let date_expression = Args;
		let zone_expression = undefined;

		// A document naming a `date` is the object form. Any other document is an expression
		// which happens to evaluate to a date, or a malformed call.
		if ( ( jsongin.ShortType( Args ) === 'o' ) && ( 'date' in Args ) )
		{
			let allowed = [ 'date', 'timezone' ].concat( ExtraFields || [] );
			let keys = Object.keys( Args );
			for ( let index = 0; index < keys.length; index++ )
			{
				if ( !allowed.includes( keys[ index ] ) )
				{
					throw new Error( `${OperatorName}: [${keys[ index ]}] is not an argument of this operator.` );
				}
			}
			date_expression = Args.date;
			zone_expression = Args.timezone;
		}
		else if ( jsongin.ShortType( Args ) === 'o' )
		{
			throw new Error( `${OperatorName}: requires a date, or a document naming one.` );
		}

		let value = jsongin.Evaluate( Document, date_expression, Scope );
		let zone = helper.ReadZone( Document, zone_expression, OperatorName, Scope );
		if ( zone === null ) { return null; }

		let short_type = jsongin.ShortType( value );
		if ( 'lu'.includes( short_type ) ) { return null; }
		if ( short_type !== 'd' )
		{
			throw new Error( `${OperatorName}: requires a date but found a [${short_type}] instead.` );
		}

		return { Date: value, Zone: zone };
	};


	//---------------------------------------------------------------------
	// Evaluates a timezone argument.
	// Returns undefined when none was given, which means UTC, and null when one was given and
	// evaluated to null, which makes the whole result null.
	helper.ReadZone = function ( Document, ZoneExpression, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'date.ReadZone' );

		if ( typeof ZoneExpression === 'undefined' ) { return undefined; }

		let zone = jsongin.Evaluate( Document, ZoneExpression, Scope );
		let short_type = jsongin.ShortType( zone );
		if ( 'lu'.includes( short_type ) ) { return null; }
		if ( short_type !== 's' )
		{
			throw new Error( `${OperatorName}: requires a time zone name but found a [${short_type}] instead.` );
		}

		// Asked here so that a bad zone is refused even by an operator which never shifts.
		helper.OffsetMinutes( new Date(), zone, OperatorName );
		return zone;
	};


	//---------------------------------------------------------------------
	// The day of the year, from 1.
	helper.DayOfYear = function ( Shifted )
	{
		let first = Date.UTC( Shifted.getUTCFullYear(), 0, 1 );
		let today = Date.UTC( Shifted.getUTCFullYear(), Shifted.getUTCMonth(), Shifted.getUTCDate() );
		return Math.round( ( today - first ) / MILLISECONDS_PER_DAY ) + 1;
	};


	//---------------------------------------------------------------------
	// The week of the year, from 0.
	//
	// ***Weeks begin on Sunday and the days before the first Sunday are week 0.*** A year
	// which opens on a Sunday therefore has no week 0 at all.
	helper.WeekNumber = function ( Shifted, StartDay )
	{
		let first_weekday = new Date( Date.UTC( Shifted.getUTCFullYear(), 0, 1 ) ).getUTCDay();
		let offset = ( first_weekday - ( StartDay || 0 ) + 7 ) % 7;
		return Math.floor( ( helper.DayOfYear( Shifted ) - 1 + offset ) / 7 );
	};


	//---------------------------------------------------------------------
	// The ISO 8601 week date: its year, its week, and its day.
	//
	// ***The ISO year is not always the calendar year.*** ISO 8601 puts a week entirely in the
	// year holding its Thursday, so the first days of January can belong to the week year
	// before: 2021-01-01 is a Friday in week 53 of 2020. That is the whole reason
	// $isoWeekYear exists as an operator separate from $year.
	helper.IsoWeekParts = function ( Shifted )
	{
		// Monday is 0 here, which is what the arithmetic below wants.
		let day_number = ( Shifted.getUTCDay() + 6 ) % 7;

		// The Thursday of this date's week decides which year the week belongs to.
		let thursday = new Date( Date.UTC( Shifted.getUTCFullYear(), Shifted.getUTCMonth(), Shifted.getUTCDate() ) );
		thursday.setUTCDate( thursday.getUTCDate() - day_number + 3 );
		let iso_year = thursday.getUTCFullYear();

		// Week 1 is the week holding the 4th of January, by the same rule.
		let first_thursday = new Date( Date.UTC( iso_year, 0, 4 ) );
		first_thursday.setUTCDate( first_thursday.getUTCDate() - ( ( first_thursday.getUTCDay() + 6 ) % 7 ) + 3 );

		let week = 1 + Math.round( ( thursday.getTime() - first_thursday.getTime() ) / ( 7 * MILLISECONDS_PER_DAY ) );
		return { Year: iso_year, Week: week, Day: day_number + 1 };
	};


	//---------------------------------------------------------------------
	// Answers the unit named, or throws when it is not one.
	helper.ReadUnit = function ( Document, UnitExpression, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'date.ReadUnit' );

		let unit = jsongin.Evaluate( Document, UnitExpression, Scope );
		let short_type = jsongin.ShortType( unit );
		if ( 'lu'.includes( short_type ) ) { return null; }
		if ( ( short_type !== 's' ) || !( unit in UNIT_MILLISECONDS ) )
		{
			throw new Error( `${OperatorName}: [${JSON.stringify( unit )}] is not a time unit.` );
		}
		return unit;
	};


	//---------------------------------------------------------------------
	// Answers the day a week starts on, as a number with Sunday at 0.
	helper.ReadStartOfWeek = function ( Document, StartExpression, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'date.ReadStartOfWeek' );

		if ( typeof StartExpression === 'undefined' ) { return 0; }

		let name = jsongin.Evaluate( Document, StartExpression, Scope );
		if ( jsongin.ShortType( name ) !== 's' )
		{
			throw new Error( `${OperatorName}: requires a day name but found a [${jsongin.ShortType( name )}] instead.` );
		}
		let index = WEEKDAY_NAMES.indexOf( name.toLowerCase() );
		if ( index < 0 )
		{
			throw new Error( `${OperatorName}: [${name}] is not a day of the week.` );
		}
		return index;
	};


	//---------------------------------------------------------------------
	// Adds a number of units to a date.
	//
	// The calendar units are added to the calendar parts rather than as a length of time,
	// because a month is not a fixed number of milliseconds. A day of the month which the
	// target month does not have is pulled back to the last day it does, so the 31st of
	// January plus one month is the 28th or 29th of February rather than the 2nd of March.
	helper.AddUnits = function ( Instant, Unit, Amount, Zone, OperatorName )
	{
		let fixed = UNIT_MILLISECONDS[ Unit ];
		if ( fixed !== null ) { return new Date( Instant.getTime() + ( Amount * fixed ) ); }

		let shifted = helper.ZoneShifted( Instant, Zone, OperatorName );

		let months = 0;
		if ( Unit === 'year' ) { months = Amount * 12; }
		else if ( Unit === 'quarter' ) { months = Amount * 3; }
		else { months = Amount; }

		let year = shifted.getUTCFullYear();
		let month = shifted.getUTCMonth() + months;
		let day = shifted.getUTCDate();

		// The last day of the target month, found by asking for day zero of the one after it.
		let last_day = new Date( Date.UTC( year, month + 1, 0 ) ).getUTCDate();
		if ( day > last_day ) { day = last_day; }

		let wall = Date.UTC( year, month, day,
			shifted.getUTCHours(), shifted.getUTCMinutes(), shifted.getUTCSeconds(), shifted.getUTCMilliseconds() );

		return helper.FromZoneWallClock( wall, Zone, OperatorName );
	};


	//---------------------------------------------------------------------
	// The number of unit boundaries crossed between two dates.
	//
	// ***This counts boundaries, not elapsed time.*** One second before midnight to one second
	// after is one day, and two dates eleven months apart can be one year apart. That is
	// MongoDB's rule and it is what makes $dateDiff useful for grouping.
	helper.Difference = function ( Start, End, Unit, Zone, StartDay, OperatorName )
	{
		let start = helper.ZoneShifted( Start, Zone, OperatorName );
		let end = helper.ZoneShifted( End, Zone, OperatorName );

		if ( Unit === 'year' ) { return end.getUTCFullYear() - start.getUTCFullYear(); }
		if ( Unit === 'quarter' )
		{
			return ( ( end.getUTCFullYear() * 4 ) + Math.floor( end.getUTCMonth() / 3 ) )
				- ( ( start.getUTCFullYear() * 4 ) + Math.floor( start.getUTCMonth() / 3 ) );
		}
		if ( Unit === 'month' )
		{
			return ( ( end.getUTCFullYear() * 12 ) + end.getUTCMonth() )
				- ( ( start.getUTCFullYear() * 12 ) + start.getUTCMonth() );
		}
		if ( Unit === 'week' )
		{
			return helper.WeekIndex( end, StartDay ) - helper.WeekIndex( start, StartDay );
		}

		let fixed = UNIT_MILLISECONDS[ Unit ];
		return Math.floor( end.getTime() / fixed ) - Math.floor( start.getTime() / fixed );
	};


	//---------------------------------------------------------------------
	// Which week a date falls in, counted from the epoch, so that two of these subtract to a
	// number of weeks. The 1st of January 1970 was a Thursday, which is where the 4 comes from.
	helper.WeekIndex = function ( Shifted, StartDay )
	{
		let days = Math.floor( Shifted.getTime() / MILLISECONDS_PER_DAY );
		return Math.floor( ( days + 4 - ( StartDay || 0 ) ) / 7 );
	};


	//---------------------------------------------------------------------
	// Truncates a date to the start of the unit it falls in.
	//
	// A bin size groups several units together, counted from a fixed reference instant rather
	// than from the date itself, so that every date in a collection falls in the same bins.
	helper.Truncate = function ( Instant, Unit, BinSize, Zone, StartDay, OperatorName )
	{
		let size = ( typeof BinSize === 'undefined' ) ? 1 : BinSize;
		let shifted = helper.ZoneShifted( Instant, Zone, OperatorName );

		if ( ( Unit === 'year' ) || ( Unit === 'quarter' ) || ( Unit === 'month' ) )
		{
			let months_per_bin = size;
			if ( Unit === 'year' ) { months_per_bin = size * 12; }
			else if ( Unit === 'quarter' ) { months_per_bin = size * 3; }

			let reference = new Date( BIN_REFERENCE );
			let months = ( ( shifted.getUTCFullYear() - reference.getUTCFullYear() ) * 12 )
				+ ( shifted.getUTCMonth() - reference.getUTCMonth() );
			let binned = Math.floor( months / months_per_bin ) * months_per_bin;

			let wall = Date.UTC( reference.getUTCFullYear(), reference.getUTCMonth() + binned, 1 );
			return helper.FromZoneWallClock( wall, Zone, OperatorName );
		}

		if ( Unit === 'week' )
		{
			// A week is truncated to the start day rather than to a bin of milliseconds,
			// because the epoch did not begin on a Sunday.
			let days = Math.floor( shifted.getTime() / MILLISECONDS_PER_DAY );
			let weekday = ( days + 4 ) % 7;
			let back = ( weekday - ( StartDay || 0 ) + 7 ) % 7;
			let wall = ( days - back ) * MILLISECONDS_PER_DAY;
			if ( size !== 1 )
			{
				let index = helper.WeekIndex( shifted, StartDay );
				let binned = Math.floor( index / size ) * size;
				wall = wall - ( ( index - binned ) * 7 * MILLISECONDS_PER_DAY );
			}
			return helper.FromZoneWallClock( wall, Zone, OperatorName );
		}

		let fixed = UNIT_MILLISECONDS[ Unit ] * size;
		let since = shifted.getTime() - BIN_REFERENCE;
		let wall = BIN_REFERENCE + ( Math.floor( since / fixed ) * fixed );
		return helper.FromZoneWallClock( wall, Zone, OperatorName );
	};


	//---------------------------------------------------------------------
	// Pads a number to a width with leading zeroes.
	// Every value which reaches here is a date field or an absolute offset, so none of them is
	// ever negative and there is no sign to carry.
	function padded( Value, Width )
	{
		let text = String( Value );
		while ( text.length < Width ) { text = '0' + text; }
		return text;
	}


	//---------------------------------------------------------------------
	// The format specifiers, and how wide each field is written.
	// Every one is padded to its width, which is why the second of January is written 02.
	const SPECIFIERS =
	{
		Y: { Width: 4 }, m: { Width: 2 }, d: { Width: 2 },
		H: { Width: 2 }, M: { Width: 2 }, S: { Width: 2 }, L: { Width: 3 },
		j: { Width: 3 }, w: { Width: 1 }, U: { Width: 2 },
		G: { Width: 4 }, V: { Width: 2 }, u: { Width: 1 },
		z: { Width: 0 }, Z: { Width: 0 },
	};

	helper.DEFAULT_FORMAT = '%Y-%m-%dT%H:%M:%S.%LZ';


	//---------------------------------------------------------------------
	// The value of one specifier for a date already shifted into its zone.
	//
	// The two zone specifiers, %z and %Z, never reach here: they are written from the offset
	// by Format() itself, because neither is a field of the date.
	function specifier_value( Code, Shifted )
	{
		if ( Code === 'Y' ) { return Shifted.getUTCFullYear(); }
		if ( Code === 'm' ) { return Shifted.getUTCMonth() + 1; }
		if ( Code === 'd' ) { return Shifted.getUTCDate(); }
		if ( Code === 'H' ) { return Shifted.getUTCHours(); }
		if ( Code === 'M' ) { return Shifted.getUTCMinutes(); }
		if ( Code === 'S' ) { return Shifted.getUTCSeconds(); }
		if ( Code === 'L' ) { return Shifted.getUTCMilliseconds(); }
		if ( Code === 'j' ) { return helper.DayOfYear( Shifted ); }
		if ( Code === 'w' ) { return Shifted.getUTCDay() + 1; }
		if ( Code === 'U' ) { return helper.WeekNumber( Shifted, 0 ); }
		if ( Code === 'G' ) { return helper.IsoWeekParts( Shifted ).Year; }
		if ( Code === 'V' ) { return helper.IsoWeekParts( Shifted ).Week; }
		return helper.IsoWeekParts( Shifted ).Day;
	}


	//---------------------------------------------------------------------
	// Writes a date through a format string.
	helper.Format = function ( Instant, Zone, Format, OperatorName )
	{
		let offset = Zone ? helper.OffsetMinutes( Instant, Zone, OperatorName ) : 0;
		let shifted = helper.ZoneShifted( Instant, Zone, OperatorName );

		let text = '';
		for ( let index = 0; index < Format.length; index++ )
		{
			if ( Format[ index ] !== '%' ) { text = text + Format[ index ]; continue; }

			index = index + 1;
			let code = Format[ index ];
			if ( code === '%' ) { text = text + '%'; continue; }
			if ( !( code in SPECIFIERS ) )
			{
				throw new Error( `${OperatorName}: [%${code}] is not a format specifier.` );
			}

			if ( code === 'z' )
			{
				let sign = ( offset < 0 ) ? '-' : '+';
				text = text + sign + padded( Math.floor( Math.abs( offset ) / 60 ), 2 ) + padded( Math.abs( offset ) % 60, 2 );
				continue;
			}
			if ( code === 'Z' ) { text = text + String( offset ); continue; }

			text = text + padded( specifier_value( code, shifted ), SPECIFIERS[ code ].Width );
		}

		return text;
	};


	//---------------------------------------------------------------------
	// Reads a date from a string through a format string.
	//
	// Only the numeric specifiers can be read back: %z and the week fields describe a date
	// rather than locating one, so a string carrying only those does not name an instant.
	helper.ParseFormatted = function ( Text, Format, Zone, OperatorName )
	{
		let parts = { Year: 1970, Month: 1, Day: 1, Hour: 0, Minute: 0, Second: 0, Millisecond: 0 };
		const FIELDS = { Y: 'Year', m: 'Month', d: 'Day', H: 'Hour', M: 'Minute', S: 'Second', L: 'Millisecond' };

		// Which specifiers the format actually carried, so that a format leaving out part of
		// the date can be refused rather than silently defaulted.
		let seen = {};

		let at = 0;
		for ( let index = 0; index < Format.length; index++ )
		{
			if ( Format[ index ] !== '%' )
			{
				if ( Text[ at ] !== Format[ index ] )
				{
					throw new Error( `${OperatorName}: [${Text}] does not match the format [${Format}].` );
				}
				at = at + 1;
				continue;
			}

			index = index + 1;
			let code = Format[ index ];
			if ( code === '%' )
			{
				if ( Text[ at ] !== '%' ) { throw new Error( `${OperatorName}: [${Text}] does not match the format [${Format}].` ); }
				at = at + 1;
				continue;
			}
			if ( !( code in FIELDS ) )
			{
				throw new Error( `${OperatorName}: [%${code}] cannot be read from a string.` );
			}

			let width = SPECIFIERS[ code ].Width;
			let digits = Text.substr( at, width );
			if ( !/^\d+$/.test( digits ) )
			{
				throw new Error( `${OperatorName}: [${Text}] does not match the format [${Format}].` );
			}
			parts[ FIELDS[ code ] ] = Number( digits );
			seen[ code ] = true;
			at = at + width;
		}

		if ( at !== Text.length )
		{
			throw new Error( `${OperatorName}: [${Text}] does not match the format [${Format}].` );
		}

		// ***A reading format must locate a whole date.*** A day with no month and no year to
		// put it in is not a date, and MongoDB refuses such a format rather than defaulting
		// the missing elements to the epoch. The time of day is optional and defaults to
		// midnight, which is the one part it does fill in.
		if ( !( 'Y' in seen ) || !( 'm' in seen ) || !( 'd' in seen ) )
		{
			throw new Error( `${OperatorName}: the format [${Format}] leaves out part of the date.` );
		}

		let wall = Date.UTC( parts.Year, parts.Month - 1, parts.Day, parts.Hour, parts.Minute, parts.Second, parts.Millisecond );
		return helper.FromZoneWallClock( wall, Zone, OperatorName );
	};


	//---------------------------------------------------------------------
	// Reads a date from a string which carries no format.
	//
	// ***A string carrying no zone is read in the zone given***, and in UTC when none was.
	// Javascript reads such a string as local time, which would make the same string mean
	// different instants on two machines, so its answer is corrected rather than trusted.
	helper.ParseDateString = function ( Text, Zone, OperatorName )
	{
		// Javascript reads a bare year as the first of January. MongoDB refuses it.
		if ( /^\d{4}$/.test( Text ) )
		{
			throw new Error( `${OperatorName}: cannot read [${Text}] as a date.` );
		}

		let milliseconds = Date.parse( Text );
		if ( Number.isNaN( milliseconds ) )
		{
			throw new Error( `${OperatorName}: cannot read [${Text}] as a date.` );
		}

		// A string which names its own zone already locates an instant.
		if ( /(Z|[+-]\d{2}:?\d{2})$/i.test( Text ) ) { return new Date( milliseconds ); }

		// An ISO date with no time is the one form Javascript already reads as UTC.
		let wall = milliseconds;
		if ( !/^\d{4}-\d{2}-\d{2}$/.test( Text ) )
		{
			wall = milliseconds - ( new Date( milliseconds ).getTimezoneOffset() * 60000 );
		}

		return helper.FromZoneWallClock( wall, Zone, OperatorName );
	};


	//---------------------------------------------------------------------
	return helper;
};
