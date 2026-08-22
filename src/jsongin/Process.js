'use strict';

module.exports = function ( jsongin )
{

	//---------------------------------------------------------------------
	// The process runtime: four functions from one run to the next.
	//
	// ***The engine holds nothing between calls.*** A process is a document describing work,
	// a run is a value describing how far that work has got, and every function here takes
	// both and returns a new run. That is what makes two runs independent of each other, what
	// lets a run be written down and picked up an hour later somewhere else, and what keeps
	// the whole thing testable without a clock or a server.
	//
	// ***The process is passed alongside the run, never carried inside it.*** A run carries
	// only the process's Name, as a stamp: it cannot rebuild the process and is not meant to.
	// It is there so that stepping a stored run against the wrong process fails at the first
	// call instead of computing a wrong answer quietly.
	//
	// ***Nothing here throws.*** A failure is a run with Status 'failed' and an Error on it,
	// because the point of the design is that a run is a value which can be stored and looked
	// at later - and an error which vanished into a throw could not be. An operator still
	// throws, the way every other operator in this engine does; the throw is caught here and
	// turned into a failed run at the cursor which raised it.


	// The step budget ProcessExecute uses when the caller does not name one. A process which
	// can loop can loop forever, and a function which never returns is worse than one which
	// fails. ProcessStep needs no budget: one step cannot loop.
	const DEFAULT_MAX_STEPS = 1000;

	// A cursor pairs an index with a branch name, so it is always an odd length: [ 1 ] is a
	// top level step and [ 1, 'Then', 0 ] is the first step of a branch of it. This guards
	// the walk below against a cursor which has been edited by hand into something else.
	const CURSOR_LIMIT = 1000;


	//---------------------------------------------------------------------
	// Builds a run. The optional fields are left off rather than set to undefined.
	//
	// ***That is a storage requirement, not a tidiness preference.*** Format drops a field
	// whose value is undefined and Parse does not put it back, so a run carrying
	// `Result: undefined` would not survive being written down - and a run which cannot be
	// written down and read back is not a run. build/process-check.js rule 1 is what says so.
	function new_run( Name, Status, Cursor, State, Scope, Extra )
	{
		let run = {
			Process: Name,
			Status: Status,
			Cursor: Cursor,
			State: State,
			Scope: Scope,
		};
		if ( jsongin.ShortType( Extra ) === 'o' )
		{
			let keys = Object.keys( Extra );
			for ( let index = 0; index < keys.length; index++ )
			{
				let key = keys[ index ];
				if ( typeof Extra[ key ] === 'undefined' ) { continue; }
				run[ key ] = Extra[ key ];
			}
		}
		return run;
	}


	//---------------------------------------------------------------------
	// The name a process is known by, or null for a process which has none.
	function process_name( Process )
	{
		if ( jsongin.ShortType( Process ) !== 'o' ) { return null; }
		if ( jsongin.ShortType( Process.Name ) !== 's' ) { return null; }
		return Process.Name;
	}


	//---------------------------------------------------------------------
	// A fresh pipeline scope in its stored form.
	//
	// ***$$NOW is read once, here, and carried by the run from then on.*** A resumed run keeps
	// the instant it started with, the way every document of one aggregation pipeline sees the
	// same one. This is why the date had to survive storage before any of this could be built.
	function new_scope()
	{
		return jsongin.Scope.ToJSON( jsongin.Scope.NewPipeline() );
	}


	//---------------------------------------------------------------------
	// The frame chain a step is evaluated against. A run whose scope is missing or unreadable
	// gets a fresh one rather than failing, because a scope is a convenience the run carries
	// and not the run itself.
	function scope_of( Run )
	{
		try
		{
			let scope = jsongin.Scope.FromJSON( Run.Scope );
			if ( scope === null ) { return jsongin.Scope.NewPipeline(); }
			return scope;
		}
		catch ( error )
		{
			return jsongin.Scope.NewPipeline();
		}
	}


	//---------------------------------------------------------------------
	// Builds a failed run, defensively: this is reached with runs which are malformed, so
	// nothing on the one passed in can be assumed to be there.
	function failed_run( Process, Run, Code, Message, Cursor )
	{
		let name = process_name( Process );
		let cursor = Cursor;
		if ( jsongin.ShortType( cursor ) !== 'a' ) { cursor = []; }

		let state = {};
		let scope = null;
		if ( jsongin.ShortType( Run ) === 'o' )
		{
			if ( jsongin.ShortType( Run.State ) === 'o' ) { state = Run.State; }
			if ( jsongin.ShortType( Run.Scope ) === 'o' ) { scope = Run.Scope; }
		}
		if ( scope === null ) { scope = new_scope(); }

		return new_run( name, 'failed', cursor, state, scope, {
			Error: {
				Code: Code,
				Message: Message,
				Cursor: cursor,
			},
		} );
	}


	//---------------------------------------------------------------------
	// Whether a process is a process at all. Returns a message, or null when it is.
	function check_process( Process )
	{
		if ( jsongin.ShortType( Process ) !== 'o' ) { return `A process must be a document.`; }
		if ( jsongin.ShortType( Process.Steps ) !== 'a' ) { return `A process must have a Steps array.`; }
		return null;
	}


	//---------------------------------------------------------------------
	// Whether a run is shaped as a run, and whether it belongs to this process.
	function check_run( Process, Run )
	{
		if ( jsongin.ShortType( Run ) !== 'o' ) { return `A run must be a document.`; }

		const STATUSES = [ 'ready', 'waiting', 'done', 'failed' ];
		if ( STATUSES.includes( Run.Status ) === false )
		{
			return `A run's Status must be one of [${STATUSES.join( ', ' )}], not [${Run.Status}].`;
		}
		if ( jsongin.ShortType( Run.Cursor ) !== 'a' ) { return `A run's Cursor must be an array.`; }
		if ( jsongin.ShortType( Run.State ) !== 'o' ) { return `A run's State must be a document.`; }

		// The stamp. A process with no name stamps null, and matches only a process with none.
		let expected = process_name( Process );
		let actual = null;
		if ( jsongin.ShortType( Run.Process ) === 's' ) { actual = Run.Process; }
		if ( actual !== expected )
		{
			return `This run belongs to process [${actual}], not to [${expected}].`;
		}

		return null;
	}


	//---------------------------------------------------------------------
	// The list of steps a cursor prefix addresses. The prefix is the cursor without its last
	// index, so it is always an even number of elements: pairs of ( step index, branch name ).
	//
	// Returns null when the prefix addresses nothing, which the callers report as NoSuchStep.
	function list_at( Process, Prefix )
	{
		let list = Process.Steps;
		let index = 0;
		while ( index < Prefix.length )
		{
			let position = Prefix[ index ];
			if ( jsongin.ShortType( position ) !== 'n' ) { return null; }

			let step = list[ position ];
			if ( jsongin.ShortType( step ) !== 'o' ) { return null; }

			let keys = Object.keys( step );
			if ( keys.length !== 1 ) { return null; }

			let args = step[ keys[ 0 ] ];
			if ( jsongin.ShortType( args ) !== 'o' ) { return null; }

			let branch = Prefix[ index + 1 ];
			if ( jsongin.ShortType( branch ) !== 's' ) { return null; }

			let next = args[ branch ];
			if ( jsongin.ShortType( next ) !== 'a' ) { return null; }

			list = next;
			index = index + 2;
		}
		return list;
	}


	//---------------------------------------------------------------------
	// Reads the step a cursor addresses.
	//
	// Three answers rather than two: the step, or 'the cursor is past the end of its branch'
	// which is how a branch finishes, or an error. Only the third is a failure.
	function locate( Process, Cursor )
	{
		if ( Cursor.length === 0 ) { return { Over: true }; }
		if ( ( Cursor.length % 2 ) === 0 )
		{
			return { Error: `A cursor must end with a step index.` };
		}

		let last = Cursor.length - 1;
		let list = list_at( Process, Cursor.slice( 0, last ) );
		if ( list === null ) { return { Error: `The cursor addresses a branch which is not there.` }; }

		let position = Cursor[ last ];
		if ( jsongin.ShortType( position ) !== 'n' ) { return { Error: `A cursor position must be a number.` }; }
		if ( position < 0 ) { return { Error: `A cursor position must not be negative.` }; }
		if ( position >= list.length ) { return { PastEnd: true }; }

		return { Step: list[ position ] };
	}


	//---------------------------------------------------------------------
	// The position of the next step.
	//
	// Increment the last element. If that runs past the end of the branch, drop it along with
	// the branch name above it and increment the element before. Repeat. An empty cursor
	// means the process is over.
	function advance( Process, Cursor )
	{
		let cursor = Cursor.slice();
		let turns = 0;
		while ( ( cursor.length > 0 ) && ( turns < CURSOR_LIMIT ) )
		{
			turns++;
			let last = cursor.length - 1;
			if ( jsongin.ShortType( cursor[ last ] ) !== 'n' ) { return []; }
			cursor[ last ] = cursor[ last ] + 1;

			let list = list_at( Process, cursor.slice( 0, last ) );
			if ( list === null ) { return []; }
			if ( cursor[ last ] < list.length ) { return cursor; }

			cursor.pop();								// the index
			if ( cursor.length > 0 ) { cursor.pop(); }	// the branch name it sat in
		}
		return [];
	}


	//---------------------------------------------------------------------
	// Begins a run.
	//
	// The Input document becomes the State, cloned, so that the caller's document is not the
	// one the process writes to.
	function Start( Process, Input )
	{
		try
		{
			let complaint = check_process( Process );
			if ( complaint !== null ) { return failed_run( null, null, 'BadProcess', complaint, [] ); }

			let state = {};
			let st_input = jsongin.ShortType( Input );
			if ( ( st_input === 'o' ) )
			{
				state = jsongin.SafeClone( Input );
			}
			else if ( ( st_input !== 'u' ) && ( st_input !== 'l' ) )
			{
				return failed_run( Process, null, 'BadRun', `The Input parameter must be a document, not [${st_input}].`, [] );
			}

			return new_run( process_name( Process ), 'ready', [ 0 ], state, new_scope(), null );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'ProcessStart: ' + error.message ); }
			return failed_run( Process, null, 'StepFailed', error.message, [] );
		}
	}


	//---------------------------------------------------------------------
	// Runs one step.
	//
	// ***Stepping a halted run is a no-op rather than an error***, which is what lets Execute
	// below be a plain loop. A copy is returned rather than the run itself, so that no caller
	// ever holds two names for one value.
	function Step( Process, Run )
	{
		try
		{
			let complaint = check_process( Process );
			if ( complaint !== null ) { return failed_run( null, Run, 'BadProcess', complaint, [] ); }

			complaint = check_run( Process, Run );
			if ( complaint !== null ) { return failed_run( Process, Run, 'BadRun', complaint, [] ); }

			if ( Run.Status !== 'ready' ) { return jsongin.SafeClone( Run ); }

			let cursor = Run.Cursor;
			let located = locate( Process, cursor );

			// A cursor past the end of its branch is not an error, it is how a branch ends.
			// Walking out of it here rather than when the branch was entered is what keeps an
			// empty branch, an empty process, and a process which simply ran out of steps all
			// one case.
			let turns = 0;
			while ( located.PastEnd === true )
			{
				turns++;
				if ( turns > CURSOR_LIMIT ) { return failed_run( Process, Run, 'NoSuchStep', `The cursor could not be advanced.`, cursor ); }
				cursor = advance( Process, cursor );
				located = locate( Process, cursor );
			}

			if ( typeof located.Error !== 'undefined' )
			{
				return failed_run( Process, Run, 'NoSuchStep', located.Error, cursor );
			}

			// Running off the end of the top level Steps is the same as { $return: '$$ROOT' }.
			// A process which computes and never says so still hands back the work it did.
			if ( located.Over === true )
			{
				return new_run( Run.Process, 'done', [], Run.State, Run.Scope, { Result: jsongin.SafeClone( Run.State ) } );
			}

			let step = located.Step;
			if ( jsongin.ShortType( step ) !== 'o' )
			{
				return failed_run( Process, Run, 'BadProcess', `A step must be a document, not [${jsongin.ShortType( step )}].`, cursor );
			}

			let keys = Object.keys( step );
			if ( keys.length !== 1 )
			{
				return failed_run( Process, Run, 'BadProcess', `A step must have exactly one key, found [${keys.length}].`, cursor );
			}

			let key = keys[ 0 ];
			let operator = jsongin.StepOperators[ key ];
			if ( typeof operator === 'undefined' )
			{
				return failed_run( Process, Run, 'UnknownOperator', `Unrecognized step operator [${key}].`, cursor );
			}

			// The same argument type check the aggregation and query dispatchers make.
			if ( jsongin.ShortType( operator.ArgTypes ) === 's' )
			{
				let argument_type = jsongin.ShortType( step[ key ] );
				if ( operator.ArgTypes.includes( argument_type ) === false )
				{
					return failed_run( Process, Run, 'StepFailed',
						`Step operator [${key}] does not take an argument of type [${argument_type}]. It takes [${operator.ArgTypes}].`, cursor );
				}
			}

			let outcome = null;
			try
			{
				outcome = operator.Step( Run.State, step[ key ], scope_of( Run ) );
			}
			catch ( error )
			{
				return failed_run( Process, Run, 'StepFailed', error.message, cursor );
			}

			if ( jsongin.ShortType( outcome ) !== 'o' )
			{
				return failed_run( Process, Run, 'StepFailed', `Step operator [${key}] did not report an outcome.`, cursor );
			}

			// 'next' - the state may have changed, and the cursor moves on.
			if ( outcome.Action === 'next' )
			{
				let state = Run.State;
				if ( jsongin.ShortType( outcome.State ) === 'o' ) { state = outcome.State; }
				return new_run( Run.Process, 'ready', advance( Process, cursor ), state, Run.Scope, null );
			}

			// 'enter' - the cursor descends into a branch of this step.
			if ( outcome.Action === 'enter' )
			{
				if ( jsongin.ShortType( outcome.Branch ) !== 's' )
				{
					return failed_run( Process, Run, 'StepFailed', `Step operator [${key}] named no branch to enter.`, cursor );
				}
				let entered = cursor.concat( [ outcome.Branch, 0 ] );
				return new_run( Run.Process, 'ready', entered, Run.State, Run.Scope, null );
			}

			// 'wait' - the cursor stays where it is until ProcessResume moves it.
			if ( outcome.Action === 'wait' )
			{
				if ( jsongin.ShortType( outcome.Waiting ) !== 'o' )
				{
					return failed_run( Process, Run, 'StepFailed', `Step operator [${key}] suspended without saying what for.`, cursor );
				}
				return new_run( Run.Process, 'waiting', cursor, Run.State, Run.Scope, { Waiting: outcome.Waiting } );
			}

			// 'halt' - the run is over. A halt with nothing to report carries no Result, which
			// is what keeps the run storable.
			if ( outcome.Action === 'halt' )
			{
				return new_run( Run.Process, 'done', [], Run.State, Run.Scope, { Result: outcome.Result } );
			}

			return failed_run( Process, Run, 'StepFailed', `Step operator [${key}] reported an unrecognized action [${outcome.Action}].`, cursor );
		}
		catch ( error )
		{
			// Reached only by a defect in this file. It is still a run, because the contract
			// is that this function always returns one.
			if ( jsongin.OpError ) { jsongin.OpError( 'ProcessStep: ' + error.message ); }
			return failed_run( Process, Run, 'StepFailed', error.message, [] );
		}
	}


	//---------------------------------------------------------------------
	// Steps until the run is no longer ready: it finished, failed, or suspended on a call.
	//
	// ***The budget is not optional.*** MaxSteps defaults to 1000 and a caller who expects
	// more says so. This is the only function here which can loop, so it is the only one
	// which needs one.
	function Execute( Process, Run, MaxSteps )
	{
		try
		{
			let limit = DEFAULT_MAX_STEPS;
			if ( jsongin.ShortType( MaxSteps ) === 'n' ) { limit = Math.floor( MaxSteps ); }

			let run = Run;
			let steps = 0;
			while ( jsongin.ShortType( run ) === 'o' )
			{
				if ( run.Status !== 'ready' ) { break; }
				if ( steps >= limit )
				{
					return failed_run( Process, run, 'StepLimitExceeded', `The run did not halt within ${limit} steps.`, run.Cursor );
				}
				run = Step( Process, run );
				steps++;
			}

			// A run which was never ready is still returned as a new value.
			if ( run === Run ) { return Step( Process, Run ); }
			return run;
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'ProcessExecute: ' + error.message ); }
			return failed_run( Process, Run, 'StepFailed', error.message, [] );
		}
	}


	//---------------------------------------------------------------------
	// Hands a waiting run the result of the call it suspended on, or the failure of it.
	//
	// ProcessResume( Process, Run, Result )                  the call succeeded
	// ProcessResume( Process, Run, undefined, Error )        the call failed
	//
	// ***The fourth parameter keeps the host's failure path inside the four named functions***
	// rather than adding a fifth for it.
	function Resume( Process, Run, Result, Error_ )
	{
		try
		{
			let complaint = check_process( Process );
			if ( complaint !== null ) { return failed_run( null, Run, 'BadProcess', complaint, [] ); }

			complaint = check_run( Process, Run );
			if ( complaint !== null ) { return failed_run( Process, Run, 'BadRun', complaint, [] ); }

			if ( Run.Status !== 'waiting' )
			{
				return failed_run( Process, Run, 'ResumeNotWaiting', `A run with Status [${Run.Status}] is not waiting for a result.`, Run.Cursor );
			}

			// The host reporting a failure of the call it was asked to make.
			if ( typeof Error_ !== 'undefined' )
			{
				let code = 'StepFailed';
				let message = '';
				let st_error = jsongin.ShortType( Error_ );
				if ( st_error === 'o' )
				{
					if ( jsongin.ShortType( Error_.Code ) === 's' ) { code = Error_.Code; }
					if ( jsongin.ShortType( Error_.Message ) === 's' ) { message = Error_.Message; }
				}
				else if ( st_error === 'e' ) { message = Error_.message; }
				else { message = String( Error_ ); }
				return failed_run( Process, Run, code, message, Run.Cursor );
			}

			let state = jsongin.SafeClone( Run.State );

			let into = null;
			if ( jsongin.ShortType( Run.Waiting ) === 'o' )
			{
				if ( jsongin.ShortType( Run.Waiting.Into ) === 's' ) { into = Run.Waiting.Into; }
			}
			if ( into !== null )
			{
				// ***A result of nothing removes the field***, the same rule the $addFields
				// stage follows for an expression which produces nothing. Writing undefined
				// into the state would make a run which cannot be written down.
				if ( typeof Result === 'undefined' ) { jsongin.DeleteValue( state, into ); }
				else { jsongin.SetValue( state, into, jsongin.SafeClone( Result ) ); }
			}

			return new_run( Run.Process, 'ready', advance( Process, Run.Cursor ), state, Run.Scope, null );
		}
		catch ( error )
		{
			if ( jsongin.OpError ) { jsongin.OpError( 'ProcessResume: ' + error.message ); }
			return failed_run( Process, Run, 'StepFailed', error.message, [] );
		}
	}


	//---------------------------------------------------------------------
	return {
		Start: Start,
		Step: Step,
		Execute: Execute,
		Resume: Resume,
	};
};
