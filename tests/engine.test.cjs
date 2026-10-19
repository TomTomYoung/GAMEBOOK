'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../js/engine.js');

const stories = Array.from({ length: 20 }, (_, index) => JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'data', 'stories', `gb${String(index + 1).padStart(2, '0')}.json`), 'utf8'
)));
const byId = Object.fromEntries(stories.map(story => [story.id, story]));
const clone = value => JSON.parse(JSON.stringify(value));
const expected = [
  [12, 14, 4, 38, 40], [15, 22, 4, 30, 40], [11, 17, 3, 22, 28], [13, 19, 3, 20, 22],
  [12, 17, 3, 18, 20], [17, 22, 4, 37, 40], [17, 23, 5, 32, 35], [16, 21, 4, 17, 21],
  [19, 22, 5, 31, 36], [17, 22, 4, 42, 43], [15, 23, 5, 26, 32], [14, 22, 4, 30, 39],
  [13, 19, 3, 34, 44], [12, 14, 5, 55, 59], [16, 38, 4, 77, 82], [15, 22, 4, 22, 28],
  [14, 25, 5, 30, 38], [14, 19, 3, 15, 19], [14, 21, 2, 14, 21], [15, 24, 2, 116, 156]
];

function stateKey(session) { return JSON.stringify([session.nodeId, Object.entries(session.state).sort()]); }
function ids(story, session) { return engine.availableChoices(story, session).map(choice => choice.id); }
function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

// This evaluator is deliberately independent of the engine's condition switch.
const comparison = {
  eq: (left, right) => Object.is(left, right), ne: (left, right) => !Object.is(left, right),
  gt: (left, right) => left - right > 0, gte: (left, right) => left - right >= 0,
  lt: (left, right) => right - left > 0, lte: (left, right) => right - left >= 0
};
function independentlyMatches(state, conditions) { return conditions.every(item => comparison[item.op](state[item.var], item.value)); }

test('classic-script and CommonJS exports expose the agreed pure API', () => {
  assert.deepEqual(Object.keys(engine).sort(), [
    'MAX_TRAIL_LENGTH', 'availableChoices', 'choose', 'createSession', 'getNode', 'getText',
    'matches', 'replay', 'validateSession', 'versions'
  ].sort());
  assert.deepEqual(engine.versions, { model: '1.2', adapter: 1, save: 1 });
  assert.equal(engine.MAX_TRAIL_LENGTH, 1000);
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'engine.js'), 'utf8'), context);
  assert.equal(typeof context.GBEngine.choose, 'function');
  assert.equal(context.GBEngine.versions.model, '1.2');
  assert.equal(Object.isFrozen(engine), true);
});

