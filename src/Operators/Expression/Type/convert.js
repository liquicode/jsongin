'use strict';
/*md

## Operators > Expression > $convert

Usage: `$convert: { input: expression, to: type, onError: expression, onNull: expression }`

Converts a value to a given type.
`to` is a type name - `double`, `string`, `bool`, `date`, `int`, or `long` - or the BSON type
  number which stands for one.

***`onError` and `onNull` are what this operator has and the shorthands do not.***
They are not interchangeable, and a value which is null takes the `onNull` path even when an
  `onError` is also given:

- `onNull` answers a null or missing input. Without it, a null input gives null.
- `onError` answers a conversion which failed - a value with no reading in the target, or one
  which does not fit. Without it, the failure throws.

`onError` covers the conversion and nothing else. A `to` which names no type is a malformed
  expression rather than a failed conversion, and throws whether or not an `onError` is given.

***What a conversion cannot do is change what [$type](#$type) will say about a number.***
MongoDB has `int`, `long`, and `double` as separate types and tags a converted number with the
  one it was converted to, so `{ $type: { $toLong: 42 } }` is `'long'` there. `jsongin` holds
  JSON, which has one number kind, so the same expression is `'int'` here. The converted
  ***values*** agree; only what `$type` reports about a number afterwards does not. See the
  [Operator Reference](../Operator-Reference.md) for the other boundaries of this kind.

*/

module.exports = function ( jsongin )
{

	const type = require( './_type' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		// The argument is a document of named fields, never an array of operands.
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'o' )
				{
					throw new Error( `$convert: requires a document of arguments.` );
				}
				if ( !( 'input' in Args ) || !( 'to' in Args ) )
				{
					throw new Error( `$convert: requires both an [input] and a [to].` );
				}

				let value = jsongin.Evaluate( Document, Args.input );
				let target = type.TargetName( jsongin.Evaluate( Document, Args.to ), '$convert' );

				// A null takes the onNull path, never the onError one, even when both are given.
				let short_type = jsongin.ShortType( value );
				if ( 'lu'.includes( short_type ) )
				{
					if ( 'onNull' in Args ) { return jsongin.Evaluate( Document, Args.onNull ); }
					return null;
				}

				try
				{
					return type.Convert( value, target, '$convert' );
				}
				catch ( conversion_error )
				{
					if ( 'onError' in Args ) { return jsongin.Evaluate( Document, Args.onError ); }
					throw conversion_error;
				}
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$convert: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
