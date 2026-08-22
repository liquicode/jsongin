'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// Writes a value as JSON text.
	//
	// ***The output is always parseable JSON.*** A value which JSON has no representation for
	// - undefined, a function, a symbol - is treated the way JSON.stringify() treats it: the
	// field is left out of a document, and an array element becomes null, because an array
	// cannot lose an element without renumbering the ones after it. This used to write the
	// field name followed by nothing at all, which no JSON parser accepts and which Parse()
	// read back as whatever punctuation followed it.
	//
	// ***TypedValues writes the values JSON cannot hold, rather than dropping them.*** See
	// tagged_form() below for what each one becomes and where the form comes from.
	//
	// The second parameter used to be a boolean and may still be one. See read_settings().
	function Format( Value, Options = {}, LikeJavascript = false )
	{
		try
		{
			let settings = read_settings( Options, LikeJavascript );

			let options = {
				identifier_quote: `"`,
				always_quote_identifiers: true,
				literal_quote: `"`,
				eol_char: '',
				tab_char: '',
				space_char: '',
				typed_values: settings.TypedValues,
				strict: settings.Strict,
			};
			if ( settings.Whitespace )
			{
				options.eol_char = '\n';
				options.tab_char = '    ';
				options.space_char = ' ';
				if ( settings.LikeJavascript )
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
	// Reads the settings from either the options document or the older positional booleans.
	//
	// ***Format( Value, WithWhitespace, LikeJavascript ) still works.*** It is called that way
	// by the guides, which check-docs executes, so the positional form cannot simply be
	// replaced. A boolean in the second slot means the old form and a document means the new
	// one, which are the only two things that slot has ever held.
	function read_settings( Options, LikeJavascript )
	{
		let settings = {
			Whitespace: false,
			LikeJavascript: false,
			TypedValues: false,
			Strict: false,
		};

		let short_type = jsongin.ShortType( Options );
		if ( short_type === 'o' )
		{
			if ( Options.Whitespace === true ) { settings.Whitespace = true; }
			if ( Options.LikeJavascript === true ) { settings.LikeJavascript = true; }
			if ( Options.TypedValues === true ) { settings.TypedValues = true; }
			if ( Options.Strict === true ) { settings.Strict = true; }
			return settings;
		}

		// The positional form. Anything which is not a document is read as the old
		// WithWhitespace flag, which is how the previous default of `false` behaved.
		if ( Options === true ) { settings.Whitespace = true; }
		if ( LikeJavascript === true ) { settings.LikeJavascript = true; }
		return settings;
	}


	//---------------------------------------------------------------------
	// Answers whether a value has anything to write, and refuses it under Strict.
	//
	// undefined is writable only when TypedValues is set, because that is the only mode which
	// has a form for it. A function and a symbol have no form in any mode.
	function is_writable( Node, StringifyOptions )
	{
		let node_type = typeof Node;
		let writable = true;

		if ( node_type === 'function' ) { writable = false; }
		else if ( node_type === 'symbol' ) { writable = false; }
		else if ( node_type === 'undefined' ) { writable = ( StringifyOptions.typed_values === true ); }

		if ( ( writable === false ) && ( StringifyOptions.strict === true ) )
		{
			throw new Error( `A value of type [${node_type}] has no JSON representation.` );
		}
		return writable;
	}


	//---------------------------------------------------------------------
	// The document a value which JSON cannot hold is written as, when TypedValues is set.
	//
	// ***These are MongoDB Extended JSON's forms, with one deliberate difference.*** Extended
	// JSON v2 maps undefined onto null, because BSON no longer has such a value. jsongin still
	// needs the distinction - $$REMOVE is bound to nothing, and Scope.Lookup reports Found
	// apart from Value precisely so that a variable bound to nothing is not a variable bound
	// to null - so the retired v1 tag is written instead. A round trip which turned $$REMOVE
	// into a null would make a resumed process disagree with itself.
	//
	// ***The regular expression form keeps every JavaScript flag, including g.*** BSON's regex
	// options are imxlsu and the driver refuses g outright. Dropping it would change what the
	// expression matches, so the wire form is MongoDB's and the flag set is jsongin's.
	function tagged_form( Node )
	{
		if ( typeof Node === 'undefined' )
		{
			return { $undefined: true };
		}
		if ( Node instanceof Date )
		{
			// ***Two rules here are the driver's and neither is guessable.*** Both were read
			// off bson's EJSON rather than assumed, and a test compares against it.
			//
			// A time before the epoch is written in the ***canonical*** form, because the
			// relaxed form is an ISO-8601 string and the driver does not use one for a
			// negative timestamp. Anything else is the ISO string.
			let time = Node.getTime();
			if ( time < 0 )
			{
				return { $date: { $numberLong: String( time ) } };
			}

			// The milliseconds are dropped when there are none, so 22:13:20.000Z is written
			// as 22:13:20Z. A non-zero value is kept, padded, as toISOString() writes it.
			let text = Node.toISOString();
			if ( Node.getUTCMilliseconds() === 0 )
			{
				text = text.slice( 0, -5 ) + 'Z';
			}
			return { $date: text };
		}
		if ( Node instanceof RegExp )
		{
			return { $regularExpression: { pattern: Node.source, options: Node.flags } };
		}
		return null;
	}


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
			// Nothing to write unless TypedValues gives it a form. The callers below decide
			// what an omitted value leaves behind, because a document and an array differ.
			if ( StringifyOptions.typed_values )
			{
				return stringify_recurse( tagged_form( Node ), Depth, StringifyOptions, Context );
			}
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
				// JSON.stringify() does, or as the tagged form which reads back as a Date.
				if ( StringifyOptions.typed_values )
				{
					return stringify_recurse( tagged_form( Node ), Depth, StringifyOptions, Context );
				}
				text += `${StringifyOptions.literal_quote}${Node.toISOString()}${StringifyOptions.literal_quote}`;
			}
			else if ( Node instanceof RegExp )
			{
				// A RegExp has no enumerable fields, so walking it as an ordinary object wrote
				// {} and read back as an empty object.
				if ( StringifyOptions.typed_values )
				{
					return stringify_recurse( tagged_form( Node ), Depth, StringifyOptions, Context );
				}
				text += '{' + StringifyOptions.space_char + '}';
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

					// An element with nothing to write becomes null rather than disappearing,
					// which is what JSON.stringify() does. Dropping it would renumber every
					// element after it.
					if ( is_writable( Node[ index ], StringifyOptions ) )
					{
						text += stringify_recurse( Node[ index ], Depth + 1, StringifyOptions, 'array-element' );
					}
					else
					{
						text += 'null';
					}

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

				// A field with nothing to write is left out entirely, which is what
				// JSON.stringify() does. The list is filtered before the commas are counted,
				// because a dropped field must not leave one behind.
				let all_keys = Object.keys( Node );
				let keys = [];
				for ( let index = 0; index < all_keys.length; index++ )
				{
					if ( is_writable( Node[ all_keys[ index ] ], StringifyOptions ) )
					{
						keys.push( all_keys[ index ] );
					}
				}

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
