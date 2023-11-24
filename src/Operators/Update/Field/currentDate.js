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
				let timestamp = new Date();
				for ( let field in UpdateFields )
				{
					let date_spec = UpdateFields[ field ];
					let st_date_spec = jsongin.ShortType( date_spec );
					let value = null;
					if ( st_date_spec === 'b' )
					{
						if ( date_spec === true )
						{
							value = timestamp.toISOString();
						}
					}
					else if ( st_date_spec === 'o' )
					{
						if ( typeof date_spec.$type === 'string' )
						{
							date_spec = date_spec.$type;
							if ( date_spec === 'timestamp' )
							{
								value = timestamp.getTime();
							}
							else if ( date_spec === 'date' )
							{
								value = timestamp.toDateString();
							}
							else
							{
								if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$currentDate: Unknown date dpecification [${date_spec}] for [${field}] is invalid.` ); }
								operation_result = false;
								continue;
							}
						}
					}
					else
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$currentDate: The date dpecification of [${JSON.stringify( date_spec )}] for [${field}] is invalid.` ); }
						operation_result = false;
						continue;
					}

					if ( value !== null )
					{
						let result = jsongin.SetValue( Document, field, value );
						if ( result === false )
						{
							if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$currentDate: Setting the value of [${field}] to [${JSON.stringify( value )}] failed.` ); }
							operation_result = false;
							continue;
						}
					}

				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$currentDate: ${error.message}` ); }
				throw error;
			}

		},

	};

	// Return the operator.
	return operator;
};
