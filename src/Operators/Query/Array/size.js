'use strict';

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Array',
		TopLevel: false,
		ValueTypes: 'n',

		//---------------------------------------------------------------------
		Query: function ( Document, MatchValue, Path = '', ExpandArrays = true )
		{
			try
			{
				// Validate Expression
				let match_type = jsongin.ShortType( MatchValue );
				if ( match_type !== 'n' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires a number but found type [${match_type}] instead at [${Path}].` ); }
					return false;
				}

				// $size asks about an array, so only a candidate which is an array can satisfy
				// it. This is the operator the candidate list exists for.
				//
				// It used to ask GetValue for one value and measure that. A path crossing an
				// array gathered every element's value into an array, which was then measured
				// as though it were the field, giving a wrong answer in both directions:
				//
				//   { a: [ { x: 1 }, { x: 2 } ] }   gathered to [ 1, 2 ], length 2, so
				//                                   { 'a.x': { $size: 2 } } matched a document
				//                                   whose x is not an array at all
				//   { a: [ { x: [ 5, 6 ] } ] }      gathered to [ [ 5, 6 ] ], length 1, so the
				//                                   document whose x really is a two element
				//                                   array did not match
				//
				// Verified against MongoDB 6.0.1, which matches only the second.
				let candidates = jsongin.ResolveCandidates( Document, Path, ExpandArrays );
				let found_array = false;

				for ( let index = 0; index < candidates.length; index++ )
				{
					if ( jsongin.ShortType( candidates[ index ] ) !== 'a' ) { continue; }
					found_array = true;
					if ( candidates[ index ].length === MatchValue ) { return true; }
				}

				if ( found_array === false )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `$size: requires an array but no value at [${Path}] is one.` ); }
				}
				return false;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Query.$size: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
