'use strict';

module.exports = function ( jsongin )
{
	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: true,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Update: function ( Document, UpdateFields )
		{
			try
			{
				if ( jsongin.ShortType( UpdateFields ) !== 'o' ) { throw new Error( `The UpdateFields parameter must be an object.` ); }

				let operation_result = true;
				for ( let field in UpdateFields )
				{
					let value = UpdateFields[ field ];
					// Cloned, so that the updated document does not share structure with the
					// update document it was built from. Without this, writing to the result
					// reached back into the caller's $set specification.
					let result = jsongin.SetValue( Document, field, jsongin.SafeClone( value ) );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$set: Setting the value of [${field}] to [${JSON.stringify( value )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$set: ${error.message}` ); }
				throw error;
			}
			return; // Code should be inaccessible.
		},

	};

	// Return the operator.
	return operator;
};
