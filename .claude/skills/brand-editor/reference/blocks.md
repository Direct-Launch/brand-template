# Visual block reference

Fenced blocks in the brand Markdown that render as live specimens on the site.
They exist so one file serves both agents (reading raw text) and humans
(reading the rendered site). Values come from `brand.json` wherever possible,
so blocks cannot drift out of date.

| Block | Renders | Options |
| ----- | ------- | ------- |
| `palette` | Swatch grid: hex, CSS variable, usage rule, best contrast pairing | `group:` (default `colour`), `only:` comma list |
| `swatch` | One swatch | `token:` full path, e.g. `colour.accent` |
| `contrast` | WCAG 2.2 matrix computed at build time with live previews | `pairs:` e.g. `primary/paper, accent/paper`. Omit for all combinations |
| `type-scale` | Every size in the scale, set in the brand face | `text:` sample string, `font:` `heading` or `body` |
| `specimen` | Large specimen with weights and character set | `token:` e.g. `font.heading`, `text:`, `weights:` comma list |
| `spacing` | Spacing scale as bars | none |
| `dodont` | Side-by-side example cards | `do:` and `dont:` (both repeatable), `why:` |
| `logo` | Logo variants on correct backgrounds | `variants:` comma list, default `primary, reversed, mono, mark` |
| `tokens` | Full token reference table | `group:` to filter |

## Rules

- One block per concept. Do not stack three `palette` blocks where one with
  `only:` would do.
- `dodont` examples must be **real sentences**, not descriptions of sentences.
  "Avoid overly promotional language" is useless to an agent; a rejected
  sentence it can pattern-match against is not.
- A `contrast` block with no options regenerates every pairing. Prefer that over
  a hand-written table — hand-written contrast figures go stale silently.
- `logo` blocks reference files in `assets/logo/`. If a variant does not exist,
  the image will 404 on the site. Add the file or remove the variant.
