'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Returns the update document which undoes Patch, given the document it was applied to.
	//
	// The inverse is computed from the observed result rather than from the operators in the
	// patch: apply the patch, then diff the result back toward the original. Because nothing
	// here inspects the patch itself, every update operator inverts, not only the $set and
	// $unset which Diff emits.
	//
	// Neither argument is modified.
	function Invert( Before, Patch )
	{
		try
		{
			if ( jsongin.ShortType( Before ) !== 'o' ) { throw new Error( `Before must be an object.` ); }

			// Update returns null, rather than throwing, when it rejects its parameters.
			let after = jsongin.Update( Before, Patch );
			if ( after === null ) { throw new Error( `Patch is not a valid update document.` ); }

			return jsongin.Diff( after, Before );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Invert: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Invert;
};
