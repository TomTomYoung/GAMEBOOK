'use strict';

// GB21–40: full Markdown prose plus reviewed, explicit runtime annotations.
// No heuristics guess Japanese conditions. Source changes require reviewing
// the adapter; stale hashes, paragraphs, instructions and choices fail closed.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const digest = text => crypto.createHash('sha256').update(text).digest('hex');
const folder = 'doc/drafts/gb21-40';

function compileShort(number, root) {
  const id = `GB${number}`, source = `${folder}/gb${number}.md`;
  const raw = fs.readFileSync(path.join(root,source),'utf8');
  const adapterFile = `data/short-adapters/gb${number}.json`;
  const adapterRaw = fs.readFileSync(path.join(root,adapterFile),'utf8');
  const adapter = JSON.parse(adapterRaw);
  assert.equal(adapter.schemaVersion,1);
  const playable = raw.split('## 導入\n')[1]?.split('## 作者用')[0].trim();
  assert(playable, `${id}: 導入と本文が必要です`);
  assert.equal(digest(playable),adapter.sourceSha256,`${id}: 原稿変更後は条件・更新の対応を再確認してください`);
  const title = new RegExp(`^# ${id} (.+)$`,'m').exec(raw)?.[1];
  assert(title, `${id}: 題名がありません`);
  const index = fs.readFileSync(path.join(root,folder,'README.md'),'utf8');
  const hook = new RegExp(`\\*\\*\\[${id} .+?\\]\\(gb${number}\\.md\\)\\*\\* — (.+)`).exec(index)?.[1];
  assert(hook, `${id}: 目次の紹介文がありません`);
  const [intro,rulesAndBody] = playable.split('## 遊び方と記録\n');
  assert(rulesAndBody,`${id}: 遊び方がありません`);
  const [rules,body] = rulesAndBody.split('## 本文\n');
  const sections = [...body.matchAll(/^<a id="s(\d{2})"><\/a>\s*\n### \1 (.+)\n([\s\S]*?)(?=^<a|$(?![\s\S]))/gm)];
  assert.equal(sections.length,(body.match(/^### \d{2} /gm)||[]).length,`${id}: 節の取りこぼし`);
  const used = new Set(), sourceNodes = {};
  const nodes = sections.map(([,nodeId,title,content]) => {
    const chunks=[], choices=[]; let ending, choiceIndex=0;
    const annotations = adapter.paragraphs.filter(p=>p.node===nodeId);
    const skipped = adapter.skip.filter(p=>p.node===nodeId);
    for (const paragraph of content.trim().split(/\n\n+/)) {
      const annotation = annotations.find(p=>p.source===paragraph);
      const skip = skipped.find(p=>p.source===paragraph);
      if (annotation) { used.add(annotation); chunks.push(...structuredClone(annotation.parts)); }
      else if (skip) used.add(skip);
      else if (paragraph.startsWith('- ')) {
        for (const line of paragraph.split('\n')) {
          const match = /^- (.+?)\s*(?:→\s*)?\[\d{2}へ\]\(#s(\d{2})\)$/.exec(line);
          assert(match,`${id}/${nodeId}: 未対応の選択肢 ${line}`);
          const choiceId = `${nodeId}${String.fromCharCode(97+choiceIndex++)}`;
          const control = adapter.choices[choiceId];
          if (control) { assert.equal(control.source,line,`${id}/${choiceId}: 選択肢の変更`); used.add(control); }
          const cases = control?.cases || [control || {when:[],effects:[]}];
          cases.forEach((c,i) => choices.push({
            id:choiceId+(control?.cases ? `-${i+1}` : ''),
            label:match[1].replace(/\s*→\s*$/,'').trim(), to:match[2], when:c.when,
            effects:[...c.effects,...(adapter.entryEffects[match[2]]||[])],
            why:'原稿に示された行動と記録に従って進みます。',
            event:`${source}#s${nodeId} → ${match[2]}`
          }));
        }
      } else {
        const m = /^\*\*結末 (E\d+)：(.+)\*\*$/.exec(paragraph);
        if (m) ending={id:m[1],name:m[2],requires:[],outcome:m[2]};
        else {
          assert(!/^(?:#|<|\*\*)|\]\(#s/.test(paragraph),`${id}/${nodeId}: 未処理の構文 ${paragraph}`);
          chunks.push({when:[],text:paragraph});
        }
      }
    }
    assert(chunks.length,`${id}/${nodeId}: 本文が必要です`);
    assert(ending ? choices.length===0 : choices.length>0,`${id}/${nodeId}: 結末と選択肢の不整合`);
    sourceNodes[nodeId]=`${source}#s${nodeId}`;
    // Keep every paragraph at its original position, including common prose
    // between two conditions and text evaluated before an arrival update.
    const node={id:nodeId,title,body:'',variants:chunks,choices};
    if (ending) node.ending=ending;
    return node;
  });
  for (const item of [...adapter.paragraphs,...adapter.skip,...Object.values(adapter.choices)]) {
    assert(used.has(item),`${id}: 未使用の対応定義 ${JSON.stringify(item)}`);
  }
  for (const target of Object.keys(adapter.entryEffects)) assert(nodes.some(n=>n.choices.some(c=>c.to===target)),`${id}: 更新先 ${target} へ到達できません`);
  const endings=nodes.filter(n=>n.ending).length;
  const cleanLinks=text=>text.replace(/\[([^\]]+)\]\(#s\d{2}\)/g,'$1');
  return {id,number,title,genre:'短編 · '+({21:'晩餐と喜劇',22:'雪橇競争',23:'家族と怪異',24:'相棒と盗み',25:'竜と菜園',26:'舞台と喜劇',27:'三手の盤上戦',28:'旅立ちと対話',29:'祭りの追走劇',30:'冬の物資と獣',31:'姉妹と手紙',32:'砂漠の競売',33:'音楽と協奏',34:'重力のパズル',35:'留守番と喜劇',36:'剣士と鎧',37:'家族と借り顔',38:'休日と街歩き',39:'祭りと制作者',40:'絵本と創作'}[number]),hook,
    structure:`全${nodes.length}節・${endings}結末。設計モデルv1.2b。`,revision:1,
    setup:intro.trim(),rules:[...cleanLinks(rules.trim()).split(/\n\n+/),'印や数値、選んだ経路はゲームが自動で記録します。本文の条件分岐も自動で選びます。ページ送り・再読・再開では記録を重複更新しません。'],
    state:adapter.state,nodes,author:{model:'1.2b',source,sourceNodes,sourceFiles:[{file:source,sha256:digest(raw)},{file:adapterFile,sha256:digest(adapterRaw)}]}};
}
function readNewShortStories(root) {
  if (!fs.existsSync(path.join(root,'doc/drafts'))) return [];
  return Array.from({length:20},(_,i)=>compileShort(i+21,root));
}
module.exports={compileShort,readNewShortStories};
