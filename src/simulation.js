import { CONFIG as C } from './config.js';

export function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

// Slab test over relative motion. Includes lateral movement and jumping, so a
// dropped render frame cannot skip an obstacle or collide with the target lane.
export function sweptHit(before, after, obstacle, oldZ) {
  const from = [before.x - obstacle.x, before.y, -oldZ];
  const to = [after.x - obstacle.x, after.y, -obstacle.z];
  const min = [-C.obstacleWidth / 2 - C.playerHalfWidth, -C.playerHeight, -C.obstacleDepth / 2 - C.playerHalfDepth];
  const max = [C.obstacleWidth / 2 + C.playerHalfWidth, obstacle.height - 0.03, C.obstacleDepth / 2 + C.playerHalfDepth];
  let enter = 0, leave = 1;
  for (let axis = 0; axis < 3; axis++) {
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < 1e-10) { if (from[axis] < min[axis] || from[axis] > max[axis]) return false; }
    else {
      let a = (min[axis] - from[axis]) / delta, b = (max[axis] - from[axis]) / delta;
      if (a > b) [a, b] = [b, a];
      enter = Math.max(enter, a); leave = Math.min(leave, b);
      if (enter > leave) return false;
    }
  }
  return true;
}

export class Runner {
  constructor({ seed = Date.now(), scenario = 'normal' } = {}) {
    this.seed = seed; this.scenario = scenario;
    this.obstacles = Array.from({ length: C.poolSize }, (_, id) => ({ id, active: false, x: 0, z: 0, previousZ: 0, height: 0 }));
    this.player = { lane: 1, x: 0, y: 0, vy: 0 };
    this.previous = { x: 0, y: 0, distance: 0 };
    this.reset();
  }
  reset() {
    Object.assign(this.player, { lane: 1, x: 0, y: 0, vy: 0 });
    Object.assign(this.previous, { x: 0, y: 0, distance: 0 });
    this.random = seededRandom(this.seed);
    this.state = 'ready'; this.distance = 0; this.speed = C.initialSpeed;
    this.jumpQueued = 0; this.row = 0; this.nextRow = C.firstRow;
    this.lastAction = '—'; this.commands = 0;
    for (const obstacle of this.obstacles) obstacle.active = false;
    this.fillAhead();
  }
  start() { this.reset(); this.state = 'running'; }
  pause() { if (this.state === 'running') { this.state = 'paused'; this.jumpQueued = 0; } }
  resume() { if (this.state === 'paused') this.state = 'running'; }
  command(action) {
    if (this.state !== 'running') return false;
    if (action === 'left' || action === 'right') this.player.lane = Math.max(0, Math.min(2, this.player.lane + (action === 'left' ? -1 : 1)));
    else if (action === 'jump') this.jumpQueued = C.jumpBuffer;
    else return false;
    this.lastAction = action; this.commands++;
    return true;
  }
  spawn(lane, z, height) {
    const slot = this.obstacles.find(o => !o.active);
    if (!slot) throw new Error('Obstacle pool exhausted');
    Object.assign(slot, { active: true, lane, x: (lane - 1) * C.laneWidth, z, previousZ: z, height });
  }
  fillAhead() {
    if (this.scenario === 'empty') return;
    while (this.nextRow - this.distance < C.horizon) {
      const z = this.nextRow - this.distance;
      if (this.scenario === 'low' || this.scenario === 'high') {
        if (this.row === 0) this.spawn(1, z, this.scenario === 'low' ? C.lowHeight : C.highHeight);
      } else {
        // Opening rows teach low/high blocks. Every row has at least one open
        // lane; 26m leaves >=1.3s at top speed (two lane switches take 0.282s).
        const openLane = Math.floor(this.random() * 3);
        const count = this.row < 3 ? 1 : (this.random() < 0.55 ? 2 : 1);
        const lane = (openLane + 1) % 3;
        this.spawn(lane, z, this.row % 3 === 0 ? C.lowHeight : C.highHeight);
        if (count === 2) this.spawn((openLane + 2) % 3, z, this.random() < 0.5 ? C.lowHeight : C.highHeight);
      }
      this.row++; this.nextRow += C.rowSpacing;
    }
  }
  step(dt) {
    if (this.state !== 'running') return;
    const p = this.player;
    Object.assign(this.previous, { x: p.x, y: p.y, distance: this.distance });
    const target = (p.lane - 1) * C.laneWidth;
    p.x += Math.sign(target - p.x) * Math.min(Math.abs(target - p.x), C.laneSpeed * dt);
    if (this.jumpQueued > 0 && p.y === 0) { p.vy = C.jumpVelocity; this.jumpQueued = 0; }
    this.jumpQueued = Math.max(0, this.jumpQueued - dt);
    if (p.y > 0 || p.vy > 0) {
      p.y += p.vy * dt - 0.5 * C.gravity * dt * dt;
      p.vy -= C.gravity * dt;
      if (p.y <= 0) { p.y = 0; p.vy = 0; }
    }
    this.speed = Math.min(C.maxSpeed, this.speed + C.acceleration * dt);
    const travel = this.speed * dt;
    this.distance += travel;
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;
      obstacle.previousZ = obstacle.z; obstacle.z -= travel;
      if (sweptHit(this.previous, p, obstacle, obstacle.previousZ)) this.state = 'over';
      if (obstacle.z < -12) obstacle.active = false;
    }
    this.fillAhead();
  }
}

export class FixedClock {
  constructor(runner) { this.runner = runner; this.accumulator = 0; }
  reset() { this.accumulator = 0; }
  advance(seconds) {
    if (this.runner.state !== 'running') { this.reset(); return 1; }
    this.accumulator += Math.min(C.maxFrame, Math.max(0, seconds));
    while (this.accumulator + 1e-10 >= C.step && this.runner.state === 'running') {
      this.runner.step(C.step); this.accumulator -= C.step;
    }
    return this.runner.state === 'running' ? Math.max(0, this.accumulator / C.step) : 1;
  }
}
