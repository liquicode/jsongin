'use strict';

/*
	Shared argument handling for the expression object operators.
	This is a helper module, not an operator.

	***A field name here is a name and never a path.*** $getField, $setField, and $unsetField
	take the name of one field of one document, and a dot in that name is part of the name.
	That is the whole reason the three exist: a document may hold a field literally called
	'a.b', and ordinary dotted-path syntax cannot reach it, because it means the b of the a.

	***The name has to be a constant***, known before anything runs, which is unusual in an
	expression language where almost every operand may be computed. MongoDB refuses a computed
	name however simple it is - even { $concat: [ 'a' ] }, whose operands are all constants.
	So the name is read from the ***written*** argument rather than from an evaluated one, and
	only two forms are constants:

		field: 'name'                a plain string, which must not begin with a '$'
		field: { $literal: 'name' }  which is how a name that does begin with one is written

	A bare '$name' is a field path, and reading it as a name instead would quietly do something
	other than what it says. It is refused, and the $literal form is how a caller says they
	meant the name.

	***The three operators disagree about an input which is not a document***, and that is
	reproduced here rather than smoothed over. $getField answers a null with a null and
	anything else which is not a document - a missing, an array, a number - with no value at
	all, because reading a field of a non-document is simply nothing. $setField and $unsetField
	answer a null or a missing with a null and ***refuse*** any other non-document, because
	they have to hand a document back and there is nothing to build one from.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Aggregate Tests/test-suite/Object Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	helper.Operands = arithmetic.Operands;


	//---------------------------------------------------------------------
	// Reads the constant field name out of a written `field` argument.
	// Throws when it is not one of the two constant forms, or does not name a string.
	helper.ReadFieldName = function ( FieldExpression, OperatorName )
	{
		let name = undefined;
		let expression_type = jsongin.ShortType( FieldExpression );

		if ( expression_type === 's' )
		{
			// A string beginning with a '$' is a field path rather than a name.
			if ( FieldExpression.startsWith( '$' ) === false ) { name = FieldExpression; }
		}
		else if ( expression_type === 'o' )
		{
			let keys = Object.keys( FieldExpression );
			if ( ( keys.length === 1 ) && ( keys[ 0 ] === '$literal' ) ) { name = FieldExpression.$literal; }
		}

		if ( jsongin.ShortType( name ) !== 's' )
		{
			throw new Error( `${OperatorName}: requires a constant field name, written as a string or as a [$literal], but found ${JSON.stringify( FieldExpression )} instead.` );
		}

		return name;
	};


	//---------------------------------------------------------------------
	// Reads the argument document of $getField, $setField, or $unsetField.
	// Every field named in Allowed is required, because none of the three has an optional one.
	// Returns the field name and the evaluated input; a `value` is left to the caller, which
	// is the only one of the three that has one.
	helper.ReadArgs = function ( Document, Args, OperatorName, Allowed )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			// ***The shorthand lands here.*** MongoDB lets { $getField: 'name' } stand for
			// reading the name from $$CURRENT, and jsongin has no variable scope to read it
			// from, so the message says which form to write instead of reporting a type.
			throw new Error( `${OperatorName}: requires a document naming a [field] and an [input]. The shorthand form reads [$$CURRENT], which is not supported.` );
		}

		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( Allowed.includes( keys[ index ] ) === false )
			{
				throw new Error( `${OperatorName}: [${keys[ index ]}] is not an argument of this operator.` );
			}
		}
		for ( let index = 0; index < Allowed.length; index++ )
		{
			if ( ( Allowed[ index ] in Args ) === false )
			{
				throw new Error( `${OperatorName}: requires an argument named [${Allowed[ index ]}].` );
			}
		}

		return {
			Name: helper.ReadFieldName( Args.field, OperatorName ),
			Input: jsongin.Evaluate( Document, Args.input ),
		};
	};


	//---------------------------------------------------------------------
	// Reads an input which has to be a document, for the two operators that build one.
	// Returns null when the input is null or missing, which callers propagate.
	helper.AsInputDocument = function ( Input, OperatorName )
	{
		let short_type = jsongin.ShortType( Input );
		if ( 'lu'.includes( short_type ) ) { return null; }
		if ( short_type !== 'o' )
		{
			throw new Error( `${OperatorName}: requires an input document but found a [${short_type}] instead.` );
		}
		return Input;
	};


	//---------------------------------------------------------------------
	// Copies a document one field at a time, in the order it holds them.
	//
	// ***Field order is part of the answer*** for every operator in this family, so the copy
	// has to preserve it. Assigning a field which is already there leaves it where it is and
	// assigning one which is not appends it, which is exactly what MongoDB does when it
	// merges or sets.
	helper.CopyDocument = function ( Document )
	{
		let copy = {};
		let keys = Object.keys( Document );
		for ( let index = 0; index < keys.length; index++ )
		{
			copy[ keys[ index ] ] = jsongin.SafeClone( Document[ keys[ index ] ] );
		}
		return copy;
	};


	// Return the helper.
	return helper;
};
