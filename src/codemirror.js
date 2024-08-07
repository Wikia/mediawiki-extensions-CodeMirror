import { EditorState, Extension } from '@codemirror/state';
import {
	EditorView,
	drawSelection,
	lineNumbers,
	highlightSpecialChars,
	keymap,
	rectangularSelection, crosshairCursor
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, redo } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { bracketMatching } from '@codemirror/language';
import CodeMirrorTextSelection from './codemirror.textSelection';

require( '../ext.CodeMirror.data.js' );

/**
 * Interface for the CodeMirror editor.
 *
 * @example
 * mw.loader.using( [
 *   'ext.CodeMirror.v6',
 *   'ext.CodeMirror.v6.mode.mediawiki'
 * ] ).then( ( require ) => {
 *   const CodeMirror = require( 'ext.CodeMirror.v6' );
 *   const mediawikiLang = require( 'ext.CodeMirror.v6.mode.mediawiki' );
 *   const cm = new CodeMirror( myTextarea );
 *   cm.initialize( [ cm.defaultExtensions, mediawikiLang() ] );
 * } );
 */
class CodeMirror {
	/**
	 * Instantiate a new CodeMirror instance.
	 *
	 * @param {HTMLTextAreaElement|jQuery|string} textarea Textarea to add syntax highlighting to.
	 * @constructor
	 */
	constructor( textarea ) {
		/**
		 * The textarea that CodeMirror is bound to.
		 * @type {jQuery}
		 */
		this.$textarea = $( textarea );
		/**
		 * The editor user interface.
		 * @type {EditorView}
		 */
		this.view = null;
		/**
		 * The editor state.
		 * @type {EditorState}
		 */
		this.state = null;
		/**
		 * Whether the textarea is read-only.
		 * @type {boolean}
		 */
		this.readOnly = this.$textarea.prop( 'readonly' );
		/**
		 * The [edit recovery]{@link https://www.mediawiki.org/wiki/Manual:Edit_Recovery} handler.
		 * @type {Function|null}
		 */
		this.editRecoveryHandler = null;
		/**
		 * jQuery.textSelection overrides for CodeMirror.
		 * @type {CodeMirrorTextSelection}
		 */
		this.textSelection = null;
	}

	/**
	 * Default extensions used by CodeMirror.
	 * Extensions here should be applicable to all theoretical uses of CodeMirror in MediaWiki.
	 *
	 * @see https://codemirror.net/docs/ref/#state.Extension
	 * @type {Extension|Extension[]}
	 * @stable to call
	 */
	get defaultExtensions() {
		const extensions = [
			this.contentAttributesExtension,
			this.phrasesExtension,
			this.specialCharsExtension,
			this.heightExtension,
			bracketMatching(),
			EditorState.readOnly.of( this.readOnly ),
			keymap.of( [
				...defaultKeymap,
				...searchKeymap
			] ),
			EditorState.allowMultipleSelections.of( true ),
			drawSelection(),
			rectangularSelection(),
			crosshairCursor()
		];

		// Add extensions relevant to editing (not read-only).
		if ( !this.readOnly ) {
			extensions.push( EditorView.updateListener.of( ( update ) => {
				if ( update.docChanged && typeof this.editRecoveryHandler === 'function' ) {
					this.editRecoveryHandler();
				}
			} ) );
			extensions.push( history() );

			// By default 'ctrl-shift-z' keybinding is used for redo command only on Linux.
			// Make it work also on Windows.
			const modifiedHistoryKeymap = [
				...historyKeymap,
				{
					win: 'Ctrl-Shift-z',
					preventDefault: true,
					run: redo
				}
			];
			extensions.push( keymap.of( modifiedHistoryKeymap ) );
		}

		// Set to [] to disable everywhere, or null to enable everywhere
		const namespaces = mw.config.get( 'extCodeMirrorConfig' ).lineNumberingNamespaces;
		if ( !namespaces || namespaces.includes( mw.config.get( 'wgNamespaceNumber' ) ) ) {
			extensions.push( lineNumbers() );
		}

		return extensions;
	}

	/**
	 * This extension sets the height of the CodeMirror editor to match the textarea.
	 * Override this method to change the height of the editor.
	 *
	 * @type {Extension}
	 * @stable to call and override
	 */
	get heightExtension() {
		return EditorView.theme( {
			'&': {
				height: `${ this.$textarea.outerHeight() }px`
			},
			'.cm-scroller': {
				overflow: 'auto'
			}
		} );
	}

