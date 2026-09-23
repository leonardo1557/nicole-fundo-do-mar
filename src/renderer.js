import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import '@babylonjs/core/Culling/ray';
import { CONFIG as C } from './config.js';

export class RunnerView {
  constructor(canvas, runner) {
    this.runner = runner;
    this.engine = new Engine(canvas, false, { stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' }, false);
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.engine.setHardwareScalingLevel(1 / this.pixelRatio);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.035, 0.18, 0.23, 1);
    this.scene.fogMode = Scene.FOGMODE_LINEAR;
    this.scene.fogStart = 55; this.scene.fogEnd = 145;
    this.scene.fogColor = new Color3(0.035, 0.18, 0.23);
    this.scene.skipPointerMovePicking = true;
    this.scene.autoClear = true;
    this.camera = new FreeCamera('third-person', new Vector3(0, 5.6, -10), this.scene);
    this.camera.setTarget(new Vector3(0, 1.1, 13));
    this.camera.minZ = 0.1; this.camera.maxZ = 170;
    const light = new HemisphericLight('ambient', new Vector3(0, 1, -0.3), this.scene);
    light.intensity = 0.95;
    const material = (name, hex) => {
      const m = new StandardMaterial(name, this.scene);
      m.diffuseColor = Color3.FromHexString(hex); m.specularColor.set(0, 0, 0); m.freeze(); return m;
    };
    const floor = material('floor', '#246070'), stripe = material('lane-lines', '#59929a');
    const player = material('player-placeholder', '#ffc2dc');
    this.lowMaterial = material('jumpable-block', '#e2bd67');
    this.overheadMaterial = material('crouch-bar', '#7dcbbf');
    this.highMaterial = material('dodge-block', '#9f87c8');
    const box = (name, width, height, depth, x, y, z, mat) => {
      const mesh = CreateBox(name, { width, height, depth }, this.scene);
      mesh.position.set(x, y, z); mesh.material = mat; mesh.isPickable = false; return mesh;
    };
    box('track', 7.7, 0.18, 180, 0, -0.09, 72, floor).freezeWorldMatrix();
    for (const x of [-3.75, -1.125, 1.125, 3.75]) box('lane-edge', 0.055, 0.015, 180, x, 0.012, 72, stripe).freezeWorldMatrix();
    this.markers = Array.from({ length: 20 }, (_, i) => box(`travel-marker-${i}`, 7.5, 0.018, 0.12, 0, 0.02, i * 8, stripe));
    this.avatar = CreateCapsule('nicole-placeholder', { height: C.playerHeight, radius: 0.32, tessellation: 8, subdivisions: 1, capSubdivisions: 3 }, this.scene);
    this.avatar.material = player; this.avatar.isPickable = false;
    this.meshes = runner.obstacles.map(o => {
      const mesh = box(`obstacle-${o.id}`, C.obstacleWidth, 1, C.obstacleDepth, 0, 0, 0, this.lowMaterial);
      mesh.setEnabled(false); return mesh;
    });
    this.resize = () => {
      this.engine.resize();
      const portrait = canvas.clientHeight > canvas.clientWidth;
      this.camera.fovMode = portrait ? Camera.FOVMODE_HORIZONTAL_FIXED : Camera.FOVMODE_VERTICAL_FIXED;
      this.camera.fov = portrait ? 0.9 : 0.85;
    };
    this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas);
    this.resize();
  }
  draw(alpha) {
    const s = this.runner, lerp = (a, b) => a + (b - a) * alpha;
    this.avatar.scaling.y = s.player.height / C.playerHeight;
    this.avatar.position.set(lerp(s.previous.x, s.player.x), lerp(s.previous.y, s.player.y) + s.player.height / 2, 0);
    const distance = lerp(s.previous.distance, s.distance);
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
  lowerResolution() {
    if (this.pixelRatio <= 0.75) return false;
    this.pixelRatio = Math.max(0.75, this.pixelRatio - 0.25);
    this.engine.setHardwareScalingLevel(1 / this.pixelRatio); return true;
  }
  async ready() { this.draw(1); await this.scene.whenReadyAsync(); }
  dispose() { this.observer.disconnect(); this.engine.dispose(); }
}
