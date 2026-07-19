#!/usr/bin/env node
/**
 * Prepares the Starlight site from the repository's source files.
 *
 *   1. Copies published folders into site/src/content/docs
 *   2. Copies assets/ into site/public/assets so logos and fonts resolve
 *   3. Generates a full token reference page from brand.json
 *   4. Generates the homepage from brand.config.json
 *
 * Everything it writes is a build artifact and is gitignored. The Markdown at
 * the repo root remains the single source of truth.
 */
import { readFile, mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'site', 'src', 'content', 'docs');
const pub = path.join(root, 'site', 'public');

const config = JSON.parse(await readFile(path.join(root, 'brand.config.json'), 'utf8'));
const { publish = [], exclude = [], title, description } = config.site ?? {};

await rm(docs, { recursive: true, force: true });
await mkdir(docs, { recursive: true });

const isExcluded = (rel) =>
  exclude.some((e) => rel === e || rel.startsWith(e.endsWith('/') ? e : `${e}/`));

for (const folder of publish) {
  if (isExcluded(folder) || !existsSync(path.join(root, folder))) continue;
  await cp(path.join(root, folder), path.join(docs, folder), {
    recursive: true,
    filter: (src) => !isExcluded(path.relative(root, src).split(path.sep).join('/')),
  });
  console.log(`  published  ${folder}/`);
}
for (const e of exclude) console.log(`  withheld   ${e}`);

/* --- assets: logos, fonts, approved photography --- */
if (existsSync(path.join(root, 'assets'))) {
  await rm(path.join(pub, 'assets'), { recursive: true, force: true });
  await mkdir(pub, { recursive: true });
  await cp(path.join(root, 'assets'), path.join(pub, 'assets'), { recursive: true });
  console.log('  copied     assets/ → site/public/assets/');
}

/* --- generated token reference --- */
await writeFile(
  path.join(docs, 'tokens.md'),
  `---
title: All tokens
description: Every design token, its CSS variable, value, and usage rule. Generated from brand.json.
---

Generated from \`brand.json\` on every build. If something here is wrong, fix
the JSON — not this page.

## Colour

\`\`\`palette
group: colour
\`\`\`

## Contrast matrix

\`\`\`contrast
\`\`\`

## Type

\`\`\`type-scale
\`\`\`

## Spacing

\`\`\`spacing
\`\`\`

## Full reference

\`\`\`tokens
\`\`\`
`
);

/* --- homepage --- */
const hero = config.site?.theme?.heroImage
  ? `  image:\n    file: ../../assets/${config.site.theme.heroImage}\n`
  : '';

await writeFile(
  path.join(docs, 'index.md'),
  `---
title: ${title ?? 'Brand Toolkit'}
description: ${description ?? ''}
template: splash
hero:
  tagline: ${description ?? ''}
${hero}  actions:
    - text: Start with voice
      link: ./identity/voice-and-tone/
      icon: right-arrow
    - text: Colour and type
      link: ./foundations/colour/
      variant: minimal
---

## The short version

\`\`\`palette
group: colour
\`\`\`

## Where to go next

- **[Brand attributes](./identity/attributes/)** — what this brand is, in principle
- **[Voice and tone](./identity/voice-and-tone/)** — how it speaks, with examples
- **[Colour](./foundations/colour/)** · **[Typography](./foundations/typography/)** · **[Logo](./foundations/logo/)**
- **[Accessibility](./foundations/accessibility/)** — the floor, not the ceiling
- **[All tokens](./tokens/)** — the machine-readable reference

Maintained by ${config.maintainer ?? 'Direct Launch'}. The source of truth is the
Markdown in this repository — edit there, not here.
`
);

console.log('\nContent synced.');
