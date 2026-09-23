import test from 'node:test';
import assert from 'node:assert/strict';
import { RenderViewport } from '../src/viewport.js';

test('resolution and resize requests leave the displayed frame intact until next draw', () => {
  const calls = [], engine = { resize: () => calls.push('resize'), setHardwareScalingLevel: n => calls.push(`scale:${n}`) };
  const viewport = new RenderViewport(1.5);
  viewport.apply(engine); calls.push('draw');
  viewport.lowerResolution(); viewport.requestResize(); viewport.requestResize();
  assert.deepEqual(calls, ['resize', 'draw']);
  assert.equal(viewport.pixelRatio, 1.5);
  viewport.apply(engine); calls.push('draw');
  assert.deepEqual(calls, ['resize', 'draw', 'scale:0.8', 'draw']);
  assert.equal(viewport.apply(engine), false);
  viewport.requestResize(); viewport.apply(engine); calls.push('draw');
  assert.deepEqual(calls.slice(-2), ['resize', 'draw']);
  for (let i = 0; i < 10; i++) viewport.lowerResolution();
  viewport.apply(engine); assert.equal(viewport.pixelRatio, 0.75);
  assert.equal(viewport.lowerResolution(), false);
});
