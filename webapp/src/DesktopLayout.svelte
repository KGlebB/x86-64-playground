<script>
  import {PaneGroup, Pane, PaneResizer} from 'paneforge';
  import Editor from './components/Editor.svelte';
  import Registers from './components/Registers.svelte';
  import Memory from './components/Memory.svelte';
  import Disassembler from './components/Disassembler.svelte';
  import Terminal from './components/Terminal.svelte';
  import Icon from './components/Icon.svelte';
  import {t} from './core/uiState.js';
</script>
<PaneGroup direction="vertical" class="workspace">
  <Pane defaultSize={80} minSize={35}>
    <PaneGroup direction="horizontal" class="workspace-columns">
      <Pane defaultSize={40} minSize={20}>
        <section class="panel"><div class="panel-heading"><Icon name="code" size={15}/><h2>{$t('panel.editor')}</h2><span class="panel-note">x86-64</span></div><div class="panel-content"><Editor/></div></section>
      </Pane>
      <PaneResizer class="pf__resizer pf__resizer--vertical" aria-label={$t('resize.columns')}/>
      <Pane defaultSize={30} minSize={15}>
        <section class="panel"><div class="panel-heading"><Icon name="step" size={15}/><h2>{$t('panel.disassembly')}</h2></div><div class="panel-content"><Disassembler/></div></section>
      </Pane>
      <PaneResizer class="pf__resizer pf__resizer--vertical" aria-label={$t('resize.columns')}/>
      <Pane defaultSize={30} minSize={20}>
        <PaneGroup direction="vertical">
          <Pane defaultSize={42} minSize={20}><section class="panel"><div class="panel-heading"><Icon name="registers" size={15}/><h2>{$t('panel.registers')}</h2></div><div class="panel-content"><Registers/></div></section></Pane>
          <PaneResizer class="pf__resizer pf__resizer--horizontal" aria-label={$t('resize.rows')}/>
          <Pane defaultSize={58} minSize={25}><section class="panel"><div class="panel-heading"><Icon name="memory" size={15}/><h2>{$t('panel.memory')}</h2></div><div class="panel-content"><Memory/></div></section></Pane>
        </PaneGroup>
      </Pane>
    </PaneGroup>
  </Pane>
  <PaneResizer class="pf__resizer pf__resizer--horizontal" aria-label={$t('resize.rows')}/>
  <Pane defaultSize={20} minSize={10}><section class="panel"><div class="panel-heading"><Icon name="terminal" size={15}/><h2>{$t('panel.terminal')}</h2></div><div class="panel-content"><Terminal/></div></section></Pane>
</PaneGroup>
