import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';

export class Seafloor {
  constructor(scene, material) {
    const source=new Mesh('sand-tile-source',scene), positions=[],indices=[],colors=[],normals=[];
    const xs=[-20,-14,-10,-7,-5,-3.8,-3.0,-2.25,-1.5,-.75,0,.75,1.5,2.25,3,3.8,5,7,10,14,20], rows=25;
    for(let r=0;r<rows;r++)for(const x of xs){
      const z=r/(rows-1)*24;
      const side=Math.max(0,Math.min(1,(Math.abs(x)-3.8)/4));
      const y=-.02+side*(.35+Math.sin(x*1.8)*.20)*(1-Math.cos(z/24*Math.PI*2));
      positions.push(x,y,z);
      const wave=Math.sin(z/24*Math.PI*10+x*.7)*.5+.5;
      const ripple=Math.pow(wave,12)*.07;
      colors.push(.86-side*.35+ripple,.78-side*.16+ripple,.60+side*.04+ripple,1);
    }
    for(let r=0;r<rows-1;r++)for(let c=0;c<xs.length-1;c++){const a=r*xs.length+c,b=a+1,d=a+xs.length,e=d+1;indices.push(a,d,b,b,d,e);}
    VertexData.ComputeNormals(positions,indices,normals);
    const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.colors=colors;data.applyToMesh(source);
    source.material=material;source.isVisible=false;source.isPickable=false;
    this.tiles=Array.from({length:8},(_,i)=>{const mesh=source.createInstance(`sand-tile-${i}`);mesh.isPickable=false;return mesh;});
  }
  update(distance){for(let i=0;i<this.tiles.length;i++)this.tiles[i].position.z=i*24-(distance%24)-24;}
}
