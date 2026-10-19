'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../js/engine.js');
const storage = require('../js/storage.js');
const stories = require('../js/stories.js');
const byId = Object.fromEntries(stories.map(story => [story.id, story]));
const clone = value => JSON.parse(JSON.stringify(value));

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

function bookmark(session, intro = false, page = 0) {
  return { intro, page, nodeId: session.nodeId, trailLength: session.trail.length };
}

function fixture() {
  const shelf = storage.createShelf();
  shelf.sessions.GB05 = engine.replay(byId.GB05, ['01a', '02d']);
  shelf.sessions.GB15 = engine.replay(byId.GB15, ['01a', '021a', '03a', '09a']);
  shelf.sessions.GB19 = engine.createSession(byId.GB19);
  for (const [id, session] of Object.entries(shelf.sessions)) shelf.bookmarks[id] = bookmark(session, id === 'GB19', 1);
  shelf.endingTrails.GB05 = { E1: ['01a', '02d', '06c', '08a'] };
  // Collected endings survive a new run and do not require an active session.
  shelf.endingTrails.GB17 = { E5: ['01b', '03a', '04a', '05a', '06b', '09d'] };
  shelf.preferences = { fontSize: 22, theme: 'night' };
  shelf.activeStoryId = 'GB15';
  return shelf;
}

function allEndingTrails(story) {
  const first = engine.createSession(story);
  const queue = [first];
  const seen = new Set();
  const endings = {};
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const key = JSON.stringify([current.nodeId, current.state]);
    if (seen.has(key)) continue;
    seen.add(key);
    const node = engine.getNode(story, current);
    if (node.ending) {
      if (!endings[node.ending.id]) endings[node.ending.id] = current.trail;
    } else {
      for (const choice of engine.availableChoices(story, current)) queue.push(engine.choose(story, current, choice.id));
    }
  }
  return endings;
}

test('new shelves use the exact versioned schema and have independent mutable records', () => {
  const first = storage.createShelf();
  assert.deepEqual(first, {
    format: 'gamebook-shelf', version: 1, sessions: {}, endingTrails: {}, bookmarks: {},
    preferences: { fontSize: 20, theme: 'day' }, activeStoryId: null
  });
  assert.deepEqual(storage.validateShelf(stories, first), first);
  const second = storage.createShelf();
  first.preferences.fontSize = 24;
  first.sessions.GB19 = engine.createSession(byId.GB19);
  assert.deepEqual(second, storage.createShelf());
  assert.equal(Object.isFrozen(storage), true);
  assert.deepEqual(Object.keys(storage).sort(), ['createShelf', 'validateShelf']);
});

test('a mixed shelf preserves exact progress, bookmarks and independently collected endings without sharing references', () => {
  const input = freezeDeep(fixture());
  const before = JSON.stringify(input);
  const output = storage.validateShelf(stories, input);
  assert.deepEqual(output, input);
  assert.equal(JSON.stringify(input), before);
  assert.notEqual(output, input);
  assert.notEqual(output.sessions.GB05, input.sessions.GB05);
  assert.notEqual(output.sessions.GB05.state, input.sessions.GB05.state);
  assert.notEqual(output.sessions.GB05.trail, input.sessions.GB05.trail);
  assert.notEqual(output.endingTrails.GB17.E5, input.endingTrails.GB17.E5);
  assert.notEqual(output.bookmarks.GB05, input.bookmarks.GB05);
  assert.notEqual(output.preferences, input.preferences);
  assert.equal(output.sessions.GB15.state.saved, 'なし', 'a replayed rewind does not recover cancelled rescues');
  output.sessions.GB05.state.cloud = 0;
  output.endingTrails.GB17.E5.push('fake');
  assert.equal(JSON.stringify(input), before);
});

