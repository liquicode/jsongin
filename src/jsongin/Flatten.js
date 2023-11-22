'use strict';

module.exports = function ( Engine )
{
	function Flatten( Document ) 
	{
		let flattened = {};
		function r_flatten( Node, Path )
		{
			let short_type = Engine.ShortType( Node );
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
		r_flatten( Document, '' );
		return flattened;
	};
	return Flatten;
};
