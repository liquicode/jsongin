'use strict';

module.exports = function ( Engine )
{
	function BsonType( Value, ReturnAlias = false )
	{
		// Unsupported BSON Types:
		//	5 - binData
		//	7 - objectid
		//	9 - date
		//	12 - dbPointer (Deprecated)
		//	13 - javascript
		//	15 - javascriptWithScope (Deprecated)
		//	17 - timestamp
		//	19 - decimal
		//	-1 - minKey
		//	127 - maxKey
		let data_type = this.ShortType( Value );
		if ( data_type === 'b' )
		{
			return ReturnAlias ? 'bool' : 8;
		}
		else if ( data_type === 'n' )
		{
			let ns = Value.toString();
			if ( ns.includes( '.' ) )
			{
				return ReturnAlias ? 'double' : 1;
			}
			else
			{
				// if ( ( Data < Number.MIN_SAFE_INTEGER ) || ( Data > Number.MAX_SAFE_INTEGER ) )
				if ( Number.isSafeInteger( Value ) )
				{
					return ReturnAlias ? 'int' : 16; // int32
				}
				else
				{
					return ReturnAlias ? 'long' : 18; // int64
				}
			}
		}
		else if ( data_type === 's' )
		{
			return ReturnAlias ? 'string' : 2;
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
