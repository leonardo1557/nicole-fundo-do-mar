import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import '@babylonjs/core/Meshes/instancedMesh.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder.js';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder.js';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { seededRandom } from './simulation.js';

export const ART = Object.freeze({
  water: '#65b9c5', sand: '#e5d6b1', lane: '#fff2d4', seabed: '#79b9b5',
  low: '#e7b24c', high: '#9670b3', overhead: '#3b9b80',
  skin: '#f4c8ae', hair: '#ac814b', pink: '#df8fb8', tail: '#61c1bd', fin: '#b293cd',
});

export function seaMaterial(scene, name, hex, glow = 0) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.specularColor.set(0, 0, 0);
  m.emissiveColor = m.diffuseColor.scale(glow);
  m.freeze();
  return m;
}

function ellipsoid(scene, name, size, at, mat, parent) {
  const mesh = CreateSphere(name, { diameter: 1, segments: 6 }, scene);
  mesh.scaling.set(...size); mesh.position.set(...at);
  mesh.material = mat; mesh.isPickable = false;
  if (parent) mesh.parent = parent;
  return mesh;
}

// Self-contained, original low-poly model. Root origin is at the feet; its
// dimensions fit the existing player envelope without changing the simulation.
export class NicoleModel {
  constructor(scene) {
    this.root = new TransformNode('Nicole', scene);
    const skin = seaMaterial(scene, 'nicole-skin', ART.skin);
    const hair = seaMaterial(scene, 'nicole-dark-blonde-hair', ART.hair);
    const pink = seaMaterial(scene, 'nicole-shell-top', ART.pink);
    const tail = seaMaterial(scene, 'nicole-tail', ART.tail);
    const fin = seaMaterial(scene, 'nicole-fins', ART.fin);
    const eyes = seaMaterial(scene, 'nicole-eyes', '#344c54');
    ellipsoid(scene, 'face', [.41, .43, .36], [0, 1.125, .015], skin, this.root);
    ellipsoid(scene, 'hair-cap', [.44, .28, .39], [0, 1.25, -.035], hair, this.root);
    ellipsoid(scene, 'hair-back', [.40, .48, .19], [0, 1.06, -.15], hair, this.root);
    ellipsoid(scene, 'hair-side', [.12, .30, .18], [-.185, 1.11, .04], hair, this.root);
    ellipsoid(scene, 'hair-flower', [.13, .13, .08], [.185, 1.27, -.135], pink, this.root);
    ellipsoid(scene, 'flower-center', [.045, .045, .025], [.185, 1.27, -.18], fin, this.root);
    for (const x of [-.075, .075]) ellipsoid(scene, 'eye', [.035, .048, .025], [x, 1.13, .189], eyes, this.root);
    ellipsoid(scene, 'torso', [.30, .36, .25], [0, .83, .015], skin, this.root);
    ellipsoid(scene, 'shell-top', [.33, .16, .27], [0, .86, .02], pink, this.root);
    this.arms = [-1, 1].map(side => {
      const pivot = new TransformNode(`arm-${side}`, scene);
      pivot.parent = this.root; pivot.position.set(side * .19, .94, 0);
      ellipsoid(scene, 'arm', [.095, .35, .10], [side * .025, -.15, 0], skin, pivot);
      return pivot;
    });
    this.tail = new TransformNode('tail-pivot', scene);
    this.tail.parent = this.root; this.tail.position.y = .68;
    const lower = CreateCylinder('mermaid-tail', { height: .53, diameterTop: .28, diameterBottom: .10, tessellation: 10 }, scene);
    lower.parent = this.tail; lower.position.y = -.235; lower.material = tail; lower.isPickable = false;
    this.fins = new TransformNode('fin-pivot', scene);
    this.fins.parent = this.tail; this.fins.position.y = -.51;
    for (const side of [-1, 1]) {
      const fluke = ellipsoid(scene, 'tail-fin', [.28, .12, .23], [side * .105, -.04, -.025], fin, this.fins);
      fluke.rotation.z = side * .25;
    }
  }
  update(x, y, height, phase, laneTarget) {
    this.root.position.set(x, y, 0);
    // Crouch changes the visible envelope at the same instant as the collider.
    this.root.scaling.y = height / 1.4;
    this.root.rotation.z = Math.max(-.06, Math.min(.06, (x - laneTarget) * .04));
    this.tail.rotation.x = Math.sin(phase * 2) * .06;
    this.fins.rotation.x = Math.sin(phase * 2 + .8) * .14;
    this.arms[0].rotation.x = Math.sin(phase * 2) * .12;
    this.arms[1].rotation.x = -Math.sin(phase * 2) * .12;
  }
}

