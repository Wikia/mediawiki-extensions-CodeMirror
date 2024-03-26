<?php

namespace MediaWiki\Extension\CodeMirror;

use Config;
use EditPage;
use MediaWiki\Extension\Gadgets\GadgetRepo;
use MediaWiki\Hook\EditPage__showEditForm_initialHook;
use MediaWiki\Hook\EditPage__showReadOnlyForm_initialHook;
use MediaWiki\Preferences\Hook\GetPreferencesHook;
use MediaWiki\User\UserOptionsLookup;
use OutputPage;
use User;

/**
 * @phpcs:disable MediaWiki.NamingConventions.LowerCamelFunctionsName.FunctionName
 */
class Hooks implements
	EditPage__showEditForm_initialHook,
	EditPage__showReadOnlyForm_initialHook,
	GetPreferencesHook
{

	private UserOptionsLookup $userOptionsLookup;
	private array $conflictingGadgets;
	private bool $useV6;

	/**
	 * @param UserOptionsLookup $userOptionsLookup
	 * @param Config $config
	 */
	public function __construct(
		UserOptionsLookup $userOptionsLookup,
		Config $config
	) {
		$this->userOptionsLookup = $userOptionsLookup;
		$this->useV6 = $config->get( 'CodeMirrorV6' );
		$this->conflictingGadgets = $config->get( 'CodeMirrorConflictingGadgets' );
	}

	/**
	 * Checks if CodeMirror for textarea wikitext editor should be loaded on this page or not.
	 *
	 * @param OutputPage $out
	 * @param ExtensionRegistry|null $extensionRegistry Overridden in tests.
	 * @return bool
	 */
	public function shouldLoadCodeMirrorForWikiEditor( OutputPage $out, ?ExtensionRegistry $extensionRegistry = null ): bool {
		$extensionRegistry = $extensionRegistry ?: ExtensionRegistry::getInstance();
		// Disable CodeMirror when CodeEditor is active on this page
		// Depends on ext.codeEditor being added by \MediaWiki\EditPage\EditPage::showEditForm:initial
		if ( in_array( 'ext.codeEditor', $out->getModules(), true ) ) {
			return false;
		}
		// Disable CodeMirror when the WikiEditor toolbar is not enabled in preferences
		if ( !$this->userOptionsLookup->getOption( $out->getUser(), 'usebetatoolbar' ) ) {
			return false;
		}
		$extensionRegistry = $extensionRegistry ?: ExtensionRegistry::getInstance();
		$contentModels = $extensionRegistry->getAttribute( 'CodeMirrorContentModels' );
		$isRTL = $out->getTitle()->getPageLanguage()->isRTL();
		// Disable CodeMirror if we're on an edit page with a conflicting gadget. See T178348.
		return !$this->conflictingGadgetsEnabled( $extensionRegistry, $out->getUser() ) &&
			// CodeMirror 5 on textarea wikitext editors doesn't support RTL (T170001)
			( !$isRTL || $this->shouldUseV6( $out ) ) &&
			// Limit to supported content models that use wikitext.
			// See https://www.mediawiki.org/wiki/Content_handlers#Extension_content_handlers
			in_array( $out->getTitle()->getContentModel(), $contentModels );
	}

	/**
	 * Checks if CodeMirror for VisualEditor should be loaded on this page or not.
	 *
	 * @param OutputPage $out
	 * @param ExtensionRegistry|null $extensionRegistry Overridden in tests.
	 * @return bool
	 */
	public function shouldLoadCodeMirrorForVisualEditor( OutputPage $out, ?ExtensionRegistry $extensionRegistry = null ): bool {
		$isVisualEditorPage = $out->getRequest()->getVal( 'veaction' ) === 'editsource';
		$isRTL = $out->getTitle()->getPageLanguage()->isRTL();
		return $isVisualEditorPage && ( !$isRTL || $this->shouldUseV6( $out ) );
	}

	/**
	 * @param ExtensionRegistry $extensionRegistry
	 * @param User $user
	 * @return bool
	 */
	private function conflictingGadgetsEnabled( ExtensionRegistry $extensionRegistry, User $user ): bool {
		if ( !$extensionRegistry->isLoaded( 'Gadgets' ) ) {
			return false;
		}
		// @phan-suppress-next-line PhanUndeclaredClassMethod Code path won't be followed if class doesn't exist.
		$gadgetRepo = GadgetRepo::singleton();
		$conflictingGadgets = array_intersect( $this->conflictingGadgets, $gadgetRepo->getGadgetIds() );
		foreach ( $conflictingGadgets as $conflictingGadget ) {
			try {
				if ( $gadgetRepo->getGadget( $conflictingGadget )->isEnabled( $user ) ) {
					return true;
				}
			} catch ( InvalidArgumentException $e ) {
				// Safeguard for an invalid gadget ID; treat as gadget not enabled.
				continue;
			}
		}
		return false;
	}

	/**
	 * Load CodeMirror if necessary.
	 *
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/EditPage::showEditForm:initial
	 *
	 * @param EditPage $editor
	 * @param OutputPage $out
	 */
	public function onBeforePageDisplay( $out, $skin ): void {
		if ( $this->shouldLoadCodeMirrorForWikiEditor( $out ) ) {
			if ( $this->shouldUseV6( $out ) ) {
				$out->addModules( 'ext.CodeMirror.v6.WikiEditor' );
			} else {
				$out->addModules( 'ext.CodeMirror.WikiEditor' );
			}

			if ( $this->userOptionsLookup->getOption( $out->getUser(), 'usecodemirror' ) ) {
				$out->addModules( [ 'ext.CodeMirror.lib', 'ext.CodeMirror.mode.mediawiki' ] );
			}
		}

		if ( $this->shouldLoadCodeMirrorForVisualEditor( $out ) ) {
			if ( $this->shouldUseV6( $out ) ) {
				$out->addModules( 'ext.CodeMirror.v6.visualEditor.init' );
			} else {
				if ( $this->userOptionsLookup->getOption( $out->getUser(), 'usecodemirror' ) ) {
					$out->addModules( [ 'ext.CodeMirror.lib', 'ext.CodeMirror.mode.mediawiki' ] );
				}
			}
		}
	}

	/**
	 * Load CodeMirror 6 on read-only pages.
	 *
	 * @param EditPage $editor
	 * @param OutputPage $out
	 */
	public function onEditPage__showReadOnlyForm_initial( $editor, $out ): void {
		if ( $this->shouldUseV6( $out ) && $this->shouldLoadCodeMirror( $out ) ) {
			$out->addModules( 'ext.CodeMirror.v6.WikiEditor' );
		}
	}

	/**
	 * @param OutputPage $out
	 * @return bool
	 * @todo Remove check for cm6enable flag after migration is complete
	 */
	private function shouldUseV6( OutputPage $out ): bool {
		return $this->useV6 || $out->getRequest()->getRawVal( 'cm6enable' );
	}

	/**
	 * GetPreferences hook handler
	 *
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/GetPreferences
	 *
	 * @param User $user
	 * @param array &$defaultPreferences
	 * @return bool|void True or no return value to continue or false to abort
	 */
	public function onGetPreferences( $user, &$defaultPreferences ) {
		// CodeMirror is disabled by default for all users. It can enabled for everyone
		// by default by adding '$wgDefaultUserOptions['usecodemirror'] = 1;' into LocalSettings.php
		$defaultPreferences['usecodemirror'] = [
			'type' => 'api',
		];

		// The following messages are generated upstream by the 'section' value
		// * prefs-accessibility
		$defaultPreferences['usecodemirror-colorblind'] = [
			'type' => 'toggle',
			'label-message' => 'codemirror-prefs-colorblind',
			'help-message' => 'codemirror-prefs-colorblind-help',
			'section' => 'editing/accessibility',
		];
	}
}
