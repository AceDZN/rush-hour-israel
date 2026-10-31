import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/levels';
import { createState, applyAction, startWave, tick, metrics, type State } from '../src/model';
import type { PlanAction } from '../src/types';
function execute(s:State,actions:PlanAction[]){return actions.map(a=>({action:a,ok:a.type==='stop'&&s.stops.has(a.node)?true:applyAction(s,a)}));}
function finish(s:State){startWave(s);for(let i=0;i<Math.ceil(s.level.duration*10)+2&&s.mode==='running';i++)tick(s,.1);return metrics(s);}

test('campaign is exactly 24 authored missions, with distinct spatial/demand constraints',()=>{
 assert.equal(levels.length,24);assert.deepEqual(levels.map(l=>l.id),Array.from({length:24},(_,i)=>i+1));
 assert.equal(new Set(levels.map(l=>l.title)).size,24);
 const signatures=levels.map(l=>JSON.stringify({points:l.nodes.map(n=>[n.x,n.z,n.h,n.kind]),edges:l.corridors.map(e=>[e.a,e.b,e.bridge,e.forbidden,e.via,e.closeAt]),demand:l.demand.map(d=>[d.origin,d.destination,d.car,d.count,d.at]),tools:l.tools,noise:l.noiseLimit,footprint:l.footprintLimit}));
 assert.equal(new Set(signatures).size,24,'missions cannot be renamed copies');
});
for(const level of levels){
 test(`level ${level.id} baseline is buildable and serves every required group`,()=>{
  const s=createState(level),actions=execute(s,level.baseline);
  assert.deepEqual(actions.filter(x=>!x.ok),[],`invalid baseline actions: ${JSON.stringify(actions.filter(x=>!x.ok))}`);
  const m=finish(s);
  assert.equal(s.mode,'won',JSON.stringify({level:level.id,mode:s.mode,time:s.time,budget:s.budget,groups:m.groups,noise:m.noise,footprint:m.footprint,waiting:m.waiting}));
  assert.ok(m.groups.every(g=>g.access>=level.target),'independent per-origin timely fractions');
  assert.equal(m.pending+m.waiting+m.riding+m.arrived,s.people.length);
  assert.equal(new Set(s.people.map(p=>p.id)).size,s.people.length);
 });
 test(`level ${level.id} authored near miss exposes an unmet requirement`,()=>{
  const s=createState(level);execute(s,level.nearMiss);const m=finish(s);
  assert.equal(s.mode,'lost',JSON.stringify({level:level.id,mode:s.mode,groups:m.groups,noise:m.noise,footprint:m.footprint}));
 });
 if(level.alternate)test(`level ${level.id} distinct alternate solution also succeeds`,()=>{
  assert.notEqual(JSON.stringify(level.alternate),JSON.stringify(level.baseline));
  const s=createState(level),actions=execute(s,level.alternate!);assert.deepEqual(actions.filter(x=>!x.ok),[]);const m=finish(s);assert.equal(s.mode,'won',JSON.stringify({level:level.id,groups:m.groups,budget:s.budget}));
 });
}
