"use strict";var e=require("ext.CodeMirror.v6.mode.mediawiki"),t=require("ext.CodeMirror.v6.lib"),r=function(){return t._createClass((function e(r,i){t._classCallCheck(this,e),this.surface=r,this.langExtension=i,this.view=null,this.state=null,this.useCodeMirror=mw.user.options.get("usecodemirror")>0}),[{key:"defaultExtensions",get:function(){var e=[this.contentAttributesExtension],r=mw.config.get("wgCodeMirrorLineNumberingNamespaces");return r&&!r.includes(mw.config.get("wgNamespaceNumber"))||e.push(t.lineNumbers()),e}},{key:"contentAttributesExtension",get:function(){return t.EditorView.contentAttributes.of({dir:$(this.surface.getView()[0]).attr("dir"),lang:$(this.surface.getView()[0]).attr("lang")})}},{key:"initialize",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.defaultExtensions;this.state=t.EditorState.create({doc:this.surface.getDom(),extensions:e}),this.view=new t.EditorView({state:this.state,parent:this.surface.getView().$element[0]}),this.view.viewState.printing=!0,mw.hook("ext.CodeMirror.switch").fire(!0,$(this.view.dom))}},{key:"logUsage",value:function(e){var t=Object.assign({session_token:mw.user.sessionId(),user_id:mw.user.getId()},e),r=mw.config.get("wgUserEditCountBucket");null!==r&&(t.user_edit_count_bucket=r),mw.track("event.CodeMirrorUsage",t)}},{key:"setCodeMirrorPreference",value:function(e){mw.user.isAnon()||((new mw.Api).saveOption("usecodemirror",e?1:0),mw.user.options.set("usecodemirror",e?1:0))}},{key:"enableCodeMirror",value:function(){var e=this;if(!this.view){var r=[].concat(t._toConsumableArray(this.defaultExtensions),[this.langExtension,t.bracketMatching(),t.history(),t.EditorView.contentAttributes.of({spellcheck:"true"}),t.EditorView.updateListener.of((function(t){t.docChanged&&"function"==typeof e.editRecoveryHandler&&e.editRecoveryHandler()})),t.EditorView.lineWrapping]);mw.hook("editRecovery.loadEnd").add((function(t){e.editRecoveryHandler=t.fieldChangeHandler}));var i=$.client.profile(),o="WebkitTextFillColor"in document.body.style&&!("gecko"===i.layout&&"mac"===i.platform);this.surface.getView().$documentNode.addClass(o?"ve-ce-documentNode-codeEditor-webkit-hide":"ve-ce-documentNode-codeEditor-hide"),this.initialize(r)}}}])}();ve.ui.CodeMirrorAction=function(){ve.ui.CodeMirrorAction.super.apply(this,arguments)},OO.inheritClass(ve.ui.CodeMirrorAction,ve.ui.Action),ve.ui.CodeMirrorAction.static.name="codeMirror",ve.ui.CodeMirrorAction.static.methods=["toggle"],ve.ui.CodeMirrorAction.static.isLineNumbering=function(){if(/Android\b/.test(navigator.userAgent))return!1;var e=mw.config.get("wgCodeMirrorLineNumberingNamespaces");return!e||-1!==e.indexOf(mw.config.get("wgNamespaceNumber"))},ve.ui.CodeMirrorAction.prototype.toggle=function(t){var i=this.surface,o=i.getView(),n=i.getModel().getDocument();if(i.mirror&&i.mirror.view||!1===t)i.mirror&&!0!==t&&(n.off("precommit",i.mirror.veTransactionListener),o.$element.removeClass("mw-editfont-monospace").addClass("mw-editfont-"+mw.user.options.get("editfont")),o.$documentNode.removeClass("ve-ce-documentNode-codeEditor-webkit-hide ve-ce-documentNode-codeEditor-hide"),o.$documentNode.css("margin-left",""),i.mirror.view.destroy(),i.mirror.view=null);else{i.mirror=window.VisualEditorCodeMirror=new r(i,e()),i.mirror.enableCodeMirror();var s=parseInt(document.querySelector(".cm-gutters").offsetWidth);o.$documentNode.css("margin-left",s-5),i.mirror.veTransactionListener=this.onDocumentPrecommit.bind(this),n.on("precommit",i.mirror.veTransactionListener)}return!0},ve.ui.CodeMirrorAction.prototype.onSelect=function(e){var t=e.getCoveringRange();t&&t.isCollapsed()&&this.surface.mirror.setSelection(this.getPosFromOffset(t.from))},ve.ui.CodeMirrorAction.prototype.onLangChange=function(){var e=this.surface,t=e.getView().getDocument(),r=t.getDir(),i=t.getLang();e.mirror.setOption("direction",r),e.mirror.getWrapperElement().setAttribute("lang",i)},ve.ui.CodeMirrorAction.prototype.onDocumentPrecommit=function(e){var t=0,r=[],i=this,o=this.surface.getModel().getDocument().getStore(),n=this.surface.mirror.view,s=document.querySelector(".ve-ce-documentNode"),c=parseInt(document.querySelector(".cm-gutters").offsetWidth);s.style.marginLeft=c-5+"px",e.operations.forEach((function(e){"retain"===e.type?t+=e.length:"replace"===e.type&&(r.push({start:"replace"===e.type?i.getPosFromOffset(t):void 0,end:e.remove.length?i.getPosFromOffset(t+e.remove.length):void 0,data:new ve.dm.ElementLinearData(o,e.insert).getSourceText()}),t+=e.remove.length)}));for(var a=r.length-1;a>=0;a--)n.dispatch({changes:{from:r[a].start,to:r[a].end,insert:r[a].data}})},ve.ui.CodeMirrorAction.prototype.getPosFromOffset=function(e){return this.surface.getModel().getSourceOffsetFromOffset(e)},ve.ui.actionFactory.register(ve.ui.CodeMirrorAction);
