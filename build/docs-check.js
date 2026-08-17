'use strict';

/*
	Checks the documentation for the kinds of defect which are cheap to detect and expensive
	to find by reading.

	Uses only Node's own modules, so this adds no dependency.

	Usage:
		npm run check-docs
		npm run check-docs -- --verbose      (list every finding rather than the first few)

	Three checks are performed:

		fences      Every ```js block must parse as Javascript.
		            A result belongs in a comment, not in a bare expression, so that what sits
		            inside a code fence is code. Enforcing this is what caught a wrong operator
		            name, a missing colon, an array declared with braces, and four headline
		            examples which inverted operator and field.
		            A block which is not Javascript - program output, the shape of a value, a
		            method signature - carries no language tag and is not checked.

		links       Every local markdown link must resolve to a file which exists.
		            A link beginning with '/' resolves from the docs root, the way docsify
		            resolves it. Every other link resolves relative to the file it appears in,
		            which is what docsify's relativePath setting and GitHub both do.

		orphans     Every page under docs/ must be reachable from another page, so that a
		            document cannot be written and then quietly left unlinked.

	Exits with a non-zero status when anything fails, so that a build can depend on it.
*/

const LIB_FS = require( 'fs' );
const LIB_PATH = require( 'path' );
const LIB_VM = require( 'vm' );

const REPO = LIB_PATH.resolve( __dirname, '..' );
const DOCS = LIB_PATH.join( REPO, 'docs' );
const TEMPLATES = LIB_PATH.join( DOCS, 'templates' );

// A page which the site loads directly, rather than reaching through a link.
const ENTRY_POINTS = [ '_sidebar.md', '_coverpage.md', '_404.md' ];

const VERBOSE = process.argv.includes( '--verbose' );
const PREVIEW_COUNT = 12;


//---------------------------------------------------------------------
// Returns every markdown file within a folder.
function find_markdown_files( Folder, Found = [] )
{
	let entries = LIB_FS.readdirSync( Folder, { withFileTypes: true } );
	for ( let index = 0; index < entries.length; index++ )
	{
		let entry = entries[ index ];
		let full_path = LIB_PATH.join( Folder, entry.name );
		if ( entry.isDirectory() )
		{
			find_markdown_files( full_path, Found );
		}
		else if ( entry.name.endsWith( '.md' ) )
		{
			Found.push( full_path );
		}
	}
	return Found;
}


//---------------------------------------------------------------------
// Reads a file as an array of lines. Note that most files here use CRLF endings.
function read_lines( Filename )
{
	return LIB_FS.readFileSync( Filename, 'utf8' ).split( /\r?\n/ );
}


