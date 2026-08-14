

module.exports =
{
	entry: './src/jsongin.js',
	mode: 'production',
	output: {
		path: __dirname,
		filename: `../dist/jsongin.min.js`,

		library: 'jsongin',
		libraryTarget: 'umd',

		// Fix to get umd to work; see: https://github.com/webpack/webpack/issues/6784
		globalObject: 'typeof self !== \'undefined\' ? self : this',

	},

	// This bundle is the browser artifact advertised by readme.md and Usage-Browser.md,
	// so it is built for the web. It was previously built with target: 'node', which is
	// wrong for a file served to a browser from unpkg.
	//
	// There is nothing to exclude from the bundle: src/ requires no Node built-ins and
	// the library has no runtime dependencies. The only non-source require is
	// ../package.json, which webpack inlines. The webpack-node-externals entry that used
	// to sit here was a no-op for exactly that reason.
	target: 'web',
};
