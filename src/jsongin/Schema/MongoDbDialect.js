'use strict';

/*
	What MongoDB's $jsonSchema refuses, checked once before a schema is evaluated.

	MongoDB refuses a schema it cannot use rather than answering: an unknown keyword, a keyword
	from a later draft, a bound which is not a number, an empty `required`. Every refusal here
	was measured on MongoDB 6.0.28, 7.0.40 and 8.3.8 by .plans/tools/jsongin-jsonschema-probe.js
	at the jsonx root, and the parity suite asserts each one. Only ***that*** a schema is refused
	is asserted, never the wording, which is the rule for every rejection in the engine.

	The evaluator calls CheckSchema for a dialect which declares it, so ValidateDocument in the
	MongoDB dialect and the $jsonSchema query operator refuse the same schemas.
*/

// Every alias MongoDB names, whether or not jsongin can produce a value of it, plus `number`,
// which stands for every numeric one. The list is the query $type operator's.
const BSON_ALIASES = [
	'double', 'string', 'object', 'array', 'binData', 'undefined', 'objectId', 'bool', 'date',
	'null', 'regex', 'dbPointer', 'javascript', 'symbol', 'javascriptWithScope', 'int',
	'timestamp', 'long', 'decimal', 'minKey', 'maxKey', 'number',
];

// The type names MongoDB's `type` accepts.
const TYPE_NAMES = [ 'object', 'array', 'number', 'boolean', 'string', 'null' ];

// The keywords the dialect reads, as written -> definition name. Everything else is refused.
const KEYWORDS = {
	'bsonType': 'bsonType', 'type': 'typeMongo', 'enum': 'enum',
	'properties': 'propertiesMongo', 'required': 'requiredMongo',
	'additionalProperties': 'additionalProperties', 'patternProperties': 'patternProperties',
	'minProperties': 'minProperties', 'maxProperties': 'maxProperties', 'dependencies': 'dependencies',
	'items': 'itemsLegacy', 'additionalItems': 'additionalItems',
	'minItems': 'minItems', 'maxItems': 'maxItems', 'uniqueItems': 'uniqueItems',
	'minimum': 'minimumDraft4', 'maximum': 'maximumDraft4',
	'exclusiveMinimum': 'exclusiveMinimumDraft4', 'exclusiveMaximum': 'exclusiveMaximumDraft4',
	'multipleOf': 'multipleOf', 'minLength': 'minLength', 'maxLength': 'maxLength', 'pattern': 'pattern',
	'allOf': 'allOf', 'anyOf': 'anyOf', 'oneOf': 'oneOf', 'not': 'not',
	'title': 'title', 'description': 'description',
};

// Keywords of the draft MongoDB names as not supported, refused apart from an unknown one only
// in what the message says.
const UNSUPPORTED = [ '$ref', '$schema', 'id', 'default', 'format', 'definitions' ];


//---------------------------------------------------------------------
function is_plain_object( Value )
{
	return ( typeof Value === 'object' ) && ( Value !== null ) && ( Array.isArray( Value ) === false ) && ( ( Value instanceof Date ) === false ) && ( ( Value instanceof RegExp ) === false );
}

function is_non_negative_integer( Value )
{
	return ( typeof Value === 'number' ) && Number.isInteger( Value ) && ( Value >= 0 );
}

function has_duplicates( Values, Support )
{
	for ( let index = 0; index < Values.length; index++ )
	{
		for ( let other = index + 1; other < Values.length; other++ )
		{
			if ( Support.JsonEquals( Values[ index ], Values[ other ] ) ) { return true; }
		}
	}
	return false;
}

function is_regex( Pattern )
{
	try
	{
		new RegExp( Pattern );
		return true;
	}
	catch ( error )
	{
		return false;
	}
}


//---------------------------------------------------------------------
// Checks a name list keyword: bsonType and type take a string or a non-empty array of strings,
// each a name the keyword knows.
function check_names( Keyword, Value, Known, Where )
{
	let names = Array.isArray( Value ) ? Value : [ Value ];
	if ( Array.isArray( Value ) && ( Value.length === 0 ) ) { throw new Error( `$jsonSchema keyword [${Keyword}] must name at least one type${Where}.` ); }
	for ( let index = 0; index < names.length; index++ )
	{
		if ( typeof names[ index ] !== 'string' ) { throw new Error( `$jsonSchema keyword [${Keyword}] must be a string or an array of strings${Where}.` ); }
		if ( Known.includes( names[ index ] ) === false ) { throw new Error( `$jsonSchema keyword [${Keyword}] names the unknown type [${names[ index ]}]${Where}.` ); }
	}
}


