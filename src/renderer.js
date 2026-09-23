import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import '@babylonjs/core/Culling/ray';
import { ART, NicoleModel, UnderwaterWorld, seaMaterial } from './underwater.js';
import { ObstacleArt } from './obstacle-art.js';
import { Seafloor } from './seafloor.js';
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
    this.scene.fogStart = 38; this.scene.fogEnd = 125;
    this.scene.fogColor = water;
    this.scene.skipPointerMovePicking = true;
    this.scene.autoClear = true;
    this.camera = new FreeCamera('third-person', new Vector3(0, 3.8, -7), this.scene);
    this.camera.setTarget(new Vector3(0, 1.0, 12));
    this.camera.minZ = 0.1; this.camera.maxZ = 170;
    const light = new HemisphericLight('ambient', new Vector3(0, 1, -0.3), this.scene);
    light.intensity = .72;
    const sun=new DirectionalLight('surface-light',new Vector3(-.6,-1,.35),this.scene);
    sun.intensity=.65;sun.diffuse=Color3.FromHexString('#ffedce');
    light.groundColor = Color3.FromHexString('#83a6b0');
    const floor = seaMaterial(this.scene, 'sand-path', '#ffffff');
    const stripe = seaMaterial(this.scene, 'shell-lane-lines', ART.lane);
    const box = (name, width, height, depth, x, y, z, mat) => {
      const mesh = CreateBox(name, { width, height, depth }, this.scene);
      mesh.position.set(x, y, z); mesh.material = mat; mesh.isPickable = false; return mesh;
    };
    this.floor = new Seafloor(this.scene, floor);
    for (const x of [-3.75, -1.125, 1.125, 3.75]) box('shell-trail', 0.025, 0.008, 180, x, 0.001, 72, stripe).freezeWorldMatrix();
    this.nicole = new NicoleModel(this.scene);
    this.world = new UnderwaterWorld(this.scene);
    this.obstacles = new ObstacleArt(this.scene, runner.obstacles, (name,color)=>seaMaterial(this.scene,name,color));
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
      this.world.setQuality(this.pixelRatio);
    }
    const s = this.runner, lerp = (a, b) => a + (b - a) * alpha;
    const distance = lerp(s.previous.distance, s.distance);
    this.nicole.update(lerp(s.previous.x, s.player.x), lerp(s.previous.y, s.player.y), s.player.height, distance * .3, (s.player.lane - 1) * C.laneWidth, s.player.vy, s.state);
    this.world.update(distance);
    this.floor.update(distance);
    this.obstacles.update(s.obstacles, alpha);
    this.scene.render();
  }
  // Conservative downshift only: avoids resolution oscillation in long runs.
  lowerResolution() { return this.viewport.lowerResolution(); }
  async ready() { this.draw(1); await this.scene.whenReadyAsync(); }
  dispose() { this.observer.disconnect(); this.engine.dispose(); }
}
