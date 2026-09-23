// Buffer resize clears the canvas. Defer every resize to immediately before
// scene.render(), never mutate it after a frame or in ResizeObserver callbacks.
export class RenderViewport {
  constructor(pixelRatio) {
    this.pixelRatio = pixelRatio;
    this.requestedRatio = pixelRatio;
    this.dirty = true;
    this.applied = 0;
  }
  requestResize() { this.dirty = true; }
  lowerResolution() {
    if (this.requestedRatio <= 0.75) return false;
    this.requestedRatio = Math.max(0.75, this.requestedRatio - 0.25);
    this.dirty = true;
    return true;
  }
  apply(engine) {
    if (!this.dirty) return false;
    if (this.pixelRatio !== this.requestedRatio) {
      this.pixelRatio = this.requestedRatio;
      engine.setHardwareScalingLevel(1 / this.pixelRatio); // includes resize
    } else engine.resize();
    this.dirty = false;
    this.applied++;
    return true;
  }
}