let total = { nodes: 0, choices: 0, endings: 0, states: 0, transitions: 0 };
for (const [index, rawStory] of stories.entries()) {
  test(`${rawStory.id}: exhaust all recorded states, transitions, endings and resumable saves`, () => {
    const story = freezeDeep(rawStory);
    const initial = engine.createSession(story);
    const startKey = stateKey(initial);
    const sessions = new Map([[startKey, initial]]);
    const queue = [initial];
    const edges = new Map();
    const parents = new Map();
    const visitedNodes = new Set();
    const usedChoices = new Set();
    const reachedEndings = new Set();
    const terminalKeys = new Set();
    let transitions = 0;

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const session = freezeDeep(queue[cursor]);
      const source = stateKey(session);
      const before = JSON.stringify(session);
      const node = engine.getNode(story, session);
      visitedNodes.add(node.id);
      assert.equal(node, story.nodes.find(item => item.id === session.nodeId), 'returns the canonical node');
      const roundtrip = JSON.parse(before);
      assert.deepEqual(engine.validateSession(story, roundtrip), session);
      assert.deepEqual(engine.replay(story, session.trail), session);
      const choices = engine.availableChoices(story, session);
      assert.deepEqual(choices.map(choice => choice.id), node.choices.filter(choice => independentlyMatches(session.state, choice.when)).map(choice => choice.id));
      const expectedText = [node.body, ...(node.variants || []).filter(variant => independentlyMatches(session.state, variant.when)).map(variant => variant.text)].join('\n');
      assert.equal(engine.getText(story, session), expectedText, 'all applicable variants appear, in original order');
      assert.equal(engine.getText(story, session), expectedText, 'rereading causes no entry effect');

      for (const definition of story.state) {
        const value = session.state[definition.id];
        if (definition.type === 'int') assert.ok(Number.isSafeInteger(value) && value >= definition.min && value <= definition.max);
        if (definition.type === 'bool') assert.equal(typeof value, 'boolean');
        if (definition.type === 'enum') assert.ok(definition.values.includes(value));
      }
      if (story.id === 'GB01') {
        assert.equal(session.state.tide + 2 * Number(session.state.kayo) + Number(session.state.newmail) + 2 * Number(session.state.oldmail), 4, 'rescue effort is conserved');
        assert.equal(session.state.kayo && session.state.newmail && session.state.oldmail, false, 'five units of cargo cannot fit four units of time');
      }
      if (story.id === 'GB05') assert.ok(session.state.cloud + session.state.bottle + Number(session.state.gift) <= 6, 'water is not created');

      if (node.ending) {
        assert.equal(choices.length, 0);
        assert.ok(independentlyMatches(session.state, node.ending.requires));
        reachedEndings.add(node.ending.id);
        terminalKeys.add(source);
        assert.throws(() => engine.choose(story, session, '01a'), /結末/);
      } else {
        assert.ok(choices.length > 0, 'every reachable nonterminal state has an action');
      }
      const targets = [];
      for (const choice of choices) {
        usedChoices.add(choice.id);
        const next = engine.choose(story, session, choice.id);
        const resumedNext = engine.choose(story, roundtrip, choice.id);
        assert.deepEqual(resumedNext, next, 'saving and resuming preserves the next result');
        assert.deepEqual(engine.choose(story, session, choice.id), next, 'repeated evaluation of one immutable source never accumulates effects');
        assert.equal(next.trail.length, session.trail.length + 1);
        assert.deepEqual(next.trail.slice(0, -1), session.trail);
        assert.equal(next.trail.at(-1), choice.id);
        assert.notEqual(next.state, session.state);
        assert.notEqual(next.trail, session.trail);
        for (const definition of story.state) {
          const effect = choice.effects.find(item => item.var === definition.id);
          const value = !effect ? session.state[definition.id] : effect.op === 'set' ? effect.value : session.state[definition.id] + effect.value;
          assert.equal(next.state[definition.id], value, 'effects apply exactly once, before arrival');
        }
        transitions += 1;
        const target = stateKey(next);
        targets.push(target);
        if (!parents.has(target)) parents.set(target, []);
        parents.get(target).push(source);
        if (!sessions.has(target)) {
          sessions.set(target, next);
          queue.push(next);
        }
        assert.ok(sessions.size <= 10000, 'a bounded story cannot silently expand forever');
      }
      edges.set(source, targets);
      assert.equal(JSON.stringify(session), before, 'all engine operations leave input state untouched');
    }

    assert.deepEqual([...visitedNodes].sort(), story.nodes.map(node => node.id).sort());
    assert.deepEqual([...usedChoices].sort(), story.nodes.flatMap(node => node.choices.map(choice => choice.id)).sort());
    assert.deepEqual([...reachedEndings].sort(), story.nodes.filter(node => node.ending).map(node => node.ending.id).sort());

    const canFinish = new Set(terminalKeys);
    const pending = [...terminalKeys];
    for (let cursor = 0; cursor < pending.length; cursor += 1) {
      for (const predecessor of parents.get(pending[cursor]) || []) {
        if (!canFinish.has(predecessor)) { canFinish.add(predecessor); pending.push(predecessor); }
      }
    }
    assert.equal(canFinish.size, sessions.size, 'every reachable state can eventually reach an ending');

    const indegree = new Map([...sessions.keys()].map(key => [key, 0]));
    for (const targets of edges.values()) for (const target of targets) indegree.set(target, indegree.get(target) + 1);
    const acyclicQueue = [...indegree].filter(([, count]) => count === 0).map(([key]) => key);
    for (let cursor = 0; cursor < acyclicQueue.length; cursor += 1) {
      for (const target of edges.get(acyclicQueue[cursor])) {
        indegree.set(target, indegree.get(target) - 1);
        if (indegree.get(target) === 0) acyclicQueue.push(target);
      }
    }
    assert.equal(acyclicQueue.length, sessions.size, 'returning to a paragraph must still make recorded progress');

    const observed = [visitedNodes.size, usedChoices.size, reachedEndings.size, sessions.size, transitions];
    assert.deepEqual(observed, expected[index], 'matches the independently checked canonical graph');
    for (const [position, key] of ['nodes', 'choices', 'endings', 'states', 'transitions'].entries()) total[key] += observed[position];
  });
}

