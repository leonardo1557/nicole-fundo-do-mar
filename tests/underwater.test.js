import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { NicoleModel, UnderwaterWorld } from '../src/underwater.js';

// NullEngine checks construction and geometry only, not GPU rendering or FPS.
test('underwater models construct, keep fixed allocations and stay outside playable lanes', () => {
  const engine = new NullEngine(), scene = new Scene(engine);
  try {
    const model = new NicoleModel(scene), world = new UnderwaterWorld(scene);
    const meshes = scene.meshes.length;
    assert.ok(meshes < 80);
    for (const distance of [0, 80, 1000, 12000, 1000000]) {
      world.update(distance); model.update(0, 0, 1.4, distance * .3, 0);
      assert.equal(scene.meshes.length, meshes);
      for (const { mesh } of world.props) {
        assert.equal(mesh.isVisible, true);
        assert.ok(Math.abs(mesh.position.x) >= 5);
        assert.ok(mesh.position.z >= -14 && mesh.position.z < 139);
        mesh.computeWorldMatrix(true);
        const b = mesh.getBoundingInfo().boundingBox;
        assert.ok(b.minimumWorld.x > 3.75 || b.maximumWorld.x < -3.75, mesh.name);
      }
    }
    assert.equal(world.props.length, 36); assert.equal(world.bubbles.length, 10);
    model.update(0, 0, .65, 0, 0);
    let bottom = Infinity, top = -Infinity;
    for (const mesh of model.root.getChildMeshes()) {
      mesh.computeWorldMatrix(true); const b = mesh.getBoundingInfo().boundingBox;
      bottom = Math.min(bottom, b.minimumWorld.y); top = Math.max(top, b.maximumWorld.y);
    }
    assert.ok(bottom >= -.02, `bottom ${bottom}`);
    assert.ok(top <= .67, `top ${top}`);
    assert.equal(scene.textures.length, 0);
  } finally { engine.dispose(); }
});
