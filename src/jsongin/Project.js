'use strict';

module.exports = function ( Engine )
{

	//---------------------------------------------------------------------
	function Project( Document, Projection )
	{
		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Projection: The Document parameter must be an object.` ); }
			return null;
		}
		let st_Projection = Engine.ShortType( Projection );
		if ( 'lu'.includes( st_Projection ) === true ) { return Engine.SafeClone( Document ); }
		if ( st_Projection !== 'o' )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Projection: The Projection parameter must be an object.` ); }
			return null;
		}

		// Scan the projection.
		// A field is included when its value is a non-zero number or true, excluded when its
		// value is zero or false, and computed when its value is anything else.
		let include_keys = [];
		let exclude_keys = [];
		let computed_keys = [];
		let include_id = true;
		for ( let key in Projection )
		{
			let value = Projection[ key ];
			let value_type = Engine.ShortType( value );
			let is_exclusion = ( ( ( value_type === 'n' ) && ( value === 0 ) ) || ( ( value_type === 'b' ) && ( value === false ) ) );
			let is_inclusion = ( ( ( value_type === 'n' ) && ( value !== 0 ) ) || ( ( value_type === 'b' ) && ( value === true ) ) );

			if ( key === '_id' )
			{
				if ( is_exclusion ) { include_id = false; }
				continue;
			}
			if ( is_exclusion ) { exclude_keys.push( key ); }
			else if ( is_inclusion ) { include_keys.push( key ); }
			else { computed_keys.push( key ); }
		}

		// Validate the projection.
		if ( ( exclude_keys.length > 0 ) && ( include_keys.length > 0 ) )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Projection: Cannot combine inclusion and exclusion in the same projection.` ); }
			return null;
		}
		if ( ( exclude_keys.length > 0 ) && ( computed_keys.length > 0 ) )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Projection: Cannot use an expression within an exclusion projection.` ); }
			return null;
		}

		// Determine the type of projection.
		// A computed field implies an inclusion projection, which is what MongoDB does.
		let projection_type = 'include';
		if ( exclude_keys.length > 0 )
		{
			projection_type = 'exclude';
		}
		else if ( ( include_keys.length === 0 ) && ( computed_keys.length === 0 ) )
		{
			// Only _id was given, or nothing was.
			if ( include_id === false ) { projection_type = 'exclude'; }
		}

		// Process the projection.
		let projected = null;
		if ( projection_type === 'exclude' )
		{
			projected = Engine.SafeClone( Document );
			for ( let index = 0; index < exclude_keys.length; index++ )
			{
				let result = Engine.DeleteValue( projected, exclude_keys[ index ] );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Projection: Failed to remove the field [${exclude_keys[ index ]}] from the projection.` ); }
					continue;
				}
			}
			if ( include_id === false ) { delete projected._id; }
		}
		else
		{
			projected = {};

			// Only carry the _id when the document actually has one.
			if ( include_id === true )
			{
				if ( typeof Document._id !== 'undefined' ) { projected._id = Engine.SafeClone( Document._id ); }
			}

			for ( let index = 0; index < include_keys.length; index++ )
			{
				let key = include_keys[ index ];
				let value = Engine.GetValue( Document, key );
				// A field which is not in the document is omitted, rather than being set to undefined.
				if ( typeof value === 'undefined' ) { continue; }
				let result = Engine.SetValue( projected, key, Engine.SafeClone( value ) );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Projection: Failed to set the field [${key}] in the projection.` ); }
					continue;
				}
			}

			for ( let index = 0; index < computed_keys.length; index++ )
			{
				let key = computed_keys[ index ];
				let value = Engine.Evaluate( Document, Projection[ key ] );
				// An expression which evaluates to a missing value omits the field.
				// An expression which evaluates to null sets the field to null.
				if ( typeof value === 'undefined' ) { continue; }
				let result = Engine.SetValue( projected, key, value );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Projection: Failed to set the computed field [${key}] in the projection.` ); }
					continue;
				}
			}
		}

		// Return the projected document.
		return projected;
	};
	return Project;
};
