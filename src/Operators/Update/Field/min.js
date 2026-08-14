'use strict';

module.exports = function ( jsongin )
{
	const minmax = require( './_minmax' )( jsongin );

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Update',
		TopLevel: true,
		ValueTypes: 'o',

		//---------------------------------------------------------------------
		Update: function ( Document, UpdateFields )
		{
			try
			{
				// -1 keeps the smaller of the two values.
				// See _minmax.js for the MongoDB semantics this follows.
				return minmax.Apply( Document, UpdateFields, '$min', -1 );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Update.$min: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
