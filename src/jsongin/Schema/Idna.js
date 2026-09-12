'use strict';

/*
	Host names, internationalized host names, and the Punycode they are carried in.

	A host name (RFC 1123) is ASCII labels of letters, digits and hyphens, each 1 to 63 long,
	joined by dots, 253 at most in all. An internationalized host name (RFC 5890 to 5893) may
	write a label in Unicode, a ***U-label***, or as that label's Punycode with an `xn--`
	prefix, an ***A-label***, and either way the label's code points have to be ones IDNA
	allows, in the positions it allows them, and a name which mixes writing directions has to
	obey the Bidi rule.

	The code point rules here are an approximation of RFC 5892's tables built from the Unicode
	general categories the specification derives them from, with the exceptions it lists by
	hand, and the contextual rules it spells out. The Bidi rule is RFC 5893's six rules with the
	bidirectional classes approximated from scripts and known ranges. Both are measured against
	the test suite's optional format cases, which is where the approximation is held honest.
*/

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const MAX_INT = 2147483647;


//---------------------------------------------------------------------
// Punycode (RFC 3492).

function adapt( Delta, NumPoints, FirstTime )
{
	let delta = FirstTime ? Math.floor( Delta / DAMP ) : ( Delta >> 1 );
	delta += Math.floor( delta / NumPoints );
	let k = 0;
	while ( delta > ( ( ( BASE - T_MIN ) * T_MAX ) >> 1 ) )
	{
		delta = Math.floor( delta / ( BASE - T_MIN ) );
		k += BASE;
	}
	return Math.floor( k + ( ( BASE - T_MIN + 1 ) * delta ) / ( delta + SKEW ) );
}

function basic_to_digit( Code )
{
	if ( ( Code >= 0x30 ) && ( Code <= 0x39 ) ) { return Code - 0x30 + 26; }
	if ( ( Code >= 0x41 ) && ( Code <= 0x5A ) ) { return Code - 0x41; }
	if ( ( Code >= 0x61 ) && ( Code <= 0x7A ) ) { return Code - 0x61; }
	return BASE;
}

function digit_to_basic( Digit )
{
	if ( Digit < 26 ) { return String.fromCharCode( 0x61 + Digit ); }
	return String.fromCharCode( 0x30 + Digit - 26 );
}

// Decodes a Punycode body (the part after `xn--`) to code points, or null when it is not one.
function DecodePunycode( Text )
{
	let output = [];
	let basic = Text.lastIndexOf( '-' );
	if ( basic < 0 ) { basic = 0; }
	for ( let index = 0; index < basic; index++ )
	{
		let code = Text.charCodeAt( index );
		if ( code >= 0x80 ) { return null; }
		output.push( code );
	}
	let n = INITIAL_N;
	let bias = INITIAL_BIAS;
	let i = 0;
	let index = ( basic > 0 ) ? ( basic + 1 ) : 0;
	while ( index < Text.length )
	{
		let old_i = i;
		let w = 1;
		for ( let k = BASE; ; k += BASE )
		{
			if ( index >= Text.length ) { return null; }
			let digit = basic_to_digit( Text.charCodeAt( index++ ) );
			if ( digit >= BASE ) { return null; }
			if ( digit > Math.floor( ( MAX_INT - i ) / w ) ) { return null; }
			i += digit * w;
			let t = ( k <= bias ) ? T_MIN : ( ( k >= bias + T_MAX ) ? T_MAX : ( k - bias ) );
			if ( digit < t ) { break; }
			if ( w > Math.floor( MAX_INT / ( BASE - t ) ) ) { return null; }
			w *= ( BASE - t );
		}
		let out = output.length + 1;
		bias = adapt( i - old_i, out, ( old_i === 0 ) );
		if ( Math.floor( i / out ) > ( MAX_INT - n ) ) { return null; }
		n += Math.floor( i / out );
		i %= out;
		if ( n > 0x10FFFF ) { return null; }
		output.splice( i++, 0, n );
	}
	return output;
}

