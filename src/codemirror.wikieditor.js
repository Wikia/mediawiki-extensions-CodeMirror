import CodeMirror from './codemirror';
import { EditorSelection, Extension } from '@codemirror/state';
import { search, openSearchPanel } from '@codemirror/search';
import { EditorView } from '@codemirror/view';
import { LanguageSupport } from '@codemirror/language';

/**
 * CodeMirror integration with
 * [WikiEditor](https://www.mediawiki.org/wiki/Special:MyLanguage/Extension:WikiEditor).
 *
 * Use this class if you want WikiEditor's toolbar. If you don't need the toolbar,
 * using {@link CodeMirror} directly will be considerably more efficient.
 *
 * @extends CodeMirror
 */
class CodeMirrorWikiEditor extends CodeMirror {
	/**
	 * @constructor
	 * @param {jQuery} $textarea The textarea to replace with CodeMirror.
	 * @param {LanguageSupport|Extension} langExtension Language support and its extension(s).
	 * @stable to call and override
	 */
	constructor( $textarea, langExtension ) {
		super( $textarea );
		/**
		 * Language support and its extension(s).
		 * @type {LanguageSupport|Extension}
		 */
		this.langExtension = langExtension;
		/**
		 * Whether CodeMirror is currently enabled.
		 * @type {boolean}
		 */
		this.useCodeMirror = mw.user.options.get( 'usecodemirror' ) > 0;
	}

	/**
	 * @inheritDoc
	 */
	setCodeMirrorPreference( prefValue ) {
		// Save state for function updateToolbarButton()
		this.useCodeMirror = prefValue;
		super.setCodeMirrorPreference( prefValue );
	}

	/**
	 * Replaces the default textarea with CodeMirror.
	 *
	 * @fires CodeMirrorWikiEditor~'ext.CodeMirror.switch'
	 * @stable to call
	 */
	enableCodeMirror() {
		// If CodeMirror is already loaded, abort.
		if ( this.view ) {
			return;
		}

		const selectionStart = this.$textarea.prop( 'selectionStart' ),
			selectionEnd = this.$textarea.prop( 'selectionEnd' ),
			scrollTop = this.$textarea.scrollTop(),
			hasFocus = this.$textarea.is( ':focus' );

		/*
		 * Default configuration, which we may conditionally add to later.
		 * @see https://codemirror.net/docs/ref/#state.Extension
		 */
		const extensions = [
			this.defaultExtensions,
			this.langExtension,
			search( { top: true } ),
			EditorView.domEventHandlers( {
				blur: () => this.$textarea.triggerHandler( 'blur' ),
				focus: () => this.$textarea.triggerHandler( 'focus' ),
				keydown( event, view ) {
					if ( event.key === 'Tab' ) {
						event.preventDefault();
						const $nextInput = $( '#wpSummary' );
						if ( $nextInput.length ) {
							$nextInput.trigger( 'focus' );
						}
					}
					if ( event.key === 'Shift' ) {
						event.preventDefault();
						const cursorPos = view.state.selection.main.head;
						const coords = view.coordsAtPos( cursorPos );
						const editorView = view.dom.getBoundingClientRect();

						if ( coords.top < editorView.top || coords.top > editorView.bottom ) {
							$( view.dom ).textSelection( 'scrollToCaretPosition' );
						}
					}
					return false;
				}
			} ),
			EditorView.lineWrapping
		];

		this.initialize( extensions );

		$( '.group-search a' ).on( 'click', () => {
			openSearchPanel( this.view );
		} );
		// Sync scroll position, selections, and focus state.

		this.view.scrollDOM.scrollTop = scrollTop;
		this.view.scrollDOM.style.height = `${ this.$textarea.height() }px`;
		if ( selectionStart !== 0 || selectionEnd !== 0 ) {
			const range = EditorSelection.range( selectionStart, selectionEnd ),
				scrollEffect = EditorView.scrollIntoView( range );
			scrollEffect.value.isSnapshot = true;
			this.view.dispatch( {
				selection: EditorSelection.create( [ range ] ),
				effects: scrollEffect
			} );
		}
		if ( hasFocus ) {
			this.view.focus();
		}

		/**
		 * Called after CodeMirror is enabled or disabled in WikiEditor.
		 *
		 * @event CodeMirrorWikiEditor~'ext.CodeMirror.switch'
		 * @param {boolean} enabled Whether CodeMirror is enabled.
		 * @param {jQuery} $textarea The current "editor", either the
		 *   original textarea or the `.cm-editor` element.
		 * @stable to use
		 */
		mw.hook( 'ext.CodeMirror.switch' ).fire( true, $( this.view.dom ) );
	}

