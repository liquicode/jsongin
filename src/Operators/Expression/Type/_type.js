'use strict';

/*
	Shared conversion rules for the expression type operators.
	This is a helper module, not an operator.

	***$convert is the operator, and the six $toX operators are shorthands for it.***
	That is how MongoDB defines them and it is how they are built here: every conversion goes
	through Convert() below, so `{ $toInt: x }` and `{ $convert: { input: x, to: 'int' } }`
	cannot drift apart. What $convert adds is `onError` and `onNull`, which the shorthands
	have no way to express.

	***Javascript's own conversions are the wrong ones almost everywhere here***, which is why
	so little of this file hands a value to the language and takes the answer:

		Number( ' 5' )     is 5 and Number( '' ) is 0. MongoDB refuses both: a numeric string
		                   must be wholly numeric, and no whitespace is consumed.
		Boolean( '' )      is false. Every string converts to true in MongoDB, empty included.
		Date.parse()       reads a date and time carrying no zone as ***local***, so the same
		                   string would mean different instants on two machines. MongoDB reads
		                   it as UTC. It also accepts a bare year, which MongoDB refuses.

	Every rule here was established against MongoDB 6.0.1 first. See
	test/Parity Tests/Aggregate Tests/test-suite/Type Operator Tests.js.
*/

