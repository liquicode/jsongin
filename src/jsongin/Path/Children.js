'use strict';

module.exports = function ( jsongin )
{
	function Children( Document, Path ) 
	{
		try
		{
			if ( jsongin.ShortType( Document ) !== 'o' ) { throw new Error( `Document must be an object.` ); }
			if ( jsongin.ShortType( Path ) !== 's' ) { throw new Error( `Path must be a string.` ); }

			let node = jsongin.GetValue( Document, Path );
			let st_node = jsongin.ShortType( node );
			if ( !'oa'.includes( st_node ) ) { return null; }
			let children = [];
			if ( st_node === 'o' )
			{
				for ( let key in node )
				{
					children.push( `${Path}.${key}` );
				}
			}
			else if ( st_node === 'a' )
			{
				for ( let index = 0; index < node.length; index++ )
				{
					children.push( `${Path}.${index}` );
				}
			}
			return children;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Path.Children: ' + error.message ); }
			throw error;
		}
	};
	return Children;
};
