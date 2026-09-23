export class FrameMetrics {
  constructor() { this.samples = new Float32Array(600); this.reset(); }
  reset() { this.count = 0; this.cursor = 0; this.last = null; this.inputAt = null; this.inputMs = 0; this.maxInputMs = 0; }
  record(now) {
    if (this.last !== null) { this.samples[this.cursor] = now - this.last; this.cursor = (this.cursor + 1) % this.samples.length; this.count = Math.min(this.count + 1, this.samples.length); }
    this.last = now;
    if (this.inputAt !== null) { this.inputMs = now - this.inputAt; this.maxInputMs = Math.max(this.maxInputMs, this.inputMs); this.inputAt = null; }
  }
  snapshot() {
    const values = Array.from(this.samples.subarray(0, this.count)).sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    return { fps: mean ? 1000 / mean : 0, p95: values[Math.floor(values.length * 0.95)] || 0, slow: values.filter(x => x > 50).length, frames: values.length };
  }
}
