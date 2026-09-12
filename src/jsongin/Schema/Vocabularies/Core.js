'use strict';

/*
	The core vocabulary: the keywords about the schema itself rather than the instance.

	Most of them do nothing at evaluation time. $id, $anchor and $dynamicAnchor are read when a
	document is indexed (Resolve.js); $schema and $vocabulary decide the keyword table; $defs
	and $comment are containers and notes. They are listed so that the table knows them - a
	keyword the table does not know is ignored, and $defs has to be known for its subschemas to
	be indexed.

	The three references are where the work is. Each resolves a URI to a schema and evaluates
	the instance against it in place, passing the result's errors and annotations up as its
	own, so that to the keywords around it a reference is the schema it points at.

	See Evaluate.js for the shape of Context and of an output.
*/

//---------------------------------------------------------------------
function no_keyword( Context )
{
	return Context.NewOutput();
}


//---------------------------------------------------------------------
// Evaluates the instance against a resolved target and passes the result through.
function follow( Context, Keyword, Instance, Target )
{
	let child = Context.Evaluate( Instance, Target.Schema, [ Keyword ], [], Target );
	let output = Context.NewOutput();
	Context.Merge( output, child, true, child.Valid );
	return output;
}


//---------------------------------------------------------------------
module.exports = {

	id: { Subschemas: null, Priority: 0, Apply: no_keyword },
	schema: { Subschemas: null, Priority: 0, Apply: no_keyword },
	vocabulary: { Subschemas: null, Priority: 0, Apply: no_keyword },
	comment: { Subschemas: null, Priority: 0, Apply: no_keyword },
	defs: { Subschemas: 'map', Priority: 0, Apply: no_keyword },
	anchor: { Subschemas: null, Priority: 0, Apply: no_keyword },
	dynamicAnchor: { Subschemas: null, Priority: 0, Apply: no_keyword },
	recursiveAnchor: { Subschemas: null, Priority: 0, Apply: no_keyword },

	//---------------------------------------------------------------------
	// $ref: the schema at a URI, resolved against the current resource's base.
	ref: {
		Subschemas: null, Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let target = Context.ResolveRef( Value );
			return follow( Context, Keyword, Instance, target );
		},
	},

	//---------------------------------------------------------------------
	// $dynamicRef (2020-12): resolved like $ref first. When that lands on a $dynamicAnchor,
	// the dynamic scope is searched from the outermost resource inward for the first one
	// carrying an anchor of the same name, and that one is used instead. Otherwise it is $ref.
	dynamicRef: {
		Subschemas: null, Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let target = Context.ResolveDynamicRef( Value );
			return follow( Context, Keyword, Instance, target );
		},
	},

	//---------------------------------------------------------------------
	// $recursiveRef (2019-09): the forerunner of $dynamicRef. Resolved like $ref; when the
	// target is a resource root which declares $recursiveAnchor: true, the outermost resource
	// in the dynamic scope which also declares it is used instead.
	recursiveRef: {
		Subschemas: null, Priority: 30,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let target = Context.ResolveRecursiveRef( Value );
			return follow( Context, Keyword, Instance, target );
		},
	},

};
