<script>
  export let cancompile;
  import {assemblers} from '../core/assemblers';
  import {blinkStore,mode} from '../core/store';
  import {t} from '../core/uiState.js';
  import Icon from './Icon.svelte';
  const blink=blinkStore.getInstance();
</script>
<div class="assembler-control">
  <select aria-label={$t('assembler.select')} data-testid="assembler" value={$mode} disabled={!cancompile} on:change={e => blinkStore.setMode(e.target.value)}>
    {#each Object.values(assemblers) as assembler}<option value={assembler.id}>{assembler.display_name}</option>{/each}
  </select>
  <button type="button" class="button button--primary" data-testid="compile" disabled={!cancompile} on:click={() => blink.loadASM($blinkStore.editorContent_read)}><Icon name="play" size={15}/>{$t('action.compile')}</button>
</div>
