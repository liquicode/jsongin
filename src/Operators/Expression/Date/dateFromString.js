'use strict';
/*md

## Operators > Expression > $dateFromString

Usage: `$dateFromString: { dateString: expression, format: string, timezone: string, onError: expression, onNull: expression }`

Reads a date from a string.
With no `format`, the string is read as ISO 8601.
With one, it is read through the same specifiers [$dateToString](#$dateToString) writes,
  though only the numeric ones - `%Y`, `%m`, `%d`, `%H`, `%M`, `%S`, `%L` - can be read back.

***A string carrying no zone is read in the `timezone` given***, and in UTC when none was.
Javascript reads such a string as local time, which would make the same string mean different
  instants on two machines, so its answer is corrected rather than trusted.

`onError` answers a string which could not be read, and `onNull` answers a null one. Without
  them, a bad string throws and a null one gives null.

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
				if ( ( jsongin.ShortType( Args ) !== 'o' ) || !( 'dateString' in Args ) )
				{
					throw new Error( `$dateFromString: requires a document naming a dateString.` );
				}

				let allowed = [ 'dateString', 'format', 'timezone', 'onError', 'onNull' ];
				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( !allowed.includes( keys[ index ] ) )
					{
						throw new Error( `$dateFromString: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}

				let text = jsongin.Evaluate( Document, Args.dateString, Scope );
				let short_type = jsongin.ShortType( text );

				// A null takes the onNull path, never the onError one.
				if ( 'lu'.includes( short_type ) )
				{
					if ( 'onNull' in Args ) { return jsongin.Evaluate( Document, Args.onNull, Scope ); }
					return null;
				}

				try
				{
					if ( short_type !== 's' )
					{
						throw new Error( `$dateFromString: requires a string but found a [${short_type}] instead.` );
					}

					let zone = date.ReadZone( Document, Args.timezone, '$dateFromString', Scope );
					if ( zone === null ) { return null; }

					if ( 'format' in Args )
					{
						let format = jsongin.Evaluate( Document, Args.format, Scope );
						if ( jsongin.ShortType( format ) !== 's' )
						{
							throw new Error( `$dateFromString: requires a format string.` );
						}
						return date.ParseFormatted( text, format, zone, '$dateFromString' );
					}

					return date.ParseDateString( text, zone, '$dateFromString' );
				}
				catch ( reading_error )
				{
					if ( 'onError' in Args ) { return jsongin.Evaluate( Document, Args.onError, Scope ); }
					throw reading_error;
				}
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateFromString: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
