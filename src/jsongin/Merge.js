'use strict';

module.exports = function ( jsongin )
{
	function Merge( DocumentA, DocumentB )
	{
		try
		{
			if ( !DocumentA ) { return jsongin.SafeClone( DocumentB ); }
			if ( !DocumentB ) { return jsongin.SafeClone( DocumentA ); }

			// let C = JSON.parse( JSON.stringify( ObjectA ) );
			var C = jsongin.SafeClone( DocumentA );

			function update_children( ParentA, ParentB )
			{
				Object.keys( ParentB ).forEach(
					key =>
					{
						let value = ParentB[ key ];
						if ( ParentA[ key ] === undefined )
						{
							ParentA[ key ] = jsongin.SafeClone( value );
						}
						else
						{
							if ( typeof value === 'object' )
							{
								// Merge objects.
								if ( ( ParentA[ key ] === null ) && ( value === null ) )
								{
									// Do nothing.
								}
								else if ( ( ParentA[ key ] !== null ) && ( value === null ) )
								{
									ParentA[ key ] = null;
								}
								else if ( ( ParentA[ key ] === null ) && ( value !== null ) )
								{
									ParentA[ key ] = {};
									update_children( ParentA[ key ], value );
								}
								else if ( ( ParentA[ key ] !== null ) && ( value !== null ) )
								{
									update_children( ParentA[ key ], value );
								}
							}
							else
							{
								// Overwrite values.
								if ( typeof value === 'function' )
								{
									ParentA[ key ] = value;
								}
								else
								{
									ParentA[ key ] = jsongin.SafeClone( value );
								}
							}
						}
					} );
			}

			update_children( C, DocumentB );
			return C;

		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Merge: ' + error.message ); }
			throw error;
		}
	};
	return Merge;
};
