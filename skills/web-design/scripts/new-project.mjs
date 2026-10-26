#!/usr/bin/env node
// Scaffold a new React project from the skill template.
//
//   new-project.mjs <dir> [--framework vite|next] [--name <pkg-name>] [--trend <id>] [--lang ko]
//                   [--site-url https://…] [--install]
//
// Copies template/ (without node_modules, dist and generated output), vendors the
// scripts and every library trend pack into design/ so the project is self-contained
// (teammates and CI don't need the skill installed), then builds the tokens.
//
// --framework next: the same src/ (components, sections, pages) with template-next/ on top:
// App Router routes, next/font, metadata, sitemap and robots. Vite-only files are left out.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SKILL_DIR, parseArgs } from './lib/tokens.mjs';

const args = parseArgs(process.argv.slice(2));
const dir = args._[0] && path.resolve(args._[0]);
if (!dir) {
  console.error('usage: new-project.mjs <dir> [--framework vite|next] [--name <pkg>] [--trend <id>] [--lang ko] [--site-url https://…] [--install]');
  process.exit(1);
}
if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
  console.error(`${dir} exists and is not empty`);
  process.exit(1);
}
const framework = args.framework ?? 'vite';
if (!['vite', 'next'].includes(framework)) { console.error('--framework must be vite or next'); process.exit(1); }
const SKIP = new Set(['node_modules', 'dist', 'audit', 'build', 'baseline', '.tmp', '.next', 'out', '.vitest']);
// Files that only make sense for the Vite build; template-next/ supplies the Next versions.
const VITE_ONLY = new Set(['index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'package.json', 'package-lock.json', '.env', '.gitignore', 'src/main.tsx', 'src/App.tsx', 'src/vite-env.d.ts']);
const templateDir = path.join(SKILL_DIR, 'template');
fs.cpSync(templateDir, dir, {
  recursive: true,
  filter: (src) => !SKIP.has(path.basename(src)) && !src.endsWith('.tsbuildinfo')
    && !(framework === 'next' && VITE_ONLY.has(path.relative(templateDir, src).split(path.sep).join('/'))),
});
if (framework === 'next') {
  fs.cpSync(path.join(SKILL_DIR, 'template-next'), dir, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) && path.basename(src) !== 'next-env.d.ts' });
  const cfgFile = path.join(dir, 'design', 'web-design.config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  cfg.framework = 'next';
  // Real paths instead of hash routes.
  const toPath = (p) => p.replace(/^\/#\//, '/');
  // Next's client runtime is ~70 KB of first-load JS before any app code (measured: 170 KB for
  // the landing page vs 101 KB in Vite). The budget keeps the same app-code headroom on top
  // of that floor; see web-quality.md § Budgets.
  cfg.audit = {
    ...cfg.audit,
    pages: (cfg.audit?.pages ?? ['/']).map(toPath),
    // The SPA LCP acceptances don't apply: Next prerenders every route.
    accept: (cfg.audit?.accept ?? []).filter((a) => a.rule !== 'PF-01').map((a) => ({ ...a, page: toPath(a.page) })),
    budgets: { ...cfg.audit?.budgets, jsKb: 220 },
  };
  fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');
}
fs.cpSync(path.join(SKILL_DIR, 'scripts'), path.join(dir, 'design', 'scripts'), { recursive: true, filter: (src) => path.basename(src) !== 'new-project.mjs' });
fs.cpSync(path.join(SKILL_DIR, 'trends'), path.join(dir, 'design', 'trends'), { recursive: true });
const pkgFile = path.join(dir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
pkg.name = args.name ?? path.basename(dir).toLowerCase().replace(/[^a-z0-9-]/g, '-');
for (const [k, v] of Object.entries(pkg.scripts)) pkg.scripts[k] = v.replaceAll('../scripts/', 'design/scripts/');
if (args.lang) {
  // Sets the document language, which switches Korean/CJK line breaking and measure (korean.md).
  const html = path.join(dir, framework === 'next' ? 'app/layout.tsx' : 'index.html');
  fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace(/<html lang="[^"]*"/, `<html lang="${args.lang}"`));
}
if (args['site-url']) {
  // The origin behind canonical, Open Graph, JSON-LD, robots.txt and sitemap.xml (web-quality.md SE-09/11/20).
  const url = String(args['site-url']).replace(/\/$/, '');
  if (!/^https:\/\/[^/]+$/.test(url)) { console.error('--site-url must be an https origin, e.g. https://example.com'); process.exit(1); }
  const env = path.join(dir, '.env');
  fs.writeFileSync(env, fs.readFileSync(env, 'utf8').replace(/^(VITE_)?SITE_URL=.*$/m, (_, p = '') => `${p}SITE_URL=${url}`));
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
