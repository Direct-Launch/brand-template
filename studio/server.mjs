#!/usr/bin/env node
/**
 * Brand Studio — a local editor and visualiser for a brand repository.
 *
 * Zero dependencies. Reads and writes the repository files directly, so
 * anything changed here is a normal file change you review with `git diff`
 * and commit yourself. Nothing is pushed, nothing is hosted.
 *
 *   node studio/server.mjs            → http://localhost:4321
 *   node studio/server.mjs --port 5000
 *
 * Binds to 127.0.0.1 only. Do not expose it — it has unauthenticated write
 * access to the repository it is run from.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const portArg = process.argv.indexOf('--port');
const PORT = portArg > -1 ? Number(process.argv[portArg + 1]) : 4321;

const EDITABLE_DIRS = ['business', 'identity', 'foundations', 'web', 'legal'];
const OK_EXT = new Set(['.md', '.json']);

/** Reject anything that escapes the repo or isn't a document. */
function safePath(rel) {
  if (!rel || rel.includes('\0')) return null;
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(ROOT + path.sep)) return null;
  if (!OK_EXT.has(path.extname(abs))) return null;
  return abs;
}

async function listFiles() {
  const out = [];
  for (const dir of EDITABLE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const name of (await readdir(abs)).filter((n) => n.endsWith('.md')).sort()) {
      const rel = `${dir}/${name}`;
      const body = await readFile(path.join(abs, name), 'utf8');
      const title = body.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? name;
      const todos = (body.match(/TODO/g) ?? []).length;
      out.push({ path: rel, dir, title, todos });
    }
  }
  return out;
}

async function script(name, args = []) {
  try {
    const { stdout, stderr } = await run(process.execPath, [path.join(ROOT, 'scripts', name), ...args], { cwd: ROOT });
    return { code: 0, output: (stdout + stderr).trim() };
  } catch (e) {
    return { code: e.code ?? 1, output: ((e.stdout ?? '') + (e.stderr ?? '')).trim() };
  }
}

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

async function body(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await readFile(path.join(here, 'index.html'), 'utf8');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (url.pathname === '/api/state') {
      return json(res, 200, {
        root: ROOT,
        config: JSON.parse(await readFile(path.join(ROOT, 'brand.config.json'), 'utf8')),
        tokens: JSON.parse(await readFile(path.join(ROOT, 'brand.json'), 'utf8')),
        files: await listFiles(),
      });
    }

    if (url.pathname === '/api/file' && req.method === 'GET') {
      const abs = safePath(url.searchParams.get('path'));
      if (!abs || !existsSync(abs)) return json(res, 404, { error: 'Not found' });
      return json(res, 200, { content: await readFile(abs, 'utf8') });
    }

    if (url.pathname === '/api/file' && req.method === 'PUT') {
      const { path: rel, content } = await body(req);
      const abs = safePath(rel);
      if (!abs) return json(res, 400, { error: 'Refused: path outside repository' });
      await writeFile(abs, content);
      return json(res, 200, { saved: rel });
    }

    if (url.pathname === '/api/tokens' && req.method === 'PUT') {
      const { tokens } = await body(req);
      await writeFile(path.join(ROOT, 'brand.json'), JSON.stringify(tokens, null, 2) + '\n');
      const built = await script('build-tokens.mjs');
      return json(res, 200, { saved: 'brand.json', built: built.output });
    }

    if (url.pathname === '/api/validate') return json(res, 200, await script('validate-brand.mjs'));
    if (url.pathname === '/api/contrast') return json(res, 200, await script('check-contrast.mjs'));

    if (url.pathname === '/api/git') {
      try {
        const { stdout } = await run('git', ['status', '--porcelain'], { cwd: ROOT });
        return json(res, 200, { changes: stdout.trim().split('\n').filter(Boolean) });
      } catch {
        return json(res, 200, { changes: [], error: 'not a git repository' });
      }
    }

    json(res, 404, { error: 'Unknown endpoint' });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Brand Studio → http://localhost:${PORT}`);
  console.log(`  Editing: ${ROOT}`);
  console.log(`  Changes are written to disk. Review with 'git diff' before committing.\n`);
});
