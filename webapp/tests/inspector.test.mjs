import test from 'node:test';
import assert from 'node:assert/strict';
import {registerNames, registerAlias, formatInteger, resolveAddress, readMemoryRange, littleEndianInteger} from '../src/core/inspector.js';

test('all general purpose register aliases and fixed RIP width', () => {
  assert.deepEqual(registerNames.map(n => registerAlias(n, 32)), ['eax','ebx','ecx','edx','esp','ebp','esi','edi','r8d','r9d','r10d','r11d','r12d','r13d','r14d','r15d','rip']);
  assert.deepEqual(registerNames.map(n => registerAlias(n, 16)), ['ax','bx','cx','dx','sp','bp','si','di','r8w','r9w','r10w','r11w','r12w','r13w','r14w','r15w','rip']);
});

for (const bits of [16,32,64]) {
  test(`${bits}-bit truncation, sign limits and exact integer bases`, () => {
    const max = (1n << BigInt(bits)) - 1n;
    const sign = 1n << BigInt(bits - 1);
    assert.equal(formatInteger(max, bits, 10), max.toString());
    assert.equal(formatInteger(max, bits, 10, true), '-1');
    assert.equal(formatInteger(sign, bits, 10, true), (-sign).toString());
    assert.equal(formatInteger(sign - 1n, bits, 10, true), (sign - 1n).toString());
    assert.equal(formatInteger(max + 1n, bits, 16), '0x0');
    assert.equal(formatInteger(-1n, bits, 2, true), '0b' + '1'.repeat(bits));
    assert.equal(formatInteger(max, bits, 8, true), '0o' + max.toString(8));
  });
}

test('64-bit values stay exact above the Number precision limit', () => {
  assert.equal(formatInteger(0xffffffffffffffffn,64,10), '18446744073709551615');
  assert.equal(formatInteger(0x123456789abcdef0n,32,16), '0x9abcdef0');
  assert.equal(formatInteger(0x123456789abcdef0n,16,16), '0xdef0');
});

test('limited address grammar, qualified labels and 64-bit offsets', () => {
  const symbols = [{name:'array.local',address:0x20000000000001n,size:4}];
  assert.equal(resolveAddress('array.local + 4',()=>0n,symbols).address,0x20000000000005n);
  assert.equal(resolveAddress('RSP - 0x10',()=>0x100n).address,0xf0n);
  for (const value of ['0x10','0o20','0b10000','16']) assert.equal(resolveAddress(value,()=>0n).address,16n);
  for (const value of ['-1','rsp*2','globalThis.alert(1)','0x10000000000000000','rsp-1','missing']) assert.throws(()=>resolveAddress(value,()=>0n));
  assert.throws(()=>resolveAddress('a',()=>0n,[{name:'a',address:0n},{name:'a',address:1n}]));
});

test('little-endian grouping and missing bytes', () => {
  assert.equal(littleEndianInteger([0x78,0x56,0x34,0x12]),0x12345678n);
  assert.equal(littleEndianInteger(Array(8).fill(255)),0xffffffffffffffffn);
  assert.equal(littleEndianInteger([1,null,0,0]),null);
  assert.equal(littleEndianInteger([]),null);
});

test('guest page boundaries use independent host translations, including unaligned reads', () => {
  const memory = {buffer:new ArrayBuffer(0x7000)};
  const heap = new Uint8Array(memory.buffer);
  heap.set([0x78,0x56],0x3ffe);
  heap.set([0x34,0x12],0x5000);
  const calls = [];
  const spy = (lo,hi) => { calls.push([lo,hi]); return lo === 0x1ffe ? 0x3ffe : lo === 0x2000 ? 0x5000 : 0; };
  assert.equal(littleEndianInteger(readMemoryRange(memory,spy,0x1ffen,4)),0x12345678n);
  assert.deepEqual(calls,[[0x1ffe,0],[0x2000,0]]);
  assert.deepEqual(readMemoryRange(memory,spy,0x2ffen,4),[null,null,null,null]);
});

test('unmapped tail, host bounds, memory growth and full 64-bit address splitting', () => {
  const memory = {buffer:new ArrayBuffer(8192)};
  new Uint8Array(memory.buffer)[4095] = 17;
  assert.deepEqual(readMemoryRange(memory,lo=>lo===0xfff?4095:0,0xfffn,2),[17,null]);
  assert.deepEqual(readMemoryRange(memory,()=>8191,0n,2),[null,null]);
  let address;
  assert.deepEqual(readMemoryRange(memory,(lo,hi)=>{address=[lo,hi];return 0;},0x123456789abcdef0n,1),[null]);
  assert.deepEqual(address,[0x9abcdef0,0x12345678]);
  const growingSpy = () => {memory.buffer=new ArrayBuffer(8192); new Uint8Array(memory.buffer)[1]=42; return 1;};
  assert.deepEqual(readMemoryRange(memory,growingSpy,0n,1),[42]);
  assert.throws(()=>readMemoryRange(memory,()=>0,0xffffffffffffffffn,2));
});
