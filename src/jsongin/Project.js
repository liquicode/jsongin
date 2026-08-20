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
			// is why a path into an array of scalars yields an empty array. That element is
			// dropped by the undefined test below rather than by a type test here: a scalar
			// cannot carry the rest of the path and so projects to undefined on its own.
			// The path element is not used up here: it applies to the elements.
			let projected = [];
			for ( let index = 0; index < Source.length; index++ )
			{
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
	// Returns the name of the projection operator a projection value carries, or null when
	// the value is not one.
	//
	// A projection operator is written as a document holding exactly one key, which begins
	// with a '$'. Anything else is a computed field, including a document with several keys
	// and a document whose single key is an ordinary field name.
	//
	// The four MongoDB defines are $slice, $elemMatch, $ (the positional operator), and
	// $meta. The first two are implemented; the other two are refused by name, which is what
	// tells a caller they are a projection operator rather than a misspelled expression.
	const PROJECTION_OPERATORS = [ '$slice', '$elemMatch', '$', '$meta' ];

	function projection_operator_name( Value )
	{
		if ( jsongin.ShortType( Value ) !== 'o' ) { return null; }

		let keys = Object.keys( Value );
		if ( keys.length !== 1 ) { return null; }
		if ( PROJECTION_OPERATORS.includes( keys[ 0 ] ) === false ) { return null; }

		// ***$slice is a projection operator and an expression operator, and the argument is
		// what tells them apart.*** The projection form takes a count, or a skip and a limit,
		// and every one of those is a number. The expression form takes an array to slice and
		// how much of it to take, so its first operand is never a number.
		//
		// Without this test the projection form shadowed the expression form completely:
		// { r: { $slice: [ '$letters', 2 ] } } inside a $project was read as a projection of
		// the field r and refused, where MongoDB computes a new field from the expression.
		if ( keys[ 0 ] === '$slice' )
		{
			let argument = Value.$slice;
			let argument_type = jsongin.ShortType( argument );
			if ( argument_type === 'n' ) { return '$slice'; }
			if ( ( argument_type === 'a' ) && ( argument.length === 2 )
				&& ( jsongin.ShortType( argument[ 0 ] ) === 'n' )
				&& ( jsongin.ShortType( argument[ 1 ] ) === 'n' ) )
			{
				return '$slice';
			}
			return null;
		}

		return keys[ 0 ];
	};


	//---------------------------------------------------------------------
	// Rewrites a projection so that every key is a dotted path and no value is a nested
	// projection specification.
	//
	// ***A projection value which is a document is a specification for the field it sits
	// under***, so { o: { p: 1 } } means { 'o.p': 1 } and { o: { p: 0 } } means { 'o.p': 0 }.
	// The value comes from the document being projected.
	//
	// jsongin used to treat such a value as a computed field and hand it to Evaluate(), which
	// evaluated the specification as an expression and returned the specification itself. So
	// { o: { p: 0 } } projected a document containing { o: { p: 0 } } — a value the source
	// document never held. Flattening here leaves the include, exclude and computed field
	// machinery below unchanged, because it only ever sees dotted paths.
	//
	// A document value is a nested specification unless it is one of three other things:
	//   - exactly one key naming a projection operator, such as { $slice: 2 }
	//   - any key beginning with '$', which makes the value an expression
	//   - empty, which MongoDB refuses with "An empty sub-projection is not a valid value"
	//
	// Verified against MongoDB 6.0.1.
	function flatten_projection( Projection, Prefix, Flattened )
	{
		for ( let key in Projection )
		{
			// A projection key names a field path, and no field is named by the empty string,
			// so there is nothing the key could mean. Refusing it here is what lets everything
			// below assume a path with at least one element.
			if ( key.length === 0 ) { refuse( `A projection field name cannot be empty.` ); }

			let path = ( Prefix.length === 0 ) ? key : ( Prefix + '.' + key );
			let value = Projection[ key ];

			if ( jsongin.ShortType( value ) !== 'o' )
			{
				Flattened[ path ] = value;
				continue;
			}

			let keys = Object.keys( value );
			if ( keys.length === 0 )
			{
				refuse( `An empty sub-projection is not a valid value at [${path}].` );
			}

			let is_operator = ( ( keys.length === 1 ) && ( PROJECTION_OPERATORS.includes( keys[ 0 ] ) === true ) );
			let is_expression = false;
			for ( let index = 0; index < keys.length; index++ )
			{
				if ( keys[ index ].startsWith( '$' ) === true ) { is_expression = true; }
			}

			if ( ( is_operator === true ) || ( is_expression === true ) )
			{
				Flattened[ path ] = value;
				continue;
			}

			flatten_projection( value, path, Flattened );
		}

		return Flattened;
	};


	//---------------------------------------------------------------------
	// Applies a projection $slice to the array at Path, in place.
	//
	// The argument is either a count, or a [ skip, limit ] pair. A negative count takes from
	// the end, and a negative skip counts back from the end before taking forward.
	// A field which is not an array is left exactly as it is, which is what MongoDB does.
	// Verified against MongoDB 6.0.1.
	//
	// ***The argument arrives already validated.*** projection_operator_name() only reads a
	// { $slice: ... } as the projection operator when the argument is a number, or two of
	// them, so there is no third shape to refuse here.
	function apply_slice( Node, Path, Argument )
	{
		let values = jsongin.GetValue( Node, Path );
		if ( jsongin.ShortType( values ) !== 'a' ) { return; }

		let skip = 0;
		let limit = null;
		if ( jsongin.ShortType( Argument ) === 'n' )
		{
			if ( Argument < 0 ) { skip = Math.max( values.length + Argument, 0 ); }
			else { limit = Argument; }
		}
		else
		{
			skip = Argument[ 0 ];
			if ( skip < 0 ) { skip = Math.max( values.length + skip, 0 ); }
			limit = Argument[ 1 ];
		}

		let sliced = values.slice( skip );
		if ( limit !== null ) { sliced = sliced.slice( 0, limit ); }

		jsongin.SetValue( Node, Path, sliced );
	};


	//---------------------------------------------------------------------
	// Returns the first element of the array at Path which matches Criteria, wrapped in an
	// array, or undefined when the field is not an array or nothing matches.
	//
	// Only the first match is taken, which is the whole point of the operator, and the array
	// is kept around it rather than the element being lifted out.
	function apply_elem_match( Document, Path, Criteria )
	{
		let values = jsongin.GetValue( Document, Path );
		if ( jsongin.ShortType( values ) !== 'a' ) { return undefined; }

		for ( let index = 0; index < values.length; index++ )
		{
			if ( jsongin.Query( values[ index ], Criteria ) === true )
			{
				return [ jsongin.SafeClone( values[ index ] ) ];
			}
		}

		return undefined;
	};


	//---------------------------------------------------------------------
	// IsStage says whether this projection is the `$project` ***stage*** of a pipeline rather
	// than the projection of a find.
	//
	// ***There are no projection operators in a stage.*** $slice, $elemMatch, $, and $meta
	// belong to a find projection; inside a $project stage the same names are expressions, or
	// nothing at all. MongoDB refuses `{ $project: { t: { $slice: 2 } } }` with "Expression
	// $slice takes at least 2 arguments, and at most 3, but 1 were passed in" - reading it as
	// the expression operator and finding it short of operands.
	function Project( Document, Projection, IsStage = false )
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

		// Rewrite nested specifications into dotted paths, so that everything below deals only
		// in paths. This also refuses an empty field name and an empty sub-projection.
		let flat_projection = flatten_projection( Projection, '', {} );

		// Scan the projection.
		// A field is included when its value is a non-zero number or true, excluded when its
		// value is zero or false, carries a projection operator when its value is a document
		// naming one, and computed when its value is anything else.
		let include_keys = [];
		let exclude_keys = [];
		let computed_keys = [];
		let slice_keys = [];
		let elem_match_keys = [];
		let include_id = true;
		for ( let key in flat_projection )
		{
			let value = flat_projection[ key ];
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
			else
			{
				// A projection operator is a document whose only key names one. It is checked
				// before the value is treated as an expression, because the two languages
				// share the '$name' shape and a projection operator is not an expression:
				// $slice and $elemMatch both exist in the expression and query languages
				// meaning something else.
				let operator_name = IsStage ? null : projection_operator_name( value );
				if ( operator_name === '$slice' ) { slice_keys.push( { Path: key, Argument: value.$slice } ); }
				else if ( operator_name === '$elemMatch' ) { elem_match_keys.push( { Path: key, Argument: value.$elemMatch } ); }
				else if ( operator_name !== null )
				{
					// A projection operator jsongin does not implement. Reported as what it is
					// rather than being handed to Evaluate(), which would report it as an
					// unrecognized ***expression*** operator and send the reader to the wrong
					// table. That is finding D3 of the 2026-08-15 review.
					refuse( `The projection operator [${operator_name}] is not supported.` );
				}
				else { computed_keys.push( key ); }
			}
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
		// A computed field implies an inclusion projection, which is what MongoDB does, and
		// so does $elemMatch when nothing else has decided.
		//
		// ***Neither $slice nor $elemMatch conflicts with an exclusion.*** Both only decide
		// the type of projection when nothing else has, so both sit beside an exclusion quite
		// happily and are applied within it. jsongin used to refuse $elemMatch beside an
		// exclusion, which MongoDB accepts. Verified against MongoDB 6.0.1:
		//
		//   { n: 5, s: 'x', a: [ { x:1 }, { x:2 } ] }
		//     { n: 0, a: { $elemMatch: { x: 2 } } }  =>  { s: 'x', a: [ { x: 2 } ] }
		//     { n: 1, a: { $elemMatch: { x: 2 } } }  =>  { n: 5, a: [ { x: 2 } ] }
		//     {       a: { $elemMatch: { x: 2 } } }  =>  { a: [ { x: 2 } ] }
		//
		// The difference between them is only what they do on their own: $elemMatch alone is
		// an inclusion, while $slice alone returns the whole document with the slice applied.
		// That is why $slice is absent from the test below and $elemMatch is present.
		let projection_type = 'include';
		if ( exclude_keys.length > 0 )
		{
			projection_type = 'exclude';
		}
		else if ( ( include_keys.length === 0 ) && ( computed_keys.length === 0 ) && ( elem_match_keys.length === 0 ) )
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
			else if ( Object.keys( flat_projection ).length === 0 ) { projection_type = 'exclude'; }
			else if ( slice_keys.length > 0 )
			{
				// Nothing but $slice was given. Since $slice does not make a projection an
				// inclusion, there is nothing here asking for fields to be dropped, so the
				// whole document comes back with the slice applied to it.
				projection_type = 'exclude';
			}
		}

		// Process the projection.
		let projected = null;
		if ( projection_type === 'exclude' )
		{
			projected = jsongin.SafeClone( Document );
			for ( let index = 0; index < exclude_keys.length; index++ )
			{
				// Excluding a field which is not there is not a failure. MongoDB ignores it.
				exclude_path( projected, jsongin.SplitPath( exclude_keys[ index ] ), 0 );
			}
			for ( let index = 0; index < slice_keys.length; index++ )
			{
				apply_slice( projected, slice_keys[ index ].Path, slice_keys[ index ].Argument );
			}
			for ( let index = 0; index < elem_match_keys.length; index++ )
			{
				let elem_match = elem_match_keys[ index ];
				let matched = apply_elem_match( Document, elem_match.Path, elem_match.Argument );
				if ( typeof matched === 'undefined' )
				{
					// Nothing matched, or the field is not an array. The field is dropped, the
					// same way it is omitted from an inclusion projection.
					// Verified against MongoDB 6.0.1.
					exclude_path( projected, jsongin.SplitPath( elem_match.Path ), 0 );
					continue;
				}
				jsongin.SetValue( projected, elem_match.Path, matched );
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

			// A sliced field is included, once something else has made this an inclusion.
			// It is gathered with the ordinary inclusions so that it goes through the same
			// path handling, and is sliced afterwards.
			let sliced_include_keys = include_keys.slice();
			for ( let index = 0; index < slice_keys.length; index++ )
			{
				sliced_include_keys.push( slice_keys[ index ].Path );
			}

			if ( sliced_include_keys.length > 0 )
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
				for ( let index = 0; index < sliced_include_keys.length; index++ )
				{
					include_paths.push( jsongin.SplitPath( sliced_include_keys[ index ] ) );
				}

				let included = include_node( Document, include_paths );
				if ( jsongin.ShortType( included ) === 'o' )
				{
					for ( let key in included )
					{
						projected[ key ] = included[ key ];
					}
				}

				for ( let index = 0; index < slice_keys.length; index++ )
				{
					apply_slice( projected, slice_keys[ index ].Path, slice_keys[ index ].Argument );
				}
			}

			for ( let index = 0; index < elem_match_keys.length; index++ )
			{
				let elem_match = elem_match_keys[ index ];
				let matched = apply_elem_match( Document, elem_match.Path, elem_match.Argument );
				// Nothing matched, or the field is not an array. The field is omitted rather
				// than being set to an empty array. Verified against MongoDB 6.0.1.
				if ( typeof matched === 'undefined' ) { continue; }
				jsongin.SetValue( projected, elem_match.Path, matched );
			}

			for ( let index = 0; index < computed_keys.length; index++ )
			{
				let key = computed_keys[ index ];
				let value = jsongin.Evaluate( Document, flat_projection[ key ] );
				// An expression which evaluates to a missing value omits the field.
				// An expression which evaluates to null sets the field to null.
				if ( typeof value === 'undefined' ) { continue; }
				// Cloned, because a field reference such as '$user' evaluates to the value
				// inside the given document rather than to a copy of it. Storing it as-is made
				// the projection share structure with the document it was projected from.
				jsongin.SetValue( projected, key, jsongin.SafeClone( value ) );
			}
		}

		// Return the projected document.
		return projected;
	};
	return Project;
};
