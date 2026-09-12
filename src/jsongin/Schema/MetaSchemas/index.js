'use strict';

/*
	The meta-schemas of the four drafts the evaluator dispatches to, keyed by the URI a schema
	names in $schema or reaches through $ref. Fetched from json-schema.org on 2026-09-12 and
	vendored so that nothing is fetched at run time, in Node or in the browser bundle.

	A meta-schema serves two purposes here. Its $vocabulary says which keyword vocabularies a
	schema written against it uses, which is how a custom meta-schema can switch one off. And
	a schema may $ref into one, as the suite does, so each has to be resolvable by its URI.
*/

const META_SCHEMAS = {};

META_SCHEMAS[ 'https://json-schema.org/draft/2019-09/meta/applicator' ] = require( './2019-09.applicator.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2019-09/meta/content' ] = require( './2019-09.content.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2019-09/meta/core' ] = require( './2019-09.core.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2019-09/meta/format' ] = require( './2019-09.format.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2019-09/meta/meta-data' ] = require( './2019-09.meta-data.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2019-09/schema' ] = require( './2019-09.schema.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2019-09/meta/validation' ] = require( './2019-09.validation.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/applicator' ] = require( './2020-12.applicator.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/content' ] = require( './2020-12.content.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/core' ] = require( './2020-12.core.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/format-annotation' ] = require( './2020-12.format-annotation.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/format-assertion' ] = require( './2020-12.format-assertion.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/meta-data' ] = require( './2020-12.meta-data.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/schema' ] = require( './2020-12.schema.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/unevaluated' ] = require( './2020-12.unevaluated.json' );
META_SCHEMAS[ 'https://json-schema.org/draft/2020-12/meta/validation' ] = require( './2020-12.validation.json' );
META_SCHEMAS[ 'http://json-schema.org/draft-04/schema' ] = require( './draft-04.schema.json' );
META_SCHEMAS[ 'http://json-schema.org/draft-07/schema' ] = require( './draft-07.schema.json' );

module.exports = META_SCHEMAS;