	/**
	 * This specifies which attributes get added to the `.cm-content` and `.cm-editor` elements.
	 * Subclasses are safe to override this method, but attributes here are considered vital.
	 *
	 * @see https://codemirror.net/docs/ref/#view.EditorView^contentAttributes
	 * @type {Extension}
	 * @stable to call and override
	 */
	get contentAttributesExtension() {
		const classList = [];
		// T245568: Sync text editor font preferences with CodeMirror
		const fontClass = Array.from( this.$textarea[ 0 ].classList )
			.find( ( style ) => style.startsWith( 'mw-editfont-' ) );
		if ( fontClass ) {
			classList.push( fontClass );
		}
		// Add colorblind mode if preference is set.
		// This currently is only to be used for the MediaWiki markup language.
		if (
			mw.user.options.get( 'usecodemirror-colorblind' ) &&
			mw.config.get( 'wgPageContentModel' ) === 'wikitext'
		) {
			classList.push( 'cm-mw-colorblind-colors' );
		}

		return [
			// .cm-content element (the contenteditable area)
			EditorView.contentAttributes.of( {
				// T259347: Use accesskey of the original textbox
				accesskey: this.$textarea.attr( 'accesskey' ),
				// Classes need to be on .cm-content to have precedence over .cm-scroller
				class: classList.join( ' ' ),
				spellcheck: 'true'
			} ),
			// .cm-editor element (contains the whole CodeMirror UI)
			EditorView.editorAttributes.of( {
				// Use direction and language of the original textbox.
				// These should be attributes of .cm-editor, not the .cm-content (T359589)
				dir: this.$textarea.attr( 'dir' ),
				lang: this.$textarea.attr( 'lang' )
			} )
		];
	}

	/**
	 * These are all potential messages used in a full-featured CodeMirror setup.
	 * We lump them all here and supply it as default extensions because it is only a small cost
	 * and we don't want localization to be overlooked by CodeMirror clients and subclasses.
	 *
	 * @see https://codemirror.net/examples/translate/
	 * @type {Extension}
	 * @stable to call. Instead of overriding, pass in an additional `EditorState.phrases.of()`
	 *   when calling `initialize()`.
	 */
	get phrasesExtension() {
		return EditorState.phrases.of( {
			Find: mw.msg( 'codemirror-find' ),
			next: mw.msg( 'codemirror-next' ),
			previous: mw.msg( 'codemirror-previous' ),
			all: mw.msg( 'codemirror-all' ),
			'match case': mw.msg( 'codemirror-match-case' ),
			regexp: mw.msg( 'codemirror-regexp' ),
			'by word': mw.msg( 'codemirror-by-word' ),
			replace: mw.msg( 'codemirror-replace' ),
			Replace: mw.msg( 'codemirror-replace-placeholder' ),
			'replace all': mw.msg( 'codemirror-replace-all' ),
			'Control character': mw.msg( 'codemirror-control-character' ),
			'close': mw.msg( 'codemirror-search-done' )
		} );
	}

	/**
	 * We give a small subset of special characters a tooltip explaining what they are.
	 * The messages and for what characters are defined here.
	 * Any character that does not have a message will instead use CM6 defaults,
	 * which is the localization of 'codemirror-control-character' followed by the Unicode number.
	 *
	 * @see https://codemirror.net/docs/ref/#view.highlightSpecialChars
	 * @type {Extension}
	 * @stable to call
	 */
	get specialCharsExtension() {
		// Keys are the decimal unicode number, values are the messages.
		const messages = {
			0: mw.msg( 'codemirror-special-char-null' ),
			7: mw.msg( 'codemirror-special-char-bell' ),
			8: mw.msg( 'codemirror-special-char-backspace' ),
			10: mw.msg( 'codemirror-special-char-newline' ),
			11: mw.msg( 'codemirror-special-char-vertical-tab' ),
			13: mw.msg( 'codemirror-special-char-carriage-return' ),
			27: mw.msg( 'codemirror-special-char-escape' ),
			160: mw.msg( 'codemirror-special-char-nbsp' ),
			8203: mw.msg( 'codemirror-special-char-zero-width-space' ),
			8204: mw.msg( 'codemirror-special-char-zero-width-non-joiner' ),
			8205: mw.msg( 'codemirror-special-char-zero-width-joiner' ),
			8206: mw.msg( 'codemirror-special-char-left-to-right-mark' ),
			8207: mw.msg( 'codemirror-special-char-right-to-left-mark' ),
			8232: mw.msg( 'codemirror-special-char-line-separator' ),
			8237: mw.msg( 'codemirror-special-char-left-to-right-override' ),
			8238: mw.msg( 'codemirror-special-char-right-to-left-override' ),
			8239: mw.msg( 'codemirror-special-char-narrow-nbsp' ),
			8294: mw.msg( 'codemirror-special-char-left-to-right-isolate' ),
			8295: mw.msg( 'codemirror-special-char-right-to-left-isolate' ),
			8297: mw.msg( 'codemirror-special-char-pop-directional-isolate' ),
			8233: mw.msg( 'codemirror-special-char-paragraph-separator' ),
			65279: mw.msg( 'codemirror-special-char-zero-width-no-break-space' ),
			65532: mw.msg( 'codemirror-special-char-object-replacement' )
		};

		return highlightSpecialChars( {
			render: ( code, description, placeholder ) => {
				description = messages[ code ] || mw.msg( 'codemirror-control-character', code );
				const span = document.createElement( 'span' );
				span.className = 'cm-specialChar';

				// Special case non-breaking spaces (T181677).
				if ( code === 160 || code === 8239 ) {
					placeholder = '·';
					span.className = 'cm-special-char-nbsp';
				}

				span.textContent = placeholder;
				span.title = description;
				span.setAttribute( 'aria-label', description );
				return span;
			},
			// Highlight non-breaking spaces (T181677)
			addSpecialChars: /[\u00a0\u202f]/g
		} );
	}