	/**
	 * Adds the CodeMirror button to WikiEditor.
	 *
	 * @stable to call
	 */
	addCodeMirrorToWikiEditor() {
		const context = this.$textarea.data( 'wikiEditor-context' );
		const toolbar = context && context.modules && context.modules.toolbar;

		// Guard against something having removed WikiEditor (T271457)
		if ( !toolbar ) {
			return;
		}

		this.$textarea.wikiEditor(
			'addToToolbar',
			{
				section: 'main',
				groups: {
					codemirror: {
						tools: {
							CodeMirror: {
								label: mw.msg( 'codemirror-toggle-label' ),
								type: 'toggle',
								oouiIcon: 'highlight',
								action: {
									type: 'callback',
									execute: () => this.switchCodeMirror()
								}
							}
						}
					}
				}
			}
		);

		const $codeMirrorButton = toolbar.$toolbar.find( '.tool[rel=CodeMirror]' );
		$codeMirrorButton.attr( 'id', 'mw-editbutton-codemirror' );

		// Hide non-applicable buttons until WikiEditor better supports a read-only mode (T188817).
		if ( this.readOnly ) {
			this.$textarea.data( 'wikiEditor-context' ).$ui.addClass( 'ext-codemirror-readonly' );
		}

		if ( this.useCodeMirror ) {
			this.enableCodeMirror();
		}
		this.updateToolbarButton();

		this.logUsage( {
			editor: 'wikitext',
			enabled: this.useCodeMirror,
			toggled: false,
			// eslint-disable-next-line no-jquery/no-global-selector,camelcase
			edit_start_ts_ms: parseInt( $( 'input[name="wpStarttime"]' ).val(), 10 ) * 1000 || 0
		} );
	}

	/**
	 * Updates CodeMirror button on the toolbar according to the current state (on/off).
	 *
	 * @private
	 */
	updateToolbarButton() {
		// eslint-disable-next-line no-jquery/no-global-selector
		const $button = $( '#mw-editbutton-codemirror' );
		$button.toggleClass( 'mw-editbutton-codemirror-active', this.useCodeMirror );

		// WikiEditor2010 OOUI ToggleButtonWidget
		if ( $button.data( 'setActive' ) ) {
			$button.data( 'setActive' )( this.useCodeMirror );
		}
	}

	/**
	 * Enables or disables CodeMirror.
	 *
	 * @fires CodeMirrorWikiEditor~'ext.CodeMirror.switch'
	 * @stable to call
	 */
	switchCodeMirror() {
		if ( this.view ) {
			this.setCodeMirrorPreference( false );
			const scrollTop = this.view.scrollDOM.scrollTop;
			const hasFocus = this.view.hasFocus;
			const { from, to } = this.view.state.selection.ranges[ 0 ];
			$( this.view.dom ).textSelection( 'unregister' );
			this.$textarea.textSelection( 'unregister' );
			this.$textarea.val( this.view.state.doc.toString() );
			this.view.destroy();
			this.view = null;
			this.textSelection = null;
			this.$textarea.show();
			if ( hasFocus ) {
				this.$textarea.trigger( 'focus' );
			}
			this.$textarea.prop( 'selectionStart', Math.min( from, to ) )
				.prop( 'selectionEnd', Math.max( to, from ) );
			this.$textarea.scrollTop( scrollTop );
			mw.hook( 'ext.CodeMirror.switch' ).fire( false, this.$textarea );
		} else {
			this.enableCodeMirror();
			this.setCodeMirrorPreference( true );
		}
		this.updateToolbarButton();

		this.logUsage( {
			editor: 'wikitext',
			enabled: this.useCodeMirror,
			toggled: true,
			// eslint-disable-next-line no-jquery/no-global-selector,camelcase
			edit_start_ts_ms: parseInt( $( 'input[name="wpStarttime"]' ).val(), 10 ) * 1000 || 0
		} );
	}
}

export default CodeMirrorWikiEditor;