//---------------------------------------------------------------------
// Returns the fenced code blocks of a file, as { Language, Line, Code }.
function find_fences( Filename )
{
	let lines = read_lines( Filename );
	let fences = [];
	let start = -1;
	let language = null;

	for ( let index = 0; index < lines.length; index++ )
	{
		let match = lines[ index ].match( /^\s*```(\w*)\s*$/ );
		if ( match === null ) { continue; }
		if ( start < 0 )
		{
			start = index;
			language = match[ 1 ];
			continue;
		}
		fences.push( {
			Language: language,
			Line: start + 2,
			Code: lines.slice( start + 1, index ).join( '\n' ),
		} );
		start = -1;
		language = null;
	}
	return fences;
}


//---------------------------------------------------------------------
// Returns the link targets found in a file.
function find_links( Filename )
{
	let text = LIB_FS.readFileSync( Filename, 'utf8' );
	let links = [];
	let expression = /\]\(([^)\s]+)\)/g;
	let match = expression.exec( text );
	while ( match !== null )
	{
		links.push( match[ 1 ] );
		match = expression.exec( text );
	}
	return links;
}


//---------------------------------------------------------------------
// Resolves a link target to a path on disk, or null when it addresses somewhere else.
function resolve_link( Filename, Target )
{
	if ( /^(https?:|mailto:|#)/.test( Target ) ) { return null; }
	let target = decodeURIComponent( Target.split( '#' )[ 0 ] );
	if ( target.length === 0 ) { return null; }
	if ( target.startsWith( '/' ) )
	{
		// Root absolute, the way docsify resolves it.
		return LIB_PATH.resolve( DOCS, target.slice( 1 ) );
	}
	return LIB_PATH.resolve( LIB_PATH.dirname( Filename ), target );
}


//---------------------------------------------------------------------
// Every ```js block must parse as Javascript.
function check_fences( Files )
{
	let findings = [];
	let checked = 0;

	for ( let index = 0; index < Files.length; index++ )
	{
		let file = Files[ index ];
		let fences = find_fences( file );
		for ( let fence_index = 0; fence_index < fences.length; fence_index++ )
		{
			let fence = fences[ fence_index ];
			if ( ( fence.Language !== 'js' ) && ( fence.Language !== 'javascript' ) ) { continue; }
			checked++;
			try
			{
				new LIB_VM.Script( fence.Code );
			}
			catch ( error )
			{
				findings.push( {
					Path: LIB_PATH.relative( REPO, file ),
					Line: fence.Line,
					Detail: error.message.split( '\n' )[ 0 ],
				} );
			}
		}
	}
	return { Checked: checked, Findings: findings, Unit: 'js fences' };
}


//---------------------------------------------------------------------
// Every local link must resolve to a file which exists.
function check_links( Files )
{
	let findings = [];
	let checked = 0;

	for ( let index = 0; index < Files.length; index++ )
	{
		let file = Files[ index ];
		let links = find_links( file );
		for ( let link_index = 0; link_index < links.length; link_index++ )
		{
			let target = links[ link_index ];
			let resolved = resolve_link( file, target );
			if ( resolved === null ) { continue; }
			checked++;
			if ( LIB_FS.existsSync( resolved ) ) { continue; }
			findings.push( {
				Path: LIB_PATH.relative( REPO, file ),
				Line: 0,
				Detail: target,
			} );
		}
	}
	return { Checked: checked, Findings: findings, Unit: 'local links' };
}


//---------------------------------------------------------------------
// Every page under docs/ must be reachable from another page.
function check_orphans( Files )
{
	let linked = {};
	for ( let index = 0; index < Files.length; index++ )
	{
		let file = Files[ index ];
		let links = find_links( file );
		for ( let link_index = 0; link_index < links.length; link_index++ )
		{
			let resolved = resolve_link( file, links[ link_index ] );
			if ( resolved !== null ) { linked[ resolved ] = true; }
		}
	}

	let findings = [];
	let checked = 0;
	for ( let index = 0; index < Files.length; index++ )
	{
		let file = Files[ index ];
		if ( !file.startsWith( DOCS ) ) { continue; }
		if ( ENTRY_POINTS.indexOf( LIB_PATH.basename( file ) ) >= 0 ) { continue; }
		checked++;
		if ( linked[ file ] ) { continue; }
		findings.push( {
			Path: LIB_PATH.relative( REPO, file ),
			Line: 0,
			Detail: 'not linked from any page',
		} );
	}
	return { Checked: checked, Findings: findings, Unit: 'pages' };
}


//---------------------------------------------------------------------
// Every operator must carry an /*md block describing its usage.
//
// Operator-Authoring.md presents this as the convention, and a convention nothing enforces
// drifts: it stood at 56 of 85 operators before this check existed, with two whole kinds of
// operator ignoring it entirely. That is the same lesson `OperatorType` and `ArgCount` taught
// when they were deleted for being declared and never read.
//
// Helper modules, whose names begin with an underscore, are not operators and are skipped.
function check_operator_blocks()
{
	let root = LIB_PATH.join( REPO, 'src', 'Operators' );

	function find_operator_files( Folder, Found )
	{
		let entries = LIB_FS.readdirSync( Folder, { withFileTypes: true } );
		for ( let index = 0; index < entries.length; index++ )
		{
			let entry = entries[ index ];
			let full = LIB_PATH.join( Folder, entry.name );
			if ( entry.isDirectory() ) { find_operator_files( full, Found ); continue; }
			if ( !entry.name.endsWith( '.js' ) ) { continue; }
			if ( entry.name.startsWith( '_' ) ) { continue; }
			Found.push( full );
		}
		return Found;
	}

	let files = find_operator_files( root, [] );
	let findings = [];

	for ( let index = 0; index < files.length; index++ )
	{
		let file = files[ index ];
		let text = LIB_FS.readFileSync( file, 'utf8' );
		if ( text.includes( '/*md' ) ) { continue; }
		findings.push( {
			Path: LIB_PATH.relative( REPO, file ),
			Line: 0,
			Detail: 'operator has no /*md block. See docs/guides/Operator-Authoring.md.',
		} );
	}

	return { Checked: files.length, Findings: findings, Unit: 'operators' };
}


//---------------------------------------------------------------------
function report( Name, Result )
{
	let count = Result.Findings.length;
	let status = ( count === 0 ) ? 'ok' : 'FAILED';
	console.log( `${Name.padEnd( 10 )} ${String( Result.Checked ).padStart( 4 )} ${Result.Unit.padEnd( 12 )} ${status}` );
	if ( count === 0 ) { return 0; }

	let shown = VERBOSE ? count : Math.min( count, PREVIEW_COUNT );
	for ( let index = 0; index < shown; index++ )
	{
		let finding = Result.Findings[ index ];
		let where = finding.Line ? `${finding.Path}:${finding.Line}` : finding.Path;
		console.log( `             ${where}` );
		console.log( `               ${finding.Detail}` );
	}
	if ( shown < count )
	{
		console.log( `             ... and ${count - shown} more. Run with --verbose to see them all.` );
	}
	return count;
}


//---------------------------------------------------------------------
function main()
{
	// Templates are excluded. They are generated into place, so their links are checked
	// where the generated file lands rather than where the template sits.
	let doc_files = find_markdown_files( DOCS ).filter(
		function ( Filename ) { return !Filename.startsWith( TEMPLATES ); } );

	let root_files = LIB_FS.readdirSync( REPO )
		.filter( function ( Name ) { return Name.endsWith( '.md' ); } )
		.map( function ( Name ) { return LIB_PATH.join( REPO, Name ); } );

	let all_files = doc_files.concat( root_files );

	console.log( '' );
	let failures = 0;
	failures += report( 'fences', check_fences( all_files ) );
	failures += report( 'links', check_links( all_files ) );
	failures += report( 'orphans', check_orphans( doc_files ) );
	failures += report( 'operators', check_operator_blocks() );
	console.log( '' );

	if ( failures > 0 )
	{
		console.log( `${failures} problem(s) found.` );
		process.exit( 1 );
	}
	console.log( 'Documentation checks passed.' );
	return;
}


main();
