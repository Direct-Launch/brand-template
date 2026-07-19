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
