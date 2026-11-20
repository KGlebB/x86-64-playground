import test from 'node:test';
import assert from 'node:assert/strict';
import {assemble} from './wasmHarness.mjs';
import {parseFasmDebug,parseFasmSymbols,parseNasmSymbols,parseElfSymbols} from '../src/core/debugSymbols.js';
import {readMemoryRange,littleEndianInteger,formatInteger,formatFloat64,formatMemoryInteger,
  layoutSegmentRows,readSegmentRows} from '../src/core/inspector.js';

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

test('FASM writable segments retain element boundaries, reservations and live Float64 values', async () => {
  const program = await assemble('FASM', `format ELF64 executable 3
segment readable writeable
input dq 2.5
result dq 0.0
integer dq 0xffffffffffffffff
word_array dw 1, 2
dd 12
virtual at input
  alias_in_virtual rq 5
end virtual
segment readable executable
entry $
fld qword [input]
fstp qword [result]
nop
segment readable
read_only dq 11.5
segment readable writeable
array: times 130 dq -0.5
reserved rq 2
`);
  const {segments} = parseFasmDebug(program.fas, program.elf);
  assert.equal(segments.length, 2);
  const layout = layoutSegmentRows(segments);
  const read = (address, length) => readMemoryRange(program.M.wasmExports.memory,
    (lo, hi) => program.M._blinkenlib_spy_address(lo, hi), address, length);
  const first = readSegmentRows(layout, 0, 128, read);
  assert.deepEqual(first.slice(0, 7).map(row => [row.name, row.type, row.value]), [
    ['input','dq',0x4004000000000000n], ['result','dq',0n], ['integer','dq',0xffffffffffffffffn],
    ['word_array[0]','dw',1n], ['word_array[1]','dw',2n], [undefined,'dd',12n],
    ['array[0]','dq',0xbfe0000000000000n],
  ]);
  assert.deepEqual(first.slice(0, 3).map(row => row.float), [true, true, false]);
  assert.equal(formatMemoryInteger(first[1].value, 8, 16, false), '0x0000000000000000');
  assert.equal(formatMemoryInteger(first[2].value, 8, 10, false), '18446744073709551615');
  assert.equal(formatMemoryInteger(first[2].value, 8, 10, true), '-1');
  assert.equal(formatFloat64(first[6].value), '-0.5');
  assert.equal(formatFloat64(0x8000000000000000n), '-0.0');
  assert.equal(formatFloat64(0x7ff0000000000000n), 'Infinity');
  assert.equal(formatFloat64(0x7ff8000000001234n), 'NaN');
  const tail = readSegmentRows(layout, 128, 128, read);
  assert.equal(layout.length, 138);
  assert.equal(tail[0].name, 'array[122]');
  assert.deepEqual(tail.slice(-2).map(row => [row.name, row.type, row.value]), [
    ['reserved[0]','rq',0n], ['reserved[1]','rq',0n],
  ]);
  program.M._blinkenlib_stepi();
  program.M._blinkenlib_stepi();
  assert.equal(formatFloat64(readSegmentRows(layout, 1, 1, read)[0].value), '2.5');
});

test('invalid debug files are rejected', () => {
  assert.throws(()=>parseFasmSymbols(new Uint8Array(64)));
  assert.throws(()=>parseElfSymbols(new Uint8Array(64)));
});
