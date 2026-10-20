<p><img src="webapp/public/brand.svg" width="56" height="56" alt="x64 Lab logo"></p>

# x64 Lab

A bilingual x86-64 assembly playground with step-by-step debugging, register views, and live memory inspection. Runs entirely in your browser.

[Open x64 Lab](https://kglebb.github.io/x86-64-playground/) · [Русский](README.ru.md) · [Original project](https://github.com/robalb/x86-64-playground)

[![GitHub Pages](https://img.shields.io/github/actions/workflow/status/KGlebB/x86-64-playground/deploy_github_pages.yml?label=GitHub%20Pages)](https://github.com/KGlebB/x86-64-playground/actions/workflows/deploy_github_pages.yml) [![License: ISC](https://img.shields.io/badge/License-ISC-7c3aed)](LICENSE.txt)

![x64 Lab workspace](docs/preview.png)

## Features

- Assemble with FASM, NASM, or GNU as; step through instructions and inspect disassembly, flags, and terminal output.
- View the low 64, 32, or 16 bits of general-purpose registers in hexadecimal, decimal, octal, or binary. Decimal values support signed and unsigned interpretation.
- Inspect memory as a stack byte dump or a live table with element index, address, and value. Read 1/2/4/8-byte integers in little-endian order.
- Select FASM/NASM labels with automatic element size for unambiguous data declarations, including `dd`. Address expressions such as `rsp+16` and `array+4` are supported.
- Switch between English and Russian, and between light and dark themes. Preferences are saved locally; Russian is the initial interface language.
- Use a resizable desktop workspace or keyboard-accessible tabs on smaller screens. Load statically linked x86-64 ELF files or share source snippets through a URL.

Assembly and execution use the bundled Blink WebAssembly emulator locally in the browser. This fork does not include the upstream analytics counter. No server-side execution service is required. Offline reloads are not guaranteed.

## Run locally

Use **Node.js 20** (20.11.1 or newer within the 20.x series) and **npm 10**.

```sh
git clone --recurse-submodules https://github.com/KGlebB/x86-64-playground.git
cd x86-64-playground/webapp
npm ci
npm run dev
```

The development URL includes `/x86-64-playground/`. Precompiled emulator and assembler binaries are committed, so web interface changes do not require rebuilding Blink.

## Check and build

From `webapp`:

```sh
npm test
npm run build
npm run preview
```

Tests cover precise integer formatting, guest memory page boundaries, actual FASM/NASM assembly and execution, translation completeness, UI preferences, and application metadata. GitHub Actions runs the tests before deploying `webapp/dist` to GitHub Pages.

## Project and attribution

This repository is [KGlebB's fork](https://github.com/KGlebB/x86-64-playground) of [x86-64 playground by Alberto Ventafridda](https://github.com/robalb/x86-64-playground). x64 Lab adds register and memory inspection controls, localization, themes, and a redesigned workspace.

The emulator uses [robalb's Blink library fork](https://github.com/robalb/blink), based on [jart/blink](https://github.com/jart/blink). See [the design notes](docs/design.md), [emulator build instructions](docs/setup.md), and [web development notes](webapp/README.md).

The original ISC license and copyright notice are preserved in [LICENSE.txt](LICENSE.txt). The new x64 Lab SVG identity replaces the original wizard artwork in the application; historical documentation assets retain their original attribution to [Nur Achmadi Yusuf](https://thenounproject.com/icon/wizard-hat-6586306/).
