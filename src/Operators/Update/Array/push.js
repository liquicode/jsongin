'use strict';
/*md

## Operators > Update > $push

Usage: `$push: { array-field: value, ... }`
  or `$push: { array-field: { $each: [ value, ... ], $position: n, $sort: spec, $slice: n } }`

Appends to an array field.

A plain value is appended as a single element.
A document carrying `$each` is a ***modifier document***, and appends every element of the
  `$each` array instead.

| **Modifier**  | **Effect**                                                                  |
|---------------|------------------------------------------------------------------------------|
| `$each`       | The values to append. Required by the other three modifiers.                 |
| `$position`   | Inserts at this index rather than appending. A negative index counts back from the end. |
| `$sort`       | Sorts the array after the insert. Use `1` or `-1` for an array of values, or a sort document for an array of documents. |
| `$slice`      | Trims the array after the sort. A positive count keeps the first, a negative count keeps the last, and zero empties it. |

The modifiers are applied in the order MongoDB applies them: `$each`, then `$position`, then
  `$sort`, then `$slice`.

Note that a modifier written without `$each` is rejected, as it is by MongoDB, and that an
  unrecognized `$` field in a modifier document is rejected rather than being stored.

***A rejected modifier leaves the array untouched.*** Every part of the modifier document is
  checked before the first element is inserted, so a field is never left half updated.

*/

module.exports = function ( jsongin )
{

	const MODIFIERS = [ '$each', '$position', '$sort', '$slice' ];


	//---------------------------------------------------------------------
	// A value is a modifier document when it is an object carrying a $each field.
	// Anything else is a single value to append, including an object which has no $each.
	function is_modifier_document( Value )
	{
		if ( jsongin.ShortType( Value ) !== 'o' ) { return false; }
		return ( typeof Value.$each !== 'undefined' );
	}


	//---------------------------------------------------------------------
	// A sort specification is a direction for an array of values, or a sort document for an
	// array of documents.
	function is_valid_sort( Specification )
	{
		let specification_type = jsongin.ShortType( Specification );
		if ( specification_type === 'o' ) { return true; }
		if ( specification_type !== 'n' ) { return false; }
		return ( ( Specification === 1 ) || ( Specification === -1 ) );
	}


	//---------------------------------------------------------------------
	// Sorts an array in place. The specification has already been validated.
	function apply_sort( Elements, Specification )
	{
		if ( jsongin.ShortType( Specification ) === 'o' )
		{
			jsongin.Sort( Elements, Specification );
			return;
		}
		Elements.sort(
			function ( A, B )
			{
				return ( jsongin.CompareValues( A, B ) * Specification );
			} );
		return;
	}


	//---------------------------------------------------------------------
	// Keeps the first or the last elements of an array, in place.
	function apply_slice( Elements, Count )
	{
		if ( Count === 0 )
		{
			Elements.length = 0;
			return;
		}
		if ( Count > 0 )
		{
			if ( Elements.length > Count ) { Elements.length = Count; }
			return;
		}
		let keep = -Count;
		if ( Elements.length > keep ) { Elements.splice( 0, Elements.length - keep ); }
		return;
	}


	//---------------------------------------------------------------------
	// Reads what is to be pushed to one field, and how.
	// Returns null when the value cannot be used, having reported the reason.
	// Nothing here writes to the document, so a rejection leaves the array untouched.
	function read_push( Value, FieldName )
	{
		let plan =
		{
			Elements: null,
			Position: null,
			Sort: undefined,
			Slice: undefined,
		};

		if ( is_modifier_document( Value ) === false )
		{
			// A modifier written without $each has nothing to apply itself to.
			if ( jsongin.ShortType( Value ) === 'o' )
			{
				let modifiers = Object.keys( Value ).filter( function ( key ) { return MODIFIERS.includes( key ); } );
				if ( modifiers.length > 0 )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: The modifier(s) [${modifiers.join( ', ' )}] of [${FieldName}] require a $each.` ); }
					return null;
				}
			}
			// Cloned, so that the array element does not share structure with the update
			// document it came from.
			plan.Elements = [ jsongin.SafeClone( Value ) ];
			return plan;
		}

		if ( jsongin.ShortType( Value.$each ) !== 'a' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: The $each of [${FieldName}] must be an array.` ); }
			return null;
		}

		// An unrecognized modifier is rejected rather than stored. Storing it is what happened
		// before the modifiers were implemented at all.
		let unknown = Object.keys( Value ).filter( function ( key ) { return MODIFIERS.includes( key ) === false; } );
		if ( unknown.length > 0 )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: Unrecognized modifier(s) [${unknown.join( ', ' )}] for [${FieldName}].` ); }
			return null;
		}

		if ( typeof Value.$position !== 'undefined' )
		{
			if ( jsongin.ShortType( Value.$position ) !== 'n' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: The $position of [${FieldName}] must be a number.` ); }
				return null;
			}
			plan.Position = Value.$position;
		}

		if ( typeof Value.$sort !== 'undefined' )
		{
			if ( is_valid_sort( Value.$sort ) === false )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: The $sort of [${FieldName}] must be 1, -1, or a sort document.` ); }
				return null;
			}
			plan.Sort = Value.$sort;
		}

		if ( typeof Value.$slice !== 'undefined' )
		{
			if ( jsongin.ShortType( Value.$slice ) !== 'n' )
			{
				if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: The $slice of [${FieldName}] must be a number.` ); }
				return null;
			}
			plan.Slice = Value.$slice;
		}

		plan.Elements = jsongin.SafeClone( Value.$each );
		return plan;
	}


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
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: The field [${field}] must be an array.` ); }
						operation_result = false;
						continue;
					}

					// Read and check everything before writing anything.
					let plan = read_push( UpdateFields[ field ], field );
					if ( plan === null )
					{
						operation_result = false;
						continue;
					}

					// Insert.
					if ( plan.Position === null )
					{
						array.push( ...plan.Elements );
					}
					else
					{
						let index = plan.Position;
						if ( index < 0 ) { index = array.length + index; }
						if ( index < 0 ) { index = 0; }
						if ( index > array.length ) { index = array.length; }
						array.splice( index, 0, ...plan.Elements );
					}

					// Sort, then trim, which is the order MongoDB uses.
					if ( typeof plan.Sort !== 'undefined' ) { apply_sort( array, plan.Sort ); }
					if ( typeof plan.Slice !== 'undefined' ) { apply_slice( array, plan.Slice ); }

					let result = jsongin.SetValue( Document, field, array );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$push: Setting the value of [${field}] to [${JSON.stringify( array )}] failed.` ); }
						operation_result = false;
						continue;
					}
				}

				return operation_result;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$push: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
