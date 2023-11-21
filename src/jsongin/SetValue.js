'use strict';

module.exports = function ( Engine )
{
	function SetValue( Document, Path, Value )
	{
		// Validate the document.
		let document_type = Engine.ShortType( Document );
		if ( !'oa'.includes( document_type ) )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Document must be an object or array.` ); }
			return false;
		}

		// Pre-process the path.
		let path_elements = Engine.SplitPath( Path );
		if ( path_elements === null ) 
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: SplitPath returned null.` ); }
			return false;
		}
		if ( path_elements.length === 0 ) 
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Cannot set a value using an empty path.` ); }
			return false;
		}

		// Locate the path.
		let node = Document;
		let current_path = '';
		for ( let index = 0; index < path_elements.length; index++ )
		{
			let name = path_elements[ index ];
			if ( current_path.length > 0 ) { current_path += '.'; }
			current_path += name;
			let parent_type = Engine.ShortType( node );
			if ( parent_type === 'o' )
			{
				if ( typeof name === 'number' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Type mismatch at [${current_path}]. Expected a field name but found an array index instead.` ); }
					return false;
				}
				if ( typeof node[ name ] === 'undefined' ) 
				{
					node[ name ] = {};
				}
				if ( index === ( path_elements.length - 1 ) )
				{
					if ( typeof Value === 'undefined' )
					{
						delete node[ name ];
					}
					else
					{
						node[ name ] = JSON.parse( JSON.stringify( Value ) );
					}
					return true;
				}
			}
			else if ( parent_type === 'a' )
			{
				if ( typeof name === 'string' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `SetValue: Type mismatch at [${current_path}]. Expected a array index but found a field name instead.` ); }
					return false;
				}
				//TODO: Does it make sense to add nulls for empty elements?
				//		Is it legal, or even desirable, to have undefined elements in an array?
				//TODO: Can we support a syntax that allows us to specify pushing and popping elements in an arra?
				//TODO: Can we support we support negative array indeces to allow reverse indexing?
				while ( node.length < name )
				{
					node.push( null );
				}
				if ( index === ( path_elements.length - 1 ) )
				{
					if ( typeof Value === 'undefined' )
					{
						node.splice( name, 1 );
					}
					else
					{
						node[ name ] = JSON.parse( JSON.stringify( Value ) );
					}
					return true;
				}
			}
			node = node[ name ];
		}

		// Return, OK.
		return true;
	};
	return SetValue;
};
