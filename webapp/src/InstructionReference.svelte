<script>
  import './styles/style.css';
  import Logo from './components/Logo.svelte';
  import {translate} from './core/messages.js';
  import {instructionCatalog, intelManual} from './core/instructionCatalog.js';

  export let initialLocale;
  const entries = [...instructionCatalog.values()].sort((a, b) => a.mnemonic.localeCompare(b.mnemonic, 'en'));
  const labels = {all:'reference.all', x86:'reference.x86', x87:'reference.x87'};
  let locale = initialLocale;
  let selected = location.hash.slice(1).toUpperCase();
  let group = instructionCatalog.get(selected)?.group === 'x87' ? 'x87' : 'all';
  let query = '';

  function changeLocale(next) {
    locale = next;
    const url = new URL(location.href);
    url.searchParams.set('lang', next);
    history.replaceState(history.state, '', url);
  }

  function openHash() {
    selected = location.hash.slice(1).toUpperCase();
    const entryGroup = instructionCatalog.get(selected)?.group;
    if (entryGroup && group !== 'all' && group !== entryGroup) group = entryGroup;
  }

  $: document.documentElement.lang = locale;
  $: t = translate.bind(null, locale);
  $: terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  $: matches = entries.filter(entry => (group === 'all' || entry.group === group) &&
    terms.every(term => `${entry.mnemonic} ${entry[locale]}`.toLowerCase().includes(term)));
  $: active = matches.find(entry => entry.mnemonic === selected) ?? matches[0];
</script>

<svelte:head><title>{t('reference.title')} · x64 Lab</title></svelte:head>
<svelte:window on:hashchange={openHash}/>

<header class="app-header">
  <a class="brand" href={import.meta.env.BASE_URL} aria-label={t('app.home')}>
    <Logo/><span class="brand-text">x64 <strong>Lab</strong></span>
  </a>
  <div class="language-switch" role="group" aria-label={t('language.select')}>
    <button type="button" lang="ru" aria-pressed={locale === 'ru'} on:click={() => changeLocale('ru')}>RU</button>
    <button type="button" lang="en" aria-pressed={locale === 'en'} on:click={() => changeLocale('en')}>EN</button>
  </div>
</header>

<main class="reference-page">
  <h1>{t('reference.title')}</h1>
  <div class="reference-filters">
    <label class="search-field">{t('reference.search')}
      <input type="search" bind:value={query} placeholder="MOV, FSTP" spellcheck="false" />
    </label>
    <label>{t('reference.group')}
      <select bind:value={group}>
        {#each Object.entries(labels) as [value, label]}
          <option {value}>{t(label)}</option>
        {/each}
      </select>
    </label>
  </div>

  {#if active}
    <div class="reference-layout">
      <nav class="reference-index" aria-label={t('reference.index')}>
        <p class="match-count" role="status">{t('reference.count', {count:matches.length})}</p>
        <ul class="mnemonics">
          {#each matches as entry (entry.mnemonic)}
            <li><a href={`#${entry.mnemonic}`} aria-current={entry === active ? 'location' : undefined}>{entry.mnemonic}</a></li>
          {/each}
        </ul>
      </nav>

      <article class="reference-entry" aria-labelledby="instruction-title">
        <header class="entry-heading">
          <h2 id="instruction-title">{active.mnemonic}</h2>
          <p>{t(labels[active.group])}</p>
        </header>
        <p class="instruction-description">{active[locale]}</p>
        {#if active.example}
          <h3>{t('reference.example')}</h3>
          <pre><code>{active.example}</code></pre>
        {/if}
        {#if active.group === 'x87'}
          <aside class="x87-note">
            <h3>{t('example.x87')}</h3>
            <p>{t('reference.x87Stack')}</p>
            <p>{t('register.x87Precision')}</p>
          </aside>
        {/if}
        <footer class="reference-sources">
          {#if active.url}<a href={active.url} target="_blank" rel="noopener noreferrer">{t('reference.details')}</a>{/if}
          <a href={intelManual} target="_blank" rel="noopener noreferrer">{t('reference.manual')}</a>
        </footer>
      </article>
    </div>
  {:else}
    <p class="reference-empty" role="status">{t('reference.empty')}</p>
  {/if}
</main>

<style>
  .reference-page {max-width:72rem;margin:0 auto;padding:2rem clamp(1rem,4vw,3rem);}
  h1 {margin:0 0 1.25rem;font-size:clamp(1.55rem,4vw,2.15rem);line-height:1.2;}
  .reference-filters {display:flex;gap:.75rem;margin-bottom:1rem;}
  .reference-filters label {display:flex;flex-direction:column;gap:.25rem;color:var(--theme-text-fg-disabled);}
  .reference-filters input,.reference-filters select {min-height:2.5rem;max-width:100%;padding:0 .65rem;border:1px solid var(--theme-panel-border);border-radius:8px;background:var(--theme-panel-bg);color:var(--theme-text-fg);}
  .search-field {flex:1;min-width:0;}
  .reference-layout {display:grid;grid-template-columns:minmax(15rem, 1fr) minmax(0, 1.6fr);align-items:start;gap:1rem;}
  .reference-index,.reference-entry,.reference-empty {margin:0;border:1px solid var(--theme-panel-border);border-radius:10px;background:var(--theme-panel-bg);}
  .reference-index {min-width:0;}
  .match-count {margin:0;padding:.65rem .85rem;border-bottom:1px solid var(--theme-panel-border);color:var(--theme-text-fg-disabled);font-size:.85rem;}
  .mnemonics {display:grid;grid-template-columns:repeat(auto-fill,minmax(6.25rem,1fr));align-content:start;gap:.35rem;max-height:55vh;overflow:auto;list-style:none;margin:0;padding:.7rem;}
  .mnemonics a {display:block;padding:.4rem .5rem;border-radius:5px;font:600 .8rem var(--code-font-family);color:var(--theme-text-fg);text-decoration:none;}
  .mnemonics a:hover {background:var(--hover);}
  .mnemonics a[aria-current] {background:var(--accent-soft);color:var(--theme-primary);}
  .reference-entry,.reference-empty {padding:clamp(1rem,3vw,1.5rem);min-width:0;}
  .entry-heading {display:flex;align-items:baseline;justify-content:space-between;gap:.6rem;}
  .entry-heading h2 {overflow-wrap:anywhere;font:700 clamp(1.3rem,4vw,1.8rem) var(--code-font-family);margin:0;}
  .entry-heading p {margin:0;color:var(--theme-text-fg-disabled);white-space:nowrap;}
  .instruction-description {font-size:1.05rem;margin:1rem 0;}
  h3 {font-size:.9rem;margin:0 0 .5rem;}
  pre {background:var(--theme-panel-controls-bg);padding:.65rem .85rem;border-radius:6px;overflow:auto;margin:0 0 1rem;}
  code {font-family:var(--code-font-family);}
  .x87-note {padding:.75rem 1rem;border-left:3px solid var(--theme-primary);background:var(--theme-panel-controls-bg);}
  .x87-note p {margin:.25rem 0;color:var(--theme-text-fg-disabled);}
  .reference-sources {display:flex;flex-wrap:wrap;gap:.75rem 1rem;margin-top:1.1rem;font-size:.9rem;}
  @media (max-width:660px) {
    .reference-page {padding-top:1rem;}
    .reference-layout {grid-template-columns:1fr;}
    .reference-entry {grid-row:1;}
    .mnemonics {max-height:40vh;}
  }
</style>
