'use strict';

module.exports = {


	//---------------------------------------------------------------------
	Compare: function ( TextA, TextB, CaseSensitive = true )
	{
		if ( typeof TextA !== 'string' ) { throw new Error( 'The parameter [TextA] must be a string.' ); }
		if ( typeof TextB !== 'string' ) { throw new Error( 'The parameter [TextB] must be a string.' ); }
		if ( !CaseSensitive )
		{
			TextA = TextA.toLowerCase();
			TextB = TextB.toLowerCase();
		}
		return TextA.localeCompare( TextB );
	},


	//---------------------------------------------------------------------
	FindBetween: function ( Text, StartText, EndText, CaseSensitive = true ) 
	{
		if ( typeof Text !== 'string' ) { throw new Error( 'The parameter [Text] must be a string.' ); }
		if ( ( StartText === undefined ) || ( StartText === null ) ) { StartText = ''; }
		if ( typeof StartText !== 'string' ) { throw new Error( 'The parameter [StartText] must be a string or null.' ); }
		if ( ( EndText === undefined ) || ( EndText === null ) ) { EndText = ''; }
		if ( typeof EndText !== 'string' ) { throw new Error( 'The parameter [EndText] must be a string or null.' ); }

		let work_text = Text;
		if ( !CaseSensitive ) 
		{
			work_text = work_text.toLowerCase();
			StartText = StartText.toLowerCase();
			EndText = EndText.toLowerCase();
		}

		// Find StartText
		let start_text_begin = 0;
		if ( StartText.length ) { start_text_begin = work_text.indexOf( StartText ); }
		if ( start_text_begin < 0 ) { return null; }

		// Find EndText
		let end_text_begin = work_text.length;
		if ( EndText.length ) { end_text_begin = work_text.indexOf( EndText, start_text_begin + StartText.length ); }
		if ( end_text_begin < 0 ) { return null; }

		let found_text = Text.substring( start_text_begin + StartText.length, end_text_begin );
		return found_text;
	},


	//---------------------------------------------------------------------
	Matches: function ( Text, Pattern, CaseSensitive = true ) 
	{
		//FROM: https://stackoverflow.com/a/57527468
		let wildcard_exp = Pattern.replace( /[.+^${}()|[\]\\]/g, '\\$&' ); // regexp escape 
		let regexp_flags = '';
		if ( !CaseSensitive ) { regexp_flags += 'i'; }
		let reg_exp = new RegExp( `^${wildcard_exp.replace( /\*/g, '.*' ).replace( /\?/g, '.' )}$`, regexp_flags );
		return reg_exp.test( Text );
	},


};
