'use strict';

/*
	The formats a string can be asserted to have, each as a function from the string to a
	boolean. Check() answers null for a format not listed here, which the format keyword reads
	as "no opinion", since an unknown format is an annotation by definition.

	Each format follows the document the specification cites for it - RFC 3339 for the dates
	and times, RFC 3986 and 3987 for URIs and IRIs, RFC 6570 for templates, RFC 6901 for
	pointers, RFC 4122 for UUIDs, RFC 5321 for email, RFC 1123 and 5890 for host names - and
	all of them are measured against the test suite's optional format cases. Digits are ASCII
	digits throughout: a Bengali numeral is not a digit in any of these grammars.
*/

const LIB_IDNA = require( './Idna.js' );

const FORMATS = {};


//---------------------------------------------------------------------
// Dates and times (RFC 3339).

function is_leap_year( Year )
{
	return ( ( Year % 4 === 0 ) && ( Year % 100 !== 0 ) ) || ( Year % 400 === 0 );
}

function days_in_month( Year, Month )
{
	const DAYS = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
	if ( ( Month === 2 ) && is_leap_year( Year ) ) { return 29; }
	return DAYS[ Month - 1 ];
}

function check_date( Text )
{
	let match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec( Text );
	if ( match === null ) { return false; }
	let year = parseInt( match[ 1 ], 10 );
	let month = parseInt( match[ 2 ], 10 );
	let day = parseInt( match[ 3 ], 10 );
	if ( ( month < 1 ) || ( month > 12 ) ) { return false; }
	if ( ( day < 1 ) || ( day > days_in_month( year, month ) ) ) { return false; }
	return true;
}

// A full time with its offset. A leap second is allowed only at the last minute of a UTC day.
function check_time( Text )
{
	let match = /^([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]+)?([Zz]|[+-][0-9]{2}:[0-9]{2})$/.exec( Text );
	if ( match === null ) { return false; }
	let hour = parseInt( match[ 1 ], 10 );
	let minute = parseInt( match[ 2 ], 10 );
	let second = parseInt( match[ 3 ], 10 );
	if ( ( hour > 23 ) || ( minute > 59 ) || ( second > 60 ) ) { return false; }
	let offset_minutes = 0;
	let offset = match[ 4 ];
	if ( ( offset !== 'Z' ) && ( offset !== 'z' ) )
	{
		let offset_hour = parseInt( offset.substring( 1, 3 ), 10 );
		let offset_minute = parseInt( offset.substring( 4, 6 ), 10 );
		if ( ( offset_hour > 23 ) || ( offset_minute > 59 ) ) { return false; }
		offset_minutes = ( offset_hour * 60 ) + offset_minute;
		if ( offset.startsWith( '+' ) ) { offset_minutes = -offset_minutes; }
	}
	if ( second === 60 )
	{
		let utc_minutes = ( ( ( hour * 60 ) + minute + offset_minutes ) % 1440 + 1440 ) % 1440;
		if ( utc_minutes !== ( 23 * 60 ) + 59 ) { return false; }
	}
	return true;
}

FORMATS[ 'date' ] = check_date;
FORMATS[ 'time' ] = check_time;
FORMATS[ 'date-time' ] = function ( Text )
{
	let match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})[Tt](.+)$/.exec( Text );
	if ( match === null ) { return false; }
	return check_date( match[ 1 ] ) && check_time( match[ 2 ] );
};

// A duration: either weeks alone, or date elements then T and time elements, with at least one
// element in all and at least one after a T.
FORMATS[ 'duration' ] = function ( Text )
{
	// The grammar nests rather than lists: a year may be followed by months, months by days,
	// so years and days without months is not a duration, and the time part is the same.
	const DATE = '[0-9]+Y(?:[0-9]+M(?:[0-9]+D)?)?|[0-9]+M(?:[0-9]+D)?|[0-9]+D';
	const TIME = 'T(?:[0-9]+H(?:[0-9]+M(?:[0-9]+S)?)?|[0-9]+M(?:[0-9]+S)?|[0-9]+S)';
	return new RegExp( `^P(?:[0-9]+W|(?:${DATE})(?:${TIME})?|${TIME})$` ).test( Text );
};


