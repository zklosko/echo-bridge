<script>
    let { logs, onClear } = $props()

    let expandedIds = $state(new Set())

    function splitLines(raw) {
      return raw.split(/\r\n|\r|\n/).filter(Boolean)
    }

    function toggleExpanded(id) {
      const next = new Set(expandedIds)
      next.has(id) ? next.delete(id) : next.add(id)
      expandedIds = next
    }
</script>

<main>
    <div class="panel">
    <div class="log-header">
      <h2>Packet Log</h2>
      <button class="clear-btn" onclick={onClear}>Clear</button>
    </div>
    <div class="log-body">
      {#each logs as log (log.id)}
        {@const lines = splitLines(log.raw)}
        {@const isMultiLine = lines.length > 1}
        {@const isExpanded = expandedIds.has(log.id)}

        <div class="log-entry" class:multiline={isMultiLine}>
          <button class="log-entry-head" onclick={() => isMultiLine && toggleExpanded(log.id)} disabled={!isMultiLine}>
            <span class={[ "dir", log.direction === 'in' ? 'rx' : 'tx' ]}>{log.direction === 'in' ? 'RX' : 'TX'}</span>
            <span class="time">{log.time}</span>
            <span class="addr">{log.address}:{log.port}</span>
            {#if isMultiLine}
              <span class="line-count">{lines.length} lines</span>
              <span class="chevron" class:open={isExpanded}>▸</span>
            {:else}
              <span class="raw">{lines[0]}</span>
            {/if}
          </button>

          {#if isMultiLine && isExpanded}
            <div class="log-entry-body">
              {#each lines as line}
                <div class="log-line">{line}</div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
    </div>
</main>

<style>
.clear-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.clear-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}
.chevron{
  margin-left: auto;
  color: var(--muted);
  transition: transform 0.15s;
}
.chevron.open {
  transform: rotate(90deg);
}
.log-body {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.log-entry {
  border-bottom: 1px solid var(--border);
}
.log-entry-head {
  all: unset;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 4px;
  font-size: 12.5px;
  cursor: default;
  box-sizing: border-box;
}
.log-entry.multiline .log-entry-head {
  cursor: pointer;
}
.log-entry.multiline .log-entry-head:hover {
  background: rgba(255,255,255,0.03)
}
.log-entry-body {
  padding: 2px 4px 8px 40px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dir {
  flex-shrink: 0;
  width: 24px;
  font-weight: 600;
  text-align: center;
}
.dir.rx {
  color: var(--rx);
}
.dir.tx {
  color: var(--tx);
}
.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.time{
  flex-shrink: 0;
  color: var(--muted)
}
.raw{
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line-count{
  color: var(--muted);
  font-size: 11px;
}
.log-line {
  font-size: 12px;
  color: var(--muted);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>