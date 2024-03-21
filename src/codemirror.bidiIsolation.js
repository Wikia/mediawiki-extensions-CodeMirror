import {
	Decoration,
	DecorationSet,
	Direction,
	EditorView,
	PluginSpec,
	ViewPlugin,
	ViewUpdate
} from '@codemirror/view';
import { Prec, RangeSet, RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { mwModeConfig } from './codemirror.mode.mediawiki.config';

/**
 * @type {Decoration}
 */
const isolate = Decoration.mark( {
	class: 'cm-bidi-isolate',
	bidiIsolate: Direction.LTR
} );

/**
 * @param {EditorView} view
 * @return {RangeSet}
 */
function computeIsolates( view ) {
	const set = new RangeSetBuilder();

	for ( const { from, to } of view.visibleRanges ) {
		let startPos;
		syntaxTree( view.state ).iterate( {
			from,
			to,
			enter( node ) {
				// Determine if this is a bracket node (start or end of a tag).
				const isBracket = node.name.split( '_' )
					.some( ( tag ) => [
						mwModeConfig.tags.htmlTagBracket,
						mwModeConfig.tags.extTagBracket
					].includes( tag ) );

				if ( !startPos && isBracket ) {
					// If we find a bracket node, we keep track of the start position.
					startPos = node.from;
				} else if ( isBracket ) {
					// When we find the closing bracket, add the isolate.
					set.add( startPos, node.to, isolate );
					startPos = null;
				}
			}
		} );
	}

	return set.finish();
}

/**
 * @class
 * @property {DecorationSet} isolates
 * @property {Tree} tree
 */
class CodeMirrorBidiIsolation {
	/**
	 * @constructor
	 * @param {EditorView} view
	 */
	constructor( view ) {
		this.isolates = computeIsolates( view );
		this.tree = syntaxTree( view.state );
	}

	/**
	 * @param {ViewUpdate} update
	 */
	update( update ) {
		if ( update.docChanged || update.viewportChanged ||
			syntaxTree( update.state ) !== this.tree
		) {
			this.isolates = computeIsolates( update.view );
			this.tree = syntaxTree( update.state );
		}
	}
}

/**
 * @type {PluginSpec}
 */
const bidiIsolationSpec = {
	provide: ( plugin ) => {
		/**
		 * @param {EditorView} view
		 * @return {DecorationSet}
		 */
		const access = ( view ) => {
			return view.plugin( plugin ) ?
				( view.plugin( plugin ).isolates || Decoration.none ) :
				Decoration.none;
		};

		// Use the lowest precedence to ensure that other decorations
		// don't break up the isolating decorations.
		return Prec.lowest( [
			EditorView.decorations.of( access ),
			EditorView.bidiIsolatedRanges.of( access )
		] );
	}
};

export default ViewPlugin.fromClass( CodeMirrorBidiIsolation, bidiIsolationSpec );
