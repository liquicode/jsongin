'use strict';

const jsongin = require( '../jsongin' );

module.exports = function ( jsongin )
{
	function Format( Value, WithWhitespace = false, LikeJavascript = false )
	{
		try
		{
			let options = {
				identifier_quote: `"`,
				always_quote_identifiers: true,
				literal_quote: `"`,
				eol_char: '',
				tab_char: '',
				space_char: '',
			};
			if ( WithWhitespace )
			{
				options.eol_char = '\n';
				options.tab_char = '    ';
				options.space_char = ' ';
				if ( LikeJavascript )
				{
					options.always_quote_identifiers = false;
					options.liberal_commas = true;
					options.align_values = true;
					options.braces_on_own_line = true;
				}
			}
			let json = stringify_recurse( Value, 0, options );
			return json;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Format: ' + error.message ); }
			throw error;
		}
	};

	/*
		(1) Output generates an initial `{ ` which includes a space that does not occur with JSON.stringify.
		(2) The LikeJavascript format includes quoted identifiers. It should not do so.
	*/

	//---------------------------------------------------------------------
	function stringify_recurse( Node, Depth, StringifyOptions, Context = null )
	{
		let text = '';

		if ( typeof Node === 'undefined' )
		{
			// return '';
		}
		else if ( typeof Node === 'boolean' )
		{
			text += Node.toString();
		}
		else if ( typeof Node === 'number' )
		{
			text += Node.toString();
		}
		else if ( typeof Node === 'bigint' )
		{
			text += Node.toString();
		}
		else if ( typeof Node === 'string' )
		{
			let value = Node.toString();
			if ( StringifyOptions.literal_quote )
			{
				value = value.replace( StringifyOptions.literal_quote, '\\' + StringifyOptions.literal_quote );
			}
			text += `${StringifyOptions.literal_quote}${value}${StringifyOptions.literal_quote}`;
		}
		else if ( typeof Node === 'symbol' )
		{
			// return '';
		}
		else if ( typeof Node === 'function' )
		{
			// return '';
		}
		else if ( typeof Node === 'object' )
		{
			if ( Node === null )
			{
				text += 'null';
			}
			else if ( Array.isArray( Node ) )
			{
				// text += StringifyOptions.eol_char;
				// text += StringifyOptions.tab_char.repeat( Depth );
				if ( StringifyOptions.braces_on_own_line )
				{
					text += StringifyOptions.eol_char;
					text += StringifyOptions.tab_char.repeat( Depth );
				}
				if ( StringifyOptions.eol_char )
				{
					text += '[' + StringifyOptions.eol_char;
				}
				else
				{
					text += '[' + StringifyOptions.space_char;
				}
				for ( let index = 0; index < Node.length; index++ )
				{
					text += StringifyOptions.tab_char.repeat( Depth + 1 );
					text += stringify_recurse( Node[ index ], Depth + 1, StringifyOptions, 'array-element' );
					if ( ( index < ( Node.length - 1 ) ) || StringifyOptions.liberal_commas )
					{
						if ( StringifyOptions.eol_char )
						{
							text += ',' + StringifyOptions.eol_char;
						}
						else
						{
							text += ',' + StringifyOptions.space_char;
						}
					}
					else
					{
						if ( StringifyOptions.eol_char )
						{
							text += StringifyOptions.eol_char;
						}
					}
				}
				text += StringifyOptions.tab_char.repeat( Depth );
				if ( !StringifyOptions.eol_char ) { text += StringifyOptions.space_char; }
				text += ']';
			}
			else
			{
				if ( Context === 'field-value' )
				{
					// text += StringifyOptions.eol_char;
					// text += StringifyOptions.tab_char.repeat( Depth );
				}
				if ( ( Depth > 0 ) && StringifyOptions.braces_on_own_line )
				{
					text += StringifyOptions.eol_char;
					text += StringifyOptions.tab_char.repeat( Depth );
				}
				if ( StringifyOptions.eol_char )
				{
					text += '{' + StringifyOptions.eol_char;
				}
				else
				{
					text += '{' + StringifyOptions.space_char;
				}
				// text += '{' + StringifyOptions.space_char;
				// text += StringifyOptions.eol_char;
				let keys = Object.keys( Node );
				let max_key_length = 0;
				keys.map( ( key ) => { if ( key.length > max_key_length ) { max_key_length = key.length; } } );
				for ( let index = 0; index < keys.length; index++ )
				{
					let key = keys[ index ];
					text += StringifyOptions.tab_char.repeat( Depth + 1 );
					if ( StringifyOptions.always_quote_identifiers )
					{
						text += `${StringifyOptions.identifier_quote}${key}${StringifyOptions.identifier_quote}`;
					}
					else
					{
						text += key;
					}
					text += ':';
					if ( StringifyOptions.align_values )
					{
						text += ' '.repeat( max_key_length - key.length );
					}
					text += StringifyOptions.space_char;
					text += stringify_recurse( Node[ key ], Depth + 1, StringifyOptions, 'field-value' );
					if ( ( index < ( keys.length - 1 ) ) || StringifyOptions.liberal_commas )
					{
						if ( StringifyOptions.eol_char )
						{
							text += ',' + StringifyOptions.eol_char;
						}
						else
						{
							text += ',' + StringifyOptions.space_char;
						}
					}
					else
					{
						if ( StringifyOptions.eol_char )
						{
							text += StringifyOptions.eol_char;
						}
					}
				}
				text += StringifyOptions.tab_char.repeat( Depth );
				if ( !StringifyOptions.eol_char ) { text += StringifyOptions.space_char; }
				text += '}';
			}
		}

		return text;
	}


	//---------------------------------------------------------------------
	return Format;
};
