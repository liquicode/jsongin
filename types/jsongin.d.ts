// Type declarations for @liquicode/jsongin
//
// ***Hand written, and hand written on purpose.*** The library is Javascript and stays
// Javascript: there is no `.ts` source, no compiler, and no generated declaration in this
// project. What ships is a declaration a consumer's editor can read, so TypeScript is
// ***supported and never required***.
//
// ***A declaration file drifts silently***, which is the whole objection to writing one by
// hand. `build/types-check.js` answers that: it loads the running engine and asserts that
// every export here exists there, that every export there is declared here, and that
// `src/jsongin.mjs` re-exports the same set. A declaration nothing checks is a comment.
//
// OpLog and OpError are declared on the engine but are ***not*** named exports. They are
// mutable settings, and a named ESM export binds at load time. See src/jsongin.mjs.

declare module '@liquicode/jsongin'
{

	//---------------------------------------------------------------------
	// Documents and values.

	/** Any value which survives a JSON round trip, plus Date, which jsongin ranks and compares. */
	export type JsonValue = null | boolean | number | string | Date | JsonValue[] | { [ Key: string ]: JsonValue };

	/** A document is an object. Query, Update and Project all take one. */
	export type JsonDocument = { [ Key: string ]: any };

	/** A MongoDB style query criteria. */
	export type QueryCriteria = { [ Key: string ]: any };

	/**
	 * jsongin's single character type code.
	 *
	 *		a  array          b  boolean       d  date           e  error
	 *		f  function       l  null          n  number         o  object
	 *		r  regexp         s  string        u  undefined      y  symbol
	 */
	export type ShortTypeCode = 'a' | 'b' | 'd' | 'e' | 'f' | 'l' | 'n' | 'o' | 'r' | 's' | 'u' | 'y';

	/** A table of operators, keyed by operator name. Extended by registering an operator. */
	export type OperatorTable = { [ OperatorName: string ]: any };

	/** Reports an operation. Assign one to Engine.OpLog to turn operation logging on. */
	export type OpLogFunction = ( Message: string ) => void;


	//---------------------------------------------------------------------
	// Engine settings.

	export interface EngineSettings
	{
		OpLog: OpLogFunction | null;
		OpError: OpLogFunction | null;
	}

	export interface LibraryInfo
	{
		name: string;
		url: string;
		version: string;
	}


	//---------------------------------------------------------------------
	// The scope object used by Evaluate, Aggregate and Project.

	export interface ScopeApi
	{
		New( Root?: any, Current?: any, Variables?: JsonDocument ): JsonDocument;
		NewPipeline( Variables?: JsonDocument ): JsonDocument;
		NewDocument( Document: JsonDocument, Parent?: JsonDocument ): JsonDocument;
		RequireName( Name: string ): string;
		Require( Scope: JsonDocument, Name: string ): any;
		ToJSON( Scope: JsonDocument ): string;
		FromJSON( JsonString: string ): JsonDocument;
	}


	//---------------------------------------------------------------------
	// Text utilities.

	export interface TextApi
	{
		Compare( TextA: string, TextB: string, CaseSensitive?: boolean ): number;
		FindBetween( Text: string, Prefix: string, Suffix: string, Options?: JsonDocument ): string;
		Matches( Text: string, Pattern: string, CaseSensitive?: boolean ): boolean;
		SearchReplacements( Text: string, Replacements: JsonDocument ): string;
		SearchReplace( Text: string, Search: string, Replace: string ): string;
	}


	//---------------------------------------------------------------------
	// The engine.

	export interface JsonginEngine
	{
		//--- Engine construction.
		NewJsongin( EngineSettings?: Partial<EngineSettings> ): JsonginEngine;

		//--- Library information and settings.
		Library: LibraryInfo;
		Settings: EngineSettings;

		/** Assign a function to turn operation logging on. Null by default. */
		OpLog: OpLogFunction | null;
		/** Assign a function to turn operation error reporting on. Null by default. */
		OpError: OpLogFunction | null;

		//--- Operator tables.
		QueryOperators: OperatorTable;
		ExpressionOperators: OperatorTable;
		UpdateOperators: OperatorTable;
		StageOperators: OperatorTable;
		AccumulatorOperators: OperatorTable;

		//--- Query, evaluation, and transformation.
		Query( Document: JsonDocument, Criteria: QueryCriteria, Path?: string ): boolean;
		Evaluate( Document: JsonDocument, Expression: any, Scope?: JsonDocument ): any;
		Aggregate( Documents: JsonDocument[], Pipeline: JsonDocument[], Scope?: JsonDocument ): JsonDocument[];
		Project( Document: JsonDocument, Projection: JsonDocument, IsStage?: boolean, Scope?: JsonDocument ): JsonDocument;
		Update( Document: JsonDocument, Updates: JsonDocument ): JsonDocument;
		Filter( Documents: JsonDocument[], QueryCriteria: QueryCriteria ): JsonDocument[];
		Sort( Documents: JsonDocument[], SortCriteria: JsonDocument ): JsonDocument[];
		Distinct( Documents: JsonDocument[], DistinctCriteria: any ): any[];
		Diff( Before: JsonDocument, After: JsonDocument ): JsonDocument;
		Invert( Before: JsonDocument, Patch: JsonDocument ): JsonDocument;

