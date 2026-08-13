'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Returns true when a key is absent from a node, or is present holding undefined.
	// A key holding undefined counts as absent, so that a document which carries one does not
	// read as different from a document which never had the field at all.
	function is_missing( Node, Key )
	{
		if ( Object.prototype.hasOwnProperty.call( Node, Key ) === false ) { return true; }
		return ( typeof Node[ Key ] === 'undefined' );
	};


	//---------------------------------------------------------------------
	// Returns the keys of both nodes, in Before order, followed by the keys new to After.
	function merged_keys( BeforeNode, AfterNode )
	{
		let keys = Object.keys( BeforeNode );
		let after_keys = Object.keys( AfterNode );
		for ( let index = 0; index < after_keys.length; index++ )
		{
			if ( keys.includes( after_keys[ index ] ) === false ) { keys.push( after_keys[ index ] ); }
		}
		return keys;
	};


	//---------------------------------------------------------------------
	// Describes the changes between two documents as a jsongin update document.
	// The result applies with Update(), so Update( Before, Diff( Before, After ) ) is After.
	// Neither document is modified.
	function Diff( Before, After )
	{
		try
		{
			if ( jsongin.ShortType( Before ) !== 'o' ) { throw new Error( `Before must be an object.` ); }
			if ( jsongin.ShortType( After ) !== 'o' ) { throw new Error( `After must be an object.` ); }

			let set_fields = {};
			let unset_fields = {};

			function diff_node( BeforeNode, AfterNode, Path )
			{
				let keys = merged_keys( BeforeNode, AfterNode );
				for ( let index = 0; index < keys.length; index++ )
				{
					let key = keys[ index ];
					let path = key;
					if ( Path ) { path = Path + '.' + key; }

					let in_before = ( is_missing( BeforeNode, key ) === false );
					let in_after = ( is_missing( AfterNode, key ) === false );

					// The field is missing from both documents.
					if ( ( in_before === false ) && ( in_after === false ) ) { continue; }

					// The field was removed.
					if ( in_after === false )
					{
						unset_fields[ path ] = '';
						continue;
					}

					// The field was added.
					if ( in_before === false )
					{
						set_fields[ path ] = jsongin.SafeClone( AfterNode[ key ] );
						continue;
					}

					let before_value = BeforeNode[ key ];
					let after_value = AfterNode[ key ];

					// Only objects are descended into, so that a change is described at the
					// deepest path which changed. An array is a value and is compared whole,
					// as is a date.
					if ( ( jsongin.ShortType( before_value ) === 'o' ) && ( jsongin.ShortType( after_value ) === 'o' ) )
					{
						diff_node( before_value, after_value, path );
						continue;
					}

					// The field changed.
					if ( jsongin.StrictEquals( before_value, after_value ) ) { continue; }
					set_fields[ path ] = jsongin.SafeClone( after_value );
				}
				return;
			}

			diff_node( Before, After, '' );

			// An operator with nothing in it is omitted rather than emitted empty, so two
			// identical documents produce an empty patch.
			let patch = {};
			if ( Object.keys( set_fields ).length > 0 ) { patch.$set = set_fields; }
			if ( Object.keys( unset_fields ).length > 0 ) { patch.$unset = unset_fields; }
			return patch;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Diff: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Diff;
};
