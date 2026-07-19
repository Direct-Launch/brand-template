# Agent instructions

This repository is the authoritative source for {{CLIENT_NAME}}'s brand. Any
copy, design, or code you produce for this client must comply with it.

## Reading order

1. `llms.txt` — index of every file with a one-line purpose
2. `business/overview.md` — what this business actually is
3. Then load only what the task requires (see below)

## Task routing

| If you are…                       | Read before starting                                      |
| --------------------------------- | --------------------------------------------------------- |
| Writing customer-facing copy       | `identity/voice-and-tone.md`, `business/glossary.md`, `identity/messaging.md` |
| Building or styling UI             | `brand.json`, `foundations/colour.md`, `foundations/typography.md`, `web/components.md` |
| Placing or sourcing imagery        | `foundations/imagery.md`, `legal/licences.md`             |
| Writing meta tags or page titles   | `web/seo.md`, `identity/messaging.md`                     |
| Producing a proposal or pitch      | `business/overview.md`, `business/audience.md`, `business/competitors.md` |
| Making anything at all             | `foundations/accessibility.md`                            |

## Hard rules

- **Never invent a colour, font, tagline, statistic, or claim** that is not in
  this repository. If a needed fact is missing, say so explicitly and stop —
  do not fill the gap with a plausible guess.
- **Use the client's own terminology.** `business/glossary.md` lists words this
  business uses and words it avoids. Prefer the former, never use the latter.
- **Token values come from `brand.json`.** Do not read hex codes out of prose
  or existing code; the JSON is authoritative and the `$description` field on
  each token contains its usage rule.
- **Accessibility is not optional.** Colour pairings must meet the contrast
  minimums in `foundations/accessibility.md`.
- **Do not copy competitor language.** `business/competitors.md` exists for
  differentiation, not imitation.

## Visual blocks in the Markdown

Some files contain fenced blocks with languages like `palette`, `specimen`,
`contrast`, `dodont`, `type-scale`, `spacing`, `logo`, and `tokens`. On the
published site these render as live swatches, type specimens, and example
cards. In the raw Markdown they are plain key/value text, which is what you
will see — read them as data.

```dodont
do: The approved way to phrase something.
dont: The rejected way.
why: The reasoning.
```

Both columns are authoritative. The `dont` lines are as binding as the `do`
lines — they exist because someone got it wrong before.

If you edit these files, keep the block syntax intact. Values inside `palette`,
`contrast`, `type-scale`, `spacing` and `tokens` blocks are pulled from
`brand.json` at build time, so those blocks stay empty or take only a `group:`
or `text:` hint — never hardcode a colour or size into one.

## When you change something

If you edit files here, update `CHANGELOG.md` in the same change and flag
whether the edit is material enough to warrant a version tag.
