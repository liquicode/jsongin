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
	helper.Evaluate = function ( Document, Args, OperatorName, Test, Scope )
	{
		jsongin.Scope.Require( Scope, 'compare.Evaluate' );

		if ( jsongin.ShortType( Args ) !== 'a' ) { throw new Error( `${OperatorName}: requires an array of two arguments.` ); }
		if ( Args.length !== 2 ) { throw new Error( `${OperatorName}: requires exactly two arguments but found ${Args.length} instead.` ); }

		let value_a = jsongin.Evaluate( Document, Args[ 0 ], Scope );
		let value_b = jsongin.Evaluate( Document, Args[ 1 ], Scope );

		return Test( helper.Compare( value_a, value_b ) );
	};


	//---------------------------------------------------------------------
	// Compares two evaluated operands.
	//
	// ***A missing value ranks below a null here***, and equals only another missing one. That
	// is not what CompareValues does - it ranks the two together, because that is what Sort()
	// needs - and it is not what the query language does either, where a missing field matches
	// a null. ***MongoDB is inconsistent about this on purpose and jsongin reproduces it***:
	//
	//   { $cmp: [ '$nope', null ] }   is -1, not 0
	//   { $eq:  [ '$nope', null ] }   is false, not true
	//   { $sort: { nope: 1 } }        still sorts a missing field as a null
	//
	// So the distinction is made here rather than in CompareValues, where it would change
	// sorting, the query operators, and the accumulators along with it.
	//
	// Found by the 2026-08-20 sweep of unit tests making parity claims: a unit test asserted
	// that the expression $eq equates a null and a missing value, which is the query rule, and
	// no parity test had ever put the question to a server.
	helper.Compare = function ( ValueA, ValueB )
	{
		let missing_a = ( jsongin.ShortType( ValueA ) === 'u' );
		let missing_b = ( jsongin.ShortType( ValueB ) === 'u' );

		if ( missing_a && missing_b ) { return 0; }
		if ( missing_a ) { return -1; }
		if ( missing_b ) { return 1; }

		return jsongin.CompareValues( ValueA, ValueB );
	};


	//---------------------------------------------------------------------
	return helper;
};
