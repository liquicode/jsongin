'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Removes a field from a document. The Path may be in dot notation.
	// Returns true when a field was removed, and false when nothing was removed, which
	// covers a path whose parent does not resolve and a field which was never there.
	// The key is removed rather than being set to undefined, so that Object.keys() and the
	// document's contents agree with each other.
	// Note that a path which addresses an array element leaves a hole in the array rather than
	// shortening it, the same way the Javascript delete operator does.
	// A non numeric key against an array runs the implicit iterator and applies to every
	// element, matching GetValue and SetValue. That is a jsongin path extension: MongoDB
	// requires the all positional operator, as in 'a.$[].x', to unset through an array.
	function DeleteValue( Document, Path )
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

			// Validate the path.
			switch ( jsongin.ShortType( Path ) )
			{
				case 'n': break;
				case 's': break;
				default: throw new Error( `Path is invalid [${JSON.stringify( Path )}].` );
			}

			let path_elements = jsongin.SplitPath( Path );
			if ( path_elements.length === 0 )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `DeleteValue: Path is empty.` ); }
				return false;
			}

			// Walk the path.
			let node = Document;
			for ( let path_index = 0; path_index < path_elements.length; path_index++ )
			{
				let key = path_elements[ path_index ];
				let st_key = jsongin.ShortType( key );
				let st_node = jsongin.ShortType( node );

				if ( ( st_node === 'a' ) && ( st_key !== 'n' ) )
				{
					// A non numeric key against an array.
					// MongoDB's $unset does nothing here and reports a successful update with
					// modifiedCount 0. Verified against MongoDB 6.0.1. Returning false is what
					// produces that: $unset treats it as a no-op rather than a failure.
					// Reaching through an array on the write side requires the all positional
					// operator, 'a.$[].x'.
					if ( jsongin.OpLog ) { jsongin.OpLog( `DeleteValue: The path [${Path}] reaches into an array by field name.` ); }
					return false;
				}

				if ( ( st_node === 'a' ) && ( st_key === 'n' ) )
				{
					// A numeric key indexes the array. A negative index addresses nothing:
					// MongoDB reads '-1' as a field name, and an array has no such field, so
					// $unset of 'a.-1' is a no-op. Verified against MongoDB 6.0.1.
					if ( ( key < 0 ) || ( key >= node.length ) )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `DeleteValue: The index [${path_elements[ path_index ]}] of the path [${Path}] is out of range.` ); }
						return false;
					}
				}

				// The last element of the path is the field to remove.
				if ( path_index === ( path_elements.length - 1 ) )
				{
					// Report whether a field was actually removed. The Javascript delete
					// operator returns true for a property which was never there, so testing
					// it would report success for every path whose parent happened to resolve.
					if ( Object.prototype.hasOwnProperty.call( node, key ) === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `DeleteValue: The path [${Path}] does not exist.` ); }
						return false;
					}
					delete node[ key ];
					return true;
				}

				// Continue down the path.
				node = node[ key ];
				if ( 'oa'.includes( jsongin.ShortType( node ) ) === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `DeleteValue: The path [${Path}] does not exist.` ); }
					return false;
				}
			}
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'DeleteValue: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return DeleteValue;
};
