'use strict';

/*
	The meta-data vocabulary: annotations for a reader, asserting nothing. They are listed so
	that the keyword table knows them; `default` is also what InitSchema reads.
*/

function no_keyword( Context )
{
	return Context.NewOutput();
}

module.exports = {
	title: { Subschemas: null, Priority: 0, Apply: no_keyword },
	description: { Subschemas: null, Priority: 0, Apply: no_keyword },
	default: { Subschemas: null, Priority: 0, Apply: no_keyword },
	deprecated: { Subschemas: null, Priority: 0, Apply: no_keyword },
	readOnly: { Subschemas: null, Priority: 0, Apply: no_keyword },
	writeOnly: { Subschemas: null, Priority: 0, Apply: no_keyword },
	examples: { Subschemas: null, Priority: 0, Apply: no_keyword },
};
