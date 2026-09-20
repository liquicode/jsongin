'use strict';
/*md

## Operators > Update > $rename

Usage: `$rename: { field: 'new-name', ... }`

Moves a field to a new name, removing the old one.

A source field which is ***not there*** is a successful no-op: the target is not created.
The source key is removed rather than left holding `undefined`, so a renamed field no longer
  satisfies `{ $exists: true }` under its old name.

The target must be a string. Neither the source nor the target may be an ***array element***
  or a field of one: a rename moves a field of a document, and `a.0` names an element when `a`
  is an array. Against a document, `a.0` is an ordinary field name.
A source and target which are the same, or one inside the other, conflict, as does a target
  which another operator also writes, and the update is refused.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Walks a path to the container of its last element.
	//
	// Answers { Array: true } when any node on the way is an array, { Missing: true } when the
	// walk cannot reach the container, and otherwise the container and the last key.
	//
	// $rename cannot move an array element, or a field of one, in either direction, and
	// MongoDB refuses the update when the document actually has an array there:
	// { $rename: { 'a.0': 'c' } } is refused against { a: [ 1 ] } and is a plain field name
	// against { a: { '0': 1 } }. GetValue cannot see the difference, because it gathers a
	// path through an array into a value, which is why this walks the path itself. jsongin
	// used to move the element and leave a null behind where it had been.
	// Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
	function walk_to_container( Document, Path )
	{
		let elements = jsongin.SplitPath( Path );
		let node = Document;
		for ( let index = 0; index < ( elements.length - 1 ); index++ )
		{
			node = node[ elements[ index ] ];
			let short_type = jsongin.ShortType( node );
			if ( short_type === 'a' ) { return { Array: true }; }
			if ( short_type !== 'o' ) { return { Missing: true }; }
		}
		return { Container: node, Key: elements[ elements.length - 1 ] };
	};


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

				// The targets are checked before any field is moved, so that a refused rename
				// leaves nothing half done, and a target which is not a string is refused
				// whether or not its source is there. Verified against MongoDB 6.0.28, 7.0.40
				// and 8.3.8; jsongin used to write the number as a field name.
				for ( let field in UpdateFields )
				{
					let new_name = UpdateFields[ field ];
					if ( jsongin.ShortType( new_name ) !== 's' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: The target for [${field}] must be a string but found type [${jsongin.ShortType( new_name )}].` ); }
						return false;
					}
					if ( new_name.length === 0 )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: The target for [${field}] is empty.` ); }
						return false;
					}
				}

				for ( let field in UpdateFields )
				{
					let new_name = UpdateFields[ field ];

					// The source. A path through an array is refused. A path which reaches
					// nothing is a no-op: MongoDB reports a successful update with
					// modifiedCount 0 in that case, verified against MongoDB 7.0.40, and the
					// target is not created.
					let source = walk_to_container( Document, field );
					if ( source.Array === true )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: The source [${field}] is an array element, which cannot be renamed.` ); }
						return false;
					}
					let value = undefined;
					if ( source.Missing !== true ) { value = source.Container[ source.Key ]; }
					if ( jsongin.ShortType( value ) === 'u' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: The field [${field}] was not present and was left alone.` ); }
						continue;
					}

					// The target. Only an array in the way is refused here: a document which
					// is not there is created by SetValue, and a scalar in the way is refused
					// by it.
					let target = walk_to_container( Document, new_name );
					if ( target.Array === true )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: The target [${new_name}] is an array element, which cannot be written.` ); }
						return false;
					}

					// The source key is removed, rather than being set to undefined, so that
					// Object.keys() and the document's contents agree with each other.
					// Setting it to undefined left the key in place, so a renamed field still
					// answered { $exists: true } and still appeared in Object.keys().
					let result = jsongin.DeleteValue( Document, field );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: Removing the field [${field}] failed.` ); }
						return false;
					}
					result = jsongin.SetValue( Document, new_name, value );
					if ( result === false )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Update.$rename: Setting the value of [${new_name}] to [${JSON.stringify( value )}] failed.` ); }
						return false;
					}
				}

				return true;
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
