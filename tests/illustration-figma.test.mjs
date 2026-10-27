import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SKILL = fileURLToPath(new URL('../skills/web-design', import.meta.url));
const TEMPLATE = `${SKILL}/template`;

test('illustrations contain no hard-coded colors, gradients or text (IL-06, IL-09)', () => {
  const src = fs.readFileSync(`${TEMPLATE}/src/illustrations/index.tsx`, 'utf8');
  assert.doesNotMatch(src, /#[0-9a-f]{3,8}\b/i, 'hex color in illustration source');
  assert.doesNotMatch(src, /(rgb|hsl|oklch)\(/i, 'literal color function in illustration source');
  assert.doesNotMatch(src, /<(linearGradient|radialGradient|text)\b/, 'gradient or text element in illustrations');
  assert.match(src, /var\(--color-illus-/);
});

test('every figma-library step compiles as a use_figma script', () => {
  const list = spawnSync('node', [`${SKILL}/scripts/figma-library.mjs`, 'list'], { cwd: TEMPLATE, encoding: 'utf8' });
  const steps = [...list.stdout.matchAll(/^\d+\. (\S+)/gm)].map((m) => m[1]);
  assert.deepEqual(steps, ['pages', 'styles', 'button', 'badge', 'field', 'card', 'foundations', 'review']);
  for (const s of steps) {
    const r = spawnSync('node', [`${SKILL}/scripts/figma-library.mjs`, 'step', s], { cwd: TEMPLATE, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotThrow(() => new Function('figma', `return (async () => {${r.stdout}})`), s);
    assert.ok(r.stdout.length < 50_000, `${s} exceeds the 50 KB use_figma limit`);
    assert.doesNotMatch(r.stdout, /setFileThumbnailNodeAsync|loadAllPagesAsync|figma\.notify/, `${s} uses an unsupported API`);
  }
});

test('button step stays within the variant budget and binds tokens', () => {
  const r = spawnSync('node', [`${SKILL}/scripts/figma-library.mjs`, 'step', 'button'], { cwd: TEMPLATE, encoding: 'utf8' });
  const v = (r.stdout.match(/VARIANTS = \[([^\]]*)\]/)[1].split(',').length) * (r.stdout.match(/SIZES = \[([^\]]*)\]/)[1].split(',').length) * (r.stdout.match(/STATES = \[([^\]]*)\]/)[1].split(',').length);
  assert.ok(v <= 30, `button matrix ${v} > 30`);
  for (const k of ["'Focus'", "'Disabled'", 'bindRadius', 'bindPad', "setBoundVariable('height'"]) assert.ok(r.stdout.includes(k), k);
});
