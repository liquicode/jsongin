'use strict';

/*
	Projects the subset of a document a schema defines.

	The schema's `properties`, at every depth and through its references and allOf branches,
	name the fields; an inclusion projection in dot notation is built from them and handed to
	Project(), so what comes back is what MongoDB would return for that projection. A property
	whose own schema names properties is projected field by field; one which does not is taken
	whole. Properties under `items` reach into each element of an array, the way a dotted path
	does in a projection.

	A schema which names no property defines no subset, and the result is an empty document.
	The options are ValidateDocument's Dialect and Registry.
*/

module.exports = function ( jsongin, Support, Resolve )
{

	//---------------------------------------------------------------------
	// Adds the paths one schema defines, under a prefix.
	function collect_paths( Schema, Registry, Base, Prefix, Paths, Depth )
	{
		if ( Depth > 32 ) { return false; }
		if ( jsongin.ShortType( Schema ) !== 'o' ) { return false; }
		let resource = Registry.ResourceOf( Schema );
		let base = resource ? resource.Base : Base;
		let named_any = false;

		if ( jsongin.ShortType( Schema.properties ) === 'o' )
		{
			let names = Object.keys( Schema.properties );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				let path = Prefix ? `${Prefix}.${name}` : name;
				let below = collect_paths( Schema.properties[ name ], Registry, base, path, Paths, Depth + 1 );
				if ( below === false ) { Paths.push( path ); }
				named_any = true;
			}
		}
		if ( jsongin.ShortType( Schema.items ) === 'o' )
		{
			if ( collect_paths( Schema.items, Registry, base, Prefix, Paths, Depth + 1 ) ) { named_any = true; }
		}
		if ( Array.isArray( Schema.allOf ) )
		{
			for ( let index = 0; index < Schema.allOf.length; index++ )
			{
				if ( collect_paths( Schema.allOf[ index ], Registry, base, Prefix, Paths, Depth + 1 ) ) { named_any = true; }
			}
		}
		if ( typeof Schema.$ref === 'string' )
		{
			let target = Registry.Lookup( Registry.ResolveUri( Schema.$ref, base ) );
			if ( collect_paths( target.Schema, Registry, target.Resource.Base, Prefix, Paths, Depth + 1 ) ) { named_any = true; }
		}
		return named_any;
	}


	//---------------------------------------------------------------------
	function ProjectSchema( Document, Schema, Options )
	{
		let options = ( jsongin.ShortType( Options ) === 'o' ) ? Options : {};
		if ( jsongin.ShortType( Document ) !== 'o' ) { throw new Error( `ProjectSchema: Document must be an object, not [${jsongin.ShortType( Document )}].` ); }

		let registry = Resolve.NewRegistry( options.Registry, options.Dialect );
		let resource = registry.AddDocument( Schema, '' );
		let paths = [];
		collect_paths( Schema, registry, resource.Base, '', paths, 0 );
		if ( paths.length === 0 ) { return {}; }

		let projection = {};
		for ( let index = 0; index < paths.length; index++ ) { projection[ paths[ index ] ] = 1; }
		return jsongin.Project( Document, projection );
	}


	//---------------------------------------------------------------------
	return ProjectSchema;
};