//---------------------------------------------------------------------
// Identifiers.

FORMATS[ 'uuid' ] = function ( Text )
{
	return /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/.test( Text );
};

FORMATS[ 'json-pointer' ] = function ( Text )
{
	return /^(?:\/(?:[^~/]|~[01])*)*$/u.test( Text );
};

FORMATS[ 'relative-json-pointer' ] = function ( Text )
{
	return /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~[01])*)*)$/u.test( Text );
};

// A regular expression as ECMA 262 reads one, with Unicode semantics, which is what the
// specification names. Compiled without the `u` flag an identity escape such as \a would pass.
FORMATS[ 'regex' ] = function ( Text )
{
	try
	{
		new RegExp( Text, 'u' );
		return true;
	}
	catch ( error )
	{
		return false;
	}
};


//---------------------------------------------------------------------
// Addresses.

function check_ipv4( Text )
{
	return /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/.test( Text );
}

function check_ipv6( Text )
{
	if ( /^[0-9A-Fa-f:.]+$/.test( Text ) === false ) { return false; }
	let groups_text = Text;
	if ( groups_text.includes( '.' ) )
	{
		// An embedded IPv4 address stands for the last two groups.
		let last_colon = groups_text.lastIndexOf( ':' );
		if ( last_colon < 0 ) { return false; }
		if ( check_ipv4( groups_text.substring( last_colon + 1 ) ) === false ) { return false; }
		groups_text = groups_text.substring( 0, last_colon + 1 ) + '0:0';
	}
	if ( groups_text.includes( ':::' ) ) { return false; }
	let gap = groups_text.indexOf( '::' );
	if ( gap >= 0 )
	{
		if ( groups_text.indexOf( '::', gap + 1 ) >= 0 ) { return false; }
		let left = groups_text.substring( 0, gap );
		let right = groups_text.substring( gap + 2 );
		let groups = [];
		if ( left.length > 0 ) { groups = groups.concat( left.split( ':' ) ); }
		if ( right.length > 0 ) { groups = groups.concat( right.split( ':' ) ); }
		if ( groups.length > 7 ) { return false; }
		for ( let index = 0; index < groups.length; index++ )
		{
			if ( /^[0-9A-Fa-f]{1,4}$/.test( groups[ index ] ) === false ) { return false; }
		}
		return true;
	}
	let groups = groups_text.split( ':' );
	if ( groups.length !== 8 ) { return false; }
	for ( let index = 0; index < groups.length; index++ )
	{
		if ( /^[0-9A-Fa-f]{1,4}$/.test( groups[ index ] ) === false ) { return false; }
	}
	return true;
}

FORMATS[ 'ipv4' ] = check_ipv4;
FORMATS[ 'ipv6' ] = check_ipv6;
FORMATS[ 'hostname' ] = function ( Text ) { return LIB_IDNA.CheckHostname( Text, false ); };
FORMATS[ 'idn-hostname' ] = function ( Text ) { return LIB_IDNA.CheckHostname( Text, true ); };


//---------------------------------------------------------------------
// Email (RFC 5321): a local part, an @, and a domain which is a host name or an address
// literal in brackets. The local part is a dot-string of atoms or a quoted string.

const ATEXT = "A-Za-z0-9!#$%&'*+/=?^_`{|}~\\-";
const ATEXT_IDN = ATEXT + '\\u0080-\\u{10FFFF}';

