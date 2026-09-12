'use strict';

/*
	The applicator vocabulary: the keywords which apply subschemas to the instance or to parts
	of it.

	Two kinds live here. An ***in-place*** applicator (allOf, anyOf, oneOf, not, if/then/else,
	dependentSchemas) applies subschemas to the same instance, and passes up the annotations of
	the subschemas which passed, because the unevaluated keywords need to know what a sibling's
	subschema looked at. A ***child*** applicator (properties, items and their relatives)
	applies subschemas to members or elements, and announces which members or elements it
	covered as its own annotation.

	A few keywords read what a sibling found, through the Local object the evaluator hands to
	every keyword of one schema object: additionalProperties reads the names properties and
	patternProperties matched, items reads how many elements prefixItems covered, and the two
	contains bounds read how many elements contains matched. Priorities order them.

	See Evaluate.js for the shape of Context and of an output.
*/


//---------------------------------------------------------------------
// The names a patternProperties map matches for one instance name.
function pattern_matches( Context, Patterns, Name )
{
	let matched = [];
	let patterns = Object.keys( Patterns );
	for ( let index = 0; index < patterns.length; index++ )
	{
		if ( Context.Support.CompilePattern( patterns[ index ] ).test( Name ) ) { matched.push( patterns[ index ] ); }
	}
	return matched;
}


//---------------------------------------------------------------------
// Evaluates every element of an array of subschemas against the instance in place.
function evaluate_each( Context, Keyword, Instance, Schemas )
{
	let results = [];
	for ( let index = 0; index < Schemas.length; index++ )
	{
		results.push( Context.Evaluate( Instance, Schemas[ index ], [ Keyword, index ], [] ) );
	}
	return results;
}


