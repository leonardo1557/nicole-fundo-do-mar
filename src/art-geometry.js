import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder.js';

// Continuous capped surface from sculpted cross sections. Optional superellipse
// exponent rounds stone corners while retaining the obstacle's full silhouette.
export function profileMesh(scene, name, rings, material, sides = 20, exponent = 2, updatable = false) {
  const positions = [], indices = [], normals = [];
  for (const [y, rx, rz, z = 0, x = 0] of rings) {
    for (let s = 0; s < sides; s++) {
      const a = s / sides * Math.PI * 2, c = Math.cos(a), n = Math.sin(a);
      positions.push(x + Math.sign(c) * Math.abs(c) ** (2 / exponent) * rx, y, z + Math.sign(n) * Math.abs(n) ** (2 / exponent) * rz);
    }
  }
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < sides; s++) {
    const a = r * sides + s, b = r * sides + (s + 1) % sides, c = a + sides, d = b + sides;
    indices.push(a, c, b, b, c, d);
  }
  // End caps have their own center vertices.
  for (const r of [0, rings.length - 1]) {
    const [y, , , z = 0, x = 0] = rings[r], center = positions.length / 3;
    positions.push(x, y, z);
    for (let s = 0; s < sides; s++) {
      const a = r * sides + s, b = r * sides + (s + 1) % sides;
      if (r === 0) indices.push(center, b, a); else indices.push(center, a, b);
    }
  }
  if (rings.at(-1)[0] < rings[0][0]) for(let i=0;i<indices.length;i+=3) [indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  VertexData.ComputeNormals(positions, indices, normals);
  const mesh = new Mesh(name, scene), data = new VertexData();
  data.positions = positions; data.uvs = new Float32Array(positions.length / 3 * 2); data.indices = indices; data.normals = normals; data.applyToMesh(mesh, updatable);
  mesh.material = material; mesh.isPickable = false;
  return mesh;
}

export function oval(scene, name, size, at, material, parent, segments = 12) {
  const mesh = CreateSphere(name, { diameter: 1, segments }, scene);
  mesh.scaling.set(...size); mesh.position.set(...at); mesh.material = material; mesh.isPickable = false;
  if (parent) mesh.parent = parent;
  return mesh;
}

// Fin/leaf as a thin, softly bulged lens, with a pointed end and swept outline.
export function leaf(scene, name, length, width, material, parent) {
  const mesh = profileMesh(scene, name, [[0, .015, .014], [length * .23, width * .38, .028], [length * .55, width * .5, .035], [length * .82, width * .25, .018], [length, .002, .002]], material, 12);
  if (parent) mesh.parent = parent;
  return mesh;
}
