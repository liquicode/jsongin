'use strict';

module.exports = function ( jsongin )
{
	function ShortType( Value ) // bnsloarefyu
	{
		// proposed type: (z} empty object
		let data_type = ( typeof Value );
		if ( data_type === 'boolean' ) { return 'b'; }
		if ( data_type === 'number' ) 
		{
			// if ( Engine.GetDate( Data ) !== null ) { return 'd'; }
			return 'n';
		}
		if ( data_type === 'string' ) 
		{
			// if ( Engine.GetDate( Data ) !== null ) { return 'd'; }
			return 's';
		}
		if ( data_type === 'object' ) 
		{
			if ( Value === null ) { return 'l'; }
			if ( Array.isArray( Value ) ) { return 'a'; }
			// if ( Engine.GetDate( Data ) !== null ) { return 'd'; }
			if ( Value instanceof RegExp ) { return 'r'; }
			if ( Value instanceof Error ) { return 'e'; }
			return 'o';
		}
		if ( data_type === 'function' ) { return 'f'; }
		if ( data_type === 'symbol' ) { return 'y'; }
		if ( data_type === 'undefined' ) { return 'u'; }
		throw new Error( `Unsupported data type [${data_type}].` );
	};
	return ShortType;
};
