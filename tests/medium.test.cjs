'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../js/engine.js');
const S = require('../js/storage.js');
const stories = require('../js/medium.js');
const shorts = require('../js/stories.js');
const editions = require('../js/editions.js');
const { readMediumStories } = require('../scripts/medium-stories.cjs');
const { explore, trailFor } = require('./medium-helpers.cjs');
const ROOT = path.resolve(__dirname,'..');
const registry = [...shorts,...editions.map(e=>e.story),...stories];
const compact = text => text.replace(/\s/g,'');

// Independent reading of the Markdown: process each condition and record in
// its original order, including the wound BEFORE the record changes it.
function originalText(story, node, arrivalBefore) {
  const meta = story.author.chapterNodes[node.id];
  const [file,anchor] = meta.source.split('#');
  const chapter = fs.readFileSync(path.join(ROOT,file),'utf8').split(/^## 作者.*$/m)[0];
  const passage = chapter.split(`<a id="${anchor}"></a>`)[1].split(/<a id="s\d+"><\/a>/)[0].replace(/^\s*## \d+ .+\n/,'');
  const labels = Object.fromEntries(story.state.map(f=>[f.label,f.id]));
  const state = {...arrivalBefore};
  let quoted = false, include = true;
  const text = [];
  for (const line of passage.split('\n')) {
    if (line.startsWith('> **')) {
      quoted = true;
      const expression = line.match(/^> \*\*(.+)の場合\*\*$/)[1];
      include = expression.split('かつ').every(term=>{
        const [label,expected] = term.split('が');
        const value = state[labels[label]];
        return expected.startsWith('「') ? value === expected.slice(1,-1) : expected.endsWith('以上') ? value >= Number(expected.slice(0,-2)) : value === Number(expected);
      });
    } else if (line.startsWith('>')) {
      if (include) text.push(line.replace(/^> ?/,''));
    } else {
      if (line.trim()) { quoted = false; include = true; }
      const update = /^\*\*記録：(.+?)を(.+)\*\*$/.exec(line);
      if (update) {
        const id = labels[update[1]], instruction = update[2];
        if (instruction.startsWith('「')) state[id] = instruction.match(/^「(.+)」/)[1];
        else if (instruction.includes('減らす')) state[id] -= Number(instruction.match(/^\d+/)[0]);
        else state[id] = Number(instruction.match(/^\d+/)[0]);
      } else if (/^\*\*結末 |\]\((?:ch\d+\.md)?#s\d+\)/.test(line)) continue;
      else if (!quoted || include) text.push(line);
    }
  }
  return { text:text.join('\n').trim() || node.title,state };
}

test('all three complete medium books compile from unchanged chapter Markdown',()=>{
  assert.deepEqual(stories,readMediumStories(ROOT));
  assert.deepEqual(stories.map(s=>s.nodes.length),[322,339,304]);
  assert.deepEqual(stories.map(s=>s.nodes.reduce((n,x)=>n+x.choices.length,0)),[368,395,340]);
  assert.deepEqual(stories.map(s=>s.nodes.filter(n=>n.ending).length),[6,4,3]);
});

for (const story of stories) test(`${story.id}: every passage, branch and conditional text is reachable; all endings and chapter saves replay`,()=>{
  const graph = explore(story);
  assert.equal(graph.nodeSamples.size,story.nodes.length);
  assert.equal(graph.choiceSamples.size,story.nodes.reduce((sum,n)=>sum+n.choices.length,0));
  const totalVariants = story.nodes.reduce((sum,n)=>sum+(n.variants||[]).length,0);
  assert.equal(graph.variantSamples.size,totalVariants,'all prose variants are reachable');
  assert.equal(graph.endings.size,story.nodes.filter(n=>n.ending).length);
  const samples = new Set([...graph.nodeSamples.values(),...graph.variantSamples.values()]);
  for (const item of samples) {
    const session = E.replay(story,trailFor(item));
    const node = story.nodes.find(n=>n.id===session.nodeId);
    const original = originalText(story,node,item.before);
    assert.deepEqual(session.state,original.state,`${node.id}: source updates`);
    assert.equal(compact(E.getText(story,session)),compact(original.text),`${node.id}: source prose order and conditions`);
    assert.deepEqual(E.validateSession(story,session),session);
  }
  // Exercise every declared choice through the real adapter, not just the
  // independent graph walk (including every resource-consuming branch).
  for (const [id,item] of graph.choiceSamples) {
    const session = E.replay(story,trailFor(item));
    const next = E.choose(story,session,id);
    const node = story.nodes.find(n=>n.id===next.nodeId);
    assert.deepEqual(next.state,originalText(story,node,session.state).state);
  }
  const shelf = S.createShelf();
  shelf.sessions.GB01 = E.choose(shorts[0],E.createSession(shorts[0]),'01a');
  shelf.bookmarks.GB01 = { intro:false,page:0,nodeId:shelf.sessions.GB01.nodeId,trailLength:1 };
  const originalShort = JSON.stringify(shelf.sessions.GB01);
  shelf.endingTrails[story.id] = {};
  for (const [ending,item] of graph.endings) {
    const trail = trailFor(item);
    assert(trail.length < E.MAX_TRAIL_LENGTH);
    shelf.endingTrails[story.id][ending] = trail;
  }
  for (const item of graph.chapterStarts.values()) {
    const session = E.replay(story,trailFor(item));
    shelf.sessions[story.id] = session;
    shelf.bookmarks[story.id] = { intro:false,page:1,nodeId:session.nodeId,trailLength:session.trail.length };
    shelf.activeStoryId = story.id;
    const restored = S.validateShelf(registry,JSON.parse(JSON.stringify(shelf)));
    assert.deepEqual(restored,shelf);
    assert.equal(JSON.stringify(restored.sessions.GB01),originalShort);
  }
  console.log(`${story.id}: ${graph.states} reachable state/passage combinations; ${graph.choiceSamples.size} branches; ${graph.endings.size} endings`);
});

test('blank conditional passages reject a state with no matching text',()=>{
  const story = structuredClone(stories[0]);
  story.nodes[0].body = '';
  story.nodes[0].variants = [{ when:[{var:'letter',op:'eq',value:'送った'}],text:'送った後の本文' }];
  assert.throws(()=>E.createSession(story),/表示できる本文/);
});
