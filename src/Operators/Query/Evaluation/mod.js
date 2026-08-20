'use strict';
/*md

## Operators > Query > $mod

Usage: `$mod: [ divisor, remainder ]`

Divides the field by the divisor and matches when the remainder is the one given.

***This is not the expression `$mod`***, which shares the name and does something else: that
  one takes two operands and returns a remainder, while this one takes a divisor and the
  remainder to look for, and returns whether the field matches.

A fractional field is truncated toward zero before the division.
A field which is not a number does not match.
The array must hold exactly two numbers, and a divisor of zero is refused.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'a',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				if ( MatchValue.length !== 2 )
				{
					throw new Error( `$mod: requires an array of exactly two numbers but found ${MatchValue.length} at [${Path}].` );
				}

				let divisor = MatchValue[ 0 ];
				let remainder = MatchValue[ 1 ];
				if ( ( jsongin.ShortType( divisor ) !== 'n' ) || ( jsongin.ShortType( remainder ) !== 'n' ) )
				{
					throw new Error( `$mod: requires a numeric divisor and remainder at [${Path}].` );
				}
				if ( divisor === 0 )
				{
					throw new Error( `$mod: cannot divide by zero at [${Path}].` );
				}

				let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );
				for ( let index = 0; index < candidates.length; index++ )
				{
					let candidate = candidates[ index ];
					if ( jsongin.ShortType( candidate ) !== 'n' ) { continue; }
					if ( !Number.isFinite( candidate ) ) { continue; }

					// The value is truncated toward zero, so 10.5 and 10 divide alike, and a
					// negative value keeps its sign in the remainder.
					if ( ( Math.trunc( candidate ) % divisor ) === remainder ) { return true; }
				}

				if ( jsongin.OpLog ) { jsongin.OpLog( `$mod: no value at [${Path}] left the remainder ${remainder}.` ); }
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$mod: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
