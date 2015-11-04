import { AST_Node, Compressor, TreeWalker } from 'uglify-js';

var compressor = Compressor();

class LocationFixer extends TreeWalker {
	constructor(path) {
		var filename = path.hub.file.opts.filenameRelative;
		super(node => {
			node.start.file = node.end.file = filename;
		});
	}
}

export default ({ types: t }) => ({
	visitor: {
		Program(ast) {
			// Convert to UglifyJS AST
			var uAST = AST_Node.from_mozilla_ast(ast);

			// Fix locations (Babel doesn't insert `loc.source` into nodes for some reason)
			uAST.walk(new LocationFixer(this));

			// Compress
			uAST.figure_out_scope();
			uAST = uAST.transform(compressor);

			// Mangle names
			uAST.figure_out_scope();
			uAST.compute_char_frequency();
			uAST.mangle_names();

			// Convert back to ESTree AST
			return uAST.to_mozilla_ast();
		}
	}
});
