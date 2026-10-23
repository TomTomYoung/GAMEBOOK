#!/usr/bin/env node
'use strict';
// Focused authoring-page integration checks; this is not a listening review.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const tracks = require('../doc/audio-review-data.js');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'gamebook-audio-review-qa');
const BROWSER = process.env.BROWSER || 'chromium';

async function main() {
  assert(['chromium', 'firefox', 'webkit'].includes(BROWSER));
  fs.mkdirSync(OUTPUT, { recursive: true });
  const options = { headless: true };
  if (BROWSER === 'chromium') {
    options.args = ['--no-sandbox'];
    if (process.env.CHROMIUM_PATH) options.executablePath = process.env.CHROMIUM_PATH;
  }
  const browser = await playwright[BROWSER].launch(options);
  const report = { browser: BROWSER, browserVersion: browser.version(), platform: process.platform, listeningReview: 'not_performed', cases: [], diagnostics: [] };
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', e => report.diagnostics.push(String(e)));
  page.on('requestfailed', r => report.diagnostics.push(r.url()));
  page.on('request', r => { if (/^https?:/.test(r.url())) report.diagnostics.push('Unexpected network: ' + r.url()); });
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('gamebook.audio-review.v1')));
  const upload = value => page.locator('#import').setInputFiles({ name: 'review.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'doc/audio-review.html')).href);
    await page.waitForSelector('html[data-audio-review-ready="true"]');
    await page.evaluate(() => localStorage.setItem('gamebook.shelf.v1', 'untouched-game-save'));
    assert.equal(await page.locator('#track option').count(), 24);
    assert(await page.evaluate(() => document.querySelector('audio').paused));
    for (let i = 0; i < tracks.length; i++) {
      await page.locator('#track').selectOption(String(i));
      await page.waitForFunction(src => {
        const a = document.querySelector('audio');
        return a.src.endsWith(src) && Number.isFinite(a.duration) && a.duration > 80;
      }, tracks[i].src);
    }
    await page.locator('#track').selectOption('0');
    await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('audio').currentTime > .1);
    await page.locator('#play').click();
    assert(await page.evaluate(() => document.querySelector('audio').paused));
    await page.locator('#seam').click();
    await page.waitForFunction(() => { const a = document.querySelector('audio'); return a.currentTime > a.duration - 5.1 && !a.paused; });
    await page.waitForFunction(() => { const a = document.querySelector('audio'); return a.currentTime < 1 && !a.paused; }, null, { timeout: 8000 });
    await page.locator('#three').click();
    await page.waitForFunction(() => { const a = document.querySelector('audio'); return a.currentTime > 0 && a.currentTime < 1 && !a.seeking && !a.paused; });
    for (let round = 1; round <= 3; round++) {
      // Seek in the test only; exercise real decoder wraps without pretending
      // to have listened through the full songs.
      await page.evaluate(() => { const a = document.querySelector('audio'); a.currentTime = a.duration - .3; });
      await page.waitForFunction(r => document.querySelector('#rounds').textContent.startsWith(`${r} / 3周`), round);
      if (round < 3) assert(await page.evaluate(() => !document.querySelector('audio').paused), 'the next pass must keep playing');
      if (round === 2) {
        // Pausing and resuming the last pass must retain its remaining count.
        await page.locator('#play').click();
        assert(await page.evaluate(() => document.querySelector('audio').paused));
        assert((await page.locator('#rounds').textContent()).startsWith('2 / 3周'));
        await page.locator('#play').click();
        await page.waitForFunction(() => !document.querySelector('audio').paused);
      }
    }
    assert(await page.evaluate(() => { const a = document.querySelector('audio'); return a.paused && a.ended && Math.abs(a.currentTime - a.duration) < .05; }), 'the third pass must finish at the end of the file');
    const stoppedAt = await page.evaluate(() => document.querySelector('audio').currentTime);
    // Observe later media tasks as well: a transient pause must not be accepted
    // if the browser's automatic loop subsequently starts a fourth pass.
    await page.waitForTimeout(750);
    assert(await page.evaluate(at => { const a = document.querySelector('audio'); return a.paused && Math.abs(a.currentTime - at) < .05; }, stoppedAt), 'playback must remain stopped after three passes');
    assert.equal(await page.locator('[data-check]:checked').count(), 0);
    await page.locator('#play').click();
    await page.waitForFunction(() => { const a = document.querySelector('audio'); return !a.paused && a.currentTime > 0 && a.currentTime < 1; });
    await page.locator('#seam').click();
    await page.waitForFunction(() => { const a = document.querySelector('audio'); return a.currentTime > a.duration - 5.1 && !a.paused; });
    await page.waitForFunction(() => { const a = document.querySelector('audio'); return a.currentTime < 1 && !a.paused; }, null, { timeout: 8000 });
    await page.locator('#play').click();
    assert(await page.evaluate(() => document.querySelector('audio').paused));
    await page.locator('#track').selectOption('1');
    assert(await page.evaluate(() => document.querySelector('audio').paused));
    await page.locator('#track').selectOption('0');
    report.cases.push('24 sources load; playback, pause, seam, three-pass natural end and stable stop; final-pass pause/resume and replay; no automatic listening marks');

    await page.locator('#verdict').selectOption('ok');
    assert.equal(await page.locator('#verdict').inputValue(), 'pending');
    await page.locator('#notes').fill('継ぎ目の確認用メモ <script>literal</script>');
    await page.locator('#timestamp').click();
    await page.locator('#environment').fill('自動試験環境・聴感未実施');
    for (const check of ['tone', 'level', 'seam', 'threeLoops']) await page.locator(`[data-check="${check}"]`).check();
    await page.locator('#verdict').selectOption('ok');
    const saved = await read();
    await page.reload();
    await page.waitForSelector('html[data-audio-review-ready="true"]');
    assert.deepEqual(await read(), saved);
    assert.equal(await page.locator('#verdict').inputValue(), 'ok');
    await page.locator('#next').click();
    assert.equal(await page.locator('#notes').inputValue(), '');
    await page.locator('#previous').click();
    assert.equal(await page.locator('#notes').inputValue(), saved.entries.library.notes);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export').click()]);
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.deepEqual(exported.entries, saved.entries);
    assert(exported.userAgent);
    report.cases.push('per-track notes, explicit verdict, autosave reload and JSON export');

    await upload({ invalid: true });
    await page.waitForFunction(() => document.querySelector('#save-message').textContent.startsWith('読み込めませんでした。'));
    assert.deepEqual(await read(), saved);
    const old = structuredClone(exported);
    old.entries.library.sha256 = '0'.repeat(64);
    old.entries.library.notes = '旧音源で聴いたメモ';
    await upload(old);
    await page.waitForFunction(() => document.querySelector('#save-message').textContent.includes('過去の記録'));
    const archived = await read();
    assert.equal(archived.entries.library.notes, saved.entries.library.notes);
    assert.equal(archived.archive[0].notes, '旧音源で聴いたメモ');
    const fresh = structuredClone(exported); fresh.entries.library.verdict = 'fix'; fresh.entries.library.notes = '再確認してください';
    await upload(fresh);
    await page.waitForFunction(() => document.querySelector('#notes').value === '再確認してください');
    assert.equal(await page.locator('#verdict').inputValue(), 'fix');
    assert.equal(await page.evaluate(() => localStorage.getItem('gamebook.shelf.v1')), 'untouched-game-save');
    report.cases.push('invalid import preserves notes; old audio kept in archive; matching audio imports; game save unchanged');

    for (const [width, height] of [[1280, 1000], [390, 844], [360, 640]]) {
      await page.setViewportSize({ width, height });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(OUTPUT, `audio-review-${width}.png`), fullPage: true });
    }
    report.cases.push('desktop and narrow mobile layouts have no horizontal overflow');
    assert.deepEqual(report.diagnostics, []);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed'; report.error = String(error.stack);
    report.playback = await page.evaluate(() => {
      const a = document.querySelector('audio');
      return a ? { time: a.currentTime, duration: a.duration, paused: a.paused, ended: a.ended, seeking: a.seeking, loop: a.loop, rounds: document.querySelector('#rounds').textContent } : null;
    }).catch(() => null);
    throw error;
  }
  finally {
    await browser.close();
    report.finished = new Date().toISOString();
    fs.writeFileSync(path.join(OUTPUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
