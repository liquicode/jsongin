'use strict';

const LIB_REGEXP_OPTIONS = require( '../RegExpOptions' );

module.exports = function ( jsongin )
{
	//---------------------------------------------------------------------
	// Refuses a query which cannot mean anything.
	//
	// A malformed query throws rather than returning false. Returning false says "no document
	// matched", which is a legitimate answer and gives the caller no way to tell a typo from
	// an empty result: { $bogus: 1 } and { a: { $size: 'x' } } both used to report, quietly,
	// that nothing matched. MongoDB refuses every one of these with an error, verified against
	// MongoDB 6.0.1.
	//
	// This is only for a criteria the caller could not have meant. A document which simply
	// does not match still returns false, and so does a Document parameter which is not an
	// object, because that is a statement about the data rather than about the query.
	function refuse( Message )
	{
		if ( jsongin.OpLog ) { jsongin.OpLog( `Query: ${Message}` ); }
		let error = new Error( `Query: ${Message}` );
		if ( jsongin.OpError ) { jsongin.OpError( error.message ); }
		throw error;
	};


	function Query( Document, Criteria, Path = '' )
	{
		// Validate the parameters.
		if ( jsongin.ShortType( Document ) !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Query: The Document parameter must be an object.` ); }
			return false;
		}
		if ( jsongin.ShortType( Criteria ) !== 'o' )
		{
			refuse( `The Criteria parameter must be an object.` );
		}

		// Normalize the path.
		// SplitPath returns an array or throws; it never returns null, so there is no null case
		// to handle. This used to branch on one, which no input could produce.
		Path = jsongin.SplitPath( Path ).join( '.' );
		if ( ( Path === '' ) && ( Object.keys( Criteria ).length === 0 ) )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Query: An empty query object {} matches everything.` ); }
			return true;
		}
		check_operator_object( Criteria, Path );

		// Evaluate the object elements.
		for ( let key in Criteria )
		{
			// $options is not an operator of its own. It carries the flags for a sibling
			// $regex and is consumed together with it, below.
			// It used to fall through to the implicit $eq branch, which tested a field named
			// 'a.$options' against the flags string. That field is never there, so the whole
			// query returned false rather than reporting anything.
			if ( key === '$options' )
			{
				if ( typeof Criteria.$regex === 'undefined' )
				{
					refuse( `$options needs a $regex beside it at [${Path}].` );
				}
				continue;
			}

			// Check for operator.
			if ( typeof jsongin.QueryOperators[ key ] !== 'undefined' )
			{
				let operator = jsongin.QueryOperators[ key ];
				let sub_query = check_operator( key, Criteria, Path );

				let result = operator.Query( Document, sub_query, Path );
				if ( result === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Query: Operator [${key}] returned false at [${Path}].` ); }
					return false;
				}
			}
			else
			{
				// A key which begins with $ and is not a registered operator is a misspelled
				// operator, not a field name. Treating it as a field name tested a field which
				// is never there and reported that nothing matched, so a typo was
				// indistinguishable from an empty result. MongoDB refuses it.
				if ( key.startsWith( '$' ) )
				{
					refuse( `Unknown operator [${key}] at [${Path}].` );
				}

				// Get the sub-query.
				let sub_query = Criteria[ key ];
				let sub_query_path = jsongin.JoinPaths( Path, key );
				let result = false;
				if ( jsongin.IsQuery( sub_query ) )
				{
					result = jsongin.Query( Document, sub_query, sub_query_path );
				}
				else
				{
					if ( typeof sub_query === 'undefined' )
					{
						refuse( `The implicit $eq operator cannot be set to undefined. Use $exists to test if a field exists in the document.` );
					}
					// Implicit $eq
					result = jsongin.QueryOperators.$ImplicitEq.Query( Document, sub_query, sub_query_path );
				}
				if ( result === false ) { return false; }
			}
		}
		return true; // Implicit $and
	};


	//---------------------------------------------------------------------
	// Refuses a field name inside an operator object below a field.
	//
	// ***The first key decides*** (see IsQuery), so an object whose first key is an operator
	// holds operators and nothing else. { a: { $exists: true, b: 1 } } used to read b as a.b;
	// MongoDB refuses it as an unknown operator, and the same after $gt, $size or any other.
	// At the top of a query a field beside a logical operator is ordinary, so the check is for
	// a criteria below a field only. Verified against MongoDB 6.0.28 and 8.3.8, 2026-09-13.
	function check_operator_object( Criteria, Path )
	{
		if ( Path === '' ) { return; }
		if ( jsongin.IsQuery( Criteria ) === false ) { return; }
		for ( let key in Criteria )
		{
			if ( key.startsWith( '$' ) === false )
			{
				refuse( `Unknown operator [${key}] at [${Path}]. An object whose first key is an operator cannot also hold a field name.` );
			}
		}
		return;
	};


	//---------------------------------------------------------------------
	// The checks every operator gets before it is evaluated, or validated: that it sits at a
	// level it belongs to, that it has a value, and that the value is a type it takes. Returns
	// the operand to hand the operator, with a sibling $options folded into a $regex.
	//
	// ***Shared by Query and ValidateQuery***, so that what one refuses the other refuses.
	function check_operator( key, Criteria, Path )
	{
		let operator = jsongin.QueryOperators[ key ];

		// Check for top level operator.
		if ( Path === '' )
		{
			if ( !operator.TopLevel )
			{
				refuse( `Operator [${key}] cannot appear at the top level of a query. Only logical operators can appear at the top level of a query.` );
			}
		}
		else if ( operator.TopLevel && ( operator.FieldLevel !== true ) )
		{
			// The reverse. A top level operator combines or annotates whole criteria,
			// and below a field there is no criteria to combine: MongoDB reports an
			// unknown operator for { a: { $or: [ ... ] } }, and the same for $and,
			// $nor, $expr and $comment, wherever the field sits - inside $not, inside
			// a logical branch, inside $elemMatch. This used to evaluate them there.
			// An extension which belongs at both levels, $exprx, says so with
			// FieldLevel. Verified against MongoDB 6.0.28, 7.0.40 and 8.3.8.
			refuse( `Operator [${key}] cannot appear below a field. It can only appear at the top level of a query, and was found at [${Path}].` );
		}

		let sub_query = Criteria[ key ];
		if ( typeof sub_query === 'undefined' )
		{
			refuse( `Operator [${key}] cannot be set to undefined. Use $exists to test if a field exists in the document.` );
		}

		// Check the value against the types the operator says it takes.
		// An operator is still free to validate its own value, and does when it is
		// called directly rather than through here.
		if ( jsongin.ShortType( operator.ValueTypes ) === 's' )
		{
			let value_type = jsongin.ShortType( sub_query );
			if ( operator.ValueTypes.includes( value_type ) === false )
			{
				refuse( `Operator [${key}] does not take a value of type [${value_type}]. It takes [${operator.ValueTypes}].` );
			}
		}

		// Fold a sibling $options into the pattern, so that $regex stays a one value
		// operator like every other one and never has to see the rest of the criteria.
		if ( ( key === '$regex' ) && ( typeof Criteria.$options !== 'undefined' ) )
		{
			sub_query = combine_regex_options( sub_query, Criteria.$options, Path );
		}
		return sub_query;
	};


	//---------------------------------------------------------------------
	// Checks a criteria the way Query would, without a document and without stopping early.
	//
	// ***Query refuses a mistake only when it reaches it***, and evaluation stops at the first
	// condition which is false - so `{ a: 2, b: { $size: 2.5 } }` against `{ a: 1 }` answers
	// false and never sees the $size. A storage deciding whether to send a criteria to a
	// server has no document to evaluate, and an empty collection has none to refuse with.
	// This walks every operator at every level and applies the same checks Query applies:
	// the shared ones in check_operator, then whatever the operator itself refuses, asked by
	// evaluating it against an empty document. That evaluation is for its refusals only; its
	// answer means nothing and is not returned.
	//
	// The operators which carry criteria are walked here rather than through their own
	// evaluation, because evaluation short-circuits: $and stops at its first false branch,
	// and $elemMatch never evaluates against a document with no array. The shapes are each
	// operator's own - see Logical/*.js and Array/elemMatch.js, whose validate_criteria this
	// mirrors for the element form.
	const LOGICAL = [ '$and', '$or', '$nor', '$not' ];

	function ValidateQuery( Criteria, Path = '' )
	{
		if ( jsongin.ShortType( Criteria ) !== 'o' )
		{
			refuse( `The Criteria parameter must be an object.` );
		}
		Path = jsongin.SplitPath( Path ).join( '.' );
		check_operator_object( Criteria, Path );

		for ( let key in Criteria )
		{
			if ( key === '$options' )
			{
				if ( typeof Criteria.$regex === 'undefined' )
				{
					refuse( `$options needs a $regex beside it at [${Path}].` );
				}
				continue;
			}

			if ( typeof jsongin.QueryOperators[ key ] !== 'undefined' )
			{
				validate_operator( key, Criteria, Path );
				continue;
			}

			if ( key.startsWith( '$' ) )
			{
				refuse( `Unknown operator [${key}] at [${Path}].` );
			}

			let sub_query = Criteria[ key ];
			let sub_query_path = jsongin.JoinPaths( Path, key );
			if ( jsongin.IsQuery( sub_query ) )
			{
				ValidateQuery( sub_query, sub_query_path );
			}
			else if ( typeof sub_query === 'undefined' )
			{
				refuse( `The implicit $eq operator cannot be set to undefined. Use $exists to test if a field exists in the document.` );
			}
		}
		return;
	};


	// One operator: the shared checks, the criteria it carries, then its own refusals.
	function validate_operator( key, Criteria, Path )
	{
		let operator = jsongin.QueryOperators[ key ];
		let sub_query = check_operator( key, Criteria, Path );
		let sub_type = jsongin.ShortType( sub_query );

		if ( ( key === '$and' ) || ( key === '$or' ) || ( key === '$nor' ) )
		{
			if ( sub_type === 'a' )
			{
				for ( let index = 0; index < sub_query.length; index++ ) { ValidateQuery( sub_query[ index ], Path ); }
			}
		}
		else if ( key === '$not' )
		{
			if ( sub_type === 'o' ) { ValidateQuery( sub_query, Path ); }
		}
		else if ( key === '$elemMatch' )
		{
			if ( sub_type === 'o' ) { validate_element_criteria( sub_query, Path ); }
		}
		else if ( key === '$all' )
		{
			if ( sub_type === 'a' )
			{
				for ( let index = 0; index < sub_query.length; index++ )
				{
					let entry = sub_query[ index ];
					if ( ( jsongin.ShortType( entry ) === 'o' ) && ( Object.keys( entry )[ 0 ] === '$elemMatch' ) )
					{
						validate_operator( '$elemMatch', entry, Path );
					}
				}
			}
		}

		// The operator's own checks, which it makes before looking at a document.
		operator.Query( {}, sub_query, Path );
		return;
	};


	// The criteria an $elemMatch carries, in the shape element_matches reads it: a logical key
	// combines element criteria, another operator applies to the element itself, and anything
	// else is a field of the element.
	function validate_element_criteria( Criteria, Path )
	{
		for ( let key in Criteria )
		{
			let value = Criteria[ key ];
			let value_type = jsongin.ShortType( value );
			if ( LOGICAL.includes( key ) )
			{
				if ( key === '$not' )
				{
					if ( value_type === 'o' ) { validate_element_criteria( value, Path ); }
				}
				else if ( value_type === 'a' )
				{
					for ( let index = 0; index < value.length; index++ )
					{
						if ( jsongin.ShortType( value[ index ] ) === 'o' ) { validate_element_criteria( value[ index ], Path ); }
					}
				}
				continue;
			}
			if ( typeof jsongin.QueryOperators[ key ] !== 'undefined' )
			{
				// Applied to the element, so a top level operator has no element to apply to -
				// which is $elemMatch's own rule, asked below through its evaluation. One which
				// declares ElementLevel applies to an element as it does to a document, and is
				// asked for its own refusals the way the top level asks.
				if ( jsongin.QueryOperators[ key ].ElementLevel === true )
				{
					jsongin.QueryOperators[ key ].Query( {}, value, '' );
					continue;
				}
				if ( ( key !== '$comment' ) && !( operator_is_top_level_only( key ) ) ) { validate_operator( key, Criteria, Path ); }
				continue;
			}
			let sub_criteria = {};
			sub_criteria[ key ] = value;
			ValidateQuery( sub_criteria, Path );
		}
		return;
	};


	function operator_is_top_level_only( key )
	{
		let operator = jsongin.QueryOperators[ key ];
		return ( ( operator.TopLevel === true ) && ( operator.FieldLevel !== true ) );
	};


	//---------------------------------------------------------------------
	// Combines a $regex and its sibling $options into the one RegExp to match with.
	// Refuses the query when the pair cannot be used.
	//
	// MongoDB accepts $options only beside a $regex, and refuses it beside a regexp which
	// already carries its own flags, rather than deciding which of the two wins.
	// Verified against MongoDB 6.0.1.
	function combine_regex_options( Pattern, Options, Path )
	{
		let options_type = jsongin.ShortType( Options );
		if ( options_type !== 's' )
		{
			refuse( `$options must be a string but found [${options_type}] instead at [${Path}].` );
		}

		// Pattern is already known to be a string or a regexp: $regex declares ValueTypes 'sr'
		// and the dispatcher above enforces it before calling this, so a pattern of any other
		// type never gets here. This used to re-check it, which no input could reach.
		let source = Pattern;
		if ( jsongin.ShortType( Pattern ) === 'r' )
		{
			if ( Pattern.flags.length > 0 )
			{
				refuse( `$options cannot be given beside a regexp which carries its own flags at [${Path}].` );
			}
			source = Pattern.source;
		}

		// The 'x' option is MongoDB's rather than Javascript's, and is applied to the pattern
		// instead of being passed along. See src/RegExpOptions.js, which the expression
		// operators $regexMatch, $regexFind and $regexFindAll share with this.
		try
		{
			return LIB_REGEXP_OPTIONS.Build( source, Options );
		}
		catch ( error )
		{
			// An unknown flag letter, or one given twice.
			refuse( `$options [${Options}] is not valid at [${Path}].` );
		}
	};


	//---------------------------------------------------------------------
	return {
		Query: Query,
		ValidateQuery: ValidateQuery,
	};
};