test('all twenty canonical runtime graphs retain the published totals', () => {
  assert.deepEqual(total, { nodes: 291, choices: 426, endings: 76, states: 706, transitions: 843 });
});

test('GB05: waiting beyond the bell uses no water; pouring and final receipt are separate actions', () => {
  const story = byId.GB05;
  const waited = engine.replay(story, ['01a', '02d']);
  assert.deepEqual(waited.state, { cloud: 6, bottle: 0, gift: false });
  assert.deepEqual(ids(story, waited), ['06c']);
  const poured = engine.choose(story, waited, '06c');
  assert.equal(poured.nodeId, '08');
  assert.deepEqual(poured.state, { cloud: 0, bottle: 0, gift: false });
  assert.equal(engine.getNode(story, poured).ending, undefined);
  const receipt = engine.choose(story, poured, '08a');
  assert.equal(engine.getNode(story, receipt).ending.id, 'E1');
  assert.throws(() => engine.choose(story, poured, '06c'), /現在の段落/);
});

test('GB15: a rewind cancels rescue results and elapsed time, retaining only learned information and one-use history', () => {
  const story = byId.GB15;
  const firstLife = engine.replay(story, ['01a', '021a', '03a']);
  assert.deepEqual(firstLife.state, { used: false, memory: '工匠', elapsed: 2, saved: '工匠' });
  const rewound = engine.choose(story, firstLife, '09a');
  assert.equal(rewound.nodeId, '01');
  assert.deepEqual(rewound.state, { used: true, memory: '工匠', elapsed: 0, saved: 'なし' });
  assert.deepEqual(ids(story, rewound), ['01b']);
  const secondChoice = engine.replay(story, [...rewound.trail, '01b', '021c', '06a']);
  assert.equal(secondChoice.state.elapsed, 1);
  assert.equal(secondChoice.state.saved, '工匠');
  assert.throws(() => engine.choose(story, secondChoice, '09a'), /実行条件/);
  const fastFirst = engine.replay(story, [...secondChoice.trail, '09b', '022d1', '04a', '09d1']);
  assert.equal(engine.getNode(story, fastFirst).ending.id, 'E2');
  assert.deepEqual(fastFirst.state, { used: true, memory: '工匠', elapsed: 3, saved: '工匠・砲班' });
  const fastSecond = engine.replay(story, [...rewound.trail, '01b', '022b', '04a', '09b2', '021e2', '06a', '09d1']);
  assert.deepEqual(fastSecond.state, fastFirst.state, 'the remembered shortcut can also be used on the second trip');
  assert.equal(firstLife.state.used, false, 'the saved previous transcript is immutable');
});