function coralSource(scene, name, mat) {
  const parts = [];
  for (const [x, y, height, tilt] of [[0, .75, 1.5, 0], [-.26, .70, .83, -.6], [.28, .9, 1, .6], [-.46, 1.02, .45, .1], [.51, 1.24, .42, -.15]]) {
    const branch = CreateCylinder(name, { height, diameterTop: .12, diameterBottom: .18, tessellation: 6 }, scene);
    branch.position.set(x, y, 0); branch.rotation.z = -tilt; branch.material = mat; parts.push(branch);
  }
  const source = Mesh.MergeMeshes(parts, true, true);
  source.name = name; source.material = mat; source.isVisible = false; source.isPickable = false;
  return source;
}

// All decorations are created once, instanced and recycled outside the lanes.
// No particles, texture downloads, shadows or mesh creation during a run.
export class UnderwaterWorld {
  constructor(scene) {
    const random = seededRandom(1972);
    const coralPink = seaMaterial(scene, 'coral-pink', '#d7a0b2');
    const coralLavender = seaMaterial(scene, 'coral-lavender', '#a6a0ca');
    const green = seaMaterial(scene, 'kelp-green', '#469e94');
    const stone = seaMaterial(scene, 'seaside-stone', '#9cc7bf');
    const bubble = seaMaterial(scene, 'bubble-rim', '#d3efdf', .18);
    const sources = [coralSource(scene, 'pink-coral-source', coralPink), coralSource(scene, 'lilac-coral-source', coralLavender)];
    const kelp = CreateCylinder('kelp-source', { height: 2.7, diameterTop: .06, diameterBottom: .23, tessellation: 5 }, scene);
    // Bake the offset so the instanced plant origin stays on the seabed.
    kelp.position.y = 1.35; kelp.bakeCurrentTransformIntoVertices(); kelp.position.y = 0;
    kelp.material = green; kelp.isVisible = false; kelp.isPickable = false; sources.push(kelp);
    const rock = ellipsoid(scene, 'rock-source', [1.3, .7, 1.1], [0, .3, 0], stone);
    rock.bakeCurrentTransformIntoVertices(); rock.position.set(0, 0, 0); rock.scaling.set(1, 1, 1);
    rock.isVisible = false; sources.push(rock);
    this.props = Array.from({ length: 36 }, (_, i) => {
      const source = sources[i % sources.length];
      const mesh = source.createInstance(`seaside-${i}`);
      const side = i % 2 === 0 ? -1 : 1;
      mesh.position.x = side * (5.0 + random() * 3.1);
      const scale = .65 + random() * .65;
      mesh.scaling.set(scale, scale, scale); mesh.rotation.y = random() * Math.PI * 2;
      mesh.isPickable = false;
      return { mesh, offset: Math.floor(i / 2) * 8.5, phase: random() * 6.28, plant: source === kelp };
    });
    const ring = CreateTorus('bubble-source', { diameter: .16, thickness: .012, tessellation: 12 }, scene);
    ring.material = bubble; ring.isVisible = false; ring.isPickable = false;
    this.bubbles = Array.from({ length: 10 }, (_, i) => {
      const mesh = ring.createInstance(`bubble-${i}`); mesh.isPickable = false;
      mesh.rotation.x = Math.PI / 2;
      mesh.position.x = (i % 2 ? 1 : -1) * (4.3 + random() * 1.8);
      return { mesh, offset: random() * 140, phase: random() * 7 };
    });
  }
  update(distance) {
    for (const p of this.props) {
      p.mesh.position.z = ((p.offset - distance) % 153 + 153) % 153 - 14;
      if (p.plant) p.mesh.rotation.z = Math.sin(distance * .09 + p.phase) * .055;
    }
    for (const b of this.bubbles) {
      b.mesh.position.z = ((b.offset - distance * .65) % 145 + 145) % 145 - 10;
      b.mesh.position.y = .8 + ((distance * .035 + b.phase) % 5.5);
    }
  }
}
