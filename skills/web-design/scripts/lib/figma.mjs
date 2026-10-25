// Token <-> Figma variable conversion shared by build-tokens and figma-sync.

import { toFigmaRGBA } from './color.mjs';
import { MODES, cssVar } from './tokens.mjs';

export const SCOPES = {
  color: (k) => (/[.-]fg\b|-text$/.test(k) ? ['TEXT_FILL'] : /border|ring/.test(k) ? ['STROKE_COLOR', 'EFFECT_COLOR'] : ['FRAME_FILL', 'SHAPE_FILL', 'EFFECT_COLOR']),
  radius: () => ['CORNER_RADIUS'],
  spacing: () => ['GAP', 'WIDTH_HEIGHT'],
  space: () => ['GAP'],
  size: () => ['WIDTH_HEIGHT'],
  font: () => ['FONT_FAMILY'],
  'font-weight': () => ['FONT_WEIGHT'],
  text: () => ['FONT_SIZE'],
  leading: () => ['LINE_HEIGHT'],
  tracking: () => ['LETTER_SPACING'],
};

/** One Figma variable for a token, or null if Figma cannot represent it. */
export function toVariable(k, t, res) {
  if (k.includes('--')) return null; // Tailwind sub-properties (line-height multipliers) have no Figma equivalent
  const values = {};
  let type;
  for (const m of MODES) {
    const v = res[m][k];
    const conv = convert(t.$type, v);
    if (!conv) return null;
    [type, values[m]] = conv;
  }
  const ns = k.split('.')[0];
  return { name: k.replace(/\./g, '/'), type, values, scopes: (SCOPES[ns] ?? (() => []))(k), web: `var(${cssVar(k)})` };
}

/** [figmaType, value] for a resolved token value, or null. */
export function convert(type, v) {
  if (v === undefined) return null;
  const s = String(v).trim();
  if (type === 'color') { try { return ['COLOR', toFigmaRGBA(s)]; } catch { return null; } }
  if (type === 'fontFamily') return ['STRING', (Array.isArray(v) ? v[0] : s.split(',')[0]).replace(/["']/g, '').trim()];
  if (type === 'fontWeight' || type === 'number') return Number.isFinite(+v) ? ['FLOAT', +v] : null;
  if (type === 'duration') {
    const m = s.match(/^([\d.]+)(ms|s)$/);
    return m ? ['TIMING', m[2] === 'ms' ? +m[1] / 1000 : +m[1]] : null;
  }
  if (type === 'cubicBezier') {
    const m = Array.isArray(v) ? v : s.match(/cubic-bezier\(([^)]+)\)/)?.[1].split(',').map(Number);
    return m && m.length === 4 ? ['EASING', { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: m[0], y1: m[1], x2: m[2], y2: m[3] } }] : null;
  }
  if (type === 'dimension') {
    const d = (s.match(/^clamp\([^,]+,[^,]+,\s*([^)]+)\)$/)?.[1] ?? s).trim();
    // em is relative to the element's own font size (tracking), which a Figma FLOAT
    // variable can't express; those values go into text styles as percentages instead.
    const m = d.match(/^(-?[\d.]+)(px|rem)?$/);
    if (!m) return null;
    return ['FLOAT', m[2] === 'rem' ? +m[1] * 16 : +m[1]];
  }
  return null;
}
