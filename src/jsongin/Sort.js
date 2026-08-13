'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	function is_empty_array( Value )
	{
		if ( jsongin.ShortType( Value ) !== 'a' ) { return false; }
		return ( Value.length === 0 );
	};


	//---------------------------------------------------------------------
	// Reduces a sort field value to a single sort key.
	// A field which holds an array is sorted by its smallest element when ascending,
	// and by its largest element when descending. This matches MongoDB, and it differs
	// from the element-wise comparison which CompareValues performs on two arrays.
	// An empty array has no element to reduce to and is returned as-is. It is given its
	// sort position by compare_sort_keys below.
	function sort_key( Value, Ascending )
	{
		if ( jsongin.ShortType( Value ) !== 'a' ) { return Value; }
		if ( Value.length === 0 ) { return Value; }

		let selected = Value[ 0 ];
		for ( let index = 1; index < Value.length; index++ )
		{
			let result = jsongin.CompareValues( Value[ index ], selected );
			if ( Ascending === true )
			{
				if ( result < 0 ) { selected = Value[ index ]; }
			}
			else
			{
				if ( result > 0 ) { selected = Value[ index ]; }
			}
		}
		return selected;
	};


	//---------------------------------------------------------------------
	// Compares two sort keys.
	// A field holding an empty array sorts below every other value, including null and
	// missing fields. This is a sorting rule only. When two arrays are compared against
	// each other as values, by CompareValues or by the expression operators, an empty
	// array sorts with the other arrays instead.
	function compare_sort_keys( ValueA, ValueB )
	{
		let empty_a = is_empty_array( ValueA );
		let empty_b = is_empty_array( ValueB );
		if ( empty_a && empty_b ) { return 0; }
		if ( empty_a ) { return -1; }
		if ( empty_b ) { return 1; }
		return jsongin.CompareValues( ValueA, ValueB );
	};


	//---------------------------------------------------------------------
	function Sort( Documents, SortCriteria )
	{
		try
		{
			if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
			if ( jsongin.ShortType( SortCriteria ) !== 'o' ) { throw new Error( `SortCriteria must be an object.` ); }

			// Sorts the array in place.
			Documents.sort(
				function ( A, B )
				{
					for ( let key in SortCriteria )
					{
						let direction = SortCriteria[ key ];
						if ( direction === 0 ) { continue; }
						let ascending = ( direction > 0 );

						let value_a = sort_key( jsongin.GetValue( A, key ), ascending );
						let value_b = sort_key( jsongin.GetValue( B, key ), ascending );

						let result = compare_sort_keys( value_a, value_b );
						if ( result !== 0 )
						{
							if ( ascending ) { return result; }
							return -result;
						}
					}
					return 0;
				} );

			return Documents;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Sort: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Sort;
};
