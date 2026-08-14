'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	function Evaluate( Document, Expression )
	{
		try
		{
			let expression_type = jsongin.ShortType( Expression );

			// A string is either a field reference or a literal string.
			if ( expression_type === 's' )
			{
				if ( Expression.startsWith( '$$' ) )
				{
					throw new Error( `Expression system variables are not supported [${Expression}].` );
				}
				if ( Expression.startsWith( '$' ) )
				{
					// A field reference. Missing fields evaluate to undefined.
					return jsongin.GetValue( Document, Expression.substring( 1 ) );
				}
				return Expression;
			}

			// An array is evaluated element-wise.
			if ( expression_type === 'a' )
			{
				let values = [];
				for ( let index = 0; index < Expression.length; index++ )
				{
					values.push( Evaluate( Document, Expression[ index ] ) );
				}
				return values;
			}

			// An object is either an operator application or an expression object.
			if ( expression_type === 'o' )
			{
				let keys = Object.keys( Expression );

				// A single operator key is an operator application.
				if ( keys.length === 1 )
				{
					let key = keys[ 0 ];
					let operator = jsongin.ExpressionOperators[ key ];
					if ( typeof operator !== 'undefined' )
					{
						// Check the argument against the types the operator says it takes.
						// An operator is still free to validate its own argument, and does when
						// its Evaluate function is called directly rather than through here.
						if ( jsongin.ShortType( operator.ArgTypes ) === 's' )
						{
							let argument_type = jsongin.ShortType( Expression[ key ] );
							if ( operator.ArgTypes.includes( argument_type ) === false )
							{
								throw new Error( `Operator [${key}] does not take an argument of type [${argument_type}]. It takes [${operator.ArgTypes}].` );
							}
						}

						return operator.Evaluate( Document, Expression[ key ] );
					}
				}

				// Anything else is an expression object. Evaluate each of the field values.
				let evaluated = {};
				for ( let index = 0; index < keys.length; index++ )
				{
					let key = keys[ index ];
					if ( key.startsWith( '$' ) )
					{
						throw new Error( `Unrecognized expression operator [${key}].` );
					}
					evaluated[ key ] = Evaluate( Document, Expression[ key ] );
				}
				return evaluated;
			}

			// Everything else is a literal value.
			return Expression;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Evaluate: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	return Evaluate;
};
