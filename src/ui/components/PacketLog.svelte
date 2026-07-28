<script>
    let { logs } = $props()
</script>

<main>
    <div class="panel log-panel">
      <h2>Packet Log</h2>
      {#each logs as log (log.id)}
        <div class="log-log">
          <span class={[ "dir", log.direction === 'in' ? 'rx' : 'tx' ]}>{log.direction === 'in' ? 'RX' : 'TX'}</span>
          <span>{log.time} {log.address}:{log.port}  {log.raw}</span>
        </div>
      {/each}
    </div>
</main>