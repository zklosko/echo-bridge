import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createControllerState } from '../main/state.js';
import {
  buildHelpReply,
  buildOffGetReply,
  buildPstGetReply,
  buildZoneIntGetReply,
  buildSyncGetReply,
} from '../main/reply-builder.js';

const EOM = '\r';

test('buildPstGetReply reflects current preset', () => {
  const state = createControllerState();
  state.setPreset(3, 12);
  const reply = buildPstGetReply(3, state, EOM);
  assert.equal(reply, `E>pst get: 3, 12${EOM}`);
});

test('buildZoneIntGetReply lists all zones for a space', () => {
  const state = createControllerState();
  state.setZoneLevel(1, 1, 128);
  state.setZoneLevel(1, 2, 64);
  const reply = buildZoneIntGetReply(1, state, EOM);
  const lines = reply.split(EOM).filter(Boolean);

  assert.equal(lines.length, 16); // all zones initialized, not just touched ones
  assert.ok(lines.includes('E>zone int: 1, 1, 128'));
  assert.ok(lines.includes('E>zone int: 1, 2, 64'));
  assert.ok(lines.includes('E>zone int: 1, 3, 0')); // untouched zones default to 0
});

test('buildOffGetReply reports off (1) when all zones are 0', () => {
  const state = createControllerState();
  state.setZoneLevel(2, 1, 0);
  state.setZoneLevel(2, 2, 0);
  const reply = buildOffGetReply(2, state, EOM);
  assert.equal(reply, `E>space off: 2, 1${EOM}`);
});

test('buildOffGetReply reports on (0) when any zone is nonzero', () => {
  const state = createControllerState();
  state.setZoneLevel(2, 1, 0);
  state.setZoneLevel(2, 2, 50);
  const reply = buildOffGetReply(2, state, EOM);
  assert.equal(reply, `E>space off: 2, 0${EOM}`);
});

test('buildSyncGetReply for a single space includes preset + zones', () => {
  const state = createControllerState();
  state.setPreset(5, 7);
  state.setZoneLevel(5, 1, 255);
  const reply = buildSyncGetReply(5, state, EOM);

  assert.ok(reply.includes(`E>pst act: 5, 7${EOM}`));
  assert.ok(reply.includes('E>zone int: 5, 1, 255'));
  assert.ok(reply.includes('E>zone int: 5, 2, 0')); // untouched zones default to 0
});

test('buildSyncGetReply for space 0 covers all 16 spaces', () => {
  const state = createControllerState();
  state.setPreset(1, 1);
  state.setPreset(16, 9);
  console.log(JSON.stringify(reply)); // ADD THIS
  assert.ok(reply.includes('E>pst act: 1, 1'));
  assert.ok(reply.includes('E>pst act: 16, 9'));
  // spaces with no data still get a line, just with preset 0
  assert.ok(reply.includes('E>pst act: 8, 0'));
});

test('buildSyncGetReply leads with lok ack', () => {
  const state = createControllerState();
  state.setPreset(5, 7);
  const reply = buildSyncGetReply(5, state, EOM);
  assert.ok(reply.startsWith(`E>lok${EOM}`));
});

test('buildHelpReply returns the full command list with correct prefix', () => {
  const reply = buildHelpReply(EOM);
  assert.ok(reply.startsWith('Available commands:E$pst act:'));
  assert.ok(reply.includes(`E$help${EOM}`));
  assert.ok(reply.endsWith(`E$help${EOM}`));
});
