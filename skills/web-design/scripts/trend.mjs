#!/usr/bin/env node
// Manage trend packs: the fast-moving layer that sits on top of the stable tokens.
//
//   trend.mjs list                     packs with stage and freshness
//   trend.mjs apply <id|none> [--lock] make <id> the active trend (--lock ships only it)
//   trend.mjs add <id>                 copy a library pack into design/trends to own it
//   trend.mjs new <id> [--from <id>]   scaffold a new pack (optionally forked)
//   trend.mjs check [<id>]             validate packs: schema, freshness, contrast, motion
//   trend.mjs radar [--write] [--data <file|url>]
//                                      quarterly refresh helper: packs due for review, and browser
//                                      features whose Baseline status changed since the last snapshot
//
// Common flag: --root <project> (default: cwd)

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  LIBRARY_TRENDS, MODES, flatten, listTrends, loadTrend, overlay, parseArgs, projectPaths,
  readConfig, readJSON, resolveMode,
} from './lib/tokens.mjs';
import { apca, contrast } from './lib/color.mjs';

const STAGES = ['emerging', 'rising', 'peak', 'declining', 'fading'];

// Platform features that enable or retire trend mechanics. Status comes from the
// web-features dataset (the source behind Baseline).
export const RADAR_FEATURES = [
  'view-transitions', 'cross-document-view-transitions', 'view-transition-class', 'active-view-transition',
  'scroll-driven-animations', 'anchor-positioning', 'starting-style', 'popover', 'invoker-commands',
  'interpolate-size', 'calc-size', 'container-style-queries', 'field-sizing', 'text-wrap-balance',
  'text-wrap-pretty', 'text-autospace', 'word-break-auto-phrase', 'prefers-reduced-transparency',
  'backdrop-filter', 'relative-color', 'light-dark', 'content-visibility', 'linear-easing', 'has',
];
const RADAR_URL = 'https://unpkg.com/web-features/data.json';
const REQUIRED = ['id', 'name', 'summary', 'stage', 'reviewed', 'reviewBy', 'fits', 'avoid', 'tokens'];

// [foreground, background, minimum ratio]. Backgrounds may be translucent, so each
// pair is composited over color.bg before measuring.
export const CONTRAST_PAIRS = [
  ['color.fg', 'color.bg', 4.5],
  ['color.fg', 'color.surface', 4.5],
  ['color.fg-muted', 'color.bg', 4.5],
  ['color.fg-muted', 'color.surface', 4.5],
  ['color.fg', 'color.chrome', 4.5],
  ['color.fg-muted', 'color.chrome', 4.5],
  ['color.primary-fg', 'color.primary', 4.5],
  ['color.accent-fg', 'color.accent', 4.5],
  ['color.danger-fg', 'color.danger', 4.5],
  ['color.danger', 'color.bg', 3],
  ['color.border-strong', 'color.bg', 3],
  ['color.ring', 'color.bg', 3],
  ['color.primary', 'color.bg', 3],
  ['color.primary-text', 'color.bg', 4.5],
  ['color.primary-text', 'color.surface', 4.5],
];

const today = new Date().toISOString().slice(0, 7);
const fresh = (pack) => (pack.reviewBy && pack.reviewBy < today ? 'STALE' : 'ok');

export const APCA_ADVISORY = [
  ['color.fg', 'color.bg', 75],
  ['color.fg', 'color.surface', 75],
  ['color.fg-muted', 'color.bg', 60],
  ['color.fg-muted', 'color.surface', 60],
];

