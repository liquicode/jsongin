'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Resolves a field reference such as '$a.x' the way an aggregation expression does.
	//
	// Returns { Found: true, Value: ... } or { Found: false }. The two are distinct: a path
	// which resolves to nothing is not the same as one which resolves to a value of
	// undefined, and only the first makes the whole reference evaluate to undefined.
	//
	// A path which crosses an array gathers the values of its elements, which is what MongoDB
	// does. Elements which do not have the field contribute ***nothing*** rather than a
	// placeholder, and a path which crosses an array always produces an array, even an empty
	// one. Verified against MongoDB 6.0.1:
	//
	//   { a: [ { x: 5 }, { y: 9 } ] }   '$a.x'    =>  [ 5 ]
	//   { a: [ { y: 9 } ] }             '$a.x'    =>  []
	//   { a: [ { x: [ 5, 6 ] } ] }      '$a.x'    =>  [ [ 5, 6 ] ]
	//   { a: [ { b: [ { c: 1 } ] } ] }  '$a.b.c'  =>  [ [ 1 ] ]
	//   { b: 1 }                        '$a.x'    =>  missing
	//
	// This used to call GetValue, whose implicit iterator pushes a value for every element
	// including the ones with nothing to give, so the first two produced [ 5, undefined ] and
	// [ undefined ]. GetValue keeps that behavior on purpose: it is documented, and the
	// placeholder keeps its result positionally aligned with the array it read from, which a
	// caller indexing into the result depends on. Sorting relies on the same thing, since
	// MongoDB treats a missing element as null when it builds a sort key rather than dropping
	// it. Only the aggregation reading of a path omits, so only this resolves that way.
	function resolve_field_path( Node, PathElements, Index )
	{
		if ( Index >= PathElements.length ) { return { Found: true, Value: Node }; }

		let key = PathElements[ Index ];
		let st_node = jsongin.ShortType( Node );

		if ( st_node === 'a' )
		{
			// An aggregation field path does NOT index an array, not even with a numeric key.
			// MongoDB applies every key to the elements, so '$a.2' against { a: [ 1, 2, 3 ] }
			// gathers the field '2' from each element and finds none, giving []. Positional
			// access is $arrayElemAt, which is a different thing entirely.
			// Verified against MongoDB 6.0.1, where '$a.2' and '$a.-1' both give [].
			//
			// This used to index the array here, counting from the end when the key was
			// negative, so '$a.2' gave 3 and '$a.-1' gave 3. Both disagreed with MongoDB.
			// Query paths are the ones which index: { 'a.2': 3 } does match, which is why
			// ResolveCandidates keeps a numeric branch and this does not.
			//
			// The key applies to the elements rather than to the array, and is not used up.
			let values = [];
			for ( let index = 0; index < Node.length; index++ )
			{
				let resolved = resolve_field_path( Node[ index ], PathElements, Index );
				if ( resolved.Found === false ) { continue; }
				values.push( resolved.Value );
			}
			return { Found: true, Value: values };
		}

		if ( st_node === 'o' )
		{
			if ( Object.prototype.hasOwnProperty.call( Node, key ) === false ) { return { Found: false }; }
			return resolve_field_path( Node[ key ], PathElements, Index + 1 );
		}

		// A scalar cannot carry the rest of the path.
		return { Found: false };
	};


	//---------------------------------------------------------------------
	function Evaluate( Document, Expression )
	{
		try
		{
			let expression_type = jsongin.ShortType( Expression );

			// A string is either a field reference or a literal string.
			if ( expression_type === 's' )
			{
				if ( Expression.startsWith( '$$' ) )
				{
					throw new Error( `Expression system variables are not supported [${Expression}].` );
				}
				if ( Expression.startsWith( '$' ) )
				{
					// A field reference. Missing fields evaluate to undefined.
					// See resolve_field_path above for why this does not call GetValue.
					let path_elements = jsongin.SplitPath( Expression.substring( 1 ) );
					let resolved = resolve_field_path( Document, path_elements, 0 );
					if ( resolved.Found === false ) { return undefined; }
					return resolved.Value;
				}
				return Expression;
			}

			// An array is evaluated element-wise.
			if ( expression_type === 'a' )
			{
				let values = [];
				for ( let index = 0; index < Expression.length; index++ )
				{
					values.push( Evaluate( Document, Expression[ index ] ) );
				}
				return values;
			}

			// An object is either an operator application or an expression object.
			if ( expression_type === 'o' )
			{
				let keys = Object.keys( Expression );

				// A single operator key is an operator application.
				if ( keys.length === 1 )
				{
					let key = keys[ 0 ];
					let operator = jsongin.ExpressionOperators[ key ];
					if ( typeof operator !== 'undefined' )
					{
						// Check the argument against the types the operator says it takes.
						// An operator is still free to validate its own argument, and does when
						// its Evaluate function is called directly rather than through here.
						if ( jsongin.ShortType( operator.ArgTypes ) === 's' )
						{
							let argument_type = jsongin.ShortType( Expression[ key ] );
							if ( operator.ArgTypes.includes( argument_type ) === false )
							{
								throw new Error( `Operator [${key}] does not take an argument of type [${argument_type}]. It takes [${operator.ArgTypes}].` );
							}
						}

						return operator.Evaluate( Document, Expression[ key ] );
					}
				}

				// Anything else is an expression object. Evaluate each of the field values.
				let evaluated = {};
				for ( let index = 0; index < keys.length; index++ )
				{
					let key = keys[ index ];
					if ( key.startsWith( '$' ) )
					{
						throw new Error( `Unrecognized expression operator [${key}].` );
					}
					evaluated[ key ] = Evaluate( Document, Expression[ key ] );
				}
				return evaluated;
			}

			// Everything else is a literal value.
			return Expression;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Evaluate: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Evaluate;
};
