'use strict';

/*
	The values an accumulator reads when it is used as an expression.
	This is a helper module, not an operator.

	***Six accumulators are also expression operators.*** In a `$group` they read a field out of
	every document in the group; in a `$project` they read one operand and take the values from
	that. The arithmetic afterwards is identical and lives in
	`Operators/Accumulator/_accumulator.js`, which both forms call - this module is only the
	difference between them, which is how the values are gathered.

	Measured against MongoDB 7.0.40 on 2026-09-20,
	`jsonx/.plans/tools/accumulator-expression-probe.js`:

		[ 1, 2, 3, 4 ]    four values, the array is the list
		'$a'              one operand which is an array: the array is the list
		5                 one operand which is not: a list of one
		[]                no values at all, which $sum answers 0 for and the rest answer null
		[ [ 1, 2 ], 3 ]   two values, one of which is an array and is therefore not a number

	***An empty operand list is allowed here***, unlike most arithmetic operators, because
	MongoDB answers rather than refusing.
*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	helper.Operands = function ( Document, Args, OperatorName, Scope )
	{
		let operands = arithmetic.Operands( Document, Args, OperatorName, 0, null, Scope );

		// ***A single array operand supplies the values.*** This is the same rule $min and $max
		// follow, and it is what makes `$sum: '$a'` sum the array a field holds rather than
		// treat the array as one unsummable value.
		if ( operands.length === 1 )
		{
			if ( jsongin.ShortType( operands[ 0 ] ) === 'a' ) { operands = operands[ 0 ]; }
		}

		return operands;
	};


	//---------------------------------------------------------------------
	return helper;
};
