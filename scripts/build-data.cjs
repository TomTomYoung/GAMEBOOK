#!/usr/bin/env node
'use strict';

// Authoring JSON remains the source of truth. These classic-script bundles let
// index.html work from file:// without fetch(), ES modules, or a local server.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const STORY_IDS = Array.from({ length: 20 }, (_, i) => `GB${String(i + 1).padStart(2, '0')}`);

function object(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label}: オブジェクトが必要です。`);
}

function keys(value, expected, label) {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label}: 項目が仕様と一致しません。`);
}

function nonempty(value, label) {
  assert.equal(typeof value, 'string', `${label}: 文字列が必要です。`);
  assert(value.trim().length > 0, `${label}: 空欄にはできません。`);
}

function installedAsset(entry, kind, label, root) {
  if (entry === null) return;
  object(entry, label);
  keys(entry, kind === 'image' ? ['src', 'alt', 'position'] : ['src', 'title', 'loop', 'volume'], label);
  const pattern = kind === 'image'
    ? /^assets\/images\/[a-z0-9_/-]+\.(webp|png|jpe?g|avif|svg)$/i
    : /^assets\/audio\/[a-z0-9_/-]+\.(ogg|mp3|wav|m4a)$/i;
  assert(typeof entry.src === 'string' && pattern.test(entry.src), `${label}.src: assets 配下の相対パスを指定してください。`);
  assert.equal(path.posix.normalize(entry.src), entry.src, `${label}.src: 正規化されたパスが必要です。`);
  const filename = path.resolve(root, entry.src);
  assert(filename.startsWith(`${path.resolve(root)}${path.sep}`), `${label}.src: リポジトリ外の素材は使えません。`);
  assert(fs.existsSync(filename) && fs.statSync(filename).isFile(), `${label}.src: 指定した素材ファイルがありません。`);
  if (kind === 'image') {
    nonempty(entry.alt, `${label}.alt`);
    nonempty(entry.position, `${label}.position`);
  } else {
    nonempty(entry.title, `${label}.title`);
    assert.equal(typeof entry.loop, 'boolean', `${label}.loop: 真偽値が必要です。`);
    assert(typeof entry.volume === 'number' && Number.isFinite(entry.volume) && entry.volume >= 0 && entry.volume <= 1,
      `${label}.volume: 0〜1 の数値が必要です。`);
  }
}

function assetPair(entry, label, root) {
  object(entry, label);
  keys(entry, ['image', 'music'], label);
  installedAsset(entry.image, 'image', `${label}.image`, root);
  installedAsset(entry.music, 'music', `${label}.music`, root);
}

function validateAssets(manifest, stories, root = ROOT) {
  object(manifest, 'manifest');
  keys(manifest, ['schemaVersion', 'library', 'stories'], 'manifest');
  assert.equal(manifest.schemaVersion, 1, '未対応の素材マニフェスト版です。');
  assetPair(manifest.library, 'library', root);
  object(manifest.stories, 'stories');
  keys(manifest.stories, STORY_IDS, 'stories');
  for (const story of stories) {
    const entry = manifest.stories[story.id];
    object(entry, story.id);
    keys(entry, ['image', 'music', 'scenes'], story.id);
    assetPair({ image: entry.image, music: entry.music }, story.id, root);
    object(entry.scenes, `${story.id}.scenes`);
    const nodes = new Set(story.nodes.map(node => node.id));
    for (const [nodeId, scene] of Object.entries(entry.scenes)) {
      assert(nodes.has(nodeId), `${story.id}.scenes.${nodeId}: 存在しない節です。`);
      assetPair(scene, `${story.id}.scenes.${nodeId}`, root);
    }
  }
  return manifest;
}

function readStories(root = ROOT) {
  const directory = path.join(root, 'data', 'stories');
  const expected = STORY_IDS.map(id => `${id.toLowerCase()}.json`);
  const actual = fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort();
  assert.deepEqual(actual, expected, '原稿は gb01.json〜gb20.json の20作を指定してください。');
  return expected.map((name, index) => {
    const story = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    assert.equal(story.id, STORY_IDS[index], `${name}: 作品IDが一致しません。`);
    assert.equal(story.number, index + 1, `${name}: 作品番号が一致しません。`);
    return story;
  });
}

function classicBundle(globalName, sourceLabel, data) {
  // Escape JavaScript line separators for older classic-script parsers. No
  // omission/minification of author facts, contracts, or source field values.
  const serialized = JSON.stringify(data, null, 2)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `/* Generated from ${sourceLabel} by scripts/build-data.cjs. Do not edit. */\n`
    + `(function (root, value) {\n  'use strict';\n`
    + `  if (typeof module === 'object' && module.exports) module.exports = value;\n`
    + `  else root.${globalName} = value;\n`
    + `})(typeof globalThis !== 'undefined' ? globalThis : this, ${serialized});\n`;
}

function build({ root = ROOT, check = false } = {}) {
  const stories = readStories(root);
  const manifest = validateAssets(JSON.parse(fs.readFileSync(path.join(root, 'assets', 'manifest.json'), 'utf8')), stories, root);
  const reviewTracks = [
    { id: 'library', storyTitle: '本棚', ...manifest.library },
    ...stories.map(story => ({ id: story.id, storyTitle: story.title, ...manifest.stories[story.id] }))
  ].filter(entry => entry.music).map(entry => ({
    id: entry.id, storyTitle: entry.storyTitle, ...entry.music,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, entry.music.src))).digest('hex')
  }));
  const outputs = [
    ['js/stories.js', classicBundle('GB_STORIES', 'data/stories/*.json', stories)],
    ['js/assets.js', classicBundle('GB_ASSETS', 'assets/manifest.json', manifest)],
    ['doc/audio-review-data.js', classicBundle('GB_AUDIO_REVIEW_TRACKS', 'data/stories/*.json and assets/manifest.json with audio SHA-256', reviewTracks)]
  ];
  const changed = outputs.filter(([filename, text]) => {
    const target = path.join(root, filename);
    return !fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text;
  });
  if (check && changed.length) {
    throw new Error(`生成物が原稿と一致しません: ${changed.map(([name]) => name).join(', ')}。node scripts/build-data.cjs を実行してください。`);
  }
  if (!check) {
    fs.mkdirSync(path.join(root, 'js'), { recursive: true });
    fs.mkdirSync(path.join(root, 'doc'), { recursive: true });
    for (const [filename, text] of changed) fs.writeFileSync(path.join(root, filename), text, 'utf8');
  }
  return { storyCount: stories.length, files: outputs.map(([name]) => name), changed: changed.map(([name]) => name), check };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    assert(args.every(arg => arg === '--check') && args.length <= 1, '使用法: node scripts/build-data.cjs [--check]');
    const result = build({ check: args.includes('--check') });
    process.stdout.write(result.check
      ? `20作と素材マニフェストの生成物は一致しています。\n`
      : `20作を生成しました。更新: ${result.changed.length ? result.changed.join(', ') : 'なし'}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { build, readStories, validateAssets, classicBundle };
