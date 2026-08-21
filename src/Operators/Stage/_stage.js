'use strict';

/*
	Shared handling for the pipeline stages.
	This is a helper module, not a stage.

	Verified against MongoDB 6.0.1. See
	test/Parity Tests/Aggregate Tests/test-suite/Reshaping Stage Tests.js.
*/

module.exports = function ( jsongin )
{

	// $fill takes a sortBy and validates it exactly the way $top and $bottom do - fields, each
	// given 1 or -1. Borrowed rather than copied, the same way _object.js and _set.js borrow
	// from _arithmetic.js, so the rule is stated once.
	const accumulator = require( '../Accumulator/_accumulator' )( jsongin );

	let helper = {};


	//---------------------------------------------------------------------
	helper.ValidateSortBy = accumulator.ValidateSortBy;


	//---------------------------------------------------------------------
	// Evaluates an expression which has to produce a whole document, for the stages which
	// replace one document with another.
	//
	// ***A missing or non-document result fails the pipeline*** rather than dropping the
	// document, which is why $ifNull is the usual guard on a field which may not be there.
	helper.AsNewRoot = function ( Document, Expression, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'stage.AsNewRoot' );

		let value = jsongin.Evaluate( Document, Expression, Scope.ForDocument( Document ) );

		let short_type = jsongin.ShortType( value );
		if ( short_type !== 'o' )
		{
			throw new Error( `${OperatorName}: requires an expression which produces a document but found a [${short_type}] instead.` );
		}

		return jsongin.SafeClone( value );
	};


	//---------------------------------------------------------------------
	// Validates the argument document of a stage which takes named arguments.
	// Every name in Allowed is required, since no stage here has an optional one.
	helper.ReadArgs = function ( Args, OperatorName, Allowed )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires a document naming [${Allowed.join( '], [' )}].` );
		}

		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( Allowed.includes( keys[ index ] ) === false )
			{
				throw new Error( `${OperatorName}: [${keys[ index ]}] is not an argument of this stage.` );
			}
		}
		for ( let index = 0; index < Allowed.length; index++ )
		{
			if ( ( Allowed[ index ] in Args ) === false )
			{
				throw new Error( `${OperatorName}: requires an argument named [${Allowed[ index ]}].` );
			}
		}

		return Args;
	};


	//---------------------------------------------------------------------
	// Reduces a list of buckets to one document each, the way $group reduces a group.
	//
	// ***A bucket nothing fell into is left out entirely***, rather than reported with a count
	// of zero, which is what MongoDB does and is the opposite of what an empty $group key would
	// suggest. Both bucketing stages follow the rule, so it is written here once.
	//
	// The accumulators are run through the $group stage rather than reimplemented, so that a
	// bucket and a group cannot disagree about what an accumulator means or which of them are
	// recognized.
	helper.ReduceBuckets = function ( Buckets, Accumulators, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'stage.ReduceBuckets' );

		if ( jsongin.ShortType( Accumulators ) !== 'o' )
		{
			throw new Error( `${OperatorName}: requires [output] to be a document of accumulators.` );
		}

		// ***An empty output is allowed***, and answers the _id alone. The two stages disagree
		// about what it means and each settles that before calling here: $bucket takes it
		// literally, and $bucketAuto reads it as no output at all and counts instead.

		let results = [];
		for ( let index = 0; index < Buckets.length; index++ )
		{
			if ( Buckets[ index ].Documents.length === 0 ) { continue; }

			// _id is fixed here rather than computed, so $group is asked for a single group.
			let specification = { _id: null };
			let names = Object.keys( Accumulators );
			for ( let name = 0; name < names.length; name++ )
			{
				specification[ names[ name ] ] = Accumulators[ names[ name ] ];
			}

			let grouped = jsongin.StageOperators.$group.Stage( Buckets[ index ].Documents, specification, Scope );

			// Every named field is present, because $group always writes one - a missing
			// accumulated value becomes a null rather than being left out. This used to guard
			// against an absent field, which $group's own fix made unreachable.
			let reduced = { _id: jsongin.SafeClone( Buckets[ index ].Key ) };
			for ( let name = 0; name < names.length; name++ )
			{
				reduced[ names[ name ] ] = grouped[ 0 ][ names[ name ] ];
			}

			results.push( reduced );
		}

		return results;
	};


	//---------------------------------------------------------------------
	// Splits documents into separate series.
	//
	// Both filling stages work along a series and must not carry anything across from one to
	// the next, so this is written once. With neither a partitionBy nor partitionByFields
	// there is a single partition holding everything.
	//
	// ***partitionBy takes a document rather than a path***, which MongoDB enforces: a bare
	// '$k' is refused for being a string.
	helper.Partitions = function ( Documents, PartitionBy, PartitionFields, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'stage.Partitions' );

		if ( ( PartitionBy === null ) && ( PartitionFields === null ) )
		{
			return [ { Key: null, Documents: Documents } ];
		}

		let partitions = [];
		let index_of = {};

		for ( let index = 0; index < Documents.length; index++ )
		{
			let key = null;
			if ( PartitionBy !== null )
			{
				key = jsongin.Evaluate( Documents[ index ], PartitionBy, Scope.ForDocument( Documents[ index ] ) );
			}
			else
			{
				key = {};
				for ( let field = 0; field < PartitionFields.length; field++ )
				{
					let value = jsongin.GetValue( Documents[ index ], PartitionFields[ field ] );
					if ( typeof value !== 'undefined' ) { key[ PartitionFields[ field ] ] = value; }
				}
			}

			// The short type is part of the key, the same rule $group follows, so values which
			// serialize alike but are of different types do not land in the same partition.
			let text = jsongin.ShortType( key ) + ':' + JSON.stringify( key );
			if ( typeof index_of[ text ] === 'undefined' )
			{
				index_of[ text ] = partitions.length;
				partitions.push( { Key: key, Documents: [] } );
			}
			partitions[ index_of[ text ] ].Documents.push( Documents[ index ] );
		}

		return partitions;
	};


	//---------------------------------------------------------------------
	// Reads and validates the argument document of $fill.
	helper.ReadFillPlan = function ( Args )
	{
		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `$fill: requires a document naming an [output].` );
		}

		const ALLOWED = [ 'partitionBy', 'partitionByFields', 'sortBy', 'output' ];
		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( ALLOWED.includes( keys[ index ] ) === false )
			{
				throw new Error( `$fill: [${keys[ index ]}] is not an argument of this stage.` );
			}
		}
		if ( ( 'output' in Args ) === false ) { throw new Error( `$fill: requires an argument named [output].` ); }
		if ( jsongin.ShortType( Args.output ) !== 'o' )
		{
			throw new Error( `$fill: requires [output] to be a document of fields to fill.` );
		}

		let partition_by = null;
		if ( 'partitionBy' in Args )
		{
			if ( jsongin.ShortType( Args.partitionBy ) !== 'o' )
			{
				throw new Error( `$fill: requires [partitionBy] to be a document but found a [${jsongin.ShortType( Args.partitionBy )}] instead.` );
			}
			partition_by = Args.partitionBy;
		}

		let partition_fields = null;
		if ( 'partitionByFields' in Args )
		{
			if ( jsongin.ShortType( Args.partitionByFields ) !== 'a' )
			{
				throw new Error( `$fill: requires [partitionByFields] to be an array of field names.` );
			}
			partition_fields = Args.partitionByFields;
		}

		let sort_by = null;
		if ( 'sortBy' in Args )
		{
			// ***$fill is more forgiving than $top and $bottom about a direction***, which
			// refuse anything that is not exactly 1 or -1. Here any positive number sorts
			// ascending, so only the shape is checked and Sort() reads the sign.
			if ( jsongin.ShortType( Args.sortBy ) !== 'o' )
			{
				throw new Error( `$fill: requires [sortBy] to be a sort specification document.` );
			}
			sort_by = Args.sortBy;
		}

		let outputs = [];
		let names = Object.keys( Args.output );
		for ( let index = 0; index < names.length; index++ )
		{
			outputs.push( helper.ReadFillOutput( names[ index ], Args.output[ names[ index ] ], sort_by ) );
		}

		return {
			PartitionBy: partition_by,
			PartitionFields: partition_fields,
			SortBy: sort_by,
			Outputs: outputs,
		};
	};


	//---------------------------------------------------------------------
	// Reads one field of a $fill output specification.
	helper.ReadFillOutput = function ( Name, Specification, SortBy )
	{
		if ( jsongin.ShortType( Specification ) !== 'o' )
		{
			throw new Error( `$fill: [output.${Name}] must be a document naming a [value] or a [method].` );
		}

		const ALLOWED = [ 'value', 'method' ];
		let keys = Object.keys( Specification );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( ALLOWED.includes( keys[ index ] ) === false )
			{
				throw new Error( `$fill: [${keys[ index ]}] is not an argument of [output.${Name}].` );
			}
		}

		// ***Exactly one of the two, or neither.*** Naming both is two answers to the same
		// question and is refused; naming neither fills nothing and is allowed.
		if ( ( 'value' in Specification ) && ( 'method' in Specification ) )
		{
			throw new Error( `$fill: [output.${Name}] must name a [value] or a [method], not both.` );
		}

		if ( 'method' in Specification )
		{
			if ( [ 'locf', 'linear' ].includes( Specification.method ) === false )
			{
				throw new Error( `$fill: [${JSON.stringify( Specification.method )}] is not a fill method.` );
			}
			return { Name: Name, Method: Specification.method };
		}

		if ( 'value' in Specification ) { return { Name: Name, Value: Specification.value }; }

		return { Name: Name };
	};


	//---------------------------------------------------------------------
	// Fills one field along one series, in place.
	//
	// ***A null is filled as well as a missing field***, which is unusual and is MongoDB's
	// behavior: almost everywhere else a null is a value.
	helper.FillSeries = function ( Series, Output, SortBy, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'stage.FillSeries' );

		function is_empty( Document )
		{
			let value = jsongin.GetValue( Document, Output.Name );
			return 'lu'.includes( jsongin.ShortType( value ) );
		}

		if ( typeof Output.Method === 'undefined' )
		{
			if ( typeof Output.Value === 'undefined' ) { return; }
			for ( let index = 0; index < Series.length; index++ )
			{
				if ( is_empty( Series[ index ] ) === false ) { continue; }
				jsongin.SetValue( Series[ index ], Output.Name,
					jsongin.Evaluate( Series[ index ], Output.Value, Scope.ForDocument( Series[ index ] ) ) );
			}
			return;
		}

		if ( Output.Method === 'locf' )
		{
			let carried = undefined;
			for ( let index = 0; index < Series.length; index++ )
			{
				if ( is_empty( Series[ index ] ) === false )
				{
					carried = jsongin.GetValue( Series[ index ], Output.Name );
					continue;
				}
				// ***Nothing observed yet becomes a null***, not a field left missing. A
				// method writes its field for every document of the series, whether or not it
				// had anything to write - the same rule $group follows for an accumulator.
				if ( typeof carried === 'undefined' ) { jsongin.SetValue( Series[ index ], Output.Name, null ); continue; }
				jsongin.SetValue( Series[ index ], Output.Name, jsongin.SafeClone( carried ) );
			}
			return;
		}

		// linear. The sortBy field is the axis, so it has to be known and numeric on both
		// sides of a gap, along with the values themselves.
		let axis = Object.keys( SortBy )[ 0 ];

		// ***The axis has to advance.*** Two documents at the same point give the
		// interpolation nothing to divide by, and MongoDB refuses the whole pipeline rather
		// than answering something arbitrary. locf has no such requirement.
		for ( let index = 1; index < Series.length; index++ )
		{
			let previous = jsongin.GetValue( Series[ index - 1 ], axis );
			let current = jsongin.GetValue( Series[ index ], axis );
			if ( jsongin.CompareValues( previous, current ) === 0 )
			{
				throw new Error( `${OperatorName}: [linear] requires the sort field to hold no repeated values.` );
			}
		}
		for ( let index = 0; index < Series.length; index++ )
		{
			if ( is_empty( Series[ index ] ) === false ) { continue; }

			let before = index - 1;
			while ( ( before >= 0 ) && is_empty( Series[ before ] ) ) { before--; }
			let after = index + 1;
			while ( ( after < Series.length ) && is_empty( Series[ after ] ) ) { after++; }

			// ***A gap at either end is written as a null***, since interpolation needs two
			// sides and there is nothing to compute - but the field is still written, the same
			// way locf writes one before anything has been observed.
			if ( ( before < 0 ) || ( after >= Series.length ) )
			{
				jsongin.SetValue( Series[ index ], Output.Name, null );
				continue;
			}

			let x0 = jsongin.GetValue( Series[ before ], axis );
			let x1 = jsongin.GetValue( Series[ after ], axis );
			let x = jsongin.GetValue( Series[ index ], axis );
			let y0 = jsongin.GetValue( Series[ before ], Output.Name );
			let y1 = jsongin.GetValue( Series[ after ], Output.Name );

			if ( ( jsongin.ShortType( x0 ) !== 'n' ) || ( jsongin.ShortType( x1 ) !== 'n' )
				|| ( jsongin.ShortType( x ) !== 'n' )
				|| ( jsongin.ShortType( y0 ) !== 'n' ) || ( jsongin.ShortType( y1 ) !== 'n' ) )
			{
				throw new Error( `${OperatorName}: [linear] requires numbers to interpolate between.` );
			}
			jsongin.SetValue( Series[ index ], Output.Name, y0 + ( ( y1 - y0 ) * ( ( x - x0 ) / ( x1 - x0 ) ) ) );
		}
	};


	//---------------------------------------------------------------------
	// Reads and validates the argument document of $densify.
	helper.ReadDensifyPlan = function ( Args, Scope )
	{
		jsongin.Scope.Require( Scope, 'stage.ReadDensifyPlan' );

		if ( jsongin.ShortType( Args ) !== 'o' )
		{
			throw new Error( `$densify: requires a document naming a [field] and a [range].` );
		}

		const ALLOWED = [ 'field', 'partitionByFields', 'range' ];
		let keys = Object.keys( Args );
		for ( let index = 0; index < keys.length; index++ )
		{
			if ( ALLOWED.includes( keys[ index ] ) === false )
			{
				throw new Error( `$densify: [${keys[ index ]}] is not an argument of this stage.` );
			}
		}
		if ( jsongin.ShortType( Args.field ) !== 's' )
		{
			throw new Error( `$densify: requires a [field] name.` );
		}
		if ( jsongin.ShortType( Args.range ) !== 'o' )
		{
			throw new Error( `$densify: requires a [range].` );
		}

		const RANGE_ALLOWED = [ 'step', 'unit', 'bounds' ];
		let range_keys = Object.keys( Args.range );
		for ( let index = 0; index < range_keys.length; index++ )
		{
			if ( RANGE_ALLOWED.includes( range_keys[ index ] ) === false )
			{
				throw new Error( `$densify: [${range_keys[ index ]}] is not an argument of [range].` );
			}
		}

		let step = Args.range.step;
		if ( ( jsongin.ShortType( step ) !== 'n' ) || ( step <= 0 ) )
		{
			throw new Error( `$densify: requires a [step] greater than zero but found ${JSON.stringify( step )} instead.` );
		}

		let unit = null;
		if ( 'unit' in Args.range )
		{
			// Read against no document, because a densify unit is a constant for the whole
			// stage and cannot vary from one document to the next.
			unit = require( '../Expression/Date/_date' )( jsongin )
				.ReadUnit( {}, Args.range.unit, '$densify', Scope.ForDocument( {} ) );
		}

		let bounds = Args.range.bounds;
		if ( jsongin.ShortType( bounds ) === 's' )
		{
			if ( [ 'full', 'partition' ].includes( bounds ) === false )
			{
				throw new Error( `$densify: [${bounds}] is not a bounds. Use 'full', 'partition', or a pair of values.` );
			}
		}
		else if ( jsongin.ShortType( bounds ) === 'a' )
		{
			if ( bounds.length !== 2 )
			{
				throw new Error( `$densify: an explicit [bounds] must hold exactly two values.` );
			}
		}
		else
		{
			throw new Error( `$densify: requires a [bounds].` );
		}

		let partition_fields = null;
		if ( 'partitionByFields' in Args )
		{
			if ( jsongin.ShortType( Args.partitionByFields ) !== 'a' )
			{
				throw new Error( `$densify: requires [partitionByFields] to be an array of field names.` );
			}
			partition_fields = Args.partitionByFields;
		}

		return {
			Field: Args.field,
			PartitionFields: partition_fields,
			Step: step,
			Unit: unit,
			Bounds: bounds,
		};
	};


	//---------------------------------------------------------------------
	// The smallest and largest value of a field across a set of documents.
	// Returns null when nothing holds the field.
	helper.SeriesRange = function ( Documents, Field, OperatorName ){
		let low = null;
		let high = null;

		for ( let index = 0; index < Documents.length; index++ )
		{
			let value = jsongin.GetValue( Documents[ index ], Field );
			if ( 'lu'.includes( jsongin.ShortType( value ) ) ) { continue; }
			if ( ( low === null ) || ( jsongin.CompareValues( value, low ) < 0 ) ) { low = value; }
			if ( ( high === null ) || ( jsongin.CompareValues( value, high ) > 0 ) ) { high = value; }
		}

		if ( low === null ) { return null; }
		return { Low: low, High: high };
	};


	//---------------------------------------------------------------------
	// Adds the documents one partition is missing.
	helper.DensifyPartition = function ( Partition, Plan, FullRange, OperatorName, Scope )
	{
		jsongin.Scope.Require( Scope, 'stage.DensifyPartition' );

		const date = require( '../Expression/Date/_date' )( jsongin );

		let range = FullRange;
		if ( Plan.Bounds === 'partition' ) { range = helper.SeriesRange( Partition.Documents, Plan.Field, OperatorName ); }
		else if ( jsongin.ShortType( Plan.Bounds ) === 'a' ) { range = { Low: Plan.Bounds[ 0 ], High: Plan.Bounds[ 1 ] }; }

		let results = Partition.Documents.slice();
		if ( range === null ) { return results; }

		// ***The unit and the field's type have to agree.*** A date series cannot be stepped
		// through by a bare number, and a numeric one has no use for a unit.
		let is_date = ( jsongin.ShortType( range.Low ) === 'd' );
		if ( is_date && ( Plan.Unit === null ) )
		{
			throw new Error( `${OperatorName}: a date [field] requires a [unit].` );
		}
		if ( !is_date && ( Plan.Unit !== null ) )
		{
			throw new Error( `${OperatorName}: a [unit] applies to a date [field] only.` );
		}
		if ( !is_date && ( jsongin.ShortType( range.Low ) !== 'n' ) )
		{
			throw new Error( `${OperatorName}: requires a numeric or date [field].` );
		}

		// What the partition already holds, so the series only adds what is missing.
		let present = {};
		for ( let index = 0; index < Partition.Documents.length; index++ )
		{
			let value = jsongin.GetValue( Partition.Documents[ index ], Plan.Field );
			if ( 'lu'.includes( jsongin.ShortType( value ) ) ) { continue; }
			present[ is_date ? value.getTime() : value ] = true;
		}

		// The upper bound is excluded, which is what makes an explicit [ 0, 3 ] stop at 3 and
		// a 'full' range stop at its largest value rather than one step past it.
		let at = range.Low;
		while ( jsongin.CompareValues( at, range.High ) <= 0 )
		{
			let key = is_date ? at.getTime() : at;
			if ( present[ key ] !== true )
			{
				let added = {};
				jsongin.SetValue( added, Plan.Field, is_date ? new Date( at.getTime() ) : at );
				if ( Partition.Key !== null )
				{
					let fields = Object.keys( Partition.Key );
					for ( let field = 0; field < fields.length; field++ )
					{
						jsongin.SetValue( added, fields[ field ], jsongin.SafeClone( Partition.Key[ fields[ field ] ] ) );
					}
				}
				results.push( added );
			}

			if ( is_date ) { at = date.AddUnits( at, Plan.Unit, Plan.Step, undefined, OperatorName ); }
			else { at = at + Plan.Step; }
		}

		return results;
	};


	//---------------------------------------------------------------------
	return helper;
};
