#!/usr/bin/env node
'use strict';

// Optional integration suite. The player and unit tests have no dependencies.
// Install Playwright separately, then run:
//   PLAYWRIGHT_MODULE=playwright CHROMIUM_PATH=/path/to/chromium node tests/browser.cjs
// CHROMIUM_PATH may be omitted when Playwright's browser is already installed.
// Screenshots and the JSON report go to QA_OUTPUT_DIR or a temporary directory.
// BROWSER_CASE may contain a regular expression for a focused rerun.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const E = require('../js/engine.js');
const S = require('../js/storage.js');
const stories = require('../js/stories.js');
const assets = require('../js/assets.js');

const ROOT = path.resolve(__dirname, '..');
const URL = process.env.GAMEBOOK_URL || pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUTPUT = path.resolve(process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'gamebook-qa'));
const STORAGE_KEY = 'gamebook.shelf.v1';
const CASE_FILTER = process.env.BROWSER_CASE ? new RegExp(process.env.BROWSER_CASE) : null;
const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
  { width: 844, height: 390 }
];
const results = [];
const diagnostics = [];
const screenshots = [];
let browser, currentPage, currentCase = '';

const compact = value => value.replace(/\n+/g, '');
const storyById = id => stories.find(story => story.id === id);
const introText = story => `あなたの役目\n${story.setup}\nこの物語のルール\n${story.rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`;

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function storedShelf(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
}

async function screenshot(page, name) {
  const filename = `${name.replace(/[^a-zA-Z0-9_-]/g, '-')}.png`;
  await page.screenshot({ path: path.join(OUTPUT, filename) });
  screenshots.push(filename);
}

async function newPage(viewport, seed, inspectAudio = false) {
  const context = await browser.newContext({ viewport, acceptDownloads: true, locale: 'ja-JP' });
  const page = await context.newPage();
  if (inspectAudio) await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__gamebookAudio = [];
    window.Audio = function (...args) {
      const media = new NativeAudio(...args);
      window.__gamebookAudio.push(media);
      return media;
    };
  });
  currentPage = page;
  page.on('pageerror', error => diagnostics.push({ case: currentCase, type: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') diagnostics.push({ case: currentCase, type: 'console', message: message.text() });
  });
  page.on('requestfailed', request => diagnostics.push({ case: currentCase, type: 'requestfailed', url: request.url(), message: request.failure()?.errorText }));
  page.on('request', request => {
    if (URL.startsWith('file:') && /^https?:/i.test(request.url())) {
      diagnostics.push({ case: currentCase, type: 'unexpected-network', url: request.url() });
    }
  });
  if (seed) {
    S.validateShelf(stories, seed);
    await page.addInitScript(({ key, shelf }) => {
      // Seed an empty record only. A separate sessionStorage marker must not
      // permit this fixture to overwrite an existing application autosave.
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(shelf));
      }
    }, { key: STORAGE_KEY, shelf: seed });
  }
  await page.goto(URL);
  await page.waitForSelector('html[data-gamebook-ready="true"]');
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
  return page;
}

function seededShelf(storyId, trail = [], intro = false, fontSize = 20) {
  const shelf = S.createShelf();
  const session = E.replay(storyById(storyId), trail);
  shelf.sessions[storyId] = session;
  shelf.bookmarks[storyId] = { intro, page: 0, nodeId: session.nodeId, trailLength: trail.length };
  shelf.preferences.fontSize = fontSize;
  shelf.activeStoryId = storyId;
  return shelf;
}

