# x64 Lab web application

Svelte 4 + Vite 5. Use Node 20 and npm 10 as declared in `package.json`.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Serve the application under `/x86-64-playground/`. The committed WASM and assembler binaries are sufficient for interface development. See [the emulator build guide](../docs/setup.md) to change Blink itself.

## UI state and translations

`src/core/preferences.js` reads and validates `x64lab.preferences` in browser storage. The first locale is Russian and the initial theme follows the OS. `uiState.js` exposes the preference store and reactive translator; `messages.js` contains matching English/Russian keys and parameterized errors. UI preferences do not change the existing saved source or Share format. Theme colors and Prism variables are in `src/styles/`.

The global header and toolbar are shared by desktop and mobile layouts. Desktop panels use PaneForge. Narrow screens keep all five panels mounted behind accessible tabs. Theme and locale changes update text and CSS without recreating the editor or emulator.

## Register and memory inspection

General-purpose register widths are 64/32/16 bits; RIP stays 64-bit. Values use BigInt, and signed interpretation applies only to decimal output. Memory elements use little-endian groups of 1/2/4/8 bytes. Missing bytes display Unavailable rather than zero.

The memory table accepts an address, 64-bit register, or FASM/NASM label, optionally followed by a numeric offset. Addresses accept `0x`, `0o`, `0b`, or decimal notation; qualify local labels such as `array.local`. Selecting a label enables Auto element size. FASM symbolic output and NASM ELF symbols plus listings provide addresses and unambiguous types. Mixed declarations require a manual size. Row count is independent of array length; later rows may show following memory. GNU as and uploaded ELF programs use manual addresses/registers. Floating-point decoding is not provided.

Values refresh after steps, stops, input waits, and Refresh, plus emulator yields during continuous execution (up to five times per second). The debugger does not write memory.

## Verification

`npm test` uses Node's test runner, including actual execution of the committed emulator and FASM/NASM binaries. `npm run build` produces the static Pages artifact. Browser checks should cover both locales, both themes, 390/768/1440 px widths, focus and menus, live memory updates, input waits, and preference persistence. The Pages workflow runs tests before the production build.