function check_email( Text, Internationalized )
{
	let local = null;
	let domain = null;
	if ( Text.startsWith( '"' ) )
	{
		// A quoted pair carries one ASCII character; the quoted text is ASCII too unless the
		// address is internationalized.
		let quoted = Internationalized
			? /^"((?:[^"\\\r\n]|\\[\x20-\x7E])*)"@(.+)$/su
			: /^"((?:[\x20\x21\x23-\x5B\x5D-\x7E]|\\[\x20-\x7E])*)"@(.+)$/su;
		let match = quoted.exec( Text );
		if ( match === null ) { return false; }
		local = match[ 0 ].substring( 0, match[ 0 ].length - match[ 2 ].length - 1 );
		domain = match[ 2 ];
	}
	else
	{
		let at = Text.indexOf( '@' );
		if ( at < 0 ) { return false; }
		local = Text.substring( 0, at );
		domain = Text.substring( at + 1 );
		let atom = Internationalized ? `[${ATEXT_IDN}]+` : `[${ATEXT}]+`;
		if ( new RegExp( `^${atom}(?:\\.${atom})*$`, 'u' ).test( local ) === false ) { return false; }
	}
	if ( ( local.length === 0 ) || ( local.length > 64 ) ) { return false; }
	if ( domain.startsWith( '[' ) )
	{
		if ( domain.endsWith( ']' ) === false ) { return false; }
		let literal = domain.substring( 1, domain.length - 1 );
		if ( /^ipv6:/i.test( literal ) ) { return check_ipv6( literal.substring( 5 ) ); }
		return check_ipv4( literal );
	}
	return LIB_IDNA.CheckHostname( domain, Internationalized );
}

FORMATS[ 'email' ] = function ( Text ) { return check_email( Text, false ); };
FORMATS[ 'idn-email' ] = function ( Text ) { return check_email( Text, true ); };


//---------------------------------------------------------------------
// URIs (RFC 3986) and IRIs (RFC 3987), absolute or as references.

const UNRESERVED = 'A-Za-z0-9\\-._~';
const SUB_DELIMS = "!$&'()*+,;=";
const UCSCHAR = '\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF\\u{10000}-\\u{1FFFD}\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}\\u{40000}-\\u{4FFFD}\\u{50000}-\\u{5FFFD}\\u{60000}-\\u{6FFFD}\\u{70000}-\\u{7FFFD}\\u{80000}-\\u{8FFFD}\\u{90000}-\\u{9FFFD}\\u{A0000}-\\u{AFFFD}\\u{B0000}-\\u{BFFFD}\\u{C0000}-\\u{CFFFD}\\u{D0000}-\\u{DFFFD}\\u{E1000}-\\u{EFFFD}';
const IPRIVATE = '\\uE000-\\uF8FF\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}';

// A regular expression matching a whole string of the given characters or percent triplets.
function chars_of( Extra, Iri )
{
	let set = UNRESERVED + SUB_DELIMS + Extra + ( Iri ? UCSCHAR : '' );
	return new RegExp( `^(?:[${set}]|%[0-9A-Fa-f]{2})*$`, 'u' );
}

const CHARS = {
	Uri: { UserInfo: chars_of( ':', false ), Host: chars_of( '', false ), Segment: chars_of( ':@', false ), Query: chars_of( ':@/?', false ), Fragment: chars_of( ':@/?', false ) },
	Iri: { UserInfo: chars_of( ':', true ), Host: chars_of( '', true ), Segment: chars_of( ':@', true ), Query: chars_of( ':@/?' + IPRIVATE, true ), Fragment: chars_of( ':@/?', true ) },
};

