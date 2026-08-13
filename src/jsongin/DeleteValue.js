'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Removes a field from a document. The Path may be in dot notation.
	// Returns true when the field was removed, and false when the path could not be resolved.
	// The key is removed rather than being set to undefined, so that Object.keys() and the
	// document's contents agree with each other.
	// Note that a path which addresses an array element leaves a hole in the array rather than
	// shortening it, the same way the Javascript delete operator does.
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

			// Locate the field's parent.
			let node = Document;
			for ( let index = 0; index < ( path_elements.length - 1 ); index++ )
			{
				node = node[ path_elements[ index ] ];
				if ( 'oa'.includes( jsongin.ShortType( node ) ) === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `DeleteValue: The path [${Path}] does not exist.` ); }
					return false;
				}
			}

			// Remove the field.
			delete node[ path_elements[ path_elements.length - 1 ] ];
			return true;
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
