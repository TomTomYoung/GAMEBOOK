'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { build, readStories, validateAssets } = require('../scripts/build-data.cjs');

const ROOT = path.resolve(__dirname, '..');
const stories = readStories(ROOT);
const assetStories = [...stories, ...require('../js/shorts.js'), ...require('../js/medium.js')];
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/manifest.json'), 'utf8'));
const sourceManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/source-manifest.json'), 'utf8'));

function hasText(value, label) {
  assert(typeof value === 'string' && value.trim().length > 0, label);
}

function uniqueIds(values, label) {
  assert.equal(new Set(values.map(item => item.id)).size, values.length, label);
  values.forEach(item => hasText(item.id, label));
}

test('all 20 source files retain the recorded canonical bytes and content revisions', () => {
  assert.equal(sourceManifest.format, 'gamebook-canonical-sources');
  assert.equal(sourceManifest.modelVersion, '1.2');
  assert.equal(sourceManifest.stories.length, 20);
  uniqueIds(sourceManifest.stories, 'source IDs');
  for (const [index, source] of sourceManifest.stories.entries()) {
    const story = stories[index];
    assert.equal(source.id, story.id);
    assert.equal(source.file, `data/stories/${story.id.toLowerCase()}.json`);
    assert.equal(source.contentRevision, story.revision);
    const bytes = fs.readFileSync(path.join(ROOT, source.file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.sha256,
      `${story.id}: 原稿改訂は revision と data/source-manifest.json の更新も必要です。`);
  }
});

test('the canonical collection retains complete player and authoring material', () => {
  uniqueIds(stories, 'story IDs');
  const authorText = ['kernel', 'entities', 'situation', 'mechanism', 'institution', 'inference',
    'resolution', 'alternatives', 'presentation', 'state_notes', 'applicability'];
  const factKinds = new Set(['fixed_past', 'initial', 'law', 'institution']);
  const supportTypes = new Set(['cause', 'necessary', 'motive', 'permission', 'confirmation', 'evidence', 'reinterpretation']);
  for (const story of stories) {
    for (const field of ['title', 'genre', 'hook', 'structure', 'setup']) hasText(story[field], `${story.id}.${field}`);
    assert(Number.isInteger(story.revision) && story.revision > 0);
    assert(story.rules.length > 0);
    story.rules.forEach(rule => hasText(rule, `${story.id}.rule`));
    for (const field of authorText) hasText(story.author[field], `${story.id}.author.${field}`);
    assert(story.author.facts.length > 0);
    uniqueIds(story.author.facts, `${story.id}.facts`);
    for (const fact of story.author.facts) {
      assert(factKinds.has(fact.kind), `${story.id}.${fact.id}.kind`);
      hasText(fact.text, `${story.id}.${fact.id}.text`);
    }
    assert(story.author.agents.length > 0);
    uniqueIds(story.author.agents, `${story.id}.agents`);
    story.author.agents.forEach(agent => hasText(agent.text, `${story.id}.${agent.id}.text`));
    assert(story.author.support_links.length > 0);
    for (const link of story.author.support_links) {
      assert(supportTypes.has(link.type), `${story.id}.support_links.type`);
      for (const field of ['from', 'to', 'reason']) hasText(link[field], `${story.id}.support_links.${field}`);
    }
    assert(story.author.review_focus.length > 0);
    story.author.review_focus.forEach(text => hasText(text, `${story.id}.review_focus`));
    for (const node of story.nodes) {
      hasText(node.title, `${story.id}.${node.id}.title`);
      hasText(node.body, `${story.id}.${node.id}.body`);
      for (const choice of node.choices) {
        for (const field of ['label', 'why', 'event']) hasText(choice[field], `${story.id}.${choice.id}.${field}`);
      }
      if (node.ending) {
        hasText(node.ending.name, `${story.id}.${node.id}.ending.name`);
        hasText(node.ending.outcome, `${story.id}.${node.id}.ending.outcome`);
      }
    }
  }
});

test('generated data runs as a browser classic script without fetch or a module loader', () => {
  const browser = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/stories.js'), 'utf8'), browser, { timeout: 3000 });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/assets.js'), 'utf8'), browser, { timeout: 3000 });
  assert.deepEqual(JSON.parse(JSON.stringify(browser.GB_STORIES)), stories);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.GB_ASSETS)), manifest);
  assert.deepEqual(require('../js/stories.js'), stories);
  assert.deepEqual(require('../js/assets.js'), manifest);
});

