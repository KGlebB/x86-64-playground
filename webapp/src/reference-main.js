import InstructionReference from './InstructionReference.svelte';
import {readPreferences} from './core/preferences.js';

let storage;
try { storage = window.localStorage; } catch { storage = null; }
const {theme, locale} = readPreferences(storage, matchMedia('(prefers-color-scheme: dark)').matches);
const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
const initialLocale = ['ru', 'en'].includes(requestedLanguage) ? requestedLanguage : locale;
document.documentElement.dataset.theme = theme;

new InstructionReference({target:document.getElementById('app'), props:{initialLocale}});
