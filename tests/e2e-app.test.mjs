// Browser regressions for the template's app demo. Needs a built template (dist/) and
// Playwright Chromium; skips otherwise. CI builds before running tests.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const TEMPLATE = fileURLToPath(new URL('../skills/web-design/template', import.meta.url));
const require = createRequire(path.join(TEMPLATE, 'package.json'));
let chromium;
try { ({ chromium } = require('@playwright/test')); } catch { /* not installed */ }
const ready = chromium && fs.existsSync(chromium.executablePath()) && fs.existsSync(path.join(TEMPLATE, 'dist/index.html'));
const skip = ready ? false : 'needs a built template and Playwright Chromium';

let server, browser, url;
before(async () => {
  if (skip) return;
  const port = 4800 + Math.floor(Math.random() * 400);
  server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { cwd: TEMPLATE, stdio: 'ignore' });
  url = `http://localhost:${port}/`;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.kill(); });

async function appPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url + '#/app');
  await page.getByRole('table').waitFor();
  return page;
}

test('archiving clears selection; each undo restores only its own rows', { skip }, async () => {
  const page = await appPage();
  const rows = () => page.locator('tbody tr').count();
  await page.getByLabel('Select row REQ-1042').check();
  await page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Archive' }).click();
  assert.equal(await rows(), 4);
  assert.equal(await page.getByRole('region', { name: 'Bulk actions' }).count(), 0, 'bulk bar must disappear');
  await page.getByLabel('Select row REQ-1041').check();
  await page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Archive' }).click();
  assert.equal(await rows(), 3);
  // Undo the first archive only: REQ-1042 returns, REQ-1041 stays archived.
  await page.getByRole('listitem').filter({ hasText: '1 request archived' }).first().getByRole('button', { name: 'Undo' }).click();
  assert.equal(await rows(), 4);
  assert.equal(await page.getByText('REQ-1041').count(), 0);
  assert.equal(await page.getByText('REQ-1042').count(), 1);
  await page.close();
});

test('header checkbox shows a mixed state for partial selection', { skip }, async () => {
  const page = await appPage();
  await page.getByLabel('Select row REQ-1039').check();
  assert.equal(await page.getByLabel('Select all rows').evaluate((el) => el.indeterminate), true);
  await page.close();
});

test('command palette returns focus to the opener on Esc', { skip }, async () => {
  const page = await appPage();
  const opener = page.getByRole('button', { name: /Search/ });
  await opener.click();
  await page.getByRole('combobox', { name: 'Search commands' }).waitFor();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  assert.equal(await opener.evaluate((el) => el === document.activeElement), true);
  await page.close();
});

test('Korean text breaks between words, never inside one', { skip }, async () => {
  const page = await appPage();
  const widths = await page.evaluate(() => {
    document.documentElement.lang = 'ko';
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;width:150px;font-size:16px';
    box.innerHTML = '<span id="ko-a">결제하기</span><span id="ko-b">주문 내역을 확인하세요</span>';
    document.body.appendChild(box);
    const el = document.getElementById('ko-a');
    const range = document.createRange();
    range.selectNodeContents(el);
    // Count rendered line boxes of the word; flex items stretch, so height is not a signal.
    const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    return { width: el.getBoundingClientRect().width, lines };
  });
  assert.ok(widths.width > 50, `"결제하기" shrank to ${widths.width}px`);
  assert.equal(widths.lines, 1, 'a single Korean word wrapped onto several lines');
  await page.close();
});

test('toast timers do not restart when another toast arrives', { skip }, async () => {
  const page = await appPage();
  await page.clock.install();
  await page.getByLabel('Select row REQ-1042').check();
  await page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Archive' }).click();
  await page.clock.runFor(6000);
  await page.getByLabel('Select row REQ-1041').check();
  await page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: 'Archive' }).click();
  await page.clock.runFor(4500); // first toast has now lived 10.5 s (> 10 s action limit)
  assert.equal(await page.getByRole('listitem').filter({ hasText: '1 request archived' }).count(), 1, 'only the second toast should remain');
  await page.close();
});

test('a closing dialog never swallows the next click (MC-03)', { skip }, async () => {
  const page = await appPage();
  const box = await page.getByRole('button', { name: 'Points' }).boundingBox();
  await page.getByRole('button', { name: 'New request' }).first().click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  // Raw mouse click at once (no actionability wait), while the exit animation runs.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal(await page.getByRole('columnheader', { name: /Points/ }).getAttribute('aria-sort'), 'ascending');
  await page.close();
});
