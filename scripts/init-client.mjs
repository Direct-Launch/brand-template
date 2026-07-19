#!/usr/bin/env node
/**
 * One-time setup after creating a repo from the template.
 *   node scripts/init-client.mjs "Griffin & Co Fine Jewellery"
 * Replaces {{CLIENT_NAME}} throughout and stamps the changelog.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const name = process.argv[2];
if (!name) { console.error('Usage: node scripts/init-client.mjs "Client Name"'); process.exit(1); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skip = new Set(['node_modules', '.git', 'dist', '.astro', 'assets']);
const exts = new Set(['.md', '.mdx', '.json', '.txt', '.yml', '.yaml']);
let changed = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(abs); continue; }
    if (!exts.has(path.extname(entry.name))) continue;
    const body = await readFile(abs, 'utf8');
    if (!body.includes('{{CLIENT_NAME}}')) continue;
    await writeFile(abs, body.replaceAll('{{CLIENT_NAME}}', name));
    console.log(`  updated  ${path.relative(root, abs)}`);
    changed++;
  }
}

await walk(root);
const today = new Date().toISOString().slice(0, 10);
const cl = path.join(root, 'CHANGELOG.md');
await writeFile(cl, (await readFile(cl, 'utf8')).replace('YYYY-MM-DD', today));
console.log(`\n${changed} file(s) updated for ${name}. Now fill in the TODOs.`);