//---------------------------------------------------------------------
module.exports = {

	//---------------------------------------------------------------------
	// allOf: every subschema must pass. Errors and annotations of all of them pass up.
	allOf: {
		Subschemas: 'array', Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Value ) !== 'array' ) { return output; }
			let results = evaluate_each( Context, Keyword, Instance, Value );
			for ( let index = 0; index < results.length; index++ )
			{
				Context.Merge( output, results[ index ], true, results[ index ].Valid );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// anyOf: at least one subschema must pass. Every one is evaluated, because the annotations
	// of every passing one count. When none passes, every branch's errors are reported.
	anyOf: {
		Subschemas: 'array', Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Value ) !== 'array' ) { return output; }
			let results = evaluate_each( Context, Keyword, Instance, Value );
			let passed = 0;
			for ( let index = 0; index < results.length; index++ )
			{
				if ( results[ index ].Valid )
				{
					passed++;
					Context.Merge( output, results[ index ], false, true );
				}
			}
			if ( passed === 0 )
			{
				output.Valid = false;
				for ( let index = 0; index < results.length; index++ ) { Context.Merge( output, results[ index ], true, false ); }
				output.Errors.push( Context.Error( Keyword, 'The value does not match any of the schemas.' ) );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// oneOf: exactly one subschema must pass.
	oneOf: {
		Subschemas: 'array', Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Value ) !== 'array' ) { return output; }
			let results = evaluate_each( Context, Keyword, Instance, Value );
			let passed = [];
			for ( let index = 0; index < results.length; index++ )
			{
				if ( results[ index ].Valid ) { passed.push( index ); }
			}
			if ( passed.length === 1 )
			{
				Context.Merge( output, results[ passed[ 0 ] ], false, true );
				return output;
			}
			output.Valid = false;
			if ( passed.length === 0 )
			{
				for ( let index = 0; index < results.length; index++ ) { Context.Merge( output, results[ index ], true, false ); }
				output.Errors.push( Context.Error( Keyword, 'The value does not match any of the schemas.' ) );
			}
			else
			{
				output.Errors.push( Context.Error( Keyword, `The value matches ${passed.length} of the schemas where exactly one is allowed.` ) );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// not: the subschema must fail. Nothing a failing subschema saw counts as evaluated.
	not: {
		Subschemas: 'single', Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let output = Context.NewOutput();
			let result = Context.Evaluate( Instance, Value, [ Keyword ], [] );
			if ( result.Valid )
			{
				output.Valid = false;
				output.Errors.push( Context.Error( Keyword, 'The value matches a schema it must not match.' ) );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// if: evaluated for its outcome, which then and else read. It never fails on its own, and
	// its annotations count when it passes, whether or not a then or an else is written.
	if: {
		Subschemas: 'single', Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			let result = Context.Evaluate( Instance, Value, [ Keyword ], [] );
			Local.IfPassed = result.Valid;
			if ( result.Valid ) { Context.Merge( output, result, false, true ); }
			return output;
		},
	},

	then: {
		Subschemas: 'single', Priority: 31,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Local.IfPassed !== true ) { return output; }
			let result = Context.Evaluate( Instance, Value, [ Keyword ], [] );
			Context.Merge( output, result, true, result.Valid );
			return output;
		},
	},

	else: {
		Subschemas: 'single', Priority: 31,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Local.IfPassed !== false ) { return output; }
			let result = Context.Evaluate( Instance, Value, [ Keyword ], [] );
			Context.Merge( output, result, true, result.Valid );
			return output;
		},
	},

	//---------------------------------------------------------------------
	// dependentSchemas: when the instance has a property of a given name, the schema for that
	// name applies to the whole instance.
	dependentSchemas: {
		Subschemas: 'map', Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			if ( Context.Type( Value ) !== 'object' ) { return output; }
			let present = Context.Support.PropertyNames( Instance );
			let names = Object.keys( Value );
			for ( let index = 0; index < names.length; index++ )
			{
				if ( present.includes( names[ index ] ) === false ) { continue; }
				let result = Context.Evaluate( Instance, Value[ names[ index ] ], [ Keyword, names[ index ] ], [] );
				Context.Merge( output, result, true, result.Valid );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// dependencies (draft 7 and before): dependentRequired and dependentSchemas in one keyword,
	// told apart by whether the value for a name is an array of names or a schema.
	dependencies: {
		Subschemas: 'dependencies', Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			if ( Context.Type( Value ) !== 'object' ) { return output; }
			let present = Context.Support.PropertyNames( Instance );
			let names = Object.keys( Value );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				if ( present.includes( name ) === false ) { continue; }
				let dependency = Value[ name ];
				if ( Context.Type( dependency ) === 'array' )
				{
					for ( let required_index = 0; required_index < dependency.length; required_index++ )
					{
						if ( present.includes( dependency[ required_index ] ) === false )
						{
							output.Valid = false;
							output.Errors.push( Context.Error( Keyword, `The property [${name}] requires the property [${dependency[ required_index ]}].` ) );
						}
					}
					continue;
				}
				let result = Context.Evaluate( Instance, dependency, [ Keyword, name ], [] );
				Context.Merge( output, result, true, result.Valid );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// properties: each named member is evaluated against its schema.
	properties: {
		Subschemas: 'map', Priority: 20,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			if ( Context.Type( Value ) !== 'object' ) { return output; }
			if ( !Local.MatchedNames ) { Local.MatchedNames = new Set(); }
			let present = Context.Support.PropertyNames( Instance );
			let names = Object.keys( Value );
			for ( let index = 0; index < names.length; index++ )
			{
				let name = names[ index ];
				if ( present.includes( name ) === false ) { continue; }
				Local.MatchedNames.add( name );
				output.Props.add( name );
				let result = Context.Evaluate( Instance[ name ], Value[ name ], [ Keyword, name ], [ name ] );
				Context.Merge( output, result, true, false );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// patternProperties: each member whose name matches a pattern is evaluated against that
	// pattern's schema, once per pattern it matches.
	patternProperties: {
		Subschemas: 'map', Priority: 20,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			if ( Context.Type( Value ) !== 'object' ) { return output; }
			if ( !Local.MatchedNames ) { Local.MatchedNames = new Set(); }
			let present = Context.Support.PropertyNames( Instance );
			for ( let index = 0; index < present.length; index++ )
			{
				let name = present[ index ];
				let patterns = pattern_matches( Context, Value, name );
				for ( let pattern_index = 0; pattern_index < patterns.length; pattern_index++ )
				{
					Local.MatchedNames.add( name );
					output.Props.add( name );
					let result = Context.Evaluate( Instance[ name ], Value[ patterns[ pattern_index ] ], [ Keyword, patterns[ pattern_index ] ], [ name ] );
					Context.Merge( output, result, true, false );
				}
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// additionalProperties: every member neither properties nor patternProperties matched.
	additionalProperties: {
		Subschemas: 'single', Priority: 21,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			let matched = Local.MatchedNames || new Set();
			let present = Context.Support.PropertyNames( Instance );
			for ( let index = 0; index < present.length; index++ )
			{
				let name = present[ index ];
				if ( matched.has( name ) ) { continue; }
				output.Props.add( name );
				let result = Context.Evaluate( Instance[ name ], Value, [ Keyword ], [ name ] );
				Context.Merge( output, result, true, false );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// propertyNames: every member name, as a string instance, is evaluated against the schema.
	propertyNames: {
		Subschemas: 'single', Priority: 20,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			let present = Context.Support.PropertyNames( Instance );
			for ( let index = 0; index < present.length; index++ )
			{
				let result = Context.Evaluate( present[ index ], Value, [ Keyword ], [ present[ index ] ] );
				Context.Merge( output, result, true, false );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// prefixItems (2020-12): the first elements, each against the schema at its position.
	prefixItems: {
		Subschemas: 'array', Priority: 20,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'array' ) { return output; }
			if ( Context.Type( Value ) !== 'array' ) { return output; }
			let count = Math.min( Instance.length, Value.length );
			Local.PrefixLength = Value.length;
			for ( let index = 0; index < count; index++ )
			{
				output.Items.add( index );
				let result = Context.Evaluate( Instance[ index ], Value[ index ], [ Keyword, index ], [ index ] );
				Context.Merge( output, result, true, false );
			}
			return output;
		},
	},

	//---------------------------------------------------------------------
	// items (2020-12): every element beyond the prefix, against one schema.
	items: {
		Subschemas: 'single', Priority: 21,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'array' ) { return output; }
			let start = Local.PrefixLength || 0;
			for ( let index = start; index < Instance.length; index++ )
			{
				let result = Context.Evaluate( Instance[ index ], Value, [ Keyword ], [ index ] );
				Context.Merge( output, result, true, false );
			}
			output.AllItems = true;
			return output;
		},
	},

	//---------------------------------------------------------------------
	// items (2019-09 and before): one schema for every element, or an array of schemas for
	// the first elements by position, in which case additionalItems covers the rest.
	itemsLegacy: {
		Subschemas: 'single-or-array', Priority: 20,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'array' ) { return output; }
			if ( Context.Type( Value ) === 'array' )
			{
				Local.PrefixLength = Value.length;
				let count = Math.min( Instance.length, Value.length );
				for ( let index = 0; index < count; index++ )
				{
					output.Items.add( index );
					let result = Context.Evaluate( Instance[ index ], Value[ index ], [ Keyword, index ], [ index ] );
					Context.Merge( output, result, true, false );
				}
				return output;
			}
			Local.ItemsIsSchema = true;
			for ( let index = 0; index < Instance.length; index++ )
			{
				let result = Context.Evaluate( Instance[ index ], Value, [ Keyword ], [ index ] );
				Context.Merge( output, result, true, false );
			}
			output.AllItems = true;
			return output;
		},
	},

	//---------------------------------------------------------------------
	// additionalItems (2019-09 and before): the elements beyond an array-form items. Ignored
	// when items is a single schema or absent.
	additionalItems: {
		Subschemas: 'single', Priority: 21,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'array' ) { return output; }
			if ( Local.ItemsIsSchema ) { return output; }
			if ( typeof Local.PrefixLength !== 'number' ) { return output; }
			for ( let index = Local.PrefixLength; index < Instance.length; index++ )
			{
				let result = Context.Evaluate( Instance[ index ], Value, [ Keyword ], [ index ] );
				Context.Merge( output, result, true, false );
			}
			output.AllItems = true;
			return output;
		},
	},

	//---------------------------------------------------------------------
	// contains: some element must match, unless minContains says none need to. The matching
	// elements are the annotation, and the count is left for the two bounds.
	contains: {
		Subschemas: 'single', Priority: 20,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'array' ) { return output; }
			let count = 0;
			for ( let index = 0; index < Instance.length; index++ )
			{
				let result = Context.Evaluate( Instance[ index ], Value, [ Keyword ], [ index ] );
				if ( result.Valid )
				{
					count++;
					output.Items.add( index );
				}
			}
			Local.ContainsCount = count;
			let minimum = 1;
			if ( Context.Keywords.Definitions.minContains && ( Context.Type( Schema.minContains ) === 'number' ) ) { minimum = Schema.minContains; }
			if ( ( count === 0 ) && ( minimum > 0 ) )
			{
				output.Valid = false;
				output.Errors.push( Context.Error( Keyword, 'No element matches the schema.' ) );
			}
			return output;
		},
	},

};
