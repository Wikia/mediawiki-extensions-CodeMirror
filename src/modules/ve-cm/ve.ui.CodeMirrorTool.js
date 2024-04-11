/**
 * VisualEditor UserInterface CodeMirror tool.
 *
 * @class
 * @abstract
 * @extends ve.ui.Tool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.CodeMirrorTool = function VeUiCodeMirrorTool() {
	// Parent constructor
	ve.ui.CodeMirrorTool.super.apply( this, arguments );
	this.extCodeMirror = this.toolbar.surface.mirror;

	// Events
	this.toolbar.connect( this, { surfaceChange: 'onSurfaceChange' } );
};

/* Inheritance */

OO.inheritClass( ve.ui.CodeMirrorTool, ve.ui.Tool );

/* Static properties */

ve.ui.CodeMirrorTool.static.name = 'codeMirror';
ve.ui.CodeMirrorTool.static.autoAddToCatchall = false;
ve.ui.CodeMirrorTool.static.title = OO.ui.deferMsg( 'codemirror-toggle-label' );
ve.ui.CodeMirrorTool.static.icon = 'highlight';
ve.ui.CodeMirrorTool.static.group = 'utility';
ve.ui.CodeMirrorTool.static.commandName = 'codeMirror';
ve.ui.CodeMirrorTool.static.deactivateOnSelect = false;

/**
 * @inheritdoc
 */
ve.ui.CodeMirrorTool.prototype.onSelect = function () {
	// Parent method
	ve.ui.CodeMirrorTool.super.prototype.onSelect.apply( this, arguments );
	console.log('where');

	if ( !this.extCodeMirror ) {
		this.extCodeMirror = this.toolbar.surface.mirror;
	}

	var useCodeMirror = !!( this.extCodeMirror && this.extCodeMirror.view );
	this.setActive( useCodeMirror );

	this.extCodeMirror.setCodeMirrorPreference( useCodeMirror );

	this.extCodeMirror.logUsage( {
		editor: 'wikitext-2017',
		enabled: useCodeMirror,
		toggled: true,
		// eslint-disable-next-line camelcase
		edit_start_ts_ms: ( this.toolbar.target.startTimeStamp * 1000 ) || 0
	} );
};

/**
 * @inheritdoc
 */
ve.ui.CodeMirrorTool.prototype.onSurfaceChange = function ( oldSurface, newSurface ) {
	console.log('haha');
	var isDisabled = newSurface.getMode() !== 'source';

	this.setDisabled( isDisabled );
	if ( !isDisabled ) {
		var command = this.getCommand();
		var surface = this.toolbar.getSurface();
		var useCodeMirror = mw.user.options.get( 'usecodemirror' ) > 0;
		command.execute( surface, [ useCodeMirror ] );
		this.setActive( useCodeMirror );

		if ( this.toolbar.target.startTimeStamp ) {
			this.extCodeMirror.logUsage( {
				editor: 'wikitext-2017',
				enabled: useCodeMirror,
				toggled: false,
				// eslint-disable-next-line camelcase
				edit_start_ts_ms: ( this.toolbar.target.startTimeStamp * 1000 ) || 0
			} );
		}
	}
};

ve.ui.CodeMirrorTool.prototype.onUpdateState = function () {};

/* Registration */

ve.ui.toolFactory.register( ve.ui.CodeMirrorTool );

/* Command */

ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'codeMirror', 'codeMirror', 'toggle'
	)
);
