import { StateEffect, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import CodeMirrorWikiEditor from './codemirror.wikieditor';
import mediaWikiLang from './codemirror.mode.mediawiki';

if ( mw.loader.getState( 'ext.wikiEditor' ) ) {
	mw.hook( 'wikiEditor.toolbarReady' ).add( ( $textarea ) => {
		const cmWE = window.WikiEditorCodeMirror = new CodeMirrorWikiEditor(
			$textarea,
			mediaWikiLang( { bidiIsolation: $textarea.attr( 'dir' ) === 'rtl' } )
		);
		cmWE.addCodeMirrorToWikiEditor();
	} );
}

function toggleKeymaps() {
	const compartment = new Compartment();
	const keymaps = keymap.of( [
		defaultKeymap,
		historyKeymap,
		searchKeymap
	] );

	const on = compartment.get( window.WikiEditorCodeMirror.view.state ) == keymaps;
	window.WikiEditorCodeMirror.view.dispatch( {
		effects: compartment.reconfigure( on ? [] : keymaps )
	} );
}

function registerKeyDownHandler( handler ) {
	const keyHandler = EditorView.domEventHandlers( {
		keydown: ( event, view ) => {
			return handler( event, view );
		}
	} );

	window.WikiEditorCodeMirror.view.dispatch( {
		effects: StateEffect.appendConfig.of( keyHandler )
	} );
	toggleKeymaps();
}

function registerScrollHandler( handler ) {
	const scrollHandler = EditorView.domEventHandlers( {
		scroll: ( event, view ) => {
			return handler( event, view );
		}
	} );

	window.WikiEditorCodeMirror.view.dispatch( {
		effects: StateEffect.appendConfig.of( scrollHandler )
	} );
}

window.registerCodeMirrorKeyHandler = registerKeyDownHandler;
window.registerCodeMirrorScrollHandler = registerScrollHandler;
