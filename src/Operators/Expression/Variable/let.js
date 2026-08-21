'use strict';
/*md

## Operators > Expression > $let

Usage: `$let: { vars: { name: expression, ... }, in: expression }`

Binds one or more variables and evaluates a sub-expression with them in scope.
The bound variables are read as `$$name` within `in`, and nowhere else.

***A variable name begins with a lowercase letter.*** Names beginning with an uppercase letter
  are reserved for the system variables, so a bound variable can never shadow `$$ROOT` and a
  misspelled `$$Total` is refused rather than silently read as missing.

The characters after the first are letters, digits, and underscores. ***The first character
  and the rest follow different rules***: an underscore is refused as the first character and
  accepted after it, so `a_b` is a name and `_ab` is not.

***The bindings of one `$let` do not see each other.*** Every value in `vars` is evaluated in
  the scope ***around*** the `$let`, and the whole set is bound together, so a variable cannot
  be written in terms of the one beside it. Nesting a second `$let` is how that is said:

```js
// Both variables are bound at once, so this refuses: $$half is not in scope yet.
// { $let: { vars: { half: { $divide: [ '$total', 2 ] }, quarter: { $divide: [ '$$half', 2 ] } }, in: '$$quarter' } }

// Nested, each `in` runs with the binding around it already made.
const nested = {
	$let: {
		vars: { half: { $divide: [ '$total', 2 ] } },
		in: { $let: { vars: { quarter: { $divide: [ '$$half', 2 ] } }, in: '$$quarter' } },
	}
};
```

***Binding a variable does not rebind the document.*** A field path such as `'$total'` inside
  `in` still reads `$$CURRENT`, which this operator leaves exactly as it found it.

An inner `$let` may bind a name an outer one already bound. The inner binding wins for the
  length of its own `in`, and the outer one is unchanged everywhere else.

A variable may be bound to nothing, which is what a missing field path gives it. Reading it
  produces no value, the same as reading an absent field, so a computed field bound to it is
  left out rather than set to null. Guard it with
  [$ifNull](./Expression-Operators.md#$ifNull) when a default is wanted.

*/

module.exports = function ( jsongin )
{

	let operator =
	{

		//---------------------------------------------------------------------
		Engine: jsongin,
		ArgTypes: 'o',

		//---------------------------------------------------------------------
		Evaluate: function ( Document, Args, Scope )
		{
			try
			{
				jsongin.Scope.Require( Scope, '$let' );

				if ( jsongin.ShortType( Args ) !== 'o' )
				{
					throw new Error( `$let: requires a document naming [vars] and an [in].` );
				}

				let keys = Object.keys( Args );
				for ( let index = 0; index < keys.length; index++ )
				{
					if ( [ 'vars', 'in' ].includes( keys[ index ] ) === false )
					{
						throw new Error( `$let: [${keys[ index ]}] is not an argument of this operator.` );
					}
				}
				if ( ( 'vars' in Args ) === false ) { throw new Error( `$let: requires an argument named [vars].` ); }
				if ( ( 'in' in Args ) === false ) { throw new Error( `$let: requires an argument named [in].` ); }

				if ( jsongin.ShortType( Args.vars ) !== 'o' )
				{
					throw new Error( `$let: [vars] must be a document but found a [${jsongin.ShortType( Args.vars )}] instead.` );
				}

				// ***Every value is evaluated in the scope around this operator***, before any
				// of them is bound, which is what makes the bindings invisible to each other.
				let bindings = {};
				let names = Object.keys( Args.vars );
				for ( let index = 0; index < names.length; index++ )
				{
					let name = jsongin.Scope.RequireName( names[ index ], '$let' );
					bindings[ name ] = jsongin.Evaluate( Document, Args.vars[ name ], Scope );
				}

				return jsongin.Evaluate( Document, Args.in, Scope.Child( bindings ) );
			}
			catch ( error )
			{
				if ( jsongin.OpError ) { jsongin.OpError( `Expression.$let: ${error.message}` ); }
				throw error;
			}
		},

	};

	// Return the operator.
	return operator;
};
