'use strict';

/*
	The JSON Schema evaluator: one instance, one schema, one answer with its reasons.

	***An output*** is what evaluating a schema against an instance produces:

		Valid      whether the instance satisfies the schema
		Errors     the error units, in the specification's basic output form - keywordLocation,
		           absoluteKeywordLocation, instanceLocation and error - empty when Valid
		Props      the names of the instance's members some keyword here evaluated
		Items      the indexes of the instance's elements some keyword here evaluated
		AllItems   whether some keyword here evaluated every element

	Props, Items and AllItems are the annotations the unevaluated keywords read. They describe
	***this*** instance location only: what a keyword learned about a member's value stays
	with that member. An in-place applicator merges the annotations of a subschema which passed
	and drops those of one which failed, which is the specification's rule for annotations.

	***A context*** is what a keyword is handed: where it is in the schema and the instance,
	which resource and dialect it is in, the dynamic scope of resources entered so far, and the
	helpers it calls back into. A context is a value built fresh for every descent and never
	changed, for the reason Scope.js gives about expression scopes: two evaluations must not be
	able to see each other.

	The error units use the specification's own member names, which are camelCase, because
	they are its wire form and not ours, the way a query operator is spelled as MongoDB spells
	it.
*/

const LIB_DIALECTS = require( './Dialects.js' );

// A schema nested this deep is a schema referring to itself with nothing in the instance to
// stop it. The suite's infinite-loop case is a schema reached twice legitimately, so the guard
// is depth and never a visited set.
const MAX_DEPTH = 512;

