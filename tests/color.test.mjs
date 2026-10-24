import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contrast, parseColor, toHex, toFigmaRGBA } from '../skills/web-design/scripts/lib/color.mjs';

test('parses hex, rgb and oklch', () => {
  assert.equal(toHex('#fff'), '#ffffff');
  assert.equal(toHex('rgb(255, 0, 0)'), '#ff0000');
  assert.equal(toHex('oklch(1 0 0)'), '#ffffff');
  assert.equal(toHex('oklch(0 0 0)'), '#000000');
  assert.equal(parseColor('oklch(0.5 0.1 200 / 0.5)').a, 0.5);
});

test('relative oklch derives from its origin', () => {
  const base = parseColor('oklch(0.55 0.2 264)');
  const darker = parseColor('oklch(from oklch(0.55 0.2 264) calc(l - 0.1) c h)');
  assert.ok(darker.r + darker.g + darker.b < base.r + base.g + base.b);
  assert.equal(toHex('oklch(from #000000 1 0 h)'), '#ffffff');
});

test('WCAG contrast matches known values', () => {
  assert.equal(contrast('#000', '#fff').toFixed(1), '21.0');
  assert.equal(contrast('#777', '#fff').toFixed(2), '4.48');
});

test('translucent backgrounds are composited over the backdrop', () => {
  // 50% black over white is mid grey, so black text on it loses contrast.
  const solid = contrast('#000', '#fff');
  const glass = contrast('#000', 'rgba(0, 0, 0, 0.5)', '#fff');
  assert.ok(glass < solid);
});

test('figma rgba stays in 0..1', () => {
  const c = toFigmaRGBA('oklch(0.7 0.3 140)');
  for (const k of ['r', 'g', 'b', 'a']) assert.ok(c[k] >= 0 && c[k] <= 1);
});
