const linkerScript = `
ENTRY(_start)
SECTIONS
{
  PROVIDE(__executable_start = 0x400000);
  . = 0x400000 + SIZEOF_HEADERS;
  .note.gnu.property : { *(.note.gnu.property) }
  . = ALIGN(0x1000);
  .text : { *(.text .text.*) }
  PROVIDE(__etext = .);
  PROVIDE(_etext = .);
  PROVIDE(etext = .);
  . = ALIGN(0x1000);
  .rodata : { *(.rodata .rodata.*) }
  . = ALIGN(0x1000) + (. & 0xfff);
  .data : { *(.data .data.*) }
  PROVIDE(_edata = .);
  PROVIDE(edata = .);
  __bss_start = .;
  .bss : { *(.bss .bss.*) *(COMMON) . = ALIGN(. != 0 ? 8 : 1); }
  . = ALIGN(8);
  PROVIDE(_end = .);
  PROVIDE(end = .);
}
`;

export const gnuLinker = { commands: "/linker /program.o -o /program -T /link.ld --hash-size=31", linkerScript };