module.exports = function ( jsongin )
{

	const arithmetic = require( '../Arithmetic/_arithmetic' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	// Operand evaluation is the same here as everywhere else.
	helper.Operands = arithmetic.Operands;


	//---------------------------------------------------------------------
	const INT32_MIN = -2147483648;
	const INT32_MAX = 2147483647;

	// A long is a 64 bit integer. These bounds are compared as doubles, which is the same
	// comparison MongoDB makes when deciding whether a double fits, even though Javascript
	// cannot hold every integer between them exactly.
	const INT64_MIN = -9223372036854775808;
	const INT64_MAX = 9223372036854775807;

	// The targets $convert accepts, by name and by BSON type number.
	// `decimal` and `objectId` are absent on purpose: jsongin carries neither type.
	const TARGETS_BY_NUMBER =
	{
		1: 'double',
		2: 'string',
		8: 'bool',
		9: 'date',
		16: 'int',
		18: 'long',
	};
	const TARGET_NAMES = [ 'double', 'string', 'bool', 'date', 'int', 'long' ];


	//---------------------------------------------------------------------
	// Returns the target type named by a $convert `to`, which may be a name or a BSON type
	// number. Throws when it is neither.
	helper.TargetName = function ( To, OperatorName )
	{
		let short_type = jsongin.ShortType( To );
		if ( short_type === 's' )
		{
			if ( !TARGET_NAMES.includes( To ) )
			{
				throw new Error( `${OperatorName}: cannot convert to [${To}].` );
			}
			return To;
		}
		if ( short_type === 'n' )
		{
			let name = TARGETS_BY_NUMBER[ To ];
			if ( !name )
			{
				throw new Error( `${OperatorName}: cannot convert to BSON type [${To}].` );
			}
			return name;
		}
		throw new Error( `${OperatorName}: requires a target type but found a [${short_type}] instead.` );
	};


	//---------------------------------------------------------------------
	// Converts a value to the named target.
	// Returns null when the value is null or missing, which every caller propagates.
	// Throws when the value has no reading in that target, or has one which does not fit.
	helper.Convert = function ( Value, TargetName, OperatorName )
	{
		let short_type = jsongin.ShortType( Value );
		if ( 'lu'.includes( short_type ) ) { return null; }

		if ( TargetName === 'string' ) { return helper.ToString( Value, short_type, OperatorName ); }
		if ( TargetName === 'bool' ) { return helper.ToBool( Value, short_type ); }
		if ( TargetName === 'date' ) { return helper.ToDate( Value, short_type, OperatorName ); }
		return helper.ToNumber( Value, short_type, TargetName, OperatorName );
	};


	//---------------------------------------------------------------------
	helper.ToString = function ( Value, ShortType, OperatorName )
	{
		if ( ShortType === 's' ) { return Value; }
		if ( ShortType === 'n' ) { return String( Value ); }
		if ( ShortType === 'b' ) { return Value ? 'true' : 'false'; }
		if ( ShortType === 'd' ) { return Value.toISOString(); }
		throw new Error( `${OperatorName}: cannot convert a [${ShortType}] value to a string.` );
	};


	//---------------------------------------------------------------------
	// ***The one conversion with no failing case.*** An array and an object are both true,
	// and so is every string, the empty one included.
	helper.ToBool = function ( Value, ShortType )
	{
		if ( ShortType === 'b' ) { return Value; }
		if ( ShortType === 'n' ) { return ( Value !== 0 ); }
		return true;
	};


	//---------------------------------------------------------------------
	helper.ToDate = function ( Value, ShortType, OperatorName )
	{
		if ( ShortType === 'd' ) { return Value; }
		if ( ShortType === 'n' )
		{
			if ( !Number.isFinite( Value ) )
			{
				throw new Error( `${OperatorName}: cannot convert ${Value} to a date.` );
			}
			return new Date( Value );
		}
		if ( ShortType === 's' ) { return helper.ParseDate( Value, OperatorName ); }
		throw new Error( `${OperatorName}: cannot convert a [${ShortType}] value to a date.` );
	};


	//---------------------------------------------------------------------
	helper.ToNumber = function ( Value, ShortType, TargetName, OperatorName )
	{
		let number = null;

		if ( ShortType === 'n' ) { number = Value; }
		else if ( ShortType === 'b' ) { number = Value ? 1 : 0; }
		else if ( ShortType === 's' ) { number = helper.ParseNumber( Value, TargetName, OperatorName ); }
		else if ( ShortType === 'd' )
		{
			// A date reads as milliseconds since the epoch, but only where the target is wide
			// enough to hold one. An int is not, and MongoDB refuses rather than truncating.
			if ( TargetName === 'int' )
			{
				throw new Error( `${OperatorName}: cannot convert a date to an int.` );
			}
			number = Value.getTime();
		}
		else
		{
			throw new Error( `${OperatorName}: cannot convert a [${ShortType}] value to a ${TargetName}.` );
		}

		if ( TargetName === 'double' ) { return number; }

		// ***An integer target truncates rather than rounding***, and then has to fit.
		// NaN and the infinities are numbers with no integer reading at all.
		if ( !Number.isFinite( number ) )
		{
			throw new Error( `${OperatorName}: cannot convert ${number} to a ${TargetName}.` );
		}
		let truncated = Math.trunc( number );

		let low = ( TargetName === 'int' ) ? INT32_MIN : INT64_MIN;
		let high = ( TargetName === 'int' ) ? INT32_MAX : INT64_MAX;
		if ( ( truncated < low ) || ( truncated > high ) )
		{
			throw new Error( `${OperatorName}: ${number} is outside the range of a ${TargetName}.` );
		}
		return truncated;
	};


	//---------------------------------------------------------------------
	// Reads a numeric string, which must be numeric in its entirety.
	// An integer target will not read a fractional string, where a fractional number would
	// have been truncated: the string is read as an integer or not at all.
	helper.ParseNumber = function ( Text, TargetName, OperatorName )
	{
		let pattern = /^[+-]?\d+$/;
		if ( TargetName === 'double' ) { pattern = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/; }
		if ( !pattern.test( Text ) )
		{
			throw new Error( `${OperatorName}: cannot read [${Text}] as a ${TargetName}.` );
		}
		return Number( Text );
	};


	//---------------------------------------------------------------------
	// Reads a date string.
	//
	// ***A string carrying no zone is read as UTC.*** Javascript reads a date and time with no
	// offset as local time, so handing the string straight to Date.parse() would make the same
	// document mean different instants on two machines. An ISO date with no time is the
	// exception: Javascript already reads that one as UTC.
	helper.ParseDate = function ( Text, OperatorName )
	{
		// Javascript reads a bare year as the first of January. MongoDB refuses it.
		if ( /^\d{4}$/.test( Text ) )
		{
			throw new Error( `${OperatorName}: cannot read [${Text}] as a date.` );
		}

		let milliseconds = Date.parse( Text );
		if ( Number.isNaN( milliseconds ) )
		{
			throw new Error( `${OperatorName}: cannot read [${Text}] as a date.` );
		}

		let has_zone = /(Z|[+-]\d{2}:?\d{2})$/i.test( Text );
		let is_date_only = /^\d{4}-\d{2}-\d{2}$/.test( Text );
		if ( !has_zone && !is_date_only )
		{
			// getTimezoneOffset() is the offset in effect at that instant, so this stays
			// correct across a daylight saving change.
			milliseconds = milliseconds - ( new Date( milliseconds ).getTimezoneOffset() * 60000 );
		}

		return new Date( milliseconds );
	};


	//---------------------------------------------------------------------
	// Evaluates a $toX shorthand: one operand, converted to a fixed target.
	helper.ShorthandConversion = function ( Document, Args, OperatorName, TargetName )
	{
		let operands = helper.Operands( Document, Args, OperatorName, 1, 1 );
		return helper.Convert( operands[ 0 ], TargetName, OperatorName );
	};


	//---------------------------------------------------------------------
	return helper;
};
