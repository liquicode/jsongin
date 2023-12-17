'use strict';

module.exports = function ( jsongin )
{
	function Distinct( Documents, DistinctCriteria ) 
	{
		try
		{
			if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }
			if ( jsongin.ShortType( DistinctCriteria ) !== 'o' ) { throw new Error( `DistinctCriteria must be an object.` ); }
			let distincts = {};
			for ( let index = 0; index < Documents.length; index++ )
			{
				let document = Documents[ index ];
				let document_key = '';
				let distinct = {};
				for ( let key in DistinctCriteria )
				{
					let value = jsongin.GetValue( document, key );
					jsongin.SetValue( distinct, key, value );
					document_key += JSON.stringify( value );
				}
				distincts[ document_key ] = distinct;
			}
			return Object.values( distincts );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Sort: ' + error.message ); }
			throw error;
		}
	};
	return Distinct;
};
