'use strict';

module.exports = function ( Engine )
{
	function JoinPaths() // path1, path2, ...
	{
		let all_elements = [];
		for ( let index = 0; index < arguments.length; index++ )
		{
			if ( arguments[ index ] === null ) { continue; }
			let path = '' + arguments[ index ];
			let path_elements = Engine.SplitPath( path );
			if ( path_elements === null ) { continue; }
			all_elements.push( ...path_elements );
		}
		return all_elements.join( '.' );
	};
	return JoinPaths;
};
