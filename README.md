# {{CLIENT_NAME}} — Brand Repository

Single source of truth for {{CLIENT_NAME}}'s brand, business context, and design
tokens. Maintained by Direct Launch.

**If you are an AI agent, read [`AGENTS.md`](./AGENTS.md) first.**

## Where things live

| Path            | Contains                                                        |
| --------------- | --------------------------------------------------------------- |
| `brand.json`    | Design tokens (colour, type, spacing) in W3C DTCG format         |
| `business/`     | What the business does, who it serves, how it talks about itself |
| `identity/`     | Brand attributes, voice and tone, messaging, naming              |
| `foundations/`  | Logo, colour, typography, imagery, accessibility rules           |
| `web/`          | How the brand maps to UI components and SEO                      |
| `legal/`        | Font licences, photography rights, trademark status              |
| `assets/`       | Source files — logos, fonts, approved photography                |
| `site/`         | Astro Starlight site that renders the public toolkit             |

## The visual guide

The Markdown here is the source of truth; running the site turns it into a
visual brand toolkit styled in the client's own palette and typefaces. Colour
swatches, contrast tables, type specimens, spacing scales and do/don't cards
are all generated from `brand.json` and the fenced blocks in these files, so
the guide can never disagree with the tokens.

```bash
cd site && npm install && npm run dev
```

## Editing

Edit the Markdown and JSON files directly. The published site is generated from
them — never edit the site content by hand.

1. Branch from `main`
2. Make your change
3. Open a PR (the template will prompt you for what changed and why)
4. Merge — the site redeploys automatically

## Versioning

Material brand changes are tagged (`v1.0.0`, `v1.1.0`) and recorded in
[`CHANGELOG.md`](./CHANGELOG.md).

## Status

- [ ] Business context complete
- [ ] Voice and tone documented with examples
- [ ] Design tokens match live implementation
- [ ] Logo assets in all required formats
- [ ] Font and photography licences recorded
