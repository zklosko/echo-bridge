import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../protocol.js';

test('parses pst act', () => {
  const result = parseCommand('E$pst act: 2, 12, 3.5');
  assert.deepEqual(result, {
    type: 'setPreset',
    spaceId: 2,
    presetId: 12,
    time: 3.5,
  });
});

test('parses off', () => {
  const result = parseCommand('E$off: 5, 2.0');
  assert.deepEqual(result, { type: 'off', spaceId: 5, time: 2.0 });
});

test('parses seq act', () => {
  const result = parseCommand('E$seq act: 3, 1');
  assert.deepEqual(result, { type: 'seqActivate', spaceId: 3, seqId: 1 });
});

test('parses seq dact', () => {
  const result = parseCommand('E$seq dact: 3, 1');
  assert.deepEqual(result, { type: 'seqDeactivate', spaceId: 3, seqId: 1 });
});

test('parses zone int', () => {
  const result = parseCommand('E$zone int: 1, 4, 200, 1.5');
  assert.deepEqual(result, {
    type: 'zoneIntensity',
    spaceId: 1,
    zoneId: 4,
    level: 200,
    time: 1.5,
  });
});

test('parses pst get', () => {
  assert.deepEqual(parseCommand('E$pst get: 7'), {
    type: 'presetGet',
    spaceId: 7,
  });
});

test('parses off get', () => {
  assert.deepEqual(parseCommand('E$off get: 7'), {
    type: 'offGet',
    spaceId: 7,
  });
});

test('parses seq get', () => {
  assert.deepEqual(parseCommand('E$seq get: 7'), {
    type: 'seqGet',
    spaceId: 7,
  });
});

test('parses sync get, including space 0 for "all spaces"', () => {
  assert.deepEqual(parseCommand('E$sync get: 0'), {
    type: 'syncGet',
    spaceId: 0,
  });
  assert.deepEqual(parseCommand('E$sync get: 4'), {
    type: 'syncGet',
    spaceId: 4,
  });
});

test('parses zone int get', () => {
  assert.deepEqual(parseCommand('E$zone int get: 9'), {
    type: 'zoneIntensityGet',
    spaceId: 9,
  });
});

test('parses help', () => {
  assert.deepEqual(parseCommand('E$help'), { type: 'help' });
});

test('tolerates missing space after commas', () => {
  const result = parseCommand('E$pst act:2,12,3.5');
  assert.deepEqual(result, {
    type: 'setPreset',
    spaceId: 2,
    presetId: 12,
    time: 3.5,
  });
});

test('unrecognized command returns type unknown with raw text', () => {
  const result = parseCommand('E$not a real command');
  assert.deepEqual(result, { type: 'unknown', raw: 'E$not a real command' });
});
