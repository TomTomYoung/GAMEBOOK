#!/usr/bin/env node
'use strict';

// Diagnostic only: isolate file:// browser storage from game code.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'gamebook-storage-probe-'));
  const file = path.join(folder, 'probe.html');
  fs.writeFileSync(file, '<!doctype html><meta charset="utf-8"><title>Storage probe</title><button>Download</button><script>document.querySelector("button").onclick=()=>{const u=URL.createObjectURL(new Blob(["probe"],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download="probe.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);};</script>');
  const report = [];
  for (const channel of [undefined, 'chromium']) {
    for (const persistent of [false, true]) {
      const options = { headless: true, args: ['--no-sandbox'], channel };
      if (process.env.CHROMIUM_PATH) options.executablePath = process.env.CHROMIUM_PATH;
      let browser, context;
      try {
        if (persistent) context = await chromium.launchPersistentContext(path.join(folder, `profile-${channel || 'shell'}`), options);
        else { browser = await chromium.launch(options); context = await browser.newContext({ acceptDownloads: true }); }
        const page = await context.newPage();
        await page.goto(pathToFileURL(file).href);
        const results = [];
        for (let i = 0; i < 8; i++) {
          await page.evaluate(value => localStorage.setItem('probe', value), String(i));
          if (i % 2) {
            const done = page.waitForEvent('download');
            await page.locator('button').click();
            await (await done).path();
            await page.waitForTimeout(1100);
          }
          await page.reload();
          results.push({ round: i, download: Boolean(i % 2), saved: await page.evaluate(() => localStorage.getItem('probe')) });
        }
        report.push({ channel: channel || 'headless-shell', persistent, results });
      } finally { await context?.close(); await browser?.close(); }
    }
  }
  fs.mkdirSync(process.env.QA_OUTPUT_DIR || 'test-results', { recursive: true });
  fs.writeFileSync(path.join(process.env.QA_OUTPUT_DIR || 'test-results', 'file-storage-probe.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
