'use strict';
const assert=require('node:assert/strict');
function matches(state,conditions) {
  return conditions.every(({var:key,op,value})=>({eq:()=>state[key]===value,ne:()=>state[key]!==value,gte:()=>state[key]>=value,lte:()=>state[key]<=value}[op] || (()=>assert.fail(op)))());
}
function trailFor(item) {
  const trail=[]; for (;item.parent;item=item.parent) trail.push(item.choiceId); return trail.reverse();
}
function explore(story) {
  const nodes=new Map(story.nodes.map(n=>[n.id,n]));
  const initial=Object.fromEntries(story.state.map(f=>[f.id,f.initial]));
  const keyFor=item=>JSON.stringify([item.nodeId,item.state,[...new Set((nodes.get(item.nodeId).variants||[]).flatMap(v=>(v.whenBefore||[]).map(c=>c.var)))].map(k=>item.before[k])]);
  const queue=[{nodeId:'01',state:initial,before:initial,parent:null}];
  const seen=new Map(),edges=new Map(),nodeSamples=new Map(),choiceSamples=new Map(),variantSamples=new Map(),endings=new Map();
  for (let i=0;i<queue.length;i++) {
    const item=queue[i],key=keyFor(item),node=nodes.get(item.nodeId);
    if (seen.has(key)) continue;
    assert(seen.size<10000,'finite state bound'); seen.set(key,item); edges.set(key,[]);
    if (!nodeSamples.has(node.id)) nodeSamples.set(node.id,item);
    const visible=(node.variants||[]).filter((v,j)=>{
      if (!matches(item.state,v.when)||!matches(item.before,v.whenBefore||[])) return false;
      if (!variantSamples.has(`${node.id}:${j}`)) variantSamples.set(`${node.id}:${j}`,item);
      return true;
    });
    assert(node.body.trim()||visible.length,`${story.id}/${node.id}: no text`);
    item.text=[node.body,...visible.map(v=>v.text)].filter(Boolean).join('\n\n');
    const choices=node.choices.filter(c=>matches(item.state,c.when));
    assert(node.ending||choices.length,`${story.id}/${node.id}: no exit`);
    if (node.ending) { if (!endings.has(node.ending.id)) endings.set(node.ending.id,item); continue; }
    // Conditional expansions must still expose a single button per source choice.
    assert.equal(new Set(choices.map(c=>c.id.split('-')[0])).size,choices.length);
    for (const c of choices) {
      if (!choiceSamples.has(c.id)) choiceSamples.set(c.id,item);
      const state={...item.state};
      for (const e of c.effects) state[e.var]=e.op==='add'?state[e.var]+e.value:e.value;
      for (const f of story.state) assert(f.type==='int'?Number.isInteger(state[f.id])&&state[f.id]>=f.min&&state[f.id]<=f.max:f.type==='bool'?typeof state[f.id]==='boolean':f.values.includes(state[f.id]),`${story.id}/${c.id}: invalid ${f.id}`);
      const next={nodeId:c.to,state,before:item.state,parent:item,choiceId:c.id};
      edges.get(key).push(keyFor(next)); queue.push(next);
    }
  }
  const canEnd=new Set([...seen.keys()].filter(k=>nodes.get(seen.get(k).nodeId).ending));
  for (let changed=true;changed;) { changed=false;for (const [k,next] of edges) if (!canEnd.has(k)&&next.some(v=>canEnd.has(v))) { canEnd.add(k);changed=true; } }
  assert.equal(canEnd.size,seen.size,`${story.id}: trapped state cycle`);
  return {states:seen.size,samples:[...seen.values()],nodeSamples,choiceSamples,variantSamples,endings};
}
module.exports={explore,trailFor,matches};
