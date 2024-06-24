"use strict";var e=require("ext.CodeMirror.v6.lib");class t{constructor(e){this.view=e,this.$cmDom=$(e.dom)}getContents(){return this.view.state.doc.toString()}setContents(e){return this.view.dispatch({changes:{from:0,to:this.view.state.doc.length,insert:e}}),this.$cmDom}getCaretPosition(e){return e.startAndEnd?[this.view.state.selection.main.from,this.view.state.selection.main.to]:this.view.state.selection.main.head}scrollToCaretPosition(){const t=e.EditorView.scrollIntoView(this.view.state.selection.main.head);return t.value.isSnapshot=!0,this.view.dispatch({effects:t}),this.$cmDom}getSelection(){return this.view.state.sliceDoc(this.view.state.selection.main.from,this.view.state.selection.main.to)}setSelection(e){return this.view.dispatch({selection:{anchor:e.start,head:e.end||e.start}}),this.view.focus(),this.$cmDom}replaceSelection(e){return this.view.dispatch(this.view.state.replaceSelection(e)),this.$cmDom}encapsulateSelection(t){let r,i=!1;this.view.focus(),void 0!==t.selectionStart&&this.setSelection({start:t.selectionStart,end:t.selectionEnd||t.selectionStart}),r=this.getSelection();const[s]=this.getCaretPosition({startAndEnd:!0});(()=>{if(r)if(t.replace)r=t.peri;else{for(;" "===r.charAt(r.length-1);)r=r.slice(0,-1),t.post+=" ";for(;" "===r.charAt(0);)r=r.slice(1),t.pre=" "+t.pre}else r=t.peri,i=!0})();const o=t.pre+r+t.post;return this.view.state.selection.ranges.length>1?(this.view.dispatch(this.view.state.changeByRange((r=>({changes:[{from:r.from,insert:t.pre},{from:r.to,insert:t.post}],range:e.EditorSelection.range(r.to+t.pre.length+t.post.length,r.to+t.pre.length+t.post.length)})))),this.$cmDom):(this.replaceSelection(o),i&&t.selectPeri?this.setSelection({start:s+t.pre.length,end:s+t.pre.length+r.length}):this.setSelection({start:s+o.length}),this.$cmDom)}}require("../ext.CodeMirror.data.js");module.exports=class{constructor(e){this.$textarea=$(e),this.view=null,this.state=null,this.readOnly=this.$textarea.prop("readonly"),this.editRecoveryHandler=null,this.textSelection=null}get defaultExtensions(){const t=[this.contentAttributesExtension,this.phrasesExtension,this.specialCharsExtension,this.heightExtension,e.bracketMatching(),e.EditorState.readOnly.of(this.readOnly),e.keymap.of([...e.defaultKeymap,...e.searchKeymap]),e.EditorState.allowMultipleSelections.of(!0),e.drawSelection(),e.rectangularSelection(),e.crosshairCursor()];if(!this.readOnly){t.push(e.EditorView.updateListener.of((e=>{e.docChanged&&"function"==typeof this.editRecoveryHandler&&this.editRecoveryHandler()}))),t.push(e.history());const r=[...e.historyKeymap,{win:"Ctrl-Shift-z",preventDefault:!0,run:e.redo}];t.push(e.keymap.of(r))}const r=mw.config.get("extCodeMirrorConfig").lineNumberingNamespaces;return r&&!r.includes(mw.config.get("wgNamespaceNumber"))||t.push(e.lineNumbers()),t}get heightExtension(){return e.EditorView.theme({"&":{height:`${this.$textarea.outerHeight()}px`},".cm-scroller":{overflow:"auto"}})}get contentAttributesExtension(){const t=[],r=Array.from(this.$textarea[0].classList).find((e=>e.startsWith("mw-editfont-")));return r&&t.push(r),mw.user.options.get("usecodemirror-colorblind")&&"wikitext"===mw.config.get("wgPageContentModel")&&t.push("cm-mw-colorblind-colors"),[e.EditorView.contentAttributes.of({accesskey:this.$textarea.attr("accesskey"),class:t.join(" "),spellcheck:"true"}),e.EditorView.editorAttributes.of({dir:this.$textarea.attr("dir"),lang:this.$textarea.attr("lang")})]}get phrasesExtension(){return e.EditorState.phrases.of({Find:mw.msg("codemirror-find"),next:mw.msg("codemirror-next"),previous:mw.msg("codemirror-previous"),all:mw.msg("codemirror-all"),"match case":mw.msg("codemirror-match-case"),regexp:mw.msg("codemirror-regexp"),"by word":mw.msg("codemirror-by-word"),replace:mw.msg("codemirror-replace"),Replace:mw.msg("codemirror-replace-placeholder"),"replace all":mw.msg("codemirror-replace-all"),"Control character":mw.msg("codemirror-control-character")})}get specialCharsExtension(){const t={0:mw.msg("codemirror-special-char-null"),7:mw.msg("codemirror-special-char-bell"),8:mw.msg("codemirror-special-char-backspace"),10:mw.msg("codemirror-special-char-newline"),11:mw.msg("codemirror-special-char-vertical-tab"),13:mw.msg("codemirror-special-char-carriage-return"),27:mw.msg("codemirror-special-char-escape"),160:mw.msg("codemirror-special-char-nbsp"),8203:mw.msg("codemirror-special-char-zero-width-space"),8204:mw.msg("codemirror-special-char-zero-width-non-joiner"),8205:mw.msg("codemirror-special-char-zero-width-joiner"),8206:mw.msg("codemirror-special-char-left-to-right-mark"),8207:mw.msg("codemirror-special-char-right-to-left-mark"),8232:mw.msg("codemirror-special-char-line-separator"),8237:mw.msg("codemirror-special-char-left-to-right-override"),8238:mw.msg("codemirror-special-char-right-to-left-override"),8239:mw.msg("codemirror-special-char-narrow-nbsp"),8294:mw.msg("codemirror-special-char-left-to-right-isolate"),8295:mw.msg("codemirror-special-char-right-to-left-isolate"),8297:mw.msg("codemirror-special-char-pop-directional-isolate"),8233:mw.msg("codemirror-special-char-paragraph-separator"),65279:mw.msg("codemirror-special-char-zero-width-no-break-space"),65532:mw.msg("codemirror-special-char-object-replacement")};return e.highlightSpecialChars({render:(e,r,i)=>{r=t[e]||mw.msg("codemirror-control-character",e);const s=document.createElement("span");return s.className="cm-specialChar",160!==e&&8239!==e||(i="·",s.className="cm-special-char-nbsp"),s.textContent=i,s.title=r,s.setAttribute("aria-label",r),s},addSpecialChars:/[\u00a0\u202f]/g})}initialize(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.defaultExtensions;mw.hook("ext.CodeMirror.initialize").fire(this.$textarea),mw.hook("editRecovery.loadEnd").add((e=>{this.editRecoveryHandler=e.fieldChangeHandler})),this.state=e.EditorState.create({doc:this.$textarea.textSelection("getContents"),extensions:t}),this.view=new e.EditorView({state:this.state,parent:this.$textarea.parent()[0]}),this.$textarea.hide(),this.$textarea[0].form&&this.$textarea[0].form.addEventListener("submit",(()=>{this.$textarea.val(this.view.state.doc.toString());const e=document.getElementById("wpScrolltop");e&&(e.value=this.view.scrollDOM.scrollTop)})),$(this.view.dom).textSelection("register",this.cmTextSelection),this.$textarea.textSelection("register",this.cmTextSelection)}logUsage(e){const t=Object.assign({session_token:mw.user.sessionId(),user_id:mw.user.getId()},e),r=mw.config.get("wgUserEditCountBucket");null!==r&&(t.user_edit_count_bucket=r),mw.track("event.CodeMirrorUsage",t)}setCodeMirrorPreference(e){mw.user.isAnon()||((new mw.Api).saveOption("usecodemirror",e?1:0),mw.user.options.set("usecodemirror",e?1:0))}get cmTextSelection(){return this.textSelection=new t(this.view),{getContents:()=>this.textSelection.getContents(),setContents:e=>this.textSelection.setContents(e),getCaretPosition:e=>this.textSelection.getCaretPosition(e),scrollToCaretPosition:()=>this.textSelection.scrollToCaretPosition(),getSelection:()=>this.textSelection.getSelection(),setSelection:e=>this.textSelection.setSelection(e),replaceSelection:e=>this.textSelection.replaceSelection(e),encapsulateSelection:e=>this.textSelection.encapsulateSelection(e)}}};
