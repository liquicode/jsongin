'use strict';

/*
	Shared value handling for the accumulator operators.
	This is a helper module, not an operator.

	***Three families of accumulator read a group three different ways***, and the difference
	is the thing to keep straight:

		positional    $first, $last, $firstN, $lastN read the group in the order it arrived,
		              so what they answer depends on a $sort earlier in the pipeline.
		comparative   $min, $max, $minN, $maxN compare values to each other and ignore the
		              order entirely. They also ignore a null or missing value, having nothing
		              to compare it with, where the positional ones report it as a null.
		ranked        $top, $bottom, $topN, $bottomN carry a sortBy of their own and sort whole
		              documents by it, then read an output expression from each. They are the
		              only ones which can sort by one field and answer with another.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Aggregate Tests/test-suite/Accumulator Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Evaluates an accumulator's argument expression against each document in the group.
	// Returns an array of values, one per document, in group order.
	// A document whose expression resolves to a missing field contributes an undefined
	// value here. Each accumulator decides for itself what to do with it.
	helper.Values = function ( Documents, Args )
	{
		if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }

		let values = [];
		for ( let index = 0; index < Documents.length; index++ )
		{
			values.push( jsongin.Evaluate( Documents[ index ], Args ) );
		}
		return values;
	};


	//---------------------------------------------------------------------
	// Reads the { input, n } argument document shared by $firstN, $lastN, $minN, and $maxN.
	//
	// ***n is evaluated against nothing***, not against the group's documents. It says how
	// many values to take from the whole group, so it cannot vary from one document to the
	// next; a field reference in it has nothing to resolve against and is refused as a result.
	helper.ReadN = function ( Documents, Args, OperatorName )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires a document naming an [input] and an [n].` );
		}

		let allowed = [ 'input', 'n' ];
		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( allowed.includes( keys[ index ] ) === false )
			{
				throw new Error( `${OperatorName}: [${keys[ index ]}] is not an argument of this operator.` );
			}
		}
		for ( let index = 0; index < allowed.length; index++ )
		{
			if ( ( allowed[ index ] in Args ) === false )
			{
				throw new Error( `${OperatorName}: requires an argument named [${allowed[ index ]}].` );
			}
		}

		return {
			Values: helper.Values( Documents, Args.input ),
			N: helper.ReadCount( Args.n, OperatorName ),
		};
	};


	//---------------------------------------------------------------------
	// Evaluates and validates an `n` argument. It must be a whole number of one or more.
	helper.ReadCount = function ( CountExpression, OperatorName )
	{
		let count = jsongin.Evaluate( {}, CountExpression );

		if ( ( jsongin.ShortType( count ) !== 'n' ) || !Number.isInteger( count ) || ( count < 1 ) )
		{
			throw new Error( `${OperatorName}: requires a whole [n] of one or more but found ${JSON.stringify( count )} instead.` );
		}

		return count;
	};


	//---------------------------------------------------------------------
	// Reads the { sortBy, output, n } argument document shared by $top, $bottom, $topN, and
	// $bottomN, and returns the group's output values in sortBy order.
	//
	// ***The group is sorted on a copy.*** jsongin.Sort() sorts in place, and the array handed
	// to an accumulator is the pipeline's own group; reordering it would change what every
	// later accumulator in the same $group sees.
	helper.ReadRanked = function ( Documents, Args, OperatorName, WantsCount )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires a document naming a [sortBy] and an [output].` );
		}

		// Checked here rather than left to Sort(). These four are the only accumulators which
		// never call Values(), which is where every other one gets this check, so without it
		// the guarantee that no accumulator accepts a non-array group would hold only by
		// accident - String.prototype.slice happens to return something Sort() rejects.
		//
		// ***The argument is checked before the group***, which is the order ReadN uses and
		// the order the two error handling sweeps expect: one passes a bad argument with a bad
		// group and the other a good argument with a bad group, so each reaches one check.
		if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }

		let allowed = [ 'sortBy', 'output' ];
		if ( WantsCount ) { allowed.push( 'n' ); }

		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( allowed.includes( keys[ index ] ) === false )
			{
				throw new Error( `${OperatorName}: [${keys[ index ]}] is not an argument of this operator.` );
			}
		}
		for ( let index = 0; index < allowed.length; index++ )
		{
			if ( ( allowed[ index ] in Args ) === false )
			{
				throw new Error( `${OperatorName}: requires an argument named [${allowed[ index ]}].` );
			}
		}

		helper.ValidateSortBy( Args.sortBy, OperatorName );

		let sorted = jsongin.Sort( Documents.slice(), Args.sortBy );

		let outputs = [];
		for ( let index = 0; index < sorted.length; index++ )
		{
			outputs.push( jsongin.Evaluate( sorted[ index ], Args.output ) );
		}

		return {
			Outputs: outputs,
			N: WantsCount ? helper.ReadCount( Args.n, OperatorName ) : 1,
		};
	};


	//---------------------------------------------------------------------
	// A sort specification names fields and gives each a direction of 1 or -1.
	//
	// Sort() itself reads any positive number as ascending and any negative one as descending,
	// which is more forgiving than MongoDB, so the check belongs here: a { n: 2 } which quietly
	// sorted ascending would hide a mistake rather than report it.
	helper.ValidateSortBy = function ( SortBy, OperatorName )
	{
		if ( jsongin.ShortType( SortBy ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires a [sortBy] specification document.` );
		}

		// ***An empty sortBy is accepted***, and my first version refused it. MongoDB takes a
		// specification which names no field as one that sorts nothing, leaving the group in
		// the order it arrived in, so the operator still answers - it just answers something
		// the sort had no say in.
		let keys = Object.keys( SortBy );

		for ( let index = 0; index < keys.length; index++ )
		{
			let direction = SortBy[ keys[ index ] ];
			if ( ( direction !== 1 ) && ( direction !== -1 ) )
			{
				throw new Error( `${OperatorName}: [sortBy] field [${keys[ index ]}] must be 1 or -1 but found ${JSON.stringify( direction )} instead.` );
			}
		}
	};


	//---------------------------------------------------------------------
	// The numeric values of a group, with everything else left out.
	//
	// ***A non-numeric value is ignored rather than refused***, which is the rule $sum and $avg
	// already follow and is deliberately unlike the expression operators. An accumulator runs
	// over whatever a collection happens to hold, where an expression is authored against one
	// document, so a type error there is an authoring mistake and here it is just data.
	helper.NumericValues = function ( Documents, Args )
	{
		let values = helper.Values( Documents, Args );

		let numbers = [];
		for ( let index = 0; index < values.length; index++ )
		{
			if ( jsongin.ShortType( values[ index ] ) !== 'n' ) { continue; }
			numbers.push( values[ index ] );
		}

		return numbers;
	};


	//---------------------------------------------------------------------
	// Prepares values a positional accumulator reports as they were found.
	//
	// ***A missing value becomes a null.*** $firstN and $lastN report what was in the group at
	// a position, and a document which had no such field still occupied that position, so
	// leaving the value out would silently shorten the answer. An undefined cannot survive
	// being stored either, so null is what a caller sees.
	helper.AsReportedValues = function ( Values )
	{
		let reported = [];
		for ( let index = 0; index < Values.length; index++ )
		{
			if ( jsongin.ShortType( Values[ index ] ) === 'u' ) { reported.push( null ); }
			else { reported.push( Values[ index ] ); }
		}
		return reported;
	};


	//---------------------------------------------------------------------
	// The values a comparative accumulator can rank, in ascending order.
	//
	// ***A null or missing value is left out rather than ranked.*** $minN and $maxN answer
	// with the extremes of what a group holds, and a document which has no value has not
	// contributed one - the same rule $min and $max already follow. That is the opposite of
	// what AsReportedValues does, and the difference is deliberate on MongoDB's part.
	helper.ComparableValues = function ( Values )
	{
		let comparable = [];
		for ( let index = 0; index < Values.length; index++ )
		{
			if ( 'lu'.includes( jsongin.ShortType( Values[ index ] ) ) ) { continue; }
			comparable.push( Values[ index ] );
		}

		comparable.sort(
			function ( A, B )
			{
				return jsongin.CompareValues( A, B );
			} );

		return comparable;
	};


	//---------------------------------------------------------------------
	// The standard deviation of a list of numbers, over the divisor given.
	//
	// The divisor is what separates the two operators: $stdDevPop divides by the count and
	// $stdDevSamp by one less than it, so the calculation itself is written once here.
	helper.StandardDeviation = function ( Numbers, Divisor )
	{
		let total = 0;
		for ( let index = 0; index < Numbers.length; index++ )
		{
			total += Numbers[ index ];
		}
		let mean = total / Numbers.length;

		let squared = 0;
		for ( let index = 0; index < Numbers.length; index++ )
		{
			let deviation = Numbers[ index ] - mean;
			squared += ( deviation * deviation );
		}

		return Math.sqrt( squared / Divisor );
	};


	//---------------------------------------------------------------------
	return helper;
};
