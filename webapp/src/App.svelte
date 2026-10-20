<script>
  import './styles/style.css';
  import './styles/editor-theme.css';
  import DesktopLayout from './DesktopLayout.svelte';
  import MobileLayout from './MobileLayout.svelte';
  import AppHeader from './components/AppHeader.svelte';
  import Controls from './components/Controls.svelte';
  import Icon from './components/Icon.svelte';
  import {t} from './core/uiState.js';
  import {blinkStore} from './core/store';
  const blink = blinkStore.getInstance();
  window.blink = blink;
  let innerWidth = window.innerWidth;
  let dragDecoration = false;
  let timer;
  function dragover(event) {
    event.preventDefault(); dragDecoration = true;
    clearTimeout(timer); timer = setTimeout(() => dragDecoration = false, 2000);
  }
  async function drop(event) {
    event.preventDefault(); clearTimeout(timer); dragDecoration = false;
    const file = event.dataTransfer.files?.[0];
    if (file) { blink.loadElf(await file.arrayBuffer()); blinkStore.setUploadedElfName(file.name); }
  }
</script>
<svelte:window bind:innerWidth/>
<main class="app-shell" on:dragover={dragover} on:drop={drop}>
  <AppHeader/><Controls/>
  <div class="workbench">{#if innerWidth >= 1024}<DesktopLayout/>{:else}<MobileLayout/>{/if}</div>
  {#if dragDecoration}<div class="drop-overlay"><div class="drop-card"><Icon name="file" size={40}/><h2>{$t('drop.title')}</h2><p>{$t('drop.description')}</p></div></div>{/if}
</main>