test('committed generated files match the source data and manifest', () => {
  const result = build({ check: true });
  assert.equal(result.storyCount, 40);
  assert.deepEqual(result.changed, []);
});

test('listening notebook identifies every installed track by its actual audio bytes', () => {
  const tracks = require('../doc/audio-review-data.js');
  assert.equal(tracks.length, 24);
  uniqueIds(tracks, 'review track IDs');
  for (const track of tracks) {
    const music = track.id === 'library' ? manifest.library.music : manifest.stories[track.id].music;
    assert.equal(track.src, music.src);
    assert.equal(track.volume, music.volume);
    assert.equal(track.sha256, crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, music.src))).digest('hex'));
  }
});

test('check mode reports stale or absent bundles without writing them', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gamebook-build-test-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  fs.cpSync(path.join(ROOT, 'data/stories'), path.join(temp, 'data/stories'), { recursive: true });
  fs.mkdirSync(path.join(temp, 'assets'), { recursive: true });
  // Null slots deliberately require no image or audio directories.
  const emptyAssets = { schemaVersion: 1, library: { image: null, music: null }, stories: {} };
  for (const story of stories) emptyAssets.stories[story.id] = { image: null, music: null, scenes: {} };
  fs.writeFileSync(path.join(temp, 'assets/manifest.json'), JSON.stringify(emptyAssets));
  assert.throws(() => build({ root: temp, check: true }), /生成物が原稿と一致しません/);
  assert.equal(fs.existsSync(path.join(temp, 'js/stories.js')), false);
  build({ root: temp });
  const before = fs.readFileSync(path.join(temp, 'js/stories.js'), 'utf8');
  const file = path.join(temp, 'data/stories/gb01.json');
  const changedStory = JSON.parse(fs.readFileSync(file, 'utf8'));
  changedStory.title += '（テスト用の改訂）';
  fs.writeFileSync(file, JSON.stringify(changedStory));
  assert.throws(() => build({ root: temp, check: true }), /js\/stories\.js/);
  assert.equal(fs.readFileSync(path.join(temp, 'js/stories.js'), 'utf8'), before);
  build({ root: temp });
  assert.notEqual(fs.readFileSync(path.join(temp, 'js/stories.js'), 'utf8'), before);
  assert.doesNotThrow(() => build({ root: temp, check: true }));
});

test('asset manifest rejects unavailable files, external paths, and unknown scene nodes', () => {
  assert.doesNotThrow(() => validateAssets(manifest, assetStories, ROOT));
  const altered = () => JSON.parse(JSON.stringify(manifest));
  let bad = altered();
  bad.stories.GB01.image = { src: 'assets/images/missing-test.webp', alt: 'テスト', position: 'center' };
  assert.throws(() => validateAssets(bad, assetStories, ROOT), /素材ファイルがありません/);
  bad = altered();
  bad.library.image = { src: 'https://example.com/cover.webp', alt: 'テスト', position: 'center' };
  assert.throws(() => validateAssets(bad, assetStories, ROOT), /相対パス/);
  bad = altered();
  bad.stories.GB01.scenes['nonexistent'] = { image: null, music: null };
  assert.throws(() => validateAssets(bad, assetStories, ROOT), /存在しない節/);
  bad = altered();
  bad.stories.M01.scenes['nonexistent'] = { image: null, music: null };
  assert.throws(() => validateAssets(bad, assetStories, ROOT), /存在しない節/);
});
