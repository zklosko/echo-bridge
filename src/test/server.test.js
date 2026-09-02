import { test } from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import { EchoServer } from '../server.js';

const TEST_PORT = 18001; // fixed, unlikely-to-collide port for tests
const EOM = '\r';

function sendAndWaitForReply(
  command,
  port,
  { expectReply = true, timeoutMs = 500 } = {},
) {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    const timer = setTimeout(() => {
      client.close();
      expectReply
        ? reject(new Error('Timed out waiting for reply'))
        : resolve(null);
    }, timeoutMs);

    client.on('message', msg => {
      clearTimeout(timer);
      client.close();
      resolve(msg.toString());
    });

    client.send(Buffer.from(command + EOM, 'ascii'), port, '127.0.0.1');
  });
}

test('zone intensity set updates state and emits statusChange', async t => {
  const host = new EchoServer({ listenPort: TEST_PORT, eom: EOM });
  t.after(() => host.close());

  const changed = new Promise(resolve => {
    host.once('statusChange', (spaceId, space) => resolve({ spaceId, space }));
  });

  console.log('sending...');
  const reply = await sendAndWaitForReply(
    'E$zone int: 1, 3, 180, 0',
    TEST_PORT,
    { expectReply: false },
  );
  console.log('got reply:', reply);
  const { spaceId, space } = await changed;

  assert.equal(spaceId, 1);
  assert.equal(space.zones.get(3), 180);
});

test('zone int get replies with current zone levels', async t => {
  const port = TEST_PORT + 1;
  const host = new EchoServer({ listenPort: port, eom: EOM });
  t.after(() => host.close());

  await new Promise(resolve => {
    host.once('statusChange', resolve);
    const setupClient = dgram.createSocket('udp4');
    setupClient.send(
      Buffer.from(`E$zone int: 2, 1, 90, 0${EOM}`, 'ascii'),
      port,
      '127.0.0.1',
      () => setupClient.close(), // close once the send completes
    );
  });

  const reply = await sendAndWaitForReply('E$zone int get: 2', port, {
    expectReply: true,
  });
  const lines = reply.split(EOM).filter(Boolean);

  assert.equal(lines.length, 16);
  assert.ok(lines.includes('E>zone int: 2, 1, 90'));
  assert.ok(lines.includes('E>zone int: 2, 2, 0'));
});

test('off get reports correct state', async t => {
  const port = TEST_PORT + 2;
  const host = new EchoServer({ listenPort: port, eom: EOM });
  t.after(() => host.close());

  await new Promise(resolve => {
    host.once('statusChange', resolve);
    const setupClient = dgram.createSocket('udp4');
    setupClient.send(
      Buffer.from(`E$zone int: 3, 1, 0, 0${EOM}`, 'ascii'),
      port,
      '127.0.0.1',
      () => setupClient.close(),
    );
  });

  const reply = await sendAndWaitForReply('E$off get: 3', port);
  assert.equal(reply, `E>space off: 3, 1${EOM}`);
});

test('unrecognized command produces no reply and no state change', async t => {
  const port = TEST_PORT + 3;
  const host = new EchoServer({ listenPort: port, eom: EOM });
  t.after(() => host.close());

  let statusChanged = false;
  host.once('statusChange', () => {
    statusChanged = true;
  });

  const reply = await sendAndWaitForReply('E$totally bogus', port, {
    expectReply: false,
  });

  assert.equal(reply, null);
  assert.equal(statusChanged, false);
});
