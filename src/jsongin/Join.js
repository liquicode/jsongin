'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// The four joins, by the name a caller gives. Matched without regard to case; the names
	// themselves are PascalCase, the way the jsonx format spells "After" and "Insert".
	const JOIN_TYPES = [ 'Left', 'Inner', 'Right', 'Outer' ];


	//---------------------------------------------------------------------
	// A single document is a set of one. Neither side has to be a collection to be joined,
	// which is the whole reason this function can exist where MongoDB's $lookup cannot: it
	// names a collection on a server, and this takes the documents themselves.
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
	// The join asked for, or a refusal naming the four.
	function join_type_of( Value )
	{
		let value_type = jsongin.ShortType( Value );
		if ( ( value_type === 'u' ) || ( value_type === 'l' ) ) { return 'Left'; }
		if ( value_type !== 's' ) { throw new Error( `JoinType must be one of ${JOIN_TYPES.join( ', ' )}.` ); }
		for ( let index = 0; index < JOIN_TYPES.length; index++ )
		{
			if ( JOIN_TYPES[ index ].toLowerCase() === Value.toLowerCase() ) { return JOIN_TYPES[ index ]; }
		}
		throw new Error( `JoinType [${Value}] is not one of ${JOIN_TYPES.join( ', ' )}.` );
	}


	//---------------------------------------------------------------------
	// Where the matches go, or '' to merge them into the document instead.
	function join_name_of( Value )
	{
		let value_type = jsongin.ShortType( Value );
		if ( ( value_type === 'u' ) || ( value_type === 'l' ) ) { return ''; }
		if ( value_type !== 's' ) { throw new Error( `JoinName must be a string.` ); }
		if ( Value === '' ) { return ''; }
		// SplitPath refuses a path which cannot be written to, so a bad JoinName is refused here
		// rather than half way through building an answer.
		jsongin.SplitPath( Value );
		return Value;
	}


	//---------------------------------------------------------------------
	// One document and what it matched: the matches written at JoinName, or merged in.
	function joined_document( Document, Matches, JoinName )
	{
		if ( JoinName !== '' )
		{
			let document = jsongin.SafeClone( Document );
			let found = [];
			for ( let index = 0; index < Matches.length; index++ )
			{
				found.push( jsongin.SafeClone( Matches[ index ] ) );
			}
			// CreateArrays is not asked for: a JoinName addresses a field, and a path which ran
			// through an array would be writing inside the caller's data rather than beside it.
			jsongin.SetValue( document, JoinName, found );
			return document;
		}

		// Merged one after another, in the order they were found, so a field two matches share
		// takes the last one's value. Merge() answers a new document and clones what it writes.
		let merged = jsongin.SafeClone( Document );
		for ( let index = 0; index < Matches.length; index++ )
		{
			merged = jsongin.Merge( merged, Matches[ index ] );
		}
		return merged;
	}


	//---------------------------------------------------------------------
	/*
		Joins two sets of documents.

			Documents        the documents to join from; an array, or one document.
			JoinDocuments    the documents to join with; an array, or one document.
			JoinCriteria     matched against each JoinDocuments document, with the document
			                 being joined from lent as '$$Left' and the one being tested as
			                 '$$Right'. '$Field' means a field of the JoinDocuments document,
			                 as it does in any criteria, so a join reads:
			                     { $expr: { $eq: [ '$DomeId', '$$Left.Dome' ] } }
			                 A criteria which mentions neither side is an ordinary filter on the
			                 join documents, and an empty one matches every pair.
			JoinType         Left, Inner, Right or Outer. Default Left.
			JoinName         the field the matches are written to, as an array. Absent or ''
			                 merges them into the document instead.

		***Answers an array of joined documents***, one for each document which took part.

		***One document in, one document out*** - MongoDB's $lookup rather than SQL's row
		multiplication. A document which matched three carries all three, either as an array at
		JoinName or merged in one after another. A document which matched nothing is unchanged
		under a merge and carries an empty array under a JoinName, which is what keeps the
		answer's shape independent of what happened to match.

		| Left  | every Documents document, matched or not                        |
		| Inner | only those which matched at least once                          |
		| Right | those which matched, then every unmatched JoinDocuments document|
		| Outer | every Documents document, then every unmatched one              |

		***An unmatched join document comes back alone***: there is no document to attach it to,
		so it is a copy of itself with no JoinName field. Order is each side's own, Documents
		first.

		***A production, so it clones.*** Filter() hands back the caller's own documents because
		it selects them; this builds new documents, so every part of the answer is a SafeClone
		and neither input is touched.
	*/

	function Join( Documents, JoinDocuments, JoinCriteria, JoinType, JoinName )
	{
		try
		{
			let documents = documents_of( Documents, 'Documents' );
			let join_documents = documents_of( JoinDocuments, 'JoinDocuments' );
			if ( jsongin.ShortType( JoinCriteria ) !== 'o' ) { throw new Error( `JoinCriteria must be an object.` ); }
			let join_type = join_type_of( JoinType );
			let join_name = join_name_of( JoinName );

			// ***A criteria which cannot mean anything is refused before any of it runs.***
			// Query() only refuses a mistake when it reaches it, and a join whose second side
			// holds nothing evaluates nothing at all - so a typo would quietly answer a whole
			// set of unjoined documents. This is jsonstor's rule in the engine: a criteria the
			// engine refuses is refused before anything acts on it.
			//
			// ***The names this join lends are bound while it is checked.*** ValidateQuery asks
			// each operator for its own refusals by evaluating it against an empty document, so
			// a '$$Left' nobody had bound was undefined and the check refused every criteria
			// this function exists for. Bound to empty documents, the names resolve and every
			// other refusal still fires.
			let checking = jsongin.Scope.NewPipeline().Child( { Left: {}, Right: {} } );
			jsongin.ValidateQuery( JoinCriteria, '', { Scope: checking } );

			// ***Which join documents were matched by somebody, by their place in the array.***
			// Position is the identity here. These documents carry no identifier of their own
			// and need none: which document this is, is where it sits in the array the caller
			// handed over. Two identical documents are two documents, exactly as they are two
			// rows on a server, where an _id tells them apart.
			let matched_positions = [];
			let joined = [];

			for ( let index = 0; index < documents.length; index++ )
			{
				let document = documents[ index ];
				let matches = [];

				for ( let join_index = 0; join_index < join_documents.length; join_index++ )
				{
					let join_document = join_documents[ join_index ];

					// The frame the criteria is evaluated in. It descends from a pipeline frame,
					// which is where '$$NOW' and '$$REMOVE' are bound - a bare frame would leave
					// them undefined inside a join criteria.
					let scope = jsongin.Scope.NewPipeline().Child( { Left: document, Right: join_document } );
					if ( jsongin.Query( join_document, JoinCriteria, '', { Scope: scope } ) === false ) { continue; }

					matches.push( join_document );
					if ( matched_positions.includes( join_index ) === false ) { matched_positions.push( join_index ); }
				}

				if ( ( matches.length === 0 ) && ( ( join_type === 'Inner' ) || ( join_type === 'Right' ) ) ) { continue; }
				joined.push( joined_document( document, matches, join_name ) );
			}

			// Right and Outer answer for a join document nobody matched. There is nothing to
			// attach it to, so it comes back as itself.
			if ( ( join_type === 'Right' ) || ( join_type === 'Outer' ) )
			{
				for ( let join_index = 0; join_index < join_documents.length; join_index++ )
				{
					if ( matched_positions.includes( join_index ) ) { continue; }
					joined.push( jsongin.SafeClone( join_documents[ join_index ] ) );
				}
			}

			return joined;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Join: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Join;
};
