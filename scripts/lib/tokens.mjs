/** Shared token utilities: flatten, resolve, and WCAG contrast maths. */

export function flatten(node, trail = [], out = {}) {
  if (node && typeof node === 'object') {
    if ('$value' in node) {
      out[trail.join('.')] = node;
    } else {
      for (const [k, v] of Object.entries(node)) {
        if (!k.startsWith('$')) flatten(v, [...trail, k], out);
      }
    }
  }
  return out;
}

export function cssVarName(pathStr) {
  return `--brand-${pathStr.replace(/\./g, '-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
}

export function cssValue(token) {
  const v = token.$value;
  if (Array.isArray(v)) {
    return token.$type === 'fontFamily'
      ? v.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(', ')
      : v.join(' ');
  }
  return String(v);
}

/* ---------- contrast ---------- */

function srgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

export function luminance(hex) {
  const [r, g, b] = srgb(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** WCAG 2.2 verdict for a ratio. */
export function verdict(ratio) {
  if (ratio >= 7) return { label: 'AAA', level: 'pass', note: 'Any text size' };
  if (ratio >= 4.5) return { label: 'AA', level: 'pass', note: 'Any text size' };
  if (ratio >= 3) return { label: 'AA Large', level: 'warn', note: 'Large text and UI only' };
  return { label: 'Fail', level: 'fail', note: 'Not usable for text' };
}

export const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v);
