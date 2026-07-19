#!/usr/bin/env node
/**
 * Generates site/src/styles/tokens.css from brand.json.
 *
 * Emits three things:
 *   1. --brand-* custom properties for every token
 *   2. Starlight variable overrides, so the toolkit site *is* the brand
 *   3. @font-face or webfont imports declared in brand.config.json
 *
 * Never edit tokens.css by hand — it is regenerated on every build.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flatten, cssVarName, cssValue, contrast, isHex } from './lib/tokens.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(await readFile(path.join(root, 'brand.json'), 'utf8'));
const config = JSON.parse(await readFile(path.join(root, 'brand.config.json'), 'utf8'));
const theme = config.site?.theme ?? {};
const flat = flatten(tokens);

const vars = Object.entries(flat)
  .map(([p, t]) => `  ${cssVarName(p)}: ${cssValue(t)};`)
  .join('\n');

const hex = (p) => (isHex(flat[p]?.$value) ? flat[p].$value : null);
const primary = hex('colour.primary') ?? '#000000';
const paper = hex('colour.paper') ?? '#ffffff';
const ink = hex('colour.ink') ?? '#111111';

/* Starlight's accent needs to stay legible on its own backgrounds, so derive
   light/dark variants rather than assuming the brand colour works everywhere. */
const mix = (c, target, amount) =>
  `color-mix(in srgb, ${c} ${100 - amount}%, ${target} ${amount}%)`;

const onDarkOK = contrast(primary, '#000000') >= 4.5;

const imports = (theme.webfonts ?? []).map((u) => `@import url("${u}");`).join('\n');
const faces = (theme.fontFaces ?? [])
  .map(
    (f) => `@font-face {
  font-family: "${f.family}";
  src: url("${f.src}") format("${f.format ?? 'woff2'}");
  font-weight: ${f.weight ?? 400};
  font-style: ${f.style ?? 'normal'};
  font-display: swap;
}`
  )
  .join('\n\n');

const css = `/* GENERATED FROM brand.json — do not edit. Run: npm run tokens */
${imports}

${faces}

:root {
${vars}
}

/* --- Starlight theming: the toolkit renders in the client's own brand --- */

:root {
  --sl-color-accent: ${primary};
  --sl-color-accent-low: ${mix(primary, paper, 82)};
  --sl-color-accent-high: ${mix(primary, ink, 30)};
  --sl-color-white: ${paper};
  --sl-color-gray-7: ${mix(paper, ink, 4)};
  --sl-color-text-accent: ${primary};
  --sl-font: var(${cssVarName('font.body')}, system-ui, sans-serif);
  --sl-font-system: var(--sl-font);
}

:root[data-theme='light'] {
  --sl-color-bg: ${paper};
  --sl-color-bg-nav: ${mix(paper, ink, 3)};
  --sl-color-bg-sidebar: ${paper};
  --sl-color-text: ${ink};
  --sl-color-white: ${ink};
  --sl-color-accent: ${primary};
  --sl-color-accent-low: ${mix(primary, paper, 85)};
  --sl-color-hairline-shade: ${mix(ink, paper, 88)};
}

:root[data-theme='dark'] {
  --sl-color-accent: ${onDarkOK ? mix(primary, paper, 45) : primary};
  --sl-color-accent-low: ${mix(primary, ink, 55)};
}

/* Headings use the display face; body text stays on the body face. */
.sl-markdown-content h1,
.sl-markdown-content h2,
.sl-markdown-content h3,
.sl-markdown-content h4,
.site-title,
.hero h1 {
  font-family: var(${cssVarName('font.heading')}, Georgia, serif);
  font-weight: var(${cssVarName('fontWeight.regular')}, 400);
  letter-spacing: -0.01em;
}

.sl-markdown-content {
  font-family: var(${cssVarName('font.body')}, system-ui, sans-serif);
}
`;

await mkdir(path.join(root, 'site', 'src', 'styles'), { recursive: true });
await writeFile(path.join(root, 'site', 'src', 'styles', 'tokens.css'), css);
console.log(`  tokens.css written — ${Object.keys(flat).length} tokens`);