test('all twenty sessions and all76 actual endings survive one shelf import', () => {
  const shelf = storage.createShelf();
  let endingCount = 0;
  for (const story of stories) {
    shelf.sessions[story.id] = engine.createSession(story);
    shelf.bookmarks[story.id] = bookmark(shelf.sessions[story.id], true);
    shelf.endingTrails[story.id] = allEndingTrails(story);
    endingCount += Object.keys(shelf.endingTrails[story.id]).length;
  }
  shelf.activeStoryId = 'GB20';
  assert.equal(endingCount, 76);
  const output = storage.validateShelf(stories, JSON.parse(JSON.stringify(shelf)));
  assert.deepEqual(output, shelf);
  assert.equal(Object.keys(output.sessions).length, 20);
});

test('all supported preferences and the specified bookmark boundaries remain valid', () => {
  for (const fontSize of [18, 20, 22, 24]) {
    for (const theme of ['day', 'night']) {
      const shelf = storage.createShelf();
      shelf.preferences = { fontSize, theme };
      assert.deepEqual(storage.validateShelf(stories, shelf), shelf);
    }
  }
  for (const page of [0, 10000]) {
    const shelf = fixture();
    shelf.bookmarks.GB05.page = page;
    assert.equal(storage.validateShelf(stories, shelf).bookmarks.GB05.page, page);
  }
});

test('invalid shelf metadata, mapping IDs and settings are rejected rather than repaired', () => {
  const cases = [
    [shelf => { shelf.format = 'save'; }, /セーブ形式/],
    [shelf => { shelf.version = 2; }, /セーブ形式/],
    [shelf => { shelf.version = '1'; }, /セーブ形式/],
    [shelf => { delete shelf.bookmarks; }, /ありません/],
    [shelf => { shelf.timestamp = '2026-01-01'; }, /未対応の項目/],
    [shelf => { shelf.sessions = []; }, /オブジェクト/],
    [shelf => { shelf.endingTrails = null; }, /オブジェクト/],
    [shelf => { shelf.bookmarks = 'GB05'; }, /オブジェクト/],
    [shelf => { shelf.sessions.GB99 = shelf.sessions.GB05; }, /未知の作品/],
    [shelf => { shelf.endingTrails.GB99 = {}; }, /未知の作品/],
    [shelf => { shelf.bookmarks.GB99 = {}; }, /未知の作品/],
    [shelf => { shelf.preferences.fontSize = 21; }, /文字サイズ/],
    [shelf => { shelf.preferences.fontSize = '20'; }, /文字サイズ/],
    [shelf => { shelf.preferences.theme = 'sepia'; }, /表示テーマ/],
    [shelf => { shelf.preferences.volume = 1; }, /未対応の項目/],
    [shelf => { delete shelf.preferences.theme; }, /ありません/],
    [shelf => { shelf.activeStoryId = 'GB01'; }, /作品のセーブがありません/],
    [shelf => { shelf.activeStoryId = 'GB99'; }, /作品のセーブがありません/],
    [shelf => { shelf.activeStoryId = false; }, /作品のセーブがありません/]
  ];
  for (const [change, expected] of cases) {
    const shelf = fixture();
    change(shelf);
    const before = JSON.stringify(shelf);
    assert.throws(() => storage.validateShelf(stories, shelf), expected);
    assert.equal(JSON.stringify(shelf), before, 'failed validation never modifies even the valid entries');
  }
});

test('individual session provenance and history are validated by the engine within the shelf', () => {
  const changes = [
    [shelf => { shelf.sessions.GB05.state.cloud = 5; }, /選択履歴/],
    [shelf => { shelf.sessions.GB05.state.cloud = -1; }, /許可範囲/],
    [shelf => { shelf.sessions.GB05.storyId = 'GB15'; }, /別の作品/],
    [shelf => { shelf.sessions.GB15.contentRevision = 2; }, /改訂番号/],
    [shelf => { shelf.sessions.GB15.adapterVersion = 2; }, /アダプター版/],
    [shelf => { shelf.sessions.GB15.modelVersion = '1.3'; }, /モデル版/],
    [shelf => { shelf.sessions.GB19.state.read = true; }, /未対応の項目/],
    [shelf => { shelf.sessions.GB19.timestamp = 1; }, /未対応の項目/]
  ];
  for (const [change, expected] of changes) {
    const shelf = fixture();
    change(shelf);
    const before = JSON.stringify(shelf);
    assert.throws(() => storage.validateShelf(stories, shelf), expected);
    assert.equal(JSON.stringify(shelf), before);
  }
});

