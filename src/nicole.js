import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
import { oval, profileMesh, leaf } from './art-geometry.js';

export class NicoleModel {
  constructor(scene, material) {
    this.root = new TransformNode('Nicole-articulated', scene);
    this.hips = new TransformNode('hips', scene); this.hips.parent = this.root;
    this.chest = new TransformNode('chest', scene); this.chest.parent = this.hips;
    this.head = new TransformNode('head', scene); this.head.parent = this.chest; this.head.position.y = .52;
    const skin = material('skin', '#f5cbb2'), hair = material('dark-blonde', '#a67a40');
    const highlight = material('hair-highlight', '#c49b5e'), top = material('pearl-pink', '#df87b1');
    const tail = material('lagoon-tail', '#379f9d'), fins = material('lilac-fins', '#aa89cf');
    const white = material('eye-white', '#fff8ed'), ink = material('eyes', '#244853');
    const blush = material('cheeks', '#e89f9e'), gold = material('gold', '#f7d98d');
    const body = profileMesh(scene, 'sculpted-torso', [[0,.125,.09], [.08,.11,.08], [.20,.155,.10], [.30,.17,.10], [.35,.105,.085]], skin);
    body.parent = this.chest;
    oval(scene,'neck',[.13,.14,.13],[0,.37,0],skin,this.chest);
    for (const side of [-1,1]) {
      const shell = oval(scene,'shell-top',[.175,.135,.07],[side*.075,.225,.097],top,this.chest);
      shell.rotation.z=side*.18;
    }
    const belt = profileMesh(scene,'pearl-belt',[[.005,.13,.097],[.04,.13,.097]],top,20);belt.parent=this.chest;
    oval(scene,'face',[.40,.42,.345],[0,0,.015],skin,this.head,16);
    // Cap plus separate swept locks give the rear view a readable hairstyle.
    const cap=profileMesh(scene,'hair-cap',[[.005,.207,.16,-.025],[.105,.20,.16,-.026],[.19,.14,.11,-.015],[.225,.01,.01]],hair,24);cap.parent=this.head;
    this.locks=[];
    for(let i=0;i<5;i++) {
      const pivot=new TransformNode(`hair-lock-${i}`,scene);pivot.parent=this.head;pivot.position.set((i-2)*.073,.035,-.12);
      const lock=profileMesh(scene,'wavy-hair',[[0,.065,.055],[-.12,.063,.054,-.015],[-.25,.05,.035,-.005],[-.34,.008,.008,.028]],i%2?highlight:hair,12);lock.parent=pivot;
      this.locks.push(pivot);
    }
    for(const side of [-1,1]) {
      oval(scene,'ear',[.065,.105,.065],[side*.195,-.02,0],skin,this.head);
      oval(scene,'eye-white',[.095,.105,.027],[side*.079,.018,.17],white,this.head);
      oval(scene,'iris',[.046,.069,.016],[side*.079,.013,.188],ink,this.head);
      oval(scene,'eye-glint',[.018,.022,.007],[side*.072,.033,.197],white,this.head);
      oval(scene,'cheek',[.073,.031,.013],[side*.115,-.065,.158],blush,this.head);
    }
    oval(scene,'smile',[.073,.025,.012],[0,-.098,.179],blush,this.head);
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*2/5;
      oval(scene,'flower-petal',[.066,.065,.035],[.18+Math.cos(a)*.042,.10+Math.sin(a)*.042,-.123],top,this.head);
    }
    oval(scene,'flower-pearl',[.04,.04,.026],[.18,.10,-.148],gold,this.head);
    this.shoulders=[]; this.elbows=[];
    for(const side of [-1,1]) {
      const shoulder=new TransformNode(`shoulder-${side}`,scene);shoulder.parent=this.chest;shoulder.position.set(side*.155,.30,0);
      oval(scene,'upper-arm',[.09,.195,.095],[side*.018,-.072,0],skin,shoulder);
      const elbow=new TransformNode(`elbow-${side}`,scene);elbow.parent=shoulder;elbow.position.set(side*.025,-.155,0);
      oval(scene,'forearm',[.075,.17,.08],[0,-.062,0],skin,elbow);
      oval(scene,'hand',[.075,.10,.043],[0,-.145,.012],skin,elbow);
      this.shoulders.push(shoulder);this.elbows.push(elbow);
    }
    // Single deformable surface, rather than separate rigid cones or spheres.
    const rings=Array.from({length:13},(_,i)=>{const t=i/12;return [-t*.52,.027+.103*(1-t)**.62,.025+.065*(1-t)**.72,-.015*t];});
    this.tail=profileMesh(scene,'continuous-tail',rings,tail,20,2,true);this.tail.parent=this.hips;
    this.rest=new Float32Array(this.tail.getVerticesData('position'));
    this.positions=new Float32Array(this.rest);this.normals=new Float32Array(this.tail.getVerticesData('normal'));
    this.indices=this.tail.getIndices();
    this.flukes=new TransformNode('flukes',scene);this.flukes.parent=this.hips;
    for(const side of [-1,1]) {
      const fin=leaf(scene,'sculpted-fluke',.29,.20,fins,this.flukes);
      fin.rotation.z=side*1.15;fin.rotation.x=-.22;
    }
    this.lastDistance=0;this.previousY=0;this.land=0;
  }
  update(x,y,height,phase,laneTarget,velocity=0,state='running') {
    const distance=phase/.3, dt=Math.min(.05,Math.max(0,(distance-this.lastDistance)/12));
    if(distance<this.lastDistance){this.land=0;this.previousY=0;}
    const dive=height<1?1:0, flight=Math.min(1,y/.25), stroke=Math.sin(phase*2);
    if(this.previousY>.01&&y===0)this.land=1;
    this.land=Math.max(0,this.land-dt*6);
    this.root.position.set(x,y,0);this.root.rotation.z=Math.max(-.12,Math.min(.12,(x-laneTarget)*.09));
    this.hips.position.y=dive?.14:.62-this.land*.045;
    this.chest.rotation.x=dive?1.12:flight*(.045-Math.max(-1,Math.min(1,velocity/5))*.175)+this.land*.12;
    this.head.rotation.x=dive?-.25:-this.chest.rotation.x*.4;
    this.head.rotation.z=stroke*.035*(1-flight)*(1-dive);
    this.shoulders.forEach((s,i)=>{const side=i?1:-1;s.rotation.x=dive?-.85:flight?-.6:stroke*(i?-.4:.4)-.1;s.rotation.z=side*(dive?.12:flight?.4:.15);});
    this.elbows.forEach((e,i)=>{e.rotation.x=dive?-1.2:flight?-.4:-.18+Math.cos(phase*2+i)*.15;});
    this.locks.forEach((h,i)=>{h.rotation.x=.1+stroke*.07+flight*.10;h.rotation.z=Math.sin(phase*1.7+i*.8)*.045;});
    // Continuous traveling wave along the tail, plus a curled dive pose.
    for(let i=0;i<this.rest.length;i+=3){
      const t=Math.min(1,Math.max(0,-this.rest[i+1]/.52));
      this.positions[i]=this.rest[i]+Math.sin(phase*2.8-t*2)*.05*t*t*(1-dive);
      this.positions[i+1]=this.rest[i+1]*(dive?.18:1);
      this.positions[i+2]=this.rest[i+2]+Math.sin(phase*2.8-t*2)*.06*t*t*(1-dive)-.37*t*t*dive;
    }
    VertexData.ComputeNormals(this.positions,this.indices,this.normals);
    this.tail.updateVerticesData('position',this.positions,true);this.tail.updateVerticesData('normal',this.normals);
    const end=this.positions.length-3; // final cap center follows the same deformation
    this.flukes.position.set(this.positions[end],this.positions[end+1],this.positions[end+2]);
    this.flukes.rotation.x=dive?-1.2:Math.sin(phase*2.8-2)*.30;
    if(state==='over')this.head.rotation.z=-.12;
    this.previousY=y;this.lastDistance=distance;
  }
}
