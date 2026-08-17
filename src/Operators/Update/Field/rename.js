'use strict';
/*md

## Operators > Update > $rename

Usage: `$rename: { field: 'new-name', ... }`

Moves a field to a new name, removing the old one.

A source field which is ***not there*** is a successful no-op: the target is not created.
The source key is removed rather than left holding `undefined`, so a renamed field no longer
  satisfies `{ $exists: true }` under its old name.

*/

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
					let new_name = UpdateFields[ field ];
					let value = jsongin.GetValue( Document, field );

					// A source field which is not there is left alone, and the target is not
					// created. MongoDB reports a successful update with modifiedCount 0 in that
					// case, verified against MongoDB 6.0.1.
					// This is checked here rather than being read from DeleteValue's result,
					// which reports a field that was never there and a removal that failed the
					// same way, and only one of those is a no-op.
					if ( jsongin.ShortType( value ) === 'u' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: The field [${field}] was not present and was left alone.` ); }
						continue;
					}

					// The source key is removed, rather than being set to undefined, so that
					// Object.keys() and the document's contents agree with each other.
					// Setting it to undefined left the key in place, so a renamed field still
					// answered { $exists: true } and still appeared in Object.keys().
					let result = null;
					result = jsongin.DeleteValue( Document, field );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: Removing the field [${field}] failed.` ); }
						operation_result = false;
						continue;
					}
					result = jsongin.SetValue( Document, new_name, value );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: Setting the value of [${new_name}] to [${JSON.stringify( value )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$rename: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
