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
					let max = jsongin.AsNumber( UpdateFields[ field ] );
					if ( max === null )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$max: This operator requires a numeric value but found [${UpdateFields[ field ]}] instead at [${field}].` ); }
						operation_result = false;
						continue;
					}
					if ( max > value )
					{
						let result = jsongin.SetValue( Document, field, max );
						if ( result === false )
						{
							if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$max: Setting the value of [${field}] to [${JSON.stringify( value )}] failed.` ); }
							operation_result = false;
							continue;
						}
					}
				}
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$max: ${error.message}` ); }
				throw error;
			}

			return operation_result;
		},

	};

	// Return the operator.
	return operator;
};
