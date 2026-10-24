import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { flatten, overlay, resolveMode, readJSON, listTrends, loadTrend } from '../skills/web-design/scripts/lib/tokens.mjs';
import { toVariable } from '../skills/web-design/scripts/lib/figma.mjs';
import { applyChanges, diffDump } from '../skills/web-design/scripts/figma-sync.mjs';

const TEMPLATE = path.resolve('skills/web-design/template');
const base = flatten(readJSON(path.join(TEMPLATE, 'design/tokens.json')));

function dumpOf(flat) {
  const res = { light: resolveMode(flat, 'light'), dark: resolveMode(flat, 'dark') };
  const out = {};
  for (const [k, t] of Object.entries(flat)) {
    const v = toVariable(k, t, res);
    if (v) out[v.name] = { type: v.type, values: v.values };
  }
  return out;
}

test('push then pull with no edits reports nothing, for base and every pack', () => {
  assert.deepEqual(diffDump(base, dumpOf(base)), []);
  for (const t of listTrends(TEMPLATE).map(loadTrend)) {
    const flat = overlay(base, flatten(t.pack.tokens));
    assert.deepEqual(diffDump(flat, dumpOf(flat)), [], t.id);
  }
});

test('a light-only edit keeps the dark value; a dark-only edit keeps the light value', () => {
  const dump = dumpOf(base);
  dump['color/border'].values.light = { r: 0.8, g: 0.8, b: 0.8, a: 1 };
  dump['radius/base'].values.dark = 20;
  const changes = diffDump(base, dump);
  assert.deepEqual(changes.map((c) => `${c.k}:${c.mode}`).sort(), ['color.border:light', 'radius.base:dark']);
  const tree = {};
  applyChanges(tree, base, changes);
  assert.equal(tree.color.border.$value, '#cccccc');
  assert.equal(tree.color.border.$extensions.mode.dark, base['color.border'].modes.dark);
  assert.equal(tree.radius.base.$value, base['radius.base'].$value);
  assert.equal(tree.radius.base.$extensions.mode.dark, '20px');
  // The written tree must still flatten to real tokens.
  assert.ok(flatten(tree)['radius.base']);
});

test('derived and fluid tokens are reported for manual edit, never overwritten', () => {
  const dump = dumpOf(base);
  dump['text/display'].values.light = 60;
  dump['color/primary'].values.light = { r: 1, g: 0, b: 0, a: 1 };
  const changes = diffDump(base, dump);
  assert.ok(changes.every((c) => c.kind === 'manual'));
  const tree = {};
  applyChanges(tree, base, changes);
  assert.deepEqual(tree, {});
});

test('font edits keep the fallback stack', () => {
  const dump = dumpOf(base);
  dump['font/sans'].values.light = 'Geist';
  const [c] = diffDump(base, dump);
  assert.equal(c.to[0], 'Geist');
  assert.ok(c.to.includes('system-ui'));
});
