import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SKILL = fileURLToPath(new URL('../skills/web-design', import.meta.url));
const run = (cwd, ...a) => spawnSync('node', a, { cwd, encoding: 'utf8' });

function scratch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-'));
  fs.cpSync(path.join(SKILL, 'template/design'), path.join(dir, 'design'), { recursive: true });
  fs.cpSync(path.join(SKILL, 'template/index.html'), path.join(dir, 'index.html'));
  return dir;
}

test('apply adds the trend to an explicit include list so its CSS ships', () => {
  const dir = scratch();
  const cfg = path.join(dir, 'design/web-design.config.json');
  fs.writeFileSync(cfg, JSON.stringify({ trend: 'none', include: ['frosted'] }));
  const r = run(dir, path.join(SKILL, 'scripts/trend.mjs'), 'apply', 'loud');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(fs.readFileSync(cfg, 'utf8')).include, ['frosted', 'loud']);
  assert.match(fs.readFileSync(path.join(dir, 'src/design/tokens.css'), 'utf8'), /\[data-trend="loud"\] \{/);
  assert.match(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), /<html data-trend="loud"/);
});

test('build refuses an active trend that is not included', () => {
  const dir = scratch();
  fs.writeFileSync(path.join(dir, 'design/web-design.config.json'), JSON.stringify({ trend: 'loud', include: ['frosted'] }));
  const r = run(dir, path.join(SKILL, 'scripts/build-tokens.mjs'));
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /not in "include"/);
});

test('--lock ships only the active trend', () => {
  const dir = scratch();
  const r = run(dir, path.join(SKILL, 'scripts/trend.mjs'), 'apply', 'signal-dark', '--lock');
  assert.equal(r.status, 0, r.stderr);
  const css = fs.readFileSync(path.join(dir, 'src/design/tokens.css'), 'utf8');
  assert.match(css, /\[data-trend="signal-dark"\] \{/);
  assert.doesNotMatch(css, /\[data-trend="loud"\] \{/);
});
