'use strict';

module.exports = function ( jsongin )
{
	//---------------------------------------------------------------------
	// The all positional operator, '$[]', is a ***path element*** and not an update operator.
	// 'a.$[].n' means the n of every element of a, so one update reaches the whole array.
	// See expand_updates below for how it is applied, and paths_conflict for how it is
	// compared.
	const ALL_POSITIONAL = '$[]';

	// The operators which only take away from what is there. Every other operator can create
	// a field, which is what decides whether a dollar prefixed name is refused: see
	// validate_path.
	const REMOVING_OPERATORS = [ '$unset', '$pop', '$pull', '$pullAll' ];


	//---------------------------------------------------------------------
	// Refuses an update document which cannot be applied.
	//
	// This throws rather than returning the document unchanged. An unchanged document is
	// indistinguishable from a legitimate no-op, so a misspelled operator was silently
	// nothing at all. MongoDB refuses each of these with an error, verified against
	// MongoDB 6.0.1.
	//
	// The line this draws is between the update ***document*** and the update ***operation***.
	// A malformed update document is the caller's mistake and throws. An operator which cannot
	// apply to a particular document — $inc against a string, $pop against a scalar — reports
	// through the OpLog and leaves the document unchanged, which is its own contract.
	function refuse( Message )
	{
		if ( jsongin.OpLog ) { jsongin.OpLog( `Update: ${Message}` ); }
		let error = new Error( `Update: ${Message}` );
		if ( jsongin.OpError ) { jsongin.OpError( error.message ); }
		throw error;
	};


	//---------------------------------------------------------------------
	// Refuses a field path an update cannot write.
	//
	// An empty element - 'a.', '.a', 'a..b' - names a field called '', which a query may read
	// and an update may not write. A first element beginning with '$' would read as an
	// operator, and an operator which can ***create*** a field refuses to create one: $unset,
	// $pop, $pull and $pullAll only take away from what is there and are allowed it, as is the
	// source of a $rename, which only moves what is there. Below the first element a '$' is
	// an ordinary character, so { $set: { 'a.$x': 1 } } is allowed.
	//
	// jsongin used to write all of these: { $set: { 'a.': 1 } } produced { a: { '': 1 } }
	// and { $set: { '$x': 1 } } produced a field no query can name.
	// Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
	function validate_path( Path, Operator, Creates )
	{
		let elements = jsongin.SplitPath( Path );
		if ( elements.length === 0 ) { refuse( `An empty update path is not valid.` ); }
		for ( let index = 0; index < elements.length; index++ )
		{
			if ( elements[ index ] === '' ) { refuse( `The update path [${Path}] contains an empty field name, which cannot be written.` ); }
		}
		if ( ( Creates === true ) && ( typeof elements[ 0 ] === 'string' ) && elements[ 0 ].startsWith( '$' ) )
		{
			refuse( `The operator [${Operator}] cannot create the field [${Path}], whose name begins with a dollar sign.` );
		}
	};


	//---------------------------------------------------------------------
	// Two paths conflict when they are the same, or when one lies below the other. Applying
	// both would make the result depend on the order the operators happened to run in.
	//
	// The paths are compared ***as written***, one element at a time, and the all positional
	// element stands for any element: 'a.$[].n' names the n of every element of a, so it
	// already names 'a.0.n', and it names 'a.5.n' whether or not a has six elements. MongoDB
	// refuses the pair before it looks at the document, and so does this.
	//
	// This used to compare the paths after '$[]' had been expanded into the concrete indexes
	// the document happened to have. That saw the conflict across two operators and missed it
	// inside one, because the expansion wrote the concrete paths into one object where the
	// 'a.0.n' from '$[]' and the literal 'a.0.n' were the same key and the later one silently
	// won; and it missed it everywhere for an empty array, which expanded to nothing.
	// Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
	function paths_conflict( PathA, PathB )
	{
		let elements_a = PathA.split( '.' );
		let elements_b = PathB.split( '.' );
		let length = Math.min( elements_a.length, elements_b.length );
		for ( let index = 0; index < length; index++ )
		{
			if ( elements_a[ index ] === elements_b[ index ] ) { continue; }
			if ( elements_a[ index ] === ALL_POSITIONAL ) { continue; }
			if ( elements_b[ index ] === ALL_POSITIONAL ) { continue; }
			return false;
		}
		return true;
	};


	//---------------------------------------------------------------------
	// Refuses an update in which two operators write to the same path, or to a path and one
	// below it. Checked before anything is written, so a refused update leaves the document
	// untouched rather than half applied.
	//
	// $rename writes two paths: it removes its source, which is the key, and writes its
	// target, which is the value. Both are claimed. The target used to be invisible here,
	// because only keys were claimed, so { $rename: { a: 'b' }, $set: { b: 2 } } applied both
	// and answered { b: 2 } where MongoDB refuses. Claiming both is also what refuses a rename
	// onto itself, or into itself, or two renames onto one target, without a rule of its own.
	function check_for_conflicts( Updates )
	{
		let claimed = [];

		function claim( Path, Operator )
		{
			for ( let index = 0; index < claimed.length; index++ )
			{
				if ( paths_conflict( claimed[ index ].Path, Path ) === false ) { continue; }
				refuse( `The operators [${claimed[ index ].Operator}] and [${Operator}] both write to [${Path}] and [${claimed[ index ].Path}], which conflict.` );
			}
			claimed.push( { Path: Path, Operator: Operator } );
		};

		for ( let key in Updates )
		{
			// Every value here is a document: the dispatcher checks each operator's ValueTypes,
			// which is 'o' for all twelve update operators, before this runs.
			let fields = Updates[ key ];
			for ( let field in fields )
			{
				claim( field, key );
				if ( ( key === '$rename' ) && ( jsongin.ShortType( fields[ field ] ) === 's' ) ) { claim( fields[ field ], key ); }
			}
		}
	};


	//---------------------------------------------------------------------
	// ***The all positional operator is expanded here, before any operator runs***, into the
	// concrete paths it names - 'a.0.n', 'a.1.n', and so on. Every operator then works on
	// ordinary paths and none of them needs to know the syntax exists.
	//
	// Handling it inside SetValue() instead would have been the obvious place and is wrong:
	// $inc, $mul, $min, $max and $push ***read*** a field before writing it, so a SetValue
	// which fanned out would give every element the value computed from the first one.
	// Expanding the path keeps read and write on the same element.
	//
	// $rename is the exception and is refused: it names one source and one target, and there
	// is no sensible target for a source which expands to many. Verified against MongoDB 6.0.1.
	function expand_all_positional( Node, Elements, Prefix, Paths, Path )
	{
		for ( let index = 0; index < Elements.length; index++ )
		{
			if ( Elements[ index ] !== ALL_POSITIONAL )
			{
				let short_type = jsongin.ShortType( Node );
				if ( 'oa'.includes( short_type ) ) { Node = Node[ Elements[ index ] ]; }
				else { Node = undefined; }
				Prefix.push( Elements[ index ] );
				continue;
			}

			if ( jsongin.ShortType( Node ) !== 'a' )
			{
				refuse( `The path [${Path}] applies [${ALL_POSITIONAL}] to something which is not an array.` );
			}

			// An empty array names no paths at all, so the update has nothing to do rather
			// than something to refuse.
			let rest = Elements.slice( index + 1 );
			for ( let element = 0; element < Node.length; element++ )
			{
				expand_all_positional( Node[ element ], rest, Prefix.concat( [ element ] ), Paths, Path );
			}
			return;
		}

		Paths.push( Prefix.join( '.' ) );
	};


	//---------------------------------------------------------------------
	// Rewrites an update document so that no field path holds an all positional operator.
	// Returns the update document unchanged when none of them does.
	//
	// The conflict check has already run over the paths as written, so no two of the concrete
	// paths written here can be the same: a literal path which the expansion would have
	// produced was refused as a conflict with the '$[]' path before this ran.
	function expand_updates( Document, Updates )
	{
		let expanded = {};
		let found = false;

		for ( let key in Updates )
		{
			let fields = Updates[ key ];
			let rewritten = {};

			for ( let field in fields )
			{
				if ( field.includes( ALL_POSITIONAL ) === false )
				{
					rewritten[ field ] = fields[ field ];
					continue;
				}

				found = true;
				if ( key === '$rename' )
				{
					refuse( `The operator [$rename] cannot be applied through [${ALL_POSITIONAL}].` );
				}

				let paths = [];
				expand_all_positional( Document, jsongin.SplitPath( field ), [], paths, field );
				for ( let index = 0; index < paths.length; index++ )
				{
					rewritten[ paths[ index ] ] = fields[ field ];
				}
			}

			expanded[ key ] = rewritten;
		}

		if ( found === false ) { return Updates; }
		return expanded;
	};


	function Update( Document, Updates )
	{
		// Validate the parameters.
		if ( jsongin.ShortType( Document ) !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Update: The Document parameter must be an object.` ); }
			return null;
		}
		// Cloned with SafeClone rather than Clone, so that dates survive an update.
		Document = jsongin.SafeClone( Document );
		let st_Update = jsongin.ShortType( Updates );
		if ( 'lu'.includes( st_Update ) === true ) { return Document; }
		if ( st_Update !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Update: The Update parameter must be an object.` ); }
			return null;
		}

		// ***An update document with no operators is a no-op here, and that is a deliberate
		// deviation.*** MongoDB refuses it, verified against 6.0.28, 7.0.40 and 8.3.8. jsongin's
		// own Diff() answers {} for two documents which do not differ and promises that
		// Update( Before, Diff( Before, After ) ) is After, so refusing it here would break
		// the round trip. The gap is recorded in test/Parity Tests/Update Tests/Update Gaps.js.

		// Check the whole update document before applying any part of it, so that a refused
		// update leaves the document untouched rather than half written.
		for ( let key in Updates )
		{
			let operator = jsongin.UpdateOperators[ key ];
			if ( typeof operator === 'undefined' )
			{
				// A key which is not an operator is either a misspelling or a replacement
				// document. MongoDB refuses both here: a replacement is a different call.
				refuse( `Unknown update operator [${key}] encountered.` );
			}

			// Check the value against the types the operator says it takes.
			// An operator is still free to validate its own value, and does when it is
			// called directly rather than through here.
			if ( jsongin.ShortType( operator.ValueTypes ) === 's' )
			{
				let value_type = jsongin.ShortType( Updates[ key ] );
				if ( operator.ValueTypes.includes( value_type ) === false )
				{
					refuse( `Operator [${key}] does not take a value of type [${value_type}]. It takes [${operator.ValueTypes}].` );
				}
			}

			// Check every path the operator would write. A $rename's target is a path too.
			let fields = Updates[ key ];
			for ( let field in fields )
			{
				validate_path( field, key, ( REMOVING_OPERATORS.includes( key ) === false ) && ( key !== '$rename' ) );
				if ( ( key === '$rename' ) && ( jsongin.ShortType( fields[ field ] ) === 's' ) ) { validate_path( fields[ field ], key, true ); }
			}
		}

		// The conflict check reads the paths as written, with '$[]' standing for any element,
		// and runs before the expansion. See paths_conflict for why that order matters.
		check_for_conflicts( Updates );
		Updates = expand_updates( Document, Updates );

		// Process the updates.
		for ( let key in Updates )
		{
			let operator = jsongin.UpdateOperators[ key ];

			// Perform the update.
			let result = operator.Update( Document, Updates[ key ] );
			if ( result === false )
			{
				// The operator could not apply itself to this document — $inc against a
				// string, $push against a scalar. MongoDB raises an error for this, the same
				// way it does for a malformed update document, so this raises one too.
				//
				// The operator reports; the engine decides how loudly. An operator says only
				// that it could not apply, by returning false and writing the reason to the
				// OpLog, and never throws on its own. Raising it here is what a caller needs:
				// an unchanged document is indistinguishable from a legitimate no-op, so a
				// declined $inc used to look exactly like an $inc which had nothing to do.
				//
				// Nothing written before this point survives. Document is a clone made above,
				// and throwing discards it, so the caller's document is untouched.
				refuse( `The operator [${key}] could not be applied to this document. See the OpLog for the reason.` );
			}
		}

		// Return the updated document.
		return Document;
	};
	return Update;
};
