'use strict';

/*
	The keywords MongoDB's $jsonSchema reads differently from the draft it is built on.

	MongoDB's $jsonSchema is draft 4 with four departures, each measured on MongoDB 6.0.28,
	7.0.40 and 8.3.8 by .plans/tools/jsongin-jsonschema-probe.js at the jsonx root:

		bsonType    names a BSON type rather than a JSON one, so a date and a regular
		            expression can be asked for, and `int`, `long` and `double` are told apart.
		type        has no `integer`, and a date or a regular expression is not a `string`.
		required    reads a dotted name as a ***path***, with MongoDB's own array traversal, so
		            `required: [ 'a.k' ]` is satisfied by `{ a: [ { k: 1 } ] }`.
		properties  reads a dotted name as a path too, and applies the subschema to the value
		            at the end of it.

	The rest of the dialect is the draft 4 definitions, and what it refuses is checked once,
	before evaluation, by MongoDbDialect.js.
*/

// The alias lists the schema check reads live in ../MongoDbDialect.js.
const NUMERIC_ALIASES = [ 'int', 'long', 'double', 'decimal' ];


//---------------------------------------------------------------------
function fail( Context, Keyword, Message )
{
	let output = Context.NewOutput();
	output.Valid = false;
	output.Errors.push( Context.Error( Keyword, Message ) );
	return output;
}


//---------------------------------------------------------------------
// Whether a name is read as a path: it has a dot in it and is not an operator's name.
function is_path( Name )
{
	return Name.includes( '.' ) && ( Name.startsWith( '$' ) === false );
}


//---------------------------------------------------------------------
module.exports = {

	bsonType: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let names = Array.isArray( Value ) ? Value : [ Value ];
			let alias = Context.jsongin.BsonType( Instance, true );
			for ( let index = 0; index < names.length; index++ )
			{
				if ( names[ index ] === alias ) { return Context.NewOutput(); }
				if ( ( names[ index ] === 'number' ) && NUMERIC_ALIASES.includes( alias ) ) { return Context.NewOutput(); }
			}
			return fail( Context, Keyword, `Expected BSON type [${names.join( ', ' )}] but found [${alias}].` );
		},
	},

	typeMongo: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let names = Array.isArray( Value ) ? Value : [ Value ];
			let type = Context.Type( Instance );
			if ( names.includes( type ) ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `Expected type [${names.join( ', ' )}] but found [${type}].` );
		},
	},

	requiredMongo: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Instance ) !== 'object' ) { return Context.NewOutput(); }
			let output = Context.NewOutput();
			for ( let index = 0; index < Value.length; index++ )
			{
				let name = Value[ index ];
				let present = false;
				if ( is_path( name ) )
				{
					let criteria = {};
					criteria[ name ] = { $exists: true };
					present = Context.jsongin.Query( Instance, criteria );
				}
				else
				{
					present = Object.prototype.hasOwnProperty.call( Instance, name ) && ( typeof Instance[ name ] !== 'undefined' );
				}
				if ( present ) { continue; }
				output.Valid = false;
				output.Errors.push( Context.Error( Keyword, `The property [${name}] is required.` ) );
			}
			return output;
		},
	},

	propertiesMongo: {
		Subschemas: 'map', Priority: 20,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			if ( !Local.MatchedNames ) { Local.MatchedNames = new Set(); }
			let names = Object.keys( Value );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				let value = undefined;
				if ( is_path( name ) ) { value = Context.jsongin.GetValue( Instance, name ); }
				else if ( Object.prototype.hasOwnProperty.call( Instance, name ) ) { value = Instance[ name ]; }
				if ( typeof value === 'undefined' ) { continue; }
				Local.MatchedNames.add( name );
				output.Props.add( name );
				let result = Context.Evaluate( value, Value[ name ], [ Keyword, name ], [ name ] );
				Context.Merge( output, result, true, false );
			}
			return output;
		},
	},

};
