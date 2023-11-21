'use strict';

module.exports = function ( Engine )
{
	function GetValue( Document, Path )
	{
		// Validate Path.
		if ( typeof Path === 'undefined' ) { return Document; }
		if ( Path === null ) { return Document; }
		if ( typeof Path !== 'string' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `GetValue: Path is invalid [${Path}].` ); }
			return;
		}
		if ( Path.length === 0 ) { return Document; }

		// Pre-process the path.
		let path_elements = Engine.SplitPath( Path );
		if ( path_elements === null ) 
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `GetValue: SplitPath returned null.` ); }
			return;
		}

		// Locate the path.
		let node = Document;
		for ( let index = 0; index < path_elements.length; index++ )
		{
			let name = path_elements[ index ];
			if ( typeof node[ name ] === 'undefined' )
			{
				// Check for out of bounds index.
				if ( typeof name === 'number' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `GetValue: Array index [${name}] is out of bounds at [${Path}].` ); }
					return;
				}
				// Check for Implicit Iterator.
				let node_type = Engine.ShortType( node );
				if ( node_type !== 'a' ) { return; }
				if ( node.length === 0 ) { return; }
				// Collect array elements.
				let values = [];
				let sub_path = path_elements.slice( index ).join( '.' );
				let terminals_result = Engine.PathTerminals( node, sub_path,
					function ( Value, ValueType, Path )
					{
						values.push( Value );
					} );
				if ( terminals_result === false )
				{
					return;
				}
				// Return the array.
				return values;
			}
			else
			{
				// Walk down the path.
				node = node[ name ];
			}
		}

		// Return the node.
		return node;
	};
	return GetValue;
};
