'use strict';

// Readable copies of the canonical JSON. Keep every passage and author note;
// conditions describe alternatives and never select one playthrough to export.
const assert = require('node:assert/strict');

const AUTHOR_LABELS = {
  kernel: '物語の核', facts: '前提となる事実', entities: '登場人物・物・場所',
  situation: '開始状況', agents: '人物の目的と行動', mechanism: '仕組み',
  institution: '制度と権限', inference: '推論と証拠', resolution: '解決と達成範囲',
  alternatives: '代替案と非介入', presentation: '情報の提示', state_notes: '状態管理の補足',
  support_links: '根拠のつながり', review_focus: '確認する点', applicability: '適用範囲'
};
const FACT_KINDS = { fixed_past: '確定した過去', initial: '初期状態', law: '法則', institution: '制度' };
const SUPPORT_TYPES = {
  cause: '原因', necessary: '必要条件', motive: '動機', permission: '権限・許可',
  confirmation: '達成の確認', evidence: '証拠', reinterpretation: '再解釈'
};
const COMPARISONS = { eq: '=', ne: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤' };

function markdown(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_[\]]/g, '\\$&');
}

function prose(value) {
  // Explicit breaks retain the line breaks in dialogue when GitHub renders it.
  return markdown(value).replace(/\n/g, '  \n');
}

function code(value) {
  // IDs and schema keywords are validated identifiers in the canonical data.
  return '`' + value + '`';
}

function stateValue(value) {
  if (typeof value === 'boolean') return value ? 'はい（true）' : 'いいえ（false）';
  return typeof value === 'string' ? `「${markdown(value)}」` : String(value);
}

function stateLabel(definitions, id) {
  const definition = definitions.get(id);
  assert(definition, `未知の状態です: ${id}`);
  return `${markdown(definition.label)}（${code(id)}）`;
}

function conditions(values, definitions) {
  if (!values.length) return 'なし';
  return values.map(condition => {
    assert(Object.hasOwn(COMPARISONS, condition.op), `未知の比較方法です: ${condition.op}`);
    return `${stateLabel(definitions, condition.var)} ${COMPARISONS[condition.op]} ${stateValue(condition.value)}`;
  }).join(' ／ ');
}

function effects(values, definitions) {
  if (!values.length) return 'なし';
  return values.map(effect => {
    const label = stateLabel(definitions, effect.var);
    if (effect.op === 'set') return `${label}を${stateValue(effect.value)}にする`;
    assert.equal(effect.op, 'add', `未知の更新方法です: ${effect.op}`);
    return `${label}を${Math.abs(effect.value)}${effect.value < 0 ? '減らす' : '増やす'}`;
  }).join(' ／ ');
}

function authorMaterial(author) {
  const parts = [];
  for (const [key, value] of Object.entries(author)) {
    parts.push(`### ${AUTHOR_LABELS[key] || markdown(key)}（${code(key)}）`);
    if (typeof value === 'string') {
      parts.push(prose(value));
    } else if (key === 'facts') {
      parts.push(value.map(fact => `- **${markdown(fact.id)}** — ${FACT_KINDS[fact.kind] || markdown(fact.kind)}（${code(fact.kind)}）  \n  ${prose(fact.text).replace(/\n/g, '\n  ')}`).join('\n\n'));
    } else if (key === 'agents') {
      parts.push(value.map(agent => `- **${markdown(agent.id)}**  \n  ${prose(agent.text).replace(/\n/g, '\n  ')}`).join('\n\n'));
    } else if (key === 'support_links') {
      parts.push(value.map(link => `- **${markdown(link.from)} → ${markdown(link.to)}** — ${SUPPORT_TYPES[link.type] || markdown(link.type)}（${code(link.type)}）  \n  ${prose(link.reason).replace(/\n/g, '\n  ')}`).join('\n\n'));
    } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      parts.push(value.map(item => `- ${prose(item).replace(/\n/g, '\n  ')}`).join('\n'));
    } else {
      // Preserve future author metadata even before a readable formatter exists.
      parts.push('```json\n' + JSON.stringify(value, null, 2) + '\n```');
    }
  }
  return parts.join('\n\n');
}

