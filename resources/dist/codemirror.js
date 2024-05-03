"use strict";var e=require("ext.CodeMirror.v6.lib"),t=function(){function t(r){e._classCallCheck(this,t),this.view=r,this.$cmDom=$(r.dom)}return e._createClass(t,[{key:"getContents",value:function(){return this.view.state.doc.toString()}},{key:"setContents",value:function(e){return this.view.dispatch({changes:{from:0,to:this.view.state.doc.length,insert:e}}),this.$cmDom}},{key:"getCaretPosition",value:function(e){return e.startAndEnd?[this.view.state.selection.main.from,this.view.state.selection.main.to]:this.view.state.selection.main.head}},{key:"scrollToCaretPosition",value:function(){var t=e.EditorView.scrollIntoView(this.view.state.selection.main.head);return t.value.isSnapshot=!0,this.view.dispatch({effects:t}),this.$cmDom}},{key:"getSelection",value:function(){return this.view.state.sliceDoc(this.view.state.selection.main.from,this.view.state.selection.main.to)}},{key:"setSelection",value:function(e){return this.view.dispatch({selection:{anchor:e.start,head:e.end||e.start}}),this.view.focus(),this.$cmDom}},{key:"replaceSelection",value:function(e){return this.view.dispatch(this.view.state.replaceSelection(e)),this.$cmDom}},{key:"encapsulateSelection",value:function(t){var r,i=!1;this.view.focus(),void 0!==t.selectionStart&&this.setSelection({start:t.selectionStart,end:t.selectionEnd||t.selectionStart}),r=this.getSelection();var o=this.getCaretPosition({startAndEnd:!0}),s=e._slicedToArray(o,1)[0];!function(){if(r)if(t.replace)r=t.peri;else{for(;" "===r.charAt(r.length-1);)r=r.slice(0,-1),t.post+=" ";for(;" "===r.charAt(0);)r=r.slice(1),t.pre=" "+t.pre}else r=t.peri,i=!0}();var n=t.pre+r+t.post;return this.view.state.selection.ranges.length>1?(this.view.dispatch(this.view.state.changeByRange((function(r){return{changes:[{from:r.from,insert:t.pre},{from:r.to,insert:t.post}],range:e.EditorSelection.range(r.to+t.pre.length+t.post.length,r.to+t.pre.length+t.post.length)}}))),this.$cmDom):(this.replaceSelection(n),i&&t.selectPeri?this.setSelection({start:s+t.pre.length,end:s+t.pre.length+r.length}):this.setSelection({start:s+n.length}),this.$cmDom)}}]),t}();require("../ext.CodeMirror.data.js");var r=new WeakSet,i=function(){function i(t){e._classCallCheck(this,i),e._classPrivateMethodInitSpec(this,r),this.$textarea=$(t),this.view=null,this.state=null,this.readOnly=this.$textarea.prop("readonly"),this.editRecoveryHandler=null,this.textSelection=null}return e._createClass(i,[{key:"defaultExtensions",get:function(){var t=this,r=[this.contentAttributesExtension,this.phrasesExtension,this.specialCharsExtension,this.heightExtension,this.updateExtension,this.bracketMatchingExtension,e.EditorState.readOnly.of(this.readOnly),e.EditorView.domEventHandlers({blur:function(){return t.$textarea.triggerHandler("blur")},focus:function(){return t.$textarea.triggerHandler("focus")}}),e.EditorView.lineWrapping,e.keymap.of([].concat(e._toConsumableArray(e.defaultKeymap),e._toConsumableArray(e.searchKeymap))),e.EditorState.allowMultipleSelections.of(!0),e.drawSelection(),e.rectangularSelection(),e.crosshairCursor()];this.readOnly||(r.push(e.EditorView.updateListener.of((function(e){e.docChanged&&"function"==typeof t.editRecoveryHandler&&t.editRecoveryHandler()}))),r.push(e.history()),r.push(e.keymap.of(e.historyKeymap)));var i=mw.config.get("extCodeMirrorConfig").lineNumberingNamespaces;return i&&!i.includes(mw.config.get("wgNamespaceNumber"))||r.push(e.lineNumbers()),r}},{key:"bracketMatchingExtension",get:function(){return e.bracketMatching("wikitext"===mw.config.get("wgPageContentModel")?{brackets:"()[]{}（）【】［］｛｝"}:{})}},{key:"updateExtension",get:function(){return e.EditorView.updateListener.of((function(e){e.docChanged&&mw.hook("ext.CodeMirror.input").fire(e)}))}},{key:"heightExtension",get:function(){return e.EditorView.theme({"&":{height:"".concat(this.$textarea.outerHeight(),"px")},".cm-scroller":{overflow:"auto"}})}},{key:"contentAttributesExtension",get:function(){var t=[],r=Array.from(this.$textarea[0].classList).find((function(e){return e.startsWith("mw-editfont-")}));return r&&t.push(r),mw.user.options.get("usecodemirror-colorblind")&&"wikitext"===mw.config.get("wgPageContentModel")&&t.push("cm-mw-colorblind-colors"),[e.EditorView.contentAttributes.of({accesskey:this.$textarea.attr("accesskey"),class:t.join(" "),spellcheck:"true",tabindex:this.$textarea.attr("tabindex")}),e.EditorView.editorAttributes.of({dir:this.$textarea.attr("dir"),lang:this.$textarea.attr("lang")}),e.EditorView.theme({".cm-panels":{direction:document.dir}})]}},{key:"phrasesExtension",get:function(){return e.EditorState.phrases.of({Find:mw.msg("codemirror-find"),next:mw.msg("codemirror-next"),previous:mw.msg("codemirror-previous"),all:mw.msg("codemirror-all"),"match case":mw.msg("codemirror-match-case"),regexp:mw.msg("codemirror-regexp"),"by word":mw.msg("codemirror-by-word"),replace:mw.msg("codemirror-replace"),Replace:mw.msg("codemirror-replace-placeholder"),"replace all":mw.msg("codemirror-replace-all"),"Control character":mw.msg("codemirror-control-character")})}},{key:"specialCharsExtension",get:function(){var t={0:mw.msg("codemirror-special-char-null"),7:mw.msg("codemirror-special-char-bell"),8:mw.msg("codemirror-special-char-backspace"),10:mw.msg("codemirror-special-char-newline"),11:mw.msg("codemirror-special-char-vertical-tab"),13:mw.msg("codemirror-special-char-carriage-return"),27:mw.msg("codemirror-special-char-escape"),160:mw.msg("codemirror-special-char-nbsp"),8203:mw.msg("codemirror-special-char-zero-width-space"),8204:mw.msg("codemirror-special-char-zero-width-non-joiner"),8205:mw.msg("codemirror-special-char-zero-width-joiner"),8206:mw.msg("codemirror-special-char-left-to-right-mark"),8207:mw.msg("codemirror-special-char-right-to-left-mark"),8232:mw.msg("codemirror-special-char-line-separator"),8237:mw.msg("codemirror-special-char-left-to-right-override"),8238:mw.msg("codemirror-special-char-right-to-left-override"),8239:mw.msg("codemirror-special-char-narrow-nbsp"),8294:mw.msg("codemirror-special-char-left-to-right-isolate"),8295:mw.msg("codemirror-special-char-right-to-left-isolate"),8297:mw.msg("codemirror-special-char-pop-directional-isolate"),8233:mw.msg("codemirror-special-char-paragraph-separator"),65279:mw.msg("codemirror-special-char-zero-width-no-break-space"),65532:mw.msg("codemirror-special-char-object-replacement")};return e.highlightSpecialChars({render:function(e,r,i){r=t[e]||mw.msg("codemirror-control-character",e);var o=document.createElement("span");return o.className="cm-specialChar",160!==e&&8239!==e||(i="·",o.className="cm-special-char-nbsp"),o.textContent=i,o.title=r,o.setAttribute("aria-label",r),o},addSpecialChars:/[\u00a0\u202f]/g})}},{key:"initialize",value:function(){var t=this,i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.defaultExtensions;mw.hook("ext.CodeMirror.initialize").fire(this.$textarea),mw.hook("editRecovery.loadEnd").add((function(e){t.editRecoveryHandler=e.fieldChangeHandler})),this.state=e.EditorState.create({doc:this.$textarea.textSelection("getContents"),extensions:i}),e._classPrivateMethodGet(this,r,o).call(this),this.$textarea.hide(),this.$textarea[0].form&&this.$textarea[0].form.addEventListener("submit",(function(){t.$textarea.val(t.view.state.doc.toString());var e=document.getElementById("wpScrolltop");e&&(e.value=t.view.scrollDOM.scrollTop)})),$(this.view.dom).textSelection("register",this.cmTextSelection),this.$textarea.textSelection("register",this.cmTextSelection),mw.hook("ext.CodeMirror.ready").fire($(this.view.dom))}},{key:"destroy",value:function(){var e=this.view.scrollDOM.scrollTop,t=this.view.hasFocus,r=this.view.state.selection.ranges[0],i=r.from,o=r.to;$(this.view.dom).textSelection("unregister"),this.$textarea.textSelection("unregister"),this.$textarea.unwrap(".ext-codemirror-wrapper"),this.$textarea.val(this.view.state.doc.toString()),this.view.destroy(),this.view=null,this.$textarea.show(),t&&this.$textarea.trigger("focus"),this.$textarea.prop("selectionStart",Math.min(i,o)).prop("selectionEnd",Math.max(o,i)),this.$textarea.scrollTop(e),this.textSelection=null,mw.hook("ext.CodeMirror.destroy").fire(this.$textarea)}},{key:"logUsage",value:function(e){var t=Object.assign({session_token:mw.user.sessionId(),user_id:mw.user.getId()},e),r=mw.config.get("wgUserEditCountBucket");null!==r&&(t.user_edit_count_bucket=r),mw.track("event.CodeMirrorUsage",t)}},{key:"setCodeMirrorPreference",value:function(e){mw.user.isNamed()&&((new mw.Api).saveOption("usecodemirror",e?1:0),mw.user.options.set("usecodemirror",e?1:0))}},{key:"cmTextSelection",get:function(){var e=this;return this.textSelection||(this.textSelection=new t(this.view)),{getContents:function(){return e.textSelection.getContents()},setContents:function(t){return e.textSelection.setContents(t)},getCaretPosition:function(t){return e.textSelection.getCaretPosition(t)},scrollToCaretPosition:function(){return e.textSelection.scrollToCaretPosition()},getSelection:function(){return e.textSelection.getSelection()},setSelection:function(t){return e.textSelection.setSelection(t)},replaceSelection:function(t){return e.textSelection.replaceSelection(t)},encapsulateSelection:function(t){return e.textSelection.encapsulateSelection(t)}}}}]),i}();function o(){this.$textarea.wrap('<div class="ext-codemirror-wrapper"></div>'),this.view=new e.EditorView({state:this.state,parent:this.$textarea.parent()[0]})}module.exports=i;