// Encodes code points to a Punycode body, or null on overflow.
function EncodePunycode( CodePoints )
{
	let output = [];
	for ( let index = 0; index < CodePoints.length; index++ )
	{
		if ( CodePoints[ index ] < 0x80 ) { output.push( String.fromCharCode( CodePoints[ index ] ) ); }
	}
	let basic_length = output.length;
	let handled = basic_length;
	if ( basic_length > 0 ) { output.push( '-' ); }
	let n = INITIAL_N;
	let delta = 0;
	let bias = INITIAL_BIAS;
	while ( handled < CodePoints.length )
	{
		let m = MAX_INT;
		for ( let index = 0; index < CodePoints.length; index++ )
		{
			if ( ( CodePoints[ index ] >= n ) && ( CodePoints[ index ] < m ) ) { m = CodePoints[ index ]; }
		}
		if ( ( m - n ) > Math.floor( ( MAX_INT - delta ) / ( handled + 1 ) ) ) { return null; }
		delta += ( m - n ) * ( handled + 1 );
		n = m;
		for ( let index = 0; index < CodePoints.length; index++ )
		{
			let value = CodePoints[ index ];
			if ( value < n )
			{
				delta++;
				if ( delta > MAX_INT ) { return null; }
			}
			if ( value === n )
			{
				let q = delta;
				for ( let k = BASE; ; k += BASE )
				{
					let t = ( k <= bias ) ? T_MIN : ( ( k >= bias + T_MAX ) ? T_MAX : ( k - bias ) );
					if ( q < t ) { break; }
					output.push( digit_to_basic( t + ( ( q - t ) % ( BASE - t ) ) ) );
					q = Math.floor( ( q - t ) / ( BASE - t ) );
				}
				output.push( digit_to_basic( q ) );
				bias = adapt( delta, handled + 1, ( handled === basic_length ) );
				delta = 0;
				handled++;
			}
		}
		delta++;
		n++;
	}
	return output.join( '' );
}


//---------------------------------------------------------------------
// Code point rules (RFC 5892).

// Listed by the specification as DISALLOWED although their category would allow them.
const DISALLOWED_EXCEPTIONS = new Set( [ 0x0640, 0x07FA, 0x302E, 0x302F, 0x3031, 0x3032, 0x3033, 0x3034, 0x3035, 0x303B ] );
// Listed as PVALID although their category would not allow them.
const PVALID_EXCEPTIONS = new Set( [ 0x00DF, 0x03C2, 0x06FD, 0x06FE, 0x0F0B, 0x3007 ] );
// Allowed only in a context the rules below check.
const CONTEXT_O = new Set( [ 0x00B7, 0x0375, 0x05F3, 0x05F4, 0x30FB ] );
const ZWNJ = 0x200C;
const ZWJ = 0x200D;

// The code points with canonical combining class 9, a virama, for the joiner rules.
const VIRAMAS = new Set( [
	0x094D, 0x09CD, 0x0A4D, 0x0ACD, 0x0B4D, 0x0BCD, 0x0C4D, 0x0CCD, 0x0D3B, 0x0D3C, 0x0D4D, 0x0DCA,
	0x0E3A, 0x0EBA, 0x0F84, 0x1039, 0x103A, 0x1714, 0x1715, 0x1734, 0x17D2, 0x1A60, 0x1B44, 0x1BAA,
	0x1BAB, 0x1BF2, 0x1BF3, 0x2D7F, 0xA806, 0xA82C, 0xA8C4, 0xA953, 0xA9C0, 0xAAF6, 0xABED, 0x10A3F,
	0x11046, 0x1107F, 0x110B9, 0x11133, 0x11134, 0x111C0, 0x11235, 0x112EA, 0x1134D, 0x11442, 0x114C2,
	0x115BF, 0x1163F, 0x116B6, 0x1172B, 0x11839, 0x1193D, 0x1193E, 0x119E0, 0x11A34, 0x11A47, 0x11A99,
	0x11C3F, 0x11D44, 0x11D45, 0x11D97,
] );

const LETTER_CATEGORIES = /^[\p{Ll}\p{Lo}\p{Lm}\p{Mn}\p{Mc}\p{Nd}]$/u;
const MARK = /^\p{M}$/u;
const GREEK = /^\p{Script=Greek}$/u;
const HEBREW = /^\p{Script=Hebrew}$/u;
const JAPANESE_OR_HAN = /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]$/u;
const ARABIC_LETTER = /^[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]$/u;