		//--- Text conversion.
		Parse( JsonString: string, Options?: JsonDocument ): any;
		Format( Value: any, Options?: JsonDocument, LikeJavascript?: boolean ): string;

		//--- Path navigation.
		SplitPath( Path: string ): string[];
		JoinPaths( ...Paths: string[] ): string;
		GetValue( Document: JsonDocument, Path: string ): any;
		ResolveCandidates( Document: JsonDocument, Path: string, ExpandArrays?: boolean ): string[];
		SetValue( Document: JsonDocument, Path: string, Value: any, CreateArrays?: boolean ): boolean;
		DeleteValue( Document: JsonDocument, Path: string ): boolean;

		//--- Document structure.
		Flatten( Document: JsonDocument ): JsonDocument;
		Expand( Document: JsonDocument ): JsonDocument;
		Hybridize( Document: JsonDocument ): JsonDocument;
		Unhybridize( Document: JsonDocument ): JsonDocument;
		Merge( DocumentA: JsonDocument, DocumentB: JsonDocument ): JsonDocument;
		Clone<Type>( Document: Type ): Type;
		SafeClone<Type>( Document: Type, Exceptions?: any ): Type;

		//--- Value comparison and typing.
		CompareValues( ValueA: any, ValueB: any ): number;
		LooseEquals( ValueA: any, ValueB: any ): boolean;
		StrictEquals( DocumentA: any, DocumentB: any ): boolean;
		ShortType( Value: any ): ShortTypeCode;
		BsonType( Value: any, ReturnAlias?: boolean ): string;
		AsNumber( Value: any ): number | null;
		AsBoolean( Value: any ): boolean | null;
		AsDate( Value: any ): Date | null;
		IsQuery( Query: any ): boolean;

		//--- Sub-APIs.
		Text: TextApi;
		Scope: ScopeApi;
	}


	//---------------------------------------------------------------------
	// The default export is the engine, and is what `require()` returns.

	const jsongin: JsonginEngine;
	export default jsongin;


	//---------------------------------------------------------------------
	// Named exports, matching src/jsongin.mjs one for one.

	export const NewJsongin: JsonginEngine[ 'NewJsongin' ];

	export const Query: JsonginEngine[ 'Query' ];
	export const Evaluate: JsonginEngine[ 'Evaluate' ];
	export const Aggregate: JsonginEngine[ 'Aggregate' ];
	export const Project: JsonginEngine[ 'Project' ];
	export const Update: JsonginEngine[ 'Update' ];
	export const Filter: JsonginEngine[ 'Filter' ];
	export const Sort: JsonginEngine[ 'Sort' ];
	export const Distinct: JsonginEngine[ 'Distinct' ];
	export const Diff: JsonginEngine[ 'Diff' ];
	export const Invert: JsonginEngine[ 'Invert' ];

	export const Parse: JsonginEngine[ 'Parse' ];
	export const Format: JsonginEngine[ 'Format' ];

	export const SplitPath: JsonginEngine[ 'SplitPath' ];
	export const JoinPaths: JsonginEngine[ 'JoinPaths' ];
	export const GetValue: JsonginEngine[ 'GetValue' ];
	export const ResolveCandidates: JsonginEngine[ 'ResolveCandidates' ];
	export const SetValue: JsonginEngine[ 'SetValue' ];
	export const DeleteValue: JsonginEngine[ 'DeleteValue' ];

	export const Flatten: JsonginEngine[ 'Flatten' ];
	export const Expand: JsonginEngine[ 'Expand' ];
	export const Hybridize: JsonginEngine[ 'Hybridize' ];
	export const Unhybridize: JsonginEngine[ 'Unhybridize' ];
	export const Merge: JsonginEngine[ 'Merge' ];
	export const Clone: JsonginEngine[ 'Clone' ];
	export const SafeClone: JsonginEngine[ 'SafeClone' ];

	export const CompareValues: JsonginEngine[ 'CompareValues' ];
	export const LooseEquals: JsonginEngine[ 'LooseEquals' ];
	export const StrictEquals: JsonginEngine[ 'StrictEquals' ];
	export const ShortType: JsonginEngine[ 'ShortType' ];
	export const BsonType: JsonginEngine[ 'BsonType' ];
	export const AsNumber: JsonginEngine[ 'AsNumber' ];
	export const AsBoolean: JsonginEngine[ 'AsBoolean' ];
	export const AsDate: JsonginEngine[ 'AsDate' ];
	export const IsQuery: JsonginEngine[ 'IsQuery' ];

	export const Library: LibraryInfo;
	export const Settings: EngineSettings;
	export const QueryOperators: OperatorTable;
	export const ExpressionOperators: OperatorTable;
	export const UpdateOperators: OperatorTable;
	export const StageOperators: OperatorTable;
	export const AccumulatorOperators: OperatorTable;
	export const Text: TextApi;
	export const Scope: ScopeApi;

}
