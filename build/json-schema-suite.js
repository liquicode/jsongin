'use strict';

/*
	Reads the vendored JSON-Schema-Test-Suite and runs its cases through the engine.

	The suite is the observed reference for the JSON Schema functions, the way a running
	MongoDB is the reference for the operators: a case which fails is a place where the
	evaluator disagrees with the specification's own tests. It lives under
	test/json-schema-test-suite/, at the commit its README names, and nothing in it is ever
	fetched - the remote schemas the refRemote cases reach at http://localhost:1234/ are served
	from the remotes/ folder through a registry the evaluator is handed.

	Two callers share this module so that they cannot disagree about what a case is:

		test/Unit Tests/170) JSON Schema Suite Tests.js    asserts the claimed sets under mocha
		build/json-schema-report.js                        measures every set and prints counts

	A set is one draft folder at one level: the required cases at the top of the folder, the
	optional/ cases, or the optional/format/ cases. Format cases are run with FormatAssertion
	on, because they assume it; every other set is run with the default, where a format is an
	annotation and never a refusal, which is what the specification says a validator does
	unless told otherwise.
*/

const LIB_FS = require( 'fs' );
const LIB_PATH = require( 'path' );

const REPO = LIB_PATH.resolve( __dirname, '..' );
const SUITE = LIB_PATH.join( REPO, 'test', 'json-schema-test-suite' );
const REMOTES_BASE = 'http://localhost:1234/';


//---------------------------------------------------------------------
// The drafts the engine dispatches to. Name is the Dialect option the evaluator takes; Uri is
// what a schema's $schema keyword says; Folder is where the suite keeps that draft's cases.
const DRAFTS = [
	{ Name: '2020-12', Folder: 'draft2020-12', Uri: 'https://json-schema.org/draft/2020-12/schema' },
	{ Name: '2019-09', Folder: 'draft2019-09', Uri: 'https://json-schema.org/draft/2019-09/schema' },
	{ Name: 'draft-07', Folder: 'draft7', Uri: 'http://json-schema.org/draft-07/schema#' },
	{ Name: 'draft-04', Folder: 'draft4', Uri: 'http://json-schema.org/draft-04/schema#' },
];

// The three levels of a draft folder. Subfolder is relative to the draft folder; an empty
// one is the folder itself.
const SETS = [
	{ Name: 'required', Subfolder: '', FormatAssertion: false },
	{ Name: 'optional', Subfolder: 'optional', FormatAssertion: false },
	{ Name: 'optional/format', Subfolder: LIB_PATH.join( 'optional', 'format' ), FormatAssertion: true },
];

// The sets the unit test asserts. ***A set is claimed by adding it here, and by nothing
// else.*** Claim a set when the report shows it fully passing; from then on a case failing
// in it is a regression which makes npm test red. Each entry names a draft (DRAFTS) and a
// set (SETS).
//
// A claim may carry Except: cases in the set which ***cannot*** pass here, each with the
// reason, named by File and Group. An excepted case is asserted to fail, so that the day it
// starts passing the exception is noticed and removed, which is the parity report's rule
// for a gap test the engine already satisfies.
const CLAIMED = [
	{ Draft: '2020-12', Set: 'required' },
	{ Draft: '2020-12', Set: 'optional' },
	{ Draft: '2020-12', Set: 'optional/format' },
	{ Draft: '2019-09', Set: 'required' },
	{ Draft: '2019-09', Set: 'optional' },
	{ Draft: '2019-09', Set: 'optional/format' },
	{ Draft: 'draft-07', Set: 'required' },
	{ Draft: 'draft-07', Set: 'optional' },
	{ Draft: 'draft-07', Set: 'optional/format' },
	{ Draft: 'draft-04', Set: 'required' },
	{
		Draft: 'draft-04', Set: 'optional',
		Except: [
			{
				File: 'zeroTerminatedFloats',
				Group: 'some languages do not distinguish between different types of numeric value',
				Reason: 'Javascript has one number type, so 1.0 and 1 are the same value and both are integers.',
			},
		],
	},
	{ Draft: 'draft-04', Set: 'optional/format' },
];


//---------------------------------------------------------------------
// The exception a claimed case falls under, or null.
function FindException( Case )
{
	for ( let index = 0; index < CLAIMED.length; index++ )
	{
		let claim = CLAIMED[ index ];
		if ( ( claim.Draft !== Case.Draft ) || ( claim.Set !== Case.Set ) || !claim.Except ) { continue; }
		for ( let except_index = 0; except_index < claim.Except.length; except_index++ )
		{
			let except = claim.Except[ except_index ];
			if ( ( except.File === Case.File ) && ( except.Group === Case.Group ) ) { return except; }
		}
	}
	return null;
}


//---------------------------------------------------------------------
// Finds a draft by its Name, or throws.
function FindDraft( Name )
{
	for ( let index = 0; index < DRAFTS.length; index++ )
	{
		if ( DRAFTS[ index ].Name === Name ) { return DRAFTS[ index ]; }
	}
	throw new Error( `Unknown draft [${Name}].` );
}