//---------------------------------------------------------------------
// Throws for a schema MongoDB would refuse.
function CheckSchema( Schema, Support, Pointer )
{
	let where = Pointer ? ` at [${Pointer}]` : '';
	if ( is_plain_object( Schema ) === false )
	{
		if ( Pointer ) { throw new Error( `The nested $jsonSchema schema${where} must be an object.` ); }
		throw new Error( `$jsonSchema must be an object.` );
	}

	let keys = Object.keys( Schema );
	for ( let index = 0; index < keys.length; index++ )
	{
		let key = keys[ index ];
		let value = Schema[ key ];
		let below = ( Pointer || '' ) + '/' + key;
		if ( UNSUPPORTED.includes( key ) ) { throw new Error( `$jsonSchema keyword [${key}] is not supported${where}.` ); }
		if ( Object.prototype.hasOwnProperty.call( KEYWORDS, key ) === false ) { throw new Error( `Unknown $jsonSchema keyword [${key}]${where}.` ); }

		switch ( key )
		{
			case 'bsonType':
				check_names( key, value, BSON_ALIASES, where );
				if ( Object.prototype.hasOwnProperty.call( Schema, 'type' ) ) { throw new Error( `$jsonSchema cannot carry both [type] and [bsonType]${where}.` ); }
				break;
			case 'type':
				check_names( key, value, TYPE_NAMES, where );
				break;
			case 'enum':
				if ( Array.isArray( value ) === false ) { throw new Error( `$jsonSchema keyword [enum] must be an array${where}.` ); }
				if ( value.length === 0 ) { throw new Error( `$jsonSchema keyword [enum] cannot be an empty array${where}.` ); }
				if ( has_duplicates( value, Support ) ) { throw new Error( `$jsonSchema keyword [enum] cannot hold the same value twice${where}.` ); }
				break;
			case 'required':
				if ( Array.isArray( value ) === false ) { throw new Error( `$jsonSchema keyword [required] must be an array${where}.` ); }
				if ( value.length === 0 ) { throw new Error( `$jsonSchema keyword [required] cannot be an empty array${where}.` ); }
				for ( let name_index = 0; name_index < value.length; name_index++ )
				{
					if ( typeof value[ name_index ] !== 'string' ) { throw new Error( `$jsonSchema keyword [required] must be an array of strings${where}.` ); }
				}
				if ( has_duplicates( value, Support ) ) { throw new Error( `$jsonSchema keyword [required] cannot name a property twice${where}.` ); }
				break;
			case 'properties':
			case 'patternProperties':
				if ( is_plain_object( value ) === false ) { throw new Error( `$jsonSchema keyword [${key}] must be an object${where}.` ); }
				{
					let names = Object.keys( value );
					for ( let name_index = 0; name_index < names.length; name_index++ )
					{
						if ( ( key === 'patternProperties' ) && ( is_regex( names[ name_index ] ) === false ) ) { throw new Error( `$jsonSchema keyword [patternProperties] has an invalid regular expression [${names[ name_index ]}]${where}.` ); }
						CheckSchema( value[ names[ name_index ] ], Support, below + '/' + names[ name_index ] );
					}
				}
				break;
			case 'additionalProperties':
			case 'additionalItems':
				if ( typeof value === 'boolean' ) { break; }
				if ( is_plain_object( value ) === false ) { throw new Error( `$jsonSchema keyword [${key}] must be an object or a boolean${where}.` ); }
				CheckSchema( value, Support, below );
				break;
			case 'dependencies':
				if ( is_plain_object( value ) === false ) { throw new Error( `$jsonSchema keyword [dependencies] must be an object${where}.` ); }
				{
					let names = Object.keys( value );
					for ( let name_index = 0; name_index < names.length; name_index++ )
					{
						let dependency = value[ names[ name_index ] ];
						if ( Array.isArray( dependency ) )
						{
							if ( dependency.length === 0 ) { throw new Error( `$jsonSchema keyword [dependencies] cannot hold an empty array for [${names[ name_index ]}]${where}.` ); }
							for ( let element = 0; element < dependency.length; element++ )
							{
								if ( typeof dependency[ element ] !== 'string' ) { throw new Error( `$jsonSchema keyword [dependencies] must list strings for [${names[ name_index ]}]${where}.` ); }
							}
							continue;
						}
						if ( is_plain_object( dependency ) === false ) { throw new Error( `$jsonSchema keyword [dependencies] must hold an object or an array for [${names[ name_index ]}]${where}.` ); }
						CheckSchema( dependency, Support, below + '/' + names[ name_index ] );
					}
				}
				break;
			case 'items':
				if ( Array.isArray( value ) )
				{
					for ( let element = 0; element < value.length; element++ ) { CheckSchema( value[ element ], Support, below + '/' + element ); }
					break;
				}
				if ( is_plain_object( value ) === false ) { throw new Error( `$jsonSchema keyword [items] must be an array or an object${where}.` ); }
				CheckSchema( value, Support, below );
				break;
			case 'allOf':
			case 'anyOf':
			case 'oneOf':
				if ( Array.isArray( value ) === false ) { throw new Error( `$jsonSchema keyword [${key}] must be an array${where}.` ); }
				if ( value.length === 0 ) { throw new Error( `$jsonSchema keyword [${key}] must be a non-empty array${where}.` ); }
				for ( let element = 0; element < value.length; element++ ) { CheckSchema( value[ element ], Support, below + '/' + element ); }
				break;
			case 'not':
				if ( is_plain_object( value ) === false ) { throw new Error( `$jsonSchema keyword [not] must be an object${where}.` ); }
				CheckSchema( value, Support, below );
				break;
			case 'minItems':
			case 'maxItems':
			case 'minLength':
			case 'maxLength':
			case 'minProperties':
			case 'maxProperties':
				if ( is_non_negative_integer( value ) === false ) { throw new Error( `$jsonSchema keyword [${key}] must be a non-negative integer${where}.` ); }
				break;
			case 'minimum':
			case 'maximum':
				if ( typeof value !== 'number' ) { throw new Error( `$jsonSchema keyword [${key}] must be a number${where}.` ); }
				break;
			case 'exclusiveMinimum':
			case 'exclusiveMaximum':
				if ( typeof value !== 'boolean' ) { throw new Error( `$jsonSchema keyword [${key}] must be a boolean${where}.` ); }
				{
					let bound = ( key === 'exclusiveMinimum' ) ? 'minimum' : 'maximum';
					if ( Object.prototype.hasOwnProperty.call( Schema, bound ) === false ) { throw new Error( `$jsonSchema keyword [${bound}] must be present when [${key}] is${where}.` ); }
				}
				break;
			case 'multipleOf':
				if ( typeof value !== 'number' ) { throw new Error( `$jsonSchema keyword [multipleOf] must be a number${where}.` ); }
				if ( value <= 0 ) { throw new Error( `$jsonSchema keyword [multipleOf] must be positive${where}.` ); }
				break;
			case 'pattern':
				if ( typeof value !== 'string' ) { throw new Error( `$jsonSchema keyword [pattern] must be a string${where}.` ); }
				if ( is_regex( value ) === false ) { throw new Error( `$jsonSchema keyword [pattern] is not a valid regular expression${where}.` ); }
				break;
			case 'uniqueItems':
				if ( typeof value !== 'boolean' ) { throw new Error( `$jsonSchema keyword [uniqueItems] must be a boolean${where}.` ); }
				break;
			case 'title':
			case 'description':
				if ( typeof value !== 'string' ) { throw new Error( `$jsonSchema keyword [${key}] must be a string${where}.` ); }
				break;
		}
	}
}


//---------------------------------------------------------------------
// The type of an instance as MongoDB's `type` sees it: a date and a regular expression are
// their own kinds, which no type name reaches, and everything else is its JSON type.
function InstanceType( Value, JsonType )
{
	if ( Value instanceof Date ) { return 'date'; }
	if ( Value instanceof RegExp ) { return 'regex'; }
	return JsonType( Value );
}


//---------------------------------------------------------------------
module.exports = {
	KEYWORDS: KEYWORDS,
	BSON_ALIASES: BSON_ALIASES,
	TYPE_NAMES: TYPE_NAMES,
	CheckSchema: CheckSchema,
	InstanceType: InstanceType,
};
