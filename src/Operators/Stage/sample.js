'use strict';
/*md

## Operators > Stage > $sample

Usage: `$sample: { size: count }`

Selects `size` documents at random, ***without replacement***, so no document is selected twice.

A `size` larger than the stream takes the whole stream, and a `size` of `0` takes nothing.

***A fractional size is truncated rather than refused***, which is worth knowing because the
  neighbouring N accumulators do require a whole number. A negative size, or one which is not a
  number, throws.

***The order of the result is not specified.*** Pair this with a [$sort](#$sort) when the order
  matters.

*/

module.exports = function ( jsongin )
{

	const stage = require( './_stage' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			try
			{
				stage.ReadArgs( Args, '$sample', [ 'size' ] );

				if ( jsongin.ShortType( Args.size ) !== 'n' )
				{
					throw new Error( `$sample: requires a numeric [size] but found a [${jsongin.ShortType( Args.size )}] instead.` );
				}
				if ( Args.size < 0 )
				{
					throw new Error( `$sample: requires a [size] of zero or more but found ${JSON.stringify( Args.size )} instead.` );
				}

				let size = Math.trunc( Args.size );
				if ( size >= Documents.length ) { return Documents.slice(); }

				// A partial Fisher-Yates shuffle over a copy of the indexes: it draws without
				// replacement and touches only as many positions as are being taken.
				let order = [];
				for ( let index = 0; index < Documents.length; index++ ) { order.push( index ); }

				let results = [];
				for ( let taken = 0; taken < size; taken++ )
				{
					let choice = taken + Math.floor( Math.random() * ( order.length - taken ) );
					let swap = order[ taken ];
					order[ taken ] = order[ choice ];
					order[ choice ] = swap;
					results.push( Documents[ order[ taken ] ] );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$sample: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
