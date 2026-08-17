'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		TopLevel: false,
		ValueTypes: 'sr',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( 'sr'.includes( match_type ) === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$regex: requires regexp or string but found [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// The pattern is rebuilt on every call rather than the caller's RegExp being
				// used directly. RegExp.test() advances lastIndex on a pattern carrying the g
				// flag, so one reused object matched every other document:
				// Filter( documents, { a: /x/g } ) returned 3 of 4 identical documents, and
				// whether a document matched depended on how many came before it.
				// new RegExp() compiles a string and copies the source and flags of a regexp,
				// so the one call covers both forms. Rebuilding also leaves the caller's own
				// object untouched, which resetting its lastIndex would not.
				let pattern = new RegExp( MatchValue );

				// The pattern is applied to each value the path can mean.
				//
				// This used to ask GetValue for one value and hand it straight to
				// RegExp.test(), which converts whatever it is given to a string. A field
				// holding the regexp /MongoDB/i was therefore tested as the text '/MongoDB/i'
				// and matched the pattern /MongoDB/, which MongoDB does not do. A path
				// crossing an array was tested as the text of the gathered array.
				let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );
				for ( let index = 0; index < candidates.length; index++ )
				{
					let candidate = candidates[ index ];
					let candidate_type = jsongin.ShortType( candidate );

					// A string matches when the pattern matches it.
					if ( candidate_type === 's' )
					{
						if ( pattern.test( candidate ) === true ) { return true; }
						continue;
					}

					// A field which is itself a regexp matches when it is the same regexp.
					// MongoDB matches a field holding /MongoDB/ against { $regex: /MongoDB/ }
					// and does not match one holding /MongoDB/i, so this is an equality test
					// on the source and the flags rather than a pattern match.
					// Verified against MongoDB 6.0.1.
					if ( candidate_type === 'r' )
					{
						if ( candidate.source !== pattern.source ) { continue; }
						if ( candidate.flags !== pattern.flags ) { continue; }
						return true;
					}
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$regex: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
