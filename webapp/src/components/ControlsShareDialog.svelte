<script lang="ts">
  import {t} from '../core/uiState.js';
  import Icon from './Icon.svelte';
  import { createDialog } from '@melt-ui/svelte'
  import { copyTextToClipboard } from '../core/utils';
  import {uri_serializeAppState} from '../core/appState'
  import {blinkStore} from '../core/store'

  const {
    elements: { trigger, portalled, overlay, content, title, description, close },
    states: { open }
  } = createDialog()

  let uri:string = "";
  let urilen = 0;
  let dangerouslen = 2048;
  let maxlen = 8100;
  function updater(node){
    uri = uri_serializeAppState(blinkStore.getAppState(), true)
    urilen = uri.length


  }

  function handleCopyClick(){
    copyTextToClipboard(uri)
  }

</script>

<button {...$trigger} use:trigger
  type="button"
  class="button button--secondary"
> <Icon name="share" size={15}/>{$t('action.share')} </button>

{#if $open}
  <div {...$portalled} use:portalled>
    <div {...$overlay} use:overlay />
    <div {...$content} use:content>
      <h2 {...$title} use:title>{$t('share.title')}</h2>
      {#if urilen >= maxlen}
        <p {...$description} use:description>
          {$t('share.tooLarge')}
        </p>
        <p class="errorbox m-top-1"> {$t('share.tooLarge')}
        </p>
      {:else}
        <p {...$description} use:description>
          {$t('share.description')}
        </p>
          <div class="btgroup">
          <input class="btgroup__button"
            use:updater
            value={uri}
            on:focus={e=>{
              setTimeout(()=>e.target.setSelectionRange(0, -1, "backward"),
              0)
            }}
            readonly type="text" placeholder={$t('share.loading')} aria-label={$t('share.link')} />
          <button class="btgroup__button"
            on:click={handleCopyClick}
            >
            <Icon name="copy" size={18}/>
            <span class="visually-hidden">{$t('action.copy')}</span>
          </button>
          </div>
        {#if urilen >= dangerouslen}
          <p class="errorbox m-top-1"> {$t('share.long',{length:urilen})}
          </p>
        {/if}
      {/if}
      <button class="icon-button" {...$close} use:close>
        <Icon name="close" size={18}/>
        <span class="visually-hidden">{$t('action.close')}</span>
      </button>
    </div>
  </div>
{/if}


<style>
input{
  background-color: var(--theme-panel-controls-bg);
  flex-grow: 1;
  border: 1px solid var(--color-gray-t);
  overflow: hidden;
}
input:focus{
  outline: 2px solid var(--theme-focus);
}
.m-top-1{
  margin-top: 1rem;
}
</style>
