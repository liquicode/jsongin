'use strict';
/*md

## Operators > Expression > $replaceOne

Usage: `$replaceOne: { input: expression, find: expression, replacement: expression }`

Replaces the first occurrence of a substring.

***`find` is literal text, not a pattern***, so a `.` is a full stop. Use
  [$regexFind](#$regexFind) to search by pattern.
A find which does not occur returns the input unchanged, and a null in any of the three
  arguments gives null.

*/

module.exports = function ( jsongin )
{

	const string = require( './_string' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args )
		{
			try
			{
				let values = string.Arguments( Document, Args, '$replaceOne', [ 'input', 'find', 'replacement' ], [] );

				let text = string.AsStringOrNull( values.input, '$replaceOne' );
				let find = string.AsStringOrNull( values.find, '$replaceOne' );
				let replacement = string.AsStringOrNull( values.replacement, '$replaceOne' );
				if ( ( text === null ) || ( find === null ) || ( replacement === null ) ) { return null; }

				// The find is matched literally, so a `.` is a full stop rather than a pattern.
				let at = text.indexOf( find );
				if ( at < 0 ) { return text; }

				return text.substring( 0, at ) + replacement + text.substring( at + find.length );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$replaceOne: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