module.exports = function ( jsongin, Support, Resolve )
{

	//---------------------------------------------------------------------
	// A fresh, valid, empty output.
	function new_output()
	{
		return { Valid: true, Errors: [], Props: new Set(), Items: new Set(), AllItems: false };
	}


	//---------------------------------------------------------------------
	// Folds a child's output into a parent's. Errors are taken when asked; annotations are
	// taken when asked, which a caller asks only for a child which passed.
	function merge( Output, Child, WithErrors, WithAnnotations )
	{
		if ( Child.Valid === false ) { Output.Valid = false; }
		if ( WithErrors )
		{
			for ( let index = 0; index < Child.Errors.length; index++ ) { Output.Errors.push( Child.Errors[ index ] ); }
		}
		if ( WithAnnotations )
		{
			Child.Props.forEach( function ( Name ) { Output.Props.add( Name ); } );
			Child.Items.forEach( function ( Index ) { Output.Items.add( Index ); } );
			if ( Child.AllItems ) { Output.AllItems = true; }
		}
	}


	//---------------------------------------------------------------------
	// Builds the context for the root of an evaluation.
	function new_root_context( Registry, Resource, Options )
	{
		return make_context( {
			Registry: Registry,
			Options: Options,
			Resource: Resource,
			DynamicScope: [ Resource ],
			KeywordPath: [],
			SchemaPointer: [],
			InstancePath: [],
			Depth: 0,
		} );
	}


	//---------------------------------------------------------------------
	// Makes a context from its fields and attaches the helpers every keyword calls.
	function make_context( Fields )
	{
		let context = {
			jsongin: jsongin,
			Support: Support,
			Registry: Fields.Registry,
			Options: Fields.Options,
			Resource: Fields.Resource,
			Dialect: Fields.Resource.Dialect,
			Keywords: Fields.Resource.Keywords,
			DynamicScope: Fields.DynamicScope,
			KeywordPath: Fields.KeywordPath,
			SchemaPointer: Fields.SchemaPointer,
			InstancePath: Fields.InstancePath,
			Depth: Fields.Depth,
		};

		context.NewOutput = new_output;
		context.Merge = merge;
		// A dialect may read a value's type its own way; MongoDB's sees a date as a date.
		context.Type = Support.JsonType;
		if ( typeof context.Dialect.InstanceType === 'function' )
		{
			context.Type = function ( Value ) { return context.Dialect.InstanceType( Value, Support.JsonType ); };
		}

		// An error unit for a keyword of the current schema object.
		context.Error = function ( Keyword, Message )
		{
			let unit = {
				valid: false,
				keywordLocation: Support.JoinPointer( context.KeywordPath.concat( [ Keyword ] ) ),
				absoluteKeywordLocation: context.Resource.Base + '#' + Support.JoinPointer( context.SchemaPointer.concat( [ Keyword ] ) ),
				instanceLocation: Support.JoinPointer( context.InstancePath ),
				error: Message,
			};
			return unit;
		};

		// Evaluates a subschema against an instance, from this context. KeywordSegments extend
		// the keyword location and InstanceSegments the instance location. Target, when given,
		// is a resolved reference, which says where the subschema lives.
		context.Evaluate = function ( Instance, Subschema, KeywordSegments, InstanceSegments, Target )
		{
			let child = descend( context, Subschema, KeywordSegments, InstanceSegments, Target );
			return evaluate( Instance, Subschema, child );
		};

		context.ResolveRef = function ( Reference )
		{
			return context.Registry.Lookup( context.Registry.ResolveUri( Reference, context.Resource.Base ) );
		};

		context.ResolveDynamicRef = function ( Reference )
		{
			let uri = context.Registry.ResolveUri( Reference, context.Resource.Base );
			let target = context.Registry.Lookup( uri );
			let fragment = context.Registry.SplitFragment( uri ).Fragment;
			if ( ( fragment === null ) || ( fragment === '' ) || fragment.startsWith( '/' ) ) { return target; }
			if ( Object.prototype.hasOwnProperty.call( target.Resource.DynamicAnchors, fragment ) === false ) { return target; }
			for ( let index = 0; index < context.DynamicScope.length; index++ )
			{
				let resource = context.DynamicScope[ index ];
				if ( Object.prototype.hasOwnProperty.call( resource.DynamicAnchors, fragment ) )
				{
					let schema = resource.DynamicAnchors[ fragment ];
					let pointer = context.Registry.PointerOf( schema ) || [];
					return { Schema: schema, Resource: resource, Pointer: pointer };
				}
			}
			return target;
		};

		context.ResolveRecursiveRef = function ( Reference )
		{
			let target = context.Registry.Lookup( context.Registry.ResolveUri( Reference, context.Resource.Base ) );
			if ( target.Resource.RecursiveAnchor !== true ) { return target; }
			if ( target.Schema !== target.Resource.Schema ) { return target; }
			for ( let index = 0; index < context.DynamicScope.length; index++ )
			{
				let resource = context.DynamicScope[ index ];
				if ( resource.RecursiveAnchor === true ) { return { Schema: resource.Schema, Resource: resource, Pointer: [] }; }
			}
			return target;
		};

		return context;
	}


	//---------------------------------------------------------------------
	// The context for a subschema reached from Parent. When the subschema belongs to another
	// resource - because it carries an $id, or because a reference led into one - the child
	// takes that resource's dialect and base and the resource joins the dynamic scope.
	function descend( Parent, Subschema, KeywordSegments, InstanceSegments, Target )
	{
		let resource = Parent.Resource;
		let pointer = Parent.SchemaPointer.concat( KeywordSegments );
		if ( Target )
		{
			resource = Target.Resource;
			pointer = Target.Pointer;
		}
		else
		{
			let known = Parent.Registry.ResourceOf( Subschema );
			if ( known !== null )
			{
				resource = known;
				pointer = Parent.Registry.PointerOf( Subschema );
			}
		}
		let scope = Parent.DynamicScope;
		if ( resource !== Parent.Resource ) { scope = Parent.DynamicScope.concat( [ resource ] ); }
		return make_context( {
			Registry: Parent.Registry,
			Options: Parent.Options,
			Resource: resource,
			DynamicScope: scope,
			KeywordPath: Parent.KeywordPath.concat( KeywordSegments ),
			SchemaPointer: pointer,
			InstancePath: Parent.InstancePath.concat( InstanceSegments ),
			Depth: Parent.Depth + 1,
		} );
	}


	//---------------------------------------------------------------------
	// Evaluates one schema against one instance in one context.
	function evaluate( Instance, Schema, Context )
	{
		if ( Context.Depth > MAX_DEPTH ) { throw new Error( `The schema nests deeper than [${MAX_DEPTH}] levels at [${Support.JoinPointer( Context.KeywordPath )}].` ); }

		let output = new_output();
		if ( Schema === true ) { return output; }
		if ( Schema === false )
		{
			output.Valid = false;
			output.Errors.push( {
				valid: false,
				keywordLocation: Support.JoinPointer( Context.KeywordPath ),
				absoluteKeywordLocation: Context.Resource.Base + '#' + Support.JoinPointer( Context.SchemaPointer ),
				instanceLocation: Support.JoinPointer( Context.InstancePath ),
				error: 'The schema is false.',
			} );
			return output;
		}
		if ( jsongin.ShortType( Schema ) !== 'o' )
		{
			throw new Error( `A schema must be an object or a boolean, not [${jsongin.ShortType( Schema )}] at [${Support.JoinPointer( Context.KeywordPath )}].` );
		}

		let keywords = Context.Keywords;
		let names = keywords.Order;
		if ( Context.Dialect.RefIgnoresSiblings && Object.prototype.hasOwnProperty.call( Schema, '$ref' ) && keywords.Definitions.$ref )
		{
			names = [ '$ref' ];
		}

		// Local carries what one keyword leaves for a sibling, and the running union of what
		// the keywords so far evaluated, which the unevaluated pair read.
		let local = { Evaluated: output };
		for ( let index = 0; index < names.length; index++ )
		{
			let name = names[ index ];
			if ( Object.prototype.hasOwnProperty.call( Schema, name ) === false ) { continue; }
			let definition = keywords.Definitions[ name ];
			let result = definition.Apply( Context, name, Instance, Schema[ name ], Schema, local );
			merge( output, result, true, true );
		}
		return output;
	}


	//---------------------------------------------------------------------
	// Evaluates an instance against a root schema and returns the output.
	//
	// Options:
	//	Dialect          the dialect to read the schema in when it does not say; '2020-12'
	//	                 when absent. A $schema naming a known meta-schema always wins.
	//	Registry         documents a reference may reach, keyed by URI.
	//	FormatAssertion  whether the format keyword refuses, rather than annotates.
	function Evaluate( Instance, Schema, Options )
	{
		let options = ( jsongin.ShortType( Options ) === 'o' ) ? Options : {};
		let dialect_name = ( typeof options.Dialect === 'string' ) ? options.Dialect : LIB_DIALECTS.DEFAULT_DIALECT;
		if ( LIB_DIALECTS.FindDialect( dialect_name ) === null ) { throw new Error( `Unknown dialect [${dialect_name}].` ); }

		let dialect = LIB_DIALECTS.FindDialect( dialect_name );

		// A dialect which refuses schemas says so before anything is evaluated, so a refusal
		// never depends on the instance reaching the keyword.
		if ( typeof dialect.CheckSchema === 'function' ) { dialect.CheckSchema( Schema, Support, '' ); }

		let registry = Resolve.NewRegistry( options.Registry, dialect_name );
		let resource = registry.AddDocument( Schema, '' );
		let context = new_root_context( registry, resource, options );

		// A dialect may insist the root is an object, as MongoDB does for a document.
		if ( ( dialect.RootMustBeObject === true ) && ( Support.JsonType( Instance ) !== 'object' ) )
		{
			let output = new_output();
			output.Valid = false;
			output.Errors.push( { valid: false, keywordLocation: '', absoluteKeywordLocation: '#', instanceLocation: '', error: 'The document is not an object.' } );
			return output;
		}
		return evaluate( Instance, Schema, context );
	}


	//---------------------------------------------------------------------
	return {
		Evaluate: Evaluate,
		MAX_DEPTH: MAX_DEPTH,
	};
};
