<script>
  import {blinkStore} from '../core/store';
  import {t} from '../core/uiState.js';
  const blink=blinkStore.getInstance();
  const bufsize=Number(blink.m.readU64('rdx'));
  const encoder=new TextEncoder();
  let stdin_str='';
  $: currentBytes=encoder.encode(stdin_str).length;
  $: nonascii=stdin_str.length>0 && currentBytes>stdin_str.length;
  function lineEnter(event){event.preventDefault();blink.readLineEnter(stdin_str);stdin_str='';}
</script>
<form class="stdin" on:submit={lineEnter}>
  <p class="input-state">{$t('terminal.inputWait')}</p>
  {#if nonascii}<p class="warning">{$t('input.nonAscii')}</p>{/if}
  {#if bufsize === 0}<p class="warning">{$t('input.zero')}</p>
  {:else if currentBytes > bufsize}<p class="warning">{$t('input.overLimit',{count:currentBytes-bufsize})}</p>{/if}
  <label for="terminal-stdin">{$t('input.label',{current:currentBytes,size:bufsize})}</label>
  <div class="stdin-row"><input id="terminal-stdin" data-testid="stdin" type="text" bind:value={stdin_str}/><button class="button" type="submit">{$t('input.send')}</button></div>
</form>
<style>
  .stdin {margin-top:12px;padding:12px;border:1px solid var(--theme-primary);border-radius:8px;background:var(--accent-soft);font:12px var(--font-family);}
  .input-state {margin:0 0 8px;color:var(--theme-primary);}
  .stdin-row {display:flex;gap:8px;margin-top:6px;}
  input {flex:1;font-family:var(--code-font-family);}
  .warning {background:var(--warning-bg);color:var(--warning);padding:8px;border-radius:4px;}
</style>
