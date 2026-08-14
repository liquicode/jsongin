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
				let document_key_parts = [];
				let distinct = {};
				for ( let key in DistinctCriteria )
				{
					let value = jsongin.GetValue( document, key );

					// Cloned on the way in, so that the result never aliases the given documents.
					jsongin.SetValue( distinct, key, jsongin.SafeClone( value ) );

					// The short type is part of each field's key, so that values which serialize
					// alike but are of different types, such as a date and its ISO string, are
					// not treated as the same value. This is what the $group stage does.
					document_key_parts.push( jsongin.ShortType( value ) + ':' + JSON.stringify( value ) );
				}

				// Combined through JSON.stringify rather than concatenated, so that one field's
				// value cannot run into the next one. Concatenating them gave { a: 1, b: 23 }
				// and { a: 12, b: 3 } the same key and dropped one of the two.
				let document_key = JSON.stringify( document_key_parts );

				distincts[ document_key ] = distinct;
			}
			return Object.values( distincts );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Distinct: ' + error.message ); }
			throw error;
		}
	};
	return Distinct;
};
