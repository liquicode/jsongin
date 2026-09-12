'use strict';

/*
	The dialects of JSON Schema the evaluator speaks, and which keyword each one reads.

	A dialect is a draft of the specification. Each one names its keywords by vocabulary, which
	is how the specification groups them from 2019-09 on: a meta-schema's $vocabulary lists the
	vocabularies a schema written against it uses, and a custom meta-schema can leave one out.
	Drafts 4 and 7 have no vocabularies, so each is written here as one.

	A keyword maps to the ***name of a definition*** in Vocabularies/, not to the definition
	itself, because a keyword can mean different things in different drafts: `items` takes an
	array in draft 7 and a single schema in 2020-12, and `exclusiveMaximum` is a boolean in
	draft 4 and a number after it. The definitions are written once each and picked by name.

	The structural rules which are not keywords - which keyword carries the base URI, whether
	a fragment-only $id is an anchor, whether $ref silences its siblings - are flags here, read
	by the resolver and the evaluator.
*/

const LIB_VOCABULARIES = require( './Vocabularies' );
const LIB_MONGODB_DIALECT = require( './MongoDbDialect.js' );


//---------------------------------------------------------------------
// The keyword tables, by vocabulary. A table maps a keyword as written to a definition name.

const CORE_2020 = {
	'$id': 'id', '$schema': 'schema', '$vocabulary': 'vocabulary', '$comment': 'comment',
	'$defs': 'defs', '$anchor': 'anchor', '$dynamicAnchor': 'dynamicAnchor',
	'$ref': 'ref', '$dynamicRef': 'dynamicRef',
};
const CORE_2019 = {
	'$id': 'id', '$schema': 'schema', '$vocabulary': 'vocabulary', '$comment': 'comment',
	'$defs': 'defs', '$anchor': 'anchor', '$recursiveAnchor': 'recursiveAnchor',
	'$ref': 'ref', '$recursiveRef': 'recursiveRef',
};
const APPLICATOR_2020 = {
	'allOf': 'allOf', 'anyOf': 'anyOf', 'oneOf': 'oneOf', 'not': 'not',
	'if': 'if', 'then': 'then', 'else': 'else', 'dependentSchemas': 'dependentSchemas',
	'properties': 'properties', 'patternProperties': 'patternProperties',
	'additionalProperties': 'additionalProperties', 'propertyNames': 'propertyNames',
	'prefixItems': 'prefixItems', 'items': 'items', 'contains': 'contains',
	// Kept from draft 7 for compatibility, as the specification asks; dependentRequired and
	// dependentSchemas are the two halves it was split into.
	'dependencies': 'dependencies',
};
const APPLICATOR_2019 = {
	'allOf': 'allOf', 'anyOf': 'anyOf', 'oneOf': 'oneOf', 'not': 'not',
	'if': 'if', 'then': 'then', 'else': 'else', 'dependentSchemas': 'dependentSchemas',
	'properties': 'properties', 'patternProperties': 'patternProperties',
	'additionalProperties': 'additionalProperties', 'propertyNames': 'propertyNames',
	'items': 'itemsLegacy', 'additionalItems': 'additionalItems', 'contains': 'contains',
	'unevaluatedProperties': 'unevaluatedProperties', 'unevaluatedItems': 'unevaluatedItems',
	'dependencies': 'dependencies',
};
const UNEVALUATED_2020 = {
	'unevaluatedProperties': 'unevaluatedProperties', 'unevaluatedItems': 'unevaluatedItems',
};
const VALIDATION_2019 = {
	'type': 'type', 'enum': 'enum', 'const': 'const',
	'multipleOf': 'multipleOf', 'maximum': 'maximum', 'exclusiveMaximum': 'exclusiveMaximum',
	'minimum': 'minimum', 'exclusiveMinimum': 'exclusiveMinimum',
	'maxLength': 'maxLength', 'minLength': 'minLength', 'pattern': 'pattern',
	'maxItems': 'maxItems', 'minItems': 'minItems', 'uniqueItems': 'uniqueItems',
	'maxContains': 'maxContains', 'minContains': 'minContains',
	'maxProperties': 'maxProperties', 'minProperties': 'minProperties',
	'required': 'required', 'dependentRequired': 'dependentRequired',
};
const META_DATA = {
	'title': 'title', 'description': 'description', 'default': 'default', 'deprecated': 'deprecated',
	'readOnly': 'readOnly', 'writeOnly': 'writeOnly', 'examples': 'examples',
};
const FORMAT_ANNOTATION = { 'format': 'formatAnnotation' };
const FORMAT_ASSERTION = { 'format': 'formatAssertion' };
const CONTENT = { 'contentEncoding': 'contentEncoding', 'contentMediaType': 'contentMediaType', 'contentSchema': 'contentSchema' };