async function layout(page, label) {
  const issues = await page.evaluate(() => {
    const failures = [];
    const tolerance = 1.5;
    const visible = element => element && element.getClientRects().length > 0 && !element.closest('[hidden]');
    const inside = (a, b) => a.left >= b.left - tolerance && a.right <= b.right + tolerance
      && a.top >= b.top - tolerance && a.bottom <= b.bottom + tolerance;
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const summary = element => {
      const r = element.getBoundingClientRect();
      return { id: element.id || element.className, x: r.x, y: r.y, width: r.width, height: r.height };
    };
    for (const element of [document.documentElement, document.body]) {
      if (element.scrollWidth > innerWidth + tolerance || element.scrollHeight > innerHeight + tolerance) {
        failures.push({ kind: 'document-overflow', tag: element.tagName, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight, viewport: [innerWidth, innerHeight] });
      }
    }
    const reader = visible(document.querySelector('#reader-view'));
    const selectors = reader
      ? ['.topbar', '.reader-toolbar', '#paper', '#reader-text-frame', '.paper-footer', '#text-prev', '#text-next', '.decision-panel', '.records', '.journey-progress', '#choice-pagination']
      : ['.topbar', '.shelf-heading', '#book-grid', '.shelf-footer', '#shelf-prev', '#shelf-next', '.book-card'];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (visible(element) && !inside(element.getBoundingClientRect(), viewport)) failures.push({ kind: 'outside-viewport', ...summary(element) });
      }
    }
    if (!reader) {
      for (const card of document.querySelectorAll('.book-card')) {
        const bounds = card.getBoundingClientRect();
        for (const selector of ['.book-title', '.book-description', '.book-card-bottom']) {
          const child = card.querySelector(selector);
          if (visible(child) && !inside(child.getBoundingClientRect(), bounds)) {
            failures.push({ kind: 'card-copy-outside-card', child: summary(child), card: summary(card) });
          }
        }
        const title = card.querySelector('.book-title');
        if (title && title.scrollHeight > title.clientHeight + tolerance) {
          failures.push({ kind: 'card-title-clipped', title: title.textContent, ...summary(title) });
        }
        const description = card.querySelector('.book-description');
        if (description && description.getBoundingClientRect().height < 1) {
          failures.push({ kind: 'card-description-no-space', ...summary(description) });
        }
      }
    }
    if (reader) {
      const frame = document.querySelector('#reader-text-frame');
      const text = document.querySelector('#reader-text');
      const bounds = frame.getBoundingClientRect();
      if (bounds.height < 1 || bounds.width < 1) failures.push({ kind: 'empty-text-frame', ...summary(frame) });
      if (!inside(text.getBoundingClientRect(), bounds)) failures.push({ kind: 'text-overflow', frame: summary(frame), text: summary(text) });
      for (const paragraph of text.querySelectorAll('p')) {
        const range = document.createRange();
        range.selectNodeContents(paragraph);
        for (const line of range.getClientRects()) {
          if (!inside(line, bounds)) failures.push({ kind: 'glyph-overflow', x: line.x, y: line.y, width: line.width, height: line.height, frame: summary(frame) });
        }
      }
      const list = document.querySelector('#choice-list');
      for (const button of list.querySelectorAll('.choice-button')) {
        const copy = button.querySelector('.choice-copy');
        const buttonBounds = button.getBoundingClientRect();
        if (!inside(buttonBounds, viewport) || !inside(buttonBounds, list.getBoundingClientRect())) {
          failures.push({ kind: 'choice-outside-list', ...summary(button), label: button.textContent });
        }
        if (!inside(copy.getBoundingClientRect(), buttonBounds)) failures.push({ kind: 'choice-copy-overflow', button: summary(button), copy: summary(copy), label: copy.textContent });
        for (const label of copy.children) {
          if (label.scrollWidth > label.clientWidth + tolerance || label.scrollHeight > label.clientHeight + tolerance) {
            failures.push({ kind: 'choice-copy-clipped', label: label.textContent });
          }
        }
      }
    }
    return failures;
  });
  assert.deepEqual(issues, [], `${label}: ${JSON.stringify(issues)}`);
}

