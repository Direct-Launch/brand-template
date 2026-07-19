---
name: brand-editor
description: Edit this client's brand repository — design tokens, voice and tone, business context, foundations, or legal records. Use whenever the user asks to change, add, correct, or review anything about this brand: a colour, a typeface, a tagline, a do/don't example, a service description, an audience detail, a licence record, or a contrast problem. Also use when asked what the brand rules are for something, or to check whether a proposed colour, phrase, or design decision is on brand. Do not use for editing the client's website code — this skill covers the brand documentation only.
---

# Editing a Direct Launch brand repository

This repository is the authoritative source for one client's brand. Agents,
platforms, and Direct Launch staff read it. A wrong value here propagates into
real customer-facing work, so edits are deliberate and always validated.

## Before you touch anything

1. Read `AGENTS.md` — it holds the client-specific rules and reading order.
2. Read `brand.config.json` to see which folders are public and which are
   internal.
3. Identify the **single** file that owns the fact being changed. Facts live in
   exactly one place. If the same fact appears twice, that is a bug to report,
   not a pattern to follow.

| Change concerns | File |
| --------------- | ---- |
| A colour, typeface, size, spacing value | `brand.json` — never the prose |
| How a colour or typeface may be *used* | `foundations/colour.md`, `foundations/typography.md` |
| How the brand speaks | `identity/voice-and-tone.md` |
| A tagline, boilerplate, or claim | `identity/messaging.md` |
| What the business does or sells | `business/overview.md` |
| Approved or banned wording | `business/glossary.md` |
| Who the customers are | `business/audience.md` |
| Font licence, image rights, trademark | `legal/licences.md` |
| How brand maps to UI | `web/components.md` |

## The workflow

```bash
git checkout -b brand/<short-description>
# ...make the edit...
node scripts/validate-brand.mjs
# update CHANGELOG.md under [Unreleased]
git commit && gh pr create
```

**Never commit directly to `main`.** Brand changes get reviewed. Open a PR and
fill in the repository's PR template, including the change-type checkbox —
correction (PATCH), addition (MINOR), or brand change (MAJOR).

Always run `node scripts/validate-brand.mjs` before committing. If it exits
non-zero, fix the cause; do not commit past it.

## Hard rules

- **Never invent a value.** If the user asks for "a warmer secondary colour"
  without giving one, propose options and ask them to choose. Do not pick.
  The same applies to taglines, statistics, prices, dates, and claims.
- **`brand.json` is the only source of token values.** If prose in
  `foundations/` states a hex code that disagrees with the JSON, the JSON wins
  and the prose is the bug.
- **Every colour token needs a `$description`** containing its usage rule —
  where it may and may not be used. A token without one is incomplete.
- **Check contrast when changing any colour.** Run
  `node scripts/check-contrast.mjs` and report any pairing that drops below
  4.5:1 for body text or 3:1 for UI. If a requested change breaks a pairing
  that is currently in use, say so before making it.
- **Material brand changes need client approval.** Changing a colour, typeface,
  logo, or tagline is a client decision, not a Direct Launch one. Make the
  branch and the PR, then tell the user it needs sign-off before merge.
- **Do not delete history.** Retired taglines, old logos, and superseded rules
  move to a "Retired" section — they are not removed. Someone will ask why.
- **Legal records are facts, not prose.** Never soften, summarise, or estimate
  anything in `legal/licences.md`. If an expiry date is unknown, write
  `UNKNOWN — ask client`.

## Visual blocks

Markdown files contain fenced blocks that render as live specimens on the
published site. Keep the syntax intact when editing. Full reference:
[`reference/blocks.md`](reference/blocks.md).

The most common edit is adding a voice example:

```dodont
do: The approved phrasing.
dont: The rejected phrasing.
why: The reasoning behind the distinction.
```

`do:` and `dont:` may repeat. Both columns are authoritative.

Blocks that read from `brand.json` — `palette`, `contrast`, `type-scale`,
`spacing`, `tokens` — take only a `group:` or `text:` hint. Never hardcode a
value into one.

## Reporting back

After an edit, tell the user:

1. Which file changed and what the change was
2. The validator result
3. Any contrast pairing affected
4. Whether it needs client sign-off before merge
5. The PR link

If you were asked for something you could not do — a missing fact, an ambiguous
instruction, a change that would break accessibility — say so plainly rather
than producing a partial edit that looks complete.
