if ( mw.config.get( 'skin' ) !== 'fandommobile' ) {
	require( '../ext.CodeMirror.data.js' );

	const urlParams = new URLSearchParams( window.location.search );

	if ( mw.config.get( 'extCodeMirrorConfig' ).useV6 || urlParams.get( 'cm6enable' ) ) {
		mw.libs.ve.targetLoader.addPlugin( () => mw.loader.using( 'ext.CodeMirror.v6.visualEditor' ) );
	} else {
		mw.libs.ve.targetLoader.addPlugin( () => mw.loader.using( 'ext.CodeMirror.visualEditor' ) );
	}
}
