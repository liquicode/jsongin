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
	//
	// This takes no scope, and does not need one: it walks values which are already in hand
	// and never evaluates an expression, so there is nothing here a variable could appear in.
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
	// Resolves a variable reference such as '$$this' or '$$ROOT.sub.a'.
	//
	// ***The first path element is the variable name and the rest is an ordinary field path***,
	// walked by resolve_field_path exactly as '$a.b' is walked. So '$$ROOT.a' and '$a' answer
	// alike, which is the relation MongoDB defines between them.
	//
	// ***An unbound name is an error, and a name bound to nothing is a value.*** MongoDB
	// refuses an undefined variable rather than reading it as missing, which turns a
	// misspelled '$$vaule' into a stopped pipeline instead of a silently empty result.
	// $$REMOVE is the bound-to-nothing case: it resolves, and what it resolves to is nothing.
	function resolve_variable( Expression, Scope )
	{
		let path_elements = jsongin.SplitPath( Expression.substring( 2 ) );
		if ( path_elements.length === 0 )
		{
			throw new Error( `Expression variable [${Expression}] names nothing.` );
		}

		let name = path_elements[ 0 ];
		let found = Scope.Lookup( name );
		if ( found.Found === false )
		{
			throw new Error( `Expression variable [$$${name}] is not defined.` );
		}

		// Bound to nothing. Nothing has no fields either, so the rest of the path is moot.
		if ( typeof found.Value === 'undefined' ) { return undefined; }

		let resolved = resolve_field_path( found.Value, path_elements, 1 );
		if ( resolved.Found === false ) { return undefined; }
		return resolved.Value;
	};


	//---------------------------------------------------------------------
	// Evaluates an aggregation expression against a document.
	//
	// ***Scope is a value the caller owns***, not state this engine holds. See the note at the
	// top of Scope.js for why that is the shape, and Operator-Authoring.md for the convention
	// every operator follows in passing it along.
	//
	// A caller who names no scope gets one made for the occasion, so
	// Evaluate( Document, Expression ) keeps working and its system variables still resolve.
	// That default is written in the body rather than in the signature, because the arity of
	// this function is what build/scope-check.js reads.
	function Evaluate( Document, Expression, Scope )
	{
		try
		{
			if ( typeof Scope === 'undefined' ) { Scope = jsongin.Scope.NewDocument( Document ); }

			let expression_type = jsongin.ShortType( Expression );

			// A string is a variable reference, a field reference, or a literal string.
			if ( expression_type === 's' )
			{
				if ( Expression.startsWith( '$$' ) )
				{
					return resolve_variable( Expression, Scope );
				}
				if ( Expression.startsWith( '$' ) )
				{
					// A field reference. Missing fields evaluate to undefined.
					// See resolve_field_path above for why this does not call GetValue.
					//
					// ***'$a' is the shorthand for '$$CURRENT.a'***, and it is read from
					// Document rather than from the scope because every caller keeps the two
					// in step: whoever hands this function a document hands it a scope whose
					// CURRENT is that same document, which is what Scope.ForDocument() is for.
					// The day $$CURRENT can be rebound on its own, this is the line to change.
					let path_elements = jsongin.SplitPath( Expression.substring( 1 ) );
					let resolved = resolve_field_path( Document, path_elements, 0 );
					if ( resolved.Found === false ) { return undefined; }
					return resolved.Value;
				}
				return Expression;
			}

			// An array is evaluated element-wise.
			//
			// ***A position which produces nothing is filled with a null.*** An array cannot
			// leave a position out without moving every element after it, so it cannot answer
			// a missing value the way a document does. Verified against MongoDB 6.0.1, where
			// [ 1, '$nope', 3 ] and [ 1, '$$REMOVE', 3 ] both give [ 1, null, 3 ].
			if ( expression_type === 'a' )
			{
				let values = [];
				for ( let index = 0; index < Expression.length; index++ )
				{
					let value = Evaluate( Document, Expression[ index ], Scope );
					if ( typeof value === 'undefined' ) { value = null; }
					values.push( value );
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

						return operator.Evaluate( Document, Expression[ key ], Scope );
					}
				}

				// Anything else is an expression object. Evaluate each of the field values.
				//
				// ***A field which produces nothing is left out***, which is the other half of
				// the array rule above: a document can be short a field, so it is. The object
				// itself is still produced even when every field of it goes missing, so an
				// emptied { } is a value and not a nothing.
				let evaluated = {};
				for ( let index = 0; index < keys.length; index++ )
				{
					let key = keys[ index ];
					if ( key.startsWith( '$' ) )
					{
						throw new Error( `Unrecognized expression operator [${key}].` );
					}
					let value = Evaluate( Document, Expression[ key ], Scope );
					if ( typeof value === 'undefined' ) { continue; }
					evaluated[ key ] = value;
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