export function checkPack(t, base) {
  const errors = [];
  const warnings = [];
  const pack = t.pack;
  for (const k of REQUIRED) if (pack[k] === undefined) errors.push(`missing "${k}"`);
  if (pack.id && pack.id !== t.id) errors.push(`id "${pack.id}" does not match folder "${t.id}"`);
  if (pack.stage && !STAGES.includes(pack.stage)) errors.push(`stage must be one of ${STAGES.join('/')}`);
  if (fresh(pack) === 'STALE') warnings.push(`reviewBy ${pack.reviewBy} has passed: re-check the trend's lifecycle stage`);
  if (['declining', 'fading'].includes(pack.stage)) warnings.push(`stage is ${pack.stage}: prefer a newer pack for new work`);

  let merged;
  try {
    merged = overlay(base, flatten(pack.tokens ?? {}));
  } catch (e) {
    errors.push(e.message);
    return { errors, warnings };
  }
  for (const mode of MODES) {
    let r;
    try { r = resolveMode(merged, mode); } catch (e) { errors.push(`${mode}: ${e.message}`); continue; }
    for (const [fg, bg, min] of CONTRAST_PAIRS) {
      if (!(fg in r) || !(bg in r)) continue;
      // Fail closed: a pair we can't measure is an error, not a pass.
      try {
        const ratio = contrast(r[fg], r[bg], r['color.bg']);
        if (!Number.isFinite(ratio)) errors.push(`${mode}: cannot measure ${fg} on ${bg}`);
        else if (ratio < min) errors.push(`${mode}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1 (< ${min}:1)`);
      } catch (e) { errors.push(`${mode}: cannot measure ${fg} on ${bg}: ${e.message}`); }
    }
    // APCA advisory (visual-craft.md): body text Lc 75+, muted text Lc 60+.
    for (const [fg, bg, min] of APCA_ADVISORY) {
      if (!(fg in r) || !(bg in r)) continue;
      try {
        const lc = Math.abs(apca(r[fg], r[bg], r['color.bg']));
        if (lc < min) warnings.push(`${mode}: APCA ${fg} on ${bg} = Lc ${lc.toFixed(0)} (advisory target ${min})`);
      } catch { /* measured above */ }
    }
    for (const [k, v] of Object.entries(r)) {
      if (!k.startsWith('motion.duration.')) continue;
      const ms = parseFloat(v) * (String(v).endsWith('ms') ? 1 : 1000);
      if (ms > 500) errors.push(`${mode}: ${k} = ${v} exceeds 500ms (MT-01)`);
    }
  }
  const css = t.css ?? '';
  if (/animation-iteration-count:\s*infinite|\binfinite\b/.test(css) && !/prefers-reduced-motion/.test(css)) {
    errors.push('pack.css has infinite animation without a prefers-reduced-motion fallback (MT-03/MT-05)');
  }
  if (/backdrop-filter/.test(css) && !/@supports/.test(css)) {
    warnings.push('pack.css uses backdrop-filter without an @supports fallback');
  }
  return { errors, warnings };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root ?? process.cwd());
  const P = projectPaths(root);
  const [cmd, id] = args._;


  function rebuild() {
    return import(path.join(path.dirname(new URL(import.meta.url).pathname), 'build-tokens.mjs'));
  }

  function setConfig(patch) {
    const cfg = { ...readConfig(root), ...patch };
    fs.mkdirSync(P.design, { recursive: true });
    fs.writeFileSync(P.config, JSON.stringify(cfg, null, 2) + '\n');
    return cfg;
  }

  function setHtmlTrend(trendId) {
    const html = path.join(root, 'index.html');
    if (!fs.existsSync(html)) return;
    const src = fs.readFileSync(html, 'utf8');
    const next = src.replace(/<html([^>]*?)\sdata-trend="[^"]*"/, '<html$1').replace('<html', `<html data-trend="${trendId}"`);
    fs.writeFileSync(html, next);
  }

  const trends = listTrends(root);
  const find = (x) => trends.find((t) => t.id === x) ?? (console.error(`unknown trend "${x}"`), process.exit(1));

  switch (cmd) {
    case 'list': {
      const active = readConfig(root).trend;
      const rows = trends.map(loadTrend).map(({ id: tid, source, pack }) => [
        tid === active ? `* ${tid}` : `  ${tid}`, pack.stage, pack.reviewed, fresh(pack), source, pack.summary,
      ]);
      const w = [0, 1, 2, 3, 4].map((i) => Math.max(...rows.map((r) => String(r[i]).length), 6));
      for (const r of rows) console.log(r.map((c, i) => (i < 5 ? String(c).padEnd(w[i]) : c)).join('  '));
      break;
    }
    case 'apply': {
      if (!id) throw new Error('usage: trend.mjs apply <id|none> [--lock]');
      if (id !== 'none') find(id);
      const prev = readConfig(root).include;
      let include = prev === 'active' ? 'all' : prev;
      if (Array.isArray(include) && id !== 'none' && !include.includes(id)) include = [...include, id];
      if (args.lock) include = 'active';
      setConfig({ trend: id, include });
      setHtmlTrend(id);
      process.argv = [process.argv[0], 'build-tokens.mjs', '--root', root];
      await rebuild();
      break;
    }
    case 'add': {
      const src = path.join(LIBRARY_TRENDS, id ?? '');
      if (!id || !fs.existsSync(path.join(src, 'pack.json'))) throw new Error(`no library pack "${id}"`);
      const dst = path.join(P.trends, id);
      if (fs.existsSync(dst)) throw new Error(`${path.relative(root, dst)} already exists`);
      fs.cpSync(src, dst, { recursive: true });
      console.log(`copied ${id} -> ${path.relative(root, dst)} (the project copy now wins over the library)`);
      break;
    }
    case 'new': {
      if (!id || !/^[a-z0-9-]+$/.test(id)) throw new Error('usage: trend.mjs new <kebab-id> [--from <id>]');
      const dst = path.join(P.trends, id);
      if (fs.existsSync(dst)) throw new Error(`${path.relative(root, dst)} already exists`);
      const from = args.from ? loadTrend(find(args.from)) : null;
      const now = new Date();
      const reviewBy = new Date(now.getFullYear(), now.getMonth() + 6, 1).toISOString().slice(0, 7);
      const pack = {
        id, name: id.replace(/-/g, ' '), summary: 'TODO one line: what it looks like and why it wows',
        stage: 'emerging', reviewed: today, reviewBy,
        fits: ['TODO audiences/sectors'], avoid: ['TODO where it hurts'],
        why: 'TODO the perceptual/attention mechanism that makes it work, and how it can hurt usability',
        risks: ['TODO accessibility/performance risks and the mitigation'],
        fonts: from?.pack.fonts ?? [],
        tokens: from?.pack.tokens ?? {},
      };
      fs.mkdirSync(dst, { recursive: true });
      fs.writeFileSync(path.join(dst, 'pack.json'), JSON.stringify(pack, null, 2) + '\n');
      fs.writeFileSync(path.join(dst, 'pack.css'), from?.css.replaceAll(`[data-trend="${from.id}"]`, `[data-trend="${id}"]`) ?? `/* Structural CSS for ${id}. Scope every rule under [data-trend="${id}"]. */\n`);
      console.log(`created ${path.relative(root, dst)}. Fill the TODOs, then: trend.mjs check ${id}`);
      break;
    }
    case 'check': {
      const base = flatten(readJSON(P.tokens));
      let failed = 0;
      for (const t of (id ? [find(id)] : trends).map(loadTrend)) {
        const { errors, warnings } = checkPack(t, base);
        console.log(`${errors.length ? 'FAIL' : 'ok  '} ${t.id}`);
        for (const e of errors) console.log(`     error: ${e}`);
        for (const w of warnings) console.log(`     warn:  ${w}`);
        if (errors.length) failed++;
      }
      const baseCheck = checkPack({ id: 'none', pack: { id: 'none', name: 'base', summary: '-', stage: 'peak', reviewed: today, reviewBy: '9999-12', fits: [], avoid: [], tokens: {} }, css: '' }, base);
      console.log(`${baseCheck.errors.length ? 'FAIL' : 'ok  '} (base tokens)`);
      for (const e of baseCheck.errors) console.log(`     error: ${e}`);
      if (failed || baseCheck.errors.length) process.exit(1);
      break;
    }
    case 'radar': {
      const snapFile = path.join(LIBRARY_TRENDS, 'radar.json');
      const snap = fs.existsSync(snapFile) ? readJSON(snapFile) : { checked: null, features: {} };
      const month = (d) => d.slice(0, 7);
      const soon = new Date(); soon.setMonth(soon.getMonth() + 2);
      console.log('# Trend radar\n\n## Packs due for review');
      for (const t of trends.map(loadTrend)) {
        const by = t.pack.reviewBy;
        const flag = by < today ? 'STALE' : by <= month(soon.toISOString()) ? 'due soon' : null;
        if (flag) console.log(`- ${t.id}: reviewBy ${by} (${flag}), stage ${t.pack.stage}`);
      }
      let data;
      try {
        const src = args.data ?? RADAR_URL;
        data = src.startsWith('http') ? await (await fetch(src)).json() : readJSON(src);
      } catch (e) {
        console.log(`\n(could not load web-features data: ${e.message})`);
        break;
      }
      const now = {};
      for (const id of RADAR_FEATURES) {
        const st = data.features?.[id]?.status;
        if (st) now[id] = { baseline: st.baseline || false, low: st.baseline_low_date ?? null, high: st.baseline_high_date ?? null };
      }
      console.log(`\n## Platform changes since ${snap.checked ?? 'the first run'}`);
      let changed = 0;
      for (const [id, v] of Object.entries(now)) {
        const was = snap.features[id];
        if (!was || was.baseline !== v.baseline) {
          changed++;
          console.log(`- ${id}: ${was ? String(was.baseline) : 'untracked'} -> ${String(v.baseline)}${v.low ? ` (low ${v.low})` : ''}`);
        }
      }
      if (!changed) console.log('- no Baseline changes');
      console.log('\nNext: follow references/trends.md "Refreshing trends" (collect signals, count, extract mechanics, update stage/reviewed/reviewBy, run check and audit).');
      if (args.write) {
        fs.writeFileSync(snapFile, JSON.stringify({ checked: new Date().toISOString().slice(0, 10), features: now }, null, 2) + '\n');
        console.log(`wrote ${path.relative(root, snapFile)}`);
      }
      break;
    }
    default:
      console.log('usage: trend.mjs <list|apply|add|new|check|radar> [id] [--root <project>]');
      process.exit(cmd ? 1 : 0);
  }
}
