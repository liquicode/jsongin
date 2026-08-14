'use strict';

module.exports = function ( Engine )
{
	function Update( Document, Updates )
	{
		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Update: The Document parameter must be an object.` ); }
			return null;
		}
		// Cloned with SafeClone rather than Clone, so that dates survive an update.
		Document = Engine.SafeClone( Document );
		let st_Update = Engine.ShortType( Updates );
		if ( 'lu'.includes( st_Update ) === true ) { return Document; }
		if ( st_Update !== 'o' )
		{
			if ( Engine.OpLog ) { Engine.OpLog( `Update: The Update parameter must be an object.` ); }
			return null;
		}

		// Process the updates.
		for ( let key in Updates )
		{
			// Check for operator.
			if ( typeof Engine.UpdateOperators[ key ] !== 'undefined' )
			{
				let operator = Engine.UpdateOperators[ key ];
				let value = Updates[ key ];

				// Check the value against the types the operator says it takes.
				// An operator is still free to validate its own value, and does when it is
				// called directly rather than through here.
				if ( Engine.ShortType( operator.ValueTypes ) === 's' )
				{
					let value_type = Engine.ShortType( value );
					if ( operator.ValueTypes.includes( value_type ) === false )
					{
						if ( Engine.OpLog ) { Engine.OpLog( `Update: Operator [${key}] does not take a value of type [${value_type}]. It takes [${operator.ValueTypes}].` ); }
						continue;
					}
				}

				// Perform the update.
				let result = operator.Update( Document, value );
				if ( result === false )
				{
					if ( Engine.OpLog ) { Engine.OpLog( `Update: The update operator [${key}] failed.` ); }
					// return false;
				}
			}
			else
			{
				if ( Engine.OpLog ) { Engine.OpLog( `Update: Unknown update operator [${key}] encountered.` ); }
			}
		}

		// Return the updated document.
		return Document;
	};
	return Update;
};
