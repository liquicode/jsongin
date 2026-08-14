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
					// An empty container holds no leaf to descend to, so emit the container
					// itself and let Expand() put it back. Without this it contributes nothing
					// to the result and disappears from the round trip.
					// A fresh container is emitted rather than the one from the document, so
					// that the flattened result never aliases its source.
					// The root is the exception: Flatten( {} ) is {}, and there is no path to
					// record it under.
					if ( Object.keys( Node ).length === 0 )
					{
						if ( Path ) { flattened[ Path ] = {}; }
						return;
					}
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
					// The same rule as for an empty object, above.
					if ( Node.length === 0 )
					{
						if ( Path ) { flattened[ Path ] = []; }
						return;
					}
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
