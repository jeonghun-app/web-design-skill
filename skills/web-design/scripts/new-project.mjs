#!/usr/bin/env node
// Scaffold a new React project from the skill template.
//
//   new-project.mjs <dir> [--name <pkg-name>] [--trend <id>] [--lang ko] [--install]
//
// Copies template/ (without node_modules, dist and generated output), vendors the
// scripts and every library trend pack into design/ so the project is self-contained
// (teammates and CI don't need the skill installed), then builds the tokens.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SKILL_DIR, parseArgs } from './lib/tokens.mjs';

const args = parseArgs(process.argv.slice(2));
const dir = args._[0] && path.resolve(args._[0]);
if (!dir) {
  console.error('usage: new-project.mjs <dir> [--name <pkg>] [--trend <id>] [--install]');
  process.exit(1);
}
if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
  console.error(`${dir} exists and is not empty`);
  process.exit(1);
}
const SKIP = new Set(['node_modules', 'dist', 'audit', 'build', '.tmp']);
fs.cpSync(path.join(SKILL_DIR, 'template'), dir, {
  recursive: true,
  filter: (src) => !SKIP.has(path.basename(src)) && !src.endsWith('.tsbuildinfo'),
});
fs.cpSync(path.join(SKILL_DIR, 'scripts'), path.join(dir, 'design', 'scripts'), { recursive: true, filter: (src) => path.basename(src) !== 'new-project.mjs' });
fs.cpSync(path.join(SKILL_DIR, 'trends'), path.join(dir, 'design', 'trends'), { recursive: true });
const pkgFile = path.join(dir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
pkg.name = args.name ?? path.basename(dir).toLowerCase().replace(/[^a-z0-9-]/g, '-');
for (const [k, v] of Object.entries(pkg.scripts)) pkg.scripts[k] = v.replaceAll('../scripts/', 'design/scripts/');
if (args.lang) {
  // Sets the document language, which switches Korean/CJK line breaking and measure (korean.md).
  const html = path.join(dir, 'index.html');
  fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace(/<html lang="[^"]*"/, `<html lang="${args.lang}"`));
}
fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');

const run = (cmd, a) => {
  const r = spawnSync(cmd, a, { cwd: dir, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
if (args.install) run('npm', ['install']);
if (args.trend) run('node', ['design/scripts/trend.mjs', 'apply', args.trend]);
else run('node', ['design/scripts/build-tokens.mjs']);
const rel = path.relative(process.cwd(), dir);
console.log(`\ncreated ${dir}\n  cd ${rel.startsWith('..') ? dir : rel || '.'} && ${args.install ? '' : 'npm install && '}npm run dev`);
