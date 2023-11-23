'use strict';

module.exports = function ( jsongin )
{
	function SetValue( Document, Path, Value )
	{
		try
		{
			// Validate the document.
			switch ( jsongin.ShortType( Document ) )
			{
				case 'o': break;
				case 'a': break;
				default: throw new Error( `Document must be an object or array.` );
			}

			// Validate Path.
			// If the Path is empty (undefined, null, or empty string ""), then false is returned.
			switch ( jsongin.ShortType( Path ) )
			{
				case 'u':
				case 'l':
					Path = '';
					break;
				case 'n': break;
				case 's': break;
				default: throw new Error( `Path is invalid [${JSON.stringify( Path )}].` );
			}
			if ( Path.length === 0 ) 
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `SetValue: Path is empty.` ); }
				return false;
			}

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
						// Check for reverse indexing.
						if ( key < 0 ) { key = node.length + key; }
						if ( key < 0 )
						{
							if ( jsongin.OpLog ) { jsongin.OpLog( `SetValue: Disallowed negative array index [${key}] in path [${Path}].` ); }
							return false;
						}
						// Get the array element and continue down the path.
						if ( path_index === ( path_elements.length - 1 ) )
						{
							node[ key ] = Value;
							return true;
						}
						else
						{
							if ( typeof node[ key ] === 'undefined' )
							{
								let st_next_key = jsongin.ShortType( path_elements[ path_index + 1 ] );
								if ( st_next_key === 'n' )
								{
									node[ key ] = [];
								}
								else
								{
									node[ key ] = {};
								}
							}
							node = node[ key ];
							continue;
						}
					}
					else
					{
						// Execute the Implicit Iterator.
						let values = [];
						let sub_path = path_elements.slice( path_index ).join( '.' );
						for ( let index = 0; index < node.length; index++ )
						{
							let result = SetValue( node[ index ], sub_path, Value );
							if ( result === false ) { return false; }
						}
						return true;
					}
				}
				else if ( st_node === 'o' )
				{
					if ( path_index === ( path_elements.length - 1 ) )
					{
						node[ key ] = Value;
						return true;
					}
					else if ( typeof node[ key ] === 'undefined' )
					{
						let st_next_key = jsongin.ShortType( path_elements[ path_index + 1 ] );
						if ( st_next_key === 'n' )
						{
							node[ key ] = [];
						}
						else
						{
							node[ key ] = {};
						}
						node = node[ key ];
						continue;
					}
					else
					{
						node = node[ key ];
						continue;
					}
				}
				else
				{
					throw new Error( `The element [${key}] of the path [${Path}] must reference an object or array.` );
				}
				return false; // Code should be inaccessible.
			}

			// Return, OK.
			return true;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'SetValue: ' + error.message ); }
			throw error;
		}
	};
	return SetValue;
};
