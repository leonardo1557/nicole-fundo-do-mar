import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { ObstacleArt } from '../src/obstacle-art.js';
import { seaMaterial, UnderwaterWorld } from '../src/underwater.js';
import { Seafloor } from '../src/seafloor.js';
import { Runner } from '../src/simulation.js';
import { CONFIG as C } from '../src/config.js';

test('themed obstacles retain collision envelopes and reuse one visible variant',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);
 try{
  const runner=new Runner({scenario:'empty'});runner.start();
  const art=new ObstacleArt(scene,runner.obstacles,(name,color)=>seaMaterial(scene,name,color));
  const count=scene.meshes.length;
  for(const [i,height] of [C.lowHeight,C.highHeight,C.overheadHeight].entries()){
   const source=art.sources[i];source.computeWorldMatrix(true);const b=source.getBoundingInfo().boundingBox;
   assert.ok(b.minimum.y>=-.01 && b.maximum.y<=height+.01, `${i} height`);
   assert.ok(b.minimum.x>=-C.obstacleWidth/2-.015 && b.maximum.x<=C.obstacleWidth/2+.015, `${i} width`);
   assert.ok(b.minimum.z>=-C.obstacleDepth/2-.015 && b.maximum.z<=C.obstacleDepth/2+.015, `${i} depth`);
   assert.ok(b.maximum.x-b.minimum.x>=C.obstacleWidth-.08);
  }
  for(let i=0;i<30;i++){
   runner.reset();runner.spawn(1,5,i%2?C.lowHeight:C.overheadHeight,i%2?0:C.overheadBottom);art.update(runner.obstacles,.5);
   assert.equal(art.slots[0].variants.filter(m=>m.isEnabled()).length,1);
   assert.equal(scene.meshes.length,count);
  }
 }finally{engine.dispose();}
});

test('fish and bubbles stay outside lanes; sand tiles remain contiguous after recycling',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);
 try{
  const world=new UnderwaterWorld(scene),floor=new Seafloor(scene,seaMaterial(scene,'sand','#ffffff'));
  const count=scene.meshes.length;
  for(const distance of [0,23.9,24,25,100000]){
   world.update(distance);floor.update(distance);
   for(const f of world.fish.fish)assert.ok(Math.abs(f.root.position.x)>4.4);
   for(const b of world.bubbles)assert.ok(Math.abs(b.mesh.position.x)>4.1);
   for(let i=1;i<floor.tiles.length;i++)assert.ok(Math.abs(floor.tiles[i].position.z-floor.tiles[i-1].position.z-24)<1e-8);
   assert.equal(scene.meshes.length,count);
  }
  assert.equal(world.fish.fish.length,12);
  world.setQuality(.75);
  const visible=world.bubbles.filter(b=>b.mesh.isEnabled());
  assert.equal(visible.length,14);
  assert.ok(visible.some(b=>b.mesh.position.x<0)&&visible.some(b=>b.mesh.position.x>0));
  world.setQuality(1.5);assert.equal(world.bubbles.filter(b=>b.mesh.isEnabled()).length,28);
 }finally{engine.dispose();}
});
