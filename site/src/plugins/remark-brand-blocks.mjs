/**
 * Turns plain fenced code blocks into live visual specimens.
 *
 * The point of doing it this way: the source Markdown stays readable to an AI
 * agent reading the raw file from GitHub (it sees a legible key/value block),
 * while a human reading the site sees a rendered swatch, specimen, or example
 * card. One source of truth, two audiences.
 *
 *     ```palette
 *     group: colour
 *     ```
 *
 * Supported: palette, swatch, contrast, type-scale, specimen, spacing,
 * dodont, logo, tokens.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { flatten, cssVarName, contrast, verdict, isHex } from '../../../scripts/lib/tokens.mjs';

const ROOT = path.resolve(process.cwd(), '..');
const load = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

/** Minimal `key: value` parser. Repeated keys become arrays. */
function parseBlock(src) {
  const out = {};
  for (const line of src.split('\n')) {
    const m = line.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k in out) out[k] = [].concat(out[k], v.trim());
    else out[k] = v.trim();
  }
  return out;
}
const list = (v) => (v == null ? [] : [].concat(v).flatMap((s) => s.split(',').map((x) => x.trim())).filter(Boolean));

/* ------------------------------------------------------------------ */

function swatchCard(name, token, flat) {
  const value = token.$value;
  const paper = flat['colour.paper']?.$value ?? '#ffffff';
  const ink = flat['colour.ink']?.$value ?? '#111111';
  let badges = '';
  if (isHex(value)) {
    const onPaper = contrast(value, paper);
    const onInk = contrast(value, ink);
    const best = onPaper >= onInk ? { r: onPaper, bg: paper } : { r: onInk, bg: ink };
    const v = verdict(best.r);
    badges = `<div class="bg-swatch__meta">
      <span class="bg-badge bg-badge--${v.level}">${v.label}</span>
      <span class="bg-swatch__ratio">${best.r.toFixed(2)}:1 best pairing</span>
    </div>`;
  }
  return `<figure class="bg-swatch">
    <div class="bg-swatch__chip" style="background:${esc(value)}"></div>
    <figcaption>
      <span class="bg-swatch__name">${esc(name.split('.').pop())}</span>
      <code class="bg-swatch__value">${esc(value)}</code>
      <code class="bg-swatch__var">var(${cssVarName(name)})</code>
      ${token.$description ? `<p class="bg-swatch__rule">${esc(token.$description)}</p>` : ''}
      ${badges}
    </figcaption>
  </figure>`;
}

function renderPalette(opts, flat) {
  const group = opts.group ?? 'colour';
  const only = list(opts.only);
  const entries = Object.entries(flat).filter(
    ([k, t]) =>
      k.startsWith(`${group}.`) &&
      t.$type === 'color' &&
      (!only.length || only.includes(k.split('.').pop()))
  );
  if (!entries.length) return `<p class="bg-empty">No colour tokens found in <code>${esc(group)}</code>.</p>`;
  return `<div class="bg-grid bg-grid--swatches">${entries
    .map(([k, t]) => swatchCard(k, t, flat))
    .join('')}</div>`;
}

function renderContrast(opts, flat) {
  const colours = Object.entries(flat).filter(([, t]) => t.$type === 'color' && isHex(t.$value));
  const map = Object.fromEntries(colours.map(([k, t]) => [k.split('.').pop(), t.$value]));
  let pairs = list(opts.pairs).map((p) => p.split('/').map((s) => s.trim()));
  if (!pairs.length) {
    const bgs = ['paper', 'primary'].filter((b) => map[b]);
    pairs = colours
      .map(([k]) => k.split('.').pop())
      .flatMap((fg) => bgs.filter((bg) => bg !== fg).map((bg) => [fg, bg]));
  }
  const rows = pairs
    .filter(([fg, bg]) => map[fg] && map[bg])
    .map(([fg, bg]) => {
      const r = contrast(map[fg], map[bg]);
      const v = verdict(r);
      return `<tr>
        <td><span class="bg-dot" style="background:${map[fg]}"></span> ${esc(fg)}</td>
        <td><span class="bg-dot" style="background:${map[bg]}"></span> ${esc(bg)}</td>
        <td class="bg-num">${r.toFixed(2)}:1</td>
        <td><span class="bg-badge bg-badge--${v.level}">${v.label}</span></td>
        <td class="bg-sample" style="background:${map[bg]};color:${map[fg]}">Sample text</td>
      </tr>`;
    })
    .join('');
  return `<div class="bg-table-wrap"><table class="bg-table">
    <thead><tr><th>Foreground</th><th>Background</th><th>Ratio</th><th>WCAG 2.2</th><th>Preview</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="bg-note">Computed from <code>brand.json</code> at build time. If a value changes, this table changes with it.</p></div>`;
}

