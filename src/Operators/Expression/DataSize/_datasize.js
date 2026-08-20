'use strict';

/*
	Shared BSON size arithmetic for the data size operators.
	This is a helper module, not an operator.

	***These operators ask what a value would occupy once encoded***, which is a question about
	BSON rather than about the value, so the encoding's layout is what is counted here:

		document    4 for its own length, then each element, then 1 for the terminator
		element     1 for the type, then the field name and a terminating zero, then the value
		array       a document whose keys are '0', '1', and so on, which is why an array of two
		            numbers costs more than the two numbers do

	***Which size a number takes is decided by BsonType(), not by a second copy of the rule.***
	A whole number inside the 32 bit range is an int32 and takes 4 bytes; anything else is a
	double and takes 8. That is the rule the BSON serializer uses, so a document written by the
	driver and the same document held by jsongin agree on their size. It is also the rule $type
	reports, and the two cannot drift apart while they read it from the same place.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Aggregate Tests/test-suite/Data Size Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	const string = require( '../String/_string' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	helper.Operands = string.Operands;


	//---------------------------------------------------------------------
	// The number of UTF-8 bytes a string occupies.
	// The same counting the byte-oriented string operators do, from the same place.
	helper.ByteLength = function ( Text )
	{
		return string.ToBytes( Text ).length;
	};


	//---------------------------------------------------------------------
	// The encoded size of one value, not counting its type byte or its field name.
	helper.ValueSize = function ( Value, OperatorName )
	{
		let bson_type = jsongin.BsonType( Value, true );

		if ( bson_type === 'int' ) { return 4; }
		if ( bson_type === 'double' ) { return 8; }
		if ( bson_type === 'bool' ) { return 1; }
		if ( bson_type === 'null' ) { return 0; }
		if ( bson_type === 'date' ) { return 8; }

		// A string carries its own length ahead of it and a zero after it.
		if ( bson_type === 'string' ) { return 4 + helper.ByteLength( Value ) + 1; }

		// A regex is two zero terminated strings, the pattern and its flags.
		if ( bson_type === 'regex' )
		{
			return helper.ByteLength( Value.source ) + 1 + helper.ByteLength( Value.flags ) + 1;
		}

		if ( ( bson_type === 'object' ) || ( bson_type === 'array' ) )
		{
			return helper.DocumentSize( Value, OperatorName );
		}

		throw new Error( `${OperatorName}: cannot measure a [${jsongin.ShortType( Value )}] value.` );
	};


	//---------------------------------------------------------------------
	// The encoded size of a document, or of an array read as one.
	helper.DocumentSize = function ( Document, OperatorName )
	{
		// The leading length and the trailing terminator belong to every document.
		let size = 4 + 1;

		let keys = Object.keys( Document );
		for ( let index = 0; index < keys.length; index++ )
		{
			let key = keys[ index ];
			let value = Document[ key ];

			// An undefined field is not written at all, so it costs nothing. BSON has no
			// value for it and the serializer drops the element.
			if ( jsongin.ShortType( value ) === 'u' ) { continue; }

			// One byte of type, the field name, and the zero which ends it.
			size = size + 1 + helper.ByteLength( key ) + 1;
			size = size + helper.ValueSize( value, OperatorName );
		}

		return size;
	};


	//---------------------------------------------------------------------
	return helper;
};
