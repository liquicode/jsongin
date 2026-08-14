'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
		{
			try
			{
				// Get Document Value
				let actual_value = jsongin.GetValue( Document, Path );
				let actual_type = jsongin.ShortType( actual_value );

				// Validate Expression
				let match_value = MatchValue;
				let match_type = jsongin.ShortType( match_value );

				// Compare
				if ( 'bnslu'.includes( match_type ) && ( match_type === actual_type ) )
				{
					// Primitive types must match exactly.
					return ( actual_value === match_value ); // Equivalence of primitive types.
				}
				else if ( match_type === 'r' )
				{
					// A regexp match value here is a value to compare against, not a pattern to
					// test with. { field: { $eq: /re/ } } matches only a field which is itself
					// that regexp, while the implicit form { field: /re/ } pattern matches.
					// That asymmetry is MongoDB's, verified against MongoDB 6.0.1, and the
					// implicit form is handled separately at ImplicitEq.js:132.
					if ( actual_type !== 'r' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `$eq: a regexp match value compares against a regexp field, but found [${actual_type}] at [${Path}]. Use $regex to pattern match.` ); }
						return false;
					}
					// Two Regexp objects are never === to each other, the same trap dates have
					// below, so compare what actually identifies them. Regexp used to sit in
					// the primitive branch above, where === meant two identical regexps never
					// matched.
					if ( actual_value.source !== match_value.source ) { return false; }
					if ( actual_value.flags !== match_value.flags ) { return false; }
					return true;
				}
				else if ( ( match_type === 'd' ) && ( actual_type === 'd' ) )
				{
					// Two Date objects are never === to each other, so compare their time values.
					return ( actual_value.getTime() === match_value.getTime() );
				}
				else if ( 'lu'.includes( match_type ) && 'lu'.includes( actual_type ) ) 
				{
					return true; // null and undefined are always equivalent.
				}
				else if ( ( match_type === 'o' ) && ( actual_type === 'o' ) ) 
				{
					// Objects must match exactly, including the key order.
					let result = ( JSON.stringify( match_value ) === JSON.stringify( actual_value ) );
					if ( result === true ) { return true; }
					return false;
				}
				else if ( ( match_type === 'a' ) && ( actual_type === 'a' ) ) 
				{
					// Arrays must match exactly, including the value order.
					let match_json = JSON.stringify( match_value );
					let result = ( match_json === JSON.stringify( actual_value ) );
					if ( result === true ) { return true; }
					// Or, the match array must exactly match an element of the document array.
					for ( let index = 0; index < actual_value.length; index++ )
					{
						result = ( match_json === JSON.stringify( actual_value[ index ] ) );
						if ( result === true ) { break; }
					}
					if ( result === true ) { return true; }
					return false;
				}
				if ( jsongin.OpLog ) { jsongin.OpLog( `$eq: cannot compare [${match_type}] type with [${actual_type}] type at [${Path}].` ); }
				return false; // Unsupported type or equivalence.
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$eq: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
