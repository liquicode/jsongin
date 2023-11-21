'use strict';

module.exports = function ( EngineSettings = {} )
{
	if ( typeof EngineSettings.PathExtensions === 'undefined' ) { EngineSettings.PathExtensions = false; }
	if ( typeof EngineSettings.Explain === 'undefined' ) { EngineSettings.Explain = false; }
	if ( typeof EngineSettings.ClearExplainOnTopLevelQuery === 'undefined' ) { EngineSettings.ClearExplainOnTopLevelQuery = true; }

	let Engine = {};


	//---------------------------------------------------------------------
	Engine.Settings = EngineSettings;
	Engine.Explain = [];
	Engine.QueryOperators = {

		// Comparison Query Operators
		$eq: require( './Operators/Query/Comparison/eq' )( Engine ),
		$ne: require( './Operators/Query/Comparison/ne' )( Engine ),
		$gt: require( './Operators/Query/Comparison/gt' )( Engine ),
		$gte: require( './Operators/Query/Comparison/gte' )( Engine ),
		$lt: require( './Operators/Query/Comparison/lt' )( Engine ),
		$lte: require( './Operators/Query/Comparison/lte' )( Engine ),
		$in: require( './Operators/Query/Comparison/in' )( Engine ),
		$nin: require( './Operators/Query/Comparison/nin' )( Engine ),

		// Logical Query Operators
		$and: require( './Operators/Query/Logical/and' )( Engine ),
		$or: require( './Operators/Query/Logical/or' )( Engine ),
		$nor: require( './Operators/Query/Logical/nor' )( Engine ),
		$not: require( './Operators/Query/Logical/not' )( Engine ),

		// Evaluation Query Operators
		$regex: require( './Operators/Query/Evaluation/regex' )( Engine ),

		// Array Query Operators
		$elemMatch: require( './Operators/Query/Array/elemMatch' )( Engine ),
		$size: require( './Operators/Query/Array/size' )( Engine ),
		$all: require( './Operators/Query/Array/all' )( Engine ),

		// Element Query Operators
		$exists: require( './Operators/Query/Element/exists' )( Engine ),
		$type: require( './Operators/Query/Element/type' )( Engine ),
		$query: require( './Operators/Query/Element/query' )( Engine ),
		$noop: require( './Operators/Query/Element/noop' )( Engine ),

		// Extension Query Operators
		$ImplicitEq: require( './Operators/Query/Extension/ImplicitEq' )( Engine ),
		$eqx: require( './Operators/Query/Extension/eqx' )( Engine ),
		$nex: require( './Operators/Query/Extension/nex' )( Engine ),

	};
	Engine.UpdateOperators = {

		// Field Update Operators
		$set: require( './Operators/Update/Field/set' )( Engine ),
		$unset: require( './Operators/Update/Field/unset' )( Engine ),
		$rename: require( './Operators/Update/Field/rename' )( Engine ),
		$inc: require( './Operators/Update/Field/inc' )( Engine ),
		$min: require( './Operators/Update/Field/min' )( Engine ),
		$max: require( './Operators/Update/Field/max' )( Engine ),
		$mul: require( './Operators/Update/Field/mul' )( Engine ),
		$currentDate: require( './Operators/Update/Field/currentDate' )( Engine ),
		// $setOnInsert: require( './Operators/Update/setOnInsert' )( Engine ),

		// Array Update Operators
		$addToSet: require( './Operators/Update/Array/addToSet' )( Engine ),
		$pop: require( './Operators/Update/Array/pop' )( Engine ),
		$push: require( './Operators/Update/Array/push' )( Engine ),
		$pullAll: require( './Operators/Update/Array/pullAll' )( Engine ),
		// $pull: require( './Operators/Update/Array/pull' )( Engine ),
		// $: require( './Operators/Update/Array/positional_$' )( Engine ),
		// $identifier: require( './Operators/Update/Array/identifier' )( Engine ),

	};


	//---------------------------------------------------------------------
	Engine.Query = require( './jsongin/Query' )( Engine );
	Engine.Project = require( './jsongin/Project' )( Engine );
	Engine.Update = require( './jsongin/Update' )( Engine );

	//---------------------------------------------------------------------
	Engine.SplitPath = require( './jsongin/SplitPath' )( Engine );
	Engine.JoinPaths = require( './jsongin/JoinPaths' )( Engine );
	Engine.GetValue = require( './jsongin/GetValue' )( Engine );
	Engine.SetValue = require( './jsongin/SetValue' )( Engine );

	//---------------------------------------------------------------------
	Engine.ShortType = require( './jsongin/ShortType' )( Engine );
	Engine.BsonType = require( './jsongin/BsonType' )( Engine );


	//---------------------------------------------------------------------
	Engine.AsNumber = function ( Value )
	{
		try
		{
			if ( !Value ) { return null; }
			let number = Number( Value );
			if ( isNaN( number ) ) { return null; }
			return number;
		}
		catch ( error )
		{
			return null;
		}
	};


	//---------------------------------------------------------------------
	Engine.AsDate = function ( Value )
	{
		try
		{
			if ( !Value ) { return null; }
			let date = new Date( Value );
			if ( isNaN( date ) ) { return null; }
			return date;
		}
		catch ( error )
		{
			return null;
		}
	};


	//---------------------------------------------------------------------
	Engine.Clone = function ( Document )
	{
		return JSON.parse( JSON.stringify( Document ) );
	};


	//---------------------------------------------------------------------
	Engine.SafeClone = function ( Document, Exceptions )
	{
		function clone_node( Node, Path )
		{
			let short_type = Engine.ShortType( Node );
			switch ( short_type )
			{
				case 'b': return Node;
				case 'n': return Node;
				case 's': return Node;
				case 'l': return Node;
				case 'o':
					{
						let value = {};
						for ( let key in Node )
						{
							let path = Path;
							if ( !path ) { path = key; }
							else { path += '.' + key; }
							if ( Exceptions.includes( path ) )
							{
								value[ key ] = Node[ key ];
							}
							else
							{
								value[ key ] = clone_node( Node[ key ], path );
							}
						}
						return value;
					}
				case 'a':
					{
						let value = [];
						for ( let index = 0; index < Node.length; index++ )
						{
							let path = Path;
							if ( !path ) { path = '' + index; }
							else { path += '.' + index; }
							if ( Exceptions.includes( path ) )
							{
								value.push( Node[ index ] );
							}
							else
							{
								value.push( clone_node( Node[ index ], path ) );
							}
						}
						return value;
					}
				case 'r': return Node;
				case 'e': return Node;
				case 'f': return Node;
				case 'y': return Node;
				case 'u': return Node;
				default: throw new Error( `Unrecognized short type [${short_type}] at [${Path}].` );
			}
		}
		if ( 'lu'.includes( Engine.ShortType( Exceptions ) ) ) { Exceptions = []; }
		if ( !Array.isArray( Exceptions ) ) { throw new Error( `The AssignNotClone parameter must be an array of field names in dot notation.` ); }
		let clone = clone_node( Document, '' );
		return clone;
	};


	// //---------------------------------------------------------------------
	// Engine.MergeObjects = function ( ObjectA, ObjectB )
	// {
	// 	let C = JSON.parse( JSON.stringify( ObjectA ) );
	// 	function update_children( ParentA, ParentB )
	// 	{
	// 		Object.keys( ParentB ).forEach(
	// 			key =>
	// 			{
	// 				let value = ParentB[ key ];
	// 				if ( typeof ParentA[ key ] === 'undefined' )
	// 				{
	// 					ParentA[ key ] = JSON.parse( JSON.stringify( value ) );
	// 				}
	// 				else
	// 				{
	// 					if ( typeof value === 'object' )
	// 					{
	// 						// Merge objects.
	// 						update_children( ParentA[ key ], value );
	// 					}
	// 					else
	// 					{
	// 						// Overwrite values.
	// 						ParentA[ key ] = JSON.parse( JSON.stringify( value ) );
	// 					}
	// 				}
	// 			} );
	// 	}
	// 	update_children( C, ObjectB );
	// 	return C;
	// };


	//---------------------------------------------------------------------
	Engine.PathTerminals = function ( Value, Path, Callback /*( Value, ValueType, Path )*/ )
	{
		function r_PathTerminals( Value, ValuePath, PathElements )
		{
			if ( typeof Value === 'undefined' ) { return false; }
			if ( PathElements === null ) { return false; }

			let node = Value;
			let node_type = Engine.ShortType( node );
			let elements = [ ...PathElements ];

			// console.log( `Resolving type [${node_type}] at [${Path}], remaining path = [${elements.join( ( '.' ) )}].` );

			if ( node_type === 'a' )
			{
				if ( elements.length && ( typeof elements[ 0 ] === 'number' ) )
				{
					let index = elements[ 0 ];
					elements.splice( 0, 1 );
					let value_path = Engine.JoinPaths( ValuePath, index );
					let sub_node = node[ index ];
					if ( !r_PathTerminals( sub_node, value_path, elements, Callback ) ) { return false; }
				}
				else
				{
					// elements.splice( 0, 1 );
					for ( let index = 0; index < node.length; index++ )
					{
						let sub_node = node[ index ];
						let value_path = Engine.JoinPaths( ValuePath, index );
						if ( !r_PathTerminals( sub_node, value_path, elements, Callback ) ) { return false; }
					}
				}
			}
			else if ( node_type === 'o' )
			{
				let key = elements[ 0 ];
				elements.splice( 0, 1 );
				let sub_node = node[ key ];
				let sub_node_type = Engine.ShortType( sub_node );
				let value_path = Engine.JoinPaths( ValuePath, key );
				if ( elements.length === 0 )
				{
					if ( sub_node_type === 'a' )
					{
						if ( !r_PathTerminals( sub_node, value_path, elements, Callback ) ) { return false; }
					}
					else
					{
						Callback( sub_node, sub_node_type, value_path );
					}
				}
				else
				{
					if ( !r_PathTerminals( sub_node, value_path, elements, Callback ) ) { return false; }
				}

			}
			else
			{
				// elements.splice( 0, 1 );
				if ( elements.length === 0 )
				{
					Callback( node, node_type, ValuePath );
				}
				else
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `PathTerminals: Unresolved path elements exist: [${elements.join( '.' )}].` ); }
					// throw new Error( 'PathTerminals: Unresolved path elements exist.' );
					return false;
				}
			}
			return true;
		}

		let elements = Engine.SplitPath( Path );
		let result = r_PathTerminals( Value, '', elements );
		return result;
	};


	//---------------------------------------------------------------------
	Engine.IsQuery = function ( Query )
	{
		if ( Engine.ShortType( Query ) !== 'o' ) { return false; }
		for ( let key in Query )
		{
			if ( typeof Engine.QueryOperators[ key ] !== 'undefined' ) { return true; }
			//TODO: This needs more thought/work:
			// if ( Engine.ShortType( Query[ key ] ) === 'o' )
			// {
			// 	if ( Engine.Settings.PathExtensions )
			// 	{
			// 		if ( Object.keys( Query ).length === 1 )
			// 		{
			// 			if ( Engine.IsQuery( ( Query[ key ] ) ) ) { return true; }
			// 		}
			// 	}
			// }
		}
		return false;
	};


	//---------------------------------------------------------------------
	Engine.LooseEquals = function ( DocumentA, DocumentB )
	{
		return Engine.QueryOperators.$eqx.Query( DocumentA, DocumentB );
	};


	//---------------------------------------------------------------------
	Engine.StrictEquals = function ( DocumentA, DocumentB )
	{
		return Engine.QueryOperators.$eq.Query( DocumentA, DocumentB );
	};


	// //---------------------------------------------------------------------
	// Engine.MongoQuery = function ( Query, Options )
	// {
	// 	// Converts a jsongin extended Query to a Mongo Query.
	// 	throw new Error( `Not implemented.` );
	// };


	// //---------------------------------------------------------------------
	// Engine.SqlQuery = function ( Query, Options )
	// {
	// 	// Converts a jsongin extended Query to a SQL Query.
	// 	throw new Error( `Not implemented.` );
	// };


	// //---------------------------------------------------------------------
	// Engine.Format = function ( Value, Options )
	// {
	// 	// Converts an object to a string, with formatting options.
	// 	throw new Error( `Not implemented.` );
	// };


	// //---------------------------------------------------------------------
	// Engine.Parse = function ( JsonString, Options )
	// {
	// 	// Parses a string into a value.
	// 	throw new Error( `Not implemented.` );
	// };


	// Return the engine.
	return Engine;
};
