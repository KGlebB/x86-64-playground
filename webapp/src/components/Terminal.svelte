<script>
  import {onDestroy} from 'svelte';
  import {blinkStore,term_buffer,state} from '../core/store';
  import {t} from '../core/uiState.js';
  import {stopMessage} from '../core/messages.js';
  import TerminalInput from './TerminalInput.svelte';
  const blink=blinkStore.getInstance();
  let termref;
  let scrollFrame;
  function scroll(){
    cancelAnimationFrame(scrollFrame);
    const target=termref;
    if(target) scrollFrame=requestAnimationFrame(()=>{if(target.isConnected)target.scrollTop=target.scrollHeight;});
  }
  onDestroy(()=>cancelAnimationFrame(scrollFrame));
  $: if(termref && ($term_buffer || $state)) scroll();
</script>
<div class="term" bind:this={termref}>
  {#if $term_buffer}<pre class="terminal-output">{$term_buffer}</pre>{:else}<p class="empty-message">{$t('terminal.empty')}</p>{/if}
  {#if $state === blink.states.PROGRAM_STOPPED}<p class="exitcodeinfo">{stopMessage($t,blink.stopReason)}</p>
  {:else if $state === blink.states.PROGRAM_READLINE_PAUSE}<TerminalInput/>{/if}
</div>
<style>
  .term {padding:12px 16px;overflow:auto;height:100%;font-family:var(--code-font-family);}
  .terminal-output {margin:0;font:12px/1.65 var(--code-font-family);white-space:pre;}
  .exitcodeinfo {margin:12px 0 0;padding:8px 12px;border:1px solid var(--theme-panel-border);border-radius:6px;background:var(--hover);font:12px var(--font-family);}
</style>
