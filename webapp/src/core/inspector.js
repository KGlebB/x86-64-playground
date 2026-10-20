import {InspectorError} from './messages.js';

export const registerNames = ['rax', 'rbx', 'rcx', 'rdx', 'rsp', 'rbp', 'rsi', 'rdi',
  'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15', 'rip'];

export function registerAlias(name, bits) {
  if (name === 'rip' || bits === 64) return name;
  if (/^r\d+$/.test(name)) return name + (bits === 32 ? 'd' : 'w');
  return bits === 32 ? 'e' + name.slice(1) : name.slice(1);
}

export function formatInteger(value, bits = 64, radix = 16, signed = false) {
  const unsigned = BigInt.asUintN(bits, value);
  if (radix === 10) return (signed ? BigInt.asIntN(bits, unsigned) : unsigned).toString();
  const prefix = {2: '0b', 8: '0o', 16: '0x'}[radix];
  if (!prefix) throw new InspectorError('error.base');
  return prefix + unsigned.toString(radix);
}

const numeric = '(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|[0-9]+)';
const expression = new RegExp(`^(${numeric}|[a-zA-Z_.$?@][a-zA-Z0-9_.$?@]*)(?:\\s*([+-])\\s*(${numeric}))?$`);
const literal = new RegExp(`^${numeric}$`);
const maxAddress = (1n << 64n) - 1n;

export function resolveAddress(text, readRegister, symbols = []) {
  const match = expression.exec(text.trim());
  if (!match) throw new InspectorError('error.addressSyntax');
  const [, base, operator, offset] = match;
  let symbol;
  let address;
  if (literal.test(base)) address = BigInt(base);
  else if (registerNames.includes(base.toLowerCase())) address = readRegister(base.toLowerCase());
  else {
    const matches = symbols.filter(s => s.name === base);
    if (matches.length !== 1) throw new InspectorError(matches.length ? 'error.ambiguousLabel' : 'error.unknownLabel');
    symbol = matches[0];
    address = symbol.address;
  }
  if (offset) address += (operator === '-' ? -1n : 1n) * BigInt(offset);
  if (address < 0n || address > maxAddress) throw new InspectorError('error.addressRange');
  return {address, symbol};
}

/** Read guest pages independently: host pointers need not be contiguous. Null means unreadable. */
export function readMemoryRange(memory, spyAddress, address, length) {
  if (!Number.isInteger(length) || length < 0 || length > 4096) throw new InspectorError('error.rangeLength');
  if (address < 0n || address > maxAddress || address + BigInt(length) > maxAddress + 1n) throw new InspectorError('error.memoryRange');
  const bytes = Array(length).fill(null);
  let i = 0;
  while (i < length) {
    const guest = address + BigInt(i);
    const count = Math.min(length - i, 4096 - Number(guest & 4095n));
    // This Emscripten build legalizes uint64 arguments into two uint32 numbers.
    const ptr = spyAddress(Number(guest & 0xffffffffn), Number(guest >> 32n)) >>> 0;
    if (ptr && ptr + count <= memory.buffer.byteLength) {
      const page = new Uint8Array(memory.buffer, ptr, count);
      for (let j = 0; j < count; j++) bytes[i + j] = page[j];
    }
    i += count;
  }
  return bytes;
}

export function littleEndianInteger(bytes) {
  if (!bytes.length || bytes.some(b => b === null || b === undefined)) return null;
  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) result = (result << 8n) | BigInt(bytes[i]);
  return result;
}
