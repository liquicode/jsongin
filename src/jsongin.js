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
	Engine.Operators = {

		// Logical Operators
		$and: require( './Operators/Logical/and' )( Engine ),
		$or: require( './Operators/Logical/or' )( Engine ),
		$nor: require( './Operators/Logical/nor' )( Engine ),
		$not: require( './Operators/Logical/not' )( Engine ),

		// Comparison Operators
		$ImplicitEq: require( './Operators/Comparison/ImplicitEq' )( Engine ),
		$eq: require( './Operators/Comparison/eq' )( Engine ),
		$eqx: require( './Operators/Comparison/eqx' )( Engine ),
		$ne: require( './Operators/Comparison/ne' )( Engine ),
		$nex: require( './Operators/Comparison/nex' )( Engine ),
		$gt: require( './Operators/Comparison/gt' )( Engine ),
		$gte: require( './Operators/Comparison/gte' )( Engine ),
		$lt: require( './Operators/Comparison/lt' )( Engine ),
		$lte: require( './Operators/Comparison/lte' )( Engine ),
		$in: require( './Operators/Comparison/in' )( Engine ),
		$nin: require( './Operators/Comparison/nin' )( Engine ),
		$regex: require( './Operators/Comparison/regex' )( Engine ),

		// Array Operators
		$elemMatch: require( './Operators/Array/elemMatch' )( Engine ),
		$size: require( './Operators/Array/size' )( Engine ),
		$all: require( './Operators/Array/all' )( Engine ),

		// Meta Operators
		$exists: require( './Operators/Meta/exists' )( Engine ),
		$type: require( './Operators/Meta/type' )( Engine ),
		$query: require( './Operators/Meta/query' )( Engine ),
		$noop: require( './Operators/Meta/noop' )( Engine ),

	};


	//---------------------------------------------------------------------
	Engine.ShortType = function ( Data ) // bnsloarfyu
	{
		// proposed type: (d)ate
		// proposed type: (r)egexp
		// proposed type: (e}mpty object
		let data_type = ( typeof Data );
		if ( data_type === 'boolean' ) { return 'b'; }
		if ( data_type === 'number' ) { return 'n'; }
		if ( data_type === 'string' ) { return 's'; }
		if ( data_type === 'object' ) 
		{
			if ( Data === null ) { return 'l'; }
			if ( Array.isArray( Data ) ) { return 'a'; }
			if ( ( Data instanceof RegExp ) ) { return 'r'; }
			return 'o';
		}
		if ( data_type === 'function' ) { return 'f'; }
		if ( data_type === 'symbol' ) { return 'y'; }
		if ( data_type === 'undefined' ) { return 'u'; }
		throw new Error( `Unsupported field type [${data_type}].` );
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
			Engine.Explain = [ `Query: Cleared explain on top level match.` ];
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
			if ( typeof Engine.Operators[ key ] !== 'undefined' )
			{
				// Check for top level operator.
				if ( QueryPath === '' )
				{
					if ( !Engine.Operators[ key ].TopLevel )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: Operator [${key}] cannot appear at the top level of a query. Only logical operators can appear at the top level of a query.` ); }
						return false;
					}
				}
				// Evaluate operator.
				let result = Engine.Operators[ key ].Query( Document, Query[ key ], QueryPath );
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
					// Implicit $eq
					result = Engine.Operators.$ImplicitEq.Query( Document, sub_query, sub_query_path );
				}
				if ( result === false ) { return false; }
			}
		}
		return true; // Implicit $and
	};


	//---------------------------------------------------------------------
	Engine.IsQuery = function ( Query )
	{
		if ( Engine.ShortType( Query ) !== 'o' ) { return false; }
		for ( let key in Query )
		{
			if ( typeof Engine.Operators[ key ] !== 'undefined' ) { return true; }
			if ( Engine.ShortType( Query[ key ] ) === 'o' )
			{
				if ( Engine.IsQuery( ( Query[ key ] ) ) ) { return true; }
			}
		}
		return false;
	};


	//---------------------------------------------------------------------
	Engine.Equals = function ( ObjectA, ObjectB, Strict = false )
	{
		if ( Strict )
		{
			return Engine.Operators.$eq.Query( ObjectA, ObjectB );
		}
		else
		{
			return Engine.Operators.$eqx.Query( ObjectA, ObjectB );
		}
	};


	//---------------------------------------------------------------------
	Engine.StrictEquals = function ( ObjectA, ObjectB )
	{
		return Engine.Equals( ObjectA, ObjectB, true );
	};


	// Return the engine.
	return Engine;
};
