'use strict';

const jsongin = require( '../jsongin' );

module.exports = function ( jsongin )
{
	function Parse( JsonString )
	{
		try
		{
			let tokens = Tokenize( JsonString );
			return BuildObject( tokens );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'Parse: ' + error.message ); }
			throw error;
		}
	};


	//---------------------------------------------------------------------
	function Tokenize( JsonString )
	{
		let tokens = [];

		// Json = Json.replace( '\t', ' ' );
		// Json = Json.replace( '\n', ' ' );
		// while ( Json.includes( '  ' ) ) { Json = Json.replace( '  ', ' ' ); }

		let whitespace = ' \t\n';
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
				ichar++;
				let s = '';
				while ( ichar < JsonString.length )
				{
					let ch2 = JsonString.charAt( ichar );
					if ( ch2 === ch )
					{
						ichar++;
						break;
					}
					if ( ch2 === '\\' )
					{
						ichar++;
						if ( ichar < JsonString.length )
						{
							ch2 = JsonString.charAt( ichar );
						}
						else
						{
							ch2 = '';
						}
					}
					s += ch2;
					ichar++;
				}
				tokens.push( {
					token: s,
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
	function BuildObject( Tokens )
	{
		while ( Tokens.length )
		{
			if ( Tokens[ 0 ].token === '[' )
			{
				Tokens.shift();
				let value = [];
				while ( Tokens[ 0 ].token !== ']' )
				{
					value.push( BuildObject( Tokens ) );
				}
				Tokens.shift();
				consume_comma( Tokens );
				return value;
			}
			else if ( Tokens[ 0 ].token === '{' )
			{
				Tokens.shift();
				let value = {};
				while ( Tokens[ 0 ].token !== '}' )
				{
					let key = Tokens.shift();
					let colon = Tokens.shift();
					if ( ( key.type !== 'literal' ) && ( key.type !== 'string' ) )
					{
						throw new Error( `At position [${key.at}]: Expected literal, found ${key.type} '${key.token}' instead.`, key );
					}
					if ( colon.token !== ':' )
					{
						throw new Error( `At position [${colon.at}]: Expected ':', found '${colon.token}' instead.`, colon );
					}
					value[ key.token ] = BuildObject( Tokens );
				}
				Tokens.shift();
				consume_comma( Tokens );
				return value;
			}
			else
			{
				let value = Tokens[ 0 ].token;
				if ( Tokens[ 0 ].type === 'literal' )
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
				Tokens.shift();
				consume_comma( Tokens );
				return value;
			}
		}
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
