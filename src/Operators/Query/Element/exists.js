'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Meta',
		TopLevel: false,
		ValueTypes: 'bnsdloaru',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// MongoDB coerces the match value to a boolean rather than requiring one, so
				// { $exists: 1 } asks the same question as { $exists: true }.
				// AsBoolean already implements that coercion: a number is false only when it is
				// zero, null and undefined are false, and every other value is true.
				//
				// This used to declare ValueTypes 'b' and check for a boolean itself, which made
				// { $exists: 1 } and { $exists: 0 } both return false — the second of them the
				// opposite of the right answer. The narrow declaration was a deviation
				// introduced by enforcing ValueTypes, which turned it from a note into behavior.
				// Verified against MongoDB 6.0.1.
				let match_value = jsongin.AsBoolean( MatchValue );

				// $exists does not examine a value at all. It asks whether the path resolves
				// to anything, which is exactly what an empty candidate list reports.
				//
				// This used to ask GetValue and test the result for the undefined short type.
				// GetValue cannot tell a missing field from a field which holds undefined,
				// and worse, a path crossing an array gathered every element's value into an
				// array: { a: [ { y: 1 } ] } at 'a.x' gathered to [ undefined ], which is an
				// array rather than undefined, so the field read as present.
				// Verified against MongoDB 6.0.1, where that document does not match
				// { 'a.x': { $exists: true } } and does match { $exists: false }.
				let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );
				let field_exists = ( candidates.length > 0 );

				// Note that a field which is there holding undefined yields one candidate and
				// so exists, while a field which is absent yields none and does not. That
				// matches DeleteValue, which removes a key rather than setting it to
				// undefined precisely so that the two states stay distinguishable.

				if ( match_value === true ) { return field_exists; }
				return ( field_exists === false );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$exists: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