test('an ending is collected only when its exact recorded trail actually reaches that ending', () => {
  const changes = [
    [shelf => { shelf.endingTrails.GB05.E9 = shelf.endingTrails.GB05.E1; }, /結末.*ありません/],
    [shelf => { shelf.endingTrails.GB05.E2 = shelf.endingTrails.GB05.E1; }, /結末.*選択履歴が一致/],
    [shelf => { shelf.endingTrails.GB05.E1 = ['01a', '02d', '06c']; }, /結末.*選択履歴が一致/],
    [shelf => { shelf.endingTrails.GB05.E1 = []; }, /結末.*選択履歴が一致/],
    [shelf => { shelf.endingTrails.GB05.E1 = ['unknown']; }, /現在の段落/],
    [shelf => { shelf.endingTrails.GB05.E1 = ['01a', '02d', '06c', '08a', '08a']; }, /結末/],
    [shelf => { shelf.endingTrails.GB05.E1 = '01a'; }, /配列/],
    [shelf => { shelf.endingTrails.GB05.E1 = [null]; }, /識別子/],
    [shelf => { shelf.endingTrails.GB05.E1 = Array(1001).fill('01a'); }, /1000件/],
    [shelf => { shelf.endingTrails.GB05 = []; }, /オブジェクト/]
  ];
  for (const [change, expected] of changes) {
    const shelf = fixture();
    change(shelf);
    assert.throws(() => storage.validateShelf(stories, shelf), expected);
  }
});

test('bookmarks must describe the associated current session without inventing past or future progress', () => {
  const changes = [
    [shelf => { shelf.bookmarks.GB01 = { intro: true, page: 0, nodeId: '01', trailLength: 0 }; }, /セーブがありません/],
    [shelf => { shelf.bookmarks.GB05.nodeId = '01'; }, /現在の段落が一致/],
    [shelf => { shelf.bookmarks.GB05.trailLength = 0; }, /選択履歴の長さ/],
    [shelf => { shelf.bookmarks.GB05.trailLength = '2'; }, /選択履歴の長さ/],
    [shelf => { shelf.bookmarks.GB05.intro = true; }, /選択を始める前/],
    [shelf => { shelf.bookmarks.GB05.intro = 0; }, /真偽値/],
    [shelf => { shelf.bookmarks.GB05.page = -1; }, /ページ番号/],
    [shelf => { shelf.bookmarks.GB05.page = 10001; }, /ページ番号/],
    [shelf => { shelf.bookmarks.GB05.page = 0.5; }, /ページ番号/],
    [shelf => { shelf.bookmarks.GB05.page = '1'; }, /ページ番号/],
    [shelf => { shelf.bookmarks.GB05.page = Infinity; }, /ページ番号/],
    [shelf => { shelf.bookmarks.GB05.pageCount = 3; }, /未対応の項目/],
    [shelf => { delete shelf.bookmarks.GB05.intro; }, /ありません/]
  ];
  for (const [change, expected] of changes) {
    const shelf = fixture();
    change(shelf);
    assert.throws(() => storage.validateShelf(stories, shelf), expected);
  }
});

