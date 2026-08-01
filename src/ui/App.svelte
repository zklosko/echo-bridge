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
        <!-- Space picker dropdown -->
        <select bind:value={selectedSpace} onchange={() => refreshSpace()}>
          <!-- Create each option -->
          {#each { length: 16 }, s}
            <option value={s + 1}>Space {s + 1}</option>
          {/each}
        </select>
      <div class="space">
        <div class="space-top">
          <div class="num">Space {selectedSpace}</div>
          <div class="preset">Preset: {space.preset || '—'}</div>
        </div>
        <div class="zone-grid">
        <!-- Creates grid of zones -->
          {#each Object.entries(space.zones) as [znum, level] (znum)}
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
  h1 {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0;
  }
  h1 span {
    color: var(--accent);
  }
  .grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 20px;
    align-items: start;
  }
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .space {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 12px;
  }
  .space-top {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .zone-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .zone {
    aspect-ratio: 1;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: rgba(232, 163, 61, var(--level, 0));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: background 0.15s ease;
  }
  .status {
    color: var(--muted);
    font-size: 11px;
    margin-top: 12px;
  }
</style>