test('GB17: the rolled-manuscript exit preserves remaining pressure and has a distinct reachable ending', () => {
  const story = byId.GB17;
  const ending = engine.replay(story, ['01b', '03a', '04a', '05a', '06b', '09d']);
  assert.equal(ending.state.reserve, 2);
  assert.equal(engine.getNode(story, ending).ending.id, 'E5');
  assert.match(engine.getText(story, ending), /原稿|紙/);
  const spent = engine.replay(story, ['01b', '03a', '04a', '05b', '03a', '04a']);
  assert.equal(spent.state.reserve, 0);
  assert.deepEqual(ids(story, spent), ['05c']);
  assert.throws(() => engine.choose(story, spent, '05a'), /実行条件/);
  const waitEnding = engine.choose(story, spent, '05c');
  assert.equal(engine.getNode(story, waitEnding).ending.id, 'E4');
});

test('GB20: returned anchors remain closed while late consent can transfer the remaining connection', () => {
  const story = byId.GB20;
  const afterCloud = engine.replay(story, ['01b', '03a', '04a', '07a']);
  assert.equal(afterCloud.state.cloud, '返納');
  assert.throws(() => engine.choose(story, afterCloud, '03a'), /実行条件/);
  assert.throws(() => engine.choose(story, afterCloud, '03d'), /実行条件/);
  const beforeConsent = engine.replay(story, [...afterCloud.trail, '03b', '05b', '10a', '03d']);
  assert.deepEqual(beforeConsent.state, { cloud: '返納', garden: '店内', nao: '未相談' });
  assert.deepEqual(ids(story, beforeConsent), ['11a', '11e']);
  const succession = engine.replay(story, [...beforeConsent.trail, '11e', '06a', '03d', '11c', '12a']);
  assert.equal(engine.getNode(story, succession).ending.id, 'E1');
  assert.deepEqual(succession.state, { cloud: '返納', garden: '店内', nao: '受諾' });
  const closure = engine.replay(story, [...beforeConsent.trail, '11a', '13a']);
  assert.equal(engine.getNode(story, closure).ending.id, 'E2');
  assert.deepEqual(closure.state, { cloud: '返納', garden: '返納', nao: '未相談' });
});

test('GB19: stories with no explicit state still validate and replay their node history', () => {
  const initial = engine.createSession(byId.GB19);
  assert.deepEqual(initial.state, {});
  assert.deepEqual(engine.validateSession(byId.GB19, clone(initial)), initial);
  const changed = clone(initial);
  changed.state.knowledge = true;
  assert.throws(() => engine.validateSession(byId.GB19, changed), /未対応の項目/);
});

test('multiple simultaneous text variants are all shown; read calls never add history', () => {
  const story = byId.GB01;
  let current = engine.createSession(story);
  const queue = [current];
  const visited = new Set();
  let found;
  for (let i = 0; i < queue.length; i += 1) {
    current = queue[i];
    if (visited.has(stateKey(current))) continue;
    visited.add(stateKey(current));
    const node = engine.getNode(story, current);
    const matching = (node.variants || []).filter(variant => independentlyMatches(current.state, variant.when));
    if (matching.length >= 2) { found = { current, node, matching }; break; }
    for (const choice of engine.availableChoices(story, current)) queue.push(engine.choose(story, current, choice.id));
  }
  assert.ok(found, 'a real canonical state exercises more than one applicable variant');
  const before = clone(found.current);
  assert.equal(engine.getText(story, found.current), [found.node.body, ...found.matching.map(variant => variant.text)].join('\n'));
  assert.deepEqual(found.current, before);
});

