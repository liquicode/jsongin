'use strict';

const assert = require( 'assert' );

/*
	The remaining arithmetic operators and the trigonometry family.

	Twenty-one operators: six arithmetic ($exp, $ln, $log, $log10, $pow, $sqrt) and the fifteen
	of the Trigonometry section. This began as a gap suite - written against MongoDB while none
	of them existed here - and moved into the parity inventory when they were built.

	***What separates these operators is not the function underneath.*** That is a one line Math
	call in every case, and Javascript and MongoDB agree on its result to the last bit. What has
	to be tested is the ***domain***: what an operator does with an argument it has no answer
	for. The three answers are not guessable and not uniform:

		refuse          a negative under $sqrt, a 2 under $asin, a zero under $ln. Note the
		                last one: Math.log( 0 ) is -Infinity in Javascript and MongoDB refuses
		                it, so the logarithms cannot be bare Math calls.
		return infinity  the bounds of $atanh, and an overflowing $exp.
		compute anyway   every operator here answers a NaN with a NaN.

	A null or missing operand propagates in all twenty-one, and an operand which is not a
	number is refused in all twenty-one, which makes this family far more regular than the
	string family.

	***The exact values matter and are not decoration.*** MongoDB evaluates these in C++ and
	jsongin will evaluate them in Javascript, and the two need not agree to the last bit for
	the transcendental functions - IEEE 754 pins down the arithmetic operations but not sin,
	ln, or their relatives. Every literal below is asserted exactly, so that if the two
	libraries ever disagree, this suite is where it shows up rather than in a user's data.

	Verified against MongoDB 6.0.1.
*/

