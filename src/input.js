export class Swipe {
  constructor(action, threshold = 22) { this.action = action; this.threshold = threshold; this.cancel(); }
  start(id, x, y) { if (this.id !== null) return false; this.id = id; this.x = x; this.y = y; return true; }
  move(id, x, y) {
    if (id !== this.id || this.used) return;
    const dx = x - this.x, dy = y - this.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.threshold) return;
    this.used = true;
    if (Math.abs(dx) > Math.abs(dy)) this.action(dx > 0 ? 'right' : 'left');
    else this.action(dy < 0 ? 'jump' : 'crouch');
  }
  end(id, x, y) { if (id === this.id) { this.move(id, x, y); this.cancel(); } }
  cancel() { this.id = null; this.used = false; }
}

export function attachInput(canvas, action, pause) {
  const swipe = new Swipe(action);
  const abort = new AbortController();
  const options = { signal: abort.signal };
  canvas.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button !== 0) return;
    if (swipe.start(e.pointerId, e.clientX, e.clientY)) { canvas.setPointerCapture(e.pointerId); canvas.focus({ preventScroll: true }); }
  }, options);
  canvas.addEventListener('pointermove', e => swipe.move(e.pointerId, e.clientX, e.clientY), options);
  canvas.addEventListener('pointerup', e => {
    swipe.end(e.pointerId, e.clientX, e.clientY);
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  }, options);
  for (const type of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => swipe.cancel(), options);
  window.addEventListener('keydown', e => {
    if (e.target instanceof HTMLElement && e.target.closest('button,select,input,textarea')) return;
    const command = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'crouch', KeyS: 'crouch' }[e.code];
    if (command) { e.preventDefault(); if (!e.repeat) action(command); }
    if (e.code === 'Escape' && !e.repeat) pause();
  }, options);
  return { cancel: () => swipe.cancel(), dispose: () => abort.abort() };
}
