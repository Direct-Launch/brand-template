#!/usr/bin/env node
/**
 * Fails CI if the brand repository is incomplete.
 * Run with --strict to also fail on leftover TODO placeholders.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const errors = [];
const warnings = [];

const config = JSON.parse(await readFile(path.join(root, 'brand.config.json'), 'utf8'));

// 1. Required files exist and have substance
for (const rel of config.required ?? []) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) { errors.push(`Missing required file: ${rel}`); continue; }
  const body = await readFile(abs, 'utf8');
  if (body.trim().length < 200) errors.push(`${rel} is effectively empty`);
  const todos = (body.match(/TODO/g) ?? []).length;
  if (todos > 0) (strict ? errors : warnings).push(`${rel} has ${todos} unfilled TODO(s)`);
}

// 2. Tokens parse and are not placeholders
try {
  const raw = await readFile(path.join(root, 'brand.json'), 'utf8');
  const tokens = JSON.parse(raw);
  const walk = (node, trail = []) => {
    if (node && typeof node === 'object') {
      if ('$value' in node) {
        const v = JSON.stringify(node.$value);
        if (/TODO/.test(v) || v === '"#000000"')
          (strict ? errors : warnings).push(`Placeholder token: ${trail.join('.')}`);
        if (node.$type === 'color' && !node.$description)
          warnings.push(`Colour token ${trail.join('.')} has no $description usage rule`);
      } else {
        for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) walk(v, [...trail, k]);
      }
    }
  };
  walk(tokens);
} catch (e) {
  errors.push(`brand.json does not parse: ${e.message}`);
}

// 3. Client name placeholder left in
for (const rel of ['README.md', 'AGENTS.md', 'llms.txt', 'brand.config.json']) {
  if (existsSync(path.join(root, rel))) {
    const body = await readFile(path.join(root, rel), 'utf8');
    if (body.includes('{{CLIENT_NAME}}')) errors.push(`${rel} still contains {{CLIENT_NAME}}`);
  }
}

for (const w of warnings) console.log(`  warning  ${w}`);
for (const e of errors) console.error(`  ERROR    ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s). Brand repository is not ready for agent use.`);
  process.exit(1);
}
console.log(`\nValidation passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.`);