// Draft 7 and draft 4 are each one table. Draft 7 keeps the 2019-09 shape without the
// vocabularies, the dependent keywords, and the unevaluated pair; draft 4 also has no
// const, contains, propertyNames, if/then/else or examples, and its exclusive bounds are
// booleans which qualify maximum and minimum.
const DRAFT_07 = {
	'$id': 'id', '$schema': 'schema', '$comment': 'comment', 'definitions': 'defs', '$ref': 'ref',
	'allOf': 'allOf', 'anyOf': 'anyOf', 'oneOf': 'oneOf', 'not': 'not',
	'if': 'if', 'then': 'then', 'else': 'else', 'dependencies': 'dependencies',
	'properties': 'properties', 'patternProperties': 'patternProperties',
	'additionalProperties': 'additionalProperties', 'propertyNames': 'propertyNames',
	'items': 'itemsLegacy', 'additionalItems': 'additionalItems', 'contains': 'contains',
	'type': 'type', 'enum': 'enum', 'const': 'const',
	'multipleOf': 'multipleOf', 'maximum': 'maximum', 'exclusiveMaximum': 'exclusiveMaximum',
	'minimum': 'minimum', 'exclusiveMinimum': 'exclusiveMinimum',
	'maxLength': 'maxLength', 'minLength': 'minLength', 'pattern': 'pattern',
	'maxItems': 'maxItems', 'minItems': 'minItems', 'uniqueItems': 'uniqueItems',
	'maxProperties': 'maxProperties', 'minProperties': 'minProperties', 'required': 'required',
	'title': 'title', 'description': 'description', 'default': 'default',
	'readOnly': 'readOnly', 'writeOnly': 'writeOnly', 'examples': 'examples',
	'format': 'formatAnnotation',
	// Draft 7 let the content keywords assert, and the suite's optional cases ask them to.
	'contentEncoding': 'contentEncodingDraft7', 'contentMediaType': 'contentMediaTypeDraft7',
};
const DRAFT_04 = {
	'id': 'id', '$schema': 'schema', 'definitions': 'defs', '$ref': 'ref',
	'allOf': 'allOf', 'anyOf': 'anyOf', 'oneOf': 'oneOf', 'not': 'not', 'dependencies': 'dependencies',
	'properties': 'properties', 'patternProperties': 'patternProperties',
	'additionalProperties': 'additionalProperties',
	'items': 'itemsLegacy', 'additionalItems': 'additionalItems',
	'type': 'type', 'enum': 'enum',
	'multipleOf': 'multipleOf', 'maximum': 'maximumDraft4', 'exclusiveMaximum': 'exclusiveMaximumDraft4',
	'minimum': 'minimumDraft4', 'exclusiveMinimum': 'exclusiveMinimumDraft4',
	'maxLength': 'maxLength', 'minLength': 'minLength', 'pattern': 'pattern',
	'maxItems': 'maxItems', 'minItems': 'minItems', 'uniqueItems': 'uniqueItems',
	'maxProperties': 'maxProperties', 'minProperties': 'minProperties', 'required': 'required',
	'title': 'title', 'description': 'description', 'default': 'default',
	'format': 'formatAnnotation',
};


