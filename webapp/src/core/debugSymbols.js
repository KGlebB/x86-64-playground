// Addresses come from assembler output, never from byte-pattern searches or source offsets.
const decoder = new TextDecoder();
const widths = {db:1, dw:2, dd:4, dq:8, resb:1, resw:2, resd:4, resq:8, rb:1, rw:2, rd:4, rq:8};
const identifier = '[a-zA-Z_.$?@][a-zA-Z0-9_.$?@]*';
const declaration = new RegExp(`^(${identifier})\\s*:|^(${identifier})\\s+(?=(?:times\\b|d[bwdq]\\b|res[bwdq]\\b|r[bwdq]\\b))`, 'i');

function binary(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const range = (offset, length) => {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > bytes.length) throw new Error('Invalid debug information range.');
    return offset;
  };
  const string = (offset, end = bytes.length) => {
    range(offset, 0);
    const zero = bytes.indexOf(0, offset);
    return decoder.decode(bytes.subarray(offset, zero < 0 ? end : Math.min(end, zero)));
  };
  return {view, range, string};
}

/** Associate data declarations with labels, including a label on its own line. */
function declarationTypes(lines) {
  const types = new Map();
  let scope = '';
  let pending = [];
  let active = [];
  const note = (names, width) => {
    for (const name of names) {
      if (!types.has(name)) types.set(name, width);
      else if (types.get(name) !== width) types.set(name, null);
    }
  };
  for (const original of lines) {
    // Strings cannot declare labels or directives. Preserve quotes while removing comments.
    let line = original.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|;.*$/g, token => token.startsWith(';') ? '' : '""').trim();
    if (!line || line.startsWith('%')) continue;
    let match;
    let hasLabel = false;
    while ((match = declaration.exec(line))) {
      const raw = match[1] || match[2];
      const name = raw.startsWith('.') && !raw.startsWith('..') ? scope + raw : raw;
      if (!raw.startsWith('.')) scope = raw;
      if (!hasLabel) active = [];
      hasLabel = true;
      pending.push(name);
      line = line.slice(match[0].length).trim();
    }
    if (!line) continue;
    const data = /^(?:times\s+.+?\s+)?(db|dw|dd|dq|resb|resw|resd|resq|rb|rw|rd|rq)\b/i.exec(line);
    if (data) {
      active.push(...pending);
      pending = [];
      note(active, widths[data[1].toLowerCase()]);
    } else {
      // No inference through instructions, section changes or complex constructs.
      note(pending, null);
      pending = [];
      active = [];
    }
  }
  return types;
}

export function parseElfSymbols(bytes) {
  const {view:v, range, string} = binary(bytes);
  range(0, 64);
  if (v.getUint32(0, false) !== 0x7f454c46 || bytes[4] !== 2 || bytes[5] !== 1 || v.getUint16(18, true) !== 62) throw new Error('Expected a little-endian x86-64 ELF.');
  const start = Number(v.getBigUint64(40, true));
  const stride = v.getUint16(58, true);
  const count = v.getUint16(60, true);
  if (!count) return [];
  if (stride < 64) throw new Error('Invalid ELF section size.');
  range(start, stride * count);
  const section = index => {
    if (index < 0 || index >= count) throw new Error('Invalid ELF section index.');
    return start + index * stride;
  };
  const symbols = [];
  for (let i = 0; i < count; i++) {
    const s = section(i);
    if (v.getUint32(s + 4, true) !== 2) continue; // SHT_SYMTAB
    const offset = Number(v.getBigUint64(s + 24, true));
    const length = Number(v.getBigUint64(s + 32, true));
    const entrySize = Number(v.getBigUint64(s + 56, true));
    if (entrySize < 24 || length % entrySize) throw new Error('Invalid ELF symbol table.');
    range(offset, length);
    const strings = section(v.getUint32(s + 40, true));
    const stringOffset = Number(v.getBigUint64(strings + 24, true));
    const stringLength = Number(v.getBigUint64(strings + 32, true));
    range(stringOffset, stringLength);
    for (let p = offset; p < offset + length; p += entrySize) {
      const nameIndex = v.getUint32(p, true);
      const type = bytes[p + 4] & 15;
      const index = v.getUint16(p + 6, true);
      if (!nameIndex || nameIndex >= stringLength || index === 0 || index >= count || ![0, 1].includes(type)) continue;
      if (!(v.getBigUint64(section(index) + 8, true) & 2n)) continue; // SHF_ALLOC
      symbols.push({name:string(stringOffset + nameIndex, stringOffset + stringLength), address:v.getBigUint64(p + 8, true), size:null});
    }
  }
  return symbols;
}

