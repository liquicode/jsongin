'use strict';

/*
	Shared implementation for the $inc and $mul update operators.
	This is a helper module, not an operator.

	The two operators differ only in the arithmetic they apply, so they share one
	implementation rather than being maintained as mirrors of each other.
	This follows _minmax.js, which does the same for $min and $max.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Applies $inc or $mul to every field of the update.
	//
	// Operation takes the stored value and the operand, and returns the value to store.
	//
	// MongoDB semantics, verified against MongoDB 6.0.1:
	//
	// - A field which is not there is treated as a zero, and the path to it is created.
	//   { $inc: { a: 5 } } against {} gives { a: 5 }, and { $mul: { a: 5 } } gives { a: 0 }.
	//   Both fall out of the same rule, so neither operator needs its own default.
	//   This used to apply the arithmetic to the undefined which GetValue returned, writing
	//   a NaN into the document. Creating a counter is the most common use of $inc, and a
	//   NaN serializes to null through JSON.stringify, so the damage was unrecoverable.
	// - The stored value must be a number. A string, a boolean, a date, or a null is an
	//   error rather than something to coerce. Only the operand used to be checked, so
	//   { a: 'str' } incremented by 1 became the string 'str1', and { a: true } became 2.
	// - The operand must be a number. AsNumber is deliberately not used to read it: AsNumber
	//   converts a numeric string, which is the right contract for AsNumber and the wrong
	//   one here, because MongoDB rejects { $inc: { a: '5' } } rather than adding 5.
	// - An update which cannot be applied is refused whole. Every field is checked before
	//   any field is written, so one bad field never leaves the document half updated.
	//   That is the rule MongoDB follows, and the one $push already follows here.
	helper.Apply = function ( Document, UpdateFields, OperatorName, Operation ){
		if ( jsongin.ShortType( UpdateFields ) !== 'o' ) { throw new Error( `The UpdateFields parameter must be an object.` ); }

		// Check every field, and work out what each one would store, before storing any of them.
		let writes = [];
		for ( let field in UpdateFields )
		{
			let operand = UpdateFields[ field ];
			if ( jsongin.ShortType( operand ) !== 'n' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `Update.${OperatorName}: This operator requires a numeric value but found [${JSON.stringify( operand )}] instead at [${field}].` ); }
				return false;
			}

			let value = jsongin.GetValue( Document, field );
			let value_type = jsongin.ShortType( value );
			if ( value_type === 'u' )
			{
				// The field is not there, so it counts as a zero.
				value = 0;
			}
			else if ( value_type !== 'n' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `Update.${OperatorName}: This operator requires a numeric field but found [${JSON.stringify( value )}] instead at [${field}].` ); }
				return false;
			}

			writes.push( { Field: field, Value: Operation( value, operand ) } );
		}

		// Store the values. Nothing below can be refused: the checks are all above.
		let operation_result = true;
		for ( let write_index = 0; write_index < writes.length; write_index++ )
		{
			let write = writes[ write_index ];
			let result = jsongin.SetValue( Document, write.Field, write.Value );
			if ( result === false )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `Update.${OperatorName}: Setting the value of [${write.Field}] to [${JSON.stringify( write.Value )}] failed.` ); }
				operation_result = false;
			}
		}

		return operation_result;
	};


	//---------------------------------------------------------------------
	return helper;
};