function check_authority( Authority, Chars )
{
	let rest = Authority;
	let at = rest.indexOf( '@' );
	if ( at >= 0 )
	{
		if ( Chars.UserInfo.test( rest.substring( 0, at ) ) === false ) { return false; }
		rest = rest.substring( at + 1 );
	}
	if ( rest.startsWith( '[' ) )
	{
		let close = rest.indexOf( ']' );
		if ( close < 0 ) { return false; }
		let literal = rest.substring( 1, close );
		let after = rest.substring( close + 1 );
		if ( /^[vV][0-9A-Fa-f]+\.[A-Za-z0-9\-._~!$&'()*+,;=:]+$/.test( literal ) === false )
		{
			if ( check_ipv6( literal ) === false ) { return false; }
		}
		if ( after.length === 0 ) { return true; }
		return /^:[0-9]*$/.test( after );
	}
	let colon = rest.lastIndexOf( ':' );
	if ( colon >= 0 )
	{
		if ( /^[0-9]*$/.test( rest.substring( colon + 1 ) ) === false ) { return false; }
		rest = rest.substring( 0, colon );
	}
	return Chars.Host.test( rest );
}

function check_uri( Text, RequireScheme, Iri )
{
	let chars = Iri ? CHARS.Iri : CHARS.Uri;
	let match = /^(?:([^:/?#]*):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#([\s\S]*))?$/u.exec( Text );
	if ( match === null ) { return false; }
	let scheme = match[ 1 ];
	let authority = match[ 2 ];
	let path = match[ 3 ];
	let query = match[ 4 ];
	let fragment = match[ 5 ];

	if ( typeof scheme === 'undefined' )
	{
		if ( RequireScheme ) { return false; }
	}
	else if ( /^[A-Za-z][A-Za-z0-9+.\-]*$/.test( scheme ) === false )
	{
		return false;
	}

	if ( typeof authority !== 'undefined' )
	{
		if ( check_authority( authority, chars ) === false ) { return false; }
		if ( ( path.length > 0 ) && ( path.startsWith( '/' ) === false ) ) { return false; }
	}
	else if ( path.startsWith( '//' ) )
	{
		return false;
	}

	let segments = path.split( '/' );
	for ( let index = 0; index < segments.length; index++ )
	{
		if ( chars.Segment.test( segments[ index ] ) === false ) { return false; }
	}
	if ( ( typeof query !== 'undefined' ) && ( chars.Query.test( query ) === false ) ) { return false; }
	if ( ( typeof fragment !== 'undefined' ) && ( chars.Fragment.test( fragment ) === false ) ) { return false; }
	return true;
}

FORMATS[ 'uri' ] = function ( Text ) { return check_uri( Text, true, false ); };
FORMATS[ 'uri-reference' ] = function ( Text ) { return check_uri( Text, false, false ); };
FORMATS[ 'iri' ] = function ( Text ) { return check_uri( Text, true, true ); };
FORMATS[ 'iri-reference' ] = function ( Text ) { return check_uri( Text, false, true ); };


//---------------------------------------------------------------------
// URI templates (RFC 6570): literals, and expressions in braces.

const TEMPLATE_OPERATORS = '+#./;?&';
const TEMPLATE_RESERVED = '=,!@|';
const VARSPEC = /^(?:[A-Za-z0-9_]|%[0-9A-Fa-f]{2})+(?:\.(?:[A-Za-z0-9_]|%[0-9A-Fa-f]{2})+)*(?::[1-9][0-9]{0,3}|\*)?$/;

function check_template_expression( Expression )
{
	if ( Expression.length === 0 ) { return false; }
	let body = Expression;
	if ( TEMPLATE_OPERATORS.includes( body[ 0 ] ) ) { body = body.substring( 1 ); }
	else if ( TEMPLATE_RESERVED.includes( body[ 0 ] ) ) { return false; }
	let specs = body.split( ',' );
	for ( let index = 0; index < specs.length; index++ )
	{
		if ( VARSPEC.test( specs[ index ] ) === false ) { return false; }
	}
	return true;
}

function is_template_literal( Character )
{
	let code = Character.codePointAt( 0 );
	if ( ( code <= 0x20 ) || ( code === 0x7F ) ) { return false; }
	return ( '"<>\\^`|{}%'.includes( Character ) === false );
}

FORMATS[ 'uri-template' ] = function ( Text )
{
	let characters = Array.from( Text );
	let index = 0;
	while ( index < characters.length )
	{
		let character = characters[ index ];
		if ( character === '{' )
		{
			let close = characters.indexOf( '}', index + 1 );
			if ( close < 0 ) { return false; }
			if ( check_template_expression( characters.slice( index + 1, close ).join( '' ) ) === false ) { return false; }
			index = close + 1;
			continue;
		}
		if ( character === '%' )
		{
			if ( /^[0-9A-Fa-f]$/.test( characters[ index + 1 ] || '' ) === false ) { return false; }
			if ( /^[0-9A-Fa-f]$/.test( characters[ index + 2 ] || '' ) === false ) { return false; }
			index += 3;
			continue;
		}
		if ( is_template_literal( character ) === false ) { return false; }
		index++;
	}
	return true;
};


//---------------------------------------------------------------------
// Answers true, false, or null for a format this module does not know.
function Check( Format, Text )
{
	if ( Object.prototype.hasOwnProperty.call( FORMATS, Format ) === false ) { return null; }
	return FORMATS[ Format ]( Text );
}


//---------------------------------------------------------------------
module.exports = {
	FORMATS: FORMATS,
	Check: Check,
};
