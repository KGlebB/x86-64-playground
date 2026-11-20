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

Vite builds both the playground and the [design system reference](https://kglebb.github.io/x86-64-playground/docs.html). The reference also runs locally at `/x86-64-playground/docs.html` and uses the playground's saved theme.

## UI state and translations

`src/core/preferences.js` reads and validates `x64lab.preferences` in browser storage. The first locale is Russian and the initial theme follows the OS. `uiState.js` exposes the preference store and reactive translator; `messages.js` contains matching English/Russian keys and parameterized errors. UI preferences do not change the existing saved source or Share format. Theme colors and Prism variables are in `src/styles/`.

The global header and toolbar are shared by desktop and mobile layouts. Desktop panels use PaneForge. Narrow screens keep all five panels mounted behind accessible tabs. Theme and locale changes update text and CSS without recreating the editor or emulator.

Prism Code Editor uses the grammar for the selected assembler. Hover over an instruction or press **Ctrl+K**, then **Ctrl+I** with the caret on its mnemonic to show the reference hint. While editing, **Tab** indents and **Escape** restores Tab navigation.

## Register and memory inspection

General-purpose register widths are 64/32/16 bits. RIP stays 64-bit. Integer values use BigInt. Signed interpretation applies to decimal output. The x87 inspector shows the logical stack and its control, status, tag and TOP fields from Blink's version 2 debug structure.

Memory elements use little-endian groups of 1, 2, 4 or 8 bytes. Unmapped bytes display **Unavailable**. The address view accepts a numeric address, 64-bit register, or FASM/NASM label, optionally followed by a numeric offset. Qualify local labels such as `array.local`. Selecting an unambiguous FASM/NASM label enables **Auto** element size. GNU as and uploaded ELF programs use manual addresses and sizes.

The FASM segment view combines ELF64 writable load ranges and FASM assembly records to show typed elements, arrays and reserved storage. The **Float64** option interprets 8 bytes as a double and shows the original bits in HEX.

Values refresh after steps, stops, input waits, and Refresh, plus emulator yields during continuous execution (up to five times per second). The debugger does not write memory.

## Verification

`npm test` uses Node's test runner, including actual execution of the committed emulator and FASM/NASM binaries. `npm run build` produces the static Pages artifact. Browser checks should cover both locales, both themes, 390/768/1440 px widths, focus and menus, live memory updates, input waits, and preference persistence. The Pages workflow runs tests before the production build.
