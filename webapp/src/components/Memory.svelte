<script>
  import {t} from '../core/uiState.js';
  import {InspectorError} from '../core/messages.js';
  import Hexdump from './Hexdump.svelte';
  import {blinkStore, manual_render} from '../core/store';
  import {memorySettings} from '../core/inspectorState.js';
  import {resolveAddress, littleEndianInteger, formatInteger} from '../core/inspector.js';

  const blink = blinkStore.getInstance();
  let symbols = [];
  let rows = [];
  let error = '';
  let information = '';
  let inspectable = false;
  let size = 8;
  let lastRange = '';
  let generation = -1;
  let revision = 0;
  let lastRevision = -1;

  function refresh(settings, tick) {
    const newProgram = generation !== blink.programGeneration;
    generation = blink.programGeneration;
    symbols = blink.debugSymbols;
    information = blink.debugInfoError;
    inspectable = blink.canInspect();
    if (!inspectable) {
      rows = []; lastRange = ''; error = 'error.noProgram';
      return;
    }
    if (settings.mode !== 'table') return;
    try {
      const count = Number(settings.count);
      if (!Number.isInteger(count) || count < 1 || count > 256) throw new InspectorError('error.rows');
      const resolved = resolveAddress(settings.expression, name => blink.m.readU64(name), symbols);
      size = settings.size === 'auto' ? resolved.symbol?.size : Number(settings.size);
      if (![1,2,4,8].includes(size)) throw new InspectorError('error.autoSize');
      const data = blink.readMemory(resolved.address, size * count);
      const key = `${settings.expression}:${size}:${count}:${generation}`;
      const changedFrame = tick !== lastRevision && !newProgram && lastRange === key;
      rows = Array.from({length:count}, (_, index) => {
        const value = littleEndianInteger(data.slice(index * size, (index + 1) * size));
        return {index, address:resolved.address + BigInt(index * size), value,
          updated:changedFrame && !!rows[index] && rows[index].address === resolved.address + BigInt(index * size) && rows[index].value !== value};
      });
      lastRange = key;
      lastRevision = tick;
      error = '';
    } catch (e) {
      error = e.code || 'error.memory'; rows = []; lastRange = '';
    }
  }

  function chooseSymbol(event) {
    if (!event.target.value) return;
    $memorySettings = {...$memorySettings, expression:event.target.value, size:'auto'};
  }

  // Settings and emulator frames are separate: changing display format is not a memory write.
  $: refresh($memorySettings, $manual_render + revision);
</script>

<section class="memory-inspector" aria-label={$t('memory.inspector')}>
  <div class="inspector-controls memory-mode">
    <label>{$t('memory.view')}
      <select aria-label={$t('memory.view')} bind:value={$memorySettings.mode}>
        <option value="hex">{$t('memory.hex')}</option><option value="table">{$t('memory.table')}</option>
      </select>
    </label>
    {#if $memorySettings.mode === 'hex'}<span class="inspector-hint">{$t('memory.stack')}</span>{/if}
    {#if $memorySettings.mode === 'table'}<button class="inspector-refresh" type="button" on:click={() => revision++}>{$t('action.refresh')}</button>{/if}
  </div>
  {#if $memorySettings.mode === 'hex'}
    {#if inspectable}<Hexdump />{:else}<p class="empty-message">{$t('error.noProgram')}</p>{/if}
  {:else}
    <div class="inspector-controls">
      <label class="address-input">{$t('memory.addressLabel')}
        <input aria-label={$t('memory.address')} type="text" spellcheck="false" bind:value={$memorySettings.expression} placeholder={$t('memory.placeholder')} />
      </label>
      <label>{$t('memory.labelField')}
        <select aria-label={$t('memory.label')} value="" on:change={chooseSymbol} disabled={!symbols.length}>
          <option value="">{$t('memory.chooseLabel')}</option>
          {#each symbols as symbol}
            <option value={symbol.name}>{symbol.name}{symbol.size ? ` · ${$t('memory.bytes',{size:symbol.size})}` : ''}</option>
          {/each}
        </select>
      </label>
      <label>{$t('memory.elementField')}
        <select aria-label={$t('memory.element')} bind:value={$memorySettings.size}>
          <option value="auto">{$t('memory.auto')}</option>
          <option value="1">{$t('memory.bytes',{size:1})}</option><option value="2">{$t('memory.bytes',{size:2})}</option>
          <option value="4">{$t('memory.bytes',{size:4})} (dd)</option><option value="8">{$t('memory.bytes',{size:8})}</option>
        </select>
      </label>
      <label>{$t('memory.rowsField')} <input aria-label={$t('memory.rows')} type="number" min="1" max="256" step="1" bind:value={$memorySettings.count} /></label>
      <label>{$t('field.base')}
        <select aria-label={$t('memory.base')} bind:value={$memorySettings.radix}>
          <option value={16}>HEX</option><option value={10}>DEC</option><option value={8}>OCT</option><option value={2}>BIN</option>
        </select>
      </label>
      <label>{$t('field.sign')}
        <select aria-label={$t('memory.sign')} bind:value={$memorySettings.signed} disabled={$memorySettings.radix !== 10}>
          <option value={false}>{$t('field.unsigned')}</option><option value={true}>{$t('field.signed')}</option>
        </select>
      </label>
    </div>
    {#if error}<p class="inspector-message" role="status">{$t(error)}</p>{/if}
    {#if information}<p class="inspector-message">{$t(information)}</p>{/if}
    {#if rows.length}
      <p class="inspector-hint table-hint">{$t('memory.hint',{size})}</p>
      <table aria-label={$t('memory.values')}>
        <thead><tr><th scope="col">{$t('memory.index')}</th><th scope="col">{$t('memory.columnAddress')}</th><th scope="col">{$t('memory.value')}</th></tr></thead>
        <tbody>
          {#each rows as row (row.index)}
            <tr class:changed={row.updated}>
              <td>{row.index}</td><td class="memory-address">{formatInteger(row.address)}</td>
              <td class="memory-value" class:unavailable={row.value === null}>{row.value === null ? $t('memory.unavailable') : formatInteger(row.value, size * 8, $memorySettings.radix, $memorySettings.signed)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</section>

<style>
  .memory-mode { padding:.5rem .75rem 0; align-items:center; }
  .memory-mode label { flex-direction:row; align-items:center; }
  .memory-mode .inspector-refresh { margin-left:auto; }
  .memory-inspector > .inspector-controls:not(.memory-mode) { padding:0 .75rem .5rem; }
  .address-input { flex:1 1 12rem; }
  input[type="number"] { width:5rem; }
  table { border-collapse:collapse; width:100%; font-family:var(--code-font-family); font-size:.85rem; table-layout:auto; }
  th, td { padding:.3rem .5rem; text-align:left; border-bottom:1px solid var(--theme-panel-border); vertical-align:top; }
  th { background:var(--theme-panel-controls-bg); position:sticky; top:0; }
  .memory-value { overflow-wrap:anywhere; word-break:break-all; min-width:5ch; }
  .memory-address { color:var(--theme-reg-name); white-space:nowrap; }
  .changed .memory-value { color:var(--theme-reg-name-updated); }
  .unavailable { color:var(--theme-text-fg-disabled); }
  .table-hint { margin:.25rem .75rem .5rem; }
</style>
