'use strict';
/*md

## Operators > Update > $inc

Usage: `$inc: { field: value, ... }`

*/

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
					let inc = jsongin.AsNumber( UpdateFields[ field ] );
					if ( inc === null )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$inc: This operator requires a numeric value but found [${UpdateFields[ field ]}] instead at [${field}].` ); }
						operation_result = false;
						continue;
					}
					value += inc;
					let result = jsongin.SetValue( Document, field, value );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$inc: Setting the value of [${field}] to [${JSON.stringify( value )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$inc: ${error.message}` ); }
				throw error;
			}
			return; // Code should be inaccessible.
		},

	};

	// Return the operator.
	return operator;
};
