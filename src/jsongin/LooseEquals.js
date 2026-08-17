'use strict';

module.exports = function ( jsongin )
{

	/*
		Compares two values loosely and returns true or false.

		Loose means two things:
			1. Primitive values are compared with the Javascript == operator, so types coerce.
			2. Objects and arrays match regardless of the order of their keys and elements.

		This is the loose counterpart of CompareValues, which is strict and order sensitive.
		It stands in the same relation to the $eqx query operator that CompareValues does to
		$eq: the operator resolves a path to the values it can mean and calls here to compare
		each one of them against the match value.

		This function is symmetric. LooseEquals( A, B ) always answers what LooseEquals( B, A )
		answers, and every comparison below requires both values to be of the same kind before
		it will compare them.

		Symmetry is why this is a function of the engine rather than the $eqx operator applied
		to two whole values, which is what it used to be. A query operator is not symmetric:
		its first parameter is a document field and its second is a match value, and a match
		value is allowed to equal an element of a document array. StrictEquals carries the same
		note for the same reason.

		> Fixed in v0.1.0 :
		  LooseEquals( {}, { a: 1 } ) returned true, and so did LooseEquals( { a: 1 }, { a: 1,
		  b: 2 } ). The object comparison walked the keys of the first value only, so a key
		  which only the second value carried was never examined and an empty object loosely
		  equalled everything. Both now answer false, and both answer it in either order.
	*/


	//---------------------------------------------------------------------
	// Compares two objects, key by key, ignoring the order of their keys.
	//
	// Every key appearing in either object is compared, so that a key which only one of them
	// carries is a difference rather than something nobody looks at.
	//
	// A key which is not there reads as undefined, which the null/undefined rule below then
	// treats as equivalent to null. That is this function's own rule applied one level down
	// rather than a second rule: LooseEquals( null, undefined ) is true, so { a: null } and {}
	// are loosely equal. StrictEquals reports those two as different, which is the difference
	// between the strict comparison and the loose one.
	function equals_objects( ObjectA, ObjectB )
	{
		let keys = Object.keys( ObjectA );
		let keys_b = Object.keys( ObjectB );
		for ( let index = 0; index < keys_b.length; index++ )
		{
			if ( keys.includes( keys_b[ index ] ) === false ) { keys.push( keys_b[ index ] ); }
		}

		for ( let index = 0; index < keys.length; index++ )
		{
			let key = keys[ index ];
			if ( LooseEquals( ObjectA[ key ], ObjectB[ key ] ) === false ) { return false; }
		}
		return true;
	};


	//---------------------------------------------------------------------
	// Compares two arrays, ignoring the order of their elements.
	//
	// The arrays must hold the same number of elements, and every element of one must be
	// paired with an element of the other which it loosely equals. An element is removed from
	// the working copy once it has been paired, so [ 1, 1 ] does not match [ 1, 2 ] by pairing
	// both of its elements with the same 1.
	function equals_arrays( ArrayA, ArrayB )
	{
		if ( ArrayA.length !== ArrayB.length ) { return false; }

		let working = [ ...ArrayB ];
		for ( let index_a = 0; index_a < ArrayA.length; index_a++ )
		{
			let matched = false;
			for ( let index_working = 0; index_working < working.length; index_working++ )
			{
				if ( LooseEquals( ArrayA[ index_a ], working[ index_working ] ) === true )
				{
					matched = true;
					working.splice( index_working, 1 );
					break;
				}
			}
			if ( matched === false ) { return false; }
		}
		return true;
	};


	//---------------------------------------------------------------------
	function LooseEquals( ValueA, ValueB )
	{
		try
		{
			let type_a = jsongin.ShortType( ValueA );
			let type_b = jsongin.ShortType( ValueB );

			if ( 'lu'.includes( type_a ) && 'lu'.includes( type_b ) )
			{
				return true; // null and undefined are always equivalent.
			}
			else if ( 'bns'.includes( type_a ) && 'bns'.includes( type_b ) )
			{
				return ( ValueA == ValueB ); // Equivalence of primitive types.
			}
			else if ( ( type_a === 'd' ) && ( type_b === 'd' ) )
			{
				// Two Date objects are never == to each other, so compare their time values.
				// Without this, dates would fall into the member-wise object comparison,
				// where a Date presents no members and every pair of dates matches.
				return ( ValueA.getTime() === ValueB.getTime() );
			}
			else if ( ( type_a === 'r' ) && ( type_b === 'r' ) )
			{
				// Two Regexp objects are never == to each other either, so compare what
				// actually identifies them. This is a comparison of two patterns and not a
				// test of one value against the other, which is what $regex is for.
				if ( ValueA.source !== ValueB.source ) { return false; }
				if ( ValueA.flags !== ValueB.flags ) { return false; }
				return true;
			}
			else if ( ( type_a === 'o' ) && ( type_b === 'o' ) )
			{
				return equals_objects( ValueA, ValueB );
			}
			else if ( ( type_a === 'a' ) && ( type_b === 'a' ) )
			{
				return equals_arrays( ValueA, ValueB );
			}

			// Values of different kinds, and types with no equivalence at all, such as
			// functions and symbols. Loose does not mean a string can equal an object.
			if ( jsongin.OpLog ) { jsongin.OpLog( `LooseEquals: cannot compare [${type_a}] type with [${type_b}] type.` ); }
			return false;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( `LooseEquals: ${error.message}` ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return LooseEquals;
};
