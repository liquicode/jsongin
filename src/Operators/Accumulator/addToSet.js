'use strict';
/*md

## Operators > Accumulator > $addToSet

Usage: `$addToSet: expression`

Returns an array of the ***distinct*** values in a group.
A value already collected is not collected again, which is the whole of the difference between
  this and `$push`.

Values are compared by ***content***, using the same comparison as the query and expression
  operators, so a value which is an array, a document, or a date is recognized as already
  present rather than being added again because it is a different instance.

A document whose expression resolves to a ***missing*** field contributes nothing.
Returns an empty array for an empty group.

***The order of the result is not specified***, and MongoDB makes no promise about it. This
  implementation happens to keep the order in which values were first seen, which a caller
  should not rely on: sort the result when the order matters.

Note that this is the accumulator `$addToSet` and not the update operator `$addToSet`.
The accumulator collects distinct values from every document in a group.
The update operator adds a value to an array field within a single document.

*/

module.exports = function ( jsongin )
{

	const accumulator = require( './_accumulator' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Accumulate: function ( Documents, Args )
		{
			try
			{
				let values = accumulator.Values( Documents, Args );

				let collected = [];
				for ( let index = 0; index < values.length; index++ )
				{
					// A missing value is not a value, which is what $push does too.
					if ( typeof values[ index ] === 'undefined' ) { continue; }
					if ( set_contains( collected, values[ index ] ) ) { continue; }
					collected.push( values[ index ] );
				}

				return collected;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Accumulator.$addToSet: ${error.message}` ); }
				throw error;
			}
		},

	};


	//---------------------------------------------------------------------
	// Returns true when Values already contains Value.
	// Compares by content rather than by reference. Javascript's Array.includes() compares
	// with SameValueZero, which is a reference comparison for objects, arrays, and dates, so
	// using it here would make this a set operation for primitives only.
	// This mirrors the update operator $addToSet, which has the same rule for the same reason.
	function set_contains( Values, Value )
	{
		for ( let index = 0; index < Values.length; index++ )
		{
			if ( jsongin.CompareValues( Values[ index ], Value ) === 0 ) { return true; }
		}
		return false;
	}


	// Return the operator.
	return operator;
};
