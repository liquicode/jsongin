'use strict';

module.exports = function ( jsongin )
{
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
