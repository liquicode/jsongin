'use strict';
/*md

## jsongin


EngineSettings
```js
{
	PathExtensions: false,
		// allow $ symbol to indicate root in dot notation		: “$.user.login”
		// allow array elements with brackets in dot notation	: “tags[1]”
		// allow nested fields within query structure			: {user: {login: “alice” }}
	Explain: false,
		// describe execution path in the Explain array
}
```

*/

const LIB_TEXT = require( './Text' );

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
	Engine.AsNumber = function ( Data )
	{
		try
		{
			if ( !Data ) { return null; }
			let value = Number( Data );
			if ( isNaN( value ) ) { return null; }
			return value;
		}
		catch ( error )
		{
			return null;
		}
	};


	//---------------------------------------------------------------------
	Engine.AsDate = function ( Data )
	{
		try
		{
			if ( !Data ) { return null; }
			let date = new Date( Data );
			if ( isNaN( date ) ) { return null; }
			return date;
		}
		catch ( error )
		{
			return null;
		}
	};


	//---------------------------------------------------------------------
	Engine.ShortType = function ( Data ) // bnsloarefyu
	{
		// proposed type: (z} empty object
		let data_type = ( typeof Data );
		if ( data_type === 'boolean' ) { return 'b'; }
		if ( data_type === 'number' ) 
		{
			// if ( Engine.GetDate( Data ) !== null ) { return 'd'; }
			return 'n';
		}
		if ( data_type === 'string' ) 
		{
			// if ( Engine.GetDate( Data ) !== null ) { return 'd'; }
			return 's';
		}
		if ( data_type === 'object' ) 
		{
			if ( Data === null ) { return 'l'; }
			if ( Array.isArray( Data ) ) { return 'a'; }
			// if ( Engine.GetDate( Data ) !== null ) { return 'd'; }
			if ( Data instanceof RegExp ) { return 'r'; }
			if ( Data instanceof Error ) { return 'e'; }
			return 'o';
		}
		if ( data_type === 'function' ) { return 'f'; }
		if ( data_type === 'symbol' ) { return 'y'; }
		if ( data_type === 'undefined' ) { return 'u'; }
		throw new Error( `Unsupported data type [${data_type}].` );
	};


	//---------------------------------------------------------------------
	Engine.BsonType = function ( Data, ReturnAlias = false )
	{
		// Unsupported BSON Types:
		//	5 - binData
		//	7 - objectid
		//	9 - date
		//	12 - dbPointer (Deprecated)
		//	13 - javascript
		//	15 - javascriptWithScope (Deprecated)
		//	17 - timestamp
		//	19 - decimal
		//	-1 - minKey
		//	127 - maxKey
		let data_type = this.ShortType( Data );
		if ( data_type === 'b' )
		{
			return ReturnAlias ? 'bool' : 8;
		}
		else if ( data_type === 'n' )
		{
			let ns = Data.toString();
			if ( ns.includes( '.' ) )
			{
				return ReturnAlias ? 'double' : 1;
			}
			else
			{
				// if ( ( Data < Number.MIN_SAFE_INTEGER ) || ( Data > Number.MAX_SAFE_INTEGER ) )
				if ( Number.isSafeInteger( Data ) )
				{
					return ReturnAlias ? 'int' : 16; // int32
				}
				else
				{
					return ReturnAlias ? 'long' : 18; // int64
				}
			}
		}
		else if ( data_type === 's' )
		{
			return ReturnAlias ? 'string' : 2;
		}
		else if ( data_type === 'l' )
		{
			return ReturnAlias ? 'null' : 10;
		}
		else if ( data_type === 'o' )
		{
			return ReturnAlias ? 'object' : 3;
		}
		else if ( data_type === 'a' )
		{
			return ReturnAlias ? 'array' : 4;
		}
		else if ( data_type === 'r' )
		{
			return ReturnAlias ? 'regex' : 11;
		}
		else if ( data_type === 'f' )
		{
			// unsupported ?
		}
		else if ( data_type === 'y' )
		{
			return ReturnAlias ? 'symbol' : 14; // deprecated
		}
		else if ( data_type === 'u' )
		{
			return ReturnAlias ? 'undefined' : 6;
		}
		return null;
	};


	//---------------------------------------------------------------------
	Engine.Clone = function ( Value )
	{
		return JSON.parse( JSON.stringify( Value ) );
	};


	//---------------------------------------------------------------------
	Engine.SafeClone = function ( Value, AssignNotClone )
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
							if ( AssignNotClone.includes( path ) )
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
							if ( AssignNotClone.includes( path ) )
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
				default: throw new Error( `Unrecognized short type [${short_type}].` );
			}
		}
		if ( 'lu'.includes( Engine.ShortType( AssignNotClone ) ) ) { AssignNotClone = []; }
		if ( !Array.isArray( AssignNotClone ) ) { throw new Error( `The AssignValues parameter must be an array of field names in dot notation.` ); }
		let clone = clone_node( Value, '' );
		return clone;
	};
	Engine.MemberwiseClone = Engine.SafeClone;


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
	Engine.SplitPath = function ( Path )
	{
		if ( typeof Path !== 'string' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path is invalid [${QueryPath}].` ); }
			return null;
		}
		if ( Path === '' ) { return []; }
		let path_elements = Path.split( '.' );
		let path_index = 0;
		while ( path_index < path_elements.length )
		{
			let name = path_elements[ path_index ];
			// Check for empty elements.
			if ( name === '' )
			{
				if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path cannot contain empty elements in [${Path}].` ); }
				return null;
			}
			// Check for root $ symbol.
			if ( name === '$' )
			{
				if ( path_index === 0 )
				{
					if ( !Engine.Settings.PathExtensions )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path cannot start with the $ root element without path extensions in [${Path}].` ); }
						return null;
					}
					path_elements.splice( 0, 1 );
					continue;
				}
				else
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Cannot contain the $ element within path [${Path}].` ); }
					return null;
				}
			}
			// Check for bracketed [] array indexing.
			let array_index = LIB_TEXT.FindBetween( name, '[', ']' );
			if ( Engine.Settings.PathExtensions && array_index )
			{
				if ( isNaN( Number( array_index ) ) ) 
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: A non-numeric array index [${array_index}] was found in [${Path}].` ); }
					return null;
				}
				array_index = Number( array_index );
				name = LIB_TEXT.FindBetween( name, null, '[' );
				if ( name && name.length )
				{
					if ( name === '$' ) 
					{
						if ( path_index === 0 ) 
						{
							if ( !Engine.Settings.PathExtensions )
							{
								if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path cannot start with the $ root element without path extensions in [${Path}].` ); }
								return null;
							}
							path_elements.splice( 0, 1 );
						}
						else
						{
							if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Cannot contain the $ element within path [${Path}].` ); }
							return null;
						}
					}
					else
					{
						path_elements[ path_index ] = name;
						path_index++;
					}
					path_elements.splice( path_index, 0, array_index );
				}
				else
				{
					// path_elements.splice( path_index, 1, [ array_index ] );
					path_elements[ path_index ] = array_index;
				}
			}
			else if ( !isNaN( Number( name ) ) ) 
			{
				path_elements[ path_index ] = Number( name );
			}
			path_index++;
		}
		return path_elements;
	};


	//---------------------------------------------------------------------
	Engine.JoinPaths = function () // path1, path2, ...
	{
		let all_elements = [];
		for ( let index = 0; index < arguments.length; index++ )
		{
			if ( arguments[ index ] === null ) { continue; }
			let path = '' + arguments[ index ];
			let path_elements = Engine.SplitPath( path );
			if ( path_elements === null ) { continue; }
			all_elements.push( ...path_elements );
		}
		return all_elements.join( '.' );
	};


	//---------------------------------------------------------------------
	Engine.GetValue = function ( Document, Path )
	{
		// Validate Path.
		if ( typeof Path === 'undefined' ) { return Document; }
		if ( Path === null ) { return Document; }
		if ( typeof Path !== 'string' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `GetValue: Path is invalid [${Path}].` ); }
			return;
		}
		if ( Path.length === 0 ) { return Document; }

		// Pre-process the path.
		let path_elements = Engine.SplitPath( Path );
		if ( path_elements === null ) 
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `GetValue: SplitPath returned null.` ); }
			return;
		}

		// Locate the path.
		let node = Document;
		for ( let index = 0; index < path_elements.length; index++ )
		{
			let name = path_elements[ index ];
			if ( typeof node[ name ] === 'undefined' )
			{
				// Check for out of bounds index.
				if ( typeof name === 'number' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `GetValue: Array index [${name}] is out of bounds at [${Path}].` ); }
					return;
				}
				// Check for Implicit Iterator.
				let node_type = Engine.ShortType( node );
				if ( node_type !== 'a' ) { return; }
				if ( node.length === 0 ) { return; }
				// Collect array elements.
				let values = [];
				let sub_path = path_elements.slice( index ).join( '.' );
				let terminals_result = Engine.PathTerminals( node, sub_path,
					function ( Value, ValueType, Path )
					{
						values.push( Value );
					} );
				if ( terminals_result === false )
				{
					return;
				}
				// Return the array.
				return values;
			}
			else
			{
				// Walk down the path.
				node = node[ name ];
			}
		}

		// Return the node.
		return node;
	};


	//---------------------------------------------------------------------
	Engine.SetValue = function ( Document, Path, Value )
	{
		// Validate the document.
		let document_type = Engine.ShortType( Document );
		if ( !'oa'.includes( document_type ) )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Document must be an object or array.` ); }
			return false;
		}

		// Pre-process the path.
		let path_elements = Engine.SplitPath( Path );
		if ( path_elements === null ) 
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: SplitPath returned null.` ); }
			return false;
		}
		if ( path_elements.length === 0 ) 
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Cannot set a value using an empty path.` ); }
			return false;
		}

		// Locate the path.
		let node = Document;
		let current_path = '';
		for ( let index = 0; index < path_elements.length; index++ )
		{
			let name = path_elements[ index ];
			if ( current_path.length > 0 ) { current_path += '.'; }
			current_path += name;
			let parent_type = Engine.ShortType( node );
			if ( parent_type === 'o' )
			{
				if ( typeof name === 'number' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Type mismatch at [${current_path}]. Expected a field name but found an array index instead.` ); }
					return false;
				}
				if ( typeof node[ name ] === 'undefined' ) 
				{
					node[ name ] = {};
				}
				if ( index === ( path_elements.length - 1 ) )
				{
					if ( typeof Value === 'undefined' )
					{
						delete node[ name ];
					}
					else
					{
						node[ name ] = JSON.parse( JSON.stringify( Value ) );
					}
					return true;
				}
			}
			else if ( parent_type === 'a' )
			{
				if ( typeof name === 'string' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Type mismatch at [${current_path}]. Expected a array index but found a field name instead.` ); }
					return false;
				}
				//TODO: Does it make sense to add nulls for empty elements?
				//		Is it legal, or even desirable, to have undefined elements in an array?
				//TODO: Can we support a syntax that allows us to specify pushing and popping elements in an arra?
				//TODO: Can we support we support negative array indeces to allow reverse indexing?
				while ( node.length < name )
				{
					node.push( null );
				}
				if ( index === ( path_elements.length - 1 ) )
				{
					if ( typeof Value === 'undefined' )
					{
						node.splice( name, 1 );
					}
					else
					{
						node[ name ] = JSON.parse( JSON.stringify( Value ) );
					}
					return true;
				}
			}
			node = node[ name ];
		}

		// Return, OK.
		return true;
	};


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
	Engine.Query = function ( Document, Query, QueryPath = '' )
	{
		// Reset the explain stack.
		if ( ( QueryPath === '' ) && Engine.Settings.ClearExplainOnTopLevelQuery )
		{
			Engine.Explain = [];
		}

		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: The Document parameter must be an object.` ); }
			return false;
		}
		if ( Engine.ShortType( Query ) !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: The Query parameter must be an object.` ); }
			return false;
		}

		// Validate the path.
		{
			let path_elements = Engine.SplitPath( QueryPath );
			if ( path_elements === null ) 
			{
				QueryPath = '';
			}
			else
			{
				QueryPath = path_elements.join( '.' );
			}
		}
		if ( ( QueryPath === '' ) && ( Object.keys( Query ).length === 0 ) )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: An empty query object {} matches everything.` ); }
			return true;
		}

		// Evaluate the object elements.
		for ( let key in Query )
		{
			// Check for operator.
			if ( typeof Engine.QueryOperators[ key ] !== 'undefined' )
			{
				// Check for top level operator.
				if ( QueryPath === '' )
				{
					if ( !Engine.QueryOperators[ key ].TopLevel )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: Operator [${key}] cannot appear at the top level of a query. Only logical operators can appear at the top level of a query.` ); }
						return false;
					}
				}
				// Evaluate operator.
				let sub_query = Query[ key ];
				if ( typeof sub_query === 'undefined' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: Operator [${key}] cannot be set to undefined. Use $exists to chrck for a field in the document.` ); }
					return false;
				}
				let result = Engine.QueryOperators[ key ].Query( Document, sub_query, QueryPath );
				if ( result === false ) 
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: Operator [${key}] returned false at [${QueryPath}].` ); }
					return false;
				}
			}
			else
			{
				// Get the sub-query.
				let sub_query = Query[ key ];
				let sub_query_path = Engine.JoinPaths( QueryPath, key );
				let result = false;
				if ( Engine.IsQuery( sub_query ) )
				{
					result = Engine.Query( Document, sub_query, sub_query_path );
				}
				else
				{
					if ( typeof sub_query === 'undefined' )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: The implicit $eq operator cannot be set to undefined. Use $exists to chrck for a field in the document.` ); }
						return false;
					}
					// Implicit $eq
					result = Engine.QueryOperators.$ImplicitEq.Query( Document, sub_query, sub_query_path );
				}
				if ( result === false ) { return false; }
			}
		}
		return true; // Implicit $and
	};


	//---------------------------------------------------------------------
	Engine.Projection = function ( Document, Projection )
	{
		// Reset the explain stack.
		if ( Engine.Settings.ClearExplainOnTopLevelQuery )
		{
			Engine.Explain = [];
		}

		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Projection: The Document parameter must be an object.` ); }
			return null;
		}
		Document = Engine.Clone( Document );
		let st_Projection = Engine.ShortType( Projection );
		if ( 'lu'.includes( st_Projection ) === true ) { return Document; }
		if ( st_Projection !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Projection: The Projection parameter must be an object.` ); }
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
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: Cannot combine inclusion and exclusion operators in the same update.` ); }
					return null;
				}
				projection_type = 'include';
			}
			else if ( inclusion === 0 )
			{
				if ( projection_type === 'include' ) 
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: Cannot combine inclusion and exclusion operators in the same update.` ); }
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
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Projection: Failed to unset the field [${field}] in the projection.` ); }
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
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Projection: Failed to set the field [${field}] in the projection.` ); }
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
	Engine.Project = Engine.Projection;


	//---------------------------------------------------------------------
	Engine.Update = function ( Document, Update )
	{
		// Reset the explain stack.
		if ( Engine.Settings.ClearExplainOnTopLevelQuery )
		{
			Engine.Explain = [];
		}

		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: The Document parameter must be an object.` ); }
			return null;
		}
		Document = Engine.Clone( Document );
		let st_Update = Engine.ShortType( Update );
		if ( 'lu'.includes( st_Update ) === true ) { return Document; }
		if ( st_Update !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: The Update parameter must be an object.` ); }
			return null;
		}

		// Process the updates.
		for ( let key in Update )
		{
			// Check for operator.
			if ( typeof Engine.UpdateOperators[ key ] !== 'undefined' )
			{
				// Perform the update.
				let result = Engine.UpdateOperators[ key ].Update( Document, Update[ key ] );
				if ( result === false )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: The update operator [${key}] failed.` ); }
					// return false;
				}
			}
			else
			{
				if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: Unknown update operator [${key}] encountered.` ); }
			}
		}

		// Return the updated document.
		return Document;
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
	Engine.Equals = function ( ObjectA, ObjectB, Strict = false )
	{
		if ( Strict )
		{
			return Engine.QueryOperators.$eq.Query( ObjectA, ObjectB );
		}
		else
		{
			return Engine.QueryOperators.$eqx.Query( ObjectA, ObjectB );
		}
	};


	//---------------------------------------------------------------------
	Engine.StrictEquals = function ( ObjectA, ObjectB )
	{
		return Engine.Equals( ObjectA, ObjectB, true );
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