test('strict save replay rejects structurally valid but impossible state, node, and trail combinations', () => {
  const story = byId.GB05;
  const initial = engine.createSession(story);
  const valid = engine.replay(story, ['01a', '02d']);
  const normalized = engine.validateSession(story, clone(valid));
  assert.deepEqual(normalized, valid);
  assert.notEqual(normalized, valid);
  assert.notEqual(normalized.state, valid.state);
  assert.notEqual(normalized.trail, valid.trail);
  const edits = [
    [value => { value.format = 'session'; }, /セーブ形式/],
    [value => { value.version = 2; }, /セーブ形式/],
    [value => { value.modelVersion = '1.1'; }, /モデル版/],
    [value => { value.adapterVersion = 2; }, /アダプター版/],
    [value => { value.contentRevision = 1; }, /改訂番号/],
    [value => { value.storyId = 'GB01'; }, /別の作品/],
    [value => { value.nodeId = '99'; }, /段落が作品にありません/],
    [value => { value.nodeId = '06'; }, /段落と選択履歴/],
    [value => { value.state.cloud = 5; }, /記録.*選択履歴/],
    [value => { value.state.cloud = -1; }, /許可範囲/],
    [value => { value.state.cloud = 7; }, /許可範囲/],
    [value => { value.state.cloud = 5.5; }, /整数/],
    [value => { value.state.cloud = Infinity; }, /整数/],
    [value => { value.state.cloud = '6'; }, /整数/],
    [value => { value.state.gift = 0; }, /真偽値/],
    [value => { value.state.unknown = true; }, /未対応の項目/],
    [value => { delete value.state.cloud; }, /ありません/],
    [value => { value.extra = 1; }, /未対応の項目/],
    [value => { delete value.trail; }, /ありません/],
    [value => { value.trail = '01a'; }, /配列/],
    [value => { value.trail = ['unknown']; }, /現在の段落/],
    [value => { value.trail = ['02d']; }, /現在の段落/],
    [value => { value.trail = [null]; }, /識別子/],
    [value => { value.trail = Array(1001).fill('01a'); }, /1000件/],
    [value => { value.trail = Array(1); }, /欠落/]
  ];
  for (const [edit, error] of edits) {
    const input = clone(initial);
    edit(input);
    assert.throws(() => engine.validateSession(story, input), error);
  }
  const tampered = clone(valid);
  tampered.state.cloud = 5;
  for (const method of ['getNode', 'availableChoices', 'getText']) assert.throws(() => engine[method](story, tampered), /選択履歴/);
  assert.throws(() => engine.choose(story, tampered, '06b'), /選択履歴/);
  const polluted = JSON.parse(JSON.stringify(initial).replace('"state":{', '"state":{"__proto__":{"polluted":true},'));
  assert.throws(() => engine.validateSession(story, polluted), /未対応の項目/);
  assert.equal({}.polluted, undefined);
  const invalidEnum = engine.createSession(byId.GB20);
  invalidEnum.state.cloud = '復活';
  assert.throws(() => engine.validateSession(byId.GB20, invalidEnum), /選択値/);
});

test('conditions use strict scalar types and reject unknown operators or inherited fields', () => {
  const state = { count: 2, flag: false, result: '未定' };
  assert.equal(engine.matches(state, []), true);
  assert.equal(engine.matches(state, [{ var: 'count', op: 'eq', value: 2 }, { var: 'flag', op: 'eq', value: false }]), true);
  assert.equal(engine.matches(state, [{ var: 'count', op: 'gt', value: 1 }, { var: 'count', op: 'lte', value: 2 }]), true);
  assert.equal(engine.matches(state, [{ var: 'count', op: 'gte', value: 2 }, { var: 'count', op: 'lt', value: 3 }]), true);
  assert.equal(engine.matches(state, [{ var: 'result', op: 'ne', value: '完了' }]), true);
  assert.equal(engine.matches(state, [{ var: 'count', op: 'eq', value: 3 }]), false);
  assert.throws(() => engine.matches(state, [{ var: 'flag', op: 'eq', value: 0 }]), /型が一致/);
  assert.throws(() => engine.matches(state, [{ var: 'result', op: 'gt', value: '完了' }]), /大小比較/);
  assert.throws(() => engine.matches(state, [{ var: 'count', op: 'eval', value: 2 }]), /未対応/);
  assert.throws(() => engine.matches(state, [{ var: 'missing', op: 'eq', value: 2 }]), /未知の記録/);
  assert.throws(() => engine.matches(Object.create(state), []), /形式が不正/);
  assert.throws(() => engine.matches(state, [{ var: 'constructor', op: 'eq', value: 'x' }]), /識別子/);
  assert.throws(() => engine.matches(state, [{ var: 'count', op: 'eq', value: NaN }]), /値/);
});

