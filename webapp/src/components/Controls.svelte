<script>
  import {blinkStore, state} from '../core/store';
  import {t} from '../core/uiState.js';
  import {stopMessage} from '../core/messages.js';
  import ControlsCompilebt from './ControlsCompilebt.svelte';
  import ControlsFileMenu from './ControlsFileMenu.svelte';
  import Icon from './Icon.svelte';
  const blink = blinkStore.getInstance();
  $: busy = [blink.states.NOT_READY,blink.states.ASSEMBLING,blink.states.LINKING].includes($state);
  $: canStart = [blink.states.PROGRAM_LOADED,blink.states.PROGRAM_STOPPED].includes($state) && blink.programAvailable && !blink.stopReason?.loadFail;
  $: canStep = $state === blink.states.PROGRAM_RUNNING;
</script>
<div class="app-toolbar" aria-label={$t('panel.tabs')}>
  <div class="toolbar-group"><ControlsCompilebt cancompile={!busy}/><ControlsFileMenu/></div>
  <div class="toolbar-group debug-actions">
    <button class="button" type="button" on:click={() => blink.starti()} disabled={!canStart} title={$t('action.startHelp')}><Icon name="restart"/>{$t('action.start')}</button>
    <button class="button" type="button" on:click={() => blink.run()} disabled={!canStart} title={$t('action.runHelp')}><Icon name="play"/>{$t('action.run')}</button>
    <button class="button" type="button" data-testid="step" on:click={() => blink.stepi()} disabled={!canStep} title={$t('action.stepHelp')}><Icon name="step"/>{$t('action.step')}</button>
    <button class="button" type="button" data-testid="continue" on:click={() => blink.continue()} disabled={!canStep} title={$t('action.continueHelp')}><Icon name="next"/>{$t('action.continue')}</button>
  </div>
  <span class="status-pill" class:busy role="status" title={$state === blink.states.PROGRAM_STOPPED ? stopMessage($t,blink.stopReason) : ''}><span class="status-dot"></span>{$t(`state.${$state || 'NOT_READY'}`)}</span>
</div>
