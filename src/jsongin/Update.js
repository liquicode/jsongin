'use strict';

module.exports = function ( jsongin )
{
	//---------------------------------------------------------------------
	// Refuses an update document which cannot be applied.
	//
	// This throws rather than returning the document unchanged. An unchanged document is
	// indistinguishable from a legitimate no-op, so a misspelled operator was silently
	// nothing at all. MongoDB refuses each of these with an error, verified against
	// MongoDB 6.0.1.
	//
	// The line this draws is between the update ***document*** and the update ***operation***.
	// A malformed update document is the caller's mistake and throws. An operator which cannot
	// apply to a particular document — $inc against a string, $pop against a scalar — reports
	// through the OpLog and leaves the document unchanged, which is its own contract.
	function refuse( Message )
	{
		if ( jsongin.OpLog ) { jsongin.OpLog( `Update: ${Message}` ); }
		let error = new Error( `Update: ${Message}` );
		if ( jsongin.OpError ) { jsongin.OpError( error.message ); }
		throw error;
	};


	//---------------------------------------------------------------------
	// Two paths conflict when they are the same, or when one lies below the other. Applying
	// both would make the result depend on the order the operators happened to run in.
	function paths_conflict( PathA, PathB )
	{
		if ( PathA === PathB ) { return true; }
		if ( PathA.startsWith( PathB + '.' ) ) { return true; }
		if ( PathB.startsWith( PathA + '.' ) ) { return true; }
		return false;
	};


	//---------------------------------------------------------------------
	// Refuses an update in which two operators write to the same path, or to a path and one
	// below it. Checked before anything is written, so a refused update leaves the document
	// untouched rather than half applied.
	function check_for_conflicts( Updates )
	{
		let claimed = [];
		for ( let key in Updates )
		{
			// Every value here is a document: the dispatcher checks each operator's ValueTypes,
			// which is 'o' for all twelve update operators, before this runs.
			let fields = Updates[ key ];
			for ( let field in fields )
			{
				for ( let index = 0; index < claimed.length; index++ )
				{
					if ( paths_conflict( claimed[ index ].Path, field ) === false ) { continue; }
					refuse( `The operators [${claimed[ index ].Operator}] and [${key}] both write to [${field}] and [${claimed[ index ].Path}], which conflict.` );
				}
				claimed.push( { Path: field, Operator: key } );
			}
		}
	};


	function Update( Document, Updates )
	{
		// Validate the parameters.
		if ( jsongin.ShortType( Document ) !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Update: The Document parameter must be an object.` ); }
			return null;
		}
		// Cloned with SafeClone rather than Clone, so that dates survive an update.
		Document = jsongin.SafeClone( Document );
		let st_Update = jsongin.ShortType( Updates );
		if ( 'lu'.includes( st_Update ) === true ) { return Document; }
		if ( st_Update !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Update: The Update parameter must be an object.` ); }
			return null;
		}

		// Check the whole update document before applying any part of it, so that a refused
		// update leaves the document untouched rather than half written.
		for ( let key in Updates )
		{
			let operator = jsongin.UpdateOperators[ key ];
			if ( typeof operator === 'undefined' )
			{
				// A key which is not an operator is either a misspelling or a replacement
				// document. MongoDB refuses both here: a replacement is a different call.
				refuse( `Unknown update operator [${key}] encountered.` );
			}

			// Check the value against the types the operator says it takes.
			// An operator is still free to validate its own value, and does when it is
			// called directly rather than through here.
			if ( jsongin.ShortType( operator.ValueTypes ) === 's' )
			{
				let value_type = jsongin.ShortType( Updates[ key ] );
				if ( operator.ValueTypes.includes( value_type ) === false )
				{
					refuse( `Operator [${key}] does not take a value of type [${value_type}]. It takes [${operator.ValueTypes}].` );
				}
			}
		}
		check_for_conflicts( Updates );

		// Process the updates.
		for ( let key in Updates )
		{
			let operator = jsongin.UpdateOperators[ key ];

			// Perform the update.
			let result = operator.Update( Document, Updates[ key ] );
			if ( result === false )
			{
				// The operator could not apply itself to this document — $inc against a
				// string, $push against a scalar. MongoDB raises an error for this, the same
				// way it does for a malformed update document, so this raises one too.
				//
				// The operator reports; the engine decides how loudly. An operator says only
				// that it could not apply, by returning false and writing the reason to the
				// OpLog, and never throws on its own. Raising it here is what a caller needs:
				// an unchanged document is indistinguishable from a legitimate no-op, so a
				// declined $inc used to look exactly like an $inc which had nothing to do.
				//
				// Nothing written before this point survives. Document is a clone made above,
				// and throwing discards it, so the caller's document is untouched.
				refuse( `The operator [${key}] could not be applied to this document. See the OpLog for the reason.` );
			}
		}

		// Return the updated document.
		return Document;
	};
	return Update;
};
