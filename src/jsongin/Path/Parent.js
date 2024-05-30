'use strict';

module.exports = function ( jsongin )
{
	function Parent( Document, Path ) 
	{
		try
		{
			if ( jsongin.ShortType( Document ) !== 'o' ) { throw new Error( `Document must be an object.` ); }
			if ( jsongin.ShortType( Path ) !== 's' ) { throw new Error( `Path must be a string.` ); }

			let path_elements = Path.split( '.' );
			if ( path_elements.length === 0 ) { return null; }
			else if ( path_elements.length === 1 ) { return null; }
			return path_elements[ path_elements.length - 2 ];
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Path.Parent: ' + error.message ); }
			throw error;
		}
	};
	return Parent;
};
