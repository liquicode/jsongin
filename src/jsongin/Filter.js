'use strict';

module.exports = function ( jsongin )
{
	function Filter( Documents, QueryCriteria ) 
	{
		try
		{
			if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
			if ( jsongin.ShortType( QueryCriteria ) !== 'o' ) { throw new Error( `QueryCriteria must be an object.` ); }
			let filtered = [];
			for ( let index = 0; index < Documents.length; index++ )
			{
				if ( jsongin.Query( Documents[ index ], QueryCriteria ) )
				{
					filtered.push( Documents[ index ] );
				}
			}
			return filtered;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Filter: ' + error.message ); }
			throw error;
		}
	};
	return Filter;
};
