'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Locates the array which holds the element a path addresses.
	// Returns null when the path does not address an array element.
	//
	// A numeric key does not settle it on its own, because a document field may legitimately
	// be named '1', and MongoDB removes that key rather than nulling it. The parent has to be
	// an array for this to be the array element case.
	//
	// The parent is walked here rather than being read with GetValue. GetValue gathers a non
	// numeric key against an array into a new array, and a write into that gathered copy would
	// be discarded without any sign of it.
	function locate_array_element( Document, Path )
	{
		let path_elements = jsongin.SplitPath( Path );
		if ( path_elements.length === 0 ) { return null; }

		let last_key = path_elements[ path_elements.length - 1 ];
		if ( jsongin.ShortType( last_key ) !== 'n' ) { return null; }

		// Walk to the parent.
		let node = Document;
		for ( let path_index = 0; path_index < ( path_elements.length - 1 ); path_index++ )
		{
			let key = path_elements[ path_index ];
			if ( jsongin.ShortType( node ) === 'a' )
			{
				if ( jsongin.ShortType( key ) !== 'n' ) { return null; }
				// Reverse indexing, as GetValue and DeleteValue both do.
				if ( key < 0 ) { key = node.length + key; }
			}
			node = node[ key ];
			if ( 'oa'.includes( jsongin.ShortType( node ) ) === false ) { return null; }
		}
		if ( jsongin.ShortType( node ) !== 'a' ) { return null; }

		let index = last_key;
		if ( index < 0 ) { index = node.length + index; }
		if ( ( index < 0 ) || ( index >= node.length ) ) { return null; }

		return { Array: node, Index: index };
	}


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Update',
		TopLevel: true,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Update: function ( Document, UpdateFields )
		{
			try
			{
				if ( jsongin.ShortType( UpdateFields ) !== 'o' ) { throw new Error( `The UpdateFields parameter must be an object.` ); }

				for ( let field in UpdateFields )
				{
					// An array element is set to null rather than being removed, which keeps
					// the array's length and the positions of the elements after it.
					// Verified against MongoDB 6.0.1.
					// DeleteValue is deliberately not used for this case. It mirrors the
					// Javascript delete operator and leaves a sparse hole, which is its
					// documented contract, and a hole is not representable in JSON: it only
					// looked like a null because JSON.stringify renders it as one.
					let element = locate_array_element( Document, field );
					if ( element !== null )
					{
						element.Array[ element.Index ] = null;
						continue;
					}

					// The field is removed, rather than being set to undefined, so that
					// Object.keys() and the document's contents agree with each other.
					let result = jsongin.DeleteValue( Document, field );
					if ( result === false )
					{
						// Naming a field the document does not have is not an error. MongoDB
						// reports a successful update with modifiedCount 0 in that case,
						// verified against MongoDB 6.0.1, so this is a no-op rather than a
						// failure. DeleteValue throws on a malformed document or path, which
						// is the real error path.
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$unset: The field [${field}] was not present and was left alone.` ); }
						continue;
					}
				}

				return true;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$unset: ${error.message}` ); }
				throw error;
			}
			return; // Code should be inaccessible.
		},

	};

	// Return the operator.
	return operator;
};
