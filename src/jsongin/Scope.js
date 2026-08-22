'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// A variable scope: one frame of bindings, and a link to the frame around it.
	//
	// ***A scope is a value, not engine state.*** The engine holds no "current scope" and
	// never has one: a scope is created by a caller, passed into Evaluate, and passed along
	// to every operator. That is what makes two evaluations independent of each other, and it
	// is what would let a saved scope be resumed later or captured by something which outlives
	// the frame that made it.
	//
	// ***The frames are chained rather than flattened.*** Merging a child's bindings into a
	// copy of its parent's would answer a lookup just as well and would lose the chain, which
	// is the thing worth keeping: it is what a closure captures and what a reader walks to see
	// where a name came from. A chain also costs one small object per binding rather than a
	// copy of every binding in scope, which matters when $map makes a frame per element.
	//
	// ***Frames do not change after they are made.*** New() copies the bindings it is given,
	// so a caller cannot reach back in and alter a frame something else is holding. The values
	// inside are shared references, as they are everywhere else in the engine.


	//---------------------------------------------------------------------
	// Builds a frame. Parent is the frame around it, or null for the outermost one.
	function New( Variables, Parent )
	{
		try
		{
			let st_variables = jsongin.ShortType( Variables );
			if ( ( st_variables !== 'o' ) && ( st_variables !== 'u' ) )
			{
				throw new Error( `Scope variables must be a document, not [${st_variables}].` );
			}

			let st_parent = jsongin.ShortType( Parent );
			if ( ( st_parent !== 'o' ) && ( st_parent !== 'u' ) && ( st_parent !== 'l' ) )
			{
				throw new Error( `A scope parent must be a scope or null, not [${st_parent}].` );
			}

			// The bindings are copied rather than held, so the frame cannot be altered from
			// outside once it exists. Object.keys keeps a key whose value is undefined, which
			// $$REMOVE depends on.
			let bindings = {};
			if ( st_variables === 'o' )
			{
				let names = Object.keys( Variables );
				for ( let index = 0; index < names.length; index++ )
				{
					bindings[ names[ index ] ] = Variables[ names[ index ] ];
				}
			}

			let scope = {

				Variables: bindings,
				Parent: ( st_parent === 'o' ) ? Parent : null,

				//---------------------------------------------------------------------
				// Builds a frame above this one.
				Child: function ( Variables )
				{
					return New( Variables, scope );
				},

				//---------------------------------------------------------------------
				// Builds a frame above this one which re-roots the document.
				//
				// ***More than the entry points need this.*** A $group accumulator reads
				// '$$ROOT' of each document it is accumulating, and $redact asks its
				// expression again at each level with $$CURRENT set to that level - so the
				// two names get rebound in the middle of an evaluation, not only at the top
				// of one. Naming them here keeps them out of five other files.
				ForDocument: function ( Document )
				{
					return New( { ROOT: Document, CURRENT: Document }, scope );
				},

				//---------------------------------------------------------------------
				// Resolves a variable name, innermost frame first.
				//
				// Found is reported apart from Value for the same reason resolve_field_path
				// reports it apart in Evaluate.js: ***a variable bound to nothing is not an
				// unbound variable.*** $$REMOVE is bound to nothing on purpose, and an
				// unbound name is an error. One of those is a value and the other is a
				// mistake, so they cannot share an answer.
				//
				// hasOwnProperty rather than `in`, so a variable called `toString` resolves to
				// what was bound and not to something inherited from Object.prototype.
				Lookup: function ( Name )
				{
					let frame = scope;
					while ( frame !== null )
					{
						if ( Object.prototype.hasOwnProperty.call( frame.Variables, Name ) === true )
						{
							return { Found: true, Value: frame.Variables[ Name ] };
						}
						frame = frame.Parent;
					}
					return { Found: false };
				},

			};

			return scope;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Scope.New: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	// The outermost frame of an aggregation run: what is constant for the whole pipeline.
	//
	// ***$$NOW belongs here and not on the document frame*** because MongoDB gives every
	// document and every stage of one pipeline the same instant. Reading the clock per
	// document would be the obvious implementation and would disagree with the server.
	//
	// ***$$REMOVE is bound to nothing***, which is exactly what it means. An expression which
	// answers with it produces no value, and the field being computed is left out rather than
	// set to null - the same nothing that reading an absent field gives.
	function NewPipeline( Now )
	{
		let now = Now;
		if ( jsongin.ShortType( now ) !== 'd' ) { now = new Date(); }
		return New( { NOW: now, REMOVE: undefined }, null );
	};


	//---------------------------------------------------------------------
	// The frame for one document: what a stage sees while it works on it.
	//
	// ***$$ROOT is the document the stage was handed***, which is not the document the
	// collection holds once an earlier stage has reshaped it. $$CURRENT is the same document,
	// and a bare field path such as '$a' is the shorthand for '$$CURRENT.a'.
	//
	// Parent is the pipeline frame. Called without one - which is what a bare
	// Evaluate( Document, Expression ) does - a pipeline frame is made for the occasion, so a
	// caller who never mentions a scope still has working system variables.
	function NewDocument( Document, Parent )
	{
		let parent = Parent;
		if ( jsongin.ShortType( parent ) !== 'o' ) { parent = NewPipeline(); }
		return parent.Child( { ROOT: Document, CURRENT: Document } );
	};


	//---------------------------------------------------------------------
	// Refuses a name a caller may not bind, and answers it when it is allowed.
	//
	// ***A user variable name begins with a lowercase letter, and a system variable does
	// not.*** That single rule is what keeps the two namespaces apart: because no name a
	// caller may bind can look like `$$ROOT`, a system variable can never be shadowed, and a
	// misspelled `$$Now` is a name nobody bound rather than a silent miss. It is also why
	// `$$now` is an error - lowercase makes it a user name, and no user bound it.
	//
	// ***The first character and the rest follow different rules***, so this cannot be written
	// as one character class applied to the whole name. An underscore is refused first and
	// accepted after that, which is the distinction a single rule would quietly lose.
	// Non-ASCII characters are allowed anywhere, including first, which is what MongoDB
	// documents. Verified against MongoDB 6.0.1.
	function RequireName( Name, OperatorName )
	{
		if ( jsongin.ShortType( Name ) !== 's' )
		{
			throw new Error( `${OperatorName}: requires a variable name but found a [${jsongin.ShortType( Name )}] instead.` );
		}
		if ( Name.length === 0 )
		{
			throw new Error( `${OperatorName}: requires a variable name, which cannot be empty.` );
		}

		let first = Name.charCodeAt( 0 );
		let first_is_lowercase = ( first >= 0x61 ) && ( first <= 0x7A );
		let first_is_non_ascii = ( first > 0x7F );
		if ( ( first_is_lowercase === false ) && ( first_is_non_ascii === false ) )
		{
			throw new Error( `${OperatorName}: the variable name [${Name}] must begin with a lowercase letter. Names beginning with an uppercase letter are reserved for the system variables.` );
		}

		for ( let index = 1; index < Name.length; index++ )
		{
			let code = Name.charCodeAt( index );
			let is_digit = ( code >= 0x30 ) && ( code <= 0x39 );
			let is_upper = ( code >= 0x41 ) && ( code <= 0x5A );
			let is_lower = ( code >= 0x61 ) && ( code <= 0x7A );
			let is_underscore = ( code === 0x5F );
			let is_non_ascii = ( code > 0x7F );
			if ( is_digit || is_upper || is_lower || is_underscore || is_non_ascii ) { continue; }
			throw new Error( `${OperatorName}: the variable name [${Name}] may only contain letters, digits, and underscores.` );
		}

		return Name;
	};


	//---------------------------------------------------------------------
	// Refuses a helper call which did not carry a scope along.
	//
	// ***This is here because the failure it catches is otherwise silent.*** A helper is where
	// a leaf operator's operands get evaluated, so a helper called without a scope would build
	// a fresh root one and quietly lose every variable the caller was holding. Nothing would
	// go wrong until somebody wrote a '$$name' inside that one operator.
	//
	// build/scope-check.js can see that a helper ***declares*** a Scope, but reading whether
	// each of its ~175 callers ***passes*** one means reading the code. This closes that hole
	// from the other side: the first test which touches an operator that forgot fails on it.
	function Require( Scope, Name )
	{
		if ( jsongin.ShortType( Scope ) === 'o' ) { return Scope; }
		throw new Error( `[${Name}] was called without a scope. See build/scope-check.js.` );
	};


	//---------------------------------------------------------------------
	// Gives the frame chain its wire shape: bindings and a parent link, and nothing else.
	//
	// ***The methods are the engine's and are never stored.*** A scope written down and read
	// back somewhere else must find the engine it lands in, not carry a copy of the one it
	// left. FromJSON is what puts them back.
	//
	// ***This states the shape rather than relying on Format to drop the functions.*** It does
	// drop them, so writing the scope object directly would work today and would quietly carry
	// along the first non-function field anybody adds to a frame.
	function ToJSON( Scope )
	{
		try
		{
			let st_scope = jsongin.ShortType( Scope );
			if ( ( st_scope === 'l' ) || ( st_scope === 'u' ) ) { return null; }
			if ( st_scope !== 'o' )
			{
				throw new Error( `A scope must be a document, not [${st_scope}].` );
			}

			// The bindings are copied for the same reason New() copies them: what is written
			// down must not change afterward because the frame it came from did.
			let variables = {};
			let names = Object.keys( Scope.Variables );
			for ( let index = 0; index < names.length; index++ )
			{
				variables[ names[ index ] ] = Scope.Variables[ names[ index ] ];
			}

			return {
				Variables: variables,
				Parent: ToJSON( Scope.Parent ),
			};
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Scope.ToJSON: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	// Rebuilds a frame chain from the shape ToJSON wrote.
	//
	// ***The outermost frame is built first***, because New() takes the frame around it. The
	// recursion does that on its own: a frame cannot be made until its parent has been.
	//
	// ***Format and Parse have to carry the values, not this.*** A scope holds a Date in
	// $$NOW and nothing at all in $$REMOVE, and plain JSON keeps neither - the first comes
	// back a string and the second is dropped along with its key. Use the TypedValues option
	// on both ends. Reading a scope which was written without it gives back a $$NOW which is
	// a string and no $$REMOVE at all, which is exactly what it says it is rather than an
	// error this function could detect.
	function FromJSON( Document )
	{
		try
		{
			let st_document = jsongin.ShortType( Document );
			if ( ( st_document === 'l' ) || ( st_document === 'u' ) ) { return null; }
			if ( st_document !== 'o' )
			{
				throw new Error( `A stored scope must be a document, not [${st_document}].` );
			}

			let parent = FromJSON( Document.Parent );
			return New( Document.Variables, parent );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Scope.FromJSON: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return {
		New: New,
		NewPipeline: NewPipeline,
		NewDocument: NewDocument,
		RequireName: RequireName,
		Require: Require,
		ToJSON: ToJSON,
		FromJSON: FromJSON,
	};
};
