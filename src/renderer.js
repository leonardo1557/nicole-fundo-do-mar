import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import '@babylonjs/core/Culling/ray';
import { ART, NicoleModel, UnderwaterWorld, seaMaterial } from './underwater.js';
import { RenderViewport } from './viewport.js';
import { CONFIG as C } from './config.js';

export class RunnerView {
  constructor(canvas, runner) {
    this.runner = runner;
    this.engine = new Engine(canvas, false, { stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' }, false);
    this.viewport = new RenderViewport(Math.min(window.devicePixelRatio || 1, 1.5));
    this.contextLosses = 0;
    this.engine.setHardwareScalingLevel(1 / this.pixelRatio);
    this.scene = new Scene(this.engine);
    const water = Color3.FromHexString(ART.water);
    this.scene.clearColor = new Color4(water.r, water.g, water.b, 1);
    this.scene.fogMode = Scene.FOGMODE_LINEAR;
    this.scene.fogStart = 55; this.scene.fogEnd = 145;
    this.scene.fogColor = water;
    this.scene.skipPointerMovePicking = true;
    this.scene.autoClear = true;
    this.camera = new FreeCamera('third-person', new Vector3(0, 5.6, -10), this.scene);
    this.camera.setTarget(new Vector3(0, 1.1, 13));
    this.camera.minZ = 0.1; this.camera.maxZ = 170;
    const light = new HemisphericLight('ambient', new Vector3(0, 1, -0.3), this.scene);
    light.intensity = 1.05;
    light.groundColor = Color3.FromHexString('#83a6b0');
    const floor = seaMaterial(this.scene, 'sand-path', ART.sand);
    const stripe = seaMaterial(this.scene, 'shell-lane-lines', ART.lane);
    const seabed = seaMaterial(this.scene, 'seabed', ART.seabed);
    this.lowMaterial = seaMaterial(this.scene, 'jumpable-block', ART.low);
    this.overheadMaterial = seaMaterial(this.scene, 'crouch-bar', ART.overhead);
    this.highMaterial = seaMaterial(this.scene, 'dodge-block', ART.high);
    const box = (name, width, height, depth, x, y, z, mat) => {
      const mesh = CreateBox(name, { width, height, depth }, this.scene);
      mesh.position.set(x, y, z); mesh.material = mat; mesh.isPickable = false; return mesh;
    };
    box('ocean-floor', 40, 0.12, 180, 0, -0.18, 72, seabed).freezeWorldMatrix();
    box('track', 7.7, 0.18, 180, 0, -0.09, 72, floor).freezeWorldMatrix();
    for (const x of [-3.75, -1.125, 1.125, 3.75]) box('lane-edge', 0.055, 0.015, 180, x, 0.012, 72, stripe).freezeWorldMatrix();
    this.markers = Array.from({ length: 20 }, (_, i) => box(`travel-marker-${i}`, 7.5, 0.008, 0.045, 0, 0.02, i * 8, stripe));
    this.nicole = new NicoleModel(this.scene);
    this.world = new UnderwaterWorld(this.scene);
    this.meshes = runner.obstacles.map(o => {
      const mesh = box(`obstacle-${o.id}`, C.obstacleWidth, 1, C.obstacleDepth, 0, 0, 0, this.lowMaterial);
      mesh.setEnabled(false); return mesh;
    });
    this.canvas = canvas;
    this.observer = new ResizeObserver(() => this.viewport.requestResize());
    this.observer.observe(canvas);
  }
  get pixelRatio() { return this.viewport.pixelRatio; }
  draw(alpha) {
    if (this.viewport.apply(this.engine)) {
      const portrait = this.canvas.clientHeight > this.canvas.clientWidth;
      this.camera.fovMode = portrait ? Camera.FOVMODE_HORIZONTAL_FIXED : Camera.FOVMODE_VERTICAL_FIXED;
      this.camera.fov = portrait ? 0.9 : 0.85;
    }
    const s = this.runner, lerp = (a, b) => a + (b - a) * alpha;
    const distance = lerp(s.previous.distance, s.distance);
    this.nicole.update(lerp(s.previous.x, s.player.x), lerp(s.previous.y, s.player.y), s.player.height, distance * .3, (s.player.lane - 1) * C.laneWidth);
    this.world.update(distance);
    for (let i = 0; i < this.markers.length; i++) this.markers[i].position.z = ((i * 8 - distance) % 160 + 160) % 160 - 12;
    for (const o of s.obstacles) {
      const mesh = this.meshes[o.id];
      mesh.setEnabled(o.active);
      if (!o.active) continue;
      mesh.position.set(o.x, (o.bottom || 0) + o.height / 2, lerp(o.previousZ, o.z));
      mesh.scaling.y = o.height;
      mesh.material = o.bottom > 0 ? this.overheadMaterial : o.height === C.lowHeight ? this.lowMaterial : this.highMaterial;
    }
    this.scene.render();
  }
  // Conservative downshift only: avoids resolution oscillation in long runs.
  lowerResolution() { return this.viewport.lowerResolution(); }
  async ready() { this.draw(1); await this.scene.whenReadyAsync(); }
  dispose() { this.observer.disconnect(); this.engine.dispose(); }
}
