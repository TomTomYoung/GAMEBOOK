#!/usr/bin/env node
'use strict';

// Optional diagnostic, not a passing CI gate. On Chromium 151 an early
// localStorage read in addInitScript can change file:// reload behavior.
// Compare three observation methods without changing the game's storage code.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const target = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const output = process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'gamebook-storage-probe');

(async () => {
  const options = { headless: true, args: ['--no-sandbox'] };
  if (process.env.CHROMIUM_PATH) options.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(options);
  const results = [];
  const modes = ['none', 'empty-init', 'read-init'];
  const started = new Date().toISOString();
  try {
    for (let round = 0; round < 120; round++) {
      const mode = modes[round % modes.length];
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.goto(target);
        await page.evaluate(value => localStorage.setItem('probe', value), String(round));
        if (mode === 'read-init') await page.addInitScript(() => { window.before = localStorage.getItem('probe'); });
        if (mode === 'empty-init') await page.addInitScript(() => { window.before = 'no-storage-access'; });
        await page.reload();
        const value = await page.evaluate(() => ({ early: window.before, saved: localStorage.getItem('probe') }));
        results.push({ round, mode, ...value, passed: value.saved === String(round) });
      } finally { await context.close(); }
    }
    const summary = modes.map(mode => ({ mode, total: results.filter(r => r.mode === mode).length,
      failed: results.filter(r => r.mode === mode && !r.passed).length }));
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'file-storage-probe.json'), JSON.stringify({
      started, finished: new Date().toISOString(), browserVersion: browser.version(), target, summary, results
    }, null, 2) + '\n');
    console.log(JSON.stringify(summary, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
