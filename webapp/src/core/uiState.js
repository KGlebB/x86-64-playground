import {writable, derived} from 'svelte/store';
import {readPreferences, savePreferences} from './preferences.js';
import {translate} from './messages.js';

let storage;
try { storage = window.localStorage; } catch { storage = null; }
const initial = readPreferences(storage, window.matchMedia('(prefers-color-scheme: dark)').matches);
export const preferences = writable(initial);
export const t = derived(preferences, p => (key, params = {}) => translate(p.locale, key, params));

preferences.subscribe(p => {
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.lang = p.locale;
  document.title = `x64 Lab · ${translate(p.locale, 'app.subtitle')}`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', translate(p.locale,'app.description'));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.theme === 'dark' ? '#101116' : '#f6f7fb');
});

export function setPreference(key, value) {
  if (key === 'theme' && !['light','dark'].includes(value) || key === 'locale' && !['ru','en'].includes(value) || !['theme','locale'].includes(key)) return;
  preferences.update(p => { const next = {...p, [key]:value}; savePreferences(storage,next); return next; });
}
