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
					let array = jsongin.GetValue( Document, field );
					if ( jsongin.ShortType( array ) === 'u' )
					{
						// A field which is not there is nothing to pop from, and MongoDB
						// reports a successful update with modifiedCount 0 rather than an
						// error. Verified against MongoDB 6.0.1. This is a no-op and not a
						// refusal: the two used to share a branch, so once Update() began
						// raising a refusal, popping a field which was not there raised too.
						continue;
					}
					if ( jsongin.ShortType( array ) !== 'a' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pop: The field [${field}] must be an array.` ); }
						operation_result = false;
						continue;
					}
					let direction = UpdateFields[ field ];
					if ( direction === -1 )
					{
						if ( array.length )
						{
							array.splice( 0, 1 );
						}
					}
					else if ( direction === 1 )
					{
						if ( array.length )
						{
							array.pop();
						}
					}
					else
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pop: Invalid direction value [${direction}] for field [${field}], should be -1 or 1.` ); }
						operation_result = false;
						continue;
					}
					let result = jsongin.SetValue( Document, field, array );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$pop: Setting the value of [${field}] to [${JSON.stringify( array )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$pop: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