async function readEveryPage(page, expected, label) {
  const before = await storedShelf(page);
  const originalSessions = before?.sessions;
  let guard = 0;
  while (await page.locator('#text-prev').isEnabled()) {
    assert(++guard < 300, `${label}: previous text pagination stalled`);
    await page.locator('#text-prev').click();
  }
  let complete = '', pageCount = 0;
  do {
    assert(++pageCount < 300, `${label}: text pagination stalled`);
    await layout(page, `${label}, text page ${pageCount}`);
    assert.equal(await page.locator('#reader-text').getAttribute('data-full-text'), expected, `${label}: canonical text differs`);
    complete += (await page.locator('#reader-text p').allTextContents()).join('');
    if (!(await page.locator('#text-next').isEnabled())) break;
    await page.locator('#text-next').click();
  } while (true);
  assert.equal(complete, compact(expected), `${label}: pagination lost or duplicated text`);
  assert.deepEqual((await storedShelf(page))?.sessions, originalSessions, `${label}: reading changed game state`);
  return pageCount;
}

async function allChoices(page, story, session, label) {
  const expected = E.availableChoices(story, session);
  const before = (await storedShelf(page)).sessions;
  while (await page.locator('#choice-prev').isVisible() && await page.locator('#choice-prev').isEnabled()) await page.locator('#choice-prev').click();
  const ids = [];
  for (let count = 0; count < 30; count++) {
    await layout(page, `${label}, choice page ${count + 1}`);
    for (const button of await page.locator('#choice-list [data-choice-id]').all()) {
      const id = await button.getAttribute('data-choice-id');
      ids.push(id);
      assert.equal(await button.locator('.choice-label').textContent(), expected.find(choice => choice.id === id)?.label, `${label}: choice copy`);
      assert(await button.isEnabled());
    }
    if (!(await page.locator('#choice-next').isVisible()) || !(await page.locator('#choice-next').isEnabled())) break;
    await page.locator('#choice-next').click();
  }
  assert.deepEqual(ids, expected.map(choice => choice.id), `${label}: missing, duplicate, or unavailable choices`);
  assert.deepEqual((await storedShelf(page)).sessions, before, `${label}: choice pagination changed state`);
  for (const field of story.state) {
    const displayed = await page.locator(`[data-state-id="${field.id}"] .state-value`).textContent();
    const value = session.state[field.id];
    assert.equal(displayed, typeof value === 'boolean' ? value ? '✓ 記録あり' : '— 記録なし' : String(value), `${label}: record ${field.id}`);
  }
  assert.equal(await page.locator('.state-row').count(), story.state.length, `${label}: state field count`);
}

async function findChoice(page, id) {
  while (await page.locator('#choice-prev').isVisible() && await page.locator('#choice-prev').isEnabled()) await page.locator('#choice-prev').click();
  for (let i = 0; i < 30; i++) {
    const choice = page.locator(`[data-choice-id="${id}"]`);
    if (await choice.isVisible()) return choice;
    assert(await page.locator('#choice-next').isVisible() && await page.locator('#choice-next').isEnabled(), `Cannot find enabled choice ${id}`);
    await page.locator('#choice-next').click();
  }
  throw new Error(`Choice pagination stalled for ${id}`);
}

async function choose(page, story, session, id, doubleClick = false) {
  const next = E.choose(story, session, id);
  const control = await findChoice(page, id);
  if (doubleClick) await control.dblclick({ delay: 65 });
  else await control.click();
  await page.waitForFunction(({ key, id, length }) => JSON.parse(localStorage.getItem(key)).sessions[id].trail.length === length,
    { key: STORAGE_KEY, id: story.id, length: next.trail.length });
  // The app deliberately ignores a human double-click through 320 ms.
  await page.waitForTimeout(340);
  await settle(page);
  assert.deepEqual((await storedShelf(page)).sessions[story.id], next, `${story.id}/${id}: action must commit exactly once`);
  return next;
}

async function openFromShelf(page, id) {
  if (await page.locator('#reader-view').isVisible()) await page.locator('#shelf-button').click();
  await page.locator('#search-input').fill(id);
  await page.locator(`[data-story-id="${id}"]`).click();
  await settle(page);
}

