/** @typedef {'light'|'dark'} Theme */
/** @typedef {'ru'|'en'} Locale */
export const preferencesKey = 'x64lab.preferences';

export function readPreferences(storage, prefersDark = false) {
  let saved;
  try { saved = JSON.parse(storage?.getItem(preferencesKey) || '{}'); } catch { saved = {}; }
  return {
    theme: saved?.theme === 'dark' || saved?.theme === 'light' ? saved.theme : prefersDark ? 'dark' : 'light',
    locale: saved?.locale === 'en' ? 'en' : 'ru',
  };
}

export function savePreferences(storage, preferences) {
  try { storage?.setItem(preferencesKey, JSON.stringify(preferences)); return true; }
  catch { return false; }
}
