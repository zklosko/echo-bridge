<script>
    const settings = $state({ port: 8001, eom: '\r\n' })
    const cmdExamples = [
      'E$pst act: spc_num(1-16), pst_num(1-64), time',
      'E$off: spc_num(1-16), time',
      'E$seq act: spc_num(1-16), seq_num(1-4)',
      'E$seq dact: spc_num(1-16), seq_num(1-4)',
      'E$zone int: spc_num(1-16), zn_num(1-16), level(0-255), time',
      'E$pst get: spc_num(1-16)',
      'E$off get: spc_num(1-16)',
      'E$seq get: spc_num(1-16)',
      'E$sync get: spc_num(0-16)',
      'E$zone int get: spc_num(1-16)',
      'E$help'
    ];

    let showHelp = $state(false)

    async function init() {
      const { port, eom } = await window.api.getSettings();
      settings.port = port;
      settings.eom = eom;
    }

    init()
</script>

<div>
    <button class="help-btn" onclick={() => showHelp = !showHelp} title="Help">?</button>

    {#if showHelp}
    <div class="backdrop">
      <button class="backdrop-close" aria-label="Close help" onclick={() => showHelp = false}></button>
      <div class="modal" role="dialog" tabindex="-1" aria-modal="true">

        <h2>Help</h2>
        <p>Here are a list of commands the Echo Integration Interface recognizes:</p>
        {#each cmdExamples as cmd (cmd)}
          <div class="help">
            <span>{cmd}{settings.eom}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  </div>