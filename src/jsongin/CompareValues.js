'use strict';

module.exports = function ( jsongin )
{

	/*
		Compares two values and returns -1, 0, or 1.

		Values of different types are ordered by MongoDB's documented comparison order:
			null/missing < numbers < strings < objects < arrays < booleans < dates < regex
		MongoDB Ref: https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order

		This is the comparison used by the expression comparison operators ($eq, $gt, ...),
		by the expression operators $min and $max, and by Sort().

		Note that arrays are compared element by element, which is what an expression such as
		{ $lt: [ '$a', '$b' ] } does. Sorting documents by a field which holds an array is a
		different rule, and Sort() handles that before calling here.
	*/


	//---------------------------------------------------------------------
	// Returns the comparison rank of a value's type.
	function rank_of( Value )
	{
		let short_type = jsongin.ShortType( Value );
		switch ( short_type )
		{
			case 'u': return 1; // Missing values sort with null.
			case 'l': return 1;
			case 'n': return 2;
			case 's': return 3;
			case 'o': return 4;
			case 'a': return 5;
			case 'b': return 6;
			case 'd': return 7;
			case 'r': return 8;
		}
		throw new Error( `Cannot compare values of type [${short_type}].` );
	};


	//---------------------------------------------------------------------
	// Compares two arrays, element by element.
	function compare_arrays( ArrayA, ArrayB )
	{
		let count = Math.min( ArrayA.length, ArrayB.length );
		for ( let index = 0; index < count; index++ )
		{
			let result = CompareValues( ArrayA[ index ], ArrayB[ index ] );
			if ( result !== 0 ) { return result; }
		}
		if ( ArrayA.length < ArrayB.length ) { return -1; }
		if ( ArrayA.length > ArrayB.length ) { return 1; }
		return 0;
	};


	//---------------------------------------------------------------------
	// Compares two objects, field by field, comparing key names before values.
	function compare_objects( ObjectA, ObjectB )
	{
		let keys_a = Object.keys( ObjectA );
		let keys_b = Object.keys( ObjectB );
		let count = Math.min( keys_a.length, keys_b.length );
		for ( let index = 0; index < count; index++ )
		{
			if ( keys_a[ index ] < keys_b[ index ] ) { return -1; }
			if ( keys_a[ index ] > keys_b[ index ] ) { return 1; }
			let result = CompareValues( ObjectA[ keys_a[ index ] ], ObjectB[ keys_b[ index ] ] );
			if ( result !== 0 ) { return result; }
		}
		if ( keys_a.length < keys_b.length ) { return -1; }
		if ( keys_a.length > keys_b.length ) { return 1; }
		return 0;
	};


	//---------------------------------------------------------------------
	function CompareValues( ValueA, ValueB )
	{
		// Compare values of different types by their type rank.
		let rank_a = rank_of( ValueA );
		let rank_b = rank_of( ValueB );
		if ( rank_a < rank_b ) { return -1; }
		if ( rank_a > rank_b ) { return 1; }

		// Null and missing values are equivalent.
		if ( rank_a === 1 ) { return 0; }

		// Compare dates by their timestamp.
		if ( rank_a === 7 )
		{
			if ( ValueA.getTime() < ValueB.getTime() ) { return -1; }
			if ( ValueA.getTime() > ValueB.getTime() ) { return 1; }
			return 0;
		}

		// Compare regular expressions by their text.
		if ( rank_a === 8 )
		{
			let text_a = ValueA.toString();
			let text_b = ValueB.toString();
			if ( text_a < text_b ) { return -1; }
			if ( text_a > text_b ) { return 1; }
			return 0;
		}

		// Compare structured values.
		if ( rank_a === 4 ) { return compare_objects( ValueA, ValueB ); }
		if ( rank_a === 5 ) { return compare_arrays( ValueA, ValueB ); }

		// NaN is a number which is neither less than, equal to, nor greater than anything,
		// including itself. Falling through to the comparisons below would report it as equal
		// to every number, which makes the ordering inconsistent and a sort of the values
		// arbitrary. MongoDB orders NaN below every other number, so that is what happens here.
		if ( rank_a === 2 )
		{
			let a_is_nan = isNaN( ValueA );
			let b_is_nan = isNaN( ValueB );
			if ( a_is_nan && b_is_nan ) { return 0; }
			if ( a_is_nan ) { return -1; }
			if ( b_is_nan ) { return 1; }
		}

		// Compare primitive values. Booleans compare as false < true.
		if ( ValueA < ValueB ) { return -1; }
		if ( ValueA > ValueB ) { return 1; }
		return 0;
	};


	//---------------------------------------------------------------------
	return CompareValues;
};
