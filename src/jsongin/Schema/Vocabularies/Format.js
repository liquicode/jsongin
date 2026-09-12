'use strict';

/*
	The format vocabulary, in its two forms.

	By default `format` is an annotation: it names what a string is meant to look like and
	refuses nothing, which is what the specification says a validator does unless asked. The
	format-annotation vocabulary behaves that way, and asserts only when the caller passes
	Options.FormatAssertion. The format-assertion vocabulary, which a meta-schema can select
	instead, always asserts.

	Asserting a format means asking Formats.js whether the string has it. A format Formats.js
	does not know is not refused, since an unknown format is an annotation by definition.
*/

const LIB_FORMATS = require( '../Formats.js' );


//---------------------------------------------------------------------
function assert_format( Context, Keyword, Instance, Value )
{
	let output = Context.NewOutput();
	if ( Context.Type( Instance ) !== 'string' ) { return output; }
	if ( typeof Value !== 'string' ) { return output; }
	let verdict = LIB_FORMATS.Check( Value, Context.Support.AsString( Instance ) );
	if ( verdict === false )
	{
		output.Valid = false;
		output.Errors.push( Context.Error( Keyword, `The string is not a valid [${Value}].` ) );
	}
	return output;
}


//---------------------------------------------------------------------
module.exports = {

	formatAnnotation: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Options.FormatAssertion !== true ) { return Context.NewOutput(); }
			return assert_format( Context, Keyword, Instance, Value );
		},
	},

	formatAssertion: {
		Subschemas: null, Priority: 10,
		Apply: assert_format,
	},

};
