import test from 'node:test';
import assert from 'node:assert/strict';
import { Runner, FixedClock, sweptHit } from '../src/simulation.js';
import { Swipe } from '../src/input.js';
import { CONFIG as C } from '../src/config.js';
const tick = (r, seconds) => { for (let i = 0; i < Math.round(seconds / C.step); i++) r.step(C.step); };
const empty = () => { const r = new Runner({ seed: 1, scenario: 'empty' }); r.start(); return r; };

test('30/60/120 Hz rendering preserves distance and jump trajectory', () => {
  const results = [30, 60, 120].map(hz => {
    const r = empty(), clock = new FixedClock(r);
    r.command('jump'); r.command('right');
    for (let i = 0; i < hz / 2; i++) clock.advance(1 / hz);
    return [r.distance, r.player.x, r.player.y];
  });
  for (const result of results) result.forEach((n, i) => assert.ok(Math.abs(n - results[0][i]) < 1e-9));
});
test('lane changes are bounded, reach one lane under 150ms and work midair', () => {
  const r = empty(); r.command('jump'); r.command('left'); tick(r, 0.15);
  assert.equal(r.player.x, -C.laneWidth); assert.ok(r.player.y > 0);
  r.command('left'); assert.equal(r.player.lane, 0);
  r.command('right'); r.command('right'); tick(r, 0.3); assert.equal(r.player.x, C.laneWidth);
  r.command('right'); assert.equal(r.player.lane, 2);
});
test('jump lands exactly, has no double jump and supports late landing buffer', () => {
  const r = empty(); r.command('jump'); tick(r, 0.2); const velocity = r.player.vy;
  r.command('jump'); tick(r, 0.1); assert.ok(r.player.vy < velocity);
  tick(r, 0.45); assert.equal(r.player.y, 0);
  r.command('jump'); tick(r, 0.68); r.command('jump'); tick(r, 0.1); assert.ok(r.player.vy > 0);
});
test('low block kills grounded player, can be jumped, high block cannot', () => {
  const ground = empty(); ground.spawn(1, 4, C.lowHeight); tick(ground, 1); assert.equal(ground.state, 'over');
  const jump = empty(); jump.spawn(1, 4, C.lowHeight); jump.command('jump'); tick(jump, 1); assert.equal(jump.state, 'running');
  const high = empty(); high.spawn(1, 4, C.highHeight); high.command('jump'); tick(high, 1); assert.equal(high.state, 'over');
});
test('dodging checks actual position and swept collision prevents tunnelling', () => {
  const r = empty(); r.spawn(1, 4, C.highHeight); r.command('left'); tick(r, 1); assert.equal(r.state, 'running');
  const late = empty(); late.spawn(1, 1.1, C.highHeight); late.command('left'); tick(late, 0.1); assert.equal(late.state, 'over');
  assert.equal(sweptHit({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, z: -8, height: 3 }, 8), true);
  assert.equal(sweptHit({ x: 2.25, y: 0 }, { x: 2.25, y: 0 }, { x: 0, z: -8, height: 3 }, 8), false);
});
test('pause stops physics and ignores input; resume does not catch up hidden time', () => {
  const r = empty(), clock = new FixedClock(r); clock.advance(0.05); r.pause();
  const distance = r.distance; clock.advance(100); assert.equal(r.distance, distance);
  assert.equal(r.command('left'), false); r.resume(); clock.advance(1 / 60);
  assert.ok(r.distance - distance < 0.3);
  r.start(); assert.equal(r.distance, 0); assert.equal(r.player.y, 0); assert.equal(r.player.lane, 1);
});
test('pool stays bounded and every row is traversable for 10 minutes across seeds', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const r = new Runner({ seed }); r.start(); const pool = [...r.obstacles];
    for (let t = 0; t < 600; t += 0.05) {
      const next = r.obstacles.filter(o => o.active && o.z > -1.5).sort((a, b) => a.z - b.z)[0];
      if (next) {
        const blocked = r.obstacles.filter(o => o.active && Math.abs(o.z - next.z) < 0.01).map(o => o.lane);
        assert.ok(blocked.length <= 2);
        const open = [0, 1, 2].find(l => !blocked.includes(l));
        if (r.player.lane < open) r.command('right');
        if (r.player.lane > open) r.command('left');
      }
      tick(r, 0.05); assert.equal(r.state, 'running');
    }
    assert.equal(r.obstacles.length, C.poolSize);
    assert.ok(r.obstacles.every((o, i) => o === pool[i]));
  }
});
test('swipe fires before release, once per gesture, ignores secondary pointer and cancels', () => {
  const actions = [], s = new Swipe(a => actions.push(a));
  s.start(1, 100, 100); s.move(1, 105, 103); assert.equal(actions.length, 0);
  assert.equal(s.start(2, 0, 0), false); s.move(2, 90, 0); assert.equal(actions.length, 0);
  s.move(1, 125, 102); assert.deepEqual(actions, ['right']);
  s.move(1, 180, 100); s.end(1, 180, 100); assert.equal(actions.length, 1);
  s.start(3, 100, 100); s.end(3, 60, 100);
  s.start(4, 100, 100); s.move(4, 102, 60); s.cancel();
  s.start(5, 100, 100); s.cancel(); s.end(5, 200, 100);
  assert.deepEqual(actions, ['right', 'left', 'jump']);
});
