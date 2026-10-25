#!/usr/bin/env node
// Build a starter Figma library from the tokens, following references/figma-authoring.md.
//
//   figma-library.mjs list                       steps in order
//   figma-library.mjs step <n|name> [--trend <id>] [--font Inter]
//       Print Plugin API code for one step. Run steps in order, one use_figma call each,
//       after `figma-sync push` has created the variables. Every step is idempotent:
//       pages, styles and components are found by name and updated in place.
//
// Steps: pages → styles → button → badge → field → card → foundations → review

import path from 'node:path';
import { flatten, listTrends, loadTrend, overlay, parseArgs, projectPaths, readConfig, readJSON, resolveMode } from './lib/tokens.mjs';
import { parseColor } from './lib/color.mjs';

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root ?? process.cwd());
const P = projectPaths(root);
const config = readConfig(root);
const [cmd, which] = args._;

function tokens(trendId) {
  const base = flatten(readJSON(P.tokens));
  if (!trendId || trendId === 'none') return base;
  const t = listTrends(root).find((x) => x.id === trendId);
  return t ? overlay(base, flatten(loadTrend(t).pack.tokens ?? {})) : base;
}
const flat = tokens(args.trend ?? config.trend);
const light = resolveMode(flat, 'light');
const px = (v) => {
  const s = String(v).trim();
  const c = s.match(/^clamp\([^,]+,[^,]+,\s*([^)]+)\)$/)?.[1] ?? s;
  const m = c.match(/^(-?[\d.]+)(px|rem)?$/);
  return m ? (m[2] === 'rem' ? +m[1] * 16 : +m[1]) : null;
};
const firstFamily = (v) => (Array.isArray(v) ? v[0] : String(v).split(',')[0]).replace(/["']/g, '').trim();

// Text styles: name → size/line-height/weight/tracking (tracking em → percent).
const TEXT_STYLES = [
  ['Display', 'display', light['font-weight.display'] ?? 650, light['tracking.display']],
  ['Heading/H2', 'h2', light['font-weight.heading'] ?? 600, light['tracking.heading']],
  ['Heading/H3', 'h3', light['font-weight.heading'] ?? 600, light['tracking.heading']],
  ['Body/Lede', 'lede', 400, null],
  ['Body/Base', 'base', 400, null],
  ['Body/Small', 'sm', 400, null],
  ['Body/XSmall', 'xs', 400, null],
  ['Control/MD', 'sm', light['font-weight.control'] ?? 500, null],
  ['Control/LG', 'base', light['font-weight.control'] ?? 500, null],
].map(([name, key, weight, tracking]) => ({
  name,
  size: px(light[`text.${key}`]) ?? 16,
  lineHeight: Math.round(((px(light[`text.${key}`]) ?? 16) * (+light[`text.${key}--line-height`] || 1.5)) / 4) * 4, // TC-03: snap to 4px
  weight: +weight,
  trackingPct: tracking ? Math.round(parseFloat(tracking) * 1000) / 10 : 0,
}));

// CSS box-shadow → Figma effects (color resolved to rgba).
function shadowEffects(css) {
  if (!css || css === 'none') return [];
  const parts = [];
  let depth = 0, cur = '';
  for (const ch of String(css)) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => {
    const inset = /\binset\b/.test(p);
    const colorMatch = p.match(/(oklch\([^)]*\)|rgba?\([^)]*\)|#[0-9a-f]{3,8})/i);
    const nums = p.replace(colorMatch?.[0] ?? '', '').replace('inset', '').trim().split(/\s+/).map((x) => parseFloat(x) || 0);
    let color = { r: 0, g: 0, b: 0, a: 0.1 };
    try { if (colorMatch) { const c = parseColor(colorMatch[0]); color = { r: c.r, g: c.g, b: c.b, a: c.a ?? 1 }; } } catch { /* keep default */ }
    return { type: inset ? 'INNER_SHADOW' : 'DROP_SHADOW', color, offset: { x: nums[0] ?? 0, y: nums[1] ?? 0 }, radius: nums[2] ?? 0, spread: nums[3] ?? 0, visible: true, blendMode: 'NORMAL' };
  });
}
const EFFECTS = ['card', 'raised', 'overlay'].map((k) => ({ name: `Shadow/${k[0].toUpperCase()}${k.slice(1)}`, effects: shadowEffects(light[`shadow.${k}`]) }));

const font = args.font ?? firstFamily(light['font.sans'] ?? 'Inter');

// Shared prelude: variable lookup by name, binding helpers, font loading with fallback.
const PRELUDE = `
const COLLECTION = 'web-design';
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === COLLECTION);
if (!col) throw new Error('Run figma-sync push first: collection "web-design" not found');
const vars = await Promise.all(col.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)));
const V = Object.fromEntries(vars.filter(Boolean).map((v) => [v.name, v]));
const need = (n) => { if (!V[n]) throw new Error('missing variable ' + n); return V[n]; };
const paint = (n) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', need(n));
const bindRadius = (node, n) => ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'].forEach((k) => node.setBoundVariable(k, need(n)));
const bindPad = (node, x, y) => { node.setBoundVariable('paddingLeft', need(x)); node.setBoundVariable('paddingRight', need(x)); if (y) { node.setBoundVariable('paddingTop', need(y)); node.setBoundVariable('paddingBottom', need(y)); } };
const WANT = ${JSON.stringify(font)};
const available = await figma.listAvailableFontsAsync();
const families = new Set(available.map((f) => f.fontName.family));
const FAMILY = families.has(WANT) ? WANT : 'Inter';
const styleFor = (w) => { const s = available.filter((f) => f.fontName.family === FAMILY).map((f) => f.fontName.style);
  const order = w >= 700 ? ['Bold', 'Semi Bold', 'SemiBold'] : w >= 600 ? ['Semi Bold', 'SemiBold', 'Bold'] : w >= 500 ? ['Medium', 'Regular'] : ['Regular', 'Book'];
  return order.find((x) => s.includes(x)) || s[0]; };
const loadW = async (w) => { const f = { family: FAMILY, style: styleFor(w) }; await figma.loadFontAsync(f); return f; };
const textStyle = async (name) => (await figma.getLocalTextStylesAsync()).find((s) => s.name === name);
const effectStyle = async (name) => (await figma.getLocalEffectStylesAsync()).find((s) => s.name === name);
const page = async (name) => { const p = figma.root.children.find((x) => x.name === name); if (!p) throw new Error('Run the pages step first: missing page ' + name); await figma.setCurrentPageAsync(p); return p; };
const text = async (chars, styleName, colorVar) => { const t = figma.createText(); const st = await textStyle(styleName);
  if (st) { await figma.loadFontAsync(st.fontName); await t.setTextStyleIdAsync(st.id); } else { t.fontName = await loadW(400); }
  t.characters = chars; t.fills = [paint(colorVar)]; return t; };
const upsertSet = (pg, name) => pg.findChild((n) => n.type === 'COMPONENT_SET' && n.name === name);
`;

const PAGES = ['Cover', '🟢 Ready for dev', '💭 Explorations', '---', '1 Foundations', '2 Components', '_Base', '🗄 Archive'];

const STEPS = {
  pages: `// Pages in the recommended order, plus a 1920×1080 cover frame. The Plugin API can't set
// the file thumbnail: right-click the frame → "Set as thumbnail" once (manual step).
const NAMES = ${JSON.stringify(PAGES)};
const made = [];
for (const [i, name] of NAMES.entries()) {
  let p = figma.root.children.find((x) => x.name === name);
  if (!p && i === 0 && figma.root.children.length === 1 && /^Page 1$/.test(figma.root.children[0].name)) { p = figma.root.children[0]; p.name = name; }
  if (!p) { p = figma.createPage(); p.name = name; made.push(name); }
  figma.root.insertChild(Math.min(i, figma.root.children.length - 1), p);
}
const cover = figma.root.children.find((x) => x.name === 'Cover');
await figma.setCurrentPageAsync(cover);
let frame = cover.findChild((n) => n.name === 'Cover / Thumbnail');
const ids = {};
const colReady = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === 'web-design');
if (!frame) {
  frame = figma.createAutoLayout('VERTICAL', { name: 'Cover / Thumbnail', paddingLeft: 160, paddingRight: 160, paddingTop: 160, paddingBottom: 160, itemSpacing: 24 });
  frame.resize(1920, 1080); frame.primaryAxisSizingMode = 'FIXED'; frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisAlignItems = 'CENTER';
  const others = cover.children.filter((n) => n !== frame);
  frame.x = others.length ? Math.min(...others.map((n) => n.x)) : 0;
  frame.y = others.length ? Math.min(...others.map((n) => n.y)) - 1080 - 200 : 0; // never on top of existing work
  if (colReady) {
    const vs = await Promise.all(colReady.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)));
    const bg = vs.find((v) => v && v.name === 'color/bg'); const fg = vs.find((v) => v && v.name === 'color/fg');
    if (bg) frame.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', bg)];
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' }); await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    const t = figma.createText(); t.fontName = { family: 'Inter', style: 'Bold' }; t.fontSize = 120; t.characters = ${JSON.stringify(args.title ?? 'Design system')};
    const s = figma.createText(); s.fontName = { family: 'Inter', style: 'Regular' }; s.fontSize = 40; s.characters = 'Tokens, components and patterns · generated by web-design';
    if (fg) { const f = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', fg); t.fills = [f]; s.fills = [f]; }
    frame.appendChild(t); frame.appendChild(s);
  }
}
ids.cover = frame.id;
return { pages: figma.root.children.map((p) => p.name), created: made, ids, manual: 'Right-click "Cover / Thumbnail" → Set as thumbnail' };
`,

  styles: `${PRELUDE}
// Text styles (typography composites) and effect styles (shadows) — the parts variables can't hold.
const TS = ${JSON.stringify(TEXT_STYLES)};
const ES = ${JSON.stringify(EFFECTS)};
const out = { text: [], effect: [], family: FAMILY };
for (const d of TS) {
  let s = await textStyle(d.name);
  if (!s) { s = figma.createTextStyle(); s.name = d.name; }
  s.fontName = await loadW(d.weight);
  s.fontSize = d.size;
  s.lineHeight = { unit: 'PIXELS', value: d.lineHeight };
  s.letterSpacing = { unit: 'PERCENT', value: d.trackingPct };
  out.text.push(s.name + ' ' + d.size + '/' + d.lineHeight);
}
for (const d of ES) {
  let s = await effectStyle(d.name);
  if (!s) { s = figma.createEffectStyle(); s.name = d.name; }
  s.effects = d.effects;
  out.effect.push(s.name + ' (' + d.effects.length + ')');
}
return out;
`,

  button: `${PRELUDE}
// Button: Variant (Solid/Outline/Ghost) × Size (MD/LG) × State (Default/Hover/Focus/Disabled) = 24 ≤ 30.
const pg = await page('2 Components');
const old = upsertSet(pg, 'Button'); if (old) old.remove();
const VARIANTS = ['Solid', 'Outline', 'Ghost'], SIZES = ['MD', 'LG'], STATES = ['Default', 'Hover', 'Focus', 'Disabled'];
const comps = [];
for (const v of VARIANTS) for (const sz of SIZES) for (const st of STATES) {
  const c = figma.createComponent();
  c.name = 'Variant=' + v + ', Size=' + sz + ', State=' + st;
  c.layoutMode = 'HORIZONTAL'; c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  c.setBoundVariable('height', need(sz === 'MD' ? 'size/control-md' : 'size/control-lg'));
  bindPad(c, sz === 'MD' ? 'space/4' : 'space/6');
  c.setBoundVariable('itemSpacing', need('space/2'));
  bindRadius(c, 'radius/control');
  const fillVar = v === 'Solid' ? (st === 'Hover' ? 'color/primary-hover' : 'color/primary') : st === 'Hover' ? 'color/primary-soft' : null;
  c.fills = fillVar ? [paint(fillVar)] : [];
  if (v === 'Outline') { c.strokes = [paint('color/border-strong')]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE'; }
  if (st === 'Focus') { c.strokes = [paint('color/ring')]; c.strokeWeight = 2; c.strokeAlign = 'OUTSIDE'; }
  if (st === 'Disabled') c.opacity = 0.5;
  const label = await text('Button', sz === 'MD' ? 'Control/MD' : 'Control/LG', v === 'Solid' ? 'color/primary-fg' : 'color/primary-text');
  label.name = 'Label';
  c.appendChild(label);
  comps.push(c);
}
const set = figma.combineAsVariants(comps, pg);
set.name = 'Button';
set.description = 'Primary and secondary actions. One Solid per view (LA-01). Hit area ≥44px on touch (MO-02). Every state is designed (RE-01). Code: import { Button } from "@/components/ui/button" — variant, tone, size.';
const labelKey = set.addComponentProperty('Label', 'TEXT', 'Button');
for (const c of set.children) { const t = c.findOne((n) => n.type === 'TEXT'); if (t) t.componentPropertyReferences = { characters: labelKey }; }
// Grid layout: columns = states, rows = variant × size.
set.layoutMode = 'NONE';
let y = 32; const GAP = 24;
for (const v of VARIANTS) for (const sz of SIZES) {
  let x = 32;
  for (const st of STATES) { const c = set.children.find((n) => n.name === 'Variant=' + v + ', Size=' + sz + ', State=' + st); c.x = x; c.y = y; x += Math.max(c.width, 120) + GAP; }
  y += 64;
}
set.resizeWithoutConstraints(32 + STATES.length * 144 + 32, y + 8);
set.clipsContent = false; // focus rings are drawn outside the component bounds
set.fills = [paint('color/surface')]; bindRadius(set, 'radius/panel');
set.x = 0; set.y = 0;
return { setId: set.id, variants: set.children.length, props: Object.keys(set.componentPropertyDefinitions) };
`,

  badge: `${PRELUDE}
const pg = await page('2 Components');
const old = upsertSet(pg, 'Badge'); if (old) old.remove();
const TONES = { Brand: ['color/primary-soft', 'color/primary-soft-fg'], Neutral: ['color/surface-sunken', 'color/fg-muted'], Success: ['color/surface-sunken', 'color/fg'], Danger: ['color/surface-sunken', 'color/fg'] };
const DOTS = { Success: 'color/success', Danger: 'color/danger' };
const comps = [];
for (const [tone, [bg, fg]] of Object.entries(TONES)) {
  const c = figma.createComponent(); c.name = 'Tone=' + tone;
  c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  bindPad(c, 'space/3', 'space/1'); c.setBoundVariable('itemSpacing', need('space/2')); bindRadius(c, 'radius/pill');
  c.fills = [paint(bg)];
  if (DOTS[tone]) { const d = figma.createEllipse(); d.name = 'Dot'; d.resize(6, 6); d.fills = [paint(DOTS[tone])]; c.appendChild(d); }
  const t = await text(tone, 'Body/XSmall', fg); t.name = 'Label'; c.appendChild(t);
  comps.push(c);
}
const set = figma.combineAsVariants(comps, pg);
set.name = 'Badge';
set.description = 'Status and metadata. Color is never the only signal: pair with text (CO-04). Code: <Badge tone dot />.';
const key = set.addComponentProperty('Label', 'TEXT', 'Badge');
for (const c of set.children) { const t = c.findOne((n) => n.type === 'TEXT'); if (t) t.componentPropertyReferences = { characters: key }; }
set.layoutMode = 'HORIZONTAL'; set.itemSpacing = 16; set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24;
set.setBoundVariable('itemSpacing', need('space/4')); bindPad(set, 'space/6', 'space/6');
set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
set.fills = [paint('color/surface')]; bindRadius(set, 'radius/panel');
const btn = upsertSet(pg, 'Button'); set.x = 0; set.y = (btn ? btn.y + btn.height : 0) + 80;
return { setId: set.id, variants: set.children.length };
`,

  field: `${PRELUDE}
const pg = await page('2 Components');
const old = upsertSet(pg, 'Field'); if (old) old.remove();
const STATES = ['Default', 'Focus', 'Error', 'Disabled'];
const comps = [];
for (const st of STATES) {
  const c = figma.createComponent(); c.name = 'State=' + st;
  c.layoutMode = 'VERTICAL'; c.resize(320, 10); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; // resize() first: it resets sizing modes
  c.setBoundVariable('itemSpacing', need('space/2')); c.fills = [];
  const label = await text('Email', 'Body/Small', 'color/fg'); label.name = 'Label'; c.appendChild(label);
  const box = figma.createAutoLayout('HORIZONTAL', { name: 'Input' });
  box.counterAxisAlignItems = 'CENTER'; box.counterAxisSizingMode = 'FIXED';
  c.appendChild(box); box.layoutSizingHorizontal = 'FILL';
  box.setBoundVariable('height', need('size/control-md')); bindPad(box, 'space/3'); bindRadius(box, 'radius/control');
  box.fills = [paint('color/surface')];
  box.strokes = [paint(st === 'Error' ? 'color/danger' : st === 'Focus' ? 'color/ring' : 'color/border-strong')];
  box.strokeWeight = st === 'Focus' ? 2 : 1; box.strokeAlign = 'INSIDE';
  const value = await text(st === 'Default' ? 'name@company.com' : 'mina@lumen.app', 'Body/Base', st === 'Default' ? 'color/fg-muted' : 'color/fg'); value.name = 'Value'; // placeholder still meets 4.5:1 (CO-05)
  box.appendChild(value);
  const hint = await text(st === 'Error' ? 'Enter an email like name@company.com' : 'We only use this for receipts.', 'Body/Small', st === 'Error' ? 'color/danger' : 'color/fg-muted');
  hint.name = st === 'Error' ? 'Error' : 'Hint'; c.appendChild(hint);
  hint.layoutSizingHorizontal = 'FILL'; hint.textAutoResize = 'HEIGHT';
  if (st === 'Disabled') c.opacity = 0.5;
  comps.push(c);
}
const set = figma.combineAsVariants(comps, pg);
set.name = 'Field';
set.description = 'Label above, hint or error below, linked with aria-describedby (CO-05, FE-01). Error = icon + text, never color alone. Code: <Field label hint error />.';
const lk = set.addComponentProperty('Label', 'TEXT', 'Email');
for (const c of set.children) { const t = c.findOne((n) => n.name === 'Label'); if (t) t.componentPropertyReferences = { characters: lk }; }
set.layoutMode = 'HORIZONTAL'; set.setBoundVariable('itemSpacing', need('space/6')); bindPad(set, 'space/6', 'space/6');
set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO'; set.fills = [paint('color/surface')]; bindRadius(set, 'radius/panel');
const prev = upsertSet(pg, 'Badge'); set.x = 0; set.y = (prev ? prev.y + prev.height : 0) + 80;
return { setId: set.id, variants: set.children.length };
`,

  card: `${PRELUDE}
const pg = await page('2 Components');
const prevCard = pg.findChild((n) => n.type === 'COMPONENT' && n.name === 'Card'); if (prevCard) prevCard.remove();
const c = figma.createComponent(); c.name = 'Card';
c.layoutMode = 'VERTICAL'; c.resize(360, 10); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
bindPad(c, 'space/6', 'space/6'); c.setBoundVariable('itemSpacing', need('space/2')); bindRadius(c, 'radius/card');
c.fills = [paint('color/surface')]; c.strokes = [paint('color/border')]; c.strokeWeight = 1; c.strokeAlign = 'INSIDE';
const es = await effectStyle('Shadow/Card'); if (es) await c.setEffectStyleIdAsync(es.id);
const title = await text('Smart triage', 'Heading/H3', 'color/fg'); title.name = 'Title'; c.appendChild(title);
const body = await text('New requests are tagged, sized and routed before anyone opens them.', 'Body/Base', 'color/fg-muted'); body.name = 'Body';
c.appendChild(body); body.layoutSizingHorizontal = 'FILL'; body.textAutoResize = 'HEIGHT';
const tk = c.addComponentProperty('Title', 'TEXT', 'Smart triage'); title.componentPropertyReferences = { characters: tk };
const bk = c.addComponentProperty('Body', 'TEXT', body.characters); body.componentPropertyReferences = { characters: bk };
c.description = 'Content surface: always opaque (chrome is the only translucent layer). Radius nests: inner = outer − padding (LC-04). Code: <Card><CardTitle/><CardText/></Card>.';
const prev = upsertSet(pg, 'Field'); c.x = 0; c.y = (prev ? prev.y + prev.height : 0) + 80;
return { componentId: c.id };
`,

  foundations: `${PRELUDE}
// Foundations specimen: semantic colors (bound), type ramp (styles), spacing and radius scales.
const pg = await page('1 Foundations');
for (const n of pg.children.filter((n) => n.name.startsWith('Foundations / '))) n.remove();
const sheet = figma.createAutoLayout('VERTICAL', { name: 'Foundations / Sheet' });
bindPad(sheet, 'space/16', 'space/16'); sheet.setBoundVariable('itemSpacing', need('space/12')); sheet.fills = [paint('color/bg')];
const section = async (title) => { const s = figma.createAutoLayout('VERTICAL', { name: 'Foundations / ' + title }); s.setBoundVariable('itemSpacing', need('space/4')); s.fills = []; sheet.appendChild(s); s.appendChild(await text(title, 'Heading/H2', 'color/fg')); return s; };
const colors = await section('Color');
const row = figma.createAutoLayout('HORIZONTAL', { name: 'Swatches', layoutWrap: 'WRAP' }); row.setBoundVariable('itemSpacing', need('space/4')); row.setBoundVariable('counterAxisSpacing', need('space/4')); row.fills = []; colors.appendChild(row); row.resize(1200, 10); row.counterAxisSizingMode = 'AUTO'; row.primaryAxisSizingMode = 'FIXED';
for (const name of ['bg', 'surface', 'surface-sunken', 'fg', 'fg-muted', 'border', 'border-strong', 'primary', 'primary-soft', 'accent', 'success', 'warning', 'danger', 'ring']) {
  if (!V['color/' + name]) continue;
  const sw = figma.createAutoLayout('VERTICAL', { name: 'Swatch / ' + name }); sw.setBoundVariable('itemSpacing', need('space/2')); sw.fills = [];
  const chip = figma.createRectangle(); chip.name = 'Chip'; chip.resize(136, 72); chip.fills = [paint('color/' + name)]; chip.strokes = [paint('color/border')]; chip.strokeWeight = 1;
  ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'].forEach((k) => chip.setBoundVariable(k, need('radius/control')));
  sw.appendChild(chip); sw.appendChild(await text(name, 'Body/Small', 'color/fg')); sw.appendChild(await text('var(--color-' + name + ')', 'Body/XSmall', 'color/fg-muted'));
  row.appendChild(sw);
}
const type = await section('Typography');
for (const s of (await figma.getLocalTextStylesAsync()).filter((s) => !s.name.startsWith('Control'))) {
  const t = await text(s.name + ' · ' + s.fontSize + '/' + Math.round(s.lineHeight.value || 0), s.name, 'color/fg'); type.appendChild(t);
}
const spacing = await section('Spacing');
for (const k of ['1', '2', '3', '4', '6', '8', '12', '16']) {
  if (!V['space/' + k]) continue;
  const r = figma.createAutoLayout('HORIZONTAL', { name: 'Space / ' + k }); r.counterAxisAlignItems = 'CENTER'; r.setBoundVariable('itemSpacing', need('space/4')); r.fills = [];
  const bar = figma.createRectangle(); bar.name = 'Bar'; bar.resize(10, 16); bar.setBoundVariable('width', need('space/' + k)); bar.fills = [paint('color/primary')];
  r.appendChild(bar); r.appendChild(await text('space/' + k, 'Body/Small', 'color/fg-muted')); spacing.appendChild(r);
}
const radii = await section('Radius');
const rr = figma.createAutoLayout('HORIZONTAL', { name: 'Radii' }); rr.setBoundVariable('itemSpacing', need('space/6')); rr.fills = []; radii.appendChild(rr);
for (const k of ['control', 'card', 'panel']) {
  const b = figma.createFrame(); b.name = 'Radius / ' + k; b.resize(120, 80); b.fills = [paint('color/surface-sunken')]; b.strokes = [paint('color/border-strong')]; b.strokeWeight = 1;
  ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'].forEach((x) => b.setBoundVariable(x, need('radius/' + k)));
  rr.appendChild(b);
}
sheet.x = 0; sheet.y = 0;
return { sheetId: sheet.id, sections: sheet.children.length };
`,

  review: `${PRELUDE}
// Review frame: instances of every component in Light and Dark side by side (definition of done).
const pg = await page('2 Components');
for (const n of pg.children.filter((n) => n.name.startsWith('Review / '))) n.remove();
const button = upsertSet(pg, 'Button'), badge = upsertSet(pg, 'Badge'), field = upsertSet(pg, 'Field');
const card = pg.findChild((n) => n.type === 'COMPONENT' && n.name === 'Card');
const maxX = Math.max(...pg.children.map((n) => n.x + n.width)) + 160;
const made = [];
for (const [i, modeName] of ['Light', 'Dark'].entries()) {
  const f = figma.createAutoLayout('VERTICAL', { name: 'Review / ' + modeName });
  bindPad(f, 'space/12', 'space/12'); f.setBoundVariable('itemSpacing', need('space/8')); f.fills = [paint('color/bg')];
  f.setExplicitVariableModeForCollection(col, col.modes.find((m) => m.name === modeName).modeId);
  f.appendChild(await text('Components · ' + modeName, 'Heading/H2', 'color/fg'));
  f.clipsContent = false;
  const rowB = figma.createAutoLayout('HORIZONTAL', { name: 'Buttons' }); rowB.setBoundVariable('itemSpacing', need('space/4')); rowB.fills = []; rowB.clipsContent = false; f.appendChild(rowB);
  for (const v of ['Solid', 'Outline', 'Ghost']) for (const st of ['Default', 'Focus', 'Disabled']) {
    const comp = button.children.find((n) => n.name === 'Variant=' + v + ', Size=MD, State=' + st); if (comp) rowB.appendChild(comp.createInstance());
  }
  const rowT = figma.createAutoLayout('HORIZONTAL', { name: 'Badges' }); rowT.setBoundVariable('itemSpacing', need('space/3')); rowT.fills = []; f.appendChild(rowT);
  for (const c of badge.children) rowT.appendChild(c.createInstance());
  const rowF = figma.createAutoLayout('HORIZONTAL', { name: 'Fields' }); rowF.setBoundVariable('itemSpacing', need('space/6')); rowF.fills = []; f.appendChild(rowF);
  for (const c of field.children) rowF.appendChild(c.createInstance());
  if (card) f.appendChild(card.createInstance());
  f.x = maxX + i * 1700; f.y = 0;
  made.push(f.id);
}
return { reviewFrames: made };
`,
};

const ORDER = ['pages', 'styles', 'button', 'badge', 'field', 'card', 'foundations', 'review'];

if (cmd === 'list') {
  ORDER.forEach((s, i) => console.log(`${i + 1}. ${s}`));
  console.log(`\nfont: ${font} (falls back to Inter if Figma lacks it) · trend: ${args.trend ?? config.trend}`);
} else if (cmd === 'step') {
  const name = /^\d+$/.test(which ?? '') ? ORDER[+which - 1] : which;
  if (!STEPS[name]) throw new Error(`unknown step ${which}; run: figma-library.mjs list`);
  process.stdout.write(`// web-design figma-library step: ${name}\n${STEPS[name]}`);
} else {
  console.log('usage: figma-library.mjs <list|step <n|name>> [--trend <id>] [--font <family>] [--title <cover title>]');
  process.exit(cmd ? 1 : 0);
}