test('malformed runtime data fails before play instead of silently changing story semantics', () => {
  const edits = [
    [story => { story.nodes.push(clone(story.nodes[0])); }, /段落.*重複/],
    [story => { story.state.push(clone(story.state[0])); }, /記録.*重複/],
    [story => { story.nodes[0].choices[0].id = story.nodes[1].choices[0].id; }, /選択肢.*重複/],
    [story => { story.nodes[0].choices[0].to = 'unknown'; }, /移動先/],
    [story => { story.nodes[0].choices[0].when = [{ var: 'missing', op: 'eq', value: true }]; }, /未知の記録/],
    [story => { story.nodes[0].choices[0].when = [{ var: 'cloud', op: 'truthy', value: 1 }]; }, /比較方法/],
    [story => { story.nodes[0].choices[0].when = [{ var: 'cloud', op: 'eq', value: '6' }]; }, /整数/],
    [story => { story.nodes[0].choices[0].when = [{ var: 'gift', op: 'gt', value: true }]; }, /大小比較/],
    [story => { story.nodes[0].choices[0].effects = [{ var: 'gift', op: 'add', value: 1 }]; }, /整数の記録/],
    [story => { story.nodes[0].choices[0].effects = [{ var: 'cloud', op: 'multiply', value: 2 }]; }, /更新方法/],
    [story => { story.nodes[0].choices[0].effects = [{ var: 'missing', op: 'set', value: 1 }]; }, /更新先/],
    [story => { story.nodes[0].choices[0].effects = [{ var: 'cloud', op: 'set', value: -1 }]; }, /許可範囲/],
    [story => { story.nodes[0].choices[0].effects = [{ var: 'cloud', op: 'add', value: 0.5 }]; }, /整数/],
    [story => { story.nodes[0].choices[0].effects = [{ var: 'cloud', op: 'add', value: -1 }, { var: 'cloud', op: 'add', value: -1 }]; }, /重複して更新/],
    [story => { story.state[0].initial = 7; }, /許可範囲/],
    [story => { story.state[0].type = 'float'; }, /型が未対応/],
    [story => { story.state[0].min = 7; }, /最小値/],
    [story => { story.state[0].id = '__proto__'; }, /識別子/],
    [story => { story.nodes[0].body = ''; }, /空でない/],
    [story => { story.nodes[0].choices = []; }, /選択肢または結末/],
    [story => { story.nodes.at(-1).choices = [clone(story.nodes[0].choices[0])]; }, /結末の段落/],
    [story => { story.nodes[0].variants = [{ when: [], text: '' }]; }, /空でない/],
    [story => { story.nodes = story.nodes.filter(node => node.id !== '01'); }, /開始段落/]
  ];
  for (const [edit, error] of edits) {
    const story = clone(byId.GB05);
    edit(story);
    assert.throws(() => engine.createSession(story), error);
  }
});

test('runtime overflow and invalid arrival fail atomically without mutating input', () => {
  const story = clone(byId.GB05);
  story.nodes[0].choices[0].effects = [{ var: 'bottle', op: 'set', value: 1 }, { var: 'cloud', op: 'add', value: 1 }];
  const session = freezeDeep(engine.createSession(story));
  const snapshot = JSON.stringify(session);
  assert.throws(() => engine.choose(story, session, '01a'), /許可範囲/);
  assert.equal(JSON.stringify(session), snapshot);
  const invalidEnding = clone(byId.GB05);
  invalidEnding.nodes[0].choices[0].to = '10';
  const initial = engine.createSession(invalidEnding);
  assert.throws(() => engine.choose(invalidEnding, initial, '01a'), /到達条件/);
  assert.equal(initial.nodeId, '01');
  const deadlock = clone(byId.GB05);
  deadlock.nodes[0].choices[0].to = '09';
  deadlock.nodes.find(node => node.id === '09').choices.forEach(choice => { choice.when = [{ var: 'gift', op: 'eq', value: true }]; });
  assert.throws(() => engine.choose(deadlock, engine.createSession(deadlock), '01a'), /実行できる選択肢/);
});
