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

			// Convert canonical integer text to numeric values, which address array elements.
			// Only canonical text converts: '0', '7', and the documented negative index '-1'.
			// Everything else stays a string, because it is a field name.
			//
			// This used to ask AsNumber(), which also accepts '01', '1e2', '0x10', and
			// 'Infinity'. Fields in those forms became array indices and their data was
			// unreachable. Verified against MongoDB 6.0.1: a query on 'a.01' finds
			// { a: { '01': 'x' } } and a query on 'a.1e2' finds { a: { '1e2': 'x' } }.
			const CANONICAL_INTEGER = /^-?(0|[1-9][0-9]*)$/;
			for ( let path_index = 0; path_index < path_elements.length; path_index++ )
			{
				let element = path_elements[ path_index ];
				if ( CANONICAL_INTEGER.test( element ) ) { element = Number( element ); }
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
