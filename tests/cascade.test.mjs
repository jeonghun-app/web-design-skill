// Checks the generated cascade in a real browser: whole-page and subtree trend/theme
// combinations must resolve to the same values tokens.resolved.json predicts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { parseColor } from '../skills/web-design/scripts/lib/color.mjs';

const TEMPLATE = path.resolve('skills/web-design/template');
const require = createRequire(path.join(TEMPLATE, 'package.json'));
let chromium;
try { ({ chromium } = require('@playwright/test')); } catch { /* not installed */ }
const browserPath = chromium?.executablePath?.();
const skip = !chromium || !browserPath || !fs.existsSync(browserPath) ? 'playwright chromium not installed' : false;

// Tailwind compiles @theme into :root variables; emulate that for the raw file.
const css = fs.readFileSync(path.join(TEMPLATE, 'src/design/tokens.css'), 'utf8')
  .replace('@theme {', ':root {')
  .replace('--color-*: initial;', '')
  .replace(/^@custom-variant.*$/gm, '');
const resolved = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'design/build/tokens.resolved.json'), 'utf8'));

const html = `<!doctype html><style>${css}</style>
<div id="a" data-theme="dark"><div id="a1" data-trend="frosted"></div></div>
<div id="b" data-trend="frosted"><div id="b1" data-theme="dark"></div></div>
<div id="c" data-theme="dark" data-trend="warm-natural"><div id="c1" data-theme="light"></div></div>
<div id="d" data-trend="frosted" data-theme="dark"><div id="d1" data-trend="signal-dark"></div></div>`;

const cases = [
  ['a1', 'frosted', 'dark'],
  ['b1', 'frosted', 'dark'],
  ['c1', 'warm-natural', 'light'],
  ['d1', 'signal-dark', 'dark'],
];
const keys = ['color.bg', 'color.surface', 'color.primary', 'color.primary-soft', 'color.primary-hover', 'radius.card'];

test('subtree trend/theme combinations resolve like whole pages', { skip }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    for (const [id, trend, mode] of cases) {
      for (const k of keys) {
        const cssName = `--${k.replace(/\./g, '-')}`;
        const actual = await page.evaluate(([i, n]) => {
          const el = document.getElementById(i);
          const probe = document.createElement('span');
          el.appendChild(probe);
          probe.style.color = `var(${n})`;
          probe.style.width = `var(${n})`;
          const s = getComputedStyle(probe);
          const out = { color: s.color, width: s.width, raw: getComputedStyle(el).getPropertyValue(n).trim() };
          probe.remove();
          return out;
        }, [id, cssName]);
        const expected = resolved[trend][mode][k];
        if (k.startsWith('color.')) {
          const e = parseColor(expected);
          const m = actual.color.match(/[\d.]+/g).map(Number);
          const a = actual.color.startsWith('oklch') ? parseColor(actual.color) : { r: m[0] / 255, g: m[1] / 255, b: m[2] / 255 };
          for (const ch of ['r', 'g', 'b']) assert.ok(Math.abs(a[ch] - e[ch]) < 0.02, `${id} ${k}: ${actual.color} vs ${expected}`);
        } else {
          assert.ok(actual.raw.length > 0, `${id} ${k} missing`);
        }
      }
    }
    // Radius follows the trend in a dark subtree of a trended page (b1 → frosted 24px).
    const r = await page.evaluate(() => getComputedStyle(document.getElementById('b1')).getPropertyValue('--radius-card').trim());
    assert.equal(r, '24px');
  } finally {
    await browser.close();
  }
});
