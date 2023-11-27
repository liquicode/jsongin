'use strict';

module.exports = function ( jsongin )
{
	function Unhybridize( Document )
	{
		let complicated = {};
		for ( let key in Document )
		{
			switch ( jsongin.ShortType( Document[ key ] ) )
			{
				case 'b':
				case 'n':
				case 'l':
					complicated[ key ] = Document[ key ];
					break;
				case 's':
					try
					{
						let value = JSON.parse( Document[ key ] );
						switch ( value.type )
						{
							case 'o':
								complicated[ key ] = value.value;
								break;
							case 'a':
								complicated[ key ] = value.value;
								break;
							case 'r':
								complicated[ key ] = new RegExp( value.source, value.flags );
								break;
							case 'e':
								complicated[ key ] = new Error( Document[ key ].message );
								break;
							case 'f':
								complicated[ key ] = new Function( Document[ key ].source );
								break;
							case 'y':
								complicated[ key ] = Symbol( Document[ key ].source );
								break;
							case 'u':
								complicated[ key ] = undefined;
								break;
						}
						break;
					}
					catch ( error ) { }
					complicated[ key ] = Document[ key ];
					break;
			}
		}
		return complicated;
};
	return Unhybridize;
};
