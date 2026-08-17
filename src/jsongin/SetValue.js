'use strict';

module.exports = function ( jsongin )
{
	//---------------------------------------------------------------------
	// Writes Value at Path within Document.
	//
	// CreateArrays decides what a path element which is not there becomes. It defaults to
	// false, which creates a document, whatever the next key looks like — the rule MongoDB
	// follows, and the one every update operator needs. Pass true to create an array when the
	// next key is numeric, which is what Expand() wants: it is turning a flattened document
	// back into a hierarchy and a numeric key there did come from an array.
	// Decides what to create for a path element which is not there.
	function new_container( NextKey, CreateArrays )
	{
		if ( CreateArrays !== true ) { return {}; }
		if ( jsongin.ShortType( NextKey ) === 'n' ) { return []; }
		return {};
	}


	function SetValue( Document, Path, Value, CreateArrays = false )
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
					if ( ( st_key === 'n' ) && ( key < 0 ) )
					{
						// A negative index is not an index. MongoDB reads '-1' as a field
						// name, and a field cannot be created on an array, so it refuses the
						// write with "Cannot create field '-1' in element {a: [ 1, 2, 3 ]}".
						// Verified against MongoDB 6.0.1.
						// This used to index from the end of the array, which was a jsongin
						// path extension with no MongoDB counterpart on either side.
						let container_path = path_elements.slice( 0, path_index ).join( '.' );
						throw new Error( `Cannot create field [${key}] in the array at [${container_path}].` );
					}
					if ( st_key === 'n' )
					{
						// A write past the end of an array fills the gap with nulls rather than
						// leaving holes. Verified against MongoDB 6.0.1, where { a: [ 1 ] }
						// with { $set: { 'a.4': 9 } } gives [ 1, null, null, null, 9 ].
						// A hole is not representable in JSON, and it only ever looked like a
						// null because JSON.stringify renders it as one.
						while ( node.length < key ) { node.push( null ); }

						// Get the array element and continue down the path.
						if ( path_index === ( path_elements.length - 1 ) )
						{
							node[ key ] = Value;
							return true;
						}
						else
						{
							// A path element which is not there is created as a document, unless
							// CreateArrays asks otherwise. See the note in the object branch.
							if ( ( typeof node[ key ] === 'undefined' ) || ( node[ key ] === null ) )
							{
								node[ key ] = new_container( path_elements[ path_index + 1 ], CreateArrays );
							}
							node = node[ key ];
							continue;
						}
					}
					else
					{
						// A non numeric key against an array.
						// MongoDB rejects this outright, with "Cannot create field 'x' in
						// element {a: [ ... ]}", for $set and for every arithmetic update
						// operator. Verified against MongoDB 6.0.1.
						// Reaching through an array on the write side requires the all
						// positional operator, 'a.$[].x'.
						let container_path = path_elements.slice( 0, path_index ).join( '.' );
						throw new Error( `Cannot create field [${key}] in the array at [${container_path}].` );
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
						// A path element which is not there is created as a ***document***,
						// whatever the next key looks like. A numeric key does not imply an
						// array: MongoDB creates { a: { '0': 9 } } for { $set: { 'a.0': 9 } }
						// against a document which has no 'a', and only the array update
						// operators ever create an array. Verified against MongoDB 6.0.1.
						// This used to create an array whenever the next key was numeric, which
						// produced { a: [ 9 ] } instead, and it is still what CreateArrays asks
						// for on behalf of Expand().
						node[ key ] = new_container( path_elements[ path_index + 1 ], CreateArrays );
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
