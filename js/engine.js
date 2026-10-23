/* GAMEBOOK runtime adapter v1. No DOM, storage, network, or reading effects. */
(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  root.GBEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MODEL_VERSION = '1.2';
  var ADAPTER_VERSION = 1;
  var SAVE_VERSION = 1;
  var MAX_TRAIL_LENGTH = 1000;
  var SESSION_KEYS = ['format', 'version', 'modelVersion', 'adapterVersion', 'storyId', 'contentRevision', 'nodeId', 'state', 'trail'];
  var COMPARE_OPS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'];
  var UNSAFE_IDS = ['__proto__', 'prototype', 'constructor'];
  var own = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };

  function fail(message) { throw new Error(message); }

  function record(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + 'はオブジェクトで指定してください。');
    var prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) fail(label + 'の形式が不正です。');
    Reflect.ownKeys(value).forEach(function (key) {
      var descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || !descriptor.enumerable || !own(descriptor, 'value')) fail(label + 'に使用できない項目があります。');
    });
    return value;
  }

  function fields(value, required, optional, label) {
    record(value, label);
    required.forEach(function (key) { if (!own(value, key)) fail(label + 'に「' + key + '」がありません。'); });
    Object.keys(value).forEach(function (key) {
      if (required.indexOf(key) < 0 && optional.indexOf(key) < 0) fail(label + 'に未対応の項目「' + key + '」があります。');
    });
  }

  function array(value, label, max) {
    if (!Array.isArray(value)) fail(label + 'は配列で指定してください。');
    if (max !== undefined && value.length > max) fail(label + 'は' + max + '件以内にしてください。');
    if (Object.keys(value).length !== value.length) fail(label + 'に欠落または使用できない項目があります。');
    for (var i = 0; i < value.length; i += 1) {
      if (!own(value, i)) fail(label + 'に欠落があります。');
    }
    return value;
  }

  function text(value, label) {
    if (typeof value !== 'string' || !value.trim()) fail(label + 'は空でない文字列にしてください。');
    return value;
  }

  function identifier(value, label) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_][A-Za-z0-9_-]{0,63}$/.test(value) || UNSAFE_IDS.indexOf(value) >= 0) fail(label + 'の識別子が不正です。');
    return value;
  }

  function integer(value, label) {
    if (!Number.isSafeInteger(value)) fail(label + 'は安全な範囲の整数にしてください。');
    return value;
  }

  function scalar(value, label) {
    if (typeof value === 'boolean' || typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
    fail(label + 'の値は真偽値・文字列・整数のいずれかにしてください。');
  }

  function typedValue(definition, value, label, bounded) {
    if (definition.type === 'bool') {
      if (typeof value !== 'boolean') fail(label + 'は真偽値にしてください。');
    } else if (definition.type === 'int') {
      integer(value, label);
      if (bounded && (value < definition.min || value > definition.max)) fail(label + 'が許可範囲（' + definition.min + '〜' + definition.max + '）を超えています。');
    } else if (typeof value !== 'string' || definition.values.indexOf(value) < 0) {
      fail(label + 'が選択値に含まれていません。');
    }
  }

  function predicates(conditions, definitions, label) {
    array(conditions, label);
    conditions.forEach(function (condition) {
      fields(condition, ['var', 'op', 'value'], [], label);
      identifier(condition.var, label + 'の記録');
      if (!own(definitions, condition.var)) fail(label + 'が未知の記録「' + condition.var + '」を参照しています。');
      if (COMPARE_OPS.indexOf(condition.op) < 0) fail(label + 'の比較方法が未対応です。');
      var definition = definitions[condition.var];
      if (condition.op !== 'eq' && condition.op !== 'ne' && definition.type !== 'int') fail(label + 'の大小比較には整数の記録が必要です。');
      typedValue(definition, condition.value, label + 'の比較値', false);
    });
  }

  function testConditions(state, conditions) {
    return conditions.every(function (condition) {
      var current = state[condition.var];
      switch (condition.op) {
        case 'eq': return current === condition.value;
        case 'ne': return current !== condition.value;
        case 'gt': return current > condition.value;
        case 'gte': return current >= condition.value;
        case 'lt': return current < condition.value;
        case 'lte': return current <= condition.value;
        default: return false; // The schema check rejects unknown operators first.
      }
    });
  }

  function matches(state, conditions) {
    record(state, '記録');
    var definitions = Object.create(null);
    Object.keys(state).forEach(function (id) {
      identifier(id, '記録');
      scalar(state[id], '記録「' + id + '」');
      definitions[id] = typeof state[id] === 'boolean' ? { type: 'bool' } :
        typeof state[id] === 'number' ? { type: 'int' } : { type: 'enum', values: null };
    });
    // Standalone comparison has no enum registry. Check scalar types directly.
    array(conditions, '条件');
    conditions.forEach(function (condition) {
      fields(condition, ['var', 'op', 'value'], [], '条件');
      identifier(condition.var, '条件の記録');
      if (!own(definitions, condition.var)) fail('条件が未知の記録「' + condition.var + '」を参照しています。');
      if (COMPARE_OPS.indexOf(condition.op) < 0) fail('条件の比較方法が未対応です。');
      scalar(condition.value, '条件の比較値');
      if (typeof state[condition.var] !== typeof condition.value) fail('条件と記録「' + condition.var + '」の型が一致しません。');
      if (condition.op !== 'eq' && condition.op !== 'ne' && typeof state[condition.var] !== 'number') fail('条件の大小比較には整数の記録が必要です。');
    });
    return testConditions(state, conditions);
  }

  function compileStory(story) {
    fields(story, ['id', 'number', 'title', 'genre', 'hook', 'structure', 'revision', 'setup', 'rules', 'state', 'nodes', 'author'], [], '作品');
    identifier(story.id, '作品');
    integer(story.number, '作品番号');
    integer(story.revision, '作品の改訂番号');
    if (story.number < 1 || story.revision < 1) fail('作品番号と改訂番号は1以上にしてください。');
    ['title', 'genre', 'hook', 'structure', 'setup'].forEach(function (key) { text(story[key], '作品の' + key); });
    array(story.rules, '作品の遊び方').forEach(function (rule) { text(rule, '遊び方'); });
    record(story.author, '設計資料');

    var definitions = Object.create(null);
    array(story.state, '記録の定義').forEach(function (definition) {
      fields(definition, ['id', 'label', 'type', 'initial', 'meaning'], ['min', 'max', 'values'], '記録の定義');
      identifier(definition.id, '記録');
      if (own(definitions, definition.id)) fail('記録「' + definition.id + '」が重複しています。');
      text(definition.label, '記録の表示名');
      text(definition.meaning, '記録の意味');
      if (definition.type === 'int') {
        if (!own(definition, 'min') || !own(definition, 'max') || own(definition, 'values')) fail('整数の記録には最小値と最大値を指定してください。');
        integer(definition.min, '記録の最小値');
        integer(definition.max, '記録の最大値');
        if (definition.min > definition.max) fail('記録の最小値が最大値を超えています。');
      } else if (definition.type === 'enum') {
        if (!own(definition, 'values') || own(definition, 'min') || own(definition, 'max')) fail('選択値の記録には候補の配列を指定してください。');
        array(definition.values, '記録の選択値');
        if (!definition.values.length) fail('記録の選択値が空です。');
        var enumValues = new Set();
        definition.values.forEach(function (value) {
          text(value, '記録の選択値');
          if (enumValues.has(value)) fail('記録の選択値が重複しています。');
          enumValues.add(value);
        });
      } else if (definition.type === 'bool') {
        if (own(definition, 'min') || own(definition, 'max') || own(definition, 'values')) fail('真偽値の記録に数値範囲や選択値は指定できません。');
      } else {
        fail('記録「' + definition.id + '」の型が未対応です。');
      }
      typedValue(definition, definition.initial, '記録「' + definition.id + '」の初期値', true);
      definitions[definition.id] = definition;
    });

    var nodes = Object.create(null);
    var choiceIds = new Set();
    var endingIds = new Set();
    array(story.nodes, '段落');
    story.nodes.forEach(function (node) {
      fields(node, ['id', 'title', 'body', 'choices'], ['variants', 'ending'], '段落');
      identifier(node.id, '段落');
      if (own(nodes, node.id)) fail('段落「' + node.id + '」が重複しています。');
      text(node.title, '段落名');
      if (typeof node.body !== 'string') fail('段落本文は文字列で指定してください。');
      if (!node.body.trim() && !(Array.isArray(node.variants) && node.variants.length)) fail('段落本文は空でない文字列にしてください。');
      array(node.choices, '選択肢');
      if (own(node, 'variants')) {
        array(node.variants, '条件付き本文').forEach(function (variant) {
          fields(variant, ['when', 'text'], ['whenBefore'], '条件付き本文');
          text(variant.text, '条件付き本文');
          predicates(variant.when, definitions, '本文の条件');
          if (own(variant, 'whenBefore')) predicates(variant.whenBefore, definitions, '到着前の本文条件');
        });
      }
      if (own(node, 'ending')) {
        fields(node.ending, ['id', 'name', 'requires', 'outcome'], [], '結末');
        identifier(node.ending.id, '結末');
        text(node.ending.name, '結末名');
        text(node.ending.outcome, '結末の結果');
        if (endingIds.has(node.ending.id)) fail('結末「' + node.ending.id + '」が重複しています。');
        endingIds.add(node.ending.id);
        if (node.choices.length) fail('結末の段落に選択肢は置けません。');
        predicates(node.ending.requires, definitions, '結末の条件');
      } else if (!node.choices.length) {
        fail('段落「' + node.id + '」に選択肢または結末が必要です。');
      }
      node.choices.forEach(function (choice) {
        fields(choice, ['id', 'label', 'when', 'effects', 'to', 'why', 'event'], [], '選択肢');
        identifier(choice.id, '選択肢');
        identifier(choice.to, '移動先の段落');
        if (choiceIds.has(choice.id)) fail('選択肢「' + choice.id + '」が重複しています。');
        choiceIds.add(choice.id);
        ['label', 'why', 'event'].forEach(function (key) { text(choice[key], '選択肢の' + key); });
        predicates(choice.when, definitions, '選択肢「' + choice.id + '」の条件');
        var updated = new Set();
        array(choice.effects, '選択肢の更新').forEach(function (effect) {
          fields(effect, ['var', 'op', 'value'], [], '記録の更新');
          identifier(effect.var, '更新する記録');
          if (!own(definitions, effect.var)) fail('更新先の記録「' + effect.var + '」がありません。');
          if (updated.has(effect.var)) fail('一つの選択肢で記録「' + effect.var + '」を重複して更新できません。');
          updated.add(effect.var);
          if (effect.op === 'set') {
            typedValue(definitions[effect.var], effect.value, '更新値', true);
          } else if (effect.op === 'add') {
            if (definitions[effect.var].type !== 'int') fail('加減算には整数の記録が必要です。');
            integer(effect.value, '加減算の値');
          } else {
            fail('記録の更新方法が未対応です。');
          }
        });
      });
      nodes[node.id] = node;
    });
    if (!own(nodes, '01')) fail('開始段落「01」がありません。');
    story.nodes.forEach(function (node) {
      node.choices.forEach(function (choice) {
        if (!own(nodes, choice.to)) fail('選択肢「' + choice.id + '」の移動先がありません。');
      });
    });
    return { story: story, definitions: definitions, nodes: nodes };
  }

  function checkState(compiled, state) {
    fields(state, Object.keys(compiled.definitions), [], 'セーブの記録');
    Object.keys(compiled.definitions).forEach(function (id) {
      typedValue(compiled.definitions[id], state[id], '記録「' + id + '」', true);
    });
  }

  function variantMatches(variant, state, before) {
    return testConditions(state, variant.when) && testConditions(before || state, variant.whenBefore || []);
  }

  function checkArrival(compiled, session, before) {
    var node = compiled.nodes[session.nodeId];
    if (!node) fail('現在の段落が作品にありません。');
    if (!node.body.trim() && !(node.variants || []).some(function (variant) { return variantMatches(variant, session.state, before); })) {
      fail('段落「' + node.id + '」に表示できる本文がありません。');
    }
    if (node.ending) {
      if (!testConditions(session.state, node.ending.requires)) fail('結末「' + node.ending.id + '」の到達条件が成立していません。');
    } else if (!node.choices.some(function (choice) { return testConditions(session.state, choice.when); })) {
      fail('段落「' + node.id + '」に実行できる選択肢がありません。');
    }
  }

  function initialSession(compiled) {
    var state = {};
    Object.keys(compiled.definitions).forEach(function (id) { state[id] = compiled.definitions[id].initial; });
    var session = {
      format: 'gamebook-session', version: SAVE_VERSION, modelVersion: MODEL_VERSION,
      adapterVersion: ADAPTER_VERSION, storyId: compiled.story.id,
      contentRevision: compiled.story.revision, nodeId: '01', state: state, trail: []
    };
    checkArrival(compiled, session);
    return session;
  }

  function advance(compiled, session, choiceId) {
    identifier(choiceId, '選択肢');
    if (session.trail.length >= MAX_TRAIL_LENGTH) fail('選択履歴が上限の' + MAX_TRAIL_LENGTH + '件に達しました。');
    var node = compiled.nodes[session.nodeId];
    if (node.ending) fail('この物語は結末に到達しています。新しいプレイを始めてください。');
    var choice = node.choices.find(function (item) { return item.id === choiceId; });
    if (!choice) fail('選択肢「' + choiceId + '」は現在の段落にありません。');
    if (!testConditions(session.state, choice.when)) fail('選択肢「' + choiceId + '」の実行条件を満たしていません。');
    var nextState = Object.assign({}, session.state);
    choice.effects.forEach(function (effect) {
      nextState[effect.var] = effect.op === 'set' ? effect.value : nextState[effect.var] + effect.value;
    });
    checkState(compiled, nextState); // Reject over/underflow; never clamp or partly commit.
    var next = {
      format: session.format, version: session.version, modelVersion: session.modelVersion,
      adapterVersion: session.adapterVersion, storyId: session.storyId,
      contentRevision: session.contentRevision, nodeId: choice.to,
      state: nextState, trail: session.trail.concat(choiceId)
    };
    checkArrival(compiled, next, session.state);
    return next;
  }

  function checkTrail(trail) {
    array(trail, '選択履歴', MAX_TRAIL_LENGTH);
    trail.forEach(function (choiceId) { identifier(choiceId, '選択履歴'); });
  }

  function replayCompiled(compiled, trail) {
    checkTrail(trail);
    return trail.reduce(function (session, choiceId) { return advance(compiled, session, choiceId); }, initialSession(compiled));
  }

  function validateCompiled(compiled, input) {
    fields(input, SESSION_KEYS, [], 'セーブ');
    if (input.format !== 'gamebook-session' || input.version !== SAVE_VERSION) fail('対応していないセーブ形式です。');
    if (input.modelVersion !== MODEL_VERSION) fail('セーブのモデル版が一致しません。');
    if (input.adapterVersion !== ADAPTER_VERSION) fail('セーブの実行アダプター版が一致しません。');
    if (input.storyId !== compiled.story.id) fail('セーブが別の作品のものです。');
    if (input.contentRevision !== compiled.story.revision) fail('セーブの作品改訂番号が一致しません。');
    identifier(input.nodeId, '現在の段落');
    if (!own(compiled.nodes, input.nodeId)) fail('セーブの段落が作品にありません。');
    checkState(compiled, input.state);
    var replayed = replayCompiled(compiled, input.trail);
    if (input.nodeId !== replayed.nodeId) fail('セーブの段落と選択履歴が一致しません。');
    Object.keys(compiled.definitions).forEach(function (id) {
      if (input.state[id] !== replayed.state[id]) fail('セーブの記録「' + id + '」と選択履歴が一致しません。');
    });
    return replayed;
  }

  function createSession(story) { return initialSession(compileStory(story)); }

  function validateSession(story, input) { return validateCompiled(compileStory(story), input); }

  function replay(story, trail) { return replayCompiled(compileStory(story), trail); }

  function getNode(story, session) {
    var compiled = compileStory(story);
    var normalized = validateCompiled(compiled, session);
    return compiled.nodes[normalized.nodeId];
  }

  function availableChoices(story, session) {
    var compiled = compileStory(story);
    var normalized = validateCompiled(compiled, session);
    return compiled.nodes[normalized.nodeId].choices.filter(function (choice) { return testConditions(normalized.state, choice.when); });
  }

  function getText(story, session) {
    var compiled = compileStory(story);
    var normalized = validateCompiled(compiled, session);
    var node = compiled.nodes[normalized.nodeId];
    var parts = [node.body];
    var before = (node.variants || []).some(function (variant) { return own(variant, 'whenBefore'); }) && normalized.trail.length
      ? replayCompiled(compiled, normalized.trail.slice(0, -1)).state : normalized.state;
    (node.variants || []).forEach(function (variant) {
      if (variantMatches(variant, normalized.state, before)) parts.push(variant.text);
    });
    return parts.join('\n');
  }

  function choose(story, session, choiceId) {
    var compiled = compileStory(story);
    return advance(compiled, validateCompiled(compiled, session), choiceId);
  }

  return Object.freeze({
    versions: Object.freeze({ model: MODEL_VERSION, adapter: ADAPTER_VERSION, save: SAVE_VERSION }),
    MAX_TRAIL_LENGTH: MAX_TRAIL_LENGTH,
    createSession: createSession, getNode: getNode, availableChoices: availableChoices,
    matches: matches, getText: getText, choose: choose,
    validateSession: validateSession, replay: replay
  });
});