test('cross-realm browser objects and null-prototype JSON records normalize correctly', () => {
  const context = vm.createContext({ externalStories: stories, externalShelf: fixture() });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'engine.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8'), context);
  const output = vm.runInContext('GBStorage.validateShelf(externalStories, externalShelf)', context);
  assert.deepEqual(clone(output), fixture(), 'browser VM accepts host-created ordinary JSON objects');
  const foreignShelf = vm.runInContext('JSON.parse(JSON.stringify(externalShelf))', context);
  const foreignStories = vm.runInContext('JSON.parse(JSON.stringify(externalStories))', context);
  assert.deepEqual(storage.validateShelf(foreignStories, foreignShelf), fixture(), 'CommonJS also accepts ordinary objects from another realm');
  const nullPrototype = fixture();
  nullPrototype.sessions = Object.assign(Object.create(null), nullPrototype.sessions);
  nullPrototype.preferences = Object.assign(Object.create(null), nullPrototype.preferences);
  assert.deepEqual(storage.validateShelf(stories, nullPrototype), fixture());
});

test('reserved keys, custom prototypes, getters, symbols and non-JSON values cannot enter normalized saves', () => {
  for (const key of ['__proto__', 'prototype', 'constructor']) {
    const shelf = fixture();
    Object.defineProperty(shelf.sessions, key, { enumerable: true, value: { polluted: true } });
    assert.throws(() => storage.validateShelf(stories, shelf), /使用できない項目/);
  }
  assert.equal({}.polluted, undefined);
  const inherited = Object.create({ hidden: true });
  Object.assign(inherited, fixture());
  assert.throws(() => storage.validateShelf(stories, inherited), /形式が不正/);
  const dated = fixture();
  dated.preferences = new Date();
  assert.throws(() => storage.validateShelf(stories, dated), /形式が不正/);
  let getterInvoked = false;
  const getterShelf = fixture();
  Object.defineProperty(getterShelf.sessions.GB05.state, 'cloud', { enumerable: true, get() { getterInvoked = true; return 6; } });
  assert.throws(() => storage.validateShelf(stories, getterShelf), /使用できない項目/);
  assert.equal(getterInvoked, false);
  const symbolShelf = fixture();
  symbolShelf[Symbol('hidden')] = true;
  assert.throws(() => storage.validateShelf(stories, symbolShelf), /使用できない項目/);
  const hiddenShelf = fixture();
  Object.defineProperty(hiddenShelf, 'secret', { value: 1, enumerable: false });
  assert.throws(() => storage.validateShelf(stories, hiddenShelf), /使用できない項目/);
  const functionShelf = fixture();
  functionShelf.sessions.GB05.state.cloud = () => 6;
  assert.throws(() => storage.validateShelf(stories, functionShelf), /JSONで扱えない/);
  const circularShelf = fixture();
  circularShelf.sessions.GB05.state.cloud = circularShelf.sessions.GB05;
  assert.throws(() => storage.validateShelf(stories, circularShelf), /循環参照/);
  const sparseShelf = fixture();
  sparseShelf.endingTrails.GB05.E1 = Array(1);
  assert.throws(() => storage.validateShelf(stories, sparseShelf), /欠落/);
  const decoratedTrail = fixture();
  decoratedTrail.endingTrails.GB05.E1.extra = true;
  assert.throws(() => storage.validateShelf(stories, decoratedTrail), /使用できない項目/);
});

test('story registries must be valid and unambiguous before an imported shelf is accepted', () => {
  assert.throws(() => storage.validateShelf({}, storage.createShelf()), /配列/);
  assert.throws(() => storage.validateShelf([...stories, stories[0]], storage.createShelf()), /作品一覧.*重複/);
  const badStory = clone(byId.GB05);
  badStory.nodes[0].choices[0].to = '99';
  assert.throws(() => storage.validateShelf([badStory], storage.createShelf()), /移動先/);
  const emptyContext = vm.createContext({});
  assert.throws(() => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'storage.js'), 'utf8'), emptyContext), /ゲームエンジンを読み込んで/);
});
