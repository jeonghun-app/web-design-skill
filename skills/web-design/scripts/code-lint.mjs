#!/usr/bin/env node
// Static design-discipline lint for a React + Tailwind v4 project.
// Catches what the browser audit can't see early: raw values that bypass tokens,
// removed focus, pointer-down actions, non-semantic clickables, missing alt/size.
//
//   code-lint.mjs [--root <project>] [--json]
//
// Scans src/** and app/** (Next.js routes) for .tsx/.ts/.jsx/.js/.css, plus index.html.
// Generated token files are skipped.
// Suppress a deliberate case on that line with: // design-lint-allow CL-xx <reason>
// Exit 1 when any error (E) is found.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from './lib/tokens.mjs';

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root ?? process.cwd());

export const RULES = {
  'CL-01': ['E', 'Raw color literal outside the token files', 'Use a semantic token (bg-primary, text-fg-muted, var(--color-…)).'],
  'CL-02': ['E', 'Tailwind default palette class (silently ignored: the palette is removed)', 'Use a semantic color utility.'],
  'CL-03': ['E', 'Arbitrary value for a token-governed property', 'Use the scale: text-*, p-*/gap-* (4px), rounded-*, z-(--layer-*).'],
  'CL-04': ['E', 'Focus outline removed without a focus-visible replacement (FK-01)', 'Keep the global :focus-visible ring or add focus-visible:outline-*.'],
  'CL-05': ['E', 'Action on pointer down (MO-11): fires before the user can slide off to cancel', 'Use onClick (fires on pointer up).'],
  'CL-06': ['E', 'Positive tabIndex breaks the natural focus order (FK-04)', 'Use tabIndex 0 or -1 and fix the DOM order.'],
  'CL-07': ['E', 'Image without alt (CO / IL-10)', 'Add alt="" for decorative images or a description for informative ones.'],
  'CL-08': ['W', 'Image without width/height or aspect ratio (MO-14 layout shift)', 'Set width and height, or an aspect-* / size-* class.'],
  'CL-09': ['E', 'Click handler on a non-interactive element without a role', 'Use <button> or <a href>; native elements get keyboard support for free.'],
  'CL-10': ['E', 'Zoom disabled in the viewport meta (TY-05)', 'Remove user-scalable=no / maximum-scale.'],
  'CL-11': ['W', 'Transition on a layout property (MT-06)', 'Animate transform/opacity (translate, scale) instead.'],
  'CL-12': ['W', 'dangerouslySetInnerHTML', 'Render structured content; if unavoidable, sanitize and document why.'],
  'CL-13': ['W', 'Raw z-index above the local range', 'Use the layer tokens: z-(--layer-sticky|modal|popover|toast|tooltip).'],
};

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'audit', 'baseline']);
const SKIP_FILES = [/src[\\/]design[\\/]/, /\.test\.[jt]sx?$/, /\.figma\.tsx?$/];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (/\.(tsx|ts|jsx|js|css)$/.test(e.name) && !SKIP_FILES.some((r) => r.test(p))) out.push(p);
  }
  return out;
}

const PALETTE = 'slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
const COLOR_UTIL = 'bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|divide|placeholder|caret|accent|shadow';

// The text of a JSX opening tag starting at lines[i][col], across lines. Skips {…} expressions
// and quoted strings, so `onLoad={() => x}` doesn't end the tag at its `>`.
function tagText(lines, i, col) {
  let out = '', depth = 0, quote = null;
  for (let j = i; j < lines.length && j < i + 40; j++) {
    const l = j === i ? lines[j].slice(col) : lines[j];
    for (let k = 0; k < l.length; k++) {
      const c = l[k];
      out += c;
      if (quote) { if (c === quote) quote = null; continue; }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && k > 0) return out;
    }
    out += ' ';
  }
  return out;
}

