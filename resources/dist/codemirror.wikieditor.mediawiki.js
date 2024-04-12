"use strict";var e=require("ext.CodeMirror.v6.lib"),t=require("ext.CodeMirror.v6"),r=require("ext.CodeMirror.v6.mode.mediawiki"),i=function(t){function r(t,i){var o;return e._classCallCheck(this,r),(o=e._callSuper(this,r,[t])).langExtension=i,o.useCodeMirror=mw.user.options.get("usecodemirror")>0,o}return e._inherits(r,t),e._createClass(r,[{key:"setCodeMirrorPreference",value:function(t){this.useCodeMirror=t,e._get(e._getPrototypeOf(r.prototype),"setCodeMirrorPreference",this).call(this,t)}},{key:"enableCodeMirror",value:function(){var t=this;if(!this.view){var r=this.$textarea.prop("selectionStart"),i=this.$textarea.prop("selectionEnd"),o=this.$textarea.scrollTop(),a=this.$textarea.is(":focus"),s=[this.defaultExtensions,this.langExtension,e.search({top:!0}),e.EditorView.domEventHandlers({blur:function(){return t.$textarea.triggerHandler("blur")},focus:function(){return t.$textarea.triggerHandler("focus")},keydown:function(e,t){if("Tab"===e.key){e.preventDefault();var r=$("#wpSummary");r.length&&r.focus()}if("Shift"===e.key){e.preventDefault();var i=t.state.selection.main.head,o=t.coordsAtPos(i),a=t.dom.getBoundingClientRect();(o.top<a.top||o.top>a.bottom)&&$(t.dom).textSelection("scrollToCaretPosition")}return!1}}),e.EditorView.lineWrapping];if(this.initialize(s),$(".group-search a").on("click",(function(){e.openSearchPanel(t.view)})),requestAnimationFrame((function(){t.view.scrollDOM.scrollTop=o,t.view.scrollDOM.style.height="".concat(t.$textarea.height(),"px")})),0!==r||0!==i){var n=e.EditorSelection.range(r,i),d=e.EditorView.scrollIntoView(n);d.value.isSnapshot=!0,this.view.dispatch({selection:e.EditorSelection.create([n]),effects:d})}a&&this.view.focus(),mw.hook("ext.CodeMirror.switch").fire(!0,$(this.view.dom))}}},{key:"addCodeMirrorToWikiEditor",value:function(){var e=this,t=this.$textarea.data("wikiEditor-context"),r=t&&t.modules&&t.modules.toolbar;r&&(this.$textarea.wikiEditor("addToToolbar",{section:"main",groups:{codemirror:{tools:{CodeMirror:{label:mw.msg("codemirror-toggle-label"),type:"toggle",oouiIcon:"highlight",action:{type:"callback",execute:function(){return e.switchCodeMirror()}}}}}}}),r.$toolbar.find(".tool[rel=CodeMirror]").attr("id","mw-editbutton-codemirror"),this.readOnly&&this.$textarea.data("wikiEditor-context").$ui.addClass("ext-codemirror-readonly"),this.useCodeMirror&&this.enableCodeMirror(),this.updateToolbarButton(),this.logUsage({editor:"wikitext",enabled:this.useCodeMirror,toggled:!1,edit_start_ts_ms:1e3*parseInt($('input[name="wpStarttime"]').val(),10)||0}))}},{key:"updateToolbarButton",value:function(){var e=$("#mw-editbutton-codemirror");e.toggleClass("mw-editbutton-codemirror-active",this.useCodeMirror),e.data("setActive")&&e.data("setActive")(this.useCodeMirror)}},{key:"switchCodeMirror",value:function(){if(this.view){this.setCodeMirrorPreference(!1);var e=this.view.scrollDOM.scrollTop,t=this.view.hasFocus,r=this.view.state.selection.ranges[0],i=r.from,o=r.to;$(this.view.dom).textSelection("unregister"),this.$textarea.textSelection("unregister"),this.$textarea.val(this.view.state.doc.toString()),this.view.destroy(),this.view=null,this.$textarea.show(),t&&this.$textarea.trigger("focus"),this.$textarea.prop("selectionStart",Math.min(i,o)).prop("selectionEnd",Math.max(o,i)),this.$textarea.scrollTop(e),mw.hook("ext.CodeMirror.switch").fire(!1,this.$textarea)}else this.enableCodeMirror(),this.setCodeMirrorPreference(!0);this.updateToolbarButton(),this.logUsage({editor:"wikitext",enabled:this.useCodeMirror,toggled:!0,edit_start_ts_ms:1e3*parseInt($('input[name="wpStarttime"]').val(),10)||0})}}])}(t);mw.loader.getState("ext.wikiEditor")&&mw.hook("wikiEditor.toolbarReady").add((function(e){(window.WikiEditorCodeMirror=new i(e,r({bidiIsolation:"rtl"===e.attr("dir")}))).addCodeMirrorToWikiEditor()})),window.registerCodeMirrorKeyHandler=function(t){var r=e.EditorView.domEventHandlers({keydown:function(e,r){return t(e,r)}});window.WikiEditorCodeMirror.view.dispatch({effects:e.StateEffect.appendConfig.of(r)})},window.registerCodeMirrorScrollHandler=function(t){var r=e.EditorView.domEventHandlers({scroll:function(e,r){return t(e,r)}});window.WikiEditorCodeMirror.view.dispatch({effects:e.StateEffect.appendConfig.of(r)})};
