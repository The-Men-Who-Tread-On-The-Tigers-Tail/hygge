# Revision 2 — feedback-driven visual refinements

Source commit: `ac075e3034ce97e5227d94428709d5e0274fce24` on `feat/3d-room-blockout`.

## User feedback addressed

1. Awkward chair: upholstered seat/back/padded arms, tapered legs, lumbar cushion, open wood arm supports and table-facing orientation.
2. Scrolling at some aspect ratios: responsive height-aware spacing, stacked layout for narrow windows and short-landscape arrangement; removed redundant large introductory/invitation copy. Meaningful questions/controls are not clipped.
3. Empty room: folded curtains, populated wall shelves, sideboard, books, vases and greenery. Shell extended vertically to avoid exposed exterior edges in tall mobile frames.
4. Disliked font: replaced Georgia/Times with the native sans-serif system stack; no external font download.

## Verification

- 9 unit tests pass; production build and `git diff --check` pass.
- `browser-smoke.json`: 28 browser checks pass, including renderer failure, context loss, touch and keyboard controls.
- `layout-fit.json`: all eight questions at 20 viewport sizes, including 320×480, 844×390 and breakpoint-adjacent dimensions. Zero horizontal/vertical document overflow and visible controls/captions in this matrix. This is not a guarantee for every viewport, extreme zoom or future content.
- Captured actual Chromium screenshots: desktop 1440×900, mobile 390×844, landscape 844×390 and small portrait 320×480. This is emulation, not physical-device performance testing.
- Review identified sideboard book/shelf intersections and possible overflow immediately above a layout breakpoint. Shortened the lower-compartment books with positive clearance; reproduced the viewport bug at 421×500 and 450×500, adjusted the layout breakpoint, and reran the expanded matrix successfully.
- Spec review found no objective blockers; chair, font and room atmosphere remain subject to user taste approval.

The existing lazy GPU chunk-size warning and upstream Three Clock deprecation warning remain. No runtime dependencies, animation, question data, backend, merge or publication changes.