async function runCase(name, work) {
  if (CASE_FILTER && !CASE_FILTER.test(name)) return;
  currentCase = name;
  const start = Date.now();
  const beforeDiagnostics = diagnostics.length;
  try {
    await work();
    assert.equal(diagnostics.length, beforeDiagnostics, `${name}: browser diagnostics ${JSON.stringify(diagnostics.slice(beforeDiagnostics))}`);
    results.push({ name, status: 'passed', durationMs: Date.now() - start });
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    results.push({ name, status: 'failed', durationMs: Date.now() - start, error: error.stack || error.message });
    process.stdout.write(`FAIL ${name}: ${error.message}\n`);
    if (currentPage && !currentPage.isClosed()) await screenshot(currentPage, `FAIL-${name}`).catch(() => {});
  } finally {
    if (currentPage && !currentPage.isClosed()) await currentPage.context().close();
    currentPage = null;
  }
}

async function testAllStories() {
  await runCase('all20-ui-playthroughs', async () => {
    const page = await newPage(VIEWPORTS[0]);
    await layout(page, 'desktop shelf');
    await screenshot(page, 'library-1280x720');
    for (const story of stories) {
      await openFromShelf(page, story.id);
      await readEveryPage(page, introText(story), `${story.id} introduction`);
      await page.locator('[data-action="begin"]').click();
      await page.waitForTimeout(340);
      let session = E.createSession(story);
      for (let step = 0; step < 100; step++) {
        assert.deepEqual((await storedShelf(page)).sessions[story.id], session, `${story.id}: displayed session`);
        await readEveryPage(page, E.getText(story, session), `${story.id}/${session.nodeId}`);
        await allChoices(page, story, session, `${story.id}/${session.nodeId}`);
        const node = E.getNode(story, session);
        if (node.ending) {
          assert((await page.locator('#chapter-kicker').textContent()).startsWith('ENDING'));
          assert.deepEqual((await storedShelf(page)).endingTrails[story.id][node.ending.id], session.trail);
          if (story.id === 'GB01') await screenshot(page, 'GB01-ending-1280x720');
          process.stdout.write(`  ${story.id}: ${session.trail.length} actions → ${node.ending.id}\n`);
          break;
        }
        assert(step < 99, `${story.id}: first enabled path failed to end`);
        session = await choose(page, story, session, E.availableChoices(story, session)[0].id);
      }
    }
    assert.equal(Object.keys((await storedShelf(page)).sessions).length, 20);
    assert.equal(Object.values((await storedShelf(page)).endingTrails).filter(endings => Object.keys(endings).length > 0).length, 20);
  });
}

async function testResponsive() {
  for (const viewport of VIEWPORTS) {
    const suffix = `${viewport.width}x${viewport.height}`;
    await runCase(`shelf-${suffix}`, async () => {
      const page = await newPage(viewport);
      const seen = [];
      for (let count = 0; count < 10; count++) {
        await layout(page, `shelf ${suffix}`);
        seen.push(...await page.locator('[data-story-id]').evaluateAll(cards => cards.map(card => card.dataset.storyId)));
        if (!count) await screenshot(page, `library-${suffix}`);
        if (!(await page.locator('#shelf-next').isEnabled())) break;
        await page.locator('#shelf-next').click();
      }
      assert.deepEqual(seen, stories.map(story => story.id));
    });
    const cases = [
      { id: 'GB09', trail: [], intro: true, font: 24, name: 'intro24' },
      { id: 'GB20', trail: ['01b', '03b', '05b', '10a', '03c'], name: 'long-text' },
      { id: 'GB08', trail: ['01a', '02a'], name: 'four-choices' },
      { id: 'GB17', trail: ['01b', '03a', '04a', '05a', '06b'], name: 'four-choices' }
    ];
    for (const sample of cases) {
      await runCase(`${sample.id}-${sample.name}-${suffix}`, async () => {
        const seed = seededShelf(sample.id, sample.trail, sample.intro || false);
        const page = await newPage(viewport, seed);
        if (sample.font) {
          await page.locator('#settings-button').click();
          await page.getByRole('button', { name: '特大', exact: true }).click();
          await page.locator('#modal-close').click();
          await settle(page);
          assert.equal((await storedShelf(page)).preferences.fontSize, 24);
        }
        const story = storyById(sample.id), session = seed.sessions[sample.id];
        await screenshot(page, `${sample.id}-${sample.name}-${suffix}`);
        const count = await readEveryPage(page, sample.intro ? introText(story) : E.getText(story, session), `${sample.id} ${suffix}`);
        if (sample.intro && viewport.width < 600) assert(count > 1, 'Long introduction should paginate on mobile');
        if (!sample.intro) await allChoices(page, story, session, `${sample.id} ${suffix}`);
        const before = (await storedShelf(page)).sessions;
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowRight');
        assert.deepEqual((await storedShelf(page)).sessions, before, 'keyboard page turns must not change game state');
      });
    }
  }
  await runCase('resize-retains-text-and-state', async () => {
    const story = storyById('GB09');
    const page = await newPage(VIEWPORTS[0], seededShelf('GB09', [], true, 24));
    await page.locator('#text-next').click();
    const session = (await storedShelf(page)).sessions.GB09;
    for (const viewport of VIEWPORTS.slice(1)) {
      await page.setViewportSize(viewport);
      await settle(page);
      await readEveryPage(page, introText(story), `resize ${viewport.width}x${viewport.height}`);
      assert.deepEqual((await storedShelf(page)).sessions.GB09, session);
    }
    await page.locator('#settings-button').click();
    await page.getByRole('button', { name: '夜', exact: true }).click();
    await page.locator('#modal-close').click();
    assert.equal(await page.locator('body').getAttribute('data-theme'), 'night');
    await screenshot(page, 'night-844x390');
  });
}

