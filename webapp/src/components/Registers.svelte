<script>
import {t} from '../core/uiState.js';
import { blinkStore, manual_render } from "../core/store";

import { registerSettings } from '../core/inspectorState.js';
import { registerNames, registerAlias, formatInteger } from '../core/inspector.js';
const blink = blinkStore.getInstance();

let registers = registerNames.map(name => ({name, value:0n, previous:0n, valid:false}));
function clearHighlights() {
  registers = registers.map(r => ({...r, previous:r.value}));
}

let eflagsStr = "0x0";
let eflagsBytes = BigInt(0x0);
let eflagsUpdated = false;
let eflags = [
	{
		name: "CF",
		name_short: "C",
		name_long: "Carry Flag",
		name_gef: "carry",
		name_1: "CY",
		name_0: "NC",
		mask: 0x00000001,
		value: 0,
		updated: false,
		description:
			"1=Carry, 0=No carry. Indicates an arithmetic carry or borrow out of the most significant bit in arithmetic operations.",
	},
	{
		name: "PF",
		name_short: "P",
		name_long: "Parity Flag",
		name_gef: "parity",
		name_1: "PE",
		name_0: "PO",
		mask: 0x00000004,
		value: 0,
		updated: false,
		description:
			"1=Even, 0=Odd. Set if the least significant byte of the result contains an even number of set bits.",
	},
	{
		name: "AF",
		name_short: "A",
		name_long: "Auxiliary Carry Flag",
		name_gef: "auxiliary",
		name_1: "AC",
		name_0: "NA",
		mask: 0x00000010,
		value: 0,
		updated: false,
		description:
			"1=Auxiliary carry, 0=No auxiliary carry. Indicates a carry or borrow between bit 3 and bit 4 of the lower nibble (used in BCD arithmetic).",
	},
	{
		name: "ZF",
		name_short: "Z",
		name_long: "Zero Flag",
		name_gef: "zero",
		name_1: "ZR",
		name_0: "NZ",
		mask: 0x00000040,
		value: 0,
		updated: false,
		description:
			"1=Zero, 0=Nonzero. Set if the result of an arithmetic or logical operation is zero.",
	},
	{
		name: "SF",
		name_short: "S",
		name_long: "Sign Flag",
		name_gef: "sign",
		name_1: "NG",
		name_0: "PL",
		mask: 0x00000080,
		value: 0,
		updated: false,
		description:
			"1=Negative, 0=Positive. Reflects the sign (most significant bit) of the result of the last arithmetic operation.",
	},
	{
		name: "TF",
		name_short: "T",
		name_long: "Trap Flag",
		name_gef: "trap",
		display: false,
		name_1: "ST",
		name_0: "NT",
		mask: 0x00000100,
		value: 0,
		updated: false,
		description:
			"1=Enable single-step mode for debugging; generates a debug exception after each instruction.",
	},
	{
		name: "DF",
		name_short: "D",
		name_long: "Direction Flag",
		name_gef: "direction",
		name_1: "DN",
		name_0: "UP",
		mask: 0x00000400,
		value: 0,
		updated: false,
		description:
			"1=Decrement, 0=Increment. Controls string operations; if set, string instructions process data from high addresses to low addresses.",
	},
	{
		name: "OF",
		name_short: "O",
		name_long: "Overflow Flag",
		name_gef: "overflow",
		name_1: "OV",
		name_0: "NV",
		mask: 0x00000800,
		value: 0,
		updated: false,
		description:
			"1=Overflow, 0=No overflow. Indicates that the signed result of an operation is too large to fit in the destination operand.",
	},
];

function updateRegisters() {
	if (!blink.canInspect()) {
    registers = registers.map(r => ({...r, valid:false, previous:0n, value:0n}));
    eflagsStr = '—';
    eflagsUpdated = false;
    eflags = eflags.map(f => ({...f, value:false, updated:false}));
    return;
  }
  registers = registers.map(r => {
    const value = blink.m.readU64(r.name);
    return {...r, previous:r.valid ? r.value : value, value, valid:true};
  });

	eflagsStr = blink.m.stringReadU64("flags");
	const new_eflagsBytes = blink.m.readU64("flags");
	if (new_eflagsBytes === eflagsBytes) {
		eflagsUpdated = false;
	} else {
		eflagsUpdated = true;
		eflagsBytes = new_eflagsBytes;
	}
	for (const flag of eflags) {
		const new_value = (BigInt(flag.mask) & eflagsBytes) > 0;
		if (new_value === flag.value) {
			flag.updated = false;
		} else {
			flag.updated = true;
			flag.value = new_value;
		}
	}
	//force svelte rerendering
	eflags = eflags;
}

//rerender registers on machine step
$: $manual_render, updateRegisters();
</script>

<section class="registers" aria-label={$t('register.values')}>
  <div class="inspector-controls" on:change={clearHighlights}>
    <label>{$t('field.width')}
      <select aria-label={$t('register.width')} bind:value={$registerSettings.bits}>
        <option value={64}>{$t('field.bits',{bits:64})}</option><option value={32}>{$t('field.bits',{bits:32})}</option><option value={16}>{$t('field.bits',{bits:16})}</option>
      </select>
    </label>
    <label>{$t('field.base')}
      <select aria-label={$t('register.base')} bind:value={$registerSettings.radix}>
        <option value={16}>HEX</option><option value={10}>DEC</option><option value={8}>OCT</option><option value={2}>BIN</option>
      </select>
    </label>
    <label>{$t('field.sign')}
      <select aria-label={$t('register.sign')} bind:value={$registerSettings.signed} disabled={$registerSettings.radix !== 10}>
        <option value={false}>{$t('field.unsigned')}</option><option value={true}>{$t('field.signed')}</option>
      </select>
    </label>
  </div>
{#each registers as r}
    {@const bits = r.name === 'rip' ? 64 : $registerSettings.bits}
    <p class="register-row" data-register={r.name}>
      <span class="name" class:updated={r.valid && BigInt.asUintN(bits, r.value) !== BigInt.asUintN(bits, r.previous)}>{registerAlias(r.name, bits)}</span>
      <span class="int">{r.valid ? formatInteger(r.value, bits, $registerSettings.radix, r.name !== 'rip' && $registerSettings.signed) : '—'}</span>
    </p>
{/each}
    <br/>
    <p>
      <span class="name" class:updated={eflagsUpdated}>eflags</span> :
      <span class="int">
            {eflagsStr}
        </span>
        <br/>
        [
{#each eflags as f}
    {#if f.value}
        <span class="flag infotooltip" role="img" aria-label={$t(`flags.${f.name}`)} class:updated={f.updated}
                    title={$t(`flags.${f.name}`)}
                >{f.name}</span>
    {/if}
            <span></span>
{/each}
        ]
    </p>
    <br/>

</section>


<style>
.registers {
  padding: .5rem;
  padding-left: 1rem;

  font-family: var(--code-font-family);
  font-size: .9rem;
}
.register-row { display:grid; grid-template-columns:4ch minmax(0, 1fr); gap:.6rem; }
.register-row .int { overflow-wrap:anywhere; min-width:0; }
.registers p{
  margin: 0;
}

.registers {
  & .name {
    color: var(--theme-reg-name);
    white-space: pre;
  }
  & .updated{
    color: var(--theme-reg-name-updated);
  }
  & .int {
    color: var(--theme-reg-value-int);
  }
  & .infotooltip:hover {
    text-decoration: underline;
    cursor: pointer;
  }
}

</style>
