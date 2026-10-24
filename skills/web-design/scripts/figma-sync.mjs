#!/usr/bin/env node
// Bridge tokens and Figma variables through the Figma MCP `use_figma` tool.
//
//   figma-sync.mjs push [--trend <id>] [--collection <name>] [--only color,radius,...]
//       Print Plugin API code that upserts one collection (modes Light/Dark) with the
//       resolved values of the given trend (default: the active trend). Variables are
//       matched by name, so re-running with another trend swaps every value in place
//       and everything bound to them in Figma restyles at once.
//   figma-sync.mjs pull-script [--collection <name>] [--only radius,...]
//       Print Plugin API code that dumps the collection as JSON (run it via use_figma
//       and save the returned JSON to a file).
//   figma-sync.mjs pull <dump.json> [--write]
//       Diff a dump against design/tokens.json (or the active trend). --write applies
//       changed values to the active trend pack, or to tokens.json when no trend is active.
//
// Pass the printed code as the `code` argument of use_figma. Load the figma-use skill first.

import fs from 'node:fs';
import path from 'node:path';
import { flatten, parseArgs, projectPaths, readConfig, readJSON, listTrends, loadTrend, overlay, resolveMode, MODES, cssVar } from './lib/tokens.mjs';
import { toHex } from './lib/color.mjs';
import { toVariable } from './lib/figma.mjs';

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root ?? process.cwd());
const P = projectPaths(root);
const config = readConfig(root);
const collection = args.collection ?? 'web-design';
const [cmd, file] = args._;

function tokensFor(trendId) {
  const base = flatten(readJSON(P.tokens));
  if (!trendId || trendId === 'none') return base;
  const t = listTrends(root).find((x) => x.id === trendId);
  if (!t) throw new Error(`unknown trend ${trendId}`);
  return overlay(base, flatten(loadTrend(t).pack.tokens ?? {}));
}

function pushCode(trendId) {
  const flat = tokensFor(trendId);
  const res = Object.fromEntries(MODES.map((m) => [m, resolveMode(flat, m)]));
  const only = args.only ? String(args.only).split(',') : null;
  const vars = Object.entries(flat)
    .filter(([k]) => !only || only.includes(k.split('.')[0]))
    .map(([k, t]) => toVariable(k, t, res))
    .filter(Boolean);
  const payload = { collection, trend: trendId ?? 'none', vars };
  return `// web-design figma-sync push (trend: ${payload.trend}, ${vars.length} variables)
const data = ${JSON.stringify(payload)};
const all = await figma.variables.getLocalVariableCollectionsAsync();
let col = all.find((c) => c.name === data.collection);
if (!col) {
  col = figma.variables.createVariableCollection(data.collection);
  col.renameMode(col.modes[0].modeId, 'Light');
  col.addMode('Dark');
}
const modeId = (name) => {
  const m = col.modes.find((x) => x.name.toLowerCase() === name);
  return m ? m.modeId : col.addMode(name[0].toUpperCase() + name.slice(1));
};
const modes = { light: modeId('light'), dark: modeId('dark') };
const existing = await Promise.all(col.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)));
const byName = new Map(existing.filter(Boolean).map((v) => [v.name, v]));
const report = { created: 0, updated: 0, retyped: [], errors: [], trend: data.trend };
// TIMING and EASING variables don't accept scopes.
const SCOPED = new Set(['COLOR', 'FLOAT', 'STRING']);
for (const d of data.vars) {
  try {
    let v = byName.get(d.name);
    if (v && v.resolvedType !== d.type) { report.retyped.push(d.name); v.remove(); v = undefined; }
    if (!v) { v = figma.variables.createVariable(d.name, col, d.type); report.created++; }
    for (const [m, val] of Object.entries(d.values)) v.setValueForMode(modes[m], val);
    if (SCOPED.has(d.type)) v.scopes = d.scopes;
    v.setVariableCodeSyntax('WEB', d.web);
    report.updated++;
  } catch (e) {
    report.errors.push(d.name + ': ' + e.message);
  }
}
return report;
`;
}

