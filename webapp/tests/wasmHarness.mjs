import fs from 'node:fs';
import factory from '../src/assets/blinkenlib.js';

// The committed Emscripten bundle targets browsers; supply its minimal window check.
globalThis.window ??= {};

export async function assemble(mode, source) {
  let finish;
  let logs = '';
  const M = await factory({ noInitialRun: true,
    wasmBinary: fs.readFileSync(new URL('../src/assets/blinkenlib.wasm', import.meta.url)),
    print: () => {}, printErr: () => {},
    preRun: m => m.FS.init(() => null, c => logs += String.fromCharCode(c), c => logs += String.fromCharCode(c)),
  });
  const signal = M.addFunction((sig, code) => {
    if (code === 40) setImmediate(() => M._blinkenlib_preempt_resume());
  }, 'vii');
  const exited = M.addFunction(code => finish?.(code), 'vi');
  M.callMain([String(signal), String(exited)]);
  const files = { FASM: 'fasm.1.73.32.elf', NASM: 'nasm.3.00.elf', GNU: 'gnu-as.2.43.50.elf' };
  const install = (name, file) => {
    M.FS.writeFile('/' + name, fs.readFileSync(new URL('../src/assets/assemblers/' + file, import.meta.url)));
    M.FS.chmod('/' + name, 0o777);
  };
  install('assembler', files[mode]);
  M.FS.writeFile('/assembly.s', source);
  const write = (ptr, text) => {
    const data = new TextEncoder().encode(text + '\0');
    new Uint8Array(M.wasmExports.memory.buffer, ptr, data.length).set(data);
  };
  const args = (program, command) => {
    write(M._blinkenlib_get_progname_string(), program);
    write(M._blinkenlib_get_argc_string(), command);
    write(M._blinkenlib_get_argv_string(), '');
  };
  const run = command => new Promise(resolve => {
    finish = resolve;
    args(command.split(' ')[0], command);
    M._blinkenlib_run_fast();
  });
  const commands = {
    FASM: '/assembler /assembly.s /program -s /program.fas',
    NASM: '/assembler -felf64 /assembly.s -o /program.o -l /program.lst',
    GNU: '/assembler /assembly.s -o /program.o',
  };
  let code = await run(commands[mode]);
  if (code === 0 && mode !== 'FASM') {
    install('linker', 'gnu-ld.2.43.50.elf');
    code = await run('/linker /program.o -o /program');
  }
  if (code !== 0) throw new Error(logs);
  const elf = M.FS.readFile('/program');
  const fas = mode === 'FASM' ? M.FS.readFile('/program.fas') : null;
  const listing = mode === 'NASM' ? M.FS.readFile('/program.lst', {encoding: 'utf8'}) : '';
  M.FS.chmod('/program', 0o777);
  args('/program', '/program');
  M._blinkenlib_starti();
  return { M, elf, fas, listing, source, register(name) {
    const indices = {rax:22,rbx:23,rcx:24,rdx:25,rsp:10,rip:9};
    const view = new DataView(M.wasmExports.memory.buffer);
    return view.getBigUint64(view.getUint32(M._blinkenlib_get_clstruct() + indices[name] * 4, true), true);
  }};
}
