'use strict';

module.exports = function ( jsongin )
{
	function Flatten( Document ) 
	{
		try
		{
			let flattened = {};
			function r_flatten( Node, Path )
			{
				let short_type = jsongin.ShortType( Node );
				if ( short_type === 'o' )
				{
					for ( let key in Node )
					{
						let path = Path;
						if ( !path ) { path = key; }
						else { path += '.' + key; }
						r_flatten( Node[ key ], path );
					}
				}
				else if ( short_type === 'a' )
				{
					for ( let index = 0; index < Node.length; index++ )
					{
						let path = Path;
						if ( !path ) { path = '' + index; }
						else { path += '.' + index; }
						r_flatten( Node[ index ], path );
					}
				}
				else
				{
					flattened[ Path ] = Node;
				}
				return;
			}
			if ( !'oa'.includes( jsongin.ShortType( Document ) ) ) { throw new Error( `Document must be an object or array.` ); }
			r_flatten( Document, '' );
			return flattened;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Flatten: ' + error.message ); }
			throw error;
		}
	};
	return Flatten;
};
