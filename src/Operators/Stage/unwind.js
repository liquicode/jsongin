'use strict';
/*md

## Operators > Stage > $unwind

Usage: `$unwind: '$path'`
  or `$unwind: { path: '$path', includeArrayIndex: 'field', preserveNullAndEmptyArrays: bool }`

Deconstructs an array field, emitting one document per element of the array.
The path must begin with a `$`, as it does in MongoDB.

- An ***array***: one document is emitted per element, with the field set to that element.
- An ***empty array***, a ***null***, or a ***missing*** field: nothing is emitted, unless
  `preserveNullAndEmptyArrays` is true, in which case the document is emitted once with the
  field removed (empty array or missing) or left as `null`.
- Any ***other value***: the document is emitted once, unchanged. MongoDB treats a non-array
  as a single element array.

When `includeArrayIndex` is given, that field is set to the element's index, or to `null` for
  a document which was not unwound from an array.

This stage produces new documents. Every document it emits is a clone, so the caller's
  documents are never written to.

*/

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Reads the stage's arguments, in either of the two forms MongoDB accepts.
	function read_args( Args )
	{
		let options =
		{
			Path: null,
			IncludeArrayIndex: null,
			PreserveNullAndEmptyArrays: false,
		};

		let args_type = jsongin.ShortType( Args );
		if ( args_type === 's' )
		{
			options.Path = Args;
		}
		else if ( args_type === 'o' )
		{
			if ( jsongin.ShortType( Args.path ) !== 's' ) { throw new Error( `$unwind requires a path string.` ); }
			options.Path = Args.path;

			if ( typeof Args.includeArrayIndex !== 'undefined' )
			{
				if ( jsongin.ShortType( Args.includeArrayIndex ) !== 's' ) { throw new Error( `$unwind includeArrayIndex must be a string.` ); }
				options.IncludeArrayIndex = Args.includeArrayIndex;
			}

			if ( typeof Args.preserveNullAndEmptyArrays !== 'undefined' )
			{
				if ( jsongin.ShortType( Args.preserveNullAndEmptyArrays ) !== 'b' ) { throw new Error( `$unwind preserveNullAndEmptyArrays must be a boolean.` ); }
				options.PreserveNullAndEmptyArrays = Args.preserveNullAndEmptyArrays;
			}
		}
		else
		{
			throw new Error( `$unwind requires a path string or an object.` );
		}

		if ( options.Path.startsWith( '$' ) === false ) { throw new Error( `$unwind path must begin with a $ [${options.Path}].` ); }
		options.Path = options.Path.substring( 1 );
		if ( options.Path.length === 0 ) { throw new Error( `$unwind requires a path.` ); }

		return options;
	};


	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		OperatorType: 'Stage',
		ArgTypes: 'so',

		//---------------------------------------------------------------------
		Stage: function ( Documents, Args )
		{
			try
			{
				let options = read_args( Args );

				let results = [];
				for ( let index = 0; index < Documents.length; index++ )
				{
					let document = Documents[ index ];
					let value = jsongin.GetValue( document, options.Path );
					let value_type = jsongin.ShortType( value );

					// An array of elements. One document is emitted per element.
					if ( ( value_type === 'a' ) && ( value.length > 0 ) )
					{
						for ( let element_index = 0; element_index < value.length; element_index++ )
						{
							let result = jsongin.SafeClone( document );
							jsongin.SetValue( result, options.Path, jsongin.SafeClone( value[ element_index ] ) );
							if ( options.IncludeArrayIndex !== null )
							{
								jsongin.SetValue( result, options.IncludeArrayIndex, element_index );
							}
							results.push( result );
						}
						continue;
					}

					// An empty array, a null, or a missing field.
					if ( ( value_type === 'a' ) || ( 'lu'.includes( value_type ) ) )
					{
						if ( options.PreserveNullAndEmptyArrays === false ) { continue; }

						let result = jsongin.SafeClone( document );
						// A null is left in place. An empty array is removed, as MongoDB does.
						if ( value_type === 'a' ) { jsongin.DeleteValue( result, options.Path ); }
						if ( options.IncludeArrayIndex !== null )
						{
							jsongin.SetValue( result, options.IncludeArrayIndex, null );
						}
						results.push( result );
						continue;
					}

					// Any other value is treated as a single element array.
					let result = jsongin.SafeClone( document );
					if ( options.IncludeArrayIndex !== null )
					{
						jsongin.SetValue( result, options.IncludeArrayIndex, null );
					}
					results.push( result );
				}

				return results;
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Stage.$unwind: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
