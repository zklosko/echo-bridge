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
    <div class="panel log-panel">
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