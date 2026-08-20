'use strict';
/*md

## Operators > Expression > $replaceAll

Usage: `$replaceAll: { input: expression, find: expression, replacement: expression }`

Replaces every occurrence of a substring. See [$replaceOne](#$replaceOne).

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
				let values = string.Arguments( Document, Args, '$replaceAll', [ 'input', 'find', 'replacement' ], [] );

				let text = string.AsStringOrNull( values.input, '$replaceAll' );
				let find = string.AsStringOrNull( values.find, '$replaceAll' );
				let replacement = string.AsStringOrNull( values.replacement, '$replaceAll' );
				if ( ( text === null ) || ( find === null ) || ( replacement === null ) ) { return null; }

				// The find is matched literally, so a `.` is a full stop rather than a pattern.
				return text.split( find ).join( replacement );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$replaceAll: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