function renderTypeScale(opts, flat) {
  const sizes = Object.entries(flat).filter(([k]) => k.startsWith('fontSize.'));
  const sample = opts.text ?? 'The quick brown fox jumps';
  const face = opts.font === 'body' ? 'font.body' : 'font.heading';
  return `<div class="bg-scale">${sizes
    .reverse()
    .map(
      ([k, t]) => `<div class="bg-scale__row">
      <div class="bg-scale__meta"><code>${esc(k.split('.').pop())}</code><span>${esc(t.$value)}</span></div>
      <div class="bg-scale__sample" style="font-size:${esc(t.$value)};font-family:var(${cssVarName(face)})">${esc(sample)}</div>
      ${t.$description ? `<p class="bg-scale__rule">${esc(t.$description)}</p>` : ''}
    </div>`
    )
    .join('')}</div>`;
}

function renderSpecimen(opts, flat) {
  const key = opts.token ?? 'font.heading';
  const t = flat[key];
  if (!t) return `<p class="bg-empty">No token <code>${esc(key)}</code> in brand.json.</p>`;
  const stack = [].concat(t.$value).join(', ');
  const weights = list(opts.weights).length ? list(opts.weights) : ['400', '500'];
  const text = opts.text ?? 'Handcrafted';
  return `<figure class="bg-specimen" style="font-family:var(${cssVarName(key)})">
    <div class="bg-specimen__hero">${esc(text)}</div>
    <div class="bg-specimen__aa">AaBbCcDdEeFfGg 0123456789 &amp; £ , . ; ? !</div>
    ${weights
      .map((w) => `<div class="bg-specimen__weight" style="font-weight:${esc(w)}">${esc(w)} — ${esc(text)}</div>`)
      .join('')}
    <figcaption>
      <code>${esc(stack)}</code>
      ${t.$description ? `<p class="bg-specimen__rule">${esc(t.$description)}</p>` : ''}
    </figcaption>
  </figure>`;
}

function renderSpacing(opts, flat) {
  const steps = Object.entries(flat).filter(([k]) => k.startsWith('space.'));
  return `<div class="bg-spacing">${steps
    .map(
      ([k, t]) => `<div class="bg-spacing__row">
      <code>${esc(k.split('.').pop())}</code>
      <div class="bg-spacing__bar" style="width:${esc(t.$value)}"></div>
      <span>${esc(t.$value)}</span>
    </div>`
    )
    .join('')}</div>`;
}

function renderDoDont(opts) {
  const dos = [].concat(opts.do ?? []);
  const donts = [].concat(opts.dont ?? []);
  const col = (items, kind, label) => `<div class="bg-dd__col bg-dd__col--${kind}">
    <div class="bg-dd__head">${label}</div>
    ${items.map((i) => `<p class="bg-dd__item">${esc(i)}</p>`).join('')}
  </div>`;
  return `<div class="bg-dd">
    ${col(dos, 'do', 'Do write')}
    ${col(donts, 'dont', "Don't write")}
    ${opts.why ? `<p class="bg-dd__why"><strong>Why:</strong> ${esc(opts.why)}</p>` : ''}
  </div>`;
}

function renderLogo(opts, flat) {
  const variants = list(opts.variants).length
    ? list(opts.variants)
    : ['primary', 'reversed', 'mono', 'mark'];
  const dark = flat['colour.primary']?.$value ?? '#111';
  const light = flat['colour.paper']?.$value ?? '#fff';
  return `<div class="bg-grid bg-grid--logos">${variants
    .map(
      (v) => `<figure class="bg-logo">
      <div class="bg-logo__stage" style="background:${v === 'reversed' ? dark : light}">
        <img src="/assets/logo/${esc(v)}.svg" alt="${esc(v)} logo" loading="lazy" />
      </div>
      <figcaption><code>assets/logo/${esc(v)}.svg</code></figcaption>
    </figure>`
    )
    .join('')}</div>`;
}

function renderTokens(opts, flat) {
  const prefix = opts.group ? `${opts.group}.` : '';
  const rows = Object.entries(flat)
    .filter(([k]) => k.startsWith(prefix))
    .map(
      ([k, t]) => `<tr>
      <td><code>${esc(k)}</code></td>
      <td><code>var(${cssVarName(k)})</code></td>
      <td><code>${esc([].concat(t.$value).join(', '))}</code></td>
      <td>${esc(t.$description ?? '')}</td>
    </tr>`
    )
    .join('');
  return `<div class="bg-table-wrap"><table class="bg-table bg-table--tokens">
    <thead><tr><th>Token</th><th>CSS variable</th><th>Value</th><th>Usage rule</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

const RENDERERS = {
  palette: renderPalette,
  swatch: (o, f) => (f[o.token] ? `<div class="bg-grid bg-grid--swatches">${swatchCard(o.token, f[o.token], f)}</div>` : ''),
  contrast: renderContrast,
  'type-scale': renderTypeScale,
  specimen: renderSpecimen,
  spacing: renderSpacing,
  dodont: renderDoDont,
  logo: renderLogo,
  tokens: renderTokens,
};

export default function remarkBrandBlocks() {
  const tokens = load('brand.json');
  const flat = flatten(tokens);

  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'code' && RENDERERS[child.lang]) {
          const opts = parseBlock(child.value ?? '');
          let value;
          try {
            value = RENDERERS[child.lang](opts, flat);
          } catch (e) {
            value = `<p class="bg-empty">Brand block <code>${esc(child.lang)}</code> failed: ${esc(e.message)}</p>`;
          }
          return { type: 'html', value: `<div class="bg-block">${value}</div>` };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
