'use strict';
/*md

## Operators > Expression > $zip

Usage: `$zip: { inputs: [ array, ... ], useLongestLength: boolean, defaults: [ value, ... ] }`

Merges arrays together element by element, so that the first elements of each become the first
  element of the result, the second elements the second, and so on.

***The shortest input decides how many elements come out***, unless `useLongestLength` is true,
  in which case the longest does and the missing elements are filled in. What they are filled
  with is `null`, or the matching entry of `defaults` when one is given.

`defaults` is only meaningful alongside `useLongestLength`, and giving it without one is
  refused rather than ignored.

A null or missing input array makes the whole result null.

*/

module.exports = function ( jsongin )
{

	const array = require( './_array' )( jsongin );

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
				if ( ( jsongin.ShortType( Args ) !== 'o' ) || !( 'inputs' in Args ) )
				{
					throw new Error( `$zip: requires a document naming its inputs.` );
				}

				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( ![ 'inputs', 'useLongestLength', 'defaults' ].includes( keys[ index ] ) )
					{
						throw new Error( `$zip: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}

				let use_longest = false;
				if ( 'useLongestLength' in Args )
				{
					use_longest = ( jsongin.Evaluate( Document, Args.useLongestLength ) === true );
				}

				let defaults = null;
				if ( 'defaults' in Args )
				{
					if ( !use_longest )
					{
						throw new Error( `$zip: defaults cannot be given without useLongestLength.` );
					}
					defaults = array.AsArrayOrNull( jsongin.Evaluate( Document, Args.defaults ), '$zip' );
				}

				// ***`inputs` is an array of expressions, not an expression giving an array.***
				// The elements are evaluated; the list itself has to be written out, and
				// MongoDB refuses a field reference in its place.
				let inputs = Args.inputs;
				if ( jsongin.ShortType( inputs ) !== 'a' )
				{
					throw new Error( `$zip: requires inputs to be an array of expressions but found a [${jsongin.ShortType( inputs )}] instead.` );
				}
				if ( inputs.length === 0 )
				{
					throw new Error( `$zip: requires at least one input array.` );
				}

				let arrays = [];
				for ( let index = 0; index < inputs.length; index++ )
				{
					let values = array.AsArrayOrNull( jsongin.Evaluate( Document, inputs[ index ] ), '$zip' );
					if ( values === null ) { return null; }
					arrays.push( values );
				}

				// The length is the shortest input, or the longest when asked for.
				let length = arrays[ 0 ].length;
				for ( let index = 1; index < arrays.length; index++ )
				{
					if ( use_longest )
					{
						if ( arrays[ index ].length > length ) { length = arrays[ index ].length; }
					}
					else if ( arrays[ index ].length < length ) { length = arrays[ index ].length; }
				}

				let zipped = [];
				for ( let position = 0; position < length; position++ )
				{
					let row = [];
					for ( let index = 0; index < arrays.length; index++ )
					{
						if ( position < arrays[ index ].length ) { row.push( arrays[ index ][ position ] ); }
						else if ( defaults && ( index < defaults.length ) ) { row.push( defaults[ index ] ); }
						else { row.push( null ); }
					}
					zipped.push( row );
				}

				return zipped;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$zip: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
