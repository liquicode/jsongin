'use strict';
/*md

## Operators > Stage > $group

Usage: `$group: { _id: expression, field: { accumulator: expression }, ... }`

Partitions the documents into groups and emits one document per group.

The `_id` expression computes the group key and is required.
A group key which evaluates to a missing value is treated as `null`, so the documents which
  lack the field are grouped together.
Use `_id: null` to gather every document into a single group.

Every other field names an accumulator which reduces the group's documents to a single value.
An accumulator whose value is missing omits its field from the group's output document.

Groups are emitted in the order in which they were first seen.
MongoDB does not guarantee an order here, and jsongin's order is deterministic on purpose:
  it makes a pipeline result testable and it makes replay deterministic.

This stage produces new documents. Nothing it emits aliases the input documents.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Builds the key which identifies a group.
	// The short type is part of the key, so that values which serialize alike but are of
	// different types, such as a date and its ISO string, do not group together.
	function group_key( Value )
	{
		return jsongin.ShortType( Value ) + ':' + JSON.stringify( Value );
	};


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			try
			{
				if ( jsongin.ShortType( Args ) !== 'o' ) { throw new Error( `$group requires an object.` ); }
				if ( typeof Args._id === 'undefined' ) { throw new Error( `$group requires an _id field.` ); }

				// Validate the accumulator fields before doing any work.
				let field_names = [];
				for ( let key in Args )
				{
					if ( key === '_id' ) { continue; }

					let field = Args[ key ];
					if ( jsongin.ShortType( field ) !== 'o' )
					{
						throw new Error( `$group field [${key}] must be an accumulator object.` );
					}

					let field_keys = Object.keys( field );
					if ( field_keys.length !== 1 )
					{
						throw new Error( `$group field [${key}] must have exactly one accumulator, found [${field_keys.length}].` );
					}
					let accumulator = jsongin.AccumulatorOperators[ field_keys[ 0 ] ];
					if ( typeof accumulator === 'undefined' )
					{
						throw new Error( `Unrecognized accumulator [${field_keys[ 0 ]}] in $group field [${key}].` );
					}

					// Check the argument against the types the accumulator says it takes.
					if ( jsongin.ShortType( accumulator.ArgTypes ) === 's' )
					{
						let argument_type = jsongin.ShortType( field[ field_keys[ 0 ] ] );
						if ( accumulator.ArgTypes.includes( argument_type ) === false )
						{
							throw new Error( `Accumulator [${field_keys[ 0 ]}] does not take an argument of type [${argument_type}]. It takes [${accumulator.ArgTypes}].` );
						}
					}

					field_names.push( key );
				}

				// Partition the documents, preserving the order in which groups are first seen.
				let group_order = [];
				let groups = {};
				for ( let index = 0; index < Documents.length; index++ )
				{
					let document = Documents[ index ];

					let id_value = jsongin.Evaluate( document, Args._id );
					// A missing group key is treated as null, which is what MongoDB does.
					if ( typeof id_value === 'undefined' ) { id_value = null; }

					let key = group_key( id_value );
					if ( typeof groups[ key ] === 'undefined' )
					{
						groups[ key ] = { Id: id_value, Documents: [] };
						group_order.push( key );
					}
					groups[ key ].Documents.push( document );
				}

				// Emit one document per group.
				let results = [];
				for ( let index = 0; index < group_order.length; index++ )
				{
					let group = groups[ group_order[ index ] ];
					let result = { _id: group.Id };

					for ( let field_index = 0; field_index < field_names.length; field_index++ )
					{
						let field_name = field_names[ field_index ];
						let field = Args[ field_name ];
						let accumulator_name = Object.keys( field )[ 0 ];
						let accumulator = jsongin.AccumulatorOperators[ accumulator_name ];

						let value = accumulator.Accumulate( group.Documents, field[ accumulator_name ] );

						// An accumulated value which is missing omits the field.
						if ( typeof value === 'undefined' ) { continue; }

						jsongin.SetValue( result, field_name, value );
					}

					// Clone on the way out. An accumulated value can be a reference into one of
					// the input documents, and derived data must never alias what it came from.
					results.push( jsongin.SafeClone( result ) );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$group: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
