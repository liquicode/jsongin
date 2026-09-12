'use strict';

/*
	Infers a JSON Schema from documents.

	One document hides every field it happens not to have, so the inference reads all of the
	documents it is given and describes their union: a field is `required` when every document
	which reached its object carried it, a field seen with two types gets a `type` array, and
	an array's `items` is the union of every element of every array at that path.

	***The schema describes and never decides.*** It is a description of documents already
	seen, for a prompt, a picker or a first draft of a hand-written schema, and nothing in the
	family reads it to build a table or type a column - see R2 in the SQL adapter architecture,
	where a column inferred from a document was a defect.

	Options:
		RequiredThreshold   the share of objects a field must appear in to be required, 1 when
		                    absent, so only a field present everywhere is required. 0 makes no
		                    field required.
		MaxDistinct         when given, a scalar field with no more distinct values than this
		                    gets an `enum` of them, in the order they were first seen.
		Dialect             the $schema the result declares; 2020-12 when absent.
*/

const LIB_DIALECTS = require( './Dialects.js' );

module.exports = function ( jsongin, Support )
{

	//---------------------------------------------------------------------
	// A node of the description: what was seen at one path across every document.
	function new_node()
	{
		return {
			Count: 0,             // how many values reached this path
			Types: [],            // the JSON types seen, in order of first sight
			Integers: true,       // whether every number seen was an integer
			Dates: false,         // whether a Date was seen (a string with a format)
			Objects: 0,           // how many of the values were objects
			Properties: {},       // name -> node, for the objects
			Items: null,          // a node for the elements of the arrays, once one is seen
			Values: [],           // the distinct scalar values seen, while they are few enough
			TooMany: false,       // whether the distinct scalars outgrew MaxDistinct
		};
	}


	//---------------------------------------------------------------------
	// Records one value at a node.
	function observe( Node, Value, Options )
	{
		Node.Count++;
		let type = Support.JsonType( Value );
		let short_type = jsongin.ShortType( Value );
		if ( Node.Types.includes( type ) === false ) { Node.Types.push( type ); }
		if ( short_type === 'd' ) { Node.Dates = true; }
		if ( ( type === 'number' ) && ( Number.isInteger( Value ) === false ) ) { Node.Integers = false; }

		if ( type === 'object' )
		{
			Node.Objects++;
			let names = Support.PropertyNames( Value );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				if ( !Node.Properties[ name ] ) { Node.Properties[ name ] = new_node(); }
				observe( Node.Properties[ name ], Value[ name ], Options );
			}
			return;
		}
		if ( type === 'array' )
		{
			if ( Node.Items === null ) { Node.Items = new_node(); }
			for ( let index = 0; index < Value.length; index++ )
			{
				observe( Node.Items, Value[ index ], Options );
			}
			return;
		}

		// A scalar: remember it while the distinct values are few enough to be an enum.
		if ( ( typeof Options.MaxDistinct !== 'number' ) || Node.TooMany ) { return; }
		for ( let index = 0; index < Node.Values.length; index++ )
		{
			if ( Support.JsonEquals( Node.Values[ index ], Value ) ) { return; }
		}
		Node.Values.push( Support.AsString( Value ) );
		if ( Node.Values.length > Options.MaxDistinct ) { Node.TooMany = true; Node.Values = []; }
	}


	//---------------------------------------------------------------------
	// Writes a node as a schema.
	function describe( Node, Options )
	{
		let schema = {};
		let types = Node.Types.slice();
		if ( Node.Integers && types.includes( 'number' ) ) { types[ types.indexOf( 'number' ) ] = 'integer'; }
		if ( types.length === 1 ) { schema.type = types[ 0 ]; }
		else if ( types.length > 1 ) { schema.type = types; }
		if ( Node.Dates && ( Node.Types.length === 1 ) ) { schema.format = 'date-time'; }

		if ( Node.Objects > 0 )
		{
			let names = Object.keys( Node.Properties );
			if ( names.length > 0 )
			{
				schema.properties = {};
				let required = [];
				let threshold = ( typeof Options.RequiredThreshold === 'number' ) ? Options.RequiredThreshold : 1;
				for ( let index = 0; index < names.length; index++ )
				{
					let name = names[ index ];
					schema.properties[ name ] = describe( Node.Properties[ name ], Options );
					if ( ( threshold > 0 ) && ( ( Node.Properties[ name ].Count / Node.Objects ) >= threshold ) ) { required.push( name ); }
				}
				if ( required.length > 0 ) { schema.required = required; }
			}
		}
		if ( ( Node.Items !== null ) && ( Node.Items.Count > 0 ) )
		{
			schema.items = describe( Node.Items, Options );
		}
		if ( ( Node.Values.length > 0 ) && ( Node.TooMany === false ) && ( Node.Objects === 0 ) && ( Node.Items === null ) )
		{
			schema.enum = Node.Values.slice();
		}
		return schema;
	}


	//---------------------------------------------------------------------
	function InferSchema( Documents, Options )
	{
		let options = ( jsongin.ShortType( Options ) === 'o' ) ? Options : {};
		let dialect_name = ( typeof options.Dialect === 'string' ) ? options.Dialect : LIB_DIALECTS.DEFAULT_DIALECT;
		let dialect = LIB_DIALECTS.FindDialect( dialect_name );
		if ( dialect === null ) { throw new Error( `InferSchema: unknown dialect [${dialect_name}].` ); }
		if ( dialect.MetaSchema === null ) { throw new Error( `InferSchema: the [${dialect_name}] dialect has no meta-schema to declare; infer a JSON Schema draft instead.` ); }

		let documents = Documents;
		let documents_type = jsongin.ShortType( Documents );
		if ( documents_type === 'o' ) { documents = [ Documents ]; }
		else if ( documents_type !== 'a' ) { throw new Error( `InferSchema: Documents must be a document or an array of documents, not [${documents_type}].` ); }

		let root = new_node();
		for ( let index = 0; index < documents.length; index++ )
		{
			observe( root, documents[ index ], options );
		}
		let schema = { $schema: dialect.MetaSchema };
		Object.assign( schema, describe( root, options ) );
		return schema;
	}


	//---------------------------------------------------------------------
	return InferSchema;
};
