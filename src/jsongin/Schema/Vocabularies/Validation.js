'use strict';

/*
	The validation vocabulary: the keywords which assert something about the instance itself.

	Each applies only to the instance type it is about and passes every other type, which is
	how `minimum: 5` leaves a string alone. A bound which is not a number is ignored rather than
	coerced, so a draft 4 boolean exclusiveMaximum read in a later dialect asserts nothing. Numbers are compared as numbers, strings are
	measured in code points, and equality is JSON equality, where 1 and 1.0 are one value and
	object members have no order. The four draft 4 variants at the end read the boolean
	exclusive bounds that draft had.

	See Evaluate.js for the shape of Context and of an output.
*/


//---------------------------------------------------------------------
function fail( Context, Keyword, Message )
{
	let output = Context.NewOutput();
	output.Valid = false;
	output.Errors.push( Context.Error( Keyword, Message ) );
	return output;
}


//---------------------------------------------------------------------
// Whether a number is a whole multiple of another, within floating point's honesty.
function is_multiple( Instance, Divisor )
{
	if ( Divisor === 0 ) { return false; }
	let quotient = Instance / Divisor;
	// 1e308 / 0.5 overflows to infinity and is a multiple all the same. The remainder is exact
	// where the quotient is not representable, so it decides those.
	if ( Number.isFinite( quotient ) === false ) { return ( ( Instance % Divisor ) === 0 ); }
	if ( Number.isInteger( quotient ) ) { return true; }
	// 0.0075 / 0.0001 is 75.00000000000001 in binary, and is a multiple.
	let nearest = Math.round( quotient );
	return ( Math.abs( quotient - nearest ) < 1e-9 * Math.max( 1, Math.abs( quotient ) ) );
}


//---------------------------------------------------------------------
// Whether a value is one of the JSON type names, or the special `integer`.
function has_type( Context, Instance, Name )
{
	let type = Context.Type( Instance );
	if ( Name === 'integer' ) { return ( type === 'number' ) && Number.isInteger( Instance ); }
	return ( type === Name );
}


