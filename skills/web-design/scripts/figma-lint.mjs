#!/usr/bin/env node
// Lint a Figma page against the authoring rules in references/figma-authoring.md.
//
//   figma-lint.mjs script [--page "<page name>"] [--node <id>] [--max 300]
//       Print Plugin API code for use_figma. It walks one page (default: the first),
//       or one node's subtree, and returns { findings: [...], stats }.
//   figma-lint.mjs report <result.json> [--json]
//       Group findings by rule and severity. Exit 1 if any E (blocks "Ready for dev").
//
// One page per run: the Plugin API loads pages incrementally, so lint pages in
// separate (sequential) use_figma calls rather than looping over every page.

import fs from 'node:fs';
import { parseArgs } from './lib/tokens.mjs';

const args = parseArgs(process.argv.slice(2));
const [cmd, file] = args._;

export const RULES = {
  L01: ['E', 'Unbound solid fill/stroke', 'Bind a color variable (or a paint style).'],
  L02: ['E', 'Unbound corner radius', 'Bind a radius/* variable.'],
  L03: ['E', 'Unbound padding or gap', 'Bind space/* variables to padding and item spacing.'],
  L04: ['W', 'Spacing or radius off the 4px scale', 'Use a value from the scale (0,2,4,8,12,16,20,24,32,40,48,64,80,96).'],
  L05: ['E', 'Text without a text style', 'Apply a text style (display, h2, h3, lede, base, sm, xs).'],
  L06: ['E', 'Text color unbound', 'Bind color/fg, color/fg-muted or another text variable.'],
  L07: ['W', 'Effect without an effect style', 'Use shadow/card, shadow/raised or shadow/overlay.'],
  L08: ['W', 'Linear children without auto layout', 'Convert to auto layout (Shift+A).'],
  L09: ['E', 'Detached instance', 'Re-insert the component instance; extend with properties or slots instead of detaching.'],
  L10: ['W', 'Default layer name', 'Name layers after their role (card, price, label), aligned with code.'],
  L11: ['W', 'Hidden layer outside a component definition', 'Delete it or drive it with a boolean property.'],
  L12: ['W', 'Empty frame', 'Delete it, or make it a slot.'],
  L13: ['W', 'Component without a description', 'Describe purpose, when not to use it, a11y notes and the code import.'],
  L14: ['E', 'Inconsistent variant properties', 'Give every variant the same property keys and unique combinations.'],
  L16: ['W', 'Variant explosion (>50)', 'Use variable modes for themes and instance swap for icons; split the set.'],
  L18: ['W', 'Fixed-size text box inside auto layout', 'Set text resizing to Auto height or Auto width.'],
  L19: ['E', 'Text below 12px', 'Use ≥12px (≥16px for body text on mobile frames).'],
  L20: ['E', 'Touch target below 44px on a mobile frame', 'Give interactive elements a ≥44×44 hit area.'],
  L21: ['E', 'Text contrast below WCAG AA', 'Use a text token with ≥4.5:1 (≥3:1 for ≥24px or ≥18.66px bold).'],
  L22: ['W', 'Primitive variable used directly', 'Bind the semantic token instead.'],
  L23: ['W', 'Variable hygiene', 'Add WEB code syntax var(--…); never ALL_SCOPES on semantic tokens.'],
  L24: ['W', 'Ready page frame without dev status', 'Mark sections Ready for dev.'],
  L25: ['I', 'Ready page frame outside a section', 'Group each flow in a section (one handoff unit).'],
  L29: ['W', 'Interactive component missing Focus or Disabled state', 'Add State=Focus and State=Disabled variants.'],
  L30: ['I', 'No cover page', 'Make the first page "Cover" with a 1920×1080 thumbnail frame.'],
};

