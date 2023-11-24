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

				let operation_result = true;
				for ( let field in UpdateFields )
				{
					let result = jsongin.SetValue( Document, field, undefined );
					if ( result === false )
					{
						if ( Engine.OpLog ) { Engine.OpLog( `Update.$unset: Unsetting the value of [${field}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
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