export function lintSource(file, src) {
  const findings = [];
  const isCss = file.endsWith('.css');
  const lines = src.split('\n');
  const add = (id, i, snippet) => {
    // An allow comment on the same line or within the 3 lines above suppresses the finding.
    const allow = new RegExp(`design-lint-allow\\s+${id}\\b`);
    if (lines.slice(Math.max(0, i - 3), i + 1).some((l) => allow.test(l))) return;
    findings.push({ id, file, line: i + 1, snippet: snippet.trim().slice(0, 120) });
  };
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    // CL-01 raw colors (data: URIs and url-encoded SVG are allowed)
    const noData = code.replace(/url\(["']?data:[^)]*\)/g, '');
    // Only valid hex lengths, and not a fragment link (href="#fade" is an id, not a color).
    const hex = noData.replace(/\bhref=(["'`{]+)#[\w-]*/g, '').match(/(?<![\w&#-])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i);
    if (hex && /['"`:\s(,]$/.test(noData.slice(0, hex.index) || ' ')) add('CL-01', i, line);
    if (/\b(rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[\d.]/i.test(noData)) add('CL-01', i, line);
    if (!isCss) {
      if (new RegExp(`(?<![\\w-])(?:[a-z-]+:)*(?:${COLOR_UTIL})-(?:${PALETTE})(?:-\\d{2,3})?(?:/\\d+)?(?![\\w-])`).test(code)) add('CL-02', i, line);
      if (/(?<![\w-])(?:[a-z-]+:)*(?:text|p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy]|rounded(?:-[a-z]+)?|leading|tracking)-\[\d+(?:\.\d+)?px\]/.test(code)) add('CL-03', i, line);
      if (/(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|fill|stroke)-\[(?:#|rgb|hsl|oklch)/i.test(code)) add('CL-03', i, line);
      if (/(?<![\w-])(?:[a-z-]+:)*z-\[\d+\]/.test(code)) add('CL-03', i, line);
      if (/(?<![\w-])(?:[a-z-]+:)*z-([2-9]\d|\d{3,})(?![\w-])/.test(code)) add('CL-13', i, line);
      if (/(?<![\w:-])(?:focus:)?outline-none\b/.test(code) && !/focus-visible:/.test(code)) add('CL-04', i, line);
      // Drag, resize and pan legitimately start on pointer down; judge by the handler, not the whole line.
      for (const h of code.matchAll(/\bon(?:MouseDown|PointerDown|TouchStart)=\{([^}]*)\}?/g)) {
        if (!/drag|resize|pan(?![a-z])/i.test(h[1])) { add('CL-05', i, line); break; }
      }
      if (/tabIndex=\{?["']?([1-9]\d*)/.test(code)) add('CL-06', i, line);
      const open = code.match(/<(img|div|span|li|p|section|article|svg)\b/);
      if (open) {
        const tag = tagText(lines, i, code.indexOf(open[0]));
        if (open[1] === 'img') {
          if (!/\balt=/.test(tag)) add('CL-07', i, line);
          if (!(/\bwidth=/.test(tag) && /\bheight=/.test(tag)) && !/aspect-|size-|\bfill\b/.test(tag)) add('CL-08', i, line);
        }
        if (/\bonClick=/.test(tag) && !/\brole=/.test(tag)) add('CL-09', i, line);
      }
      // CL-10 for Next.js: the viewport export instead of a meta tag.
      if (/\bmaximumScale\s*:\s*(0?\.\d+|1(\.0+)?)\b|\buserScalable\s*:\s*false\b/.test(code)) add('CL-10', i, line);
      if (/transition-\[[^\]]*\b(width|height|top|left|right|bottom|margin|padding)\b/.test(code) || /transition-(?:all|\[all\])/.test(code) && /hover:(?:w|h|p|m)-/.test(code)) add('CL-11', i, line);
      if (/dangerouslySetInnerHTML/.test(code)) add('CL-12', i, line);
    } else {
      if (/outline:\s*(none|0)\b/.test(code)) {
        const block = lines.slice(Math.max(0, i - 3), i + 1).join(' ');
        if (!/focus-visible/.test(block)) add('CL-04', i, line);
      }
      if (/transition(?:-property)?:[^;]*\b(width|height|top|left|margin)\b/.test(code)) add('CL-11', i, line);
    }
  });
  return findings;
}

export function lintProject(dir) {
  const files = [...walk(path.join(dir, 'src')), ...walk(path.join(dir, 'app'))];
  const findings = files.flatMap((f) => lintSource(path.relative(dir, f), fs.readFileSync(f, 'utf8')));
  const html = path.join(dir, 'index.html');
  if (fs.existsSync(html)) {
    const src = fs.readFileSync(html, 'utf8');
    const meta = src.match(/<meta[^>]+name=["']viewport["'][^>]*>/i)?.[0] ?? '';
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*(0?\.\d+|1(\.0+)?)\b/i.test(meta)) findings.push({ id: 'CL-10', file: 'index.html', line: src.slice(0, src.indexOf(meta)).split('\n').length, snippet: meta });
  }
  return findings;
}

function report(findings) {
  const errors = findings.filter((f) => RULES[f.id][0] === 'E').length;
  const lines = [`# Code lint (design discipline)`, '', `${findings.length} findings · **${errors} E**`, ''];
  for (const f of findings.sort((a, b) => a.id.localeCompare(b.id) || a.file.localeCompare(b.file) || a.line - b.line)) {
    const [sev, title, fix] = RULES[f.id];
    lines.push(`- **${sev} ${f.id}** ${f.file}:${f.line} — ${title}. ${fix}\n  \`${f.snippet}\``);
  }
  if (!findings.length) lines.push('No findings.');
  return { text: lines.join('\n'), errors };
}

// pathToFileURL: a plain file:// string differs on Windows and for paths with spaces or Hangul.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = lintProject(root);
  if (args.json) console.log(JSON.stringify(findings, null, 2));
  else console.log(report(findings).text);
  process.exit(report(findings).errors ? 1 : 0);
}
