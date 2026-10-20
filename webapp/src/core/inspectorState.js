import { writable } from 'svelte/store';

// Separate from AppState: shared snippet URLs retain their existing wire format.
export const registerSettings = writable({ bits: 64, radix: 16, signed: false });
export const memorySettings = writable({ mode: 'hex', expression: 'rsp', size: '8', count: 32, radix: 16, signed: false });
export const activePanel = writable('editor');
