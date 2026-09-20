'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// A single document is a set of one, as it is for Join().
	function documents_of( Value, Name )
	{
		let value_type = jsongin.ShortType( Value );
		if ( value_type === 'o' ) { return [ Value ]; }
		if ( value_type !== 'a' ) { throw new Error( `${Name} must be an array of documents, or a document.` ); }
		for ( let index = 0; index < Value.length; index++ )
		{
			if ( jsongin.ShortType( Value[ index ] ) !== 'o' )
			{
				throw new Error( `${Name}[ ${index} ] must be an object.` );
			}
		}
		return Value;
	}


	//---------------------------------------------------------------------
	/*
		One set of documents after another.

			Documents        an array of documents, or one document.
			UnionDocuments   the documents to add after them.

		***This is a concatenation, not a set union.*** Nothing is de-duplicated, and two
		documents which are identical both come back - which is what MongoDB's $unionWith does,
		measured against 8.3.8 on 2026-09-20: a document repeated across the two collections,
		_id and all, came back twice. Use Distinct() to reduce what this gathers.

		***A selection, so the documents are the caller's own.*** The array is new and nothing
		in it is cloned, which is the rule Filter() states: a function which selects documents
		hands back the ones it was given, and only a function which produces new documents -
		Join(), Diff(), Merge() - copies first.

		Order is each side's own, Documents first.
	*/

	function Union( Documents, UnionDocuments )
	{
		try
		{
			let documents = documents_of( Documents, 'Documents' );
			let union_documents = documents_of( UnionDocuments, 'UnionDocuments' );

			let united = [];
			for ( let index = 0; index < documents.length; index++ )
			{
				united.push( documents[ index ] );
			}
			for ( let index = 0; index < union_documents.length; index++ )
			{
				united.push( union_documents[ index ] );
			}
			return united;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Union: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Union;
};
