'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Comparison',
		TopLevel: false,
		ValueTypes: 'sr',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '' )
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

				let pattern = MatchValue;
				if ( match_type === 's' ) { pattern = new RegExp( pattern ); }

				// The pattern is applied to each value the path can mean.
				//
				// This used to ask GetValue for one value and hand it straight to
				// RegExp.test(), which converts whatever it is given to a string. A field
				// holding the regexp /MongoDB/i was therefore tested as the text '/MongoDB/i'
				// and matched the pattern /MongoDB/, which MongoDB does not do. A path
				// crossing an array was tested as the text of the gathered array.
				let candidates = jsongin.ResolveCandidates( Document, Path );
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