//---------------------------------------------------------------------
// Finds a set by its Name, or throws.
function FindSet( Name )
{
	for ( let index = 0; index < SETS.length; index++ )
	{
		if ( SETS[ index ].Name === Name ) { return SETS[ index ]; }
	}
	throw new Error( `Unknown set [${Name}].` );
}


//---------------------------------------------------------------------
// Lists the case files of one draft at one level, without descending. The suite keeps
// optional/ beneath the required cases and format/ beneath optional/, and each is its own set.
function list_files( Draft, Set )
{
	let folder = LIB_PATH.join( SUITE, 'tests', Draft.Folder, Set.Subfolder );
	if ( LIB_FS.existsSync( folder ) === false ) { return []; }
	let names = LIB_FS.readdirSync( folder );
	let files = [];
	for ( let index = 0; index < names.length; index++ )
	{
		let name = names[ index ];
		if ( name.endsWith( '.json' ) === false ) { continue; }
		let filename = LIB_PATH.join( folder, name );
		if ( LIB_FS.statSync( filename ).isDirectory() ) { continue; }
		files.push( { Name: name.replace( /\.json$/, '' ), Filename: filename } );
	}
	files.sort( function ( A, B ) { return A.Name.localeCompare( B.Name ); } );
	return files;
}


//---------------------------------------------------------------------
// Loads every case of one draft at one level. A case is one test of one group of one file:
// the group carries the schema, the test carries the instance and whether it is valid.
function LoadCases( DraftName, SetName )
{
	let draft = FindDraft( DraftName );
	let set = FindSet( SetName );
	let files = list_files( draft, set );
	let cases = [];
	for ( let file_index = 0; file_index < files.length; file_index++ )
	{
		let file = files[ file_index ];
		let groups = JSON.parse( LIB_FS.readFileSync( file.Filename, 'utf8' ) );
		for ( let group_index = 0; group_index < groups.length; group_index++ )
		{
			let group = groups[ group_index ];
			for ( let test_index = 0; test_index < group.tests.length; test_index++ )
			{
				let test = group.tests[ test_index ];
				cases.push( {
					Draft: draft.Name,
					Set: set.Name,
					File: file.Name,
					Group: group.description,
					Schema: group.schema,
					Description: test.description,
					Data: test.data,
					Valid: test.valid,
					FormatAssertion: set.FormatAssertion,
				} );
			}
		}
	}
	return cases;
}


//---------------------------------------------------------------------
// Builds the registry of remote schemas: every JSON file under remotes/, keyed by the URI the
// cases reach it at. Read once and cached, since every case shares it.
let REMOTES = null;
function LoadRemotes()
{
	if ( REMOTES ) { return REMOTES; }
	REMOTES = {};
	function walk( Folder, Prefix )
	{
		let names = LIB_FS.readdirSync( Folder );
		for ( let index = 0; index < names.length; index++ )
		{
			let name = names[ index ];
			let filename = LIB_PATH.join( Folder, name );
			if ( LIB_FS.statSync( filename ).isDirectory() )
			{
				walk( filename, Prefix + name + '/' );
				continue;
			}
			if ( name.endsWith( '.json' ) === false ) { continue; }
			REMOTES[ REMOTES_BASE + Prefix + name ] = JSON.parse( LIB_FS.readFileSync( filename, 'utf8' ) );
		}
	}
	walk( LIB_PATH.join( SUITE, 'remotes' ), '' );
	return REMOTES;
}


//---------------------------------------------------------------------
// Runs one case and says whether the engine agreed with it.
//
// Passed is the whole answer; Reason says why it did not pass, for a report to print. A case
// asks one question - is this instance valid under this schema - so the evaluator's findings
// are reduced to that and nothing else is compared.
function RunCase( Engine, Case )
{
	if ( typeof Engine.ValidateDocument !== 'function' )
	{
		return { Passed: false, Reason: 'ValidateDocument is not built.' };
	}
	let findings = null;
	try
	{
		findings = Engine.ValidateDocument( Case.Data, Case.Schema, {
			Dialect: Case.Draft,
			Registry: LoadRemotes(),
			FormatAssertion: Case.FormatAssertion,
		} );
	}
	catch ( error )
	{
		return { Passed: false, Reason: `threw: ${error.message}` };
	}
	if ( Array.isArray( findings ) === false )
	{
		return { Passed: false, Reason: `ValidateDocument returned [${typeof findings}] rather than an array.` };
	}
	let valid = ( findings.length === 0 );
	if ( valid === Case.Valid ) { return { Passed: true, Reason: '' }; }
	if ( Case.Valid )
	{
		let first = findings[ 0 ];
		let where = ( first && first.keywordLocation ) ? ` at ${first.keywordLocation}` : '';
		let what = ( first && first.error ) ? `: ${first.error}` : '';
		return { Passed: false, Reason: `expected valid, refused${where}${what}` };
	}
	return { Passed: false, Reason: 'expected invalid, accepted' };
}


//---------------------------------------------------------------------
module.exports = {
	DRAFTS: DRAFTS,
	SETS: SETS,
	CLAIMED: CLAIMED,
	FindException: FindException,
	FindDraft: FindDraft,
	FindSet: FindSet,
	LoadCases: LoadCases,
	LoadRemotes: LoadRemotes,
	RunCase: RunCase,
};
