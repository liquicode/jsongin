'use strict';

/*
	Shared value handling for the accumulator operators.
	This is a helper module, not an operator.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// Evaluates an accumulator's argument expression against each document in the group.
	// Returns an array of values, one per document, in group order.
	// A document whose expression resolves to a missing field contributes an undefined
	// value here. Each accumulator decides for itself what to do with it.
	helper.Values = function ( Documents, Args )
	{
		if ( jsongin.ShortType( Documents ) !== 'a' ) { throw new Error( `Documents must be an array.` ); }

		let values = [];
		for ( let index = 0; index < Documents.length; index++ )
		{
			values.push( jsongin.Evaluate( Documents[ index ], Args ) );
		}
		return values;
	};


	//---------------------------------------------------------------------
	return helper;
};
