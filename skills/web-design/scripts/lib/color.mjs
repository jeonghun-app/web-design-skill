// Color parsing and contrast math with no dependencies.
// Supports #rgb, #rrggbb, #rrggbbaa, rgb()/rgba(), and oklch(L C H [/ a]).

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  if (s.startsWith('oklch(from ')) return parseRelativeOklch(s);
  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
  }
  let m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: parseAlpha(m[4]) };
  }
  m = s.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : +m[1];
    return { ...oklchToSrgb(L, +m[2], +m[3]), a: parseAlpha(m[4]) };
  }
  throw new Error(`Unsupported color: ${input}`);
}

// oklch(from <color> L C H [/ a]) where each channel is a number, the channel
// keyword (l, c, h) or calc() over them. Enough for derived hover/soft tokens.
function parseRelativeOklch(s) {
  const inner = s.slice('oklch(from '.length, -1).trim();
  let depth = 0, i = 0;
  for (; i < inner.length; i++) {
    if (inner[i] === '(') depth++;
    else if (inner[i] === ')') depth--;
    else if (inner[i] === ' ' && depth === 0) break;
  }
  const originStr = inner.slice(0, i);
  const origin = originStr.startsWith('oklch(') && !originStr.startsWith('oklch(from')
    ? originStr.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/).slice(1).map((x, j) => (j === 0 && x.endsWith('%') ? parseFloat(x) / 100 : +x))
    : srgbToOklch(parseColor(originStr));
  const env = { l: origin[0], c: origin[1], h: origin[2] };
  const rest = inner.slice(i).trim();
  const [chan, alpha] = rest.split('/').map((x) => x.trim());
  const parts = chan.match(/calc\([^)]*\)|\S+/g);
  const evalPart = (p) => {
    const expr = p.replace(/^calc\(|\)$/g, '').replace(/\b([lch])\b/g, (_, k) => String(env[k]));
    if (!/^[\d.\s+\-*/()]+$/.test(expr)) throw new Error(`Unsupported relative channel: ${p}`);
    return Function(`return (${expr})`)();
  };
  const [L, C, H] = parts.map(evalPart);
  return { ...oklchToSrgb(L, C, H), a: alpha ? parseAlpha(alpha) : 1 };
}

export function srgbToOklch({ r, g, b }) {
  const lin = [r, g, b].map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]);
  const m = Math.cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]);
  const s = Math.cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return [L, C, H];
}

function parseAlpha(a) {
  if (a === undefined) return 1;
  return a.endsWith('%') ? parseFloat(a) / 100 : +a;
}

export function oklchToSrgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const enc = (x) => clamp01(x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  const [r, g, bb] = lin.map(enc);
  return { r, g, b: bb };
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function luminance({ r, g, b }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Composite a (possibly translucent) foreground over an opaque background. */
export function over(fg, bg) {
  const a = fg.a ?? 1;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

export function contrast(fgInput, bgInput, backdropInput = '#ffffff') {
  const backdrop = parseColor(backdropInput);
  const bg = over(parseColor(bgInput), backdrop);
  const fg = over(parseColor(fgInput), bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function toFigmaRGBA(input) {
  const { r, g, b, a } = parseColor(input);
  const round = (x) => Math.round(x * 10000) / 10000;
  return { r: round(r), g: round(g), b: round(b), a: round(a ?? 1) };
}

export function toHex(input) {
  const { r, g, b, a } = parseColor(input);
  const h = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a) : ''}`;
}
