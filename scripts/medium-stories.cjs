'use strict';

// The chapter Markdown is the source. Unsupported syntax fails the build;
// prose is never summarized, and conditional passages keep their position.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const definitions = [
  {
    id: 'M01', title: '潮待ちの劇場', chapters: 12, nodes: 322, endings: 6,
    genre: '中編 · 船旅と舞台 · 全12章',
    hook: '言えなくなった最後の台詞。四人で船を動かし、九日目の祭に一本の芝居を届ける。',
    setup: 'あなたはナギ、二十八歳の舞台装置職人。四年ぶりに戻った浮き劇場〈潮待ち〉で、主演のリツ、船長のタマキ、看板描きのユノと旅に出ます。旅の九日目、灯港の水上祭で芝居を上演する仕事です。',
    rules: ['舞台、合図、ユノの持場、上演する台本を、会話や稽古を経て決めます。', '選んだ台本を本番で演じた後、これからの働き方と暮らしを選びます。六つの結末に順位はありません。'],
    state: [
      ['letter','手紙','未送',['未送','送った'],'師サキへ自分から便りを出した履歴。返事を受け取っても変わりません。'],
      ['stage','舞台','未定',['未定','張出し','透かし'],'張出しは岸へ近づく前舞台、透かしは作り手も見える枠舞台です。'],
      ['signal','合図','未定',['未定','鐘','灯'],'四人の動きを合わせる主な合図。口頭の確認も使えます。'],
      ['yuno','ユノ','未定',['未定','演者','仕掛け'],'今回の本番で本人と決めた持場です。'],
      ['script','台本','未定',['未定','原作','改作','新作'],'準備し、本番で上演する一本の稿です。'],
      ['cloth','布','乾いた',['乾いた','乾かした','青い継ぎ'],'舞台布の手入れの履歴です。'],
      ['curtain','幕','未演',['未演','通した','結び直した'],'本番の予定外の間をどうつないだか。この更新の後も芝居は続きます。']
    ]
  },
  {
    id: 'M02', title: '灰冠迷宮と星火の剣', chapters: 12, nodes: 339, endings: 4,
    genre: '中編 · ダンジョン・剣と魔法 · 全12章',
    hook: '弱り始めた町の灯。剣と有限の霊力を頼りに迷宮へ潜り、星火をどう扱うかを選ぶ。',
    setup: 'あなたはカナタ、二十七歳の剣士。城町カレドの灯を守るため、灰冠迷宮の暁炉から「星火の種」を持ち帰る仕事を引き受けました。斥候エダ、紋術師ミレイと、第一日の朝に灰門へ来ています。六日目の夜には灰獣の群れ、灰潮が迫ります。',
    rules: ['敵の動きと足場を読んで行動を選びます。序盤で剣の構えと火・風の刻印を決めます。', '強い術は霊力を1消費します。0でも剣・道具・仲間を使って進めます。霊力や傷は章が変わるだけでは回復しません。', '迷宮で得た品と先行者との関係を引き継ぎ、最深部で処置を選んで地上へ戻ります。'],
    state: [
      ['stance','構え','未定',['未定','受け','踏込み'],'序盤で選ぶ剣の動きです。'],
      ['rune','刻印','未定',['未定','火','風'],'剣へ通せる術です。'],
      ['power','霊力',3,[0,3],'強い術に使う残りの力。指定された場面だけで回復します。'],
      ['wound','傷','なし',['なし','手傷'],'探索中に受けた手傷です。'],
      ['mirror','鏡片','なし',['なし','あり','砕いた'],'探索で得る反照片の所持と使用の記録です。'],
      ['pact','盟約','未会',['未会','共闘','別行'],'先行者ヴァルクとの関係です。'],
      ['furnace','炉策','未決',['未決','継火','解放','封印','撤退'],'暁炉で選んだ処置です。']
    ]
  },
  {
    id: 'M03', title: '空渡り便の二度目の人生', chapters: 16, nodes: 304, endings: 3,
    genre: '中編 · 異世界転生と竜便 · 全16章',
    hook: '配達員だった記憶と、浮島で生まれた新しい名前。竜と郵便を運ぶあなたへ、前世の名で手紙が届く。',
    setup: '前の人生で、あなたは配達員でした。雨の夜に返せなかった妹への返事を覚えたまま、浮島の世界で赤ん坊として目を覚まします。新しい家族のもとで育ち、竜と空を渡る郵便士になる、二度目の人生です。',
    rules: ['生まれ直して育つ時間から、竜との旅、初めの配達、帰郷後の仕事までを読み進めます。', '道聴きに使う響力は0〜3。強い道聴きで1消費し、第8章の指定された宿泊時だけ3へ戻ります。0でも進めます。', '告白の記録はリタへ前世の記憶を話したかを表します。荷箱は配達品の扱いの履歴で、配達後も残ります。'],
    state: [
      ['work','仕事','未定',['未定','段取り','聞き取り'],'仕事の進め方として選んだ得意分野です。'],
      ['resonance','響力',3,[0,3],'響石に残る力。指定された一度の充填以外では戻りません。'],
      ['confession','告白','まだ',['まだ','話した'],'前世の記憶をリタへ話したか。他の人への開示とは別です。'],
      ['dragon','竜約','未定',['未定','任せる','合図'],'サザとの飛行の合わせ方です。'],
      ['chart','航路図','なし',['なし','写し'],'雨棚で古航路図の写しを受け取ったか。'],
      ['cargo','荷箱','無事',['無事','濡れた','乾かした'],'最初の配達品の扱いの履歴。配達後も保持します。'],
      ['future','進路','未定',['未定','島便','遠便','学舎'],'旅を終えた後に選ぶ仕事です。']
    ]
  }
];

