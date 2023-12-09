'use strict';

module.exports = function ( jsongin )
{
	function Query( Document, Criteria, Path = '' )
	{
		// Validate the parameters.
		if ( jsongin.ShortType( Document ) !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Query: The Document parameter must be an object.` ); }
			return false;
		}
		if ( jsongin.ShortType( Criteria ) !== 'o' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Query: The Criteria parameter must be an object.` ); }
			return false;
		}

		// Validate the path.
		{
			let path_elements = jsongin.SplitPath( Path );
			if ( path_elements === null ) 
			{
				Path = '';
			}
			else
			{
				Path = path_elements.join( '.' );
			}
		}
		if ( ( Path === '' ) && ( Object.keys( Criteria ).length === 0 ) )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Query: An empty query object {} matches everything.` ); }
			return true;
		}

		// Evaluate the object elements.
		for ( let key in Criteria )
		{
			// Check for operator.
			if ( typeof jsongin.QueryOperators[ key ] !== 'undefined' )
			{
				// Check for top level operator.
				if ( Path === '' )
				{
					if ( !jsongin.QueryOperators[ key ].TopLevel )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Query: Operator [${key}] cannot appear at the top level of a query. Only logical operators can appear at the top level of a query.` ); }
						return false;
					}
				}
				// Evaluate operator.
				let sub_query = Criteria[ key ];
				if ( typeof sub_query === 'undefined' )
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Query: Operator [${key}] cannot be set to undefined. Use $exists to test if a field exists in the document.` ); }
					return false;
				}
				let result = jsongin.QueryOperators[ key ].Query( Document, sub_query, Path );
				if ( result === false ) 
				{
					if ( jsongin.OpLog ) { jsongin.OpLog( `Query: Operator [${key}] returned false at [${Path}].` ); }
					return false;
				}
			}
			else
			{
				// Get the sub-query.
				let sub_query = Criteria[ key ];
				let sub_query_path = jsongin.JoinPaths( Path, key );
				let result = false;
				if ( is_query( sub_query ) )
				{
					result = jsongin.Query( Document, sub_query, sub_query_path );
				}
				else
				{
					if ( typeof sub_query === 'undefined' )
					{
						if ( jsongin.OpLog ) { jsongin.OpLog( `Query: The implicit $eq operator cannot be set to undefined. Use $exists to test if a field exists in the document.` ); }
						return false;
					}
					// Implicit $eq
					result = jsongin.QueryOperators.$ImplicitEq.Query( Document, sub_query, sub_query_path );
				}
				if ( result === false ) { return false; }
			}
		}
		return true; // Implicit $and
	};


	//---------------------------------------------------------------------
	function is_query( Query )
	{
		if ( jsongin.ShortType( Query ) !== 'o' ) { return false; }
		for ( let key in Query )
		{
			if ( typeof jsongin.QueryOperators[ key ] !== 'undefined' ) { return true; }
			//TODO: This needs more thought/work:
			// if ( Engine.ShortType( Query[ key ] ) === 'o' )
			// {
			// 	if ( Engine.Settings.PathExtensions )
			// 	{
			// 		if ( Object.keys( Query ).length === 1 )
			// 		{
			// 			if ( Engine.IsQuery( ( Query[ key ] ) ) ) { return true; }
			// 		}
			// 	}
			// }
		}
		return false;
	};


	//---------------------------------------------------------------------
	return Query;
};
