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

<style>
  .modal h2 {
    margin: 0 0 16px;
    font-size: 15px;
  }
  .modal h3 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin: 20px 0 10px;
  }

  label {
    display: block;
    margin-top: 14px;
    font-size: 12px;
    color: var(--muted);
  }
  input,
  select {
    width: 100%;
    box-sizing: border-box;
    padding: 6px;
    margin-top: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: inherit;
    font-size: 13px;
    border-radius: 3px;
  }

  .subscriber-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .subscriber-row span {
    flex: 1;
  }
  .subscriber-row input {
    width: auto;
    flex: 1;
    margin-top: 0;
  }
  .subscriber-row button {
    flex-shrink: 0;
  }

  .subscriber-add {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }
  .subscriber-add input {
    margin-top: 0;
  }
  .subscriber-add input[type='text'] {
    flex: 2;
  }
  .subscriber-add input[type='number'] {
    flex: 1;
  }

  button {
    padding: 6px 12px;
    border-radius: 3px;
    background: var(--panel);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .modal > button {
    width: 100%;
    margin-top: 20px;
    background: var(--accent);
    border: none;
    color: #16181c;
    font-weight: 600;
  }
  .modal > button:hover {
    color: #16181c;
    opacity: 0.9;
  }

  .status {
    color: var(--muted);
    font-size: 11px;
    margin-top: 10px;
  }
</style>