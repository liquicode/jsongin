'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Refuses a projection which cannot mean anything.
	// The counterpart of the same helper in Query.js and Update.js.
	function refuse( Message )
	{
		if ( jsongin.OpLog ) { jsongin.OpLog( `Projection: ${Message}` ); }
		let error = new Error( `Projection: ${Message}` );
		if ( jsongin.OpError ) { jsongin.OpError( error.message ); }
		throw error;
	};


	//---------------------------------------------------------------------
	// Removes the field at a path from a projected document, reaching through arrays.
	//
	// A projection exclusion which crosses an array removes the field from every element and
	// keeps the array, which is what MongoDB does:
	//
	//   { a: [ { x: 1, y: 2 } ] } excluding 'a.x'  =>  { a: [ { y: 2 } ] }
	//
	// This is deliberately not DeleteValue. DeleteValue follows the $unset update operator,
	// which refuses a path reaching into an array by field name, because that is what
	// MongoDB's $unset does. Projection is not $unset and does not share that rule.
	// Routing exclusion through DeleteValue made an exclusion through an array silently
	// remove nothing.
	function exclude_path( Node, PathElements, Index )
	{
		let st_node = jsongin.ShortType( Node );
		if ( 'oa'.includes( st_node ) === false ) { return; }

		let key = PathElements[ Index ];
		let is_last = ( Index === ( PathElements.length - 1 ) );

		if ( st_node === 'a' )
		{
			// A projection exclusion does NOT index an array, not even with a numeric key.
			// MongoDB applies every key to the elements, so { 'a.2': 0 } against
			// { a: [ 1, 2, 3 ] } removes nothing and { 'a.0.x': 0 } against an array of
			// documents removes nothing either. Verified against MongoDB 6.0.1.
			//
			// This used to index the array here, counting from the end when the key was
			// negative, and then `delete` the element — which both disagreed with MongoDB
			// and left a sparse hole that is not representable in JSON.
			//
			// A key applies to every element, and the key is not used up here.
			for ( let index = 0; index < Node.length; index++ )
			{
				exclude_path( Node[ index ], PathElements, Index );
			}
			return;
		}

		if ( is_last )
		{
			delete Node[ key ];
			return;
		}
		if ( Object.prototype.hasOwnProperty.call( Node, key ) === false ) { return; }
		exclude_path( Node[ key ], PathElements, Index + 1 );
		return;
	};


	//---------------------------------------------------------------------
	// Builds the included part of a projection, preserving the shape of what it reads.
	//
	// Paths is an array of remaining path element arrays, all of which apply to Source.
	// Returns the projected value, or undefined when nothing here can be projected.
	//
	// An inclusion projection which crosses an array produces one output object per input
	// element rather than one gathered value. MongoDB does this, and it is a different rule
	// from the one an aggregation expression follows: '$a.x' gathers to [ 1, 2 ], while
	// { 'a.x': 1 } produces [ { x: 1 }, { x: 2 } ]. Computed fields keep using Evaluate and
	// so keep the gathering rule, which is why the two are resolved separately below.
	//
	// Every rule here was measured against MongoDB 6.0.1:
	//   { a: [ { x:1, y:2 }, { x:3, y:4 } ] }  'a.x'    =>  { a: [ { x:1 }, { x:3 } ] }
	//   { a: [ { x:1 }, { y:9 } ] }            'a.x'    =>  { a: [ { x:1 }, {} ] }
	//   { a: [ { x:1 }, 5, { x:2 } ] }         'a.x'    =>  { a: [ { x:1 }, { x:2 } ] }
	//   { a: [ 1, 2, 3 ] }                     'a.x'    =>  { a: [] }
	//   { a: [ [ { c:1, d:2 } ] ] }            'a.c'    =>  { a: [ [ { c:1 } ] ] }
	//   { a: [ { x:1 }, { x:2 } ] }            'a.0'    =>  { a: [ {}, {} ] }
	//   { a: 5 }                               'a.x'    =>  {}
	//
	// Note that projection descends into an array which sits directly inside another array,
	// which a query path does not. The two are different mechanisms and they differ here.
	function include_node( Source, Paths )
	{
		// A path which ends here takes the whole value.
		for ( let index = 0; index < Paths.length; index++ )
		{
			if ( Paths[ index ].length === 0 ) { return jsongin.SafeClone( Source ); }
		}

		let st_source = jsongin.ShortType( Source );

		if ( st_source === 'a' )
		{
			// Every element is projected and the array is kept. An element which cannot carry
			// a field, such as a number or a null, contributes nothing and is dropped, which
			// is why a path into an array of scalars yields an empty array.
			// The path element is not used up here: it applies to the elements.
			let projected = [];
			for ( let index = 0; index < Source.length; index++ )
			{
				if ( 'oa'.includes( jsongin.ShortType( Source[ index ] ) ) === false ) { continue; }
				let result = include_node( Source[ index ], Paths );
				if ( typeof result === 'undefined' ) { continue; }
				projected.push( result );
			}
			return projected;
		}

		if ( st_source === 'o' )
		{
			// Group the paths by the field they name next, keeping the order they were given
			// in, so that two fields taken from the same array arrive in one object.
			let groups = {};
			let order = [];
			for ( let index = 0; index < Paths.length; index++ )
			{
				let key = Paths[ index ][ 0 ];
				if ( typeof groups[ key ] === 'undefined' )
				{
					groups[ key ] = [];
					order.push( key );
				}
				groups[ key ].push( Paths[ index ].slice( 1 ) );
			}

			let projected = {};
			for ( let index = 0; index < order.length; index++ )
			{
				let key = order[ index ];
				// A field which is not in the document is omitted rather than set to undefined.
				if ( Object.prototype.hasOwnProperty.call( Source, key ) === false ) { continue; }
				let result = include_node( Source[ key ], groups[ key ] );
				if ( typeof result === 'undefined' ) { continue; }
				projected[ key ] = result;
			}
			return projected;
		}

		// A scalar cannot carry the rest of the path, so it contributes nothing.
		return undefined;
	};


	//---------------------------------------------------------------------
	function Project( Document, Projection )
	{
		// Validate the parameters.
		if ( jsongin.ShortType( Document ) !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Projection: The Document parameter must be an object.` ); }
			return null;
		}
		let st_Projection = jsongin.ShortType( Projection );
		if ( 'lu'.includes( st_Projection ) === true ) { return jsongin.SafeClone( Document ); }
		if ( st_Projection !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Projection: The Projection parameter must be an object.` ); }
			return null;
		}

		// Scan the projection.
		// A field is included when its value is a non-zero number or true, excluded when its
		// value is zero or false, and computed when its value is anything else.
		let include_keys = [];
		let exclude_keys = [];
		let computed_keys = [];
		let include_id = true;
		for ( let key in Projection )
		{
			let value = Projection[ key ];
			let value_type = jsongin.ShortType( value );
			let is_exclusion = ( ( ( value_type === 'n' ) && ( value === 0 ) ) || ( ( value_type === 'b' ) && ( value === false ) ) );
			let is_inclusion = ( ( ( value_type === 'n' ) && ( value !== 0 ) ) || ( ( value_type === 'b' ) && ( value === true ) ) );

			if ( key === '_id' )
			{
				if ( is_exclusion ) { include_id = false; }
				continue;
			}
			if ( is_exclusion ) { exclude_keys.push( key ); }
			else if ( is_inclusion ) { include_keys.push( key ); }
			else { computed_keys.push( key ); }
		}

		// Validate the projection.
		//
		// A projection which cannot mean anything throws, the same way a malformed query or
		// update document does. These used to return null and write to the OpLog, and null is
		// a value a caller can easily carry on with; MongoDB refuses both with an error.
		// A `Document` or `Projection` parameter of the wrong type still returns null, because
		// that is a statement about the data rather than about the projection.
		if ( ( exclude_keys.length > 0 ) && ( include_keys.length > 0 ) )
		{
			refuse( `Cannot combine inclusion and exclusion in the same projection.` );
		}
		if ( ( exclude_keys.length > 0 ) && ( computed_keys.length > 0 ) )
		{
			// A computed field is an inclusion, so this is the case above in disguise.
			refuse( `Cannot use an expression within an exclusion projection.` );
		}

		// Determine the type of projection.
		// A computed field implies an inclusion projection, which is what MongoDB does.
		let projection_type = 'include';
		if ( exclude_keys.length > 0 )
		{
			projection_type = 'exclude';
		}
		else if ( ( include_keys.length === 0 ) && ( computed_keys.length === 0 ) )
		{
			// Only _id was given, or nothing was.
			//
			// { _id: 0 } excludes _id from the whole document, and {} names nothing to exclude
			// at all. MongoDB returns the whole document for both, so both are exclusion
			// projections. An empty projection used to stay an inclusion with nothing to
			// include, which returned an empty document.
			// Verified against MongoDB 6.0.1.
			//
			// The aggregation $project stage has the opposite rule and refuses an empty
			// specification. That is enforced in the stage, which is the only caller that can
			// tell it is one.
			if ( include_id === false ) { projection_type = 'exclude'; }
			else if ( Object.keys( Projection ).length === 0 ) { projection_type = 'exclude'; }
		}

		// Process the projection.
		let projected = null;
		if ( projection_type === 'exclude' )
		{
			projected = jsongin.SafeClone( Document );
			for ( let index = 0; index < exclude_keys.length; index++ )
			{
				// Excluding a field which is not there is not a failure. MongoDB ignores it.
				let path_elements = jsongin.SplitPath( exclude_keys[ index ] );
				if ( path_elements.length === 0 ) { continue; }
				exclude_path( projected, path_elements, 0 );
			}
			if ( include_id === false ) { delete projected._id; }
		}
		else
		{
			projected = {};

			// Only carry the _id when the document actually has one.
			if ( include_id === true )
			{
				if ( typeof Document._id !== 'undefined' ) { projected._id = jsongin.SafeClone( Document._id ); }
			}

			if ( include_keys.length > 0 )
			{
				// The included fields are resolved together rather than one at a time, so that
				// two fields taken from the same array produce one object per element holding
				// both, which is what MongoDB returns.
				//
				// This used to read each field with GetValue and write it back with SetValue.
				// For a path crossing an array GetValue gathers every element's value into one
				// array, and writing that under the same path built an object rather than the
				// array it came from: { a: [ { x: 1 }, { x: 3 } ] } projected to
				// { a: { x: [ 1, 3 ] } }.
				let include_paths = [];
				for ( let index = 0; index < include_keys.length; index++ )
				{
					let path_elements = jsongin.SplitPath( include_keys[ index ] );
					if ( path_elements.length === 0 ) { continue; }
					include_paths.push( path_elements );
				}

				let included = include_node( Document, include_paths );
				if ( jsongin.ShortType( included ) === 'o' )
				{
					for ( let key in included )
					{
						projected[ key ] = included[ key ];
					}
				}
			}

			for ( let index = 0; index < computed_keys.length; index++ )
			{
				let key = computed_keys[ index ];
				let value = jsongin.Evaluate( Document, Projection[ key ] );
				// An expression which evaluates to a missing value omits the field.
				// An expression which evaluates to null sets the field to null.
				if ( typeof value === 'undefined' ) { continue; }
				// Cloned, because a field reference such as '$user' evaluates to the value
				// inside the given document rather than to a copy of it. Storing it as-is made
				// the projection share structure with the document it was projected from.
				let result = jsongin.SetValue( projected, key, jsongin.SafeClone( value ) );
				if ( result === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Projection: Failed to set the computed field [${key}] in the projection.` ); }
					continue;
				}
			}
		}

		// Return the projected document.
		return projected;
	};
	return Project;
};