const pullOnly = args.only ? String(args.only).split(',') : null;
const PULL_CODE = `// web-design figma-sync pull-script
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const col = cols.find((c) => c.name === ${JSON.stringify(collection)});
if (!col) throw new Error('collection not found: ' + ${JSON.stringify(collection)});
const modes = Object.fromEntries(col.modes.map((m) => [m.modeId, m.name.toLowerCase()]));
const vars = await Promise.all(col.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)));
const out = {};
const only = ${JSON.stringify(pullOnly)};
for (const v of vars.filter(Boolean)) {
  if (only && !only.includes(v.name.split('/')[0])) continue;
  out[v.name] = { type: v.resolvedType, values: {} };
  for (const [id, val] of Object.entries(v.valuesByMode)) out[v.name].values[modes[id]] = val;
}
return { collection: col.name, variables: out };
`;

function fromFigma(type, val, prevType) {
  if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') return undefined;
  if (type === 'COLOR') return toHex(`rgba(${Math.round(val.r * 255)}, ${Math.round(val.g * 255)}, ${Math.round(val.b * 255)}, ${val.a ?? 1})`);
  if (type === 'TIMING') return `${Math.round(val * 1000)}ms`;
  if (type === 'EASING') { const b = val.easingFunctionCubicBezier; return b ? `cubic-bezier(${b.x1}, ${b.y1}, ${b.x2}, ${b.y2})` : undefined; }
  if (type === 'FLOAT') return prevType === 'dimension' ? `${val}px` : val;
  return val;
}

function same(type, a, b) {
  if (a === undefined || b === undefined) return a === b;
  if (type === 'color') { try { return toHex(a) === toHex(b); } catch { return a === b; } }
  if (type === 'dimension') {
    const px = (x) => { const m = String(x).match(/^(-?[\d.]+)(px|rem)?$/); return m ? (m[2] === 'rem' ? +m[1] * 16 : +m[1]) : NaN; };
    return Math.abs(px(a) - px(b)) < 0.01 || String(a) === String(b);
  }
  return String(a) === String(b);
}

function setIn(tree, keyPath, mode, value) {
  let node = tree;
  const parts = keyPath.split('.');
  for (const p of parts.slice(0, -1)) node = node[p] ??= {};
  const leaf = (node[parts.at(-1)] ??= {});
  if (mode === 'light') leaf.$value = value;
  else ((leaf.$extensions ??= {}).mode ??= {})[mode] = value;
}

switch (cmd) {
  case 'push':
    process.stdout.write(pushCode(args.trend ?? config.trend));
    break;
  case 'pull-script':
    process.stdout.write(PULL_CODE);
    break;
  case 'pull': {
    if (!file) throw new Error('usage: figma-sync.mjs pull <dump.json> [--write]');
    const dump = readJSON(file);
    const vars = dump.variables ?? dump;
    const flat = tokensFor(config.trend);
    const res = Object.fromEntries(MODES.map((m) => [m, resolveMode(flat, m)]));
    const changes = [];
    for (const [name, v] of Object.entries(vars)) {
      const k = name.replace(/\//g, '.');
      if (!flat[k]) { changes.push({ k, kind: 'new-in-figma' }); continue; }
      for (const m of MODES) {
        const next = fromFigma(v.type, v.values[m], flat[k].$type);
        if (next === undefined) continue;
        if (flat[k].$value?.toString().includes('{') && m === 'light') continue; // aliases stay aliases
        if (!same(flat[k].$type, res[m][k], next)) changes.push({ k, mode: m, from: res[m][k], to: next, kind: 'changed' });
      }
    }
    for (const c of changes) console.log(c.kind === 'changed' ? `~ ${c.k} [${c.mode}] ${c.from} -> ${c.to}` : `+ ${c.k} exists only in Figma (add it to tokens.json by hand)`);
    if (!changes.length) console.log('Figma and code agree.');
    if (args.write && changes.some((c) => c.kind === 'changed')) {
      const active = config.trend !== 'none' && listTrends(root).find((t) => t.id === config.trend);
      if (active && active.source === 'library') throw new Error(`active trend ${active.id} lives in the skill library; run "trend.mjs add ${active.id}" first so the project owns it`);
      const target = active ? path.join(active.dir, 'pack.json') : P.tokens;
      const doc = readJSON(target);
      const tree = active ? (doc.tokens ??= {}) : doc;
      for (const c of changes.filter((x) => x.kind === 'changed')) setIn(tree, c.k, c.mode, c.to);
      fs.writeFileSync(target, JSON.stringify(doc, null, 2) + '\n');
      console.log(`wrote ${path.relative(root, target)}; now run build-tokens.mjs`);
    }
    break;
  }
  default:
    console.log('usage: figma-sync.mjs <push|pull-script|pull> ...');
    process.exit(cmd ? 1 : 0);
}
