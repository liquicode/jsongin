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
					let value = jsongin.GetValue( Document, field );
					let min = jsongin.AsNumber( UpdateFields[ field ] );
					if ( min === null )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$min: This operator requires a numeric value but found [${UpdateFields[ field ]}] instead at [${field}].` ); }
						operation_result = false;
						continue;
					}
					if ( min < value )
					{
						let result = jsongin.SetValue( Document, field, min );
						if ( result === false )
						{
							if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$min: Setting the value of [${field}] to [${JSON.stringify( value )}] failed.` ); }
							operation_result = false;
							continue;
						}
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$min: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
