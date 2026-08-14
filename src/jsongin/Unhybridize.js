'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Converts a hybridized string back into the value it encodes.
	//
	// A string which is not one of Hybridize's envelopes is returned unchanged.
	// Note that a plain string such as '123', 'true', or '[1,2]' parses as JSON without being
	// an envelope, so the parsed value has to be examined before it is used. Using it without
	// examining it matched none of the type cases and dropped the field from the document.
	function unhybridize_string( Text )
	{
		let envelope = null;
		try
		{
			envelope = JSON.parse( Text );
		}
		catch ( error )
		{
			return Text; // Not JSON at all, so it is a plain string.
		}

		// An envelope is an object which carries a type name.
		if ( jsongin.ShortType( envelope ) !== 'o' ) { return Text; }
		if ( jsongin.ShortType( envelope.type ) !== 's' ) { return Text; }

		// Read the value out of the envelope, never out of the string it was parsed from.
		switch ( envelope.type )
		{
			case 'd': return new Date( envelope.value );
			case 'o': return envelope.value;
			case 'a': return envelope.value;
			case 'r': return new RegExp( envelope.source, envelope.flags );
			case 'e': return new Error( envelope.message );
			case 'f': return revive_function( envelope.source );
			case 'y': return Symbol( envelope.source );
			case 'u': return undefined;
		}

		return Text; // An object carrying an unrecognized type name is not an envelope.
	};


	//---------------------------------------------------------------------
	// Rebuilds a function from the source text which Hybridize() recorded.
	//
	// Hybridize() stores Function.toString(), which is a whole function rather than a function
	// body, so the source is evaluated as an expression. Passing it to new Function() directly
	// treats it as a body and fails on the declaration it starts with.
	//
	// Note that only the source survives hybridizing. A function which closed over anything
	// does not work once it is rebuilt here, because the closure was never recorded.
	function revive_function( Source )
	{
		try
		{
			return new Function( `return ( ${Source} );` )();
		}
		catch ( error )
		{
			// A method shorthand, such as the m in { m() {} }, is not an expression on its own
			// and cannot be rebuilt from its own source text.
			if ( jsongin.OpError ) { jsongin.OpError( `Unhybridize: Cannot rebuild the function [${Source}]. ${error.message}` ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	// Turns a document produced by Hybridize() back into a hierarchical document.
	// Only the strings can hold an envelope. Every other value is already in its restored form
	// and is carried across as-is, so that a document which was never hybridized, or which was
	// unhybridized already, survives the call instead of losing fields to it.
	function Unhybridize( Document )
	{
		let complicated = {};
		for ( let key in Document )
		{
			if ( jsongin.ShortType( Document[ key ] ) === 's' )
			{
				complicated[ key ] = unhybridize_string( Document[ key ] );
			}
			else
			{
				complicated[ key ] = Document[ key ];
			}
		}
		return complicated;
	};


	//---------------------------------------------------------------------
	return Unhybridize;
};
