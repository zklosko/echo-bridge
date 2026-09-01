import blessed from 'blessed'
import { EchoServer } from './src/server.js'
import { parseArgs } from './src/tui/args.js'
import { getSettings, setPort, setEOM, getSubscribers, setSubscribers } from './src/store.js'

const args = parseArgs(process.argv)
const stored = getSettings()
const port = args.post ?? stored.port
const eom = args.eom ?? stored.eom

const host = new EchoServer({ listenPort: port, eom, subscribers: getSubscribers() })
let selected = 1
let commandMode = false

const screen = blessed.screen({ smartCSR: true, title: 'Echo Bridge'})

const header = blessed.box({
    top: 0, left: 0, width: '100%', height: 4,
    border: 'line', label: ' Echo Bridge ',
    content: 'Use up and down keys to cycle between spaces | : for commands',
    tags: true
})

const spacesBox = blessed.log({
    top: 4, left: 0, width: '50%', height: 16 + 4,
    border: 'line', label: ' Spaces ',
    tags: true
})

const zonesBox = blessed.box({
    bottom: 2, left: '50%', width: '50%', height: 16 + 4,
    border: 'line',
    tags: true
})

const statusLine = blessed.box({
    bottom: 0, left: 0, width: '100%', height: 1,
    tags: true
})

const commandInput = blessed.textbox({
    bottom: 0, left: 0, width: '100%', height: 1,
    inputOnFocus: true,
    hidden: true,
    style: { fg: 'white' }
})

screen.append(header)
screen.append(spacesBox)
screen.append(zonesBox)
screen.append(statusLine)
screen.append(commandInput)

function col(str, width) {
  return String(str).padEnd(width);
}

host.on('statusChange', () => renderAll())
host.on('subscribersChanged', () => renderAll())

console.log(`echo host listening on ${host.port}, eom=${JSON.stringify(host.eom)}`)

function renderAll() {
  renderSpaces();
  renderZones();
  renderStatus();
  screen.render();
}

function renderSpaces() {
  const header = `${col('Space', 8)}${col('Preset', 9)}${col('Off?', 7)}Sequences`;
  const rows = [];
  for (let id = 1; id <= 16; id++) {
    const space = host.state.getSpace(id);
    const off = space.off ? 'Yes' : 'No';
    const seq = (space.sequence ?? []).map(s => (s ? 1 : 0)).join(' ');
    const line = `${col(id, 8)}${col(space.preset ?? 0, 9)}${col(off, 7)}${seq}`;
    rows.push(id === selected ? `{yellow-fg}${line}{/yellow-fg}` : line);
  }
  spacesBox.setContent(`${header}\n\n${rows.join('\n')}`);
}

function renderZones() {
  const space = host.state.getSpace(selected);
  const zones = Object.fromEntries(space.zones);
  const title = 'Zones in selected space';
  const pad = Math.max(0, Math.floor((zonesBox.width - 2 - title.length) / 2));
  const lines = [' '.repeat(pad) + title, ''];
  for (const [zoneId, level] of Object.entries(zones)) {
    lines.push(`${col(zoneId, 4)}${level}`);
  }
  zonesBox.setContent(lines.join('\n'));
}

function renderStatus(message) {
  if (message) {
    statusLine.setContent(message);
    return;
  }
  statusLine.setContent(`{cyan-fg}Listening on port ${host.port}{/cyan-fg}`);
}

function openCommandInput() {
  commandMode = true;
  statusLine.hide();
  commandInput.show();
  commandInput.setValue(':');
  commandInput.focus();
  screen.render();
}

function closeCommandInput(message) {
  commandMode = false;
  commandInput.hide();
  commandInput.clearValue();
  statusLine.show();
  renderStatus(message);
  screen.render();
}

async function handleCommand(line) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  switch (cmd) {
    case 'port': {
      const n = Number(args[0]);
      if (!args[0] || Number.isNaN(n)) return closeCommandInput('{red-fg}usage: port <number>{/red-fg}');
      await host.updatePort(n);
      setPort(host.port);
      return closeCommandInput(`{cyan-fg}port -> ${host.port}{/cyan-fg}`);
    }
    case 'eom': {
      if (!args[0]) return closeCommandInput('{red-fg}usage: eom <char>{/red-fg}');
      host.eom = args[0];
      setEOM(host.eom);
      return closeCommandInput(`{cyan-fg}eom -> ${JSON.stringify(host.eom)}{/cyan-fg}`);
    }
    case 'sub': {
      const [action, address, portArg] = args;
      if (action === 'add') {
        if (!address || !portArg) return closeCommandInput('{red-fg}usage: sub add <address> <port>{/red-fg}');
        host.addSubscriber(address, Number(portArg));
      } else if (action === 'remove') {
        if (!address || !portArg) return closeCommandInput('{red-fg}usage: sub remove <address> <port>{/red-fg}');
        host.removeSubscriber(address, Number(portArg));
      } else {
        return closeCommandInput('{red-fg}usage: sub <add|remove> <address> <port>{/red-fg}');
      }
      setSubscribers(host.listSubscribers());
      return closeCommandInput(`{cyan-fg}subscribers: ${host.listSubscribers().length}{/cyan-fg}`);
    }
    case 'q':
    case 'quit':
      host.close();
      return process.exit(0);
    default:
      return closeCommandInput(`{red-fg}unknown command: ${cmd}{/red-fg}`);
  }
}

commandInput.on('submit', (value) => {
  const line = value.replace(/^:/, ''); // strip the leading ':' shown while typing
  handleCommand(line);
});

commandInput.key(['escape'], () => closeCommandInput());

screen.key([':'], () => {
  if (!commandMode) openCommandInput();
});
screen.key(['up'], () => {
  if (commandMode) return;
  selected = selected === 1 ? 16 : selected - 1;
  renderAll();
});
screen.key(['down'], () => {
  if (commandMode) return;
  selected = selected === 16 ? 1 : selected + 1;
  renderAll();
});
screen.key(['C-c'], () => {
  host.close();
  process.exit(0);
});
screen.key(['q'], () => {
  if (commandMode) return; // let 'q' be typed in commands; only quits when not in command mode
  host.close();
  process.exit(0);
});

renderAll();
