import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import '@babylonjs/core/Meshes/instancedMesh.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder.js';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder.js';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { NicoleModel as NicoleRig } from './nicole.js';
import { leaf, oval } from './art-geometry.js';
import { FishSchool } from './sea-life.js';
import { seededRandom } from './simulation.js';

export const ART = Object.freeze({
  water: '#56aabc', sand: '#e5d6b1', lane: '#fff2d4', seabed: '#79b9b5',
  low: '#e7b24c', high: '#9670b3', overhead: '#3b9b80',
  skin: '#f4c8ae', hair: '#ac814b', pink: '#df8fb8', tail: '#61c1bd', fin: '#b293cd',
});

export function seaMaterial(scene, name, hex, glow = 0) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.specularColor.set(.055, .055, .055);
  m.specularPower=32;
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

// Rig and sculpted geometry live separately from the scenery.
export class NicoleModel extends NicoleRig {
  constructor(scene) { super(scene, (name, hex) => seaMaterial(scene, `nicole-${name}`, hex)); }
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
    const kelpParts = [];
    for(let i=0;i<4;i++) {
      const frond=leaf(scene, 'kelp-leaf', 1.7+i*.24, .30, green);
      frond.rotation.z=(i-1.5)*.14;frond.rotation.y=i*.9;
      kelpParts.push(frond);
    }
    const kelp=Mesh.MergeMeshes(kelpParts,true,true);kelp.name='kelp-source';
    kelp.material=green;kelp.isVisible=false;kelp.isPickable=false;sources.push(kelp);
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
    this.bubbles = Array.from({ length: 28 }, (_, i) => {
      const mesh = ring.createInstance(`bubble-${i}`); mesh.isPickable = false;
      mesh.rotation.x = Math.PI / 2;
      mesh.position.x = (i % 2 ? 1 : -1) * (4.4 + random() * 1.7);
      const size=.55+random()*1.1;mesh.scaling.setAll(size);
      return { mesh, offset: Math.floor(i/4)*18, phase: (i%4)*1.7, baseX: mesh.position.x };
    });
    this.fish = new FishSchool(scene, (name, color) => seaMaterial(scene, name, color));
  }
  setQuality(ratio) {
    const low=ratio<=1;
    if(this.lowDensity===low)return;
    this.lowDensity=low;
    this.props.forEach((p,i)=>p.mesh.setEnabled(!low||Math.floor(i/2)%2===0));
    this.bubbles.forEach((b,i)=>b.mesh.setEnabled(!low||Math.floor(i/2)%2===0));
    this.fish.fish.forEach((f,i)=>f.root.setEnabled(!low||i%2===0));
  }
  update(distance) {
    for (const p of this.props) {
      p.mesh.position.z = ((p.offset - distance) % 153 + 153) % 153 - 14;
      if (p.plant) p.mesh.rotation.z = Math.sin(distance * .09 + p.phase) * .055;
    }
    for (const b of this.bubbles) {
      b.mesh.position.z = ((b.offset - distance) % 145 + 145) % 145 - 10;
      b.mesh.position.y = .12 + ((distance * .12 + b.phase) % 6.8);
      b.mesh.position.x=b.baseX+Math.sin(distance*.15+b.phase)*.12;
    }
    this.fish.update(distance);
  }
}