//---------------------------------------------------------------------
module.exports = {

	type: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			let names = ( Context.Type( Value ) === 'array' ) ? Value : [ Value ];
			for ( let index = 0; index < names.length; index++ )
			{
				if ( has_type( Context, Instance, names[ index ] ) ) { return Context.NewOutput(); }
			}
			return fail( Context, Keyword, `Expected type [${names.join( ', ' )}] but found [${Context.Type( Instance )}].` );
		},
	},

	enum: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'array' ) { return Context.NewOutput(); }
			for ( let index = 0; index < Value.length; index++ )
			{
				if ( Context.Support.JsonEquals( Instance, Value[ index ] ) ) { return Context.NewOutput(); }
			}
			return fail( Context, Keyword, 'The value is not one of the allowed values.' );
		},
	},

	const: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Support.JsonEquals( Instance, Value ) ) { return Context.NewOutput(); }
			return fail( Context, Keyword, 'The value is not the required value.' );
		},
	},

	//---------------------------------------------------------------------
	// Numbers.

	multipleOf: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'number' ) { return Context.NewOutput(); }
			if ( is_multiple( Instance, Value ) ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The value is not a multiple of [${Value}].` );
		},
	},

	maximum: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'number' ) { return Context.NewOutput(); }
			if ( Instance <= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The value is greater than [${Value}].` );
		},
	},

	exclusiveMaximum: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'number' ) { return Context.NewOutput(); }
			if ( Instance < Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The value is not less than [${Value}].` );
		},
	},

	minimum: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'number' ) { return Context.NewOutput(); }
			if ( Instance >= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The value is less than [${Value}].` );
		},
	},

	exclusiveMinimum: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'number' ) { return Context.NewOutput(); }
			if ( Instance > Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The value is not greater than [${Value}].` );
		},
	},

	// Draft 4 wrote the exclusive bounds as booleans qualifying maximum and minimum.
	maximumDraft4: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value, Schema )
		{
			if ( Context.Type( Instance ) !== 'number' ) { return Context.NewOutput(); }
			if ( Schema.exclusiveMaximum === true )
			{
				if ( Instance < Value ) { return Context.NewOutput(); }
				return fail( Context, Keyword, `The value is not less than [${Value}].` );
			}
			if ( Instance <= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The value is greater than [${Value}].` );
		},
	},

	minimumDraft4: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value, Schema )
		{
			if ( Context.Type( Instance ) !== 'number' ) { return Context.NewOutput(); }
			if ( Schema.exclusiveMinimum === true )
			{
				if ( Instance > Value ) { return Context.NewOutput(); }
				return fail( Context, Keyword, `The value is not greater than [${Value}].` );
			}
			if ( Instance >= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The value is less than [${Value}].` );
		},
	},

	exclusiveMaximumDraft4: { Subschemas: null, Priority: 0, Apply: function ( Context ) { return Context.NewOutput(); } },
	exclusiveMinimumDraft4: { Subschemas: null, Priority: 0, Apply: function ( Context ) { return Context.NewOutput(); } },

	//---------------------------------------------------------------------
	// Strings.

	maxLength: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'string' ) { return Context.NewOutput(); }
			if ( Context.Support.CodePointLength( Context.Support.AsString( Instance ) ) <= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The string is longer than [${Value}].` );
		},
	},

	minLength: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'string' ) { return Context.NewOutput(); }
			if ( Context.Support.CodePointLength( Context.Support.AsString( Instance ) ) >= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The string is shorter than [${Value}].` );
		},
	},

	pattern: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Instance ) !== 'string' ) { return Context.NewOutput(); }
			if ( Context.Support.CompilePattern( Value ).test( Context.Support.AsString( Instance ) ) ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The string does not match the pattern [${Value}].` );
		},
	},

	//---------------------------------------------------------------------
	// Arrays.

	maxItems: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'array' ) { return Context.NewOutput(); }
			if ( Instance.length <= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The array has more than [${Value}] elements.` );
		},
	},

	minItems: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'array' ) { return Context.NewOutput(); }
			if ( Instance.length >= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The array has fewer than [${Value}] elements.` );
		},
	},

	uniqueItems: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Instance ) !== 'array' ) { return Context.NewOutput(); }
			if ( Value !== true ) { return Context.NewOutput(); }
			for ( let index = 0; index < Instance.length; index++ )
			{
				for ( let other = index + 1; other < Instance.length; other++ )
				{
					if ( Context.Support.JsonEquals( Instance[ index ], Instance[ other ] ) )
					{
						return fail( Context, Keyword, `The elements at [${index}] and [${other}] are the same.` );
					}
				}
			}
			return Context.NewOutput();
		},
	},

	// The contains bounds read the count contains left behind, and mean nothing without it.
	maxContains: {
		Subschemas: null, Priority: 22,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'array' ) { return Context.NewOutput(); }
			if ( typeof Local.ContainsCount !== 'number' ) { return Context.NewOutput(); }
			if ( Local.ContainsCount <= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `More than [${Value}] elements match the contains schema.` );
		},
	},

	minContains: {
		Subschemas: null, Priority: 22,
		Apply: function ( Context, Keyword, Instance, Value, Schema, Local )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'array' ) { return Context.NewOutput(); }
			if ( typeof Local.ContainsCount !== 'number' ) { return Context.NewOutput(); }
			if ( Local.ContainsCount >= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `Fewer than [${Value}] elements match the contains schema.` );
		},
	},

	//---------------------------------------------------------------------
	// Objects.

	maxProperties: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'object' ) { return Context.NewOutput(); }
			if ( Context.Support.PropertyNames( Instance ).length <= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The object has more than [${Value}] properties.` );
		},
	},

	minProperties: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Value ) !== 'number' ) { return Context.NewOutput(); }
			if ( Context.Type( Instance ) !== 'object' ) { return Context.NewOutput(); }
			if ( Context.Support.PropertyNames( Instance ).length >= Value ) { return Context.NewOutput(); }
			return fail( Context, Keyword, `The object has fewer than [${Value}] properties.` );
		},
	},

	required: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Instance ) !== 'object' ) { return Context.NewOutput(); }
			if ( Context.Type( Value ) !== 'array' ) { return Context.NewOutput(); }
			let output = Context.NewOutput();
			let present = Context.Support.PropertyNames( Instance );
			for ( let index = 0; index < Value.length; index++ )
			{
				if ( present.includes( Value[ index ] ) ) { continue; }
				output.Valid = false;
				output.Errors.push( Context.Error( Keyword, `The property [${Value[ index ]}] is required.` ) );
			}
			return output;
		},
	},

	dependentRequired: {
		Subschemas: null, Priority: 10,
		Apply: function ( Context, Keyword, Instance, Value )
		{
			if ( Context.Type( Instance ) !== 'object' ) { return Context.NewOutput(); }
			if ( Context.Type( Value ) !== 'object' ) { return Context.NewOutput(); }
			let output = Context.NewOutput();
			let present = Context.Support.PropertyNames( Instance );
			let names = Object.keys( Value );
			for ( let index = 0; index < names.length; index++ )
			{
				if ( present.includes( names[ index ] ) === false ) { continue; }
				let needed = Value[ names[ index ] ];
				if ( Context.Type( needed ) !== 'array' ) { continue; }
				for ( let needed_index = 0; needed_index < needed.length; needed_index++ )
				{
					if ( present.includes( needed[ needed_index ] ) ) { continue; }
					output.Valid = false;
					output.Errors.push( Context.Error( Keyword, `The property [${names[ index ]}] requires the property [${needed[ needed_index ]}].` ) );
				}
			}
			return output;
		},
	},

};
