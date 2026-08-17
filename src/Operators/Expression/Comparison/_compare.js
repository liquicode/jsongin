'use strict';

/*
	Shared implementation for the expression comparison operators.
	This is a helper module, not an operator.

	$eq, $ne, $gt, $gte, $lt, $lte, and $cmp differ only in what they make of the comparison,
	so they share one implementation rather than being maintained as seven mirrors of each
	other.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Evaluates both arguments and hands the comparison to Test.
	//
	// Test is called with the result of comparing the two values, which is negative, zero, or
	// positive the way CompareValues reports it. $cmp returns that result unchanged and the
	// other six turn it into a boolean, which is the whole of the difference between them.
	//
	// Both arguments are evaluated as expressions first, so a field path such as '$a' resolves
	// against the document and everything else stands for itself.
	//
	// Note that this compares with CompareValues rather than with jsongin.StrictEquals or the
	// $eq query operator. A query operator implements query semantics, where a match value can
	// also match an element of a document array. Within an expression the operands are plain
	// values, and all seven operators have to agree with each other.
	helper.Evaluate = function ( Document, Args, OperatorName, Test )
	{
		if ( jsongin.ShortType( Args ) !== 'a' ) { throw new Error( `${OperatorName}: requires an array of two arguments.` ); }
		if ( Args.length !== 2 ) { throw new Error( `${OperatorName}: requires exactly two arguments but found ${Args.length} instead.` ); }

		let value_a = jsongin.Evaluate( Document, Args[ 0 ] );
		let value_b = jsongin.Evaluate( Document, Args[ 1 ] );

		return Test( jsongin.CompareValues( value_a, value_b ) );
	};


	//---------------------------------------------------------------------
	return helper;
};
