<script>
    import { isValidIPv4, isValidPort } from '../../main/validate.js'
    const settings = $state({ port: 8001, eom: '\r\n' })
    const status = $state({ text: '' })

    let subscribers = $state([])
    let newAddress = $state('')
    let newPort = $state(4703)
    let subscriberError = $state('')

    let editingKey = $state(null)
    let editAddress = $state('')
    let editPort = $state(4703)

    let showSettings = $state(false)

    async function init() {
      console.log('settings init() running');
      const { port, eom } = await window.api.getSettings();
      console.log('got from getSettings:', port, eom);
      settings.port = port;
      settings.eom = eom;

      loadSubscribers()
    }

    async function apply() {
      status.text = 'Applying...';
      try {
        await window.api.setPort(settings.port);
        await window.api.setEom(settings.eom);
        status.text = 'Applied.';
        showSettings = false
      } catch (err) {
        status.text = `Error: ${err.message}`;
      }
    }

    async function loadSubscribers() {
      subscribers = await window.api.getSubscribers();
    }

    async function addSubscriber() {
      subscriberError = ''
      if (!isValidIPv4(newAddress)) {
        subscriberError = 'Invalid IPv4 address'
        return
      }
      if (!isValidPort(newPort)) {
        subscriberError = 'Invalid port'
      }
      try {
        subscribers = await window.api.addSubscriber(newAddress, newPort);
        newAddress = ''
      } catch (e) {
        subscriberError = e.message
      }
    }

    function startEdit(sub) {
      editingKey = `${sub.address}:${sub.port}`
      editAddress = sub.address
      editPort = sub.port
    }

    function cancelEdit() {
      editingKey = null
    }

    async function saveEdit(sub) {
      subscriberError = ''
      if (!isValidIPv4(editAddress)) {
        subscriberError = 'Invalid IPv4 address'
        return
      }
      if (!isValidPort(newPort)) {
        subscriberError = 'Invalid port'
      }
      try {
        subscribers = await window.api.updateSubscriber(sub.address, sub.port, editAddress, editPort)
        editingKey = null
      } catch (e) {
        subscriberError = e.message
      }
    }

    async function removeSubscriber(sub) {
      subscribers = await window.api.removeSubscriber(sub.address, sub.port);
    }

    init()
</script>

<div>
    <button class="gear-btn" onclick={() => showSettings = !showSettings} title="Settings">⚙</button>

    {#if showSettings}
    <div class="backdrop">
      <button class="backdrop-close" aria-label="Close settings" onclick={() => showSettings = false}></button>
      <div class="modal" role="dialog" tabindex="-1" aria-modal="true">

        <h2>Settings</h2>
        <label>Port
          <input type="number" min="1" max="65535" bind:value={settings.port} />
        </label>
        <label>EOM
          <select bind:value={settings.eom}>
            <option value="\r">\r</option>
            <option value="\n">\n</option>
            <option value="\r\n">\r\n</option>
          </select>
        </label>
        <h3>Subscribers</h3>
        {#each subscribers as sub (sub.address + ':' + sub.port)}
        <div class="subscriber-row">
          {#if editingKey === `${sub.address}:${sub.port}`}
            <input type="text" bind:value={editAddress} />
            <input type="number" bind:value={editPort} />
            <button onclick={() => saveEdit(sub)}>Save</button>
            <button onclick={cancelEdit}>Cancel</button>
          {:else}
            <span>{sub.address}:{sub.port}</span>
            <button onclick={() => startEdit(sub)}>Edit</button>
            <button onclick={() => removeSubscriber(sub)}>Remove</button>
          {/if}
        </div>
        {/each}

        <div class="subscriber-add">
          <input type="text" placeholder="IP address" bind:value={newAddress} />
          <input type="number" placeholder="Port" bind:value={newPort} />
          <button onclick={addSubscriber}>Add</button>
        </div>

        <button onclick={apply}>Apply</button>
        <div class="status">{status.text}</div>
      </div>
    </div>
  {/if}
  </div>