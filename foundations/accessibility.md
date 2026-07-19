---
title: Accessibility
description: Minimum standards for anything produced under this brand.
---

Target: **WCAG 2.2 Level AA**. Anything below this is a defect, not a
design choice.

## Contrast

| Content | Minimum ratio |
| ------- | ------------- |
| Body text | 4.5:1 |
| Large text (18.66px bold / 24px) | 3:1 |
| UI components and focus indicators | 3:1 |
| Logos | Exempt, but aim for 3:1 |

## Non-negotiables

- Colour is never the only means of conveying information
- Every interactive element has a visible focus state
- Touch targets minimum 24×24px, 44×44px preferred
- All images have meaningful `alt` text; decorative images have `alt=""`
- Body copy never below 16px
- Respect `prefers-reduced-motion` — no parallax or autoplay without it
- Form inputs have persistent visible labels, not placeholder-only
- Heading levels are sequential and describe structure, not styling

## Copy accessibility

- Link text describes its destination — never "click here" or "read more" alone
- Plain language; expand abbreviations on first use
- Target reading age: TODO
