'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Merges DocumentB into DocumentA and returns the merged document.
	// Neither of the given documents is modified.
	//
	// The merge is member-wise and recursive. Two sub-documents are merged into each other,
	// while any other value in DocumentB replaces the one in DocumentA.
	// Arrays, dates, and regular expressions are values here rather than structures to
	// descend into, so DocumentB's copy of one replaces DocumentA's.
	//
	// Note that null is a value. A field set to null in DocumentB is set to null in the
	// result rather than being removed from it. This is a deliberate difference from
	// RFC 7386 (JSON Merge Patch), which spends null on deletion because the format has no
	// other way to express it. jsongin has $unset and DeleteValue for that.
	// Merge therefore adds and overwrites fields, but never removes one.

	function Merge( DocumentA, DocumentB )
	{
		try
		{
			// Validate the documents.
			// A missing document is treated as an empty one, so that a call such as
			// Merge( DEFAULTS, options ) still works when no options were supplied.
			let st_a = jsongin.ShortType( DocumentA );
			let st_b = jsongin.ShortType( DocumentB );
			if ( 'lu'.includes( st_a ) ) { DocumentA = {}; st_a = 'o'; }
			if ( 'lu'.includes( st_b ) ) { DocumentB = {}; st_b = 'o'; }
			if ( st_a !== 'o' ) { throw new Error( `DocumentA must be an object.` ); }
			if ( st_b !== 'o' ) { throw new Error( `DocumentB must be an object.` ); }

			let merged = jsongin.SafeClone( DocumentA );
			merge_children( merged, DocumentB );
			return merged;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Merge: ' + error.message ); }
			throw error;
		}
	}


	//---------------------------------------------------------------------
	// Copies the fields of ParentB into ParentA.
	// Recurses only when both sides hold a sub-document. Every other value is replaced.

	function merge_children( ParentA, ParentB )
	{
		let keys = Object.keys( ParentB );
		for ( let index = 0; index < keys.length; index++ )
		{
			let key = keys[ index ];
			let value_a = ParentA[ key ];
			let value_b = ParentB[ key ];

			// A field which was not supplied is not a field. Skipping it avoids leaving a
			// key which holds undefined, which Object.keys() reports but JSON does not.
			if ( jsongin.ShortType( value_b ) === 'u' ) { continue; }

			if ( ( jsongin.ShortType( value_a ) === 'o' )
				&& ( jsongin.ShortType( value_b ) === 'o' ) )
			{
				// Merge two sub-documents.
				merge_children( value_a, value_b );
			}
			else
			{
				// Replace the value.
				ParentA[ key ] = jsongin.SafeClone( value_b );
			}
		}
	}


	//---------------------------------------------------------------------
	return Merge;
};
