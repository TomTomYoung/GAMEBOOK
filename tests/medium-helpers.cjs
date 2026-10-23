'use strict';
const assert = require('node:assert/strict');

function matches(state, conditions) {
  return conditions.every(c => c.op === 'eq' ? state[c.var] === c.value : c.op === 'gte' ? state[c.var] >= c.value : assert.fail(`unexpected operator ${c.op}`));
}
function trailFor(item) {
  const trail = [];
  for (; item.parent; item = item.parent) trail.push(item.choiceId);
  return trail.reverse();
}
function explore(story) {
  const nodes = new Map(story.nodes.map(n => [n.id,n]));
  const initial = Object.fromEntries(story.state.map(f=>[f.id,f.initial]));
  const queue = [{ nodeId:'01', state:initial, before:initial, parent:null }];
  const seen = new Set(), nodeSamples = new Map(), choiceSamples = new Map(), variantSamples = new Map(), endings = new Map(), chapterStarts = new Map();
  for (let i=0; i<queue.length; i++) {
    const item = queue[i], node = nodes.get(item.nodeId);
    const priorKeys = [...new Set((node.variants||[]).flatMap(v=>(v.whenBefore||[]).map(c=>c.var)))];
    const key = JSON.stringify([item.nodeId, item.state, priorKeys.map(k=>item.before[k])]);
    if (seen.has(key)) continue;
    seen.add(key);
    assert(seen.size < 100000, 'state exploration bound');
    if (!nodeSamples.has(node.id)) nodeSamples.set(node.id,item);
    const meta = story.author.chapterNodes[node.id];
    if (meta.section === '01' && !chapterStarts.has(meta.chapter)) chapterStarts.set(meta.chapter,item);
    let hasText = Boolean(node.body.trim());
    (node.variants||[]).forEach((v,j)=>{
      if (matches(item.state,v.when) && matches(item.before,v.whenBefore||[])) {
        hasText = true;
        if (!variantSamples.has(`${node.id}:${j}`)) variantSamples.set(`${node.id}:${j}`,item);
      }
    });
    assert(hasText, `${story.id}/${node.id}: blank passage`);
    if (node.ending) {
      assert(matches(item.state,node.ending.requires));
      if (!endings.has(node.ending.id)) endings.set(node.ending.id,item);
      continue;
    }
    const choices = node.choices.filter(c=>matches(item.state,c.when));
    assert(choices.length, `${story.id}/${node.id}: dead end`);
    for (const c of choices) {
      if (!choiceSamples.has(c.id)) choiceSamples.set(c.id,item);
      const state = {...item.state};
      for (const e of c.effects) {
        if (e.op === 'add') state[e.var] += e.value;
        else state[e.var] = e.value;
      }
      for (const field of story.state) assert(field.type === 'int' ? Number.isInteger(state[field.id]) && state[field.id]>=field.min && state[field.id]<=field.max : field.values.includes(state[field.id]), `${story.id}/${c.id}: ${field.id} out of range`);
      queue.push({nodeId:c.to,state,before:item.state,parent:item,choiceId:c.id});
    }
  }
  return { states:seen.size,nodeSamples,choiceSamples,variantSamples,endings,chapterStarts };
}
module.exports = { explore, trailFor, matches };
