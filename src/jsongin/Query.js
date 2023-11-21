'use strict';

module.exports = function ( Engine )
{
	function Query( Document, Criteria, QueryPath = '' )
	{
		// Reset the explain stack.
		if ( ( QueryPath === '' ) && Engine.Settings.ClearExplainOnTopLevelQuery )
		{
			Engine.Explain = [];
		}

		// Validate the parameters.
		if ( Engine.ShortType( Document ) !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: The Document parameter must be an object.` ); }
			return false;
		}
		if ( Engine.ShortType( Criteria ) !== 'o' )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: The Query parameter must be an object.` ); }
			return false;
		}

		// Validate the path.
		{
			let path_elements = Engine.SplitPath( QueryPath );
			if ( path_elements === null ) 
			{
				QueryPath = '';
			}
			else
			{
				QueryPath = path_elements.join( '.' );
			}
		}
		if ( ( QueryPath === '' ) && ( Object.keys( Criteria ).length === 0 ) )
		{
			if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: An empty query object {} matches everything.` ); }
			return true;
		}

		// Evaluate the object elements.
		for ( let key in Criteria )
		{
			// Check for operator.
			if ( typeof Engine.QueryOperators[ key ] !== 'undefined' )
			{
				// Check for top level operator.
				if ( QueryPath === '' )
				{
					if ( !Engine.QueryOperators[ key ].TopLevel )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: Operator [${key}] cannot appear at the top level of a query. Only logical operators can appear at the top level of a query.` ); }
						return false;
					}
				}
				// Evaluate operator.
				let sub_query = Criteria[ key ];
				if ( typeof sub_query === 'undefined' )
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: Operator [${key}] cannot be set to undefined. Use $exists to chrck for a field in the document.` ); }
					return false;
				}
				let result = Engine.QueryOperators[ key ].Query( Document, sub_query, QueryPath );
				if ( result === false ) 
				{
					if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: Operator [${key}] returned false at [${QueryPath}].` ); }
					return false;
				}
			}
			else
			{
				// Get the sub-query.
				let sub_query = Criteria[ key ];
				let sub_query_path = Engine.JoinPaths( QueryPath, key );
				let result = false;
				if ( Engine.IsQuery( sub_query ) )
				{
					result = Engine.Query( Document, sub_query, sub_query_path );
				}
				else
				{
					if ( typeof sub_query === 'undefined' )
					{
						if ( Engine.Settings.Explain ) { Engine.Explain.push( `Query: The implicit $eq operator cannot be set to undefined. Use $exists to chrck for a field in the document.` ); }
						return false;
					}
					// Implicit $eq
					result = Engine.QueryOperators.$ImplicitEq.Query( Document, sub_query, sub_query_path );
				}
				if ( result === false ) { return false; }
			}
		}
		return true; // Implicit $and
	};
	return Query;
};
