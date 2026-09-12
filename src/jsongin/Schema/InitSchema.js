'use strict';

/*
	Initializes a document from a schema.

	A field the document lacks is given the schema's `default` for it, and an object so filled
	is filled through, so nested defaults reach their places. A field the document has is left
	exactly as it is: this fills absences and never repairs values, the rule Merge( DEFAULTS,
	options ) follows. The document given is not modified; a copy is returned, and a missing or
	null document starts from an empty one.

	A required field with no default is left absent, unless Options.ForceRequired is true, in
	which case it is given its type's empty value - 0, '', false, {}, [] or null - so that a
	document built from a schema with no defaults is at least complete. A field with no type
	and no default is left absent either way, since nothing says what it holds.

	The schema is read through its references and its allOf branches; anyOf and oneOf are not
	guessed at. The remaining options are ValidateDocument's Dialect and Registry.
*/

module.exports = function ( jsongin, Support, Resolve )
{

	//---------------------------------------------------------------------
	// The empty value of a type, or undefined for one which has none.
	function empty_value( Type )
	{
		switch ( Type )
		{
			case 'object': return {};
			case 'array': return [];
			case 'string': return '';
			case 'number': return 0;
			case 'integer': return 0;
			case 'boolean': return false;
			case 'null': return null;
		}
		return undefined;
	}


	//---------------------------------------------------------------------
	// Collects the keywords which apply to one instance location: the schema's own, and those
	// of every $ref and allOf branch reached from it.
	function collect( Schema, Registry, Base, Into, Depth )
	{
		if ( Depth > 32 ) { return; }
		if ( jsongin.ShortType( Schema ) !== 'o' ) { return; }
		let resource = Registry.ResourceOf( Schema );
		let base = resource ? resource.Base : Base;

		if ( Object.prototype.hasOwnProperty.call( Schema, 'default' ) && ( typeof Into.Default === 'undefined' ) ) { Into.Default = Schema.default; }
		if ( ( typeof Schema.type !== 'undefined' ) && ( typeof Into.Type === 'undefined' ) )
		{
			Into.Type = Array.isArray( Schema.type ) ? Schema.type[ 0 ] : Schema.type;
		}
		if ( Array.isArray( Schema.required ) )
		{
			for ( let index = 0; index < Schema.required.length; index++ )
			{
				if ( Into.Required.includes( Schema.required[ index ] ) === false ) { Into.Required.push( Schema.required[ index ] ); }
			}
		}
		if ( jsongin.ShortType( Schema.properties ) === 'o' )
		{
			let names = Object.keys( Schema.properties );
			for ( let index = 0; index < names.length; index++ )
			{
				if ( !Into.Properties[ names[ index ] ] ) { Into.Properties[ names[ index ] ] = []; }
				Into.Properties[ names[ index ] ].push( { Schema: Schema.properties[ names[ index ] ], Base: base } );
			}
		}
		if ( Array.isArray( Schema.allOf ) )
		{
			for ( let index = 0; index < Schema.allOf.length; index++ )
			{
				collect( Schema.allOf[ index ], Registry, base, Into, Depth + 1 );
			}
		}
		if ( typeof Schema.$ref === 'string' )
		{
			let target = Registry.Lookup( Registry.ResolveUri( Schema.$ref, base ) );
			collect( target.Schema, Registry, target.Resource.Base, Into, Depth + 1 );
		}
	}


	//---------------------------------------------------------------------
	// Gathers what applies at one location from one or more schemas.
	function gather( Schemas, Registry )
	{
		let into = { Default: undefined, Type: undefined, Required: [], Properties: {} };
		for ( let index = 0; index < Schemas.length; index++ )
		{
			collect( Schemas[ index ].Schema, Registry, Schemas[ index ].Base, into, 0 );
		}
		return into;
	}


	//---------------------------------------------------------------------
	// Fills the absences of an object from what applies to it.
	function fill( Document, Applicable, Registry, Options, Depth )
	{
		if ( Depth > 32 ) { return; }
		let names = Object.keys( Applicable.Properties );
		for ( let index = 0; index < names.length; index++ )
		{
			let name = names[ index ];
			let field = gather( Applicable.Properties[ name ], Registry );
			if ( typeof Document[ name ] === 'undefined' )
			{
				let value = undefined;
				if ( typeof field.Default !== 'undefined' ) { value = jsongin.SafeClone( field.Default ); }
				else if ( ( Options.ForceRequired === true ) && Applicable.Required.includes( name ) ) { value = empty_value( field.Type ); }
				if ( typeof value === 'undefined' ) { continue; }
				Document[ name ] = value;
			}
			if ( jsongin.ShortType( Document[ name ] ) === 'o' )
			{
				fill( Document[ name ], field, Registry, Options, Depth + 1 );
			}
		}
	}


	//---------------------------------------------------------------------
	function InitSchema( Document, Schema, Options )
	{
		let options = ( jsongin.ShortType( Options ) === 'o' ) ? Options : {};
		let document_type = jsongin.ShortType( Document );
		let document = {};
		if ( document_type === 'o' ) { document = jsongin.SafeClone( Document ); }
		else if ( ( document_type !== 'l' ) && ( document_type !== 'u' ) ) { throw new Error( `InitSchema: Document must be an object, null or undefined, not [${document_type}].` ); }

		let registry = Resolve.NewRegistry( options.Registry, options.Dialect );
		let resource = registry.AddDocument( Schema, '' );
		let applicable = gather( [ { Schema: Schema, Base: resource.Base } ], registry );
		fill( document, applicable, registry, options, 0 );
		return document;
	}


	//---------------------------------------------------------------------
	return InitSchema;
};
