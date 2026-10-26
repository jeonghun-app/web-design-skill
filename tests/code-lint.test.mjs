// code-lint: each rule fires on a minimal bad case, stays quiet on the fixed case,
// honours the allow comment, and the template itself is clean.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { RULES, lintProject, lintSource } from '../skills/web-design/scripts/code-lint.mjs';

const TEMPLATE = fileURLToPath(new URL('../skills/web-design/template', import.meta.url));
const ids = (src, file = 'src/x.tsx') => lintSource(file, src).map((f) => f.id);

const CASES = [
  ['CL-01', `<div style={{ color: '#ff0044' }} />`, `<div className="text-fg" />`],
  ['CL-01', `const c = 'oklch(0.5 0.2 30)'`, `const c = 'var(--color-primary)'`],
  ['CL-02', `<p className="text-gray-500 md:bg-blue-600/50" />`, `<p className="text-fg-muted" />`],
  ['CL-03', `<p className="text-[13px]" />`, `<p className="text-sm" />`],
  ['CL-03', `<div className="z-[999]" />`, `<div className="z-(--layer-modal)" />`],
  ['CL-04', `<button className="outline-none" />`, `<button className="outline-none focus-visible:outline-2" />`],
  ['CL-05', `<button onMouseDown={save} />`, `<button onClick={save} />`],
  ['CL-06', `<div tabIndex={3} />`, `<div tabIndex={0} />`],
  ['CL-07', `<img src="a.png" width={10} height={10} />`, `<img src="a.png" alt="" width={10} height={10} />`],
  ['CL-08', `<img src="a.png" alt="" />`, `<img src="a.png" alt="" className="aspect-video" />`],
  ['CL-09', `<div onClick={open}>Open</div>`, `<button onClick={open}>Open</button>`],
  ['CL-11', `<div className="transition-[width] hover:w-64" />`, `<div className="transition-transform hover:scale-105" />`],
  ['CL-12', `<div dangerouslySetInnerHTML={{ __html: x }} />`, `<div>{x}</div>`],
  ['CL-13', `<div className="z-50" />`, `<div className="z-10" />`],
];

for (const [id, bad, good] of CASES) {
  test(`${id} fires on: ${bad}`, () => {
    assert.ok(ids(bad).includes(id), `${id} expected in ${JSON.stringify(ids(bad))}`);
    assert.ok(!ids(good).includes(id), `${id} not expected for: ${good}`);
  });
}

test('CL-10 fires on a viewport that disables zoom', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cl10-'));
  const write = (meta) => fs.writeFileSync(path.join(dir, 'index.html'), `<head>\n<meta name="viewport" content="${meta}">\n</head>`);
  write('width=device-width, initial-scale=1, maximum-scale=1');
  assert.deepEqual(lintProject(dir).map((f) => [f.id, f.line]), [['CL-10', 2]]);
  write('width=device-width, initial-scale=1');
  assert.deepEqual(lintProject(dir), []);
  fs.rmSync(dir, { recursive: true });
});

test('every rule has a case', () => {
  const covered = new Set(CASES.map(([id]) => id).concat('CL-10'));
  assert.deepEqual(Object.keys(RULES).filter((id) => !covered.has(id)), []);
});

test('CSS: outline removal needs a focus-visible replacement', () => {
  assert.ok(ids('a:focus { outline: none; }', 'src/x.css').includes('CL-04'));
  assert.ok(!ids('a:focus-visible {\n  outline: none;\n  box-shadow: var(--ring);\n}', 'src/x.css').includes('CL-04'));
});

test('allow comment on the line or up to 3 lines above suppresses one rule', () => {
  assert.deepEqual(ids(`// design-lint-allow CL-05 drag handle\n<div role="slider" onPointerDown={start} />`), []);
  assert.ok(ids(`// design-lint-allow CL-06 wrong rule\n<button onMouseDown={go} />`).includes('CL-05'));
  assert.ok(ids(`// design-lint-allow CL-05 too far\n\n\n\n<button onMouseDown={go} />`).includes('CL-05'));
});

test('hash links and data URIs are not raw colors', () => {
  assert.deepEqual(ids(`<a href="#features">x</a> <a href="#/app">y</a>`), []);
  assert.deepEqual(ids(`const bg = "url(data:image/svg+xml,%23fff)"`), []);
});

test('review regressions: letter-only hex, handler-only drag exemption, multi-line tags', () => {
  assert.ok(ids(`<path fill="#ccc" />`).includes('CL-01'));
  // Letter-only hex needs a color context (#add could be an id); hex with a digit is always a color.
  assert.ok(ids(`const brand = { color: '#fff' }`).includes('CL-01'));
  assert.ok(!ids(`<a href="#fade">x</a>`).includes('CL-01'));
  assert.ok(ids(`<span className="panel" onMouseDown={save}>x</span>`).includes('CL-05'));
  assert.ok(!ids(`<div role="separator" onPointerDown={startResize} />`).includes('CL-05'));
  assert.ok(ids(`<div\n  className="card"\n  onClick={open}\n>`).includes('CL-09'));
  const img = ids(`<img\n  src={u}\n  onLoad={() => setReady(true)}\n  alt=""\n  width={10}\n  height={10}\n/>`);
  assert.ok(!img.includes('CL-07') && !img.includes('CL-08'), JSON.stringify(img));
  assert.ok(ids(`export const viewport = { maximumScale: 1 }`, 'app/layout.tsx').includes('CL-10'));
  // Re-review: every tag on a line, ids aren't colors, camelCase pan handlers stay exempt.
  assert.ok(ids(`<div className="avatar"><img src={url} /></div>`).includes('CL-07'));
  assert.ok(ids(`<p>Hi <span onClick={go}>x</span></p>`).includes('CL-09'));
  assert.ok(!ids(`document.querySelector('#feed')`).includes('CL-01'));
  assert.ok(!ids(`if (location.hash === '#add') open()`).includes('CL-01'));
  assert.ok(ids(`<rect fill="#fade" />`).includes('CL-01'));
  assert.ok(ids(`const c = '#1a2b3c'`).includes('CL-01'));
  assert.ok(!ids(`<div role="application" onPointerDown={handlePanStart} />`).includes('CL-05'));
});

test('the CLI runs from paths with spaces and Hangul, and lints app/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '내 사이트 '));
  fs.mkdirSync(path.join(dir, 'app', 'bad'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'app', 'bad', 'page.tsx'), 'export default () => <div onClick={go} className="text-gray-500" />\n');
  const script = fileURLToPath(new URL('../skills/web-design/scripts/code-lint.mjs', import.meta.url));
  fs.cpSync(path.dirname(script), path.join(dir, 'scripts'), { recursive: true });
  const r = spawnSync(process.execPath, [path.join(dir, 'scripts', 'code-lint.mjs'), '--root', dir], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /CL-09/);
  assert.match(r.stdout, /CL-02/);
  fs.rmSync(dir, { recursive: true });
});

test('the template has no errors', () => {
  const errors = lintProject(TEMPLATE).filter((f) => RULES[f.id][0] === 'E');
  assert.deepEqual(errors, []);
});
