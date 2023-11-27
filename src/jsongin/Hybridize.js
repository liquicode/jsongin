'use strict';

module.exports = function ( jsongin )
{
	function Hybridize( Document )
	{
		let simple = {};
		for ( let key in Document )
		{
			switch ( jsongin.ShortType( Document[ key ] ) )
			{
				case 'b':
				case 'n':
				case 's':
				case 'l':
					simple[ key ] = Document[ key ];
					break;
				case 'o':
					simple[ key ] = JSON.stringify( { type: 'o', value: Document[ key ] } );
					break;
				case 'a':
					simple[ key ] = JSON.stringify( { type: 'a', value: Document[ key ] } );
					break;
				case 'r':
					simple[ key ] = JSON.stringify( { type: 'r', flags: Document[ key ].flags, source: Document[ key ].source } );
					break;
				case 'e':
					simple[ key ] = JSON.stringify( { type: 'e', message: Document[ key ].message } );
					break;
				case 'f':
					simple[ key ] = JSON.stringify( { type: 'f', source: Document[ key ].toString() } );
					break;
				case 'y':
					simple[ key ] = JSON.stringify( { type: 'y', source: Document[ key ].toString() } );
					break;
				case 'u':
					simple[ key ] = JSON.stringify( { type: 'u' } );
					break;
			}
		}
		return simple;
};
	return Hybridize;
};
