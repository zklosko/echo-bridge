import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createControllerState } from '../state.js';
import { FadeEngine } from '../fade-engine.js';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test('fades a zone level over time', async () => {
  const state = createControllerState();
  const changes = [];
  const engine = new FadeEngine(state, spaceId => changes.push(spaceId));

  engine.requestZoneLevel(1, 1, 255, 0.15); // 150ms fade, short for test speed
  await wait(200);

  assert.equal(state.getSpace(1).zones.get(1), 255);
  assert.ok(changes.length > 1); // multiple ticks fired, not just one jump

  engine.stop();
});

test('interrupting an in-flight fade snaps to the new target', async () => {
  const state = createControllerState();
  const engine = new FadeEngine(state, () => {});

  engine.requestZoneLevel(1, 1, 255, 1); // slow fade, won't finish
  await wait(50); // let it start, but not complete

  engine.requestZoneLevel(1, 1, 100, 1); // interrupt mid-fade
  assert.equal(state.getSpace(1).zones.get(1), 100); // snapped instantly, no fade

  engine.stop();
});

test('zero or missing duration sets level instantly', () => {
  const state = createControllerState();
  const engine = new FadeEngine(state, () => {});

  engine.requestZoneLevel(2, 5, 128, 0);
  assert.equal(state.getSpace(2).zones.get(5), 128);

  engine.stop();
});
