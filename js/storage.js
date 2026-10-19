/* Shelf schema v1. Pure validation only; the application owns storage and files. */
(function (root, factory) {
  'use strict';
  var engine = typeof module === 'object' && module.exports ? require('./engine.js') : root.GBEngine;
  var storage = factory(engine);
  if (typeof module === 'object' && module.exports) module.exports = storage;
  root.GBStorage = storage;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';

  if (!engine || typeof engine.validateSession !== 'function') throw new Error('セーブを扱う前にゲームエンジンを読み込んでください。');
  var SHELF_KEYS = ['format', 'version', 'sessions', 'endingTrails', 'bookmarks', 'preferences', 'activeStoryId'];
  var RESERVED_KEYS = ['__proto__', 'prototype', 'constructor'];
  var objectConstructorSource = Function.prototype.toString.call(Object);
  var own = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };

  function fail(message) { throw new Error(message); }

  function plainRecord(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + 'はオブジェクトで指定してください。');
    var prototype = Object.getPrototypeOf(value);
    if (prototype !== null) {
      var constructor = Object.getOwnPropertyDescriptor(prototype, 'constructor');
      // A normal Object from another browser realm is also accepted. Custom
      // prototype chains and getters are not JSON data and are rejected.
      if (!constructor || !own(constructor, 'value') || typeof constructor.value !== 'function' ||
          constructor.value.prototype !== prototype || Object.getPrototypeOf(prototype) !== null ||
          Function.prototype.toString.call(constructor.value) !== objectConstructorSource) {
        fail(label + 'の形式が不正です。');
      }
    }
    Reflect.ownKeys(value).forEach(function (key) {
      if (typeof key !== 'string' || RESERVED_KEYS.indexOf(key) >= 0) fail(label + 'に使用できない項目があります。');
      var descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor.enumerable || !own(descriptor, 'value')) fail(label + 'に使用できない項目があります。');
    });
    return value;
  }

  function exactFields(value, required, label) {
    plainRecord(value, label);
    required.forEach(function (key) { if (!own(value, key)) fail(label + 'に「' + key + '」がありません。'); });
    Object.keys(value).forEach(function (key) {
      if (required.indexOf(key) < 0) fail(label + 'に未対応の項目「' + key + '」があります。');
    });
  }

  function denseArray(value, label, max) {
    if (!Array.isArray(value)) fail(label + 'は配列で指定してください。');
    if (max !== undefined && value.length > max) fail(label + 'は' + max + '件以内にしてください。');
    if (Reflect.ownKeys(value).length !== value.length + 1) fail(label + 'に欠落または使用できない項目があります。');
    for (var i = 0; i < value.length; i += 1) {
      var descriptor = Object.getOwnPropertyDescriptor(value, String(i));
      if (!descriptor || !descriptor.enumerable || !own(descriptor, 'value')) fail(label + 'に欠落または使用できない項目があります。');
    }
    return value;
  }

  function copyJSON(value, label, seen, depth) {
    if (depth > 64) fail(label + 'の入れ子が深すぎます。');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!value || typeof value !== 'object') fail(label + 'にJSONで扱えない値があります。');
    if (seen.has(value)) fail(label + 'に循環参照があります。');
    seen.add(value);
    var output;
    if (Array.isArray(value)) {
      denseArray(value, label);
      output = [];
      for (var index = 0; index < value.length; index += 1) output.push(copyJSON(value[index], label, seen, depth + 1));
    } else {
      plainRecord(value, label);
      output = {};
      Object.keys(value).forEach(function (key) { output[key] = copyJSON(value[key], label, seen, depth + 1); });
    }
    seen.delete(value);
    return output;
  }

  function localCopy(value, label) { return copyJSON(value, label, new Set(), 0); }

  function createShelf() {
    return {
      format: 'gamebook-shelf', version: 1,
      sessions: {}, endingTrails: {}, bookmarks: {},
      preferences: { fontSize: 20, theme: 'day' }, activeStoryId: null
    };
  }

  function knownStoryKeys(mapping, stories, label) {
    plainRecord(mapping, label);
    Object.keys(mapping).forEach(function (id) {
      if (!own(stories, id)) fail(label + 'に未知の作品「' + id + '」があります。');
    });
  }

  function validateShelf(stories, input) {
    denseArray(stories, '作品一覧');
    var registry = Object.create(null);
    Array.prototype.forEach.call(stories, function (original) {
      // Copy JSON data into this realm before engine validation. No object from
      // an import or a browser VM is retained in the normalized shelf.
      var story = localCopy(original, '作品データ');
      engine.createSession(story);
      if (own(registry, story.id)) fail('作品一覧で「' + story.id + '」が重複しています。');
      registry[story.id] = story;
    });
    exactFields(input, SHELF_KEYS, '本棚のセーブ');
    if (input.format !== 'gamebook-shelf' || input.version !== 1) fail('対応していない本棚のセーブ形式です。');
    knownStoryKeys(input.sessions, registry, '作品のセーブ');
    knownStoryKeys(input.endingTrails, registry, '結末の記録');
    knownStoryKeys(input.bookmarks, registry, 'しおり');
    exactFields(input.preferences, ['fontSize', 'theme'], '表示設定');
    if ([18, 20, 22, 24].indexOf(input.preferences.fontSize) < 0) fail('文字サイズは18・20・22・24のいずれかにしてください。');
    if (input.preferences.theme !== 'day' && input.preferences.theme !== 'night') fail('表示テーマはdayまたはnightにしてください。');

    var normalized = createShelf();
    normalized.preferences = { fontSize: input.preferences.fontSize, theme: input.preferences.theme };
    Object.keys(input.sessions).forEach(function (id) {
      normalized.sessions[id] = engine.validateSession(registry[id], localCopy(input.sessions[id], '作品「' + id + '」のセーブ'));
    });

    Object.keys(input.endingTrails).forEach(function (id) {
      var endings = input.endingTrails[id];
      plainRecord(endings, '作品「' + id + '」の結末');
      var allowed = Object.create(null);
      registry[id].nodes.forEach(function (node) { if (node.ending) allowed[node.ending.id] = true; });
      var validatedEndings = {};
      Object.keys(endings).forEach(function (endingId) {
        if (!own(allowed, endingId)) fail('作品「' + id + '」に結末「' + endingId + '」はありません。');
        denseArray(endings[endingId], '結末への選択履歴', engine.MAX_TRAIL_LENGTH);
        var trail = localCopy(endings[endingId], '結末への選択履歴');
        var session = engine.replay(registry[id], trail);
        var node = engine.getNode(registry[id], session);
        if (!node.ending || node.ending.id !== endingId) fail('作品「' + id + '」の結末「' + endingId + '」と選択履歴が一致しません。');
        validatedEndings[endingId] = session.trail.slice();
      });
      normalized.endingTrails[id] = validatedEndings;
    });

    Object.keys(input.bookmarks).forEach(function (id) {
      var bookmark = input.bookmarks[id];
      if (!own(normalized.sessions, id)) fail('しおりの作品「' + id + '」にセーブがありません。');
      exactFields(bookmark, ['intro', 'page', 'nodeId', 'trailLength'], '作品「' + id + '」のしおり');
      if (typeof bookmark.intro !== 'boolean') fail('しおりの導入表示は真偽値にしてください。');
      if (!Number.isSafeInteger(bookmark.page) || bookmark.page < 0 || bookmark.page > 10000) fail('しおりのページ番号は0〜10000の整数にしてください。');
      var current = normalized.sessions[id];
      if (bookmark.nodeId !== current.nodeId) fail('作品「' + id + '」のしおりと現在の段落が一致しません。');
      if (!Number.isSafeInteger(bookmark.trailLength) || bookmark.trailLength !== current.trail.length) fail('作品「' + id + '」のしおりと選択履歴の長さが一致しません。');
      if (bookmark.intro && current.trail.length !== 0) fail('導入のしおりは選択を始める前にだけ設定できます。');
      normalized.bookmarks[id] = { intro: bookmark.intro, page: bookmark.page, nodeId: bookmark.nodeId, trailLength: bookmark.trailLength };
    });

    if (input.activeStoryId !== null) {
      if (typeof input.activeStoryId !== 'string' || !own(normalized.sessions, input.activeStoryId)) fail('開いている作品のセーブがありません。');
      normalized.activeStoryId = input.activeStoryId;
    }
    return normalized;
  }

  return Object.freeze({ createShelf: createShelf, validateShelf: validateShelf });
});