function renderStory(story, edition) {
  const filename = story.id.toLowerCase();
  const source = edition ? `data/editions/${filename}.json` : `data/stories/${filename}.json`;
  const definitions = new Map(story.state.map(definition => [definition.id, definition]));
  const nodes = new Map(story.nodes.map(node => [node.id, node]));
  const parts = [
    `<!-- Generated from ${source} by scripts/build-data.cjs. Do not edit. -->`,
    `# ${markdown(edition ? edition.baseId : story.id)} ${markdown(story.title)}${edition ? ` — 第${edition.edition}版` : ''}`,
    `[全作品の目次](README.md) · [原稿JSON](../../${source}) · [開始節へ](#node-01)`,
    `**作品番号**：${story.number}　**内容版**：${story.revision}　**ジャンル**：${markdown(story.genre)}`,
    prose(story.hook),
    '## 読み方',
    '全分岐・全結末を収録しています。選択肢の移動先リンクから次の節へ進めます。条件が複数ある場合は、すべてを満たす必要があります。条件付き本文は、その節に到着した時点の記録で条件を満たすものを、掲載順に通常の本文へ追加して読みます。',
    '行動を選ぶと記録の変化を適用してから次の節へ移動します。このMarkdown自体は記録を自動更新しません。「選択理由」「出来事・根拠」と末尾の「作者用設計資料」は、原稿に含まれる設計情報です。',
    '## 前提', prose(story.setup),
    '## ルール', story.rules.map(rule => `- ${prose(rule).replace(/\n/g, '\n  ')}`).join('\n\n'),
    '## 分岐の構造', prose(story.structure),
    '## 記録と初期値'
  ];
  if (!story.state.length) parts.push('この作品には記録する状態変数がありません。');
  for (const definition of story.state) {
    const type = { int: '整数', bool: '真偽値', enum: '選択値' }[definition.type];
    assert(type, `未知の状態の型です: ${definition.type}`);
    parts.push(`### ${stateLabel(definitions, definition.id)}`);
    parts.push(`- **種類**：${type}（${code(definition.type)}）\n- **初期値**：${stateValue(definition.initial)}`
      + (definition.type === 'int' ? `\n- **範囲**：${definition.min}〜${definition.max}` : '')
      + (definition.type === 'enum' ? `\n- **候補**：${definition.values.map(stateValue).join(' ／ ')}` : ''));
    parts.push(prose(definition.meaning));
  }
  parts.push('<a id="node-index"></a>', '## 節の目次');
  parts.push(story.nodes.map(node => `- [${markdown(node.id)} ${markdown(node.title)}](#node-${node.id})`
    + (node.ending ? ` — 結末 ${markdown(node.ending.id)}「${markdown(node.ending.name)}」` : '')).join('\n'));
  for (const node of story.nodes) {
    parts.push(`<a id="node-${node.id}"></a>`, `## ${markdown(node.id)} ${markdown(node.title)}`, prose(node.body));
    if (node.variants?.length) {
      parts.push('### 条件付き本文');
      for (const [index, variant] of node.variants.entries()) {
        parts.push(`#### 追加本文 ${index + 1}`, `**表示条件（すべて満たす）**：${conditions(variant.when, definitions)}`, prose(variant.text));
      }
    }
    if (node.ending) {
      parts.push(`### 結末 ${markdown(node.ending.id)}「${markdown(node.ending.name)}」`,
        `**到達条件（すべて満たす）**：${conditions(node.ending.requires, definitions)}`,
        `**結果**：${prose(node.ending.outcome)}`);
    } else {
      parts.push('### 選択肢');
      for (const choice of node.choices) {
        const destination = nodes.get(choice.to);
        assert(destination, `移動先がありません: ${story.id}.${choice.id} → ${choice.to}`);
        parts.push(`<a id="choice-${choice.id}"></a>`, `#### ${markdown(choice.id)} ${markdown(choice.label)}`);
        parts.push(`- **移動先**：[${markdown(destination.id)} ${markdown(destination.title)}](#node-${destination.id})\n`
          + `- **実行条件（すべて満たす）**：${conditions(choice.when, definitions)}\n`
          + `- **記録の変化**：${effects(choice.effects, definitions)}\n`
          + `- **選択理由**：${prose(choice.why).replace(/\n/g, '\n  ')}\n`
          + `- **出来事・根拠**：${prose(choice.event).replace(/\n/g, '\n  ')}`);
      }
    }
    parts.push('[節の目次へ](#node-index)');
  }
  parts.push('## 作者用設計資料', authorMaterial(story.author), '[全作品の目次へ](README.md)');
  return parts.join('\n\n') + '\n';
}

