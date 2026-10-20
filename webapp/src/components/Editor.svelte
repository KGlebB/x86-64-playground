<script>
import {blinkStore, state, editorContent_write, editorContent_read} from '../core/store'
import {onMount} from 'svelte'
import {t} from '../core/uiState.js';
import Icon from './Icon.svelte';
import { createEditor } from "prism-code-editor"

// Prism grammars
import "prism-code-editor/prism/languages/nasm"

// Editor styles
import "prism-code-editor/layout.css"
import "prism-code-editor/scrollbar.css"


// Non critical extensions (could be lazy loaded)
import { indentGuides } from "prism-code-editor/guides"
import { matchBrackets } from "prism-code-editor/match-brackets"
import { highlightSelectionMatches } from "prism-code-editor/search"
import { defaultCommands } from "prism-code-editor/commands"
import { setIgnoreTab } from "prism-code-editor/commands"


let editor_elem;
let editor;

let rendered_errors = [];

let blink = blinkStore.getInstance()

// render conditionals
let invalidElf = false;
$: $state && (
  invalidElf = blink.state == blink.states.PROGRAM_STOPPED &&
    blink.stopReason?.loadFail)


function renderEditor(){
  console.log("editor: rendering everything")
  if(!editor_elem)
    return;

  editor = createEditor(
    editor_elem,
    {
      language: "nasm",
      value: $blinkStore.editorContent_read,
      onUpdate: content=>{
        removeErrors()
        blinkStore.notifyEditorContent(content)
      },
    },
    indentGuides(),
    matchBrackets(),
    highlightSelectionMatches(),
    defaultCommands(),
  )
  //annoying but required since this editor is trapping focus, causing
  //a11y issues
  setIgnoreTab(true)
  labelEditor($t('editor.label'))
}

function labelEditor(text){ editor_elem?.querySelector('textarea')?.setAttribute('aria-label',text); }
$: labelEditor($t('editor.label'));

function removeErrors(){
  for(let err of rendered_errors){
    console.log("editor: remove errors")
    err.remove()
  }
  rendered_errors = [];
}

function renderErrors(){
  if(!editor || !blink){
    return
  }
  if(blink.state != blink.states.READY){
    removeErrors()
    return;
  }
  if(rendered_errors.length > 0){
    //already rendered the errors
    return
  }
  console.log("editor: render errors")

  // lines[i] with i>0 is an overlayed html line we can edit
  const lines = editor.wrapper.children

  //render an error
  for(let err of blink.assembler_errors){
    const element = document.createElement('div');
    rendered_errors.push(element)
    element.className = "editor__lineerror"
    if (!lines[err.line]) continue;
    let lineLength = 2 + lines[err.line].textContent.length
    element.innerText = (" ".repeat(lineLength)) + err.error
    if(lines[err.line] && element.parentNode != lines[err.line]){
      lines[err.line].append(element)
    }
  }
}

function updateEditor(){
  if(!editor){
    return;
  }
  editor.setOptions({
    value: $editorContent_write
  })
  renderErrors()
}

$: $editorContent_write && updateEditor()

$: $state && renderErrors();

onMount(() => {
  renderEditor();
})
</script>

<div class="container">
  {#if $blinkStore.uploadedElf}
    <div class="files">
      <Icon name="file" size={40}/>
      <p><b>{$t('file.name')}:</b> {$blinkStore.uploadedElf}</p>

  {#if invalidElf}
      <p class="stopinfo">{$t('editor.invalidElf')} </p>
      <p>{$t('editor.elfHelp')}</p>
  {/if}

      <button on:click={()=>blinkStore.setUploadedElfName("")}>{$t('action.back')}</button>
    </div>
  {/if}
  <div class="editor" bind:this={editor_elem}
    class:hidden={$blinkStore.uploadedElf}> </div>
</div>

<style>
  .editor{
    padding-bottom: 1.5rem;
  }
  .editor.hidden{
    display: none;
  }
  .container{
    overflow: auto;
    max-height: 100%;
    height: 100%;
    background-color: var(--theme-panel-bg);
    display: grid;
  }
  .files{
    display:flex;
    height: 100%;
    align-items: center;
    flex-direction:column;
    font-size: 1rem;
    padding: 2rem;
  }


  .files button{
    border: 0;
  }
  .files p{
    margin: 0;
    text-align:center;
  }

  .files button{
    color: var(--color-gray-100);
    text-decoration: none;
    padding: .5rem;
    font-size: 1rem;
    border-radius: 8px;
    background-color:transparent;
    margin-top: 1rem;
    margin-bottom: 1rem;
    cursor: pointer;
  }
  .files button:hover{
    color: var(--color-gray-0);
    background-color: var(--hover);
  }

 p.stopinfo{
    /*TODO: remove hardcoded colors, find proper design */
    background-color: var(--danger-bg);
    color: var(--danger);
    border: 1px solid var(--danger);

    padding-left: 1rem;
    padding-right: 1rem;
    margin-top: 1rem;
    margin-bottom: .5rem;
  }
</style>
