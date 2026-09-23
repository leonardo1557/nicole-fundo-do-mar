import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { profileMesh, leaf, oval } from './art-geometry.js';
import { CONFIG as C } from './config.js';

// Surface dimensions match existing collision envelopes. Relief stays inside
// those envelopes, preserving jump/duck timing and clear color language.
export class ObstacleArt {
  constructor(scene, slots, material) {
    const low=material('golden-shell-reef','#e7b24c'), high=material('violet-reef','#9363ad'), overhead=material('seaweed-arch','#339b80');
    this.sources=[];
    for(const [kind,height,mat] of [['low',C.lowHeight,low],['high',C.highHeight,high],['overhead',C.overheadHeight,overhead]]) {
      const rx=C.obstacleWidth/2, rz=C.obstacleDepth/2, bevel=.035;
      const rock=profileMesh(scene, `${kind}-sculpted-reef`, [[0,rx-bevel,rz-bevel],[bevel,rx,rz],[height*.3,rx-.01,rz],[height*.7,rx,rz-.01],[height-bevel,rx,rz],[height,rx-bevel,rz-bevel]], mat,24,5);
      const parts=[rock];
      if(kind==='low') {
        // Shell ridges on the visible face, inset so visual and physical bounds agree.
        for(let i=-2;i<=2;i++) {
          const rib=oval(scene,'shell-ridge',[.09,height*.8,.045],[i*.20,height*.49,-rz+.02],mat);rib.rotation.z=-i*.10;parts.push(rib);
        }
      } else if(kind==='high') {
        for(let i=0;i<4;i++) {
          const ridge=oval(scene,'reef-growth',[.19,height*.64,.075],[(i-1.5)*.27,height*.5,-rz+.036],mat);ridge.rotation.z=(i-1.5)*.035;parts.push(ridge);
        }
      } else {
        for(let i=0;i<4;i++) {
          const frond=leaf(scene,'kelp-on-beam',height*.8,.17,mat);frond.position.set((i-1.5)*.27,.08,-rz+.038);frond.rotation.z=(i-1.5)*.07;parts.push(frond);
        }
      }
      const merged=Mesh.MergeMeshes(parts,true,true);merged.material=mat;merged.name=`${kind}-obstacle-source`;merged.isVisible=false;merged.isPickable=false;this.sources.push(merged);
    }
    this.slots=slots.map(o=>{
      const root=new TransformNode(`obstacle-${o.id}`,scene);
      const variants=this.sources.map((source,i)=>{const m=source.createInstance(`obstacle-${o.id}-${i}`);m.parent=root;m.isPickable=false;m.setEnabled(false);return m;});
      return {root,variants,type:-1};
    });
  }
  update(obstacles,alpha) {
    for(const o of obstacles) {
      const slot=this.slots[o.id];slot.root.setEnabled(o.active);
      if(!o.active)continue;
      const type=o.bottom>0?2:o.height===C.lowHeight?0:1;
      if(slot.type!==type){slot.variants.forEach((m,i)=>m.setEnabled(i===type));slot.type=type;}
      slot.root.position.set(o.x,o.bottom||0,o.previousZ+(o.z-o.previousZ)*alpha);
    }
  }
}
