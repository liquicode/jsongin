'use strict';

/*
	Shared set handling for the expression set operators.
	This is a helper module, not an operator.

	***An array read as a set means something different from an array.*** Order stops mattering
	and repeats stop counting, so [ 1, 1, 2 ] and [ 2, 1 ] are the same set. Everything here
	follows from that.

	***Membership is decided by CompareValues***, the same comparison the expression comparison
	operators and Sort() use, so two documents are the same element when their contents are.
	A number and the string of that number are not, and neither are { a: 1, b: 2 } and
	{ b: 2, a: 1 }: MongoDB compares a document field by field in the order it holds them, so
	the same fields written in a different order are a different element. That is measured
	rather than assumed - see the suite.

	***A set is handed back in BSON order***, which is what MongoDB does. A set has no order of
	its own, so an operator returning one has to pick something, and sorting is the only choice
	which gives the same answer for the same set however it was written.

	***The family is not consistent about a null operand.*** $setUnion, $setIntersection, and
	$setDifference answer a null with a null; $setIsSubset, $allElementsTrue, and $anyElementTrue
	refuse one. That is reproduced here rather than smoothed over, because a caller's expression
	has to mean the same thing against both engines.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Aggregate Tests/test-suite/Set Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	helper.Operands = arithmetic.Operands;


	//---------------------------------------------------------------------
	// Answers whether a value is already in a set.
	helper.Holds = function ( Set, Value )
	{
		for ( let index = 0; index < Set.length; index++ )
		{
			if ( jsongin.CompareValues( Set[ index ], Value ) === 0 ) { return true; }
		}
		return false;
	};


	//---------------------------------------------------------------------
	// Returns the distinct elements of an array, sorted into BSON order.
	helper.AsSet = function ( Values )
	{
		let set = [];
		for ( let index = 0; index < Values.length; index++ )
		{
			if ( !helper.Holds( set, Values[ index ] ) ) { set.push( Values[ index ] ); }
		}
		return helper.Sorted( set );
	};


	//---------------------------------------------------------------------
	// Sorts a set into BSON order, which is the order every operator hands one back in.
	helper.Sorted = function ( Set )
	{
		return Set.sort( function ( Left, Right ) { return jsongin.CompareValues( Left, Right ); } );
	};


	//---------------------------------------------------------------------
	// Evaluates the operands of a set operator and returns them as arrays.
	//
	// Returns null when an operand is null or missing and NullPropagates is true, and throws
	// when it is false. That flag is the family's inconsistency, written down in one place.
	helper.ReadSets = function ( Document, Args, OperatorName, MinCount, MaxCount, NullPropagates )
	{
		let operands = helper.Operands( Document, Args, OperatorName, MinCount, MaxCount );

		let sets = [];
		for ( let index = 0; index < operands.length; index++ )
		{
			let operand = operands[ index ];
			let short_type = jsongin.ShortType( operand );

			if ( 'lu'.includes( short_type ) )
			{
				if ( NullPropagates ) { return null; }
				throw new Error( `${OperatorName}: requires an array but found a [${short_type}] instead.` );
			}
			if ( short_type !== 'a' )
			{
				throw new Error( `${OperatorName}: requires an array but found a [${short_type}] instead.` );
			}

			sets.push( operand );
		}

		return sets;
	};


	//---------------------------------------------------------------------
	// Answers whether every element of the first set appears in the second.
	helper.IsSubset = function ( Left, Right )
	{
		for ( let index = 0; index < Left.length; index++ )
		{
			if ( !helper.Holds( Right, Left[ index ] ) ) { return false; }
		}
		return true;
	};


	//---------------------------------------------------------------------
	// Answers whether a value counts as true.
	//
	// ***Only false, zero, null, and a missing value are false.*** An empty string and an
	// empty array are true, which is not Javascript's rule for either of them.
	helper.IsTrue = function ( Value )
	{
		let short_type = jsongin.ShortType( Value );
		if ( 'lu'.includes( short_type ) ) { return false; }
		if ( short_type === 'b' ) { return Value; }
		if ( short_type === 'n' ) { return ( Value !== 0 ); }
		return true;
	};


	//---------------------------------------------------------------------
	return helper;
};
