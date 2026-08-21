'use strict';

/*
	Shared implementation for the $ceil, $floor, $round, and $trunc expression operators.
	This is a helper module, not an operator.

	The four differ only in how they discard the fraction, so they share one implementation
	rather than being maintained as near copies of each other. This follows _arithmetic.js and
	_compare.js, which do the same for their own families.
*/

module.exports = function ( jsongin )
{

	const arithmetic = require( './_arithmetic' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	// Applies a rounding operation to a single operand, with no place argument.
	// Used by $ceil and $floor, which take exactly one argument.
	//
	// A null or missing operand gives null rather than an error, which is how the arithmetic
	// operators treat one. Anything else which is not a number is an error.
	// Verified against MongoDB 6.0.1.
	helper.Apply = function ( Document, Args, OperatorName, Operation, Scope )
	{
		jsongin.Scope.Require( Scope, 'rounding.Apply' );

		let operands = arithmetic.Operands( Document, Args, OperatorName, 1, 1, Scope );

		let number = arithmetic.AsOperandNumber( operands[ 0 ], OperatorName );
		if ( number === null ) { return null; }

		return Operation( number );
	};


	//---------------------------------------------------------------------
	// Applies a rounding operation at a decimal place.
	// Used by $round and $trunc, which take the value and an optional place.
	//
	// The place defaults to 0, may be negative to work to the left of the decimal point, and
	// a null place gives null the same way a null value does.
	helper.ApplyAtPlace = function ( Document, Args, OperatorName, Operation, Scope )
	{
		jsongin.Scope.Require( Scope, 'rounding.ApplyAtPlace' );

		let operands = arithmetic.Operands( Document, Args, OperatorName, 1, 2, Scope );

		let number = arithmetic.AsOperandNumber( operands[ 0 ], OperatorName );
		if ( number === null ) { return null; }

		let place = 0;
		if ( operands.length === 2 )
		{
			place = arithmetic.AsOperandNumber( operands[ 1 ], OperatorName );
			if ( place === null ) { return null; }
			if ( Number.isInteger( place ) === false )
			{
				throw new Error( `${OperatorName}: requires an integer place but found [${place}] instead.` );
			}
		}

		// Shift the value so that the place to work at becomes the units place, apply the
		// operation there, and shift back.
		//
		// The shift is done with strings rather than by multiplying by a power of ten, because
		// multiplying introduces the error it is meant to remove: 1.005 * 100 is
		// 100.49999999999999 in binary floating point, which would round to 1.00 instead of
		// 1.01. Moving the decimal point in the decimal text moves it exactly.
		let shifted = shift_decimal_point( number, place );
		let result = Operation( shifted );
		return shift_decimal_point( result, -place );
	};


	//---------------------------------------------------------------------
	// Returns Value with its decimal point moved Places to the right, exactly.
	//
	// Done through the number's own decimal text so that no binary rounding error is
	// introduced. Exponential notation is handled by letting Number parse the adjusted
	// exponent, which is exact for the cases that reach it.
	function shift_decimal_point( Value, Places )
	{
		if ( Places === 0 ) { return Value; }
		if ( Number.isFinite( Value ) === false ) { return Value; }

		let text = Value.toString();

		// A value already in exponential notation only needs its exponent adjusted.
		let exponent_at = text.indexOf( 'e' );
		if ( exponent_at >= 0 )
		{
			let mantissa = text.slice( 0, exponent_at );
			let exponent = Number( text.slice( exponent_at + 1 ) );
			return Number( `${mantissa}e${exponent + Places}` );
		}

		return Number( `${text}e${Places}` );
	};


	//---------------------------------------------------------------------
	// Rounds to the nearest integer, sending a value exactly half way to the ***even***
	// neighbour. This is what MongoDB does, and it is not what Math.round() does:
	// Math.round( 2.5 ) is 3, and this is 2. Verified against MongoDB 6.0.1, where
	// { $round: [ 2.5 ] } is 2 and { $round: [ 3.5 ] } is 4.
	//
	// Math.round() is also asymmetric about zero, rounding -2.5 up to -2 while rounding 2.5
	// up to 3, so it cannot be repaired by handling the sign alone.
	helper.RoundHalfToEven = function ( Value )
	{
		let floor = Math.floor( Value );
		let fraction = Value - floor;

		if ( fraction > 0.5 ) { return floor + 1; }
		if ( fraction < 0.5 ) { return floor; }

		// Exactly half way. Take whichever neighbour is even.
		if ( ( floor % 2 ) === 0 ) { return floor; }
		return floor + 1;
	};


	//---------------------------------------------------------------------
	// Discards the fraction toward zero, so -1.5 becomes -1 rather than -2.
	helper.TruncateTowardZero = function ( Value )
	{
		return Math.trunc( Value );
	};


	//---------------------------------------------------------------------
	return helper;
};
