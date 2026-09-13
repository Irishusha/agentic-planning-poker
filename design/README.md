# Planning Poker design sources

## Files

- `planning-poker.html` — interactive visual source; open it in a browser. Its top `SCREEN / VIEW AS` controls
  are design chrome only and must not be implemented in the product.
- `support.js` — runtime required only to preview the exported interactive HTML. It is not application code
  and must not be imported into `app/**`.
- `spec.md` — design tokens, layouts, screen states, accessibility requirements and detailed interaction
  notes.
- `screenshots/revealed.png` — quick visual reference for the revealed-results state; it is not a complete
  design export.
- `../docs/product-plan.md` — approved MVP scope and product behaviour.

## Source precedence

1. `docs/product-plan.md` controls MVP scope and explicit product/business decisions.
2. `design/planning-poker.html` controls visual appearance and screen composition.
3. `design/spec.md` controls tokens, measurements, accessibility and interaction details not overridden by the
   product plan.
4. The screenshot is reference-only.

Where the two disagree, the product plan wins and the spec's wording is stale, not a second opinion. `spec.md`
also refers to the export as `Planning Poker.dc.html`; the file in this directory is `planning-poker.html`.

## Decisions that override the export

- **Hours scale only.** The exported design can preview Fibonacci and T-shirt scales; the MVP implements
  neither. Build the Hours deck: `4h · 1d · 2d · 3d · 5d · 8d · 10d · 14d · ?` (hours `4, 8, 16, 24, 40, 64,
  80, 112`).
- **Observer is a participation mode, not a professional role.** It is chosen at join time and is independent
  of the role (QA / Back-end / Front-end / Business analysis / PM). Observers get no deck and no Away toggle,
  and are excluded from `M` in the `N of M` counter.
- **Away is a separate toggle, not an estimate card.** The `☕ "Stepping out for coffee"` switch sits under
  the card grid. A voter holds either a card or Away, never both: picking a card clears Away, switching Away
  on clears the card. `?` and Away both complete a participant's action for `N of M` and are both excluded
  from min, max, average and spread.
- **Reset clears numeric vote, `?` and Away** — every voting participant returns to `Waiting`. The current
  task and the participant list stay; observers remain observers and remain outside `M`.
- **Do not copy the exported HTML or `support.js` into the Next.js app.** Rebuild the UI as React components
  from the design sources.
- **Do not implement the design chrome** — the `SCREEN / VIEW AS` bar exists to preview states, and has no
  product equivalent.

## Implementation workflow

For each screen or component:

1. read the relevant product-plan and spec sections;
2. inspect the matching state in `planning-poker.html`;
3. implement a small React component;
4. add or update tests;
5. compare the rendered result with the design before completion.
