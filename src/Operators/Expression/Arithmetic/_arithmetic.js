'use strict';

/*
	Shared operand handling for the expression arithmetic operators.
	This is a helper module, not an operator.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Evaluates an operator's arguments and returns an array of operand values.
	// Arguments are normally given as an array of expressions.
	// A single argument may also be given without the enclosing array.
	// Throws when the argument count is out of range. A null MaxCount means variadic.
	helper.Operands = function ( Document, Args, OperatorName, MinCount, MaxCount )
	{
		let expressions = Args;
		if ( jsongin.ShortType( expressions ) !== 'a' ) { expressions = [ expressions ]; }

		let operands = [];
		for ( let index = 0; index < expressions.length; index++ )
		{
			operands.push( jsongin.Evaluate( Document, expressions[ index ] ) );
		}

		if ( operands.length < MinCount )
		{
			throw new Error( `${OperatorName}: requires at least ${MinCount} argument(s) but found ${operands.length} instead.` );
		}
		if ( ( MaxCount !== null ) && ( operands.length > MaxCount ) )
		{
			throw new Error( `${OperatorName}: requires at most ${MaxCount} argument(s) but found ${operands.length} instead.` );
		}

		return operands;
	};


	//---------------------------------------------------------------------
	// Converts an operand to a number.
	// Returns null when the operand is null or missing, which callers propagate.
	// Throws when the operand is present but is not a number.
	//
	// ***NaN and the infinities are numbers here***, not refusals. They are ordinary BSON
	// doubles, and MongoDB computes with them rather than rejecting them, so { $add: [ NaN, 1 ] }
	// is NaN and { $round: [ Infinity, 2 ] } is Infinity. Verified against MongoDB 6.0.1.
	//
	// This used to pass the operand through AsNumber(), which returns null for a NaN, and then
	// read that null as "not a number" and threw. The ShortType test above has already
	// established that the operand is a number, so there is nothing left to convert.
	helper.AsOperandNumber = function ( Operand, OperatorName )
	{
		let short_type = jsongin.ShortType( Operand );
		if ( 'lu'.includes( short_type ) ) { return null; }
		if ( short_type !== 'n' )
		{
			throw new Error( `${OperatorName}: requires numeric operands but found a [${short_type}] operand instead.` );
		}
		return Operand;
	};


	//---------------------------------------------------------------------
	// Returns the operand as a Date, or null when the operand is not a date.
	helper.AsOperandDate = function ( Operand )
	{
		if ( jsongin.ShortType( Operand ) !== 'd' ) { return null; }
		return Operand;
	};


	//---------------------------------------------------------------------
	return helper;
};
