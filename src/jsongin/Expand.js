'use strict';

module.exports = function ( jsongin )
{
	function Expand( Document )
	{
		try
		{
			if ( jsongin.ShortType( Document ) !== 'o' ) { throw new Error( `Document must be an object.` ); }
			let expanded = {};
			for ( let key in Document )
			{
				jsongin.SetValue( expanded, key, Document[ key ] );
			}
			return expanded;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Expand: ' + error.message ); }
			throw error;
		}
	};
	return Expand;
};
