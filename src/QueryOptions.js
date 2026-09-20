'use strict';

/*
	The options a query operator is given, and the rules for passing them along.

	***One shape for everything a query carries besides the document and the criteria.***
	`Query( Document, Criteria, Path, Options )` and every operator's
	`Query( Document, MatchValue, Path, Options )` take the same fourth argument:

		{
			ExpandArrays,   whether an array field also offers each of its elements. Default true.
			Scope,          variables the caller lent the query. Default null.
		}

	***They travel unchanged.*** An operator hands its options to another operator, and to any
	criteria it gives back to `Query()`, so a setting made at the top holds for the whole
	criteria rather than evaporating one call down.

	***`$elemMatch` narrows, and is the only thing which does.*** It applies its criteria to an
	element, where an element which is itself an array is a value rather than a container, so it
	passes `ExpandArrays: false` to the operators it applies there whatever it was given. It
	narrows and never widens. Verified against MongoDB 6.0.1: `{ a: { $elemMatch: { x: 1 } } }`
	does not match `{ a: [ [ { x: 1 } ] ] }`.

	***A boolean is still accepted, and means what it always meant.*** Twenty-three operators
	were published taking `ExpandArrays` as their fourth argument, and an operator written
	against that signature is somebody's code. `false` becomes `{ ExpandArrays: false }`.

	This is a private helper, like RegExpOptions beside it: it is not attached to the engine and
	is not part of the public surface.
*/


//---------------------------------------------------------------------
// What a query does when it was told nothing: MongoDB's own semantics, and no variables.
const DEFAULT = { ExpandArrays: true, Scope: null };


//---------------------------------------------------------------------
/*
	The options to work with, whatever the caller passed.

	***A fresh object every time***, so that an operator which narrows its options cannot alter
	what its caller holds, and so that the default can never be written into by accident.
*/

function Normalize( Value )
{
	if ( ( Value === null ) || ( typeof Value === 'undefined' ) )
	{
		return { ExpandArrays: DEFAULT.ExpandArrays, Scope: DEFAULT.Scope };
	}

	// The published form: the fourth argument was ExpandArrays itself.
	if ( typeof Value === 'boolean' )
	{
		return { ExpandArrays: Value, Scope: DEFAULT.Scope };
	}

	if ( typeof Value !== 'object' )
	{
		throw new Error( `Options must be an object, or a boolean meaning ExpandArrays.` );
	}

	// ***A scope handed over bare is refused rather than ignored.*** It is the mistake this
	// shape invites - the scope used to be the fourth argument itself - and an options object
	// which happens to hold none is indistinguishable from one which was never meant to, so
	// the query would quietly run without the variables the caller lent it.
	if ( ( typeof Value.Lookup === 'function' ) && ( typeof Value.Variables === 'object' ) )
	{
		throw new Error( `Options must be an object; a scope was passed on its own. Pass { Scope: <scope> }.` );
	}

	let options = { ExpandArrays: DEFAULT.ExpandArrays, Scope: DEFAULT.Scope };
	if ( typeof Value.ExpandArrays !== 'undefined' )
	{
		if ( typeof Value.ExpandArrays !== 'boolean' ) { throw new Error( `Options.ExpandArrays must be a boolean.` ); }
		options.ExpandArrays = Value.ExpandArrays;
	}
	if ( ( typeof Value.Scope !== 'undefined' ) && ( Value.Scope !== null ) )
	{
		if ( typeof Value.Scope !== 'object' ) { throw new Error( `Options.Scope must be a scope.` ); }
		options.Scope = Value.Scope;
	}
	return options;
}


//---------------------------------------------------------------------
// The same options with array expansion turned off, for a criteria applied to an element.
// The variables travel; only the array rule narrows.

function WithoutArrayExpansion( Options )
{
	let options = Normalize( Options );
	options.ExpandArrays = false;
	return options;
}


//---------------------------------------------------------------------
module.exports = {
	DEFAULT: DEFAULT,
	Normalize: Normalize,
	WithoutArrayExpansion: WithoutArrayExpansion,
};
