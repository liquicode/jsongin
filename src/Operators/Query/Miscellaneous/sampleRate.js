'use strict';
/*md

## Operators > Query > $sampleRate

Usage: `$sampleRate: rate`

Selects a random fraction of the documents, where the rate is a number from 0 through 1.

***The result is not repeatable***, which is the point of it. Each document is decided
  independently, so a rate of 0.5 over a hundred documents selects about fifty rather than
  exactly fifty.

The two ends are not random at all: a rate of 0 selects nothing and a rate of 1 selects
  everything. A rate outside that range is refused.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: true,
		ValueTypes: 'n',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				if ( !Number.isFinite( MatchValue ) || ( MatchValue < 0 ) || ( MatchValue > 1 ) )
				{
					throw new Error( `$sampleRate: requires a rate from 0 through 1 but found ${MatchValue}.` );
				}

				// A rate of 1 selects every document, which this gives because Math.random()
				// never returns 1, and a rate of 0 selects none.
				return ( Math.random() < MatchValue );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$sampleRate: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
