import CodeMirror from './codemirror';
import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView, drawSelection, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { bracketMatching, LanguageSupport } from '@codemirror/language';

/**
 * @class CodeMirrorWikiEditor
 * @property {LanguageSupport|Extension} langExtension
 * @property {Function|null} editRecoveryHandler
 * @property {boolean} useCodeMirror
 */
export default class CodeMirrorWikiEditor extends CodeMirror {
	/**
	 * @constructor
	 * @param {jQuery} $textarea
	 * @param {LanguageSupport|Extension} langExtension
	 */
	constructor( $textarea, langExtension ) {
		super( $textarea );
		this.langExtension = langExtension;
		this.editRecoveryHandler = null;
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
	 * Replaces the default textarea with CodeMirror
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
			...this.defaultExtensions,
			this.langExtension,
			bracketMatching(),
			history(),
			// See also the default attributes at contentAttributesExtension() in the parent class.
			EditorView.contentAttributes.of( {
				spellcheck: 'true'
			} ),
			EditorView.domEventHandlers( {
				blur: () => this.$textarea.triggerHandler( 'blur' ),
				focus: () => this.$textarea.triggerHandler( 'focus' )
			} ),
			EditorView.updateListener.of( ( update ) => {
				if ( update.docChanged && typeof this.editRecoveryHandler === 'function' ) {
					this.editRecoveryHandler();
				}
			} ),
			EditorView.lineWrapping,
			EditorState.allowMultipleSelections.of( true ),
			drawSelection(),
			keymap.of( [
				...defaultKeymap,
				...searchKeymap,
				...historyKeymap
			] )
		];

		mw.hook( 'editRecovery.loadEnd' ).add( ( data ) => {
			this.editRecoveryHandler = data.fieldChangeHandler;
		} );

		this.initialize( extensions );

		// Sync scroll position, selections, and focus state.
		requestAnimationFrame( () => {
			this.view.scrollDOM.scrollTop = scrollTop;
		} );
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

		mw.hook( 'ext.CodeMirror.switch' ).fire( true, $( this.view.dom ) );
	}

	/**
	 * Adds the CodeMirror button to WikiEditor
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
	 * Updates CodeMirror button on the toolbar according to the current state (on/off)
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
	 * Enables or disables CodeMirror
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
