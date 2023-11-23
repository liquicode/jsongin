'use strict';

module.exports = function ( jsongin )
{
	function SafeClone( Document, Exceptions )
	{
		try
		{
			// Validate exceptions.
			switch ( jsongin.ShortType( Exceptions ) )
			{
				case 'l':
				case 'u':
					Exceptions = [];
					break;
				case 's':
					Exceptions = [ Exceptions ];
					break;
				case 'a': break;
				default: throw new Error( `The Exceptions parameter must be a document path or array of paths in dot notation.` );
			}

			// Recursive function.
			function clone_node( Node, Path )
			{
				let short_type = jsongin.ShortType( Node );
				switch ( short_type )
				{
					case 'b': return Node;
					case 'n': return Node;
					case 's': return Node;
					case 'l': return Node;
					case 'o':
						{
							let value = {};
							for ( let key in Node )
							{
								let path = Path;
								if ( !path ) { path = key; }
								else { path += '.' + key; }
								if ( Exceptions.includes( path ) )
								{
									value[ key ] = Node[ key ];
								}
								else
								{
									value[ key ] = clone_node( Node[ key ], path );
								}
							}
							return value;
						}
					case 'a':
						{
							let value = [];
							for ( let index = 0; index < Node.length; index++ )
							{
								let path = Path;
								if ( !path ) { path = '' + index; }
								else { path += '.' + index; }
								if ( Exceptions.includes( path ) )
								{
									value.push( Node[ index ] );
								}
								else
								{
									value.push( clone_node( Node[ index ], path ) );
								}
							}
							return value;
						}
					case 'r': return Node;
					case 'e': return Node;
					case 'f': return Node;
					case 'y': return Node;
					case 'u': return Node;
					default: throw new Error( `Unrecognized short type [${short_type}] at [${Path}].` );
				}
			}

			let clone = clone_node( Document, '' );
			return clone;

		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'SafeClone: ' + error.message ); }
			throw error;
		}
	};
	return SafeClone;
};
