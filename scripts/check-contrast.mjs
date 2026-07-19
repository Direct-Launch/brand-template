#!/usr/bin/env node
/**
 * Reports every colour pairing in brand.json against WCAG 2.2.
 * Used by the brand-editor skill after any colour change.
 *   node scripts/check-contrast.mjs [--fail-under 4.5]
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flatten, contrast, verdict, isHex } from './lib/tokens.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flat = flatten(JSON.parse(await readFile(path.join(root, 'brand.json'), 'utf8')));
const i = process.argv.indexOf('--fail-under');
const floor = i > -1 ? Number(process.argv[i + 1]) : null;

const colours = Object.entries(flat)
  .filter(([, t]) => t.$type === 'color' && isHex(t.$value))
  .map(([k, t]) => [k.split('.').pop(), t.$value]);

const rows = [];
for (const [fg, fgv] of colours)
  for (const [bg, bgv] of colours)
    if (fg !== bg && !rows.some((r) => r.fg === bg && r.bg === fg))
      rows.push({ fg, bg, ratio: contrast(fgv, bgv) });

rows.sort((a, b) => b.ratio - a.ratio);

let failed = 0;
for (const r of rows) {
  const v = verdict(r.ratio);
  if (floor && r.ratio < floor) failed++;
  const mark = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' }[v.level];
  console.log(
    `  ${mark.padEnd(5)} ${r.fg.padEnd(11)} on ${r.bg.padEnd(11)} ${r.ratio.toFixed(2).padStart(6)}:1  ${v.label} — ${v.note}`
  );
}

console.log(`\n${rows.length} pairing(s) checked.`);
if (failed) {
  console.error(`${failed} below the ${floor}:1 floor.`);
  process.exit(1);
}
