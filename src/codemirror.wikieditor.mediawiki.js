import { Prec, StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
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

function registerKeyDownHandler( handler ) {
	const keyHandler = EditorView.domEventHandlers( {
		keydown: ( event, view ) => {
			return handler( event, view );
		}
	} );

	window.WikiEditorCodeMirror.view.dispatch( {
		effects: StateEffect.appendConfig.of( Prec.high( keyHandler ) )
	} );
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
