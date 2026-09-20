'use strict';

/*
	The argument document shared by $median and $percentile.
	This is a helper module, not an operator.

	***Both operators take a document and nothing else***, in both the accumulator form and the
	expression form, and both forms check it the same way. Written once here so that the four
	modules cannot disagree about what a well formed argument is.

	Measured against MongoDB 7.0.40 on 2026-09-20
	(`jsonx/.plans/tools/percentile-rank-probe.js` and the argument cases beside it):

		input     required. May be any expression. A null input is accepted and answers null.
		method    required, a string, and only 'approximate' is taken - 'exact' is refused and
		          so is 'Approximate', so the comparison is exact and case sensitive.
		p         required by $percentile and never given to $median, which is p 0.5. An array
		          of numbers, each within [0.0, 1.0]. An empty array is refused.
		          ***The array has to be constant***: a field path is refused, while a
		          $literal holding the array is accepted.

	***Anything else in the document is refused*** as an unknown field, which is worth knowing
	because it is stricter than most of the surface: a misspelled option is an error here rather
	than something quietly ignored.
*/

module.exports = function ( jsongin )
{

	let helper = {};


	//---------------------------------------------------------------------
	// The p values, from whatever form they were written in.
	helper.ReadP = function ( P, OperatorName )
	{
		let values = P;

		// ***A $literal is the one expression allowed here.*** MongoDB asks for constants and
		// refuses a field path, but takes a $literal holding the array.
		if ( jsongin.ShortType( values ) === 'o' )
		{
			let keys = Object.keys( values );
			if ( ( keys.length === 1 ) && ( keys[ 0 ] === '$literal' ) )
			{
				values = values.$literal;
			}
		}

		if ( jsongin.ShortType( values ) !== 'a' )
		{
			throw new Error( `The ${OperatorName} 'p' field must be an array of constant values.` );
		}
		if ( values.length === 0 )
		{
			throw new Error( `The ${OperatorName} 'p' field must be an array of numbers from [0.0, 1.0], but found an empty array.` );
		}

		for ( let index = 0; index < values.length; index++ )
		{
			let one = values[ index ];
			if ( jsongin.ShortType( one ) !== 'n' )
			{
				throw new Error( `The ${OperatorName} 'p' field must be an array of numbers from [0.0, 1.0].` );
			}
			if ( ( one < 0 ) || ( one > 1 ) )
			{
				throw new Error( `The ${OperatorName} 'p' field must be an array of numbers from [0.0, 1.0], but found: ${one}` );
			}
		}

		return values;
	};


	//---------------------------------------------------------------------
	// Reads the whole argument document. Answers { Input, P }, where P is [ 0.5 ] for $median.
	helper.Read = function ( Args, OperatorName, WantsP )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `${OperatorName} specification must be an object.` );
		}

		let known = [ 'input', 'method' ];
		if ( WantsP === true ) { known.push( 'p' ); }

		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( known.includes( keys[ index ] ) ) { continue; }
			throw new Error( `BSON field '${OperatorName}.${keys[ index ]}' is an unknown field.` );
		}

		if ( typeof Args.input === 'undefined' )
		{
			throw new Error( `BSON field '${OperatorName}.input' is missing but a required field.` );
		}
		if ( typeof Args.method === 'undefined' )
		{
			throw new Error( `BSON field '${OperatorName}.method' is missing but a required field.` );
		}
		if ( jsongin.ShortType( Args.method ) !== 's' )
		{
			throw new Error( `BSON field '${OperatorName}.method' is the wrong type, expected type 'string'.` );
		}
		if ( Args.method !== 'approximate' )
		{
			throw new Error( `Currently only 'approximate' can be used as percentile 'method'.` );
		}

		let p_values = [ 0.5 ];
		if ( WantsP === true )
		{
			if ( typeof Args.p === 'undefined' )
			{
				throw new Error( `BSON field '${OperatorName}.p' is missing but a required field.` );
			}
			p_values = helper.ReadP( Args.p, OperatorName );
		}

		return { Input: Args.input, P: p_values };
	};


	//---------------------------------------------------------------------
	return helper;
};
