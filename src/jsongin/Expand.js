'use strict';

module.exports = function ( Engine )
{
	function Expand( Document )
	{
		if ( Engine.ShortType( Document ) !== 'o' ) { throw new Error( `Document must be an object.` ); }
		let expanded = {};
		for ( let key in Document )
		{
			Engine.SetValue( expanded, key, Document[ key ] );
		}
		return expanded;
	};
	return Expand;
};
