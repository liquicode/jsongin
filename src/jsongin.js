'use strict';

// The module's export is a ready to use engine instance.
// It is held here as well so that the browser block at the bottom can publish this same
// instance rather than building a second one.
const DEFAULT_ENGINE = NewJsongin();

module.exports = DEFAULT_ENGINE;

function NewJsongin( EngineSettings = {} )
{
	// PathExtensions enables the implicit iterator on the write side, where a non numeric key
	// against an array applies to every element of that array.
	// It defaults to false because MongoDB does not do this: $set and the arithmetic update
	// operators reject such a path outright, and $unset treats it as a no-op. Verified against
	// MongoDB 6.0.1.
	// The read side is not gated. MongoDB does traverse arrays when resolving a query path, so
	// GetValue must keep doing so for { 'a.x': 1 } to match.
	if ( typeof EngineSettings.PathExtensions === 'undefined' ) { EngineSettings.PathExtensions = false; }
	if ( typeof EngineSettings.OpLog === 'undefined' ) { EngineSettings.OpLog = null; }
	if ( typeof EngineSettings.OpError === 'undefined' ) { EngineSettings.OpError = null; }

	let Engine = {};


	//---------------------------------------------------------------------
	// Factory Method
	Engine.NewJsongin = NewJsongin;

	//---------------------------------------------------------------------
	// Library
	let _package = require( '../package.json' );
	Engine.Library = {
		name: _package.name,
		url: _package.homepage,
		version: _package.version,
	};

	//---------------------------------------------------------------------
	// Settings
	Engine.Settings = EngineSettings;

	//---------------------------------------------------------------------
	// Value Comparison
	// Assigned before the operator registries, which use it.
	Engine.CompareValues = require( './jsongin/CompareValues' )( Engine );

	//---------------------------------------------------------------------
	// Query Operators
	Engine.QueryOperators = {

		// Comparison Query Operators
		$eq: require( './Operators/Query/Comparison/eq' )( Engine ),
		$ne: require( './Operators/Query/Comparison/ne' )( Engine ),
		$gt: require( './Operators/Query/Comparison/gt' )( Engine ),
		$gte: require( './Operators/Query/Comparison/gte' )( Engine ),
		$lt: require( './Operators/Query/Comparison/lt' )( Engine ),
		$lte: require( './Operators/Query/Comparison/lte' )( Engine ),
		$in: require( './Operators/Query/Comparison/in' )( Engine ),
		$nin: require( './Operators/Query/Comparison/nin' )( Engine ),

		// Logical Query Operators
		$and: require( './Operators/Query/Logical/and' )( Engine ),
		$or: require( './Operators/Query/Logical/or' )( Engine ),
		$nor: require( './Operators/Query/Logical/nor' )( Engine ),
		$not: require( './Operators/Query/Logical/not' )( Engine ),

		// Evaluation Query Operators
		$regex: require( './Operators/Query/Evaluation/regex' )( Engine ),
		$expr: require( './Operators/Query/Evaluation/expr' )( Engine ),

		// Array Query Operators
		$elemMatch: require( './Operators/Query/Array/elemMatch' )( Engine ),
		$size: require( './Operators/Query/Array/size' )( Engine ),
		$all: require( './Operators/Query/Array/all' )( Engine ),

		// Element Query Operators
		$exists: require( './Operators/Query/Element/exists' )( Engine ),
		$type: require( './Operators/Query/Element/type' )( Engine ),

		// Extension Query Operators
		$ImplicitEq: require( './Operators/Query/Extension/ImplicitEq' )( Engine ),
		$eqx: require( './Operators/Query/Extension/eqx' )( Engine ),
		$nex: require( './Operators/Query/Extension/nex' )( Engine ),
		$exprx: require( './Operators/Query/Extension/exprx' )( Engine ),
		$noop: require( './Operators/Query/Extension/noop' )( Engine ),

	};

	//---------------------------------------------------------------------
	// Expression Operators
	Engine.ExpressionOperators = {

		// Literal Expression Operators
		$literal: require( './Operators/Expression/Literal/literal' )( Engine ),

		// Arithmetic Expression Operators
		$add: require( './Operators/Expression/Arithmetic/add' )( Engine ),
		$subtract: require( './Operators/Expression/Arithmetic/subtract' )( Engine ),
		$multiply: require( './Operators/Expression/Arithmetic/multiply' )( Engine ),
		$divide: require( './Operators/Expression/Arithmetic/divide' )( Engine ),
		$mod: require( './Operators/Expression/Arithmetic/mod' )( Engine ),
		$abs: require( './Operators/Expression/Arithmetic/abs' )( Engine ),
		$min: require( './Operators/Expression/Arithmetic/min' )( Engine ),
		$max: require( './Operators/Expression/Arithmetic/max' )( Engine ),

		// Comparison Expression Operators
		$eq: require( './Operators/Expression/Comparison/eq' )( Engine ),
		$ne: require( './Operators/Expression/Comparison/ne' )( Engine ),
		$gt: require( './Operators/Expression/Comparison/gt' )( Engine ),
		$gte: require( './Operators/Expression/Comparison/gte' )( Engine ),
		$lt: require( './Operators/Expression/Comparison/lt' )( Engine ),
		$lte: require( './Operators/Expression/Comparison/lte' )( Engine ),
		$cmp: require( './Operators/Expression/Comparison/cmp' )( Engine ),

		// Logical Expression Operators
		$and: require( './Operators/Expression/Logical/and' )( Engine ),
		$or: require( './Operators/Expression/Logical/or' )( Engine ),
		$not: require( './Operators/Expression/Logical/not' )( Engine ),

		// Conditional Expression Operators
		$cond: require( './Operators/Expression/Conditional/cond' )( Engine ),
		$ifNull: require( './Operators/Expression/Conditional/ifNull' )( Engine ),
		$switch: require( './Operators/Expression/Conditional/switch' )( Engine ),

	};

	//---------------------------------------------------------------------
	// Update Operators
	Engine.UpdateOperators = {

		// Field Update Operators
		$set: require( './Operators/Update/Field/set' )( Engine ),
		$unset: require( './Operators/Update/Field/unset' )( Engine ),
		$rename: require( './Operators/Update/Field/rename' )( Engine ),
		$inc: require( './Operators/Update/Field/inc' )( Engine ),
		$min: require( './Operators/Update/Field/min' )( Engine ),
		$max: require( './Operators/Update/Field/max' )( Engine ),
		$mul: require( './Operators/Update/Field/mul' )( Engine ),
		$currentDate: require( './Operators/Update/Field/currentDate' )( Engine ),
		// $setOnInsert: require( './Operators/Update/setOnInsert' )( Engine ),

		// Array Update Operators
		$addToSet: require( './Operators/Update/Array/addToSet' )( Engine ),
		$pop: require( './Operators/Update/Array/pop' )( Engine ),
		$push: require( './Operators/Update/Array/push' )( Engine ),
		$pullAll: require( './Operators/Update/Array/pullAll' )( Engine ),
		// $pull: require( './Operators/Update/Array/pull' )( Engine ),
		// $: require( './Operators/Update/Array/positional_$' )( Engine ),
		// $identifier: require( './Operators/Update/Array/identifier' )( Engine ),

	};

	//---------------------------------------------------------------------
	// Stage Operators
	Engine.StageOperators = {

		$match: require( './Operators/Stage/match' )( Engine ),
		$project: require( './Operators/Stage/project' )( Engine ),
		$addFields: require( './Operators/Stage/addFields' )( Engine ),
		$set: require( './Operators/Stage/set' )( Engine ),
		$unwind: require( './Operators/Stage/unwind' )( Engine ),
		$group: require( './Operators/Stage/group' )( Engine ),
		$sort: require( './Operators/Stage/sort' )( Engine ),
		$limit: require( './Operators/Stage/limit' )( Engine ),
		$skip: require( './Operators/Stage/skip' )( Engine ),

	};

	//---------------------------------------------------------------------
	// Accumulator Operators
	Engine.AccumulatorOperators = {

		$sum: require( './Operators/Accumulator/sum' )( Engine ),
		$avg: require( './Operators/Accumulator/avg' )( Engine ),
		$min: require( './Operators/Accumulator/min' )( Engine ),
		$max: require( './Operators/Accumulator/max' )( Engine ),
		$count: require( './Operators/Accumulator/count' )( Engine ),
		$push: require( './Operators/Accumulator/push' )( Engine ),
		$first: require( './Operators/Accumulator/first' )( Engine ),
		$last: require( './Operators/Accumulator/last' )( Engine ),

	};

	//---------------------------------------------------------------------
	// Text Helper
	Engine.Text = require( './Text' );

	//---------------------------------------------------------------------
	// MongoDB Mechanics
	Engine.Query = require( './jsongin/Query' )( Engine );
	Engine.Evaluate = require( './jsongin/Evaluate' )( Engine );
	Engine.Aggregate = require( './jsongin/Aggregate' )( Engine );
	Engine.Project = require( './jsongin/Project' )( Engine );
	Engine.Update = require( './jsongin/Update' )( Engine );
	Engine.Filter = require( './jsongin/Filter' )( Engine );
	Engine.Sort = require( './jsongin/Sort' )( Engine );
	Engine.Distinct = require( './jsongin/Distinct' )( Engine );

	//---------------------------------------------------------------------
	// Snapshots
	Engine.Diff = require( './jsongin/Diff' )( Engine );
	Engine.Invert = require( './jsongin/Invert' )( Engine );

	//---------------------------------------------------------------------
	// Document Mechanics
	Engine.Parse = require( './jsongin/Parse' )( Engine );
	Engine.Format = require( './jsongin/Format' )( Engine );
	Engine.SplitPath = require( './jsongin/SplitPath' )( Engine );
	Engine.JoinPaths = require( './jsongin/JoinPaths' )( Engine );
	Engine.GetValue = require( './jsongin/GetValue' )( Engine );
	Engine.ResolveCandidates = require( './jsongin/ResolveCandidates' )( Engine );
	Engine.SetValue = require( './jsongin/SetValue' )( Engine );
	Engine.DeleteValue = require( './jsongin/DeleteValue' )( Engine );
	Engine.Flatten = require( './jsongin/Flatten' )( Engine );
	Engine.Expand = require( './jsongin/Expand' )( Engine );
	Engine.Hybridize = require( './jsongin/Hybridize' )( Engine );
	Engine.Unhybridize = require( './jsongin/Unhybridize' )( Engine );
	Engine.Merge = require( './jsongin/Merge' )( Engine );

	//---------------------------------------------------------------------
	// Object Matching and Cloning
	Engine.LooseEquals = function ( DocumentA, DocumentB ) { return Engine.QueryOperators.$eqx.Query( DocumentA, DocumentB ); };

	// Compares two values for equality and returns true or false.
	// Note that this does not call the $eq query operator. A query operator is not symmetric:
	// its first parameter is a document field and its second is a match value, and $eq lets a
	// match value equal an element of a document array, which is what MongoDB does. That rule
	// makes StrictEquals( [ [ 1, 2 ] ], [ 1, 2 ] ) true while the reverse is false, and an
	// equality test must not depend on the order of its arguments.
	Engine.StrictEquals = function ( DocumentA, DocumentB ) { return ( Engine.CompareValues( DocumentA, DocumentB ) === 0 ); };
	Engine.Clone = function ( Document ) { return JSON.parse( JSON.stringify( Document ) ); };
	Engine.SafeClone = require( './jsongin/SafeClone' )( Engine );

	//---------------------------------------------------------------------
	// Data Types and Conversions
	Engine.ShortType = require( './jsongin/ShortType' )( Engine );
	Engine.BsonType = require( './jsongin/BsonType' )( Engine );

	//---------------------------------------------------------------------
	// OpLog
	Engine.OpLog = EngineSettings.OpLog;
	Engine.OpError = EngineSettings.OpError;


	//---------------------------------------------------------------------
	// Converts a value to a number. Returns null when the value is not numeric.
	// Note that zero is a number, so this cannot test the value for falsiness.
	Engine.AsNumber = function ( Value )
	{
		try
		{
			let short_type = Engine.ShortType( Value );
			if ( short_type === 'n' )
			{
				if ( isNaN( Value ) ) { return null; }
				return Value;
			}
			if ( short_type === 's' )
			{
				if ( Value.trim().length === 0 ) { return null; }
				let number = Number( Value );
				if ( isNaN( number ) ) { return null; }
				return number;
			}
			return null;
		}
		catch ( error )
		{
			return null;
		}
	};


	//---------------------------------------------------------------------
	// Converts a value to a boolean, using MongoDB's expression evaluation rules.
	// Only false, zero, null, and missing values are false.
	// Note that the empty string '' and the empty array [] are both true.
	Engine.AsBoolean = function ( Value )
	{
		let short_type = Engine.ShortType( Value );
		if ( short_type === 'b' ) { return Value; }
		if ( short_type === 'n' ) { return ( Value !== 0 ); }
		if ( 'lu'.includes( short_type ) ) { return false; }
		return true;
	};


	//---------------------------------------------------------------------
	// Converts a value to a Date. Returns null when the value is not a date.
	// Note that zero is a valid timestamp, so this cannot test the value for falsiness.
	Engine.AsDate = function ( Value )
	{
		try
		{
			let short_type = Engine.ShortType( Value );
			if ( short_type === 'd' ) { return new Date( Value.getTime() ); }
			if ( 'ns'.includes( short_type ) === false ) { return null; }
			if ( short_type === 's' )
			{
				if ( Value.trim().length === 0 ) { return null; }
			}
			let date = new Date( Value );
			if ( isNaN( date ) ) { return null; }
			return date;
		}
		catch ( error )
		{
			return null;
		}
	};


	//---------------------------------------------------------------------
	Engine.IsQuery = function ( Query )
	{
		if ( Engine.ShortType( Query ) !== 'o' ) { return false; }
		for ( let key in Query )
		{
			if ( typeof Engine.QueryOperators[ key ] !== 'undefined' ) { return true; }
			//TODO: This needs more thought/work:
			// if ( Engine.ShortType( Query[ key ] ) === 'o' )
			// {
			// 	if ( Engine.Settings.PathExtensions )
			// 	{
			// 		if ( Object.keys( Query ).length === 1 )
			// 		{
			// 			if ( Engine.IsQuery( ( Query[ key ] ) ) ) { return true; }
			// 		}
			// 	}
			// }
		}
		return false;
	};


	// Return the engine.
	return Engine;
};

// Browser compatability.
//
// The bundle publishes this module's export as window.jsongin, and this publishes the same
// instance as window.liquicode.jsongin, so the two globals are interchangeable.
// Building a second engine here instead, which is what this used to do, made them two
// different instances. That matters because the operator registries belong to an instance:
// an operator registered through one global was invisible through the other.
if ( typeof window !== 'undefined' )
{
	if ( typeof window.liquicode === 'undefined' ) { window.liquicode = {}; }
	window.liquicode.jsongin = DEFAULT_ENGINE;
	window.liquicode.NewJsongin = NewJsongin;
}
