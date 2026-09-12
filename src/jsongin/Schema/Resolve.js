'use strict';

/*
	Reference resolution: which schema a URI names.

	A schema document is made of ***resources***. The document is one, and every subschema
	which carries an $id (or `id`, in draft 4) is another, embedded in it, with its own base URI
	against which the references inside it resolve. A resource may also name ***anchors***,
	which are location independent identifiers reached as `base#name`, and in 2020-12 some of
	those are ***dynamic anchors***, which $dynamicRef resolves through the dynamic scope
	rather than lexically.

	The registry built here indexes every resource, anchor and schema object of every document
	it is given, so that a reference is answered by lookup rather than by walking. It is given
	two kinds of document: the root schema being evaluated, and the documents a caller supplies
	as Options.Registry keyed by the URI they are reached at, which is how a remote schema is
	answered without anything being fetched. The meta-schemas are always present.

	URI resolution is the URL global's, which Node and every browser share. A relative
	reference against no base is kept as written, so a root schema with no $id can still say
	`#/$defs/thing` and be understood.
*/

const LIB_DIALECTS = require( './Dialects.js' );
const META_SCHEMAS = require( './MetaSchemas' );

module.exports = function ( jsongin, Support )
{

	//---------------------------------------------------------------------
	// Resolves a reference against a base and returns the result as a string, fragment kept.
	function ResolveUri( Reference, Base )
	{
		if ( typeof Reference !== 'string' ) { throw new Error( `A reference must be a string, not [${jsongin.ShortType( Reference )}].` ); }
		if ( !Base )
		{
			try { return new URL( Reference ).href; }
			catch ( error ) { return Reference; }
		}
		try
		{
			return new URL( Reference, Base ).href;
		}
		catch ( error )
		{
			// A base with an opaque path - a URN, say - cannot take a relative path, and the URL
			// class refuses the whole resolution. A fragment still means something against it.
			if ( Reference.startsWith( '#' ) ) { return SplitFragment( Base ).Base + Reference; }
			return Reference;
		}
	}


	//---------------------------------------------------------------------
	// Splits a URI into the part before the fragment and the decoded fragment. A URI with no
	// fragment has a null one; a URI ending in a bare '#' has an empty one, and both name the
	// root of the resource.
	function SplitFragment( Uri )
	{
		let position = Uri.indexOf( '#' );
		if ( position < 0 ) { return { Base: Uri, Fragment: null }; }
		let fragment = Uri.substring( position + 1 );
		try { fragment = decodeURIComponent( fragment ); }
		catch ( error ) { /* left as written */ }
		return { Base: Uri.substring( 0, position ), Fragment: fragment };
	}


	//---------------------------------------------------------------------
	// Builds a registry over the caller's documents.
	function NewRegistry( Documents, DefaultDialectName )
	{
		let default_dialect = LIB_DIALECTS.FindDialect( DefaultDialectName || LIB_DIALECTS.DEFAULT_DIALECT );
		if ( default_dialect === null ) { throw new Error( `Unknown dialect [${DefaultDialectName}].` ); }

		// The documents which can be loaded on demand, keyed by normalized URI.
		let documents = {};
		let meta_uris = Object.keys( META_SCHEMAS );
		for ( let index = 0; index < meta_uris.length; index++ )
		{
			documents[ ResolveUri( meta_uris[ index ], null ) ] = META_SCHEMAS[ meta_uris[ index ] ];
		}
		if ( Documents )
		{
			let uris = Object.keys( Documents );
			for ( let index = 0; index < uris.length; index++ )
			{
				documents[ SplitFragment( ResolveUri( uris[ index ], null ) ).Base ] = Documents[ uris[ index ] ];
			}
		}

		// The resources, keyed by base URI, and every indexed schema object's place.
		let resources = {};
		let schema_index = new Map();

		let registry = {
			DefaultDialect: default_dialect,
			AddDocument: add_document,
			ResourceOf: resource_of,
			PointerOf: pointer_of,
			Lookup: lookup,
			ResolveUri: ResolveUri,
			SplitFragment: SplitFragment,
		};


		//---------------------------------------------------------------------
		// Which dialect a schema object at a resource root is written in, and with which
		// keyword table. A $schema naming a known meta-schema settles it. A $schema naming a
		// document the registry holds takes that document's dialect and its $vocabulary, which
		// is how a custom meta-schema switches a vocabulary off. Anything else inherits.
		function dialect_for( Schema, Inherited, Depth )
		{
			if ( ( Depth || 0 ) > 8 ) { return Inherited; }
			if ( jsongin.ShortType( Schema ) !== 'o' ) { return Inherited; }
			if ( typeof Schema.$schema !== 'string' ) { return Inherited; }
			let dialect = LIB_DIALECTS.FindDialect( Schema.$schema );
			if ( dialect !== null )
			{
				return { Dialect: dialect, Keywords: LIB_DIALECTS.KeywordTable( dialect, null ) };
			}
			let meta_uri = SplitFragment( ResolveUri( Schema.$schema, null ) ).Base;
			let meta = documents[ meta_uri ];
			if ( typeof meta === 'undefined' ) { return Inherited; }
			let inner = dialect_for( meta, Inherited, ( Depth || 0 ) + 1 );
			let vocabulary = ( jsongin.ShortType( meta.$vocabulary ) === 'o' ) ? meta.$vocabulary : null;
			return { Dialect: inner.Dialect, Keywords: LIB_DIALECTS.KeywordTable( inner.Dialect, vocabulary ) };
		}


		//---------------------------------------------------------------------
		// Makes a resource record.
		function new_resource( Base, Schema, Parent, Spoken )
		{
			return {
				Base: Base,
				Schema: Schema,
				Parent: Parent,
				Dialect: Spoken.Dialect,
				Keywords: Spoken.Keywords,
				Anchors: {},
				DynamicAnchors: {},
				RecursiveAnchor: false,
			};
		}


		//---------------------------------------------------------------------
		// Indexes a document reached at RetrievalUri, and returns its root resource. The root's
		// base is its own $id when it has one, since that is what its references resolve
		// against, and the document is registered under the retrieval URI as well so that a
		// reference to where it was found still finds it.
		function add_document( Schema, RetrievalUri )
		{
			let retrieval = RetrievalUri ? SplitFragment( ResolveUri( RetrievalUri, null ) ).Base : '';
			if ( Object.prototype.hasOwnProperty.call( resources, retrieval ) ) { return resources[ retrieval ]; }

			let spoken = dialect_for( Schema, { Dialect: default_dialect, Keywords: LIB_DIALECTS.KeywordTable( default_dialect, null ) }, 0 );
			let base = retrieval;
			if ( jsongin.ShortType( Schema ) === 'o' )
			{
				let id = Schema[ spoken.Dialect.IdKeyword ];
				if ( ( typeof id === 'string' ) && ( id.startsWith( '#' ) === false ) )
				{
					base = SplitFragment( ResolveUri( id, retrieval ) ).Base;
				}
			}
			let resource = new_resource( base, Schema, null, spoken );
			resources[ base ] = resource;
			resources[ retrieval ] = resource;
			index_schema( Schema, resource, [] );
			return resource;
		}


		//---------------------------------------------------------------------
		// Walks one schema object: records where it is, opens a new resource when it carries
		// an $id, records its anchors, and descends into the places its dialect keeps
		// subschemas. Nothing else is descended into, so an $id inside an unknown keyword is
		// not a resource, which is what the specification asks.
		function index_schema( Schema, Resource, Pointer )
		{
			if ( jsongin.ShortType( Schema ) !== 'o' ) { return; }
			if ( schema_index.has( Schema ) ) { return; }

			let resource = Resource;
			let pointer = Pointer;
			let dialect = resource.Dialect;

			// In the drafts where a $ref silences its siblings, an id beside one changes nothing:
			// it neither opens a resource nor moves the base the $ref resolves against.
			let id = Schema[ dialect.IdKeyword ];
			if ( dialect.RefIgnoresSiblings && Object.prototype.hasOwnProperty.call( Schema, '$ref' ) ) { id = undefined; }
			if ( typeof id === 'string' )
			{
				let resolved = ResolveUri( id, resource.Base );
				let parts = SplitFragment( resolved );
				if ( id.startsWith( '#' ) )
				{
					// A fragment-only id is an anchor in the drafts which had no anchor keyword.
					if ( dialect.AnchorInId && ( parts.Fragment !== '' ) && ( parts.Fragment.startsWith( '/' ) === false ) )
					{
						resource.Anchors[ parts.Fragment ] = Schema;
					}
				}
				else if ( ( parts.Base !== resource.Base ) || ( Pointer.length > 0 ) )
				{
					// A new resource, unless this is the document root registering itself.
					if ( Object.prototype.hasOwnProperty.call( resources, parts.Base ) === false )
					{
						let spoken = dialect_for( Schema, { Dialect: resource.Dialect, Keywords: resource.Keywords }, 0 );
						let embedded = new_resource( parts.Base, Schema, resource, spoken );
						resources[ parts.Base ] = embedded;
					}
					resource = resources[ parts.Base ];
					pointer = [];
					dialect = resource.Dialect;
					if ( dialect.AnchorInId && parts.Fragment && ( parts.Fragment.startsWith( '/' ) === false ) )
					{
						resource.Anchors[ parts.Fragment ] = Schema;
					}
				}
			}

			schema_index.set( Schema, { Resource: resource, Pointer: pointer } );

			let keywords = resource.Keywords.Definitions;
			if ( keywords.$anchor && ( typeof Schema.$anchor === 'string' ) ) { resource.Anchors[ Schema.$anchor ] = Schema; }
			if ( keywords.$dynamicAnchor && ( typeof Schema.$dynamicAnchor === 'string' ) )
			{
				resource.Anchors[ Schema.$dynamicAnchor ] = Schema;
				resource.DynamicAnchors[ Schema.$dynamicAnchor ] = Schema;
			}
			if ( keywords.$recursiveAnchor && ( Schema.$recursiveAnchor === true ) && ( pointer.length === 0 ) ) { resource.RecursiveAnchor = true; }

			let names = Object.keys( Schema );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				let definition = keywords[ name ];
				if ( !definition || !definition.Subschemas ) { continue; }
				let value = Schema[ name ];
				let value_type = jsongin.ShortType( value );
				switch ( definition.Subschemas )
				{
					case 'single':
						index_schema( value, resource, pointer.concat( [ name ] ) );
						break;
					case 'array':
						if ( value_type !== 'a' ) { break; }
						for ( let element = 0; element < value.length; element++ )
						{
							index_schema( value[ element ], resource, pointer.concat( [ name, element ] ) );
						}
						break;
					case 'map':
						if ( value_type !== 'o' ) { break; }
						{
							let keys = Object.keys( value );
							for ( let key_index = 0; key_index < keys.length; key_index++ )
							{
								index_schema( value[ keys[ key_index ] ], resource, pointer.concat( [ name, keys[ key_index ] ] ) );
							}
						}
						break;
					case 'single-or-array':
						if ( value_type === 'a' )
						{
							for ( let element = 0; element < value.length; element++ )
							{
								index_schema( value[ element ], resource, pointer.concat( [ name, element ] ) );
							}
						}
						else
						{
							index_schema( value, resource, pointer.concat( [ name ] ) );
						}
						break;
					case 'dependencies':
						if ( value_type !== 'o' ) { break; }
						{
							let keys = Object.keys( value );
							for ( let key_index = 0; key_index < keys.length; key_index++ )
							{
								if ( jsongin.ShortType( value[ keys[ key_index ] ] ) === 'a' ) { continue; }
								index_schema( value[ keys[ key_index ] ], resource, pointer.concat( [ name, keys[ key_index ] ] ) );
							}
						}
						break;
				}
			}
		}


		//---------------------------------------------------------------------
		// The resource an indexed schema object belongs to, or null for one never indexed.
		function resource_of( Schema )
		{
			let entry = schema_index.get( Schema );
			return entry ? entry.Resource : null;
		}


		//---------------------------------------------------------------------
		// The pointer of an indexed schema object within its resource, or null.
		function pointer_of( Schema )
		{
			let entry = schema_index.get( Schema );
			return entry ? entry.Pointer : null;
		}


		//---------------------------------------------------------------------
		// Finds the resource a base URI names, loading and indexing its document on demand.
		function find_resource( Base )
		{
			if ( Object.prototype.hasOwnProperty.call( resources, Base ) ) { return resources[ Base ]; }
			if ( Object.prototype.hasOwnProperty.call( documents, Base ) )
			{
				add_document( documents[ Base ], Base );
				if ( Object.prototype.hasOwnProperty.call( resources, Base ) ) { return resources[ Base ]; }
			}
			return null;
		}


		//---------------------------------------------------------------------
		// Answers a URI with the schema it names: the resource root, a pointer into it, or an
		// anchor in it. The answer carries the resource the schema is in and its pointer within
		// that resource, which may differ from the resource asked for when a pointer crosses
		// into an embedded one.
		function lookup( Uri )
		{
			let parts = SplitFragment( Uri );
			let resource = find_resource( parts.Base );
			if ( resource === null ) { throw new Error( `Cannot resolve the reference [${Uri}].` ); }

			if ( ( parts.Fragment === null ) || ( parts.Fragment === '' ) )
			{
				return { Schema: resource.Schema, Resource: resource, Pointer: [] };
			}

			if ( parts.Fragment.startsWith( '/' ) )
			{
				let segments = Support.SplitPointer( parts.Fragment );
				let node = resource.Schema;
				let owner = resource;
				let owner_pointer = [];
				for ( let index = 0; index < segments.length; index++ )
				{
					let segment = segments[ index ];
					let node_type = jsongin.ShortType( node );
					if ( node_type === 'a' )
					{
						if ( /^(0|[1-9][0-9]*)$/.test( segment ) === false ) { throw new Error( `Cannot resolve the reference [${Uri}].` ); }
						let element = parseInt( segment, 10 );
						if ( element >= node.length ) { throw new Error( `Cannot resolve the reference [${Uri}].` ); }
						node = node[ element ];
					}
					else if ( node_type === 'o' )
					{
						if ( Object.prototype.hasOwnProperty.call( node, segment ) === false ) { throw new Error( `Cannot resolve the reference [${Uri}].` ); }
						node = node[ segment ];
					}
					else
					{
						throw new Error( `Cannot resolve the reference [${Uri}].` );
					}
					// Keep track of the innermost indexed schema on the way, so that a node the
					// index never saw is still placed in the right resource.
					let entry = schema_index.get( node );
					if ( entry )
					{
						owner = entry.Resource;
						owner_pointer = entry.Pointer;
					}
					else
					{
						owner_pointer = owner_pointer.concat( [ segment ] );
					}
				}
				return { Schema: node, Resource: owner, Pointer: owner_pointer };
			}

			if ( Object.prototype.hasOwnProperty.call( resource.Anchors, parts.Fragment ) )
			{
				let schema = resource.Anchors[ parts.Fragment ];
				let entry = schema_index.get( schema );
				return { Schema: schema, Resource: entry ? entry.Resource : resource, Pointer: entry ? entry.Pointer : [] };
			}

			throw new Error( `Cannot resolve the reference [${Uri}].` );
		}


		return registry;
	}


	//---------------------------------------------------------------------
	return {
		ResolveUri: ResolveUri,
		SplitFragment: SplitFragment,
		NewRegistry: NewRegistry,
	};
};
