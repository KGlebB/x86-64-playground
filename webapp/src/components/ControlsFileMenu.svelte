<script lang="ts">
  import {t} from '../core/uiState.js';
  import Icon from './Icon.svelte';
  import { createDropdownMenu } from '@melt-ui/svelte';
  import {blinkStore} from '../core/store'

  import {snippetToAppState} from '../core/appState'
  import { snippets } from "../core/example_snippets";
  import ControlsShareDialog from './ControlsShareDialog.svelte';


  let blink = blinkStore.getInstance()

  let fileElem:any;
  function handleLoadExec(){
    if(!fileElem) return
    fileElem.click()
  }
  export const fileToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsArrayBuffer(blob)
    })
  }
  async function handleFileUpload(e: any){
    if (fileElem && fileElem.files.length) {
      const file = fileElem.files[0]
      let filedata = await fileToArrayBuffer(file);
      blink.loadElf(filedata);
      blinkStore.setUploadedElfName(file.name)
    }
  }


  const {
    elements: { trigger, menu, item, separator, },
    builders: { createSubmenu, },
    states: { open },
  } = createDropdownMenu({
    forceVisible: true,
    loop: true,
  });

  const {
    elements: { subMenu, subTrigger },
    states: { subOpen },
  } = createSubmenu();

  const snippetsList = Object.values(snippets)

  function handleSnippetClick(snippetId: string){
    let selected_snippet = snippets[snippetId]
    let appState = snippetToAppState(selected_snippet)
    blinkStore.setAppState(appState)
  }

</script>


<input
  on:change={handleFileUpload}
  type="file" class="file" bind:this={fileElem} />

<div class="custom-overlay"></div>
<div class="btcontainer">
<ControlsShareDialog />
<button
  type="button"
  class="button button--secondary p-right-0 m-left-1"
  {...$trigger} use:trigger
  aria-label={$t('file.options')}
>
  {$t('action.file')}
  <Icon name="chevron" size={14}/>
</button>
</div>

{#if $open}
  <div {...$menu} use:menu >
    <div {...$subTrigger} use:subTrigger>
      {$t('file.loadExample')}
      <div class="rightSlot">
        <Icon name="chevron" size={14}/>
      </div>
    </div>
    {#if $subOpen}
      <div {...$subMenu} use:subMenu >
        <div class="text">{$t('file.examples')}</div>
          {#each snippetsList as snippet}
            <div {...$item} use:item
              on:m-click={_ => handleSnippetClick(snippet.id)}
              >{$t(snippet.id.startsWith('syscall') ? 'example.syscall' : 'example.functions')} ({snippet.mode.startsWith('GNU') ? 'GNU as' : snippet.mode.startsWith('NASM') ? 'NASM' : 'FASM'})</div>
          {/each}
      </div>
    {/if}

    <div {...$separator} use:separator />
    <div {...$item} use:item on:m-click={handleLoadExec}>
      {$t('file.loadElf')}
    </div>

  </div>
{/if}

<style>
.btcontainer{
  display: flex;
  margin-left: 0;
}
.p-right-0{
  padding-right: 0;
}
.m-left-1{
  /* margin-left: 0; */
}

.rightSlot {
  margin-left: auto;
  padding-left: 1.25rem;
}

.text {
  padding: .1rem .5rem;
  color: var(--theme-text-fg-disabled);
}

.file{
  display: none;
}
</style>