//---------------------------------------------------------------------
// The dialects.
//
//	Name              what the Dialect option is given, and what the suite folder maps to.
//	MetaSchema        the URI of the meta-schema; a schema whose $schema names it is in this
//	                  dialect. Written without a trailing '#', and matched that way.
//	IdKeyword         which keyword carries a resource's base URI.
//	AnchorInId        whether a fragment-only $id ("#name") declares an anchor, as in draft 7
//	                  and draft 4. From 2019-09 on an anchor is its own keyword.
//	RefIgnoresSiblings  whether a $ref silences every keyword beside it, as in draft 7 and 4.
//	Vocabularies      the vocabularies the dialect reads by default, each with the URI its
//	                  meta-schema's $vocabulary uses to name it and the keyword table it adds.
//	                  A meta-schema which lists vocabularies replaces this default with its own
//	                  selection; one which lists none keeps it.
const DIALECTS = [
	{
		Name: '2020-12',
		MetaSchema: 'https://json-schema.org/draft/2020-12/schema',
		IdKeyword: '$id',
		AnchorInId: false,
		RefIgnoresSiblings: false,
		Vocabularies: [
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/core', Keywords: CORE_2020, Default: true },
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/applicator', Keywords: APPLICATOR_2020, Default: true },
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/unevaluated', Keywords: UNEVALUATED_2020, Default: true },
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/validation', Keywords: VALIDATION_2019, Default: true },
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/meta-data', Keywords: META_DATA, Default: true },
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/format-annotation', Keywords: FORMAT_ANNOTATION, Default: true },
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/format-assertion', Keywords: FORMAT_ASSERTION, Default: false },
			{ Uri: 'https://json-schema.org/draft/2020-12/vocab/content', Keywords: CONTENT, Default: true },
		],
	},
	{
		Name: '2019-09',
		MetaSchema: 'https://json-schema.org/draft/2019-09/schema',
		IdKeyword: '$id',
		AnchorInId: false,
		RefIgnoresSiblings: false,
		Vocabularies: [
			{ Uri: 'https://json-schema.org/draft/2019-09/vocab/core', Keywords: CORE_2019, Default: true },
			{ Uri: 'https://json-schema.org/draft/2019-09/vocab/applicator', Keywords: APPLICATOR_2019, Default: true },
			{ Uri: 'https://json-schema.org/draft/2019-09/vocab/validation', Keywords: VALIDATION_2019, Default: true },
			{ Uri: 'https://json-schema.org/draft/2019-09/vocab/meta-data', Keywords: META_DATA, Default: true },
			{ Uri: 'https://json-schema.org/draft/2019-09/vocab/format', Keywords: FORMAT_ANNOTATION, Default: true },
			{ Uri: 'https://json-schema.org/draft/2019-09/vocab/content', Keywords: CONTENT, Default: true },
		],
	},
	{
		Name: 'draft-07',
		MetaSchema: 'http://json-schema.org/draft-07/schema',
		IdKeyword: '$id',
		AnchorInId: true,
		RefIgnoresSiblings: true,
		Vocabularies: [
			{ Uri: null, Keywords: DRAFT_07, Default: true },
		],
	},
	{
		Name: 'draft-04',
		MetaSchema: 'http://json-schema.org/draft-04/schema',
		IdKeyword: 'id',
		AnchorInId: true,
		RefIgnoresSiblings: true,
		Vocabularies: [
			{ Uri: null, Keywords: DRAFT_04, Default: true },
		],
	},
	{
		// MongoDB's $jsonSchema: draft 4 with bsonType, no references, and a refusal for anything
		// it does not read. Strict says an unknown keyword is refused rather than ignored;
		// RootMustBeObject says a document which is not an object never matches, which is what
		// an element inside $elemMatch meets; CheckSchema is run once before evaluation; and
		// InstanceType reads a date and a regular expression as their own kinds rather than as
		// strings. It has no meta-schema, so nothing selects it but the Dialect option.
		Name: 'mongodb',
		MetaSchema: null,
		IdKeyword: null,
		AnchorInId: false,
		RefIgnoresSiblings: false,
		Strict: true,
		RootMustBeObject: true,
		CheckSchema: LIB_MONGODB_DIALECT.CheckSchema,
		InstanceType: LIB_MONGODB_DIALECT.InstanceType,
		Vocabularies: [
			{ Uri: null, Keywords: LIB_MONGODB_DIALECT.KEYWORDS, Default: true },
		],
	},
];

