'use strict';

module.exports = function ( Engine )
{
	function Project( Document, Projection )
	{
		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Projection: The Document parameter must be an object.` ); }
			return null;
		}
		Document = Engine.Clone( Document );
		let st_Projection = Engine.ShortType( Projection );
		if ( 'lu'.includes( st_Projection ) === true ) { return Document; }
		if ( st_Projection !== 'o' )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Projection: The Projection parameter must be an object.` ); }
			return null;
		}

		// Scan the projection.
		Projection = Engine.Clone( Projection );
		let projection_type = '';
		let include_id = true;
		for ( let key in Projection )
		{
			let inclusion = Projection[ key ];
			if ( key === '_id' )
			{
				if ( inclusion === 0 ) { include_id = false; }
				delete Projection[ key ];
			}
			else if ( inclusion === 1 )
			{
				if ( projection_type === 'exclude' ) 
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Update: Cannot combine inclusion and exclusion operators in the same update.` ); }
					return null;
				}
				projection_type = 'include';
			}
			else if ( inclusion === 0 )
			{
				if ( projection_type === 'include' ) 
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Update: Cannot combine inclusion and exclusion operators in the same update.` ); }
					return null;
				}
				projection_type = 'exclude';
			}
		}
		if ( projection_type === '' )
		{
			if ( include_id )
			{
				projection_type = 'include';
			}
			else
			{
				projection_type = 'exclude';
			}
		}

		// Process the projection.
		let projected = null;
		if ( projection_type === 'exclude' ) 
		{
			projected = Engine.Clone( Document );
			for ( let key in Projection )
			{
				let result = Engine.SetValue( projected, key, undefined );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Projection: Failed to unset the field [${field}] in the projection.` ); }
					continue;
				}
			}
		}
		else if ( projection_type === 'include' ) 
		{
			projected = { _id: Document._id };
			for ( let key in Projection )
			{
				let value = Engine.GetValue( Document, key );
				let result = Engine.SetValue( projected, key, value );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Projection: Failed to set the field [${field}] in the projection.` ); }
					continue;
				}
			}
		}
		if ( include_id === false )
		{
			delete projected._id;
		}

		// Return the updated document.
		return projected;
	};
	return Project;
};