function lintCode({ page, node, max }) {
  return `// web-design figma-lint (read-only)
const MAX = ${max};
const SCALE = new Set([0, 1, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128]);
const DEFAULT_NAME = /^(Frame|Rectangle|Ellipse|Group|Vector|Line|Polygon|Star|Text|Union|Subtract|Intersect|Exclude|Component|Instance|Section|Slot) ?\\d+$/;
const INTERACTIVE = /button|link|checkbox|switch|toggle|tab|radio|input|field|select|menu ?item/i;
const findings = [];
const stats = { nodes: 0, truncated: false };
const add = (id, n, value, extra) => {
  if (findings.length >= MAX) { stats.truncated = true; return; }
  findings.push({ id, nodeId: n.id, name: n.name, value, ...(extra || {}) });
};
const pageName = ${JSON.stringify(page ?? null)};
const target = pageName ? figma.root.children.find((p) => p.name === pageName) : figma.root.children[0];
if (!target) throw new Error('page not found: ' + pageName);
await figma.setCurrentPageAsync(target);
const rootNode = ${node ? `await figma.getNodeByIdAsync(${JSON.stringify(node)})` : 'figma.currentPage'};
if (!rootNode) throw new Error('node not found');

const varCache = new Map();
const getVar = async (id) => { if (!varCache.has(id)) varCache.set(id, await figma.variables.getVariableByIdAsync(id)); return varCache.get(id); };
const colCache = new Map();
const getCol = async (id) => { if (!colCache.has(id)) colCache.set(id, await figma.variables.getVariableCollectionByIdAsync(id)); return colCache.get(id); };

const lum = ({ r, g, b }) => { const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
async function solidColor(n, paint) {
  if (!paint || paint.type !== 'SOLID' || paint.visible === false) return null;
  const bound = paint.boundVariables && paint.boundVariables.color;
  if (bound) { const v = await getVar(bound.id); if (v) { try { const r = v.resolveForConsumer(n); if (r && r.value && 'r' in r.value) return { ...r.value, a: (r.value.a ?? 1) * (paint.opacity ?? 1) }; } catch (e) {} } }
  return { ...paint.color, a: paint.opacity ?? 1 };
}
async function backgroundOf(n) {
  for (let a = n.parent; a && a.type !== 'PAGE'; a = a.parent) {
    if (!('fills' in a) || !Array.isArray(a.fills)) continue;
    for (const p of [...a.fills].reverse()) { const c = await solidColor(a, p); if (c && c.a >= 0.99) return c; }
  }
  return { r: 1, g: 1, b: 1, a: 1 };
}
const insideDefinition = (n) => { for (let a = n.parent; a; a = a.parent) if (a.type === 'COMPONENT' || a.type === 'COMPONENT_SET') return true; return false; };
const insideInstance = (n) => { for (let a = n.parent; a; a = a.parent) if (a.type === 'INSTANCE') return true; return false; };
const topFrameWidth = (n) => { let t = n; while (t.parent && t.parent.type !== 'PAGE' && t.parent.type !== 'SECTION') t = t.parent; return 'width' in t ? t.width : Infinity; };

const localComponentNames = new Set(figma.currentPage.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] }).map((c) => c.name));
const nodes = rootNode.type === 'PAGE' ? rootNode.findAll(() => true) : [rootNode, ...(rootNode.findAll ? rootNode.findAll(() => true) : [])];
for (const n of nodes) {
  stats.nodes++;
  if (findings.length >= MAX) { stats.truncated = true; break; }
  if (insideInstance(n)) continue; // lint main components, not their instances' internals

  if (DEFAULT_NAME.test(n.name) && !insideDefinition(n)) add('L10', n, n.name);
  if (n.visible === false && !insideDefinition(n) && !(n.componentPropertyReferences && n.componentPropertyReferences.visible)) add('L11', n);

  if ('fills' in n && Array.isArray(n.fills) && n.type !== 'TEXT' && !n.fillStyleId) {
    if (n.fills.some((p) => p.type === 'SOLID' && p.visible !== false && !(p.boundVariables && p.boundVariables.color))) add('L01', n, 'fill');
  }
  if ('strokes' in n && Array.isArray(n.strokes) && !n.strokeStyleId && n.strokes.some((p) => p.type === 'SOLID' && p.visible !== false && !(p.boundVariables && p.boundVariables.color))) add('L01', n, 'stroke');
  if ('effects' in n && n.effects.length && !n.effectStyleId) add('L07', n, n.effects.length + ' effects');

  if ('cornerRadius' in n && n.type !== 'TEXT' && n.type !== 'COMPONENT_SET') { // the variant container's default 5px is canvas chrome
    const r = n.cornerRadius === figma.mixed ? n.topLeftRadius : n.cornerRadius;
    const bound = n.boundVariables && (n.boundVariables.topLeftRadius || n.boundVariables.cornerRadius);
    if (r > 0 && !bound) { add('L02', n, r); if (!SCALE.has(r) && r < 999) add('L04', n, 'radius ' + r); }
  }
  if ('layoutMode' in n && n.layoutMode && n.layoutMode !== 'NONE') {
    for (const f of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing']) {
      const v = n[f];
      if (typeof v === 'number' && v > 0 && !(n.boundVariables && n.boundVariables[f])) { add('L03', n, f + ' ' + v); if (!SCALE.has(v)) add('L04', n, f + ' ' + v); break; }
    }
  } else if ((n.type === 'FRAME' || n.type === 'COMPONENT') && n.children && n.children.length >= 2 && n.inferredAutoLayout) {
    add('L08', n, n.children.length + ' children');
  }
  if (n.type === 'FRAME' && n.children && n.children.length === 0 && !(n.fills && n.fills.length) && !(n.strokes && n.strokes.length) && !(n.effects && n.effects.length)) add('L12', n);
  if (n.type === 'FRAME' && n.detachedInfo) add('L09', n, 'detached');
  else if (n.type === 'FRAME' && localComponentNames.has(n.name) && !insideDefinition(n)) add('L09', n, 'frame named like a component');

  if (n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent && n.parent.type !== 'COMPONENT_SET')) {
    if (!n.name.startsWith('_') && !n.name.startsWith('.') && !n.description) add('L13', n);
  }
  if (n.type === 'COMPONENT_SET') {
    const kids = n.children.filter((c) => c.type === 'COMPONENT');
    const keys = kids.map((c) => Object.keys(c.variantProperties || {}).sort().join('|'));
    const combos = kids.map((c) => JSON.stringify(c.variantProperties || {}));
    if (new Set(keys).size > 1 || new Set(combos).size !== combos.length) add('L14', n, kids.length + ' variants');
    if (kids.length > 50) add('L16', n, kids.length);
    if (INTERACTIVE.test(n.name)) {
      const states = new Set(kids.map((c) => (c.variantProperties || {}).State).filter(Boolean));
      if (states.size && (!states.has('Focus') || !states.has('Disabled'))) add('L29', n, [...states].join(','));
    }
  }

  if (n.type === 'TEXT') {
    if (n.textStyleId === '' ) add('L05', n, n.characters.slice(0, 30));
    else if (n.textStyleId === figma.mixed) add('L05', n, 'mixed styles');
    const fills = Array.isArray(n.fills) ? n.fills : [];
    if (!n.fillStyleId && fills.some((p) => p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color))) add('L06', n);
    if (n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE' && n.textAutoResize === 'NONE') add('L18', n);
    const size = n.fontSize === figma.mixed ? Math.min(...n.getStyledTextSegments(['fontSize']).map((s) => s.fontSize)) : n.fontSize;
    if (size < 12) add('L19', n, size + 'px');
    const fg = fills.length ? await solidColor(n, fills[0]) : null;
    if (fg) {
      const bg = await backgroundOf(n);
      const a = fg.a ?? 1;
      const comp = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
      const weight = n.fontWeight === figma.mixed ? 400 : n.fontWeight;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const cr = ratio(comp, bg);
      if (cr < (large ? 3 : 4.5)) add('L21', n, cr.toFixed(2) + ':1');
    }
  }

  if (topFrameWidth(n) <= 480 && 'width' in n && (n.type === 'INSTANCE' || n.type === 'FRAME' || n.type === 'COMPONENT')) {
    const main = n.type === 'INSTANCE' ? await n.getMainComponentAsync() : null;
    const label = (main && (main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : main.name)) || n.name;
    const interactive = (n.reactions && n.reactions.length > 0) || (n.type === 'INSTANCE' && INTERACTIVE.test(label));
    if (interactive && (n.width < 44 || n.height < 44)) add('L20', n, Math.round(n.width) + '×' + Math.round(n.height));
  }

  if ('boundVariables' in n && n.boundVariables) {
    for (const b of Object.values(n.boundVariables)) {
      const list = Array.isArray(b) ? b : [b];
      for (const x of list) {
        if (!x || !x.id) continue;
        const v = await getVar(x.id);
        const c = v && (await getCol(v.variableCollectionId));
        if (c && /primitive/i.test(c.name)) { add('L22', n, v.name); break; }
      }
    }
  }
}

// Page-level rules
if (/ready/i.test(figma.currentPage.name)) {
  for (const top of figma.currentPage.children) {
    if (top.type === 'FRAME') add('L25', top);
    if ((top.type === 'SECTION' || top.type === 'FRAME') && !(top.devStatus && top.devStatus.type)) add('L24', top);
  }
}
const first = figma.root.children[0];
if (first && !/cover/i.test(first.name)) findings.push({ id: 'L30', nodeId: first.id, name: first.name });

// Variable hygiene (file-wide, cheap)
const locals = await figma.variables.getLocalVariablesAsync();
let missingSyntax = 0, allScopes = 0;
for (const v of locals) {
  if (!v.codeSyntax || !v.codeSyntax.WEB) missingSyntax++;
  if (v.scopes && v.scopes.includes('ALL_SCOPES') && v.resolvedType !== 'TIMING' && v.resolvedType !== 'EASING') allScopes++;
}
if (missingSyntax) findings.push({ id: 'L23', nodeId: null, name: 'variables', value: missingSyntax + ' without WEB code syntax' });
if (allScopes) findings.push({ id: 'L23', nodeId: null, name: 'variables', value: allScopes + ' with ALL_SCOPES' });

return { page: figma.currentPage.name, findings, stats };
`;
}

