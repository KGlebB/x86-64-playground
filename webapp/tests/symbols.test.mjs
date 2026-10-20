import test from 'node:test';
import assert from 'node:assert/strict';
import {assemble} from './wasmHarness.mjs';
import {parseFasmSymbols,parseNasmSymbols,parseElfSymbols} from '../src/core/debugSymbols.js';
import {readMemoryRange,littleEndianInteger,formatInteger} from '../src/core/inspector.js';

for (const mode of ['FASM','NASM']) {
  test(`${mode}: real assembly, label types, dd decoding, writes and register views`, async () => {
    const head = mode === 'FASM' ? 'format ELF64 executable 3\nsegment readable executable\nentry $\n' : 'section .text\nglobal _start\n_start:\n';
    const data = mode === 'FASM' ? 'segment readable writeable\n' : 'section .data\n';
    const source = head + `mov rax, 0x123456789abcdef0\nlea rbx, [${mode === 'NASM' ? 'rel ' : ''}array]\nmov dword [rbx+4], 7\nsub rsp,8\nmov [rsp],rax\nnop\n` + data +
      'array dd 0x12345678,-1,256\n.local dw 123\nseparate:\n times 3 dd 1\nwide dq 0xffffffffffffffff\nbytes db 1,2\nmixed: db 1\n dw 2\n' +
      (mode === 'NASM' ? 'section .bss\nreserved resq 4\n' : 'reserved rq 4\n');
    const r = await assemble(mode,source);
    const symbols = mode === 'FASM' ? parseFasmSymbols(r.fas) : parseNasmSymbols(r.elf,r.listing);
    const find = name => {const s = symbols.find(s=>s.name===name);assert.ok(s, name); return s;};
    assert.equal(find('array').size,4);
    assert.equal(find('array.local').size,2);
    assert.equal(find('separate').size,4);
    assert.equal(find('wide').size,8);
    assert.equal(find('bytes').size,1);
    assert.equal(find('mixed').size,null);
    assert.equal(find('reserved').size,8);
    const read = (addr,n) => readMemoryRange(r.M.wasmExports.memory,(lo,hi)=>r.M._blinkenlib_spy_address(lo,hi),addr,n);
    const array = find('array').address;
    const bytes = read(array,12);
    assert.deepEqual([0,4,8].map(i=>littleEndianInteger(bytes.slice(i,i+4))),[0x12345678n,0xffffffffn,256n]);
    assert.equal(formatInteger(littleEndianInteger(bytes.slice(4,8)),32,10,true),'-1');
    assert.equal(formatInteger(littleEndianInteger(bytes.slice(4,8)),32,10,false),'4294967295');
    r.M._blinkenlib_stepi();
    assert.equal(r.register('rax'),0x123456789abcdef0n);
    assert.equal(formatInteger(r.register('rax'),32,16),'0x9abcdef0');
    assert.equal(formatInteger(r.register('rax'),16,16),'0xdef0');
    r.M._blinkenlib_stepi(); r.M._blinkenlib_stepi();
    assert.equal(littleEndianInteger(read(array+4n,4)),7n);
    const rsp = r.register('rsp');
    r.M._blinkenlib_stepi(); r.M._blinkenlib_stepi();
    assert.equal(r.register('rsp'),rsp-8n);
    assert.equal(littleEndianInteger(read(r.register('rsp'),8)),0x123456789abcdef0n);
    assert.deepEqual(read(0n,4),[null,null,null,null]);
  });
}

test('invalid debug files are rejected', () => {
  assert.throws(()=>parseFasmSymbols(new Uint8Array(64)));
  assert.throws(()=>parseElfSymbols(new Uint8Array(64)));
});
