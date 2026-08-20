'use strict';
/*md

## Operators > Update > $bit

Usage: `$bit: { field: { and: integer } }`
  or `$bit: { field: { or: integer } }`
  or `$bit: { field: { xor: integer } }`

Applies a bitwise operation to an integer field.

A field which is ***not there*** is treated as a zero, so `and` stores 0 and `or` and `xor`
  store the operand. The path to it is created, as `$inc` creates one.

The stored value and the operand must both be ***integers***. A field holding a string, a
  fractional number, a boolean, or a null is refused rather than coerced, and so is a
  fractional or non numeric operand. A refused update leaves the whole document untouched.

***The arithmetic is done in BigInt***, so a bit above the 32nd is not lost and a negative
  value is read as two's complement.

*/

module.exports = function ( jsongin )
{

	const OPERATIONS = [ 'and', 'or', 'xor' ];


	//---------------------------------------------------------------------
	// Applies one named operation to a value, both as BigInt.
	function apply_operation( Value, Name, Operand )
	{
		if ( Name === 'and' ) { return ( Value & Operand ); }
		if ( Name === 'or' ) { return ( Value | Operand ); }
		return ( Value ^ Operand );
	}


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

				// Check every field, and work out what each one would store, before storing
				// any of them. One bad field never leaves the document half updated.
				let writes = [];
				for ( let field in UpdateFields )
				{
					let operations = UpdateFields[ field ];
					if ( jsongin.ShortType( operations ) !== 'o' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$bit: This operator requires a document naming an operation but found [${JSON.stringify( operations )}] instead at [${field}].` ); }
						return false;
					}

					let names = Object.keys( operations );
					if ( names.length === 0 )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$bit: No operation was named at [${field}].` ); }
						return false;
					}

					// A field which is not there counts as a zero, as it does for $inc.
					let value = jsongin.GetValue( Document, field );
					let value_type = jsongin.ShortType( value );
					if ( value_type === 'u' )
					{
						value = 0;
					}
					else if ( ( value_type !== 'n' ) || !Number.isInteger( value ) )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$bit: This operator requires an integer field but found [${JSON.stringify( value )}] instead at [${field}].` ); }
						return false;
					}

					let bits = BigInt( value );
					for ( let index = 0; index < names.length; index++ )
					{
						let name = names[ index ];
						if ( !OPERATIONS.includes( name ) )
						{
							if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$bit: [${name}] is not one of and, or, or xor at [${field}].` ); }
							return false;
						}

						let operand = operations[ name ];
						if ( ( jsongin.ShortType( operand ) !== 'n' ) || !Number.isInteger( operand ) )
						{
							if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$bit: This operator requires an integer operand but found [${JSON.stringify( operand )}] instead at [${field}].` ); }
							return false;
						}

						bits = apply_operation( bits, name, BigInt( operand ) );
					}

					writes.push( { Field: field, Value: Number( bits ) } );
				}

				// Store the values. Nothing below can be refused: the checks are all above.
				let operation_result = true;
				for ( let write_index = 0; write_index < writes.length; write_index++ )
				{
					let write = writes[ write_index ];
					let result = jsongin.SetValue( Document, write.Field, write.Value );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$bit: Setting the value of [${write.Field}] to [${JSON.stringify( write.Value )}] failed.` ); }
						operation_result = false;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$bit: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
