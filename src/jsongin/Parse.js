'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Reads a value from a string of JSON, or of the more relaxed Javascript object syntax.
	//
	// Parse is forgiving on purpose and never throws. A string it cannot read is returned
	// unchanged, and so is an argument which is not a string at all. The reason is reported to
	// OpLog rather than OpError, because the call completed; it just did not parse.
	//
	// The tokenizer and the builder below do throw, naming the position and what was expected.
	// This function is where those throws are turned back into the original argument, so that
	// the diagnosis is kept without the caller having to catch anything.
	//
	// Note that a fallback cannot be told apart from a successful parse which happened to
	// produce a string: Parse( '"abc"' ) returns 'abc' because it parsed, and Parse( '"abc' )
	// returns '"abc' because it did not. OpLog is what distinguishes them.
	function Parse( JsonString )
	{
		if ( jsongin.ShortType( JsonString ) !== 's' )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Parse: The JsonString parameter must be a string. The value was returned unchanged.` ); }
			return JsonString;
		}

		try
		{
			let tokens = Tokenize( JsonString );
			if ( tokens.length === 0 ) { throw new Error( `The string holds no value.` ); }
			return BuildObject( tokens );
		}
		catch ( error )
		{
			if ( jsongin.OpLog ) { jsongin.OpLog( `Parse: ${error.message} The string was returned unchanged.` ); }
			return JsonString;
		}
	};


	//---------------------------------------------------------------------
	// Returns the character which an escape sequence stands for.
	//
	// An escape which is not one of these stands for itself. That covers JSON's \" \\ and \/
	// and, because Parse also reads single quoted strings, \' as well.
	// Dropping the backslash and taking the next character literally, which is what this
	// replaces, turned \n into the letter n.
	function unescape_character( Escape )
	{
		switch ( Escape )
		{
			case 'b': return '\b';
			case 'f': return '\f';
			case 'n': return '\n';
			case 'r': return '\r';
			case 't': return '\t';
		}
		return Escape;
	}


	//---------------------------------------------------------------------
	// Reads a quoted string, starting at the opening quote.
	// Returns the text and the position just past the closing quote.
	function read_string( JsonString, Start )
	{
		let quote = JsonString.charAt( Start );
		let ichar = Start + 1;
		let text = '';

		while ( ichar < JsonString.length )
		{
			let character = JsonString.charAt( ichar );

			// The closing quote.
			if ( character === quote )
			{
				return { text: text, at: ichar + 1 };
			}

			// An escape sequence.
			if ( character === '\\' )
			{
				ichar++;
				if ( ichar >= JsonString.length ) { break; } // Reported as unterminated below.

				let escape = JsonString.charAt( ichar );
				ichar++;

				if ( escape === 'u' )
				{
					let digits = JsonString.substring( ichar, ichar + 4 );
					if ( /^[0-9a-fA-F]{4}$/.test( digits ) === false )
					{
						throw new Error( `At position [${ichar}]: Expected four hexadecimal digits after a \\u escape.` );
					}
					text += String.fromCharCode( parseInt( digits, 16 ) );
					ichar += 4;
					continue;
				}

				text += unescape_character( escape );
				continue;
			}

			text += character;
			ichar++;
		}

		throw new Error( `At position [${Start}]: The string is not terminated.` );
	}


	//---------------------------------------------------------------------
	function Tokenize( JsonString )
	{
		let tokens = [];

		let whitespace = ' \t\r\n';
		let delimiters = '[]{}:,';
		let quotes = `'"`;

		let ichar = 0;
		while ( ichar < JsonString.length )
		{
			let ch = JsonString.charAt( ichar );
			if ( whitespace.includes( ch ) )
			{
				ichar++;
			}
			else if ( delimiters.includes( ch ) )
			{
				tokens.push( {
					token: ch,
					type: 'delimiter',
					at: ichar,
				} );
				ichar++;
			}
			else if ( quotes.includes( ch ) )
			{
				let iat = ichar;
				let read = read_string( JsonString, ichar );
				ichar = read.at;
				tokens.push( {
					token: read.text,
					type: 'string',
					at: iat,
				} );
			}
			else
			{
				let iat = ichar;
				ichar++;
				let s = ch;
				while ( ichar < JsonString.length )
				{
					let ch2 = JsonString.charAt( ichar );
					if (
						whitespace.includes( ch2 )
						|| delimiters.includes( ch2 )
						|| quotes.includes( ch2 )
					)
					{
						break;
					}
					s += ch2;
					ichar++;
				}
				tokens.push( {
					token: s,
					type: 'literal',
					at: iat,
				} );
			}
		}

		return tokens;
	}


	//---------------------------------------------------------------------
	// Builds one value from the front of the token array, consuming the tokens it uses.
	// Every path returns, so this reads the front of the array rather than looping over it.
	function BuildObject( Tokens )
	{
		if ( Tokens.length === 0 ) { throw new Error( `The value is missing.` ); }

		// An array.
		if ( Tokens[ 0 ].token === '[' )
		{
			let opened = Tokens.shift();
			let value = [];
			while ( true )
			{
				if ( Tokens.length === 0 )
				{
					throw new Error( `At position [${opened.at}]: The array is not closed with a ']'.` );
				}
				if ( Tokens[ 0 ].token === ']' ) { break; }
				value.push( BuildObject( Tokens ) );
			}
			Tokens.shift();
			consume_comma( Tokens );
			return value;
		}

		// An object.
		if ( Tokens[ 0 ].token === '{' )
		{
			let opened = Tokens.shift();
			let value = {};
			while ( true )
			{
				if ( Tokens.length === 0 )
				{
					throw new Error( `At position [${opened.at}]: The object is not closed with a '}'.` );
				}
				if ( Tokens[ 0 ].token === '}' ) { break; }

				let key = Tokens.shift();
				if ( ( key.type !== 'literal' ) && ( key.type !== 'string' ) )
				{
					throw new Error( `At position [${key.at}]: Expected a field name, found ${key.type} '${key.token}' instead.` );
				}
				if ( Tokens.length === 0 )
				{
					throw new Error( `At position [${key.at}]: Expected a ':' after the field name '${key.token}'.` );
				}
				let colon = Tokens.shift();
				if ( colon.token !== ':' )
				{
					throw new Error( `At position [${colon.at}]: Expected ':', found '${colon.token}' instead.` );
				}

				value[ key.token ] = BuildObject( Tokens );
			}
			Tokens.shift();
			consume_comma( Tokens );
			return value;
		}

		// A literal or a quoted string.
		let token = Tokens.shift();
		let value = token.token;
		if ( token.type === 'literal' )
		{
			if ( value.toLowerCase() === 'null' )
			{
				value = null;
			}
			else if ( value.toLowerCase() === 'true' )
			{
				value = true;
			}
			else if ( value.toLowerCase() === 'false' )
			{
				value = false;
			}
			if ( !isNaN( parseFloat( value ) ) && isFinite( value ) )
			{
				value = parseFloat( value );
			}
		}
		consume_comma( Tokens );
		return value;
	}


	//---------------------------------------------------------------------
	function consume_comma( Tokens )
	{
		if ( !Tokens.length ) { return; }
		if ( Tokens[ 0 ].token === ',' )
		{
			Tokens.shift();
		}
		return;
	}


	//---------------------------------------------------------------------
	return Parse;
};
