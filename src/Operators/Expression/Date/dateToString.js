'use strict';
/*md

## Operators > Expression > $dateToString

Usage: `$dateToString: { date: expression, format: string, timezone: string, onNull: expression }`

Writes a date as a string through a format.
With no `format`, the whole ISO 8601 string: `%Y-%m-%dT%H:%M:%S.%LZ`.

| **Specifier** | **Means**                          | **Width** |
|---------------|------------------------------------|-----------|
| `%Y`          | year                               | 4         |
| `%m`          | month, from 01                     | 2         |
| `%d`          | day of the month                   | 2         |
| `%H`          | hour, from 00 to 23                | 2         |
| `%M`          | minute                             | 2         |
| `%S`          | second                             | 2         |
| `%L`          | millisecond                        | 3         |
| `%j`          | day of the year                    | 3         |
| `%w`          | day of the week, Sunday is 1       | 1         |
| `%U`          | week of the year, from 00          | 2         |
| `%G`          | ISO 8601 week year                 | 4         |
| `%V`          | ISO 8601 week                      | 2         |
| `%u`          | ISO 8601 day of the week, Monday is 1 | 1      |
| `%z`          | zone offset, as `+HHMM`            |           |
| `%Z`          | zone offset, in minutes            |           |
| `%%`          | a literal percent sign             |           |

***Every field is padded to its width***, which is why the second of January is written `02`.
A specifier which is not in the table throws.

`onNull` answers a null date, as it does in [$convert](#$convert). Without it, a null date
  gives null.

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
				if ( ( jsongin.ShortType( Args ) !== 'o' ) || !( 'date' in Args ) )
				{
					throw new Error( `$dateToString: requires a document naming a date.` );
				}

				let allowed = [ 'date', 'format', 'timezone', 'onNull' ];
				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( !allowed.includes( keys[ index ] ) )
					{
						throw new Error( `$dateToString: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}

				let read = date.ReadDateArgs( Document, { date: Args.date, timezone: Args.timezone }, '$dateToString' );
				if ( read === null )
				{
					if ( 'onNull' in Args ) { return jsongin.Evaluate( Document, Args.onNull ); }
					return null;
				}

				let format = date.DEFAULT_FORMAT;
				if ( 'format' in Args )
				{
					format = jsongin.Evaluate( Document, Args.format );
					let short_type = jsongin.ShortType( format );
					if ( 'lu'.includes( short_type ) ) { return null; }
					if ( short_type !== 's' )
					{
						throw new Error( `$dateToString: requires a format string but found a [${short_type}] instead.` );
					}
				}

				return date.Format( read.Date, read.Zone, format, '$dateToString' );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$dateToString: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
