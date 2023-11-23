'use strict';

module.exports = function ( jsongin )
{
	function JoinPaths() // PathSegment1, PathSegment2, ...
	{
		try
		{
			let path_elements = [];
			for ( let argument_index = 0; argument_index < arguments.length; argument_index++ )
			{
				// Process each segment.
				let segments = arguments[ argument_index ];
				let st_segment = jsongin.ShortType( segments );
				switch ( st_segment )
				{
					case 'u': continue;
					case 'l': continue;
					case 'n':
						segments = [ '' + segments ];
						break;
					case 's': break;
					case 'a': break;
					default: throw new Error( `Path segment is invalid [${JSON.stringify( segments )}].` );
				}
				if ( typeof segments === 'string' ) { segments = jsongin.SplitPath( segments ); }
				// Process the segment parts.
				let sub_elements = [];
				for ( let segment_index = 0; segment_index < segments.length; segment_index++ )
				{
					let parts = jsongin.SplitPath( segments[ segment_index ] );
					sub_elements.push( ...parts );
				}
				path_elements.push( ...sub_elements );
			}
			// Return the combined path in dot-notation.
			return path_elements.join( '.' );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'JoinPaths: ' + error.message ); }
			throw error;
		}
	};
	return JoinPaths;
};
