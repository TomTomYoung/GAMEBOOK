'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../js/engine.js');
const S=require('../js/storage.js');
const stories=require('../js/shorts.js');
const {readNewShortStories,compileShort}=require('../scripts/short-stories.cjs');
const {explore,trailFor}=require('./short-helpers.cjs');
const ROOT=path.resolve(__dirname,'..');
const compact=text=>text.replace(/\s/g,'');
const registry=[...require('../js/stories.js'),...require('../js/editions.js').map(e=>e.story),...require('../js/medium.js'),...stories];
const graphs=new Map(stories.map(s=>[s.id,explore(s)]));
const byId=n=>stories.find(s=>s.number===n);
function walk(n,ids) {
  const s=byId(n); let session=E.createSession(s);
  for(const id of ids.split(' ')) {
    const c=E.availableChoices(s,session).find(c=>c.id.split('-')[0]===id);
    assert(c,`${s.id}: ${id} unavailable`); session=E.choose(s,session,c.id);
  }
  return session;
}
test('GB21–40 compile all 333 sections and 81 endings into a direct-file classic script',()=>{
  assert.deepEqual(stories,readNewShortStories(ROOT));
  assert.equal(stories.length,20);assert.equal(stories.reduce((a,s)=>a+s.nodes.length,0),333);
  assert.equal(stories.reduce((a,s)=>a+s.nodes.filter(n=>n.ending).length,0),81);
  const browser={};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'js/shorts.js'),'utf8'),browser);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.GB_NEW_SHORT_STORIES)),stories);
});
for (const story of stories) test(`${story.id}: all states, choices, prose variants, endings and saves`,()=>{
  const g=graphs.get(story.id);
  assert.equal(g.nodeSamples.size,story.nodes.length);
  assert.equal(g.choiceSamples.size,story.nodes.reduce((a,n)=>a+n.choices.length,0));
  assert.equal(g.variantSamples.size,story.nodes.reduce((a,n)=>a+n.variants.length,0),'every prose variant reachable');
  assert.equal(g.endings.size,story.nodes.filter(n=>n.ending).length);
  for (const item of g.samples) {
    const session=E.replay(story,trailFor(item));
    assert.deepEqual(session.state,item.state);
    assert.equal(compact(E.getText(story,session)),compact(item.text));
    assert.deepEqual(E.validateSession(story,JSON.parse(JSON.stringify(session))),session);
    assert(!/\*\*|#s\d|の場合：/.test(E.getText(story,session)),`${story.id}: author instructions leaked`);
    for (const c of E.availableChoices(story,session)) {
      const next=E.choose(story,session,c.id);
      assert.deepEqual(E.validateSession(story,next),next);
    }
  }
  // Add the new collection to an existing shelf without migrating old saves.
  const shelf=S.createShelf();
  shelf.sessions.GB01=E.choose(registry[0],E.createSession(registry[0]),'01a');
  const old=JSON.stringify(shelf.sessions.GB01);shelf.endingTrails[story.id]={};
  for (const [id,item] of g.endings) shelf.endingTrails[story.id][id]=trailFor(item);
  const last=[...g.endings.values()].at(-1);
  shelf.sessions[story.id]=E.replay(story,trailFor(last));shelf.activeStoryId=story.id;
  assert.deepEqual(S.validateShelf(registry,JSON.parse(JSON.stringify(shelf))),shelf);
  assert.equal(JSON.stringify(shelf.sessions.GB01),old);
  console.log(`${story.id}: ${g.states} states, ${g.choiceSamples.size} choices, ${g.endings.size} endings`);
});
test('GB27: all 27 plays obey fixed defenders and score exactly once',()=>{
  const counts=[0,0,0,0],s=byId(27);
  for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++) {
    const letters='abc';
    const session=walk(27,`01b 03${letters[a]} ${a===1?'05':'04'}a 06${letters[b]} ${['07','08','09'][b]}a 10${letters[c]}`);
    const expected=Number(a!==1)+Number(b!==a)+Number(c!==(b+1)%3);
    assert.equal(session.state.passes,expected);counts[expected]++;
    assert.equal(E.availableChoices(s,session).length,1);
    const frozen=JSON.stringify(session);
    E.getText(s,session);E.getText(s,session);E.validateSession(s,session);
    assert.equal(JSON.stringify(session),frozen);
    const end=E.choose(s,session,E.availableChoices(s,session)[0].id);
    assert.equal(E.getNode(s,end).ending.id,expected===3?'E1':expected===2?'E2':'E3');
  }
  assert.deepEqual(counts,[1,6,12,8]);
});
test('GB30: all 16 meal/preparation combinations preserve exact resources and rescue cost',()=>{
  let count=0;
  for(const first of 'ab')for(const prep of 'abc')for(const meal of 'abc') {
    const foodAfterFirst=first==='a'?1:2;
    const available=foodAfterFirst+(prep==='a'?3:0);
    if(meal==='a'&&available<2) continue;
    count++;
    const session=walk(30,`01${first} ${first==='a'?'02':'03'}a 04${prep} ${{a:'05',b:'06',c:'07'}[prep]}a 08${meal} ${{a:'09',b:'10',c:'11'}[meal]}a`);
    const food=available-(meal==='a'?2:1),wood=prep==='b'?4:0,feed=Number(first==='a')+Number(meal!=='b');
    assert.deepEqual(session.state,{food,wood,feed,prep:{a:'食料',b:'薪',c:'橇'}[prep],dinner:meal==='c'?'抜いた':'食べた'});
    const ids=E.availableChoices(byId(30),session).map(c=>c.id.split('-')[0]);
    assert.equal(ids.includes('12a'),feed===2);assert.equal(ids.includes('12b'),prep==='c');
    const rescue=E.choose(byId(30),session,E.availableChoices(byId(30),session).find(c=>c.id.startsWith('12c')).id);
    assert.equal(rescue.state.food,Math.max(0,food-1));assert.equal(rescue.state.wood,Math.max(0,wood-1));assert.equal(rescue.state.feed,feed);
    const text=E.getText(byId(30),rescue);
    assert.equal(text.includes('一包を炉の上の湯で戻し'),food>0);
    assert.equal(text.includes('一束を使って蓄熱炉を暖め'),wood>0);
    const leave=E.choose(byId(30),session,'12d');assert.equal(leave.state.food,0);assert.equal(leave.state.feed,feed);
  }
  assert.equal(count,16);
});
test('GB34: gravity positions, reset loop and inviting Mina keep the ball singular',()=>{
  const s=byId(34);
  let session=walk(34,'01a 02b 04a 05a 06b');assert.equal(session.nodeId,'08');
  session=E.choose(s,session,'08b');assert.equal(session.nodeId,'06');assert.equal(session.state.company,'一人');
  session=E.choose(s,session,'06c');assert.equal(session.nodeId,'14');assert.equal(session.state.company,'ミナと二人');
  for(const id of ['14b','08a','09b','07a','10b'])session=E.choose(s,session,id);
  assert.equal(E.getNode(s,session).ending.id,'E4');
  const direct=walk(34,'01b 03a 04b 11a 12a');assert.equal(E.getNode(s,direct).ending.id,'E1');
});
test('arrival updates preserve earlier prose and visible combat does not require the timing flag',()=>{
  let session=walk(36,'01c 04a 05a');assert.equal(session.state.timing,false);assert(E.getText(byId(36),session).includes('礼のやり取り'));
  session=walk(36,'01b 03a 06a');assert.equal(session.state.timing,true);assert(E.getText(byId(36),session).includes('今度は足元まで追えた'));assert(!E.getText(byId(36),session).includes('見学のときと同じ'));
  session=walk(39,'01a 02b 05a 06a');assert.equal(session.state.badge,'表');assert(E.getText(byId(39),session).includes('ここで表へ返した'));assert(!E.getText(byId(39),session).includes('油の付いた端を'));
  session=walk(39,'01b 03a 05a 06a');assert(E.getText(byId(39),session).includes('油の付いた端を'));
});
test('GB29 capture text distinguishes deliberate defeat from the hat diversion',()=>{
  const deliberate=walk(29,'01a 02a 05a 08b'),hat=walk(29,'01a 02a 05a 08a 11a');
  assert(!E.getText(byId(29),deliberate).includes('アサはその帽子を見ず'));
  assert(E.getText(byId(29),hat).includes('アサはその帽子を見ず'));
});
test('changing source or an annotation fails compilation instead of dropping prose',t=>{
  const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'short-compiler-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  fs.cpSync(path.join(ROOT,'doc/drafts/gb21-40'),path.join(temp,'doc/drafts/gb21-40'),{recursive:true});
  fs.cpSync(path.join(ROOT,'data/short-adapters'),path.join(temp,'data/short-adapters'),{recursive:true});
  const filename=path.join(temp,'doc/drafts/gb21-40/gb22.md');const source=fs.readFileSync(filename,'utf8');fs.writeFileSync(filename,source.replace('旗が落ちました。','旗が静かに落ちました。'));
  assert.throws(()=>compileShort(22,temp),/原稿変更後/);fs.writeFileSync(filename,source);
  const af=path.join(temp,'data/short-adapters/gb22.json'),a=JSON.parse(fs.readFileSync(af,'utf8'));a.paragraphs[0].source+='changed';fs.writeFileSync(af,JSON.stringify(a));
  assert.throws(()=>compileShort(22,temp),/未使用の対応定義/);
});
