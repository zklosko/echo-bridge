<script>
    import HelpPanel from "./components/HelpPanel.svelte";
    import PacketLog from "./components/PacketLog.svelte";
    import SettingsPanel from "./components/SettingsPanel.svelte";

    let selectedSpace = $state(1)
    const space = $state({ zones: {}, preset: null })
    const lastUpdated = $state({ text: '—' })

    const log = $state({ entries: [] })
    let logIdCounter = $state(0)

    async function init() {
      await refreshSpace();

      window.api.onLog((entry) => {
        console.log('renderer got log:', entry); 
        addLogEntry(entry)
      });
      window.api.onStatusChange(({ spaceId, space: updatedSpace }) => {
        console.log('renderer got statusChange:', { spaceId, updatedSpace }); 
        if (spaceId === selectedSpace) {
          Object.assign(space, updatedSpace)
          lastUpdated.text = new Date().toLocaleTimeString();
        }
      });
    }

    async function refreshSpace() {
      ({ zones: space.zones, preset: space.preset } = await window.api.getSpace(selectedSpace))
      lastUpdated.text = new Date().toLocaleTimeString();
    }

    function addLogEntry(entry) {
      logIdCounter += 1
      log.entries.unshift({
        id: logIdCounter,
        direction: entry.direction,
        address: entry.address,
        port: entry.port,
        raw: entry.raw,
        time: new Date(entry.timestamp).toLocaleTimeString()
      });
      if (log.entries.length > 500) log.entries.length = 500;
    }

    init()
</script>

<main>
  <div class="header">
    <h1>Echo Bridge <span>/dashboard</span></h1>
    <div class="header-actions">
      <SettingsPanel />
      <HelpPanel />
    </div>
  </div>
     
  <div class="grid">

    <div class="panel">
      <h2>Space</h2>
      <label>Select space
        <!-- Space picker dropdown -->
        <select bind:value={selectedSpace} onchange={() => refreshSpace()}>
          <!-- Create each option -->
          {#each { length: 16 }, s}
            <option value={s + 1}>Space {s + 1}</option>
          {/each}
        </select>
      </label>
      <div class="space" style="margin-top: 12px;">
        <div class="num">Space {selectedSpace}</div>
        <div class="preset">{space.preset ?? '—'}</div>
        <div class="zone-grid">
        <!-- Creates grid of zones -->
          {#each Object.entries(space.zones) as [znum, level]} <!-- :key="znum" -->
            <div class="zone"
                 title="Zone {znum}: {level}"
                 style={`background: rgba(232, 163, 61, ${level / 255})`}>
            </div>
          {/each}
        </div>
      </div>
      <div class="status">Last update: {lastUpdated.text}</div>
    </div>

    <PacketLog logs={log.entries} onClear={() => (log.entries = [])}/>

  </div>
</main>

<style>
    @import './style.css';
</style>
