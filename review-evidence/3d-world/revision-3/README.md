# Revision 3 — room motion and indoor lighting

- Gentle mouse parallax with recentering; no touch camera dragging.
- Bounded card lift/turn on the existing primary action; question text updates immediately.
- Rapid mid-flight restarts do not accumulate height or spins.
- Live reduced-motion preferences cancel both animations while retaining the furnished room.
- Window-sized diffuse area light, soft ceiling-bounce shadows, a local warm lamp pool, and an underside-visible ceiling replace harsh global sunlight bands.
- Area-light shadowing is approximated with shadow-casting spotlights; this is not a path-traced interior.

## Verification

- 16 unit tests pass; production build succeeds.
- 27 motion checks and 28 existing browser smoke checks pass in Chromium 152.0.7977.83.
- All eight questions fit at 20 tested viewport sizes.
- Real GPU scene transforms and idle renderer frames checked, not just mocked DOM elements.
- Desktop, mobile and short-landscape screenshots visually inspected; room remains unobstructed.
- `room-motion.webm` records actual mouse parallax and mouse/keyboard card dealing.
- No physical-mobile performance measurement. The production Three/area-light chunk remains large (about 1.15 MB minified); build warning is not suppressed.

JSON results accompany this note. No merge or publication was performed.
