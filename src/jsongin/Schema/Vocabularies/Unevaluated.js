'use strict';

/*
	The unevaluated vocabulary: the two keywords which apply to whatever nothing else looked
	at.

	They run last in a schema object, after every sibling keyword and every subschema those
	siblings applied to the same instance has reported what it covered. The evaluator keeps the
	running union of those reports in Local.Evaluated, so a member name or an element index not
	in it is unevaluated and gets the schema here. A sibling's subschema which ***failed***
	contributed nothing, because a failed schema's annotations are dropped - which is why an
	anyOf branch which did not match cannot make a property count as seen.

	See Evaluate.js for the shape of Context and of an output.
*/

module.exports = {

	unevaluatedProperties: {
		Subschemas: 'single', Priority: 90,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'object' ) { return output; }
			let seen = Local.Evaluated.Props;
			let present = Context.Support.PropertyNames( Instance );
			for ( let index = 0; index < present.length; index++ )
			{
				let name = present[ index ];
				if ( seen.has( name ) ) { continue; }
				output.Props.add( name );
				let result = Context.Evaluate( Instance[ name ], Value, [ Keyword ], [ name ] );
				Context.Merge( output, result, true, false );
			}
			return output;
		},
	},

	unevaluatedItems: {
		Subschemas: 'single', Priority: 90,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			let output = Context.NewOutput();
			if ( Context.Type( Instance ) !== 'array' ) { return output; }
			if ( Local.Evaluated.AllItems ) { return output; }
			let seen = Local.Evaluated.Items;
			for ( let index = 0; index < Instance.length; index++ )
			{
				if ( seen.has( index ) ) { continue; }
				let result = Context.Evaluate( Instance[ index ], Value, [ Keyword ], [ index ] );
				Context.Merge( output, result, true, false );
			}
			output.AllItems = true;
			return output;
		},
	},

};
