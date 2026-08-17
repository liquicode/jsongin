'use strict';
/*md

## Operators > Stage > $addFields

Usage: `$addFields: { field: expression, ... }`

Adds new fields to each document, leaving the existing fields in place.
A field which already exists is overwritten.
An expression which evaluates to a missing value does not add the field.

Each expression is evaluated against the ***original*** document, so fields added by this
  stage are not visible to the other expressions within the same stage. This is what MongoDB
  does.

This stage produces new documents. Every document it emits is a clone, so the caller's
  documents are never written to.

The `$set` stage is an alias of this one.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// The implementation is shared with the $set stage, which is an alias of this one.
	// The operator name is a parameter so that each stage reports errors under the name the
	// caller actually wrote, rather than under its alias.
	function apply_fields( Documents, Args, OperatorName )
	{
		try
		{
			if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `${OperatorName} requires an object.` ); }

			let results = [];
			for ( let index = 0; index < Documents.length; index++ )
			{
				let document = Documents[ index ];
				let result = jsongin.SafeClone( document );

				for ( let key in Args )
				{
					// The expression is evaluated against the original document.
					let value = jsongin.Evaluate( document, Args[ key ] );

					// An expression which evaluates to a missing value does not add the field.
					if ( typeof value === 'undefined' ) { continue; }

					// Cloned, because a field reference such as '$user' evaluates to the value
					// inside the original document rather than to a copy of it. Storing it
					// as-is left the emitted document sharing structure with its input, which
					// is what this stage promises not to do.
					jsongin.SetValue( result, key, jsongin.SafeClone( value ) );
				}

				results.push( result );
			}

			return results;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( `Stage.${OperatorName}: ${error.message}` ); }
			throw error;
		}
	};


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			return apply_fields( Documents, Args, '$addFields' );
		},

		//---------------------------------------------------------------------
		// Shared with the $set stage, which passes its own name.
		ApplyFields: apply_fields,

	};

	// Return the operator.
	return operator;
};
