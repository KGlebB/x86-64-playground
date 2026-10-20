import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {messages,translate,InspectorError,stopMessage} from '../src/core/messages.js';
import {readPreferences,savePreferences,preferencesKey} from '../src/core/preferences.js';

test('English and Russian dictionaries have exactly the same complete keys', () => {
  assert.deepEqual(Object.keys(messages.en).sort(),Object.keys(messages.ru).sort());
  for(const locale of ['en','ru'])for(const [key,value] of Object.entries(messages[locale]))assert.ok(value.trim(),`${locale}:${key}`);
});
test('parameter formatting, stable error codes and exit messages', () => {
  assert.equal(translate('ru','input.overLimit',{count:8}),'Последние 8 байт превышают размер чтения и будут пропущены.');
  assert.equal(translate('en','field.bits',{bits:32}),'32 bit');
  const error = new InspectorError('error.unknownLabel');
  assert.equal(error.code,'error.unknownLabel');
  assert.notEqual(translate('ru',error.code),error.message);
  assert.equal(stopMessage((k,p)=>translate('ru',k,p),{messageKey:'stop.exit',params:{exitCode:7}}),'Программа завершена с кодом 7.');
});
test('Russian default, system theme, persisted valid choices and invalid data', () => {
  assert.deepEqual(readPreferences(null,true),{theme:'dark',locale:'ru'});
  assert.deepEqual(readPreferences(null,false),{theme:'light',locale:'ru'});
  for(const text of ['{','null','7','{"theme":"pink","locale":"xx"}'])assert.deepEqual(readPreferences({getItem:()=>text}),{theme:'light',locale:'ru'});
  let stored;
  const storage={getItem:key=>{assert.equal(key,preferencesKey);return stored;},setItem:(key,value)=>{assert.equal(key,preferencesKey);stored=value;}};
  assert.equal(savePreferences(storage,{theme:'dark',locale:'en'}),true);
  assert.deepEqual(readPreferences(storage),{theme:'dark',locale:'en'});
});
test('unavailable browser storage falls back without throwing', () => {
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};
  assert.deepEqual(readPreferences(blocked,true),{theme:'dark',locale:'ru'});
  assert.equal(savePreferences(blocked,{theme:'light',locale:'en'}),false);
});
test('manifest paths, branding, canonical URL and removed upstream analytics', () => {
  const manifest=JSON.parse(fs.readFileSync(new URL('../public/site.webmanifest',import.meta.url),'utf8'));
  assert.equal(manifest.name,'x64 Lab');assert.equal(manifest.start_url,'./');
  assert.ok(manifest.icons.every(i=>!i.src.startsWith('/')));
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(index.includes('https://kglebb.github.io/x86-64-playground/'));
  assert.ok(!index.includes('analytics.halb.it') && !index.includes('goatcounter'));
  for(const file of ['ControlsCompilebt.svelte','ControlsShareDialog.svelte'])assert.ok(!fs.readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8').includes('goatcounter'));
});
