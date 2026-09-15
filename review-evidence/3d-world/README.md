# 3D room blockout — visual-review evidence

Implementation under review: `e06d1f1a5209c96a8cbf43cf1f92958a3bad6f33` on `feat/3d-room-blockout`.

## Scope

First static room milestone only: real floor/walls/window, layered garden, grounded furniture, fixed responsive camera and accessible reading UI. The camera frames a furnished corner; the room shell extends beyond the viewport so it does not appear to float as a diorama. No animation or free-roaming controls yet. Question data and Rust CLI are unchanged.

## Verified

- `npm test`: **9 passed**.
- `npm run build`: passed; separate HTML/UI and lazy GPU scene chunks.
- `git diff --check`: passed.
- `web/qa/blockout-smoke.js`, executed through Playwright CLI in Chromium **152.0.7977.83**: **28 checks passed**, no uncaught page errors.
- Smoke checks cover mouse, Space, Enter, focus retention, touch emulation, initial no-WebGL fallback, successful probe followed by actual renderer-creation failure, actual `WEBGL_lose_context` failure, continued reading/advancement after failure, reduced-motion rendering, and layout at widths 1440, 390, 320 and 768.
- Actual scene screenshots captured and visually inspected: `desktop-1440x900.png`, `mobile-390x844.png`.

The screenshots show the first question and a real WebGL render, not the SVG fallback. Mobile is browser emulation, not a physical-device test.

## Review

- Spec review: no actionable findings for the phase 1/2 blockout scope.
- Standards review found renderer-startup error handling and incomplete browser error collection. Both were corrected, the real-browser regression went from red to green, and the focused re-review found no blockers.
- The final browser error assertion waits for renderer readiness and rendering frames, not merely the presence of a canvas.

## Known limitations / next gate

- Await user visual approval before detailed materials, bounded camera motion or tabletop card-dealing animation.
- Vite reports the lazy Three.js scene chunk above its 500 kB warning threshold (approximately 891 kB minified / 235 kB gzip). The initial UI chunk is separate (approximately 197 kB minified / 63 kB gzip). No new runtime dependencies were added.
- The installed React Three Fiber/Three combination emits a `THREE.Clock` deprecation warning. Rendering and checks pass; no dependency migration was attempted in this blockout.
- Full cross-browser, zoom, screen-reader and physical mobile performance acceptance remain for the subsequent implementation phase. Do not interpret the smoke checks as proving visual quality, contrast compliance or frame-rate targets.
- Nothing merged or published. The local preview runs at `http://127.0.0.1:5178/` while its dev server is running.
