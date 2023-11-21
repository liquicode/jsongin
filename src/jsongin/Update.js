'use strict';

module.exports = function ( Engine )
{
	function Update( Document, Updates )
	{
		// Reset the explain stack.
		if ( Engine.Settings.ClearExplainOnTopLevelQuery )
		{
			Engine.Explain = [];
		}

		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: The Document parameter must be an object.` ); }
			return null;
		}
		Document = Engine.Clone( Document );
		let st_Update = Engine.ShortType( Updates );
		if ( 'lu'.includes( st_Update ) === true ) { return Document; }
		if ( st_Update !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: The Update parameter must be an object.` ); }
			return null;
		}

		// Process the updates.
		for ( let key in Updates )
		{
			// Check for operator.
			if ( typeof Engine.UpdateOperators[ key ] !== 'undefined' )
			{
				// Perform the update.
				let result = Engine.UpdateOperators[ key ].Update( Document, Updates[ key ] );
				if ( result === false )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: The update operator [${key}] failed.` ); }
					// return false;
				}
			}
			else
			{
				if ( Engine.Settings.Explain ) { Engine.Explain.push( `Update: Unknown update operator [${key}] encountered.` ); }
			}
		}

		// Return the updated document.
		return Document;
	};
	return Update;
};
