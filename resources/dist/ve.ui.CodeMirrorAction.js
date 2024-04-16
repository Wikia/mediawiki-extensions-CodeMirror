"use strict";var e=require("ext.CodeMirror.v6.mode.mediawiki"),t=require("ext.CodeMirror.v6.lib"),r=function(){return t._createClass((function e(r,o){t._classCallCheck(this,e),this.surface=r,this.langExtension=o,this.view=null,this.state=null,this.useCodeMirror=mw.user.options.get("usecodemirror")>0}),[{key:"defaultExtensions",get:function(){var e=[this.contentAttributesExtension],r=mw.config.get("wgCodeMirrorLineNumberingNamespaces");return r&&!r.includes(mw.config.get("wgNamespaceNumber"))||e.push(t.lineNumbers()),e}},{key:"contentAttributesExtension",get:function(){return t.EditorView.contentAttributes.of({dir:$(this.surface.getView()[0]).attr("dir"),lang:$(this.surface.getView()[0]).attr("lang")})}},{key:"initialize",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.defaultExtensions;this.state=t.EditorState.create({doc:this.surface.getDom(),extensions:e}),this.view=new t.EditorView({state:this.state,parent:this.surface.getView().$element[0]}),mw.hook("ext.CodeMirror.switch").fire(!0,$(this.view.dom))}},{key:"logUsage",value:function(e){var t=Object.assign({session_token:mw.user.sessionId(),user_id:mw.user.getId()},e),r=mw.config.get("wgUserEditCountBucket");null!==r&&(t.user_edit_count_bucket=r),mw.track("event.CodeMirrorUsage",t)}},{key:"setCodeMirrorPreference",value:function(e){mw.user.isAnon()||((new mw.Api).saveOption("usecodemirror",e?1:0),mw.user.options.set("usecodemirror",e?1:0))}},{key:"enableCodeMirror",value:function(){var e=this;if(!this.view){var r=[].concat(t._toConsumableArray(this.defaultExtensions),[this.langExtension,t.bracketMatching(),t.history(),t.EditorView.contentAttributes.of({spellcheck:"true"}),t.EditorView.updateListener.of((function(t){t.docChanged&&"function"==typeof e.editRecoveryHandler&&e.editRecoveryHandler()})),t.EditorView.lineWrapping]);mw.hook("editRecovery.loadEnd").add((function(t){e.editRecoveryHandler=t.fieldChangeHandler}));var o=$.client.profile(),i="WebkitTextFillColor"in document.body.style&&!("gecko"===o.layout&&"mac"===o.platform);this.surface.getView().$documentNode.addClass(i?"ve-ce-documentNode-codeEditor-webkit-hide":"ve-ce-documentNode-codeEditor-hide"),this.initialize(r),mw.hook("ext.CodeMirror.switch").fire(!0,$(this.view.dom))}}}])}();ve.ui.CodeMirrorAction=function(){ve.ui.CodeMirrorAction.super.apply(this,arguments)},OO.inheritClass(ve.ui.CodeMirrorAction,ve.ui.Action),ve.ui.CodeMirrorAction.static.name="codeMirror",ve.ui.CodeMirrorAction.static.methods=["toggle"],ve.ui.CodeMirrorAction.static.isLineNumbering=function(){if(/Android\b/.test(navigator.userAgent))return!1;var e=mw.config.get("wgCodeMirrorLineNumberingNamespaces");return!e||-1!==e.indexOf(mw.config.get("wgNamespaceNumber"))},ve.ui.CodeMirrorAction.prototype.toggle=function(t){var o=this.surface,i=o.getView(),n=o.getModel().getDocument();if(o.mirror&&o.mirror.view||!1===t)o.mirror&&!0!==t&&(i.$element.removeClass("mw-editfont-monospace").addClass("mw-editfont-"+mw.user.options.get("editfont")),i.$documentNode.removeClass("ve-ce-documentNode-codeEditor-webkit-hide ve-ce-documentNode-codeEditor-hide"),i.$documentNode.css("margin-left",""),o.mirror.view.destroy(),o.mirror.view=null);else{o.mirror=window.VisualEditorCodeMirror=new r(o,e()),o.mirror.enableCodeMirror();var s=parseInt(document.querySelector(".cm-gutters").offsetWidth);i.$documentNode.css("margin-left",s-5),o.mirror.veTransactionListener=this.onDocumentPrecommit.bind(this),n.on("precommit",o.mirror.veTransactionListener)}return!0},ve.ui.CodeMirrorAction.prototype.onSelect=function(e){var t=e.getCoveringRange();t&&t.isCollapsed()&&this.surface.mirror.setSelection(this.getPosFromOffset(t.from))},ve.ui.CodeMirrorAction.prototype.onLangChange=function(){var e=this.surface,t=e.getView().getDocument(),r=t.getDir(),o=t.getLang();e.mirror.setOption("direction",r),e.mirror.getWrapperElement().setAttribute("lang",o)},ve.ui.CodeMirrorAction.prototype.onDocumentPrecommit=function(e){var t=0,r=[],o=this,i=this.surface.getModel().getDocument().getStore(),n=this.surface.mirror.view,s=document.querySelector(".ve-ce-documentNode"),c=parseInt(document.querySelector(".cm-gutters").offsetWidth);s.style.marginLeft=c-5+"px",e.operations.forEach((function(e){"retain"===e.type?t+=e.length:"replace"===e.type&&(r.push({start:"replace"===e.type?o.getPosFromOffset(t):void 0,end:e.remove.length?o.getPosFromOffset(t+e.remove.length):void 0,data:new ve.dm.ElementLinearData(i,e.insert).getSourceText()}),t+=e.remove.length)}));for(var a=r.length-1;a>=0;a--)n.dispatch({changes:{from:r[a].start,to:r[a].end,insert:r[a].data}})},ve.ui.CodeMirrorAction.prototype.getPosFromOffset=function(e){return this.surface.getModel().getSourceOffsetFromOffset(e)},ve.ui.actionFactory.register(ve.ui.CodeMirrorAction);