// Whether one code point may appear in a U-label at all. Contextual ones are allowed here and
// checked in place by check_context.
function is_allowed( CodePoint )
{
	if ( CodePoint < 0x80 )
	{
		return ( ( CodePoint >= 0x61 ) && ( CodePoint <= 0x7A ) ) || ( ( CodePoint >= 0x30 ) && ( CodePoint <= 0x39 ) ) || ( CodePoint === 0x2D );
	}
	if ( DISALLOWED_EXCEPTIONS.has( CodePoint ) ) { return false; }
	if ( PVALID_EXCEPTIONS.has( CodePoint ) ) { return true; }
	if ( CONTEXT_O.has( CodePoint ) ) { return true; }
	if ( ( CodePoint === ZWNJ ) || ( CodePoint === ZWJ ) ) { return true; }
	return LETTER_CATEGORIES.test( String.fromCodePoint( CodePoint ) );
}

function is_arabic_indic_digit( CodePoint ) { return ( CodePoint >= 0x0660 ) && ( CodePoint <= 0x0669 ); }
function is_extended_arabic_indic_digit( CodePoint ) { return ( CodePoint >= 0x06F0 ) && ( CodePoint <= 0x06F9 ); }

// The contextual rules, for one position in a label.
function check_context( Points, Index )
{
	let point = Points[ Index ];
	let before = ( Index > 0 ) ? Points[ Index - 1 ] : null;
	let after = ( Index + 1 < Points.length ) ? Points[ Index + 1 ] : null;
	switch ( point )
	{
		case 0x00B7: // MIDDLE DOT, between two l's.
			return ( before === 0x6C ) && ( after === 0x6C );
		case 0x0375: // GREEK LOWER NUMERAL SIGN, followed by Greek.
			return ( after !== null ) && GREEK.test( String.fromCodePoint( after ) );
		case 0x05F3: // HEBREW PUNCTUATION GERESH, preceded by Hebrew.
		case 0x05F4: // HEBREW PUNCTUATION GERSHAYIM, preceded by Hebrew.
			return ( before !== null ) && HEBREW.test( String.fromCodePoint( before ) );
		case 0x30FB: // KATAKANA MIDDLE DOT, with Hiragana, Katakana or Han somewhere in the label.
			for ( let index = 0; index < Points.length; index++ )
			{
				if ( JAPANESE_OR_HAN.test( String.fromCodePoint( Points[ index ] ) ) ) { return true; }
			}
			return false;
		case ZWJ: // ZERO WIDTH JOINER, preceded by a virama.
			return ( before !== null ) && VIRAMAS.has( before );
		case ZWNJ: // ZERO WIDTH NON-JOINER, preceded by a virama, or joining letters on both sides.
			if ( ( before !== null ) && VIRAMAS.has( before ) ) { return true; }
			{
				let left = Index - 1;
				while ( ( left >= 0 ) && MARK.test( String.fromCodePoint( Points[ left ] ) ) ) { left--; }
				let right = Index + 1;
				while ( ( right < Points.length ) && MARK.test( String.fromCodePoint( Points[ right ] ) ) ) { right++; }
				if ( ( left < 0 ) || ( right >= Points.length ) ) { return false; }
				return ARABIC_LETTER.test( String.fromCodePoint( Points[ left ] ) ) && ARABIC_LETTER.test( String.fromCodePoint( Points[ right ] ) );
			}
	}
	return true;
}


//---------------------------------------------------------------------
// The Bidi rule (RFC 5893), with the bidirectional classes approximated.

const RTL_LETTER = /^[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}]$/u;
const LETTER = /^\p{L}$/u;
const NONSPACING = /^[\p{Mn}\p{Me}]$/u;
const EUROPEAN_DIGIT = /^[0-9۰-۹²³¹⁰⁴-⁹₀-₉]$/u;