export function parseNasmSymbols(elf, listing) {
  // NASM puts expanded source after the fixed-width address/bytes columns.
  const lines = listing.split(/\r?\n/).filter(line => /^\s*\d+\s/.test(line))
    .map(line => line.slice(40).replace(/^\s*<\d+>\s*/, ''));
  const types = declarationTypes(lines);
  return parseElfSymbols(elf).map(s => ({...s, size:types.get(s.name) ?? null}));
}

export function parseFasmSymbols(bytes) {
  const {view:v, range, string} = binary(bytes);
  range(0, 56);
  if (v.getUint32(0, true) !== 0x1a736166) throw new Error('Invalid FASM symbolic file.');
  const strings = v.getUint32(16, true), stringsLength = v.getUint32(20, true);
  const start = v.getUint32(24, true), length = v.getUint32(28, true);
  const pre = v.getUint32(32, true), preLength = v.getUint32(36, true);
  range(strings, stringsLength); range(start, length); range(pre, preLength);
  if (length % 32) throw new Error('Invalid FASM symbol table.');
  const readLine = relative => {
    let p = pre + relative + 16;
    range(pre + relative, 16);
    const tokens = [];
    while (p < pre + preLength && bytes[p]) {
      const token = bytes[p++];
      if (token === 0x3b) break; // preprocessor-only tail
      if (token === 0x1a) {
        const n = bytes[range(p++, 1)];
        range(p, n); tokens.push(decoder.decode(bytes.subarray(p, p + n))); p += n;
      } else if (token === 0x22) {
        range(p, 4); const n = v.getUint32(p, true); p += 4;
        range(p, n); p += n; tokens.push('""');
      } else tokens.push(String.fromCharCode(token));
    }
    return tokens.join(' ');
  };
  const dump = v.getUint32(40, true), dumpLength = v.getUint32(44, true);
  range(dump, dumpLength);
  const lines = [];
  for (let p = dump; p + 28 <= dump + dumpLength; p += 28) lines.push(readLine(v.getUint32(p + 4, true)));
  const types = declarationTypes(lines);
  const symbols = [];
  for (let p = start; p < start + length; p += 32) {
    const flags = v.getUint16(p + 8, true);
    if (!(flags & 1) || flags & (2 | 0x400) || bytes[p + 11] !== 0) continue;
    const n = v.getUint32(p + 24, true);
    if (!n) continue;
    let name;
    if (n & 0x80000000) {
      const index = n & 0x7fffffff;
      if (index >= stringsLength) throw new Error('Invalid FASM symbol name.');
      name = string(strings + index, strings + stringsLength);
    } else {
      if (n >= preLength) throw new Error('Invalid FASM symbol name.');
      const ptr = pre + n;
      range(ptr + 1, bytes[ptr]);
      name = decoder.decode(bytes.subarray(ptr + 1, ptr + 1 + bytes[ptr]));
    }
    const attached = bytes[p + 10];
    const inferred = types.get(name);
    // A mixed declaration is ambiguous even if FASM attached the first size.
    const size = types.has(name) ? inferred : ([1,2,4,8].includes(attached) ? attached : null);
    symbols.push({name, address:v.getBigUint64(p, true), size:size ?? null});
  }
  return symbols;
}
