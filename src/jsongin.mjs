// @liquicode/jsongin - ESM entry point.
//
// This wrapper exists so that `import { Query } from '@liquicode/jsongin'` works. Without it
// Node reports `Named export 'Query' not found`, because cjs-module-lexer cannot see a surface
// which is assigned dynamically: every member is attached inside NewJsongin() as
// `Engine.Query = function ...`, and a static reader has nothing to find.
//
// ***This is a wrapper and never a second build.*** It imports the CommonJS module and re-exports
// what is already there, so `require()` and `import` reach ***one*** engine. A separate ESM
// compilation would produce two, and the operator registries belong to an instance - an operator
// registered through one would be invisible through the other. src/jsongin.js carries the same
// warning about the browser globals, for the same reason.
//
// ***OpLog and OpError are deliberately absent from the named exports below.*** They are mutable
// engine settings, assigned once at construction and set afterwards by the caller to turn
// operation logging on. A named export is bound at load time, so `import { OpLog }` would hand
// back the null it held then and go on doing so after the caller had set one. Reach them through
// the default export, where an assignment lands on the engine:
//
//		import jsongin from '@liquicode/jsongin';
//		jsongin.OpLog = function ( Message ) { console.log( Message ); };
//
// build/types-check.js knows about this exclusion by name and fails on any other difference
// between this file, the declaration, and the running engine.

import ENGINE from './jsongin.js';


//---------------------------------------------------------------------
// The engine itself.
// Same object as `require( '@liquicode/jsongin' )` returns.

export default ENGINE;


//---------------------------------------------------------------------
// Engine construction.

export const NewJsongin = ENGINE.NewJsongin;


//---------------------------------------------------------------------
// Document query, evaluation, and transformation.

export const Query = ENGINE.Query;
export const Evaluate = ENGINE.Evaluate;
export const Aggregate = ENGINE.Aggregate;
export const Project = ENGINE.Project;
export const Update = ENGINE.Update;
export const Filter = ENGINE.Filter;
export const Sort = ENGINE.Sort;
export const Distinct = ENGINE.Distinct;
export const Diff = ENGINE.Diff;
export const Invert = ENGINE.Invert;


//---------------------------------------------------------------------
// Text conversion.

export const Parse = ENGINE.Parse;
export const Format = ENGINE.Format;


//---------------------------------------------------------------------
// Path navigation.

export const SplitPath = ENGINE.SplitPath;
export const JoinPaths = ENGINE.JoinPaths;
export const GetValue = ENGINE.GetValue;
export const ResolveCandidates = ENGINE.ResolveCandidates;
export const SetValue = ENGINE.SetValue;
export const DeleteValue = ENGINE.DeleteValue;


//---------------------------------------------------------------------
// Document structure.

export const Flatten = ENGINE.Flatten;
export const Expand = ENGINE.Expand;
export const Hybridize = ENGINE.Hybridize;
export const Unhybridize = ENGINE.Unhybridize;
export const Merge = ENGINE.Merge;
export const Clone = ENGINE.Clone;
export const SafeClone = ENGINE.SafeClone;


//---------------------------------------------------------------------
// Value comparison and typing.

export const CompareValues = ENGINE.CompareValues;
export const LooseEquals = ENGINE.LooseEquals;
export const StrictEquals = ENGINE.StrictEquals;
export const ShortType = ENGINE.ShortType;
export const BsonType = ENGINE.BsonType;
export const AsNumber = ENGINE.AsNumber;
export const AsBoolean = ENGINE.AsBoolean;
export const AsDate = ENGINE.AsDate;
export const IsQuery = ENGINE.IsQuery;


//---------------------------------------------------------------------
// Operator tables and engine state.
//
// These are objects rather than values, so the binding below and the engine's own property
// reference the same table. An operator registered after import is visible through either.

export const Library = ENGINE.Library;
export const Settings = ENGINE.Settings;
export const QueryOperators = ENGINE.QueryOperators;
export const ExpressionOperators = ENGINE.ExpressionOperators;
export const UpdateOperators = ENGINE.UpdateOperators;
export const StageOperators = ENGINE.StageOperators;
export const AccumulatorOperators = ENGINE.AccumulatorOperators;
export const Text = ENGINE.Text;
export const Scope = ENGINE.Scope;
