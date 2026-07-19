#!/usr/bin/env node
/**
 * Copies the published brand folders into the Starlight content directory.
 * The Markdown at the repo root is the source of truth; site/src/content/docs
 * is a build artifact and is gitignored.
 *
 * Which folders get published is controlled by brand.config.json.
 */
import { readFile, mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'site', 'src', 'content', 'docs');

const config = JSON.parse(await readFile(path.join(root, 'brand.config.json'), 'utf8'));
const { publish = [], exclude = [] } = config.site ?? {};

await rm(docs, { recursive: true, force: true });
await mkdir(docs, { recursive: true });

const isExcluded = (rel) =>
  exclude.some((e) => rel === e || rel.startsWith(e.endsWith('/') ? e : `${e}/`));

for (const folder of publish) {
  if (isExcluded(folder) || !existsSync(path.join(root, folder))) continue;
  await cp(path.join(root, folder), path.join(docs, folder), {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(root, src).split(path.sep).join('/');
      return !isExcluded(rel);
    },
  });
  console.log(`  published  ${folder}/`);
}

for (const e of exclude) console.log(`  withheld   ${e}`);

const index = `---
title: ${config.site?.title ?? 'Brand Toolkit'}
description: ${config.site?.description ?? ''}
template: splash
hero:
  tagline: ${config.site?.description ?? ''}
  actions:
    - text: Voice and tone
      link: /identity/voice-and-tone/
      icon: right-arrow
    - text: Colour
      link: /foundations/colour/
      variant: minimal
---

## Start here

- **[Brand attributes](/identity/attributes/)** — what this brand is, in principle
- **[Voice and tone](/identity/voice-and-tone/)** — how it speaks
- **[Colour](/foundations/colour/)** and **[Typography](/foundations/typography/)** — how it looks
- **[Accessibility](/foundations/accessibility/)** — the floor, not the ceiling

Maintained by ${config.maintainer ?? 'Direct Launch'}. Source of truth is the
Markdown in this repository — edit there, not here.
`;
await writeFile(path.join(docs, 'index.md'), index);
console.log('\nContent synced.');
