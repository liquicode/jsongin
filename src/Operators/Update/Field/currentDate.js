'use strict';
/*md

## Operators > Update > $currentDate

Usage: `$currentDate: { field: true, ... }`
  or `$currentDate: { field: { $type: 'date' }, ... }`
  or `$currentDate: { field: { $type: 'timestamp' }, ... }`

Sets a field to the current date and time, creating it when it is not there.

`true` and `{ $type: 'date' }` both store a `Date`.

`{ $type: 'timestamp' }` stores the time as a ***number*** of milliseconds. MongoDB stores a
  BSON `Timestamp` there, which is a type with no JSON representation, so this is a deviation
  rather than a match — in the same class as jsongin having no `ObjectId`.

A bare string, a number, or an unrecognized `$type` is refused.

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

				// Every field named in one operation receives the same moment in time, which is
				// read once here. Each field gets its own Date built from it, so that two fields
				// do not end up sharing one Date object.
				let timestamp = new Date();

				for ( let field in UpdateFields )
				{
					let date_spec = UpdateFields[ field ];
					let st_date_spec = jsongin.ShortType( date_spec );
					let value = undefined;

					if ( st_date_spec === 'b' )
					{
						// Only true asks for the current date. false is not a date specification.
						if ( date_spec === true )
						{
							value = new Date( timestamp.getTime() );
						}
					}
					else if ( st_date_spec === 'o' )
					{
						if ( jsongin.ShortType( date_spec.$type ) === 's' )
						{
							if ( date_spec.$type === 'timestamp' )
							{
								// A numeric timestamp. jsongin has no BSON Timestamp type.
								value = timestamp.getTime();
							}
							else if ( date_spec.$type === 'date' )
							{
								value = new Date( timestamp.getTime() );
							}
						}
					}

					// Anything which did not produce a value is an invalid date specification.
					// Falling through silently here reported success while doing nothing.
					if ( typeof value === 'undefined' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$currentDate: The date specification of [${JSON.stringify( date_spec )}] for [${field}] is invalid.` ); }
						operation_result = false;
						continue;
					}

					let result = jsongin.SetValue( Document, field, value );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$currentDate: Setting the value of [${field}] to [${JSON.stringify( value )}] failed.` ); }
						operation_result = false;
						continue;
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
