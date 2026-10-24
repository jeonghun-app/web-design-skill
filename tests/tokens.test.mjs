import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { cssValue, flatten, overlay, resolveMode, LIBRARY_TRENDS, listTrends, loadTrend, readJSON } from '../skills/web-design/scripts/lib/tokens.mjs';
import { toVariable } from '../skills/web-design/scripts/lib/figma.mjs';
import { checkPack } from '../skills/web-design/scripts/trend.mjs';

const TEMPLATE = fileURLToPath(new URL('../skills/web-design/template', import.meta.url));
const base = flatten(readJSON(path.join(TEMPLATE, 'design/tokens.json')));

test('flatten keeps types and dark modes', () => {
  const f = flatten({ color: { $type: 'color', bg: { $value: '#fff', $extensions: { mode: { dark: '#000' } } } } });
  assert.deepEqual(f['color.bg'], { $value: '#fff', $type: 'color', $description: undefined, modes: { dark: '#000' } });
});

test('aliases resolve per mode and become var() in CSS', () => {
  const f = flatten({ color: { $type: 'color', brand: { $value: '#111', $extensions: { mode: { dark: '#eee' } } }, primary: { $value: '{color.brand}' } } });
  assert.equal(resolveMode(f, 'light')['color.primary'], '#111');
  assert.equal(resolveMode(f, 'dark')['color.primary'], '#eee');
  assert.equal(cssValue('{color.brand}'), 'var(--color-brand)');
});

test('alias cycles are reported', () => {
  const f = flatten({ a: { $value: '{b}' }, b: { $value: '{a}' } });
  assert.throws(() => resolveMode(f, 'light'), /cycle/);
});

test('overlay: trend light value also replaces dark unless inherit', () => {
  const over = flatten({ color: { brand: { $value: '#f00' }, bg: { $value: '#fafafa', $extensions: { mode: { dark: 'inherit' } } } } });
  const m = overlay(base, over);
  assert.equal(m['color.brand'].modes.dark, '#f00');
  assert.equal(m['color.bg'].modes.dark, base['color.bg'].modes.dark);
});

test('base tokens pass the pack checks', () => {
  const r = checkPack({ id: 'none', pack: { id: 'none', name: 'b', summary: '-', stage: 'peak', reviewed: '2026-10', reviewBy: '9999-12', fits: [], avoid: [], tokens: {} }, css: '' }, base);
  assert.deepEqual(r.errors, []);
});

test('pack check catches low contrast and slow motion', () => {
  const bad = { id: 'bad', pack: { id: 'bad', name: 'b', summary: '-', stage: 'peak', reviewed: '2026-10', reviewBy: '9999-12', fits: [], avoid: [], tokens: {
    color: { 'fg-muted': { $value: '#cccccc' } }, motion: { duration: { large: { $value: '900ms' } } },
  } }, css: '' };
  const r = checkPack(bad, base);
  assert.ok(r.errors.some((e) => e.includes('fg-muted')));
  assert.ok(r.errors.some((e) => e.includes('900ms')));
});

test('every library trend pack passes its checks', () => {
  const packs = listTrends(TEMPLATE).filter((t) => t.source === 'library');
  assert.ok(fs.existsSync(LIBRARY_TRENDS));
  for (const t of packs.map(loadTrend)) {
    const r = checkPack(t, base);
    assert.deepEqual(r.errors, [], `${t.id}: ${r.errors.join('; ')}`);
  }
});

test('figma conversion covers the main token types', () => {
  const res = { light: resolveMode(base, 'light'), dark: resolveMode(base, 'dark') };
  const types = new Set(Object.entries(base).map(([k, t]) => toVariable(k, t, res)).filter(Boolean).map((v) => v.type));
  for (const t of ['COLOR', 'FLOAT', 'STRING', 'TIMING', 'EASING']) assert.ok(types.has(t), t);
});

test('unmeasurable contrast pairs fail the check', () => {
  const bad = { id: 'bad', pack: { id: 'bad', name: 'b', summary: '-', stage: 'peak', reviewed: '2026-10', reviewBy: '9999-12', fits: [], avoid: [], tokens: {
    color: { fg: { $value: 'var(--nope)' } },
  } }, css: '' };
  assert.ok(checkPack(bad, base).errors.some((e) => e.includes('cannot measure')));
});
