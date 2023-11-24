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
					let array = jsongin.GetValue( Document, field );
					if ( jsongin.ShortType( array ) !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pullAll: The field [${field}] must be an array.` ); }
						operation_result = false;
						continue;
					}
					let values = UpdateFields[ field ];
					if ( jsongin.ShortType( values ) !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pullAll: The values to pull must be an array.` ); }
						operation_result = false;
						continue;
					}
					for ( let index = ( array.length - 1 ); index >= 0; index-- )
					{
						if ( values.includes( array[ index ] ) )
						{
							array.splice( index, 1 );
						}
					}
					let result = jsongin.SetValue( Document, field, array );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { Engine.OpLog( `Update.$pullAll: Setting the value of [${field}] to [${JSON.stringify( array )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$pullAll: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