function bidi_class( CodePoint )
{
	let character = String.fromCodePoint( CodePoint );
	if ( is_arabic_indic_digit( CodePoint ) ) { return 'AN'; }
	if ( EUROPEAN_DIGIT.test( character ) ) { return 'EN'; }
	if ( NONSPACING.test( character ) ) { return 'NSM'; }
	if ( ( CodePoint === ZWJ ) || ( CodePoint === ZWNJ ) ) { return 'BN'; }
	if ( RTL_LETTER.test( character ) ) { return LETTER.test( character ) ? 'R' : 'NSM'; }
	if ( LETTER.test( character ) ) { return 'L'; }
	if ( /^\p{Mc}$/u.test( character ) ) { return 'L'; }
	if ( ( CodePoint === 0x2B ) || ( CodePoint === 0x2D ) ) { return 'ES'; }
	if ( /^[#$%¢-¥°±٪₠-⃏‰-‴℮∓]$/u.test( character ) ) { return 'ET'; }
	if ( /^[,.:/ ، ⁄﹐﹒﹕，．：]$/u.test( character ) ) { return 'CS'; }
	return 'ON';
}

// Whether any label makes this a Bidi domain name.
function is_bidi_name( Labels )
{
	for ( let index = 0; index < Labels.length; index++ )
	{
		let points = Labels[ index ];
		for ( let point_index = 0; point_index < points.length; point_index++ )
		{
			let bidi = bidi_class( points[ point_index ] );
			if ( ( bidi === 'R' ) || ( bidi === 'AN' ) ) { return true; }
		}
	}
	return false;
}

// The six rules for one label of a Bidi domain name.
function check_bidi_label( Points )
{
	if ( Points.length === 0 ) { return false; }
	let classes = [];
	for ( let index = 0; index < Points.length; index++ ) { classes.push( bidi_class( Points[ index ] ) ); }

	let first = classes[ 0 ];
	if ( ( first !== 'L' ) && ( first !== 'R' ) ) { return false; }

	let last = classes.length - 1;
	while ( ( last > 0 ) && ( classes[ last ] === 'NSM' ) ) { last--; }

	if ( first === 'R' )
	{
		let has_en = false;
		let has_an = false;
		for ( let index = 0; index < classes.length; index++ )
		{
			if ( classes[ index ] === 'L' ) { return false; }
			if ( classes[ index ] === 'EN' ) { has_en = true; }
			if ( classes[ index ] === 'AN' ) { has_an = true; }
		}
		if ( has_en && has_an ) { return false; }
		return [ 'R', 'EN', 'AN' ].includes( classes[ last ] );
	}

	for ( let index = 0; index < classes.length; index++ )
	{
		if ( ( classes[ index ] === 'R' ) || ( classes[ index ] === 'AN' ) ) { return false; }
	}
	return [ 'L', 'EN' ].includes( classes[ last ] );
}


//---------------------------------------------------------------------
// Labels.

// The rules for a U-label given as code points: allowed code points in allowed places, no
// leading mark, hyphens where a label may have them, and the A-label form no longer than 63.
function check_u_label( Points )
{
	if ( Points.length === 0 ) { return false; }
	if ( MARK.test( String.fromCodePoint( Points[ 0 ] ) ) ) { return false; }
	if ( ( Points[ 0 ] === 0x2D ) || ( Points[ Points.length - 1 ] === 0x2D ) ) { return false; }
	let has_non_ascii = false;
	for ( let index = 0; index < Points.length; index++ )
	{
		if ( Points[ index ] >= 0x80 ) { has_non_ascii = true; }
	}
	// Hyphens in the third and fourth position are reserved for the xn-- prefix, so a Unicode
	// label may not have them. An ASCII label may: RFC 1123 has no such rule, and ab--cd is a
	// host name.
	if ( has_non_ascii && ( Points.length >= 4 ) && ( Points[ 2 ] === 0x2D ) && ( Points[ 3 ] === 0x2D ) ) { return false; }
	let has_arabic_indic = false;
	let has_extended_arabic_indic = false;
	for ( let index = 0; index < Points.length; index++ )
	{
		let point = Points[ index ];
		if ( is_allowed( point ) === false ) { return false; }
		if ( check_context( Points, index ) === false ) { return false; }
		if ( is_arabic_indic_digit( point ) ) { has_arabic_indic = true; }
		if ( is_extended_arabic_indic_digit( point ) ) { has_extended_arabic_indic = true; }
	}
	if ( has_arabic_indic && has_extended_arabic_indic ) { return false; }
	if ( has_non_ascii )
	{
		let encoded = EncodePunycode( Points );
		if ( ( encoded === null ) || ( ( encoded.length + 4 ) > 63 ) ) { return false; }
	}
	else if ( Points.length > 63 )
	{
		return false;
	}
	return true;
}

// Decodes an A-label (already lowercased, with its xn-- prefix) to the code points of its
// U-label, or null when it is not a valid A-label: not Punycode, not canonical, or all ASCII.
function decode_a_label( Label )
{
	let body = Label.substring( 4 );
	if ( body.length === 0 ) { return null; }
	let points = DecodePunycode( body );
	if ( points === null ) { return null; }
	let has_non_ascii = false;
	for ( let index = 0; index < points.length; index++ )
	{
		if ( points[ index ] >= 0x80 ) { has_non_ascii = true; }
	}
	if ( has_non_ascii === false ) { return null; }
	if ( EncodePunycode( points ) !== body.toLowerCase() ) { return null; }
	return points;
}

// Code points of a string.
function to_points( Text )
{
	let points = [];
	for ( const character of Text ) { points.push( character.codePointAt( 0 ) ); }
	return points;
}


//---------------------------------------------------------------------
// Maps an internationalized host name the way UTS 46 does before validation, approximately:
// default-ignorable code points are dropped, compatibility forms are folded and the name is
// lowercased, and every label separator becomes a dot.
const IGNORABLE = /[­͏؜᠋-᠍​⁠-⁤︀-️﻿]/gu;
const SEPARATORS = /[。．｡]/gu;

function map_name( Text )
{
	let mapped = Text.replace( IGNORABLE, '' );
	mapped = mapped.normalize( 'NFKC' ).toLowerCase();
	mapped = mapped.replace( SEPARATORS, '.' );
	return mapped;
}


//---------------------------------------------------------------------
// Whether Text is a host name. Internationalized says whether Unicode labels are allowed; a
// plain host name is ASCII only, but its xn-- labels are still checked as A-labels.
function CheckHostname( Text, Internationalized )
{
	if ( typeof Text !== 'string' ) { return false; }
	let name = Text;
	if ( Internationalized )
	{
		name = map_name( name );
	}
	else
	{
		if ( /^[\x21-\x7E]*$/.test( name ) === false ) { return false; }
		name = name.toLowerCase();
	}
	if ( name.length === 0 ) { return false; }

	let labels = name.split( '.' );
	let decoded_labels = [];
	let total_length = 0;
	for ( let index = 0; index < labels.length; index++ )
	{
		let label = labels[ index ];
		if ( label.length === 0 ) { return false; }
		let points = null;
		if ( label.startsWith( 'xn--' ) )
		{
			if ( /^[a-z0-9-]+$/.test( label ) === false ) { return false; }
			if ( label.length > 63 ) { return false; }
			points = decode_a_label( label );
			if ( points === null ) { return false; }
			total_length += label.length;
		}
		else
		{
			points = to_points( label );
			let has_non_ascii = false;
			for ( let point_index = 0; point_index < points.length; point_index++ )
			{
				if ( points[ point_index ] >= 0x80 ) { has_non_ascii = true; }
			}
			if ( has_non_ascii )
			{
				if ( Internationalized === false ) { return false; }
				let encoded = EncodePunycode( points );
				total_length += ( encoded === null ) ? 64 : ( encoded.length + 4 );
			}
			else
			{
				total_length += label.length;
			}
		}
		if ( check_u_label( points ) === false ) { return false; }
		decoded_labels.push( points );
	}
	total_length += labels.length - 1;
	if ( total_length > 253 ) { return false; }

	if ( is_bidi_name( decoded_labels ) )
	{
		for ( let index = 0; index < decoded_labels.length; index++ )
		{
			if ( check_bidi_label( decoded_labels[ index ] ) === false ) { return false; }
		}
	}
	return true;
}


//---------------------------------------------------------------------
module.exports = {
	DecodePunycode: DecodePunycode,
	EncodePunycode: EncodePunycode,
	CheckHostname: CheckHostname,
};
