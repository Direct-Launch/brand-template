# Setting this up — Direct Launch internal

## Once, ever

1. Push this folder to `github.com/Direct-Launch/brand-template`.
2. **Settings → General → tick "Template repository".**
3. Settings → Actions → General → Workflow permissions → Read and write.

## For each new client

```bash
# 1. On GitHub: "Use this template" → Direct-Launch/<client>-brand → Private
git clone git@github.com:Direct-Launch/<client>-brand.git
cd <client>-brand

# 2. Stamp the client name everywhere
node scripts/init-client.mjs "Griffin & Co Fine Jewellery"

# 3. Fill in the TODOs. Order matters — later files depend on earlier ones:
#    business/overview.md → business/audience.md → identity/attributes.md
#    → identity/voice-and-tone.md → foundations/* → brand.json → web/*

# 4. Check it
node scripts/validate-brand.mjs

# 5. Preview the site locally
cd site && npm install && npm run dev
```

Then on GitHub: **Settings → Pages → Source: GitHub Actions**, push to `main`,
and the toolkit deploys.

Once the repo is genuinely complete, edit `.github/workflows/validate.yml` to
add `--strict` so placeholders can never ship.

## Publishing options

| Option | Cost | Access control | Custom domain |
| ------ | ---- | -------------- | ------------- |
| GitHub Pages, public repo | Free | None | Yes |
| GitHub Pages, private repo | Paid plan required | None without Enterprise Cloud | Yes |
| **Cloudflare Pages + Access** | Free tier | Email-gated per client | Yes — `brand.client.com` |

For client work, Cloudflare Pages is usually the right answer: connect the
private repo, build command `cd site && npm install && npm run build`, output
directory `site/dist`, then put Cloudflare Access in front with the client's
email domain allowed. Set `SITE_URL` to the custom domain and leave `BASE_PATH`
as `/` in the Cloudflare build environment variables.

## Wiring agents to it

**GitHub MCP server (best).** Create a fine-grained PAT scoped to
`Direct-Launch/*-brand` with Contents: Read-only. Agents can then read any
client's brand repo on demand.

**Direct fetch (quick).** Raw URLs work in anything that can make an HTTP
request:

```
https://raw.githubusercontent.com/Direct-Launch/<client>-brand/main/llms.txt
```

For private repos, append a token header — or keep `llms.txt`, `brand.json`,
and `identity/` on the public Pages site and leave `business/` and `legal/`
private.

**Per-project.** In each client's *website* repo, add to `CLAUDE.md`:

```markdown
Brand source of truth: https://github.com/Direct-Launch/<client>-brand
Read its AGENTS.md before writing copy or styling components.
```

## Maintenance rhythm

| When | Do |
| ---- | -- |
| Every project | Update `web/components.md` if the implementation changed |
| Quarterly | Review `web/seo.md` keyword positions |
| Every 6 months | Review `legal/licences.md` for expiries |
| Annually | Review `business/overview.md` priorities with the client |
| On brand change | Tag a release, update `CHANGELOG.md` |

## The visual layer

The site is not a separate design job — it derives from the same files.

`scripts/build-tokens.mjs` reads `brand.json` and writes
`site/src/styles/tokens.css`, which does two things: exposes every token as a
`--brand-*` custom property, and overrides Starlight's own variables so the
toolkit renders in the client's palette and typefaces. Change a hex in
`brand.json` and the entire site re-skins on the next build.

`site/src/plugins/remark-brand-blocks.mjs` turns fenced blocks into live
specimens:

| Block | Renders | Options |
| ----- | ------- | ------- |
| `palette` | Swatch grid with hex, CSS var, usage rule, best contrast pairing | `group:`, `only:` |
| `swatch` | A single swatch | `token:` |
| `contrast` | WCAG 2.2 matrix computed at build time, with live previews | `pairs:` (defaults to every combination) |
| `type-scale` | The full size scale, rendered in the brand face | `text:`, `font:` |
| `specimen` | Large type specimen with weights and character set | `token:`, `text:`, `weights:` |
| `spacing` | Spacing scale as bars | — |
| `dodont` | Side-by-side do/don't cards | `do:`, `dont:` (repeatable), `why:` |
| `logo` | Logo variants on correct backgrounds | `variants:` |
| `tokens` | Full token reference table | `group:` |

The reason for fenced blocks rather than MDX components: an agent reading the
raw file from GitHub sees legible key/value text, while a human on the site
sees a rendered swatch. One source, two audiences, no duplication.

To theme further:

- **Fonts** — add entries to `site.theme.fontFaces` (self-hosted, files in
  `assets/fonts/`) or `site.theme.webfonts` (URLs) in `brand.config.json`.
- **Logo in the header** — set `site.theme.logo`.
- **Anything tokens can't express** — `site/src/styles/custom.css`, which is
  never regenerated.

Contrast figures are computed, not typed. If a pairing fails AA, the table says
so on the client's own brand site — which tends to end the argument faster than
you can.

## Two ways to edit: Claude, and the Studio

### Claude edits it — `.claude/skills/brand-editor/`

The skill ships inside every client repo, so any Claude session with repo
access picks it up automatically. It defines the file-routing table (which file
owns which kind of fact), the branch-and-PR workflow, and the hard rules —
never invent a value, never commit to `main`, always run the validator, always
check contrast after a colour change, flag material brand changes for client
sign-off.

Give Claude access one of three ways:

| Route | Best for |
| ----- | -------- |
| **Claude Code**, repo cloned locally | Real editing sessions. The skill and scripts are right there. |
| **GitHub MCP server** + fine-grained PAT | Chat-driven edits from anywhere. Scope the PAT to `Direct-Launch/*-brand`, Contents: Read and write, Pull requests: Read and write. |
| **Raw fetch**, read-only | Agents that only need to *read* the brand while working on something else. |

Then a request like "Griffin want their accent gold slightly warmer" becomes:
branch, edit `brand.json`, re-run the contrast check, update the changelog,
open a PR, and report which pairings moved. The validator is the gate — a PR
that breaks it fails CI.

If you want to change how Claude edits these repos, edit
`.claude/skills/brand-editor/SKILL.md`. That is the file `/skill-creator`
authors and revises — skill-creator writes the skill, the skill does the work.

### You edit it — `npm run studio`

```bash
node studio/server.mjs        # → http://localhost:4321
```

Zero dependencies, no build step, no hosting. It reads and writes the repo
files directly, so everything it does shows up in `git diff` and you commit it
yourself. Three tabs:

- **Tokens** — colour pickers with a usage-rule field beside each one, and a
  contrast matrix that recalculates as you drag. Flags any token missing its
  `$description`, because that is what agents read. Saving regenerates the
  site CSS.
- **Content** — file list with TODO counts, a Markdown editor, and a live
  preview that renders the visual blocks as you type. There's an insert button
  for do/don't blocks, since those are the most common edit.
- **Checks** — runs the validator and the contrast report, and shows the
  uncommitted changes.

It binds to `127.0.0.1` only and has unauthenticated write access to the repo
it is run from. Don't expose it.

### Which to use

Claude for anything with a rule attached — colour changes that need contrast
re-checked, voice examples that need to match existing ones, changes that
should be a reviewable PR. The Studio for eyeballing the palette, quick
corrections, and the times you want to see the thing rather than describe it.

### If clients need to edit

Neither of the above is client-facing. When you get there, add a git-based CMS
(Sveltia or Decap) with GitHub OAuth — it commits to the same repo, so the
validator and PR review still apply. Restrict it to `business/` and `legal/`,
which is where client knowledge actually lives.
