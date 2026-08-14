'use strict';

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
	// Escapes the text which goes between a pair of quotes.
	//
	// These are the rules JSON.stringify() follows: the quote and the backslash are escaped,
	// the five control characters which have a short form get it, every other character below
	// U+0020 becomes a \u escape, and a surrogate which is not part of a pair becomes one too.
	// Everything else, including U+007F and U+2028, is written as itself.
	//
	// Escaping only the quote, and only its first occurrence, produced output which
	// JSON.parse() could not read back.
	function escape_string( Text, Quote )
	{
		let escaped = '';
		for ( let index = 0; index < Text.length; index++ )
		{
			let character = Text.charAt( index );

			if ( character === Quote ) { escaped += '\\' + Quote; continue; }
			if ( character === '\\' ) { escaped += '\\\\'; continue; }

			switch ( character )
			{
				case '\b': escaped += '\\b'; continue;
				case '\f': escaped += '\\f'; continue;
				case '\n': escaped += '\\n'; continue;
				case '\r': escaped += '\\r'; continue;
				case '\t': escaped += '\\t'; continue;
			}

			let code = Text.charCodeAt( index );

			// The control characters which have no short form.
			if ( code < 0x20 ) { escaped += unicode_escape( code ); continue; }

			// A high surrogate is only a character when a low surrogate follows it.
			if ( ( code >= 0xD800 ) && ( code <= 0xDBFF ) )
			{
				let next = Text.charCodeAt( index + 1 );
				if ( ( next >= 0xDC00 ) && ( next <= 0xDFFF ) )
				{
					escaped += character + Text.charAt( index + 1 );
					index++;
					continue;
				}
				escaped += unicode_escape( code );
				continue;
			}

			// A low surrogate here was not preceded by a high one, so it stands alone.
			if ( ( code >= 0xDC00 ) && ( code <= 0xDFFF ) )
			{
				escaped += unicode_escape( code );
				continue;
			}

			escaped += character;
		}
		return escaped;
	}


	//---------------------------------------------------------------------
	// Writes a character code as a four digit \u escape, in lowercase hexadecimal.
	function unicode_escape( Code )
	{
		let digits = Code.toString( 16 );
		while ( digits.length < 4 ) { digits = '0' + digits; }
		return '\\u' + digits;
	}


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
			let value = escape_string( Node.toString(), StringifyOptions.literal_quote );
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
			else if ( Node instanceof Date )
			{
				// A Date has no fields to walk. Emit it as an ISO string, which is what
				// JSON.stringify() does.
				text += `${StringifyOptions.literal_quote}${Node.toISOString()}${StringifyOptions.literal_quote}`;
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
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( keys[ index ].length > max_key_length ) { max_key_length = keys[ index ].length; }
				}
				for ( let index = 0; index < keys.length; index++ )
				{
					let key = keys[ index ];
					text += StringifyOptions.tab_char.repeat( Depth + 1 );
					if ( StringifyOptions.always_quote_identifiers )
					{
						// A field name needs the same escaping a string value does.
						let name = escape_string( key, StringifyOptions.identifier_quote );
						text += `${StringifyOptions.identifier_quote}${name}${StringifyOptions.identifier_quote}`;
					}
					else
					{
						// LikeJavascript writes a bare identifier, which cannot carry an escape.
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
