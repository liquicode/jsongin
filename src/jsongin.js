'use strict';

module.exports = function ( EngineSettings = {} )
{
	// if ( typeof EngineSettings.PathExtensions === 'undefined' ) { EngineSettings.PathExtensions = false; }
	if ( typeof EngineSettings.OpLog === 'undefined' ) { EngineSettings.OpLog = null; }
	if ( typeof EngineSettings.OpError === 'undefined' ) { EngineSettings.OpError = null; }

	let Engine = {};


	//---------------------------------------------------------------------
	Engine.Settings = EngineSettings;
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
		$query: require( './Operators/Query/Extension/query' )( Engine ),
		$noop: require( './Operators/Query/Extension/noop' )( Engine ),

	};
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
	// MongoDB Mechanics
	Engine.Query = require( './jsongin/Query' )( Engine );
	Engine.Project = require( './jsongin/Project' )( Engine );
	Engine.Update = require( './jsongin/Update' )( Engine );

	//---------------------------------------------------------------------
	// Document Mechanics
	Engine.GetValue = require( './jsongin/GetValue' )( Engine );
	Engine.SetValue = require( './jsongin/SetValue' )( Engine );
	Engine.Flatten = require( './jsongin/Flatten' )( Engine );
	Engine.Expand = require( './jsongin/Expand' )( Engine );
	Engine.SplitPath = require( './jsongin/SplitPath' )( Engine );
	Engine.JoinPaths = require( './jsongin/JoinPaths' )( Engine );

	//---------------------------------------------------------------------
	// Object Matching and Cloning
	Engine.LooseEquals = function ( DocumentA, DocumentB )	{		return Engine.QueryOperators.$eqx.Query( DocumentA, DocumentB );	};
	Engine.StrictEquals = function ( DocumentA, DocumentB )	{		return Engine.QueryOperators.$eq.Query( DocumentA, DocumentB );	};
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
	Engine.AsNumber = function ( Value )
	{
		try
		{
			if ( !Value ) { return null; }
			let number = Number( Value );
			if ( isNaN( number ) ) { return null; }
			return number;
		}
		catch ( error )
		{
			return null;
		}
	};


	//---------------------------------------------------------------------
	Engine.AsDate = function ( Value )
	{
		try
		{
			if ( !Value ) { return null; }
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