function compileMedium(definition, root) {
  const folder = `doc/drafts/medium${definition.id.slice(1)}`;
  const state = definition.state.map(([id,label,initial,values,meaning]) => typeof initial === 'number'
    ? { id,label,type:'int',initial,min:values[0],max:values[1],meaning }
    : { id,label,type:'enum',initial,values,meaning });
  const fields = new Map(state.map(field => [field.label, field]));
  const sourceFiles = [];
  const sourceNodes = [];
  function read(relative) {
    const bytes = fs.readFileSync(path.join(root, relative));
    sourceFiles.push({ file: relative, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
    return bytes.toString('utf8');
  }
  function conditions(text) {
    return text.split('かつ').map(term => {
      const m = /^(.+?)が(?:「(.+?)」|(\d+)(以上)?)$/.exec(term);
      assert(m && fields.has(m[1]), `未対応の条件: ${text}`);
      const field = fields.get(m[1]), value = m[2] ?? Number(m[3]);
      assert(field.type === 'int' ? typeof value === 'number' : field.values.includes(value), `条件値: ${text}`);
      return { var: field.id, op: m[4] ? 'gte' : 'eq', value };
    });
  }
  function update(text) {
    let m = /^(.+?)を「(.+?)」(?:にする|のままにする)。$/.exec(text);
    if (m) {
      const field = fields.get(m[1]);
      assert(field?.values?.includes(m[2]), `更新値: ${text}`);
      return { var: field.id, op: 'set', value: m[2] };
    }
    m = /^(.+?)を(\d+)(減らす|にする)。$/.exec(text);
    assert(m && fields.get(m[1])?.type === 'int', `未対応の記録更新: ${text}`);
    return { var: fields.get(m[1]).id, op: m[3] === '減らす' ? 'add' : 'set', value: Number(m[2]) * (m[3] === '減らす' ? -1 : 1) };
  }
  const idFor = (chapter,section) => chapter === 1 && section === '01' ? '01' : `c${String(chapter).padStart(2,'0')}-s${section}`;
  const chapterNodes = {};
  for (let chapter = 1; chapter <= definition.chapters; chapter++) {
    const file = `${folder}/ch${String(chapter).padStart(2,'0')}.md`;
    const raw = read(file);
    const chapterTitle = /^# (.+)$/m.exec(raw)?.[1];
    assert(chapterTitle, `${file}: 章題がありません`);
    const playable = raw.split(/^## 作者.*$/m)[0];
    const sections = [...playable.matchAll(/^<a id="s(\d{2})"><\/a>\s*\n## \1 (.+)\n([\s\S]*?)(?=^<a id="s\d{2}"><\/a>|$(?![\s\S]))/gm)];
    assert(sections.length && sections.length === (playable.match(/^## \d{2} /gm)||[]).length, `${file}: 節の取りこぼし`);
    for (const [,section,title,content] of sections) {
      const id = idFor(chapter, section);
      const chunks = [], choices = [], entryEffects = [];
      let pending = [], quote = null, ending;
      const flush = () => {
        const text = pending.join('\n').trim();
        if (text) chunks.push({ when: quote || [], text, updatedBefore: entryEffects.map(e=>e.var) });
        pending = [];
      };
      const lines = content.trim().split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('> **')) {
          flush();
          const m = /^> \*\*(.+)の場合\*\*$/.exec(line);
          assert(m, `${file}/${section}: 未対応の引用条件 ${line}`);
          quote = conditions(m[1]);
        } else if (line.startsWith('>')) {
          assert(quote, `${file}/${section}: 条件のない引用`);
          pending.push(line.replace(/^> ?/, ''));
        } else {
          if (quote && (line.trim() || !lines[i+1]?.startsWith('>'))) { flush(); quote = null; }
          let m;
          if ((m = /^\*\*記録：(.+)\*\*$/.exec(line))) {
            entryEffects.push(update(m[1]));
          } else if ((m = /^\*\*結末 (E\d+)(?:：(.+)|「(.+)」)\*\*$/.exec(line))) {
            ending = { id: m[1], name: m[2] || m[3], requires: [], outcome: m[2] || m[3] };
          } else if (line.startsWith('- ') || /^\[[^\]]+\]\((?:ch\d{2}\.md)?#s\d{2}\)$/.test(line)) {
            m = /^(?:- )?(.*?)\[([^\]]+)\]\((?:ch(\d{2})\.md)?#s(\d{2})\)$/.exec(line);
            assert(m, `${file}/${section}: 未対応の選択肢 ${line}`);
            const prefix = m[1].replace(/[→\s]+$/, '');
            const conditional = /^(.+?)なら、(.*)$/.exec(prefix);
            const label = (conditional ? conditional[2] : prefix).trim();
            choices.push({ id: `${id}-${choices.length+1}`, label, when: conditional ? conditions(conditional[1]) : [], effects: [], to: idFor(m[3] ? Number(m[3]) : chapter,m[4]), why: '原稿に記載された行動または記録に従って進みます。', event: `${file}#s${section} → ${m[3] || String(chapter).padStart(2,'0')}/${m[4]}` });
          } else if (line.trim() && /^(?:#|<)|記録：|\]\(#s/.test(line)) {
            assert.fail(`${file}/${section}: 未処理の構文 ${line}`);
          } else pending.push(line);
        }
      }
      flush();
      // A routing-only section in the manuscript has its heading and links.
      if (!chunks.length) {
        assert(choices.length && choices.every(c=>c.when.length), `${file}/${section}: 本文が必要`);
        chunks.push({ when: [], text: title, updatedBefore: [] });
      }
      assert(ending ? choices.length === 0 : choices.length > 0, `${file}/${section}: 終端と選択肢が不整合`);
      assert(new Set(entryEffects.map(e=>e.var)).size === entryEffects.length, `${file}/${section}: 重複更新`);
      // Three injury scenes describe the old wound before recording the new
      // one. Preserve that time boundary instead of showing both as injured.
      const updatedHere = new Set(entryEffects.map(e=>e.var));
      for (const chunk of chunks) {
        const before = chunk.when.filter(c=>updatedHere.has(c.var) && !chunk.updatedBefore.includes(c.var));
        if (before.length) {
          chunk.when = chunk.when.filter(c=>!before.includes(c));
          chunk.whenBefore = before;
        }
        delete chunk.updatedBefore;
      }
      const firstIsCommon = chunks[0].when.length === 0 && !chunks[0].whenBefore;
      const node = { id, title, body: firstIsCommon ? chunks[0].text : '', choices };
      const variants = firstIsCommon ? chunks.slice(1) : chunks;
      if (variants.length) node.variants = variants;
      if (ending) node.ending = ending;
      chapterNodes[id] = { chapter, chapterTitle, section, source: `${file}#s${section}` };
      sourceNodes.push({ node, entryEffects });
    }
  }
  const lookup = new Map(sourceNodes.map(item => [item.node.id, item]));
  assert.equal(lookup.get('01').entryEffects.length, 0, '開始節に更新がある場合は変換規則の見直しが必要');
  for (const {node} of sourceNodes) for (const choice of node.choices) {
    const target = lookup.get(choice.to);
    assert(target, `${definition.id}/${choice.id}: 行先がありません`);
    // A draft updates records in the arrival scene. Executing the incoming
    // choice applies it once; paging, reloading and history never reapply it.
    choice.effects = target.entryEffects.map(effect => ({...effect}));
    if (!choice.label) choice.label = target.node.title + 'へ進む';
  }
  const nodes = sourceNodes.map(item=>item.node);
  if (definition.nodes) assert.equal(nodes.length, definition.nodes);
  assert.equal(nodes.filter(n=>n.ending).length, definition.endings);
  return { id:definition.id, number:20+Number(definition.id.slice(1)), title:definition.title, genre:definition.genre, hook:definition.hook,
    structure:`全${definition.chapters}章・${nodes.length}節・${definition.endings}結末。章間で七つの記録を持ち越します。`, revision:1,
    setup:definition.setup, rules:[...definition.rules,'記録は行動を選ぶと自動で更新されます。本文のページ送り・再読・中断では変わりません。途中の章・節・本文ページから再開できます。'], state,nodes,
    author:{ source:folder, model:'1.2b', sourceFiles, chapterNodes, entryEffects:Object.fromEntries(sourceNodes.filter(x=>x.entryEffects.length).map(x=>[x.node.id,x.entryEffects])) }
  };
}

function readMediumStories(root) {
  if (!fs.existsSync(path.join(root, 'doc/drafts'))) return [];
  return definitions.map(definition => compileMedium(definition, root));
}

module.exports = { definitions, compileMedium, readMediumStories };
