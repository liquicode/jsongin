'use strict';

const jsongin = require( '../jsongin' );

module.exports = function ( jsongin )
{
	function GetValue( Document, Path )
	{
		try
		{
			// Validate Path.
			// If the Path is empty (undefined, null, or empty string ""), then the Document is returned.
			switch ( jsongin.ShortType( Path ) )
			{
				case 'u': return Document;
				case 'l': return Document;
				case 'n': break;
				case 's': break;
				default: throw new Error( `Path is invalid [${JSON.stringify( Path )}].` );
			}
			if ( Path.length === 0 ) { return Document; }

			// Locate the path.
			let path_elements = jsongin.SplitPath( Path );
			let node = Document;
			for ( let path_index = 0; path_index < path_elements.length; path_index++ )
			{
				// Get the key.
				let key = path_elements[ path_index ];

				// Get the type of node and key.
				let st_key = jsongin.ShortType( key );
				let st_node = jsongin.ShortType( node );

				// Process the current node.
				if ( st_node === 'a' )
				{
					if ( st_key === 'n' )
					{
						// Check for reverse indexing and invalid index.
						if ( key < 0 ) { key = node.length + key; }
						if ( key < 0 ) { return undefined; }
						if ( key >= node.length ) { return undefined; }
						// Get the array element and continue down the path.
						node = node[ key ];
						continue;
					}
					else
					{
						// Execute the Implicit Iterator.
						let values = [];
						let sub_path = path_elements.slice( path_index ).join( '.' );
						for ( let index = 0; index < node.length; index++ )
						{
							let value = GetValue( node[ index ], sub_path );
							values.push( value );
						}
						return values;
					}
				}
				else if ( st_node === 'o' )
				{
					// Get the field value and continue down the path.
					node = node[ key ];
					continue;
				}
				else
				{
					// Field does not exist.
					return undefined;
				}
			}

			// Return the node value.
			return node;

		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'GetValue: ' + error.message ); }
			throw error;
		}
	};
	return GetValue;
};
