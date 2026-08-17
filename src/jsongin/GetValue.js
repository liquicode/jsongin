'use strict';

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
						// A numeric key indexes the array, as MongoDB does when it resolves a
						// query path: { 'a.2': 3 } matches { a: [ 1, 2, 3 ] }.
						// A negative index addresses nothing. MongoDB has no reverse indexing:
						// it reads '-1' as a field name, and an array has no such field, so
						// { 'a.-1': 3 } matches nothing. Verified against MongoDB 6.0.1.
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
