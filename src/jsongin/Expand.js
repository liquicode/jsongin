'use strict';

module.exports = function ( jsongin )
{
	function Expand( Document )
	{
		try
		{
			if ( jsongin.ShortType( Document ) !== 'o' ) { throw new Error( `Document must be an object.` ); }
			let expanded = {};
			for ( let key in Document )
			{
				// CreateArrays is asked for here, and nowhere else. Expand is rebuilding a
				// hierarchy which Flatten took apart, so a numeric path element did come from
				// an array and should become one again. Everywhere else a numeric key creates
				// a document, which is the rule MongoDB follows for an update.
				jsongin.SetValue( expanded, key, Document[ key ], true );
			}
			return expanded;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Expand: ' + error.message ); }
			throw error;
		}
	};
	return Expand;
};
