'use strict';

/*
	The content vocabulary: how a string's content is encoded and what it holds.

	From 2019-09 on these are annotations only, as the specification says a validator treats
	them by default, and contentSchema is listed as holding a subschema so that references into
	it resolve. Draft 7 let them assert, and the suite's optional cases for that draft ask them
	to, so the two Draft7 definitions check what they can: a base64 encoding by its alphabet and
	padding, and the application/json media type by parsing. Any other encoding or media type
	is accepted, since there is nothing here to check it against.
*/

function no_keyword( Context )
{
	return Context.NewOutput();
}


//---------------------------------------------------------------------
function fail( Context, Keyword, Message )
{
	let output = Context.NewOutput();
	output.Valid = false;
	output.Errors.push( Context.Error( Keyword, Message ) );
	return output;
}


//---------------------------------------------------------------------
// Decodes a base64 string, or returns null when it is not one.
function decode_base64( Text )
{
	if ( /^[A-Za-z0-9+/]*={0,2}$/.test( Text ) === false ) { return null; }
	if ( ( Text.length % 4 ) !== 0 ) { return null; }
	try
	{
		if ( typeof Buffer !== 'undefined' ) { return Buffer.from( Text, 'base64' ).toString( 'utf8' ); }
		return decodeURIComponent( escape( atob( Text ) ) );
	}
	catch ( error )
	{
		return null;
	}
}


//---------------------------------------------------------------------
module.exports = {

	contentEncoding: { Subschemas: null, Priority: 0, Apply: no_keyword },
	contentMediaType: { Subschemas: null, Priority: 0, Apply: no_keyword },
	contentSchema: { Subschemas: 'single', Priority: 0, Apply: no_keyword },

	contentEncodingDraft7: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Instance ) !== 'string' ) { return Context.NewOutput(); }
			if ( Value !== 'base64' ) { return Context.NewOutput(); }
			if ( decode_base64( Context.Support.AsString( Instance ) ) === null ) { return fail( Context, Keyword, 'The string is not base64.' ); }
			return Context.NewOutput();
		},
	},

	contentMediaTypeDraft7: {
		Subschemas: null, Priority: 11,
		Apply: function ( Context, Keyword, Instance, Value, Schema )
		{
			if ( Context.Type( Instance ) !== 'string' ) { return Context.NewOutput(); }
			if ( Value !== 'application/json' ) { return Context.NewOutput(); }
			let text = Context.Support.AsString( Instance );
			if ( Schema.contentEncoding === 'base64' )
			{
				text = decode_base64( text );
				if ( text === null ) { return Context.NewOutput(); }
			}
			try
			{
				JSON.parse( text );
			}
			catch ( error )
			{
				return fail( Context, Keyword, 'The string is not a JSON document.' );
			}
			return Context.NewOutput();
		},
	},

};