function renderIndex(stories, editions = []) {
  const counts = stories.reduce((total, story) => {
    total.nodes += story.nodes.length;
    for (const node of story.nodes) {
      total.choices += node.choices.length;
      total.variants += (node.variants || []).length;
      if (node.ending) total.endings++;
    }
    return total;
  }, { nodes: 0, choices: 0, variants: 0, endings: 0 });
  const parts = [
    '<!-- Generated from data/stories/*.json by scripts/build-data.cjs. Do not edit. -->',
    '# シナリオ全文',
    `[資料の案内](../README.md) · [リポジトリの案内](../../README.md)`,
    `全${stories.length}作、${counts.nodes}節・${counts.choices}選択肢・${counts.endings}結末を、作品ごとのMarkdownで読めます。${counts.variants}件の条件付き本文も収録しています。`,
    '前提・ルール・記録の初期値、本文、選択肢と分岐先、実行条件、記録の変化、全結末、作者用の設計資料を収録しています。本文や設計資料の要約は行っていません。各作品の「節の目次」と選択肢の移動先は、同じファイル内へのリンクです。',
    '全分岐と結末の内容を含みます。選択肢や条件付き本文は条件がすべて成立した場合に読み、状態の変化は手元で管理します。自動処理で遊ぶ場合は、リポジトリ直下の `index.html` を開いてください。',
    '## 作品一覧'
  ];
  parts.push(stories.map(story => {
    const marker = `${story.number}. `;
    const indent = ' '.repeat(marker.length);
    const versions = editions.filter(edition => edition.baseId === story.id);
    const links = versions.length ? `（初版） / ${versions.map(edition => `[第${edition.edition}版](${edition.story.id.toLowerCase()}.md)`).join(' / ')}` : '';
    return `${marker}[${markdown(story.id)} ${markdown(story.title)}](${story.id.toLowerCase()}.md)${links} — ${markdown(story.genre)}\n\n`
      + indent + prose(story.hook).replace(/\n/g, `\n${indent}`);
  }).join('\n\n'));
  parts.push('## 原稿を更新した場合',
    '正本は [data/stories/](../../data/stories/) のJSONです。このフォルダは自動生成されます。原稿を編集したら、リポジトリ直下で次を実行するとMarkdownとブラウザ用データを再生成できます。',
    '```sh\nnode scripts/build-data.cjs\n```',
    '原稿との一致を確認する場合は、次を実行します。`npm run build` / `npm run check` でも同じ処理を行います。',
    '```sh\nnode scripts/build-data.cjs --check\n```',
    '生成コマンドを実行しなくても、ここにあるMarkdownはGitHub上でそのまま読めます。');
  return parts.join('\n\n') + '\n';
}

function scenarioMarkdown(stories, editions = []) {
  return [
    ['doc/scenarios/README.md', renderIndex(stories, editions)],
    ...stories.map(story => [`doc/scenarios/${story.id.toLowerCase()}.md`, renderStory(story)]),
    ...editions.map(edition => [`doc/scenarios/${edition.story.id.toLowerCase()}.md`, renderStory(edition.story, edition)])
  ];
}

module.exports = { scenarioMarkdown };
