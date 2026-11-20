import upstream from '../assets/asm-docs-amd64.json';
import russian from '../assets/asm-docs-ru.json';
import x87 from '../assets/asm-docs-x87.json';

export const intelManual = 'https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html';

export const instructionCatalog = new Map(Object.entries(upstream).map(([mnemonic, [en, url]]) => [
  mnemonic, {mnemonic, en, ru:russian[mnemonic], url, group:'x86'},
]));

for (const [mnemonic, [ru, en, example]] of Object.entries(x87)) {
  const url = instructionCatalog.get(mnemonic)?.url;
  instructionCatalog.set(mnemonic, {mnemonic, ru, en, example, url, group:'x87'});
}