function report(result) {
  const groups = new Map();
  for (const f of result.findings ?? []) {
    const g = groups.get(f.id) ?? [];
    g.push(f);
    groups.set(f.id, g);
  }
  const order = { E: 0, W: 1, I: 2 };
  const rows = [...groups.entries()].sort((a, b) => order[RULES[a[0]]?.[0] ?? 'I'] - order[RULES[b[0]]?.[0] ?? 'I'] || a[0].localeCompare(b[0]));
  const errors = rows.filter(([id]) => RULES[id]?.[0] === 'E').reduce((n, [, g]) => n + g.length, 0);
  const lines = [`# Figma lint: ${result.page ?? '?'}`, '', `${result.stats?.nodes ?? '?'} nodes · **${errors} E** · ${rows.length} rules hit${result.stats?.truncated ? ' · (truncated)' : ''}`, ''];
  for (const [id, g] of rows) {
    const [sev, title, fix] = RULES[id] ?? ['I', id, ''];
    lines.push(`- **${sev} ${id}** ${title} (${g.length}) — ${fix}`);
    for (const f of g.slice(0, 6)) lines.push(`  - \`${f.name}\`${f.value ? ` ${f.value}` : ''}${f.nodeId ? ` (${f.nodeId})` : ''}`);
    if (g.length > 6) lines.push(`  - … ${g.length - 6} more`);
  }
  if (!rows.length) lines.push('No findings.');
  return { text: lines.join('\n'), errors };
}

if (cmd === 'script') {
  process.stdout.write(lintCode({ page: args.page, node: args.node, max: +(args.max ?? 300) }));
} else if (cmd === 'report') {
  if (!file) throw new Error('usage: figma-lint.mjs report <result.json>');
  const { text, errors } = report(JSON.parse(fs.readFileSync(file, 'utf8')));
  console.log(text);
  process.exit(errors ? 1 : 0);
} else if (cmd) {
  console.error('usage: figma-lint.mjs <script|report> ...');
  process.exit(1);
}

export { lintCode, report };
