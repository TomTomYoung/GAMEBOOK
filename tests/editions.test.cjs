'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const E = require('../js/engine.js');
const S = require('../js/storage.js');
const { readStories, readEditions } = require('../scripts/build-data.cjs');
const originals = readStories();
const editions = readEditions(originals);
const registry = [...originals, ...editions.map(edition => edition.story)];

test('all twenty books have independent second editions in both source and browser data', () => {
  assert.equal(editions.length, 20);
  assert.deepEqual(editions.map(edition => edition.baseId), originals.map(story => story.id));
  for (const edition of editions) {
    assert.equal(edition.edition, 2);
    assert.equal(edition.story.id, `${edition.baseId}-V2`);
    const markdown = fs.readFileSync(path.join(__dirname, '../doc/scenarios', `${edition.story.id.toLowerCase()}.md`), 'utf8');
    assert(markdown.includes('第2版'));
    assert(markdown.includes(`data/editions/${edition.story.id.toLowerCase()}.json`));
    if (edition.baseId === 'GB01') continue;
    const first = originals.find(story => story.id === edition.baseId);
    assert.notEqual(edition.story.setup, first.setup);
    assert.notEqual(edition.story.hook, first.hook);
    for (const node of edition.story.nodes) {
      assert.notEqual(node.body, first.nodes.find(item => item.id === node.id).body,
        `${edition.baseId}/${node.id}: second-edition prose must be authored, not copied`);
    }
  }
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/editions.js'), 'utf8'), context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.GB_EDITIONS)), editions);
});

for (const edition of editions) {
  test(`${edition.story.id}: all branches, endings and saves retain the original mechanics`, () => {
    const first = originals.find(story => story.id === edition.baseId);
    const second = edition.story;
    const queue = [E.createSession(second)], seen = new Set(), nodes = new Set(), endings = new Set();
    const shelf = S.createShelf();
    shelf.sessions[first.id] = E.createSession(first);
    shelf.bookmarks[first.id] = { intro: false, page: 0, nodeId: '01', trailLength: 0 };
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const session = queue[cursor];
      const key = JSON.stringify([session.nodeId, session.state]);
      if (seen.has(key)) continue;
      seen.add(key);
      const legacy = E.replay(first, session.trail);
      assert.equal(session.nodeId, legacy.nodeId);
      assert.deepEqual(session.state, legacy.state);
      const choices = E.availableChoices(second, session);
      assert.deepEqual(choices.map(choice => choice.id), E.availableChoices(first, legacy).map(choice => choice.id));
      const node = E.getNode(second, session);
      nodes.add(node.id);
      assert(E.getText(second, session).startsWith(node.body));
      if (node.ending) {
        assert.equal(node.ending.id, E.getNode(first, legacy).ending.id);
        endings.add(node.ending.id);
        shelf.endingTrails[second.id] ||= {};
        shelf.endingTrails[second.id][node.ending.id] = session.trail;
      } else assert(choices.length > 0, 'every reachable state can make progress');
      shelf.sessions[second.id] = session;
      shelf.bookmarks[second.id] = { intro: false, page: 0, nodeId: session.nodeId, trailLength: session.trail.length };
      shelf.activeStoryId = second.id;
      assert.deepEqual(S.validateShelf(registry, JSON.parse(JSON.stringify(shelf))), shelf);
      assert.deepEqual(shelf.sessions[first.id], E.createSession(first), 'edition progress does not overwrite the original');
      assert.equal(shelf.endingTrails[first.id], undefined);
      for (const choice of choices) queue.push(E.choose(second, session, choice.id));
      assert(seen.size < 10000);
    }
    assert.equal(nodes.size, second.nodes.length);
    assert.equal(endings.size, second.nodes.filter(node => node.ending).length);
  });
}