async function testSavesAndHistory() {
  await runCase('begin-doubleclick-keeps-first-section', async () => {
    const story = storyById('GB01');
    const page = await newPage(VIEWPORTS[0], seededShelf('GB01', [], true));
    await readEveryPage(page, introText(story), 'begin double-click introduction');
    await page.locator('[data-action="begin"]').dblclick({ delay: 65 });
    await page.waitForTimeout(340);
    const shelf = await storedShelf(page);
    assert.equal(shelf.bookmarks.GB01.intro, false);
    assert.deepEqual(shelf.sessions.GB01, E.createSession(story), 'double-clicking begin must leave the first section unread and unchosen');
    await allChoices(page, story, shelf.sessions.GB01, 'begin double-click first section');
  });
  await runCase('save-import-history-restart-doubleclick', async () => {
    const story = storyById('GB01');
    const seed = seededShelf('GB01', ['01a']);
    const other = E.replay(storyById('GB02'), ['01c', '12a']);
    seed.sessions.GB02 = other;
    seed.endingTrails.GB02 = { E4: other.trail };
    seed.bookmarks.GB02 = { intro: false, page: 0, nodeId: other.nodeId, trailLength: other.trail.length };
    const page = await newPage(VIEWPORTS[1], seed);
    await page.locator('#save-button').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ファイルに保存', exact: true }).click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /^gamebook-save-.*\.json$/);
    const exportedText = fs.readFileSync(await download.path(), 'utf8');
    const exported = JSON.parse(exportedText);
    assert.equal(exported.format, 'gamebook-shelf');
    assert.equal(exported.version, 1);
    assert.deepEqual(S.validateShelf(stories, exported), await storedShelf(page));
    fs.writeFileSync(path.join(OUTPUT, 'exported-save.json'), exportedText);
    await page.locator('#modal-close').click();

    let session = await choose(page, story, seed.sessions.GB01, '02a');
    assert.equal(session.state.tide, 2);
    assert.equal(session.state.kayo, true);
    const autosaved = await storedShelf(page);
    await page.reload();
    await page.waitForSelector('html[data-gamebook-ready="true"]');
    await settle(page);
    assert.deepEqual(await storedShelf(page), autosaved, 'reload must retain the committed run and bookmark');
    assert.equal(await page.locator('#book-title').textContent(), story.title);

    const beforeHistory = await storedShelf(page);
    await page.locator('#history-button').click();
    assert.equal(await page.locator('.history-item').count(), session.trail.length + 1);
    await page.locator('.history-item > button').first().click();
    assert.equal(await page.locator('.history-detail').textContent(), E.getText(story, E.createSession(story)));
    await page.locator('#modal-close').click();
    await page.locator('#rules-button').click();
    await page.locator('#modal-close').click();
    await page.locator('#record-button').click();
    await page.locator('#modal-close').click();
    assert.deepEqual(await storedShelf(page), beforeHistory, 'history, rules, and record detail are read-only');
    session = await choose(page, story, session, '03a', true);
    assert.equal(session.nodeId, '06', 'double-click must not select the following node\'s action');

    await page.locator('#save-button').click();
    const beforeImport = await storedShelf(page);
    await page.locator('#import-input').setInputFiles({ name: 'valid-save.json', mimeType: 'application/json', buffer: Buffer.from(exportedText) });
    await page.getByRole('heading', { name: 'この栞を読み込みますか。', exact: true }).waitFor();
    assert.deepEqual(await storedShelf(page), beforeImport, 'previewing an import must not replace the current shelf');
    await page.getByRole('button', { name: '置き換えて読み込む', exact: true }).click();
    await settle(page);
    assert.deepEqual(await storedShelf(page), exported, 'confirmed valid import must restore all shelf contents');

    const tampered = JSON.parse(exportedText);
    tampered.sessions.GB01.state.tide = 0;
    const beforeBadImport = await storedShelf(page);
    await page.locator('#save-button').click();
    await page.locator('#import-input').setInputFiles({ name: 'tampered-save.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tampered)) });
    await page.getByRole('heading', { name: 'このファイルは読み込めません。', exact: true }).waitFor();
    assert.deepEqual(await storedShelf(page), beforeBadImport, 'rejected import must leave storage unchanged atomically');
    await screenshot(page, 'invalid-import-390x844');
    await page.locator('#modal-close').click();

    session = exported.sessions.GB01;
    for (const id of ['02d', '07d', '11a']) session = await choose(page, story, session, id);
    const ending = E.getNode(story, session).ending;
    assert(ending);
    assert.deepEqual((await storedShelf(page)).endingTrails.GB01[ending.id], session.trail);
    await page.locator('#restart-button').click();
    await page.getByRole('button', { name: '最初から始める', exact: true }).click();
    await settle(page);
    const restarted = await storedShelf(page);
    assert.deepEqual(restarted.sessions.GB01, E.createSession(story));
    assert.deepEqual(restarted.endingTrails.GB01[ending.id], session.trail, 'restart retains collected ending');
    assert.deepEqual(restarted.sessions.GB02, other, 'restart affects only the active story');
    assert.deepEqual(restarted.endingTrails.GB02, seed.endingTrails.GB02);
    assert.equal(restarted.bookmarks.GB01.intro, true);
  });
  await runCase('cross-tab-conflict-protects-both-runs', async () => {
    const story = storyById('GB01');
    const seed = seededShelf('GB01', ['01a']);
    const first = await newPage(VIEWPORTS[0], seed);
    const second = await first.context().newPage();
    second.on('pageerror', error => diagnostics.push({ case: currentCase, type: 'pageerror', message: error.message }));
    second.on('console', message => {
      if (message.type() === 'error') diagnostics.push({ case: currentCase, type: 'console', message: message.text() });
    });
    second.on('requestfailed', request => diagnostics.push({ case: currentCase, type: 'requestfailed', url: request.url(), message: request.failure()?.errorText }));
    await second.goto(URL);
    await second.waitForSelector('html[data-gamebook-ready="true"]');
    await settle(second);
    const otherRun = await choose(second, story, seed.sessions.GB01, '02a');
    await first.waitForFunction(() => document.querySelector('#save-status').textContent.includes('別の画面'));
    // An earlier success timer must not hide the still-active conflict notice.
    await first.waitForTimeout(1850);
    assert((await first.locator('#save-status').textContent()).includes('別の画面'), 'conflict warning must remain while autosave is paused');
    const external = await storedShelf(second);
    const localRun = E.choose(story, seed.sessions.GB01, '02c');
    await (await findChoice(first, '02c')).click();
    await first.waitForTimeout(340);
    assert.equal(await first.locator('#chapter-title').textContent(), E.getNode(story, localRun).title, 'the first tab keeps its own run visible');
    assert.deepEqual(await storedShelf(first), external, 'the stale tab must not overwrite the newer shelf');
    await first.locator('#save-button').click();
    const exportPromise = first.waitForEvent('download');
    await first.getByRole('button', { name: 'ファイルに保存', exact: true }).click();
    const exported = JSON.parse(fs.readFileSync(await (await exportPromise).path(), 'utf8'));
    assert.deepEqual(exported.sessions.GB01, localRun, 'paused autosave must still permit exporting the local run');
    assert.deepEqual((await storedShelf(second)).sessions.GB01, otherRun);
    await first.getByRole('button', { name: '別の画面の栞を読み込む', exact: true }).click();
    await first.getByRole('heading', { name: 'この栞を読み込みますか。', exact: true }).waitFor();
    await first.getByRole('button', { name: '置き換えて読み込む', exact: true }).click();
    await settle(first);
    assert.equal(await first.locator('#chapter-title').textContent(), E.getNode(story, otherRun).title);
    assert.deepEqual((await storedShelf(first)).sessions.GB01, otherRun);
    await screenshot(first, 'cross-tab-restored-1280x720');
  });
}

async function testInstalledAssets() {
  await runCase('installed-images-and-real-audio', async () => {
    const page = await newPage(VIEWPORTS[0], undefined, true);
    await page.waitForFunction(() => Array.from(document.querySelectorAll('img')).every(i => i.complete && i.naturalWidth > 0));
    assert.equal(await page.locator('#library-art img').count(), 1);
    assert.equal(await page.locator('[data-story-id="GB01"] img').count(), 1);
    assert.equal(await page.evaluate(() => window.__gamebookAudio.length), 0, 'initial OFF must not load audio');
    await page.locator('#music-button').click();
    await page.waitForFunction(() => window.__gamebookAudio[0]?.currentTime > .1);
    assert.equal(await page.evaluate(() => window.__gamebookAudio[0].src.endsWith('/assets/audio/library.ogg')), true);
    await layout(page, 'library with artwork and music button');
    await screenshot(page, 'assets-library-1280x720');
    await openFromShelf(page, 'GB01');
    await page.waitForFunction(() => window.__gamebookAudio[0].src.endsWith('/assets/audio/gb01-theme.ogg') && window.__gamebookAudio[0].currentTime > .1);
    await page.waitForFunction(() => document.querySelector('#scene-art img')?.naturalWidth > 0);
    await layout(page, 'GB01 with artwork and music button');
    await screenshot(page, 'assets-GB01-1280x720');
    assert.equal(await page.evaluate(() => window.__gamebookAudio.length), 1, 'switching stories must reuse one player');
    assert.equal(await page.evaluate(() => window.__gamebookAudio[0].loop), true);
    // Exercise the real decoder at the loop boundary without waiting 85 seconds.
    await page.evaluate(() => { const a = window.__gamebookAudio[0]; a.currentTime = a.duration - .12; });
    await page.waitForFunction(() => { const a = window.__gamebookAudio[0]; return !a.paused && a.currentTime > .05 && a.currentTime < 2; });
    await page.locator('#music-button').click();
    assert.equal(await page.evaluate(() => window.__gamebookAudio[0].paused), true);
    await page.locator('#music-button').click();
    await page.waitForFunction(() => !window.__gamebookAudio[0].paused);
    // Same-task changes intentionally cancel play promises. No stale rejection
    // may disable the final source or show a false "cannot play" notification.
    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) {
        document.querySelector('#shelf-button').click();
        document.querySelector('[data-story-id="GB01"]').click();
      }
    });
    await page.waitForFunction(() => !window.__gamebookAudio[0].paused && window.__gamebookAudio[0].currentTime > .1);
    assert.equal(await page.locator('#music-button').getAttribute('aria-pressed'), 'true');
    assert(!((await page.locator('#toast').textContent()).includes('再生できません')));
    for (const viewport of VIEWPORTS.slice(1)) {
      await page.setViewportSize(viewport); await settle(page);
      await layout(page, `GB01 artwork ${viewport.width}x${viewport.height}`);
      await screenshot(page, `assets-GB01-${viewport.width}x${viewport.height}`);
    }
    const silentStory = stories.find(story => !assets.stories[story.id].music);
    if (silentStory) {
      await openFromShelf(page, silentStory.id);
      assert.equal(await page.evaluate(() => window.__gamebookAudio[0].paused), true);
      assert.equal(await page.locator('#music-button').isVisible(), false);
    }
    await page.locator('#shelf-button').click();
    await page.waitForFunction(() => !window.__gamebookAudio[0].paused && window.__gamebookAudio[0].src.endsWith('/assets/audio/library.ogg'));
    // Hide/restore without changing the saved ON preference.
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.evaluate(() => window.__gamebookAudio[0].paused), true);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(() => !window.__gamebookAudio[0].paused);
  });
}

