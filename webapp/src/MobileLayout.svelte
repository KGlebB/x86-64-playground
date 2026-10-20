<script>
  import {get} from 'svelte/store';
  import Editor from './components/Editor.svelte';
  import Registers from './components/Registers.svelte';
  import Memory from './components/Memory.svelte';
  import Disassembler from './components/Disassembler.svelte';
  import Terminal from './components/Terminal.svelte';
  import Icon from './components/Icon.svelte';
  import {t} from './core/uiState.js';
  import {activePanel} from './core/inspectorState.js';
  import {state} from './core/store';
  const tabs = [{id:'editor',icon:'code'},{id:'disassembly',icon:'step'},{id:'registers',icon:'registers'},{id:'memory',icon:'memory'},{id:'terminal',icon:'terminal'}];
  let previousState;
  function followState(state) {
    if (state === 'PROGRAM_RUNNING' && previousState !== state && get(activePanel) === 'editor') activePanel.set('disassembly');
    if (state === 'READY' && previousState !== state) activePanel.set('editor');
    previousState = state;
  }
  function keydown(event,index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault(); activePanel.set(tabs[next].id);
    document.getElementById(`tab-${tabs[next].id}`)?.focus();
  }
  $: followState($state);
</script>
<div class="mobile-workspace">
  <div class="mobile-panels">
    <div role="tabpanel" tabindex="0" id="panel-editor" aria-labelledby="tab-editor" hidden={$activePanel !== 'editor'}><Editor/></div>
    <div role="tabpanel" tabindex="0" id="panel-disassembly" aria-labelledby="tab-disassembly" hidden={$activePanel !== 'disassembly'}><Disassembler/></div>
    <div role="tabpanel" tabindex="0" id="panel-registers" aria-labelledby="tab-registers" hidden={$activePanel !== 'registers'}><Registers/></div>
    <div role="tabpanel" tabindex="0" id="panel-memory" aria-labelledby="tab-memory" hidden={$activePanel !== 'memory'}><Memory/></div>
    <div role="tabpanel" tabindex="0" id="panel-terminal" aria-labelledby="tab-terminal" hidden={$activePanel !== 'terminal'}><Terminal/></div>
  </div>
  <div role="tablist" aria-label={$t('panel.tabs')}>
    {#each tabs as tab, index}
      <button type="button" role="tab" id={`tab-${tab.id}`} aria-controls={`panel-${tab.id}`} aria-selected={$activePanel === tab.id} tabindex={$activePanel === tab.id ? 0 : -1} on:click={() => activePanel.set(tab.id)} on:keydown={event => keydown(event,index)}><Icon name={tab.icon} size={17}/><span>{$t(`panel.${tab.id}`)}</span></button>
    {/each}
  </div>
</div>
