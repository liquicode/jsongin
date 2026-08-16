'use strict';

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

		// Validate the path.
		{
			let path_elements = jsongin.SplitPath( Path );
			if ( path_elements === null ) 
			{
				Path = '';
			}
			else
			{
				Path = path_elements.join( '.' );
			}
		}
		if ( ( Path === '' ) && ( Object.keys( Criteria ).length === 0 ) )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Query: An empty query object {} matches everything.` ); }
			return true;
		}

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
				// Check for top level operator.
				if ( Path === '' )
				{
					if ( !jsongin.QueryOperators[ key ].TopLevel )
					{
						refuse( `Operator [${key}] cannot appear at the top level of a query. Only logical operators can appear at the top level of a query.` );
					}
				}
				// Evaluate operator.
				let sub_query = Criteria[ key ];
				if ( typeof sub_query === 'undefined' )
				{
					refuse( `Operator [${key}] cannot be set to undefined. Use $exists to test if a field exists in the document.` );
				}

				// Check the value against the types the operator says it takes.
				// An operator is still free to validate its own value, and does when it is
				// called directly rather than through here.
				let operator = jsongin.QueryOperators[ key ];
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

		let source = Pattern;
		let pattern_type = jsongin.ShortType( Pattern );
		if ( pattern_type === 'r' )
		{
			if ( Pattern.flags.length > 0 )
			{
				refuse( `$options cannot be given beside a regexp which carries its own flags at [${Path}].` );
			}
			source = Pattern.source;
		}
		else if ( pattern_type !== 's' )
		{
			refuse( `$regex requires regexp or string but found [${pattern_type}] instead at [${Path}].` );
		}

		try
		{
			return new RegExp( source, Options );
		}
		catch ( error )
		{
			// An unknown flag letter, or one given twice.
			refuse( `$options [${Options}] is not valid at [${Path}].` );
		}
	};


	//---------------------------------------------------------------------
	return Query;
};
