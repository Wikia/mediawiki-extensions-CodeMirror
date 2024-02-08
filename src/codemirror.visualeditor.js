import { EditorState, Extension } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { bracketMatching } from '@codemirror/language';
import { history } from '@codemirror/commands';

/**
 * @class CodeMirrorVisualEditor
 * @property {ve.ui.Surface} surface
 * @property {EditorView} view
 * @property {EditorState} state
 */
export default class CodeMirrorVisualEditor {
	/**
	 * @constructor
	 * @param {surface} surface VisualEditor Surface
	 */
	constructor( surface, langExtension ) {
		this.surface = surface;
		this.langExtension = langExtension;
		this.view = null;
		this.state = null;
		this.useCodeMirror = mw.user.options.get( 'usecodemirror' ) > 0;
	}

	/**
	 * Extensions here should be applicable to all theoretical uses of CodeMirror in MediaWiki.
	 * Don't assume CodeMirror is used for editing (i.e. "View source" of a protected page).
	 * Subclasses are safe to override this method if needed.
	 *
	 * @see https://codemirror.net/docs/ref/#state.Extension
	 * @return {Extension[]}
	 */
	get defaultExtensions() {
		const extensions = [
			this.contentAttributesExtension
		];
		const namespaces = mw.config.get( 'wgCodeMirrorLineNumberingNamespaces' );

		// Set to [] to disable everywhere, or null to enable everywhere
		if ( !namespaces || namespaces.includes( mw.config.get( 'wgNamespaceNumber' ) ) ) {
			extensions.push( lineNumbers() );
		}
		return extensions;
	}

	/**
	 * This specifies which attributes get added to the .cm-content element.
	 * If you need to add more, add another Extension on initialization for the contentAttributes
	 * Facet in the form of EditorView.contentAttributes.of( {Object} ).
	 * Subclasses are safe to override this method, but attributes here are considered vital.
	 *
	 * @see https://codemirror.net/docs/ref/#view.EditorView^contentAttributes
	 * @return {Extension}
	 */
	get contentAttributesExtension() {
		return EditorView.contentAttributes.of( {
			// use direction and language of the original textbox
			dir: $( this.surface.getView()[ 0 ] ).attr( 'dir' ),
			lang: $( this.surface.getView()[ 0 ] ).attr( 'lang' )
		} );
	}

	/**
	 * Setup CodeMirror and add it to the DOM. This will hide the original textarea.
	 *
	 * @param {Extension[]} extensions
	 * @stable
	 */
	initialize( extensions = this.defaultExtensions ) {
		// Set up the initial EditorState of CodeMirror with contents of the native textarea.
		this.state = EditorState.create( {
			doc: this.surface.getDom(),
			extensions
		} );

		// Add CodeMirror view to the DOM.
		this.view = new EditorView( {
			state: this.state,
			parent: this.surface.getView().$element[ 0 ]
		} );

		mw.hook( 'ext.CodeMirror.switch' ).fire( true, $( this.view.dom ) );
	}

	/**
	 * Log usage of CodeMirror.
	 *
	 * @param {Object} data
	 * @stable
	 */
	logUsage( data ) {
		/* eslint-disable camelcase */
		const event = Object.assign( {
			session_token: mw.user.sessionId(),
			user_id: mw.user.getId()
		}, data );
		const editCountBucket = mw.config.get( 'wgUserEditCountBucket' );
		if ( editCountBucket !== null ) {
			event.user_edit_count_bucket = editCountBucket;
		}
		/* eslint-enable camelcase */
		mw.track( 'event.CodeMirrorUsage', event );
	}

	/**
	 * Save CodeMirror enabled preference.
	 *
	 * @param {boolean} prefValue True, if CodeMirror should be enabled by default, otherwise false.
	 * @stable
	 */
	setCodeMirrorPreference( prefValue ) {
		// Skip for anon users
		if ( mw.user.isAnon() ) {
			return;
		}
		new mw.Api().saveOption( 'usecodemirror', prefValue ? 1 : 0 );
		mw.user.options.set( 'usecodemirror', prefValue ? 1 : 0 );
	}

	/**
	 * Adds CodeMirror to the VisualEditor
	 */
	enableCodeMirror() {
		// If CodeMirror is already loaded, abort.
		if ( this.view ) {
			return;
		}

		/*
		 * Default configuration, which we may conditionally add to later.
		 * @see https://codemirror.net/docs/ref/#state.Extension
		 */
		const extensions = [
			...this.defaultExtensions,
			this.langExtension,
			bracketMatching(),
			history(),
			EditorView.contentAttributes.of( {
				spellcheck: 'true'
			} ),
			EditorView.updateListener.of( ( update ) => {
				if ( update.docChanged && typeof this.editRecoveryHandler === 'function' ) {
					this.editRecoveryHandler();
				}
			} ),
			EditorView.lineWrapping
		];

		mw.hook( 'editRecovery.loadEnd' ).add( ( data ) => {
			this.editRecoveryHandler = data.fieldChangeHandler;
		} );

		const profile = $.client.profile();
		const supportsTransparentText = 'WebkitTextFillColor' in document.body.style &&
			// Disable on Firefox+OSX (T175223)
			!( profile.layout === 'gecko' && profile.platform === 'mac' );

		this.surface.getView().$documentNode.addClass(
			supportsTransparentText ?
				've-ce-documentNode-codeEditor-webkit-hide' :
				've-ce-documentNode-codeEditor-hide'
		);

		this.surface.getView().$documentNode.css( 'padding-left', '1.8em' );
		this.surface.getView().$documentNode.css( 'padding-right', '0.5em' );

		this.initialize( extensions );

		mw.hook( 'ext.CodeMirror.switch' ).fire( true, $( this.view.dom ) );
	}

}
