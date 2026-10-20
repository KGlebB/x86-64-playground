<script>
  export let name = 'code';
  export let size = 18;
  const paths = {
    code:'m8 5-6 7 6 7m8-14 6 7-6 7m-3-17-2 20',
    play:'m8 4 12 8-12 8Z', step:'m4 5 10 7-10 7Zm15 0v14', next:'m3 5 9 7-9 7Zm10 0 9 7-9 7Z', restart:'M3 11a9 9 0 1 1 2 7M3 4v7h7',
    sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0', moon:'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',
    external:'M14 3h7v7m0-7L10 14M10 3H4v17h17v-6', menu:'M4 6h16M4 12h16M4 18h16', close:'m6 6 12 12M6 18 18 6', copy:'M8 8h13v13H8ZM16 8V3H3v13h5', chevron:'m6 9 6 6 6-6',
    check:'m4 12 5 5L20 6', file:'M14 2H4v20h16V8Zm0 0v6h6', share:'M12 16V2m-5 5 5-5 5 5M4 13v9h16v-9',
    registers:'M6 3h12v18H6ZM9 7h6m-6 5h6m-6 5h6M2 7h4m-4 5h4m-4 5h4m12-10h4m-4 5h4m-4 5h4', memory:'M3 4h18v16H3Zm0 5h18M8 9v11m6-11v11', terminal:'m4 5 7 7-7 7m9 0h7',
  };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] || paths.code}/></svg>
