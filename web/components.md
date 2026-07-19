---
title: Components
description: How brand rules translate into UI patterns.
---

Bridges `brand.json` and real interfaces. Update when the live site changes —
a stale mapping is worse than none.

## Buttons

| Variant | Background | Text | Border | Radius | Use for |
| ------- | ---------- | ---- | ------ | ------ | ------- |
| Primary | `colour.primary` | `colour.paper` | none | `radius.md` | The single main action per view |
| Secondary | transparent | `colour.primary` | 1px `colour.primary` | `radius.md` | Alternative actions |
| Tertiary | transparent | `colour.primary` | none, underline | — | Low-priority actions |

States: hover, focus-visible, active, disabled, loading. Focus ring must meet
3:1 contrast against both the button and the page.

## Cards

TODO. Padding token, radius, border vs shadow, image aspect ratio.

## Forms

TODO. Label position, error styling, required-field marking, help text.

## Navigation

TODO. Desktop and mobile patterns, sticky behaviour, active state.

## Spacing rhythm

Section padding: `space.7` desktop, `space.5` mobile. Content max-width: TODO.
All spacing uses `space.*` tokens — no arbitrary values.

## Implementation notes

TODO. Platform (Shopify theme, Astro, WordPress), where tokens are consumed
(CSS custom properties, Tailwind config, theme settings), and how to regenerate
them from `brand.json`.
