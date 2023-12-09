'use strict';

module.exports = function ( jsongin )
{
	function Sort( Documents, SortCriteria ) 
	{
		try
		{
			if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
			if ( jsongin.ShortType( SortCriteria ) !== 'o' ) { throw new Error( `SortCriteria must be an object.` ); }
			Documents.sort(
				function ( A, B )
				{
					for ( key in SortCriteria )
					{
						let direction = SortCriteria[ key ];
						if ( direction === 0 ) { continue; }
						let ascending = ( direction > 0 );
						let value_a = jsongin.GetValue( A, key );
						let value_b = jsongin.GetValue( B, key );
						if ( value_a > value_b )
						{
							if ( ascending ) { return 1; }
							else { return -1; }
						}
						else if ( value_a < value_b )
						{
							if ( ascending ) { return -1; }
							else { return 1; }
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
	return Sort;
};
