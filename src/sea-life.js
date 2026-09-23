import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { oval, leaf } from './art-geometry.js';

export class FishSchool {
  constructor(scene, material) {
    const colors=['#edbd65','#df8ea9','#73a8d3'];
    this.fish=[];
    for(let c=0;c<3;c++) {
      const mat=material(`fish-${c}`,colors[c]), eyeMat=material(`fish-eyes-${c}`,'#234b59');
      const parts=[oval(scene,'fish-body',[.64,.32,.17],[0,0,0],mat)];
      const dorsal=leaf(scene,'dorsal-fin',.2,.24,mat);dorsal.position.set(-.06,.07,0);parts.push(dorsal);
      const source=Mesh.MergeMeshes(parts,true,true);source.material=mat;source.isVisible=false;source.isPickable=false;
      const tail=leaf(scene,'fish-tail-source',.30,.29,mat);tail.rotation.z=-Math.PI/2;tail.bakeCurrentTransformIntoVertices();tail.rotation.set(0,0,0);tail.isVisible=false;
      const eye=oval(scene,'fish-eye-source',[.04,.04,.018],[0,0,0],eyeMat);eye.bakeCurrentTransformIntoVertices();eye.scaling.setAll(1);eye.isVisible=false;
      for(let i=0;i<4;i++) {
        const root=new TransformNode(`fish-${c}-${i}`,scene), body=source.createInstance('fish-body');body.parent=root;
        const fin=tail.createInstance('fish-tail');fin.parent=root;fin.position.x=-.29;fin.rotation.z=Math.PI;
        for(const side of [-1,1]){const e=eye.createInstance('fish-eye');e.parent=root;e.position.set(.2,.04,side*.077);}
        const sign=(c+i)%2?1:-1;root.rotation.y=sign>0?Math.PI:0;
        root.scaling.setAll(.7+i*.13);
        this.fish.push({root,fin,sign,offset:c*40+i*2,phase:i*.6+c});
      }
    }
  }
  update(distance) {
    for(const f of this.fish) {
      f.root.position.set(f.sign*(5.0+Math.sin(distance*.025+f.phase)*.45), 1.5+Math.sin(distance*.06+f.phase)*.4,
        ((f.offset-distance*.82)%140+140)%140-8);
      f.fin.rotation.y=Math.sin(distance*.8+f.phase)*.5;
    }
  }
}