module.exports = function ( Driver )
{

	//---------------------------------------------------------------------
	describe( 'Arithmetic and Trigonometry Operator Tests', () =>
	{

		let documents = [
			{ _id: 1, n: 4, neg: -4, zero: 0, half: 0.5, empty: null, text: 'nope', scores: [ 10, 20 ] },
		];


		//---------------------------------------------------------------------
		// Runs one expression against the document and returns what it produced.
		async function evaluated( Expression )
		{
			await Driver.SetData( documents );
			let result = await Driver.Aggregate( [
				{ $match: { _id: 1 } },
				{ $project: { _id: 0, r: Expression } },
			] );
			return result[ 0 ].r;
		}


		//---------------------------------------------------------------------
		// Answers whether the engine refused to evaluate the expression.
		// Asserts only that it was refused, never the wording.
		async function refused( Expression )
		{
			try
			{
				await evaluated( Expression );
				return false;
			}
			catch ( error )
			{
				return true;
			}
		}


		//---------------------------------------------------------------------
		describe( 'Roots, Powers, and Logarithms', () =>
		{

			it( 'should take a square root with $sqrt', async () =>
			{
				assert.strictEqual( await evaluated( { $sqrt: 25 } ), 5 );
				assert.strictEqual( await evaluated( { $sqrt: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $sqrt: '$n' } ), 2 );
				assert.strictEqual( await evaluated( { $sqrt: 2 } ), 1.4142135623730951 );
				// A single argument may also be given in an array.
				assert.strictEqual( await evaluated( { $sqrt: [ 25 ] } ), 5 );
				// The domain stops at zero.
				assert.strictEqual( await refused( { $sqrt: -1 } ), true );
				assert.strictEqual( await refused( { $sqrt: '$neg' } ), true );
				// Null propagates, a non-number is refused, and two arguments are too many.
				assert.strictEqual( await evaluated( { $sqrt: null } ), null );
				assert.strictEqual( await evaluated( { $sqrt: '$empty' } ), null );
				assert.strictEqual( await evaluated( { $sqrt: '$missing' } ), null );
				assert.strictEqual( await refused( { $sqrt: '$text' } ), true );
				assert.strictEqual( await refused( { $sqrt: [ 1, 2 ] } ), true );
			} );

			it( 'should raise a number to a power with $pow', async () =>
			{
				assert.strictEqual( await evaluated( { $pow: [ 2, 3 ] } ), 8 );
				assert.strictEqual( await evaluated( { $pow: [ 2, -1 ] } ), 0.5 );
				assert.strictEqual( await evaluated( { $pow: [ 0, 0 ] } ), 1 );
				assert.strictEqual( await evaluated( { $pow: [ -2, 2 ] } ), 4 );
				assert.strictEqual( await evaluated( { $pow: [ '$n', 0.5 ] } ), 2 );
				// A zero base cannot carry a negative exponent: the result is unbounded.
				assert.strictEqual( await refused( { $pow: [ 0, -1 ] } ), true );
				// Null propagates from either side.
				assert.strictEqual( await evaluated( { $pow: [ null, 2 ] } ), null );
				assert.strictEqual( await evaluated( { $pow: [ 2, '$empty' ] } ), null );
				assert.strictEqual( await refused( { $pow: [ '$text', 2 ] } ), true );
				assert.strictEqual( await refused( { $pow: [ 2 ] } ), true );
			} );

			it( 'should raise e to a power with $exp', async () =>
			{
				assert.strictEqual( await evaluated( { $exp: 0 } ), 1 );
				assert.strictEqual( await evaluated( { $exp: 1 } ), 2.718281828459045 );
				assert.strictEqual( await evaluated( { $exp: -1 } ), 0.36787944117144233 );
				// The domain is every number, so a large argument overflows rather than refusing.
				assert.strictEqual( await evaluated( { $exp: 1000 } ), Infinity );
				assert.strictEqual( await evaluated( { $exp: null } ), null );
				assert.strictEqual( await refused( { $exp: '$text' } ), true );
			} );

			it( 'should take a natural logarithm with $ln', async () =>
			{
				assert.strictEqual( await evaluated( { $ln: 1 } ), 0 );
				assert.strictEqual( await evaluated( { $ln: 10 } ), 2.302585092994046 );
				assert.strictEqual( await evaluated( { $ln: 2.718281828459045 } ), 1 );
				// ***The domain is strictly positive, and zero is outside it.*** Javascript's
				// Math.log( 0 ) answers -Infinity and MongoDB refuses: "$ln's argument must be
				// a positive number, but is 0". The three logarithms all behave this way, and
				// it is the one place this family cannot be a bare Math call.
				assert.strictEqual( await refused( { $ln: 0 } ), true );
				assert.strictEqual( await refused( { $ln: -1 } ), true );
				assert.strictEqual( await evaluated( { $ln: null } ), null );
				assert.strictEqual( await refused( { $ln: '$text' } ), true );
			} );

			it( 'should take a logarithm in any base with $log', async () =>
			{
				assert.strictEqual( await evaluated( { $log: [ 100, 10 ] } ), 2 );
				assert.strictEqual( await evaluated( { $log: [ 8, 2 ] } ), 3 );
				assert.strictEqual( await evaluated( { $log: [ 1, 10 ] } ), 0 );
				// Strictly positive, as in $ln.
				assert.strictEqual( await refused( { $log: [ 0, 10 ] } ), true );
				// The base has a domain of its own: it must be positive and cannot be one.
				assert.strictEqual( await refused( { $log: [ 100, 1 ] } ), true );
				assert.strictEqual( await refused( { $log: [ 100, 0 ] } ), true );
				assert.strictEqual( await refused( { $log: [ 100, -2 ] } ), true );
				assert.strictEqual( await refused( { $log: [ -1, 10 ] } ), true );
				assert.strictEqual( await evaluated( { $log: [ null, 10 ] } ), null );
				assert.strictEqual( await evaluated( { $log: [ 100, null ] } ), null );
				assert.strictEqual( await refused( { $log: [ 100 ] } ), true );
			} );

			it( 'should take a base 10 logarithm with $log10', async () =>
			{
				assert.strictEqual( await evaluated( { $log10: 1000 } ), 3 );
				assert.strictEqual( await evaluated( { $log10: 1 } ), 0 );
				// Strictly positive, as in $ln.
				assert.strictEqual( await refused( { $log10: 0 } ), true );
				assert.strictEqual( await refused( { $log10: -1 } ), true );
				assert.strictEqual( await evaluated( { $log10: null } ), null );
				assert.strictEqual( await refused( { $log10: '$text' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Angles and their Inverses', () =>
		{

			it( 'should compute a sine with $sin', async () =>
			{
				assert.strictEqual( await evaluated( { $sin: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $sin: 1 } ), 0.8414709848078965 );
				assert.strictEqual( await evaluated( { $sin: { $degreesToRadians: 90 } } ), 1 );
				assert.strictEqual( await evaluated( { $sin: null } ), null );
				assert.strictEqual( await refused( { $sin: '$text' } ), true );
			} );

			it( 'should compute a cosine with $cos', async () =>
			{
				assert.strictEqual( await evaluated( { $cos: 0 } ), 1 );
				assert.strictEqual( await evaluated( { $cos: 1 } ), 0.5403023058681398 );
				assert.strictEqual( await evaluated( { $cos: null } ), null );
				assert.strictEqual( await refused( { $cos: '$text' } ), true );
			} );

			it( 'should compute a tangent with $tan', async () =>
			{
				assert.strictEqual( await evaluated( { $tan: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $tan: 1 } ), 1.5574077246549023 );
				assert.strictEqual( await evaluated( { $tan: null } ), null );
				assert.strictEqual( await refused( { $tan: '$text' } ), true );
			} );

			it( 'should compute an inverse sine with $asin', async () =>
			{
				assert.strictEqual( await evaluated( { $asin: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $asin: 1 } ), 1.5707963267948966 );
				assert.strictEqual( await evaluated( { $asin: '$half' } ), 0.5235987755982989 );
				// The domain is [-1, 1] and there is no answer outside it.
				assert.strictEqual( await refused( { $asin: 2 } ), true );
				assert.strictEqual( await refused( { $asin: -2 } ), true );
				assert.strictEqual( await evaluated( { $asin: null } ), null );
				assert.strictEqual( await refused( { $asin: '$text' } ), true );
			} );

			it( 'should compute an inverse cosine with $acos', async () =>
			{
				assert.strictEqual( await evaluated( { $acos: 1 } ), 0 );
				assert.strictEqual( await evaluated( { $acos: 0 } ), 1.5707963267948966 );
				assert.strictEqual( await refused( { $acos: 2 } ), true );
				assert.strictEqual( await evaluated( { $acos: null } ), null );
				assert.strictEqual( await refused( { $acos: '$text' } ), true );
			} );

			it( 'should compute an inverse tangent with $atan', async () =>
			{
				assert.strictEqual( await evaluated( { $atan: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $atan: 1 } ), 0.7853981633974483 );
				// Unlike $asin the domain is every number, so a large argument is answerable.
				assert.strictEqual( await evaluated( { $atan: 2 } ), 1.1071487177940904 );
				assert.strictEqual( await evaluated( { $atan: null } ), null );
				assert.strictEqual( await refused( { $atan: '$text' } ), true );
			} );

			it( 'should compute an inverse tangent of a coordinate pair with $atan2', async () =>
			{
				assert.strictEqual( await evaluated( { $atan2: [ 1, 1 ] } ), 0.7853981633974483 );
				assert.strictEqual( await evaluated( { $atan2: [ 0, 1 ] } ), 0 );
				// The two argument form is what distinguishes it: the signs pick the quadrant,
				// which a single ratio could not do.
				assert.strictEqual( await evaluated( { $atan2: [ 0, -1 ] } ), 3.141592653589793 );
				assert.strictEqual( await evaluated( { $atan2: [ -1, -1 ] } ), -2.356194490192345 );
				assert.strictEqual( await evaluated( { $atan2: [ null, 1 ] } ), null );
				assert.strictEqual( await refused( { $atan2: [ 1 ] } ), true );
				assert.strictEqual( await refused( { $atan2: [ '$text', 1 ] } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Hyperbolic Functions', () =>
		{

			it( 'should compute a hyperbolic sine with $sinh', async () =>
			{
				assert.strictEqual( await evaluated( { $sinh: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $sinh: 1 } ), 1.1752011936438014 );
				assert.strictEqual( await evaluated( { $sinh: 1000 } ), Infinity );
				assert.strictEqual( await evaluated( { $sinh: null } ), null );
				assert.strictEqual( await refused( { $sinh: '$text' } ), true );
			} );

			it( 'should compute a hyperbolic cosine with $cosh', async () =>
			{
				assert.strictEqual( await evaluated( { $cosh: 0 } ), 1 );
				assert.strictEqual( await evaluated( { $cosh: 1 } ), 1.5430806348152437 );
				assert.strictEqual( await evaluated( { $cosh: null } ), null );
				assert.strictEqual( await refused( { $cosh: '$text' } ), true );
			} );

			it( 'should compute a hyperbolic tangent with $tanh', async () =>
			{
				assert.strictEqual( await evaluated( { $tanh: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $tanh: 1 } ), 0.7615941559557649 );
				assert.strictEqual( await evaluated( { $tanh: null } ), null );
				assert.strictEqual( await refused( { $tanh: '$text' } ), true );
			} );

			it( 'should compute an inverse hyperbolic sine with $asinh', async () =>
			{
				assert.strictEqual( await evaluated( { $asinh: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $asinh: 1 } ), 0.881373587019543 );
				// The only inverse hyperbolic whose domain is every number.
				assert.strictEqual( await evaluated( { $asinh: -1 } ), -0.881373587019543 );
				assert.strictEqual( await evaluated( { $asinh: null } ), null );
				assert.strictEqual( await refused( { $asinh: '$text' } ), true );
			} );

			it( 'should compute an inverse hyperbolic cosine with $acosh', async () =>
			{
				assert.strictEqual( await evaluated( { $acosh: 1 } ), 0 );
				assert.strictEqual( await evaluated( { $acosh: 2 } ), 1.3169578969248166 );
				// The domain begins at one, not at zero.
				assert.strictEqual( await refused( { $acosh: 0 } ), true );
				assert.strictEqual( await refused( { $acosh: '$half' } ), true );
				assert.strictEqual( await evaluated( { $acosh: null } ), null );
				assert.strictEqual( await refused( { $acosh: '$text' } ), true );
			} );

			it( 'should compute an inverse hyperbolic tangent with $atanh', async () =>
			{
				assert.strictEqual( await evaluated( { $atanh: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $atanh: '$half' } ), 0.5493061443340548 );
				// The boundaries are answerable and the answer is an infinity.
				assert.strictEqual( await evaluated( { $atanh: 1 } ), Infinity );
				assert.strictEqual( await evaluated( { $atanh: -1 } ), -Infinity );
				assert.strictEqual( await refused( { $atanh: 2 } ), true );
				assert.strictEqual( await evaluated( { $atanh: null } ), null );
				assert.strictEqual( await refused( { $atanh: '$text' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Angle Conversion', () =>
		{

			it( 'should convert degrees to radians with $degreesToRadians', async () =>
			{
				assert.strictEqual( await evaluated( { $degreesToRadians: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $degreesToRadians: 180 } ), 3.141592653589793 );
				assert.strictEqual( await evaluated( { $degreesToRadians: 90 } ), 1.5707963267948966 );
				assert.strictEqual( await evaluated( { $degreesToRadians: -180 } ), -3.141592653589793 );
				assert.strictEqual( await evaluated( { $degreesToRadians: null } ), null );
				assert.strictEqual( await refused( { $degreesToRadians: '$text' } ), true );
			} );

			it( 'should convert radians to degrees with $radiansToDegrees', async () =>
			{
				assert.strictEqual( await evaluated( { $radiansToDegrees: 0 } ), 0 );
				assert.strictEqual( await evaluated( { $radiansToDegrees: 3.141592653589793 } ), 180 );
				assert.strictEqual( await evaluated( { $radiansToDegrees: 1.5707963267948966 } ), 90 );
				assert.strictEqual( await evaluated( { $radiansToDegrees: null } ), null );
				assert.strictEqual( await refused( { $radiansToDegrees: '$text' } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		// ***A domain expressed as a comparison lets a NaN through.*** `NaN < 0` is false and
		// so is `NaN > 1`, so every check in this family passes a NaN along to the Math call
		// underneath without ever deciding anything about it. The infinities reach those checks
		// too. What MongoDB does with them is therefore worth asserting rather than assuming,
		// and it is not uniform: some operators compute, some refuse.
		describe( 'Not a Number, and the Infinities', () =>
		{

			it( 'should compute with a NaN rather than refusing it', async () =>
			{
				assert.strictEqual( Number.isNaN( await evaluated( { $sqrt: NaN } ) ), true );
				assert.strictEqual( Number.isNaN( await evaluated( { $ln: NaN } ) ), true );
				assert.strictEqual( Number.isNaN( await evaluated( { $asin: NaN } ) ), true );
				assert.strictEqual( Number.isNaN( await evaluated( { $sin: NaN } ) ), true );
				assert.strictEqual( Number.isNaN( await evaluated( { $atanh: NaN } ) ), true );
				assert.strictEqual( Number.isNaN( await evaluated( { $pow: [ NaN, 2 ] } ) ), true );
			} );

			it( 'should carry an infinity through the unbounded operators', async () =>
			{
				assert.strictEqual( await evaluated( { $sqrt: Infinity } ), Infinity );
				assert.strictEqual( await evaluated( { $ln: Infinity } ), Infinity );
				assert.strictEqual( await evaluated( { $exp: -Infinity } ), 0 );
				assert.strictEqual( await evaluated( { $sinh: -Infinity } ), -Infinity );
				assert.strictEqual( await evaluated( { $acosh: Infinity } ), Infinity );
				assert.strictEqual( await evaluated( { $atan: Infinity } ), 1.5707963267948966 );
				assert.strictEqual( await evaluated( { $tanh: Infinity } ), 1 );
			} );

			it( 'should refuse an infinity which falls outside a domain', async () =>
			{
				assert.strictEqual( await refused( { $sqrt: -Infinity } ), true );
				assert.strictEqual( await refused( { $ln: -Infinity } ), true );
				assert.strictEqual( await refused( { $log10: -Infinity } ), true );
				assert.strictEqual( await refused( { $asin: Infinity } ), true );
				assert.strictEqual( await refused( { $acosh: -Infinity } ), true );
				assert.strictEqual( await refused( { $atanh: Infinity } ), true );
			} );

			it( 'should refuse a periodic function an infinite angle', async () =>
			{
				// A sine has no limit at infinity, unlike an inverse tangent which has one.
				assert.strictEqual( await refused( { $sin: Infinity } ), true );
				assert.strictEqual( await refused( { $cos: -Infinity } ), true );
				assert.strictEqual( await refused( { $tan: Infinity } ), true );
			} );

		} );


		//---------------------------------------------------------------------
		describe( 'Operands and Arity', () =>
		{

			it( 'should refuse an operand which is not a number', async () =>
			{
				assert.strictEqual( await refused( { $sqrt: true } ), true );
				assert.strictEqual( await refused( { $sin: true } ), true );
				assert.strictEqual( await refused( { $exp: [ [ 1, 2 ] ] } ), true );
				assert.strictEqual( await refused( { $atan: '$scores' } ), true );
			} );

			it( 'should refuse the wrong number of operands', async () =>
			{
				assert.strictEqual( await refused( { $sin: [ 1, 2 ] } ), true );
				assert.strictEqual( await refused( { $exp: [ 1, 2 ] } ), true );
				assert.strictEqual( await refused( { $log: [ 8, 2, 1 ] } ), true );
				assert.strictEqual( await refused( { $atan2: [ 1, 2, 3 ] } ), true );
				assert.strictEqual( await refused( { $pow: [] } ), true );
			} );

			it( 'should take an expression as an operand', async () =>
			{
				assert.strictEqual( await evaluated( { $sqrt: { $add: [ 9, 7 ] } } ), 4 );
				assert.strictEqual( await evaluated( { $pow: [ { $add: [ 1, 1 ] }, '$n' ] } ), 16 );
				assert.strictEqual( await evaluated( { $radiansToDegrees: { $asin: 1 } } ), 90 );
			} );

		} );

	} );

};
