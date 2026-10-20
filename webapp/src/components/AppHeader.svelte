<script>
  import Logo from './Logo.svelte';
  import Icon from './Icon.svelte';
  import {t, preferences, setPreference} from '../core/uiState.js';
  let linksOpen = false;
  let linksButton;
  let linksContainer;
  const fork = 'https://github.com/KGlebB/x86-64-playground';
  const original = 'https://github.com/robalb/x86-64-playground';
</script>
<svelte:window on:keydown={e => {if(e.key === 'Escape' && linksOpen) {linksOpen = false; linksButton?.focus();}}} on:pointerdown={e => {if(linksOpen && !linksContainer?.contains(e.target)) linksOpen = false;}}/>
<header class="app-header">
  <a class="brand" href={import.meta.env.BASE_URL} aria-label={$t('app.home')}><Logo/><span class="brand-text">x64 <strong>Lab</strong><span class="brand-caption">{$t('app.subtitle')}</span></span></a>
  <div class="header-actions">
    <nav class="project-links" aria-label={$t('app.navigation')}>
      <a href={fork} target="_blank" rel="noopener noreferrer">{$t('app.fork')}<Icon name="external" size={13}/></a>
      <a href={original} target="_blank" rel="noopener noreferrer">{$t('app.original')}<Icon name="external" size={13}/></a>
    </nav>
    <div class="language-switch" role="group" aria-label={$t('language.select')}>
      <button type="button" lang="ru" aria-pressed={$preferences.locale === 'ru'} on:click={() => setPreference('locale','ru')}>RU</button>
      <button type="button" lang="en" aria-pressed={$preferences.locale === 'en'} on:click={() => setPreference('locale','en')}>EN</button>
    </div>
    <button type="button" class="icon-button" data-testid="theme-toggle" aria-label={$t($preferences.theme === 'dark' ? 'theme.switchLight' : 'theme.switchDark')} title={$t($preferences.theme === 'dark' ? 'theme.switchLight' : 'theme.switchDark')} on:click={() => setPreference('theme',$preferences.theme === 'dark' ? 'light' : 'dark')}><Icon name={$preferences.theme === 'dark' ? 'sun' : 'moon'}/></button>
    <div class="compact-links" bind:this={linksContainer}>
      <button type="button" class="icon-button" bind:this={linksButton} aria-label={$t('app.links')} aria-expanded={linksOpen} aria-controls="project-link-menu" on:click={() => linksOpen = !linksOpen}><Icon name="menu"/></button>
      {#if linksOpen}<nav class="compact-menu" id="project-link-menu" aria-label={$t('app.navigation')}>
        <a href={fork} target="_blank" rel="noopener noreferrer" on:click={() => linksOpen=false}>{$t('app.fork')}<Icon name="external" size={14}/></a>
        <a href={original} target="_blank" rel="noopener noreferrer" on:click={() => linksOpen=false}>{$t('app.original')}<Icon name="external" size={14}/></a>
      </nav>{/if}
    </div>
  </div>
</header>
