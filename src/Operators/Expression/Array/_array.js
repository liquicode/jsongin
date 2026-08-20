'use strict';

/*
	Shared operand handling for the array expression operators.
	This is a helper module, not an operator.

	***Almost every operator here reads a null as a null and refuses anything else which is not
	an array.*** $isArray is the exception, because the question it asks has an answer for a
	null: false. That one distinction is why AsArrayOrNull exists rather than each operator
	testing the type itself.

	The operators which take { input, n } - $firstN, $lastN, $minN, $maxN - share ReadInputN,
	because the rules for n are the same in all four and are easy to get subtly wrong: it must
	be a whole number of one or more, and asking for more elements than there are is not an
	error but simply gives what there is.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Aggregate Tests/test-suite/Array Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	helper.Operands = arithmetic.Operands;


	//---------------------------------------------------------------------
	// Returns an operand as an array, or null when it is null or missing.
	// Throws when it is present and is not an array.
	helper.AsArrayOrNull = function ( Operand, OperatorName )
	{
		let short_type = jsongin.ShortType( Operand );
		if ( 'lu'.includes( short_type ) ) { return null; }
		if ( short_type !== 'a' )
		{
			throw new Error( `${OperatorName}: requires an array but found a [${short_type}] instead.` );
		}
		return Operand;
	};


	//---------------------------------------------------------------------
	// Returns an operand as a whole number, or throws.
	helper.AsWholeNumber = function ( Operand, OperatorName, Label )
	{
		if ( jsongin.ShortType( Operand ) !== 'n' )
		{
			throw new Error( `${OperatorName}: requires a numeric ${Label} but found a [${jsongin.ShortType( Operand )}] instead.` );
		}
		if ( !Number.isInteger( Operand ) )
		{
			throw new Error( `${OperatorName}: requires a whole ${Label} but found ${Operand} instead.` );
		}
		return Operand;
	};


	//---------------------------------------------------------------------
	// Reads the { input, n } arguments the four N operators share.
	//
	// ***These four refuse a null input***, where most of this family propagates one. MongoDB
	// answers a null or a missing field with "Input must be an array" rather than with null,
	// and that difference is reproduced rather than tidied up.
	helper.ReadInputN = function ( Document, Args, OperatorName )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires a document naming an input and an n.` );
		}
		if ( !( 'input' in Args ) || !( 'n' in Args ) )
		{
			throw new Error( `${OperatorName}: requires both an [input] and an [n].` );
		}

		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( ![ 'input', 'n' ].includes( keys[ index ] ) )
			{
				throw new Error( `${OperatorName}: [${keys[ index ]}] is not an argument of this operator.` );
			}
		}

		let count = helper.AsWholeNumber( jsongin.Evaluate( Document, Args.n ), OperatorName, 'n' );
		if ( count < 1 )
		{
			throw new Error( `${OperatorName}: requires an n of one or more but found ${count} instead.` );
		}

		let values = jsongin.Evaluate( Document, Args.input );
		if ( jsongin.ShortType( values ) !== 'a' )
		{
			throw new Error( `${OperatorName}: requires an array input but found a [${jsongin.ShortType( values )}] instead.` );
		}

		return { Values: values, Count: count };
	};


	//---------------------------------------------------------------------
	// Returns the elements sorted by BSON order, ascending or descending.
	// This is what $minN and $maxN hand back, and what $sortArray does for a plain sortBy.
	helper.SortedValues = function ( Values, Descending )
	{
		let sorted = Values.slice();
		sorted.sort( function ( Left, Right )
		{
			let comparison = jsongin.CompareValues( Left, Right );
			return Descending ? -comparison : comparison;
		} );
		return sorted;
	};


	//---------------------------------------------------------------------
	return helper;
};
