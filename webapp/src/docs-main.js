import DocsPage from './DocsPage.svelte'
import {readPreferences} from './core/preferences.js'

let storage;
try { storage = window.localStorage; } catch { storage = null; }
document.documentElement.dataset.theme = readPreferences(storage, matchMedia('(prefers-color-scheme: dark)').matches).theme;

const app = new DocsPage({
  target: document.getElementById('app'),
})

export default app
