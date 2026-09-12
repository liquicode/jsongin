'use strict';

/*
	The JSON Schema functions of the engine.

	A schema here is a JSON Schema as the specification defines it, in any of the drafts
	Dialects.js lists, and the evaluator is measured against the specification's own test
	suite - see build/json-schema-suite.js. Everything is assembled from the engine it is given,
	so that ShortType and the rest are the engine's own, the way every other module under
	src/jsongin/ is built.
*/

module.exports = function ( jsongin )
{
	const Support = require( './Support.js' )( jsongin );
	const Resolve = require( './Resolve.js' )( jsongin, Support );
	const Evaluator = require( './Evaluate.js' )( jsongin, Support, Resolve );
	const InferSchema = require( './InferSchema.js' )( jsongin, Support );
	const InitSchema = require( './InitSchema.js' )( jsongin, Support, Resolve );
	const ProjectSchema = require( './ProjectSchema.js' )( jsongin, Support, Resolve );


	//---------------------------------------------------------------------
	// Validates a document against a schema and returns the findings: the specification's
	// basic output units, one per failed assertion, and an empty array for a valid document.
	function ValidateDocument( Document, Schema, Options )
	{
		let output = Evaluator.Evaluate( Document, Schema, Options );
		return output.Errors;
	}


	//---------------------------------------------------------------------
	return {
		ValidateDocument: ValidateDocument,
		InferSchema: InferSchema,
		InitSchema: InitSchema,
		ProjectSchema: ProjectSchema,
		Support: Support,
		Resolve: Resolve,
		Evaluator: Evaluator,
	};
};
