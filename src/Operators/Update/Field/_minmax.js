'use strict';

/*
	Shared implementation for the $min and $max update operators.
	This is a helper module, not an operator.

	The two operators differ only in which direction of comparison replaces the value, so
	they share one implementation rather than being maintained as mirrors of each other.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Applies $min or $max to every field of the update.
	//
	// Direction is -1 for $min, which keeps the smaller value, and 1 for $max, which keeps
	// the larger one.
	//
	// MongoDB semantics, verified against MongoDB 6.0.1:
	//
	// - Neither operator is numeric. Values are compared by the BSON ordering, so strings,
	//   dates, booleans, and comparisons across types are all legitimate.
	//   CompareValues already implements that ordering.
	//   This used to force the operand through AsNumber() and reject anything else, and then
	//   compare with the raw < and > operators, which coerce.
	// - A field which is not present is set to the operand. There is nothing to compare
	//   against, so the operand wins by default.
	// - A field holding null is compared rather than treated as missing. null sorts below
	//   every number, so { $min: { n: 5 } } leaves { n: null } alone.
	// - A path which reaches into an array by field name is rejected, whether or not the
	//   value would have changed.
	helper.Apply = function ( Document, UpdateFields, OperatorName, Direction )
	{
		if ( jsongin.ShortType( UpdateFields ) !== 'o' ) { throw new Error( `The UpdateFields parameter must be an object.` ); }

		let operation_result = true;
		for ( let field in UpdateFields )
		{
			let operand = UpdateFields[ field ];
			let value = jsongin.GetValue( Document, field );

			let replace = false;
			if ( jsongin.ShortType( value ) === 'u' )
			{
				// The field is not there, so there is nothing to compare against.
				replace = true;
			}
			else if ( ( jsongin.CompareValues( operand, value ) * Direction ) > 0 )
			{
				replace = true;
			}

			if ( replace )
			{
				// The operand is cloned on the way in, so the stored value does not alias the
				// update specification the caller passed.
				let result = jsongin.SetValue( Document, field, jsongin.SafeClone( operand ) );
				if ( result === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Update.${OperatorName}: Setting the value of [${field}] to [${JSON.stringify( operand )}] failed.` ); }
					operation_result = false;
				}
				continue;
			}

			// The value stays as it is, but the path still has to be a valid update target.
			// MongoDB rejects a path which reaches into an array by field name whether or not
			// the comparison would have replaced anything, and SetValue is what raises that.
			// Rewriting the value which is already there is a no-op on every path SetValue
			// accepts.
			jsongin.SetValue( Document, field, value );
		}

		return operation_result;
	};


	//---------------------------------------------------------------------
	return helper;
};
