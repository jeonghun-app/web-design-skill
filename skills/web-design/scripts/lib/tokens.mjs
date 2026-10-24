// Token loading, merging and resolution shared by build, trend and check scripts.
//
// Token files follow the W3C Design Tokens (DTCG) shape: groups are plain objects,
// tokens are objects with `$value` (and optionally `$type`). Mode values live in
// `$extensions.mode.<name>` (only `dark` is used today). A token path such as
// color.bg becomes the CSS variable --color-bg and the Figma variable color/bg.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LIBRARY_TRENDS = path.join(SKILL_DIR, 'trends');
export const MODES = ['light', 'dark'];

// Top-level groups that are Tailwind v4 theme namespaces go inside @theme so they
// generate utilities. Everything else is emitted as plain custom properties.
export const THEME_NAMESPACES = new Set([
  'color', 'font', 'text', 'font-weight', 'tracking', 'leading', 'breakpoint',
  'container', 'spacing', 'radius', 'shadow', 'inset-shadow', 'drop-shadow',
  'blur', 'perspective', 'aspect', 'ease', 'animate',
]);

export function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeIfChanged(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false;
  fs.writeFileSync(file, content);
  return true;
}

const isToken = (node) => node && typeof node === 'object' && '$value' in node;

/** Flatten a DTCG tree into { 'color.bg': { $value, $type, modes: {dark} } }. */
export function flatten(tree, prefix = [], out = {}, inheritedType) {
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$')) continue;
    const p = [...prefix, key];
    const type = node?.$type ?? inheritedType;
    if (isToken(node)) {
      out[p.join('.')] = {
        $value: node.$value,
        $type: type,
        $description: node.$description,
        modes: { ...(node.$extensions?.mode ?? {}) },
      };
    } else if (node && typeof node === 'object') {
      flatten(node, p, out, type);
    }
  }
  return out;
}

/** Overlay trend tokens onto base. A trend that sets $value without a dark mode
 *  value also replaces the base dark value, unless it says `"dark": "inherit"`. */
export function overlay(base, over) {
  const out = structuredClone(base);
  for (const [k, t] of Object.entries(over)) {
    const prev = out[k];
    const modes = { ...t.modes };
    if (prev && !('dark' in modes)) modes.dark = t.$value;
    if (modes.dark === 'inherit') modes.dark = prev?.modes?.dark ?? prev?.$value;
    out[k] = { ...prev, ...t, $type: t.$type ?? prev?.$type, modes };
  }
  return out;
}

/** Resolve {color.x} aliases for one mode. Returns { 'color.bg': 'oklch(...)' }. */
export function resolveMode(flat, mode) {
  const raw = Object.fromEntries(
    Object.entries(flat).map(([k, t]) => [k, mode !== 'light' && t.modes?.[mode] !== undefined ? t.modes[mode] : t.$value]),
  );
  const seen = new Set();
  const resolve = (k) => {
    const v = raw[k];
    if (typeof v !== 'string') return v;
    if (seen.has(k)) throw new Error(`Alias cycle at ${k}`);
    seen.add(k);
    const r = v.replace(/\{([^}]+)\}/g, (_, ref) => {
      if (!(ref in raw)) throw new Error(`Unknown alias {${ref}} in ${k}`);
      return String(resolve(ref));
    });
    seen.delete(k);
    return r;
  };
  return Object.fromEntries(Object.keys(raw).map((k) => [k, resolve(k)]));
}

export const cssVar = (k) => `--${k.replace(/\./g, '-')}`;

/** Value as it should appear in CSS. Aliases become var() references so that
 *  overriding a primitive in a trend cascades to every semantic token using it. */
export function cssValue(v) {
  if (Array.isArray(v)) return v.map((x) => (/\s/.test(x) && !/[(,]/.test(x) ? `"${x}"` : x)).join(', ');
  if (typeof v === 'number') return String(v);
  return String(v).replace(/\{([^}]+)\}/g, (_, ref) => `var(${cssVar(ref)})`);
}

export function projectPaths(root) {
  const design = path.join(root, 'design');
  return {
    root,
    design,
    tokens: path.join(design, 'tokens.json'),
    config: path.join(design, 'web-design.config.json'),
    trends: path.join(design, 'trends'),
    cssOut: path.join(root, 'src', 'design', 'tokens.css'),
    figmaOut: path.join(design, 'build', 'figma-variables.json'),
    resolvedOut: path.join(design, 'build', 'tokens.resolved.json'),
  };
}

export function readConfig(root) {
  const p = projectPaths(root);
  const cfg = fs.existsSync(p.config) ? readJSON(p.config) : {};
  return { trend: 'none', include: 'all', ...cfg };
}

/** Trend packs: the project's own design/trends wins over the skill library. */
export function listTrends(root) {
  const own = projectPaths(root).trends;
  // In a vendored project (new-project.mjs) the library *is* design/trends.
  const dirs = [...new Set([own, LIBRARY_TRENDS])];
  const found = new Map();
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const id of fs.readdirSync(dir).sort()) {
      const pack = path.join(dir, id, 'pack.json');
      if (!found.has(id) && fs.existsSync(pack)) found.set(id, { id, dir: path.join(dir, id), source: dir === own ? 'project' : 'library' });
    }
  }
  return [...found.values()];
}

export function loadTrend(entry) {
  const pack = readJSON(path.join(entry.dir, 'pack.json'));
  const cssFile = path.join(entry.dir, 'pack.css');
  return { ...entry, pack, css: fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf8') : '' };
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) args[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) args[k] = argv[++i];
      else args[k] = true;
    } else args._.push(a);
  }
  return args;
}
