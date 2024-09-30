"use strict";ve.ui.CodeMirrorTool=function(){ve.ui.CodeMirrorTool.super.apply(this,arguments),this.toolbar.connect(this,{surfaceChange:"onSurfaceChange"})},OO.inheritClass(ve.ui.CodeMirrorTool,ve.ui.Tool),ve.ui.CodeMirrorTool.static.name="codeMirror",ve.ui.CodeMirrorTool.static.autoAddToCatchall=!1,ve.ui.CodeMirrorTool.static.title=OO.ui.deferMsg("codemirror-toggle-label"),ve.ui.CodeMirrorTool.static.icon="highlight",ve.ui.CodeMirrorTool.static.group="utility",ve.ui.CodeMirrorTool.static.commandName="codeMirror",ve.ui.CodeMirrorTool.static.deactivateOnSelect=!1,ve.ui.CodeMirrorTool.prototype.onSelect=function(){ve.ui.CodeMirrorTool.super.prototype.onSelect.apply(this,arguments);const o=this.toolbar.surface.mirror,e=!(!o||!o.view);this.setActive(e),o.setCodeMirrorPreference(e),o.logUsage({editor:"wikitext-2017",enabled:e,toggled:!0,edit_start_ts_ms:1e3*this.toolbar.target.startTimeStamp||0})},ve.ui.CodeMirrorTool.prototype.onSurfaceChange=function(o,e){const t="source"!==e.getMode();if(this.setDisabled(t),!t){const o=this.getCommand(),e=this.toolbar.getSurface(),t=mw.user.options.get("usecodemirror")>0;o.execute(e,[t]),this.setActive(t),this.toolbar.target.startTimeStamp&&this.toolbar.surface.mirror.logUsage({editor:"wikitext-2017",enabled:t,toggled:!1,edit_start_ts_ms:1e3*this.toolbar.target.startTimeStamp||0})}},ve.ui.CodeMirrorTool.prototype.onUpdateState=function(){},ve.ui.toolFactory.register(ve.ui.CodeMirrorTool),ve.ui.commandRegistry.register(new ve.ui.Command("codeMirror","codeMirror","toggle"));