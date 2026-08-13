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
	helper.AsOperandNumber = function ( Operand, OperatorName )
	{
		let short_type = jsongin.ShortType( Operand );
		if ( 'lu'.includes( short_type ) ) { return null; }
		if ( short_type !== 'n' )
		{
			throw new Error( `${OperatorName}: requires numeric operands but found a [${short_type}] operand instead.` );
		}
		let number = jsongin.AsNumber( Operand );
		if ( number === null )
		{
			throw new Error( `${OperatorName}: requires numeric operands but found [${Operand}] instead.` );
		}
		return number;
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