	/**
	 * Setup CodeMirror and add it to the DOM. This will hide the original textarea.
	 *
	 * @param {Extension|Extension[]} [extensions=this.defaultExtensions] Extensions to use.
	 * @fires CodeMirror~'ext.CodeMirror.initialize'
	 * @stable to call and override
	 */
	initialize( extensions = this.defaultExtensions ) {
		/**
		 * Called just before CodeMirror is initialized.
		 * This can be used to manipulate the DOM to suit CodeMirror
		 * (i.e. if you manipulate WikiEditor's DOM, you may need this).
		 *
		 * @event CodeMirror~'ext.CodeMirror.initialize'
		 * @param {jQuery} $textarea The textarea that CodeMirror is bound to.
		 * @stable to use
		 */
		mw.hook( 'ext.CodeMirror.initialize' ).fire( this.$textarea );
		mw.hook( 'editRecovery.loadEnd' ).add( ( data ) => {
			this.editRecoveryHandler = data.fieldChangeHandler;
		} );

		// Set up the initial EditorState of CodeMirror with contents of the native textarea.
		this.state = EditorState.create( {
			doc: this.$textarea.textSelection( 'getContents' ),
			extensions
		} );

		// Add CodeMirror view to the DOM.
		this.view = new EditorView( {
			state: this.state,
			parent: this.$textarea.parent()[ 0 ]
		} );

		// Hide native textarea and sync CodeMirror contents upon submission.
		this.$textarea.hide();
		if ( this.$textarea[ 0 ].form ) {
			this.$textarea[ 0 ].form.addEventListener( 'submit', () => {
				this.$textarea.val( this.view.state.doc.toString() );
				const scrollTop = document.getElementById( 'wpScrolltop' );
				if ( scrollTop ) {
					scrollTop.value = this.view.scrollDOM.scrollTop;
				}
			} );
		}

		// Register $.textSelection() on the .cm-editor element.
		$( this.view.dom ).textSelection( 'register', this.cmTextSelection );
		// Also override textSelection() functions for the "real" hidden textarea to route to
		// CodeMirror. We unregister this when switching to normal textarea mode.
		this.$textarea.textSelection( 'register', this.cmTextSelection );
	}

	/**
	 * Log usage of CodeMirror.
	 *
	 * @param {Object} data
	 * @stable to call
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
	 * @stable to call and override
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
	 * jQuery.textSelection overrides for CodeMirror.
	 *
	 * @see jQuery.fn.textSelection
	 * @type {Object}
	 * @private
	 */
	get cmTextSelection() {
		this.textSelection = new CodeMirrorTextSelection( this.view );

		return {
			getContents: () => this.textSelection.getContents(),
			setContents: ( content ) => this.textSelection.setContents( content ),
			getCaretPosition: ( options ) => this.textSelection.getCaretPosition( options ),
			scrollToCaretPosition: () => this.textSelection.scrollToCaretPosition(),
			getSelection: () => this.textSelection.getSelection(),
			setSelection: ( options ) => this.textSelection.setSelection( options ),
			replaceSelection: ( value ) => this.textSelection.replaceSelection( value ),
			encapsulateSelection: ( options ) => this.textSelection.encapsulateSelection( options )
		};
	}
}

export default CodeMirror;
