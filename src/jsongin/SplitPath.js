'use strict';

const LIB_TEXT = require( '../Text' );

module.exports = function ( Engine )
{
	function SplitPath( Path )
	{
		if ( typeof Path !== 'string' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path is invalid [${QueryPath}].` ); }
			return null;
		}
		if ( Path === '' ) { return []; }
		let path_elements = Path.split( '.' );
		let path_index = 0;
		while ( path_index < path_elements.length )
		{
			let name = path_elements[ path_index ];
			// Check for empty elements.
			if ( name === '' )
			{
				if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path cannot contain empty elements in [${Path}].` ); }
				return null;
			}
			// Check for root $ symbol.
			if ( name === '$' )
			{
				if ( path_index === 0 )
				{
					if ( !Engine.Settings.PathExtensions )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path cannot start with the $ root element without path extensions in [${Path}].` ); }
						return null;
					}
					path_elements.splice( 0, 1 );
					continue;
				}
				else
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Cannot contain the $ element within path [${Path}].` ); }
					return null;
				}
			}
			// Check for bracketed [] array indexing.
			let array_index = LIB_TEXT.FindBetween( name, '[', ']' );
			if ( Engine.Settings.PathExtensions && array_index )
			{
				if ( isNaN( Number( array_index ) ) ) 
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: A non-numeric array index [${array_index}] was found in [${Path}].` ); }
					return null;
				}
				array_index = Number( array_index );
				name = LIB_TEXT.FindBetween( name, null, '[' );
				if ( name && name.length )
				{
					if ( name === '$' ) 
					{
						if ( path_index === 0 ) 
						{
							if ( !Engine.Settings.PathExtensions )
							{
								if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Path cannot start with the $ root element without path extensions in [${Path}].` ); }
								return null;
							}
							path_elements.splice( 0, 1 );
						}
						else
						{
							if ( Engine.Settings.Explain ) { Engine.Explain.push( `SplitPath: Cannot contain the $ element within path [${Path}].` ); }
							return null;
						}
					}
					else
					{
						path_elements[ path_index ] = name;
						path_index++;
					}
					path_elements.splice( path_index, 0, array_index );
				}
				else
				{
					// path_elements.splice( path_index, 1, [ array_index ] );
					path_elements[ path_index ] = array_index;
				}
			}
			else if ( !isNaN( Number( name ) ) ) 
			{
				path_elements[ path_index ] = Number( name );
			}
			path_index++;
		}
		return path_elements;
	};
	return SplitPath;
};