async function testStoryAssets() {
  for (const story of stories) {
    const media = assets.stories[story.id];
    if (story.id === 'GB01' || !media.image || !media.music) continue;
    await runCase(`assets-${story.id}`, async () => {
      const page = await newPage(VIEWPORTS[0], undefined, true);
      await openFromShelf(page, story.id);
      await page.waitForFunction(src => {
        const image = document.querySelector('#scene-art img');
        return image?.complete && image.naturalWidth > 0 && image.src.endsWith('/' + src);
      }, media.image.src);
      assert.equal(await page.evaluate(() => window.__gamebookAudio.length), 0);
      await page.locator('#music-button').click();
      await page.waitForFunction(src => {
        const audio = window.__gamebookAudio[0];
        return audio?.src.endsWith('/' + src) && audio.currentTime > .1;
      }, media.music.src);
      assert.equal(await page.evaluate(() => window.__gamebookAudio[0].volume), media.music.volume);
      assert.equal(await page.evaluate(() => window.__gamebookAudio[0].loop), true);
      await page.evaluate(() => { const audio = window.__gamebookAudio[0]; audio.currentTime = audio.duration - .12; });
      await page.waitForFunction(() => { const audio = window.__gamebookAudio[0]; return !audio.paused && audio.currentTime > .05 && audio.currentTime < 2; });
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport); await settle(page);
        await layout(page, `${story.id} artwork ${viewport.width}x${viewport.height}`);
        await screenshot(page, `assets-${story.id}-${viewport.width}x${viewport.height}`);
        await readEveryPage(page, introText(story), `${story.id} with artwork`);
      }
      assert.equal(await page.evaluate(() => window.__gamebookAudio.length), 1);
      await page.locator('#music-button').click();
      assert.equal(await page.evaluate(() => window.__gamebookAudio[0].paused), true);
    });
  }
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true });
  let playwright;
  try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
  catch (_) { throw new Error('Playwrightを別途インストールするか、PLAYWRIGHT_MODULEにそのモジュールの場所を指定してください。'); }
  const options = { headless: true, args: ['--no-sandbox'] };
  if (process.env.CHROMIUM_PATH) options.executablePath = process.env.CHROMIUM_PATH;
  browser = await playwright.chromium.launch(options);
  const version = browser.version();
  const started = new Date().toISOString();
  try {
    await testInstalledAssets();
    await testStoryAssets();
    await testResponsive();
    await testSavesAndHistory();
    await testAllStories();
  } finally {
    await browser.close();
    const report = { started, finished: new Date().toISOString(), url: URL, browserVersion: version, viewports: VIEWPORTS, results, diagnostics, screenshots };
    fs.writeFileSync(path.join(OUTPUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }
  const failed = results.filter(result => result.status !== 'passed');
  process.stdout.write(`\n${results.length - failed.length}/${results.length} browser cases passed. Report: ${path.join(OUTPUT, 'report.json')}\n`);
  if (failed.length || diagnostics.length) process.exitCode = 1;
}

main().catch(error => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
