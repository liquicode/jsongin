'use strict';

module.exports = function ( jsongin )
{
	function BsonType( Value, ReturnAlias = false )
	{
		// MongoDB Ref: https://www.mongodb.com/docs/manual/reference/bson-types
		// Unsupported BSON Types:
		//	5 - binData
		//	7 - objectid
		//	12 - dbPointer (Deprecated)
		//	13 - javascript
		//	15 - javascriptWithScope (Deprecated)
		//	17 - timestamp
		//	19 - decimal
		//	-1 - minKey
		//	127 - maxKey
		let data_type = jsongin.ShortType( Value );
		if ( data_type === 'b' )
		{
			return ReturnAlias ? 'bool' : 8;
		}
		else if ( data_type === 'n' )
		{
			// Every Javascript number is a double. The BSON serializer stores one as an int32
			// only when it is a whole number inside the int32 range, and as a double in every
			// other case, so those are the only two types a number can report here.
			//
			// Verified against MongoDB 6.0.1 by inserting each value and reading back $type:
			//   42 and 2147483647          => int
			//   2147483648, 3000000000     => double
			//   9007199254740991, 3.14     => double
			//   $type: 'long'              => matched none of them
			//
			// This used to test Number.isSafeInteger(), which is not an int32 range test: it
			// called every safe integer an int32, and everything above it a long. A plain
			// Javascript number is never a long, so that branch could only ever be wrong.
			const INT32_MIN = -2147483648;
			const INT32_MAX = 2147483647;

			// Number.isInteger() is false for NaN and for the infinities, so they fall through
			// to double, which is what MongoDB stores them as.
			if ( Number.isInteger( Value ) && ( Value >= INT32_MIN ) && ( Value <= INT32_MAX ) )
			{
				return ReturnAlias ? 'int' : 16; // int32
			}
			return ReturnAlias ? 'double' : 1;
		}
		else if ( data_type === 's' )
		{
			return ReturnAlias ? 'string' : 2;
		}
		else if ( data_type === 'd' )
		{
			return ReturnAlias ? 'date' : 9;
		}
		else if ( data_type === 'l' )
		{
			return ReturnAlias ? 'null' : 10;
		}
		else if ( data_type === 'o' )
		{
			return ReturnAlias ? 'object' : 3;
		}
		else if ( data_type === 'a' )
		{
			return ReturnAlias ? 'array' : 4;
		}
		else if ( data_type === 'r' )
		{
			return ReturnAlias ? 'regex' : 11;
		}
		else if ( data_type === 'f' )
		{
			// unsupported ?
		}
		else if ( data_type === 'y' )
		{
			return ReturnAlias ? 'symbol' : 14; // deprecated
		}
		else if ( data_type === 'u' )
		{
			return ReturnAlias ? 'undefined' : 6;
		}
		return null;
	};
	return BsonType;
};
