'use strict';

module.exports = function ( jsongin )
{
	function SplitPath( Path )
	{
		try 
		{
			// Validate Path.
			// If the Path is empty (undefined, null, or empty string ""), then return an empty array [].
			switch ( jsongin.ShortType( Path ) )
			{
				case 'u': return [];
				case 'l': return [];
				case 'n':
					Path = '' + Path;
					break;
				case 's': break;
				default: throw new Error( `Path is invalid [${JSON.stringify( Path )}].` );
			}
			if ( Path.length === 0 ) { return []; }

			// Split the path.
			let path_elements = Path.split( '.' );

			// Convert numeric strings to numeric values.
			for ( let path_index = 0; path_index < path_elements.length; path_index++ )
			{
				let element = path_elements[ path_index ];
				if ( jsongin.AsNumber( element ) !== null ) { element = Number( element ); }
				path_elements[ path_index ] = element;
			}

			// Return an array path elements.
			return path_elements;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'SplitPath: ' + error.message ); }
			throw error;
		}
	};
	return SplitPath;
};
