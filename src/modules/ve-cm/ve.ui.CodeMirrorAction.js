import mediaWikiLang from '../../codemirror.mode.mediawiki';
import CodeMirrorVisualEditor from '../../codemirror.visualeditor';

ve.ui.CodeMirrorAction = function VeUiCodeMirrorAction() {
	// Parent constructor
	ve.ui.CodeMirrorAction.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.CodeMirrorAction, ve.ui.Action );

/* Static Properties */

ve.ui.CodeMirrorAction.static.name = 'codeMirror';

/**
 * @inheritdoc
 */
ve.ui.CodeMirrorAction.static.methods = [ 'toggle' ];

/* Methods */

/**
 * @return {boolean}
 */
ve.ui.CodeMirrorAction.static.isLineNumbering = function () {
	// T285660: Backspace related bug on Android browsers as of 2021
	if ( /Android\b/.test( navigator.userAgent ) ) {
		return false;
	}

	var namespaces = mw.config.get( 'wgCodeMirrorLineNumberingNamespaces' );
	// Set to [] to disable everywhere, or null to enable everywhere
	return !namespaces ||
		namespaces.indexOf( mw.config.get( 'wgNamespaceNumber' ) ) !== -1;
};

/**
 * @method
 * @param {boolean} [enable] State to force toggle to, inverts current state if undefined
 * @return {boolean} Action was executed
 */
ve.ui.CodeMirrorAction.prototype.toggle = function ( enable ) {
	var action = this,
		surface = this.surface,
		surfaceView = surface.getView(),
		doc = surface.getModel().getDocument();

	if ( !( surface.mirror && surface.mirror.view ) && enable !== false ) {

		surface.mirror = window.test = new CodeMirrorVisualEditor( surface, mediaWikiLang() );
		surface.mirror.enableCodeMirror();

		/* Events */

		// As the action is regenerated each time, we need to store bound listeners
		// in the mirror for later disconnection.
		surface.mirror.veTransactionListener = action.onDocumentPrecommit.bind( action );

		doc.on( 'precommit', surface.mirror.veTransactionListener );
	} else if ( surface.mirror && enable !== true ) {
		surfaceView.$element.removeClass( 'mw-editfont-monospace' ).addClass( 'mw-editfont-' + mw.user.options.get( 'editfont' ) );

		surfaceView.$documentNode.removeClass(
			've-ce-documentNode-codeEditor-webkit-hide ve-ce-documentNode-codeEditor-hide'
		);

		surfaceView.$documentNode.css( 'padding-left', '' );
		surfaceView.$documentNode.css( 'padding-right', '' );
		surface.mirror.view.destroy();
		surface.mirror.view = null;
	}

	return true;
};

/**
 * Handle select events from the surface model
 *
 * @param {ve.dm.Selection} selection
 */
ve.ui.CodeMirrorAction.prototype.onSelect = function ( selection ) {
	var range = selection.getCoveringRange();

	// Do not re-trigger bracket matching as long as something is selected
	if ( !range || !range.isCollapsed() ) {
		return;
	}

	this.surface.mirror.setSelection( this.getPosFromOffset( range.from ) );
};

/**
 * Handle langChange events from the document view
 */
ve.ui.CodeMirrorAction.prototype.onLangChange = function () {
	const surface = this.surface,
		doc = surface.getView().getDocument(),
		dir = doc.getDir(), lang = doc.getLang();

	surface.mirror.setOption( 'direction', dir );

	// Set the wrapper to the appropriate language (T341342)
	surface.mirror.getWrapperElement().setAttribute( 'lang', lang );
};

ve.ui.CodeMirrorAction.prototype.onDocumentPrecommit = function ( tx ) {
	let offset = 0;
	const replacements = [],
		action = this,
		store = this.surface.getModel().getDocument().getStore(),
		codeMirrorView = this.surface.mirror.view;

	tx.operations.forEach( function ( op ) {
		if ( op.type === 'retain' ) {
			offset += op.length;
		} else if ( op.type === 'replace' ) {
			replacements.push( {
				start: op.type === 'replace' ? action.getPosFromOffset( offset ) : undefined,
				// Don't bother recalculating end offset if not a removal, replaceRange works with just one arg
				end: op.remove.length ? action.getPosFromOffset( offset + op.remove.length ) : undefined,
				data: new ve.dm.ElementLinearData( store, op.insert ).getSourceText()
			} );
			offset += op.remove.length;
		}
	} );

	// Apply replacements in reverse to avoid having to shift offsets
	for ( let i = replacements.length - 1; i >= 0; i-- ) {
		codeMirrorView.dispatch( {
			changes: {
				from: replacements[ i ].start,
				to: replacements[ i ].end,
				insert: replacements[ i ].data
			}
		} );
	}
};

/**
 * Convert a VE offset to a 2D CodeMirror position
 *
 * @param {number} veOffset VE linear model offset
 * @return {Object} Code mirror position, containing 'line' and 'ch' numbers
 */
ve.ui.CodeMirrorAction.prototype.getPosFromOffset = function ( veOffset ) {
	return this.surface.getModel().getSourceOffsetFromOffset( veOffset );
};

/* Registration */
ve.ui.actionFactory.register( ve.ui.CodeMirrorAction );