const DEFAULT_DIALECT = '2020-12';


//---------------------------------------------------------------------
// Strips the empty fragment a meta-schema URI is often written with.
function normalize_uri( Uri )
{
	if ( typeof Uri !== 'string' ) { return Uri; }
	if ( Uri.endsWith( '#' ) ) { return Uri.substring( 0, Uri.length - 1 ); }
	return Uri;
}


//---------------------------------------------------------------------
// Finds a dialect by its Name or by its meta-schema URI. Returns null for a name it does not
// know, so the caller can say what it was asked for.
function FindDialect( NameOrUri )
{
	let wanted = normalize_uri( NameOrUri );
	for ( let index = 0; index < DIALECTS.length; index++ )
	{
		if ( DIALECTS[ index ].Name === wanted ) { return DIALECTS[ index ]; }
		if ( DIALECTS[ index ].MetaSchema === wanted ) { return DIALECTS[ index ]; }
	}
	return null;
}


//---------------------------------------------------------------------
// Builds the keyword table a schema is read with: keyword as written -> definition, in the
// order the definitions are to be applied.
//
// VocabularyUris is the $vocabulary map of the schema's meta-schema, or null when it has
// none, in which case the dialect's defaults are used. A vocabulary the map names which this
// dialect does not know is refused when the map says it is required (true) and skipped when
// it says it is optional (false), which is what the specification asks of an implementation.
function KeywordTable( Dialect, VocabularyUris )
{
	let selected = [];
	if ( VocabularyUris === null )
	{
		for ( let index = 0; index < Dialect.Vocabularies.length; index++ )
		{
			if ( Dialect.Vocabularies[ index ].Default ) { selected.push( Dialect.Vocabularies[ index ] ); }
		}
	}
	else
	{
		let uris = Object.keys( VocabularyUris );
		for ( let index = 0; index < uris.length; index++ )
		{
			let uri = normalize_uri( uris[ index ] );
			let found = null;
			for ( let vocabulary_index = 0; vocabulary_index < Dialect.Vocabularies.length; vocabulary_index++ )
			{
				if ( Dialect.Vocabularies[ vocabulary_index ].Uri === uri ) { found = Dialect.Vocabularies[ vocabulary_index ]; }
			}
			if ( found === null )
			{
				if ( VocabularyUris[ uris[ index ] ] === true ) { throw new Error( `The vocabulary [${uri}] is required and not known.` ); }
				continue;
			}
			selected.push( found );
		}
	}

	let table = {};
	for ( let index = 0; index < selected.length; index++ )
	{
		let keywords = selected[ index ].Keywords;
		let names = Object.keys( keywords );
		for ( let name_index = 0; name_index < names.length; name_index++ )
		{
			let definition = LIB_VOCABULARIES[ keywords[ names[ name_index ] ] ];
			if ( !definition ) { throw new Error( `No definition for keyword [${names[ name_index ]}] as [${keywords[ names[ name_index ] ]}].` ); }
			table[ names[ name_index ] ] = definition;
		}
	}

	// The evaluation order is the definitions' Priority: the validation keywords first, the
	// references and applicators next, and the unevaluated pair last, which has to see every
	// other keyword's annotations. Within a priority the order is the table's own.
	let ordered = Object.keys( table );
	ordered.sort( function ( A, B ) { return table[ A ].Priority - table[ B ].Priority; } );
	let result = { Order: ordered, Definitions: table };
	return result;
}


//---------------------------------------------------------------------
module.exports = {
	DIALECTS: DIALECTS,
	DEFAULT_DIALECT: DEFAULT_DIALECT,
	FindDialect: FindDialect,
	KeywordTable: KeywordTable,
	NormalizeUri: normalize_uri,
};
