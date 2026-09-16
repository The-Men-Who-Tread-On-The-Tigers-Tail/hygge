# hygge

Hygge is licensed under the [MIT License](LICENSE), Copyright (c) 2026 The Men Who Tread On The Tiger’s Tail.

`hygge` is a small Rust CLI that prints one reflective question from a seeded local SQLite database.

On first run, the app initializes its local SQLite database automatically. Set `HYGGE_DB_PATH` to override the default database location.

## Run

From the parent workspace directory:

```sh
cargo run --manifest-path hygge/Cargo.toml
```

From inside the `hygge/` directory:

```sh
cargo run
```

## Test

From the parent workspace directory:

```sh
cargo test --manifest-path hygge/Cargo.toml
```

From inside the `hygge/` directory:

```sh
cargo test
```

## Web interface

The React interface lives in `web/` and uses the same built-in reflective question style as the CLI.

The web frontend now includes a **3D room**: a window-side interior rendered with React Three Fiber, alongside a stable HTML reading panel. On mobile the room sits above the questions. **Another question** remains the only primary action and supports keyboard activation. The room includes two matching upholstered armchairs facing the table, curtains, wall shelves and a sideboard. Diffuse window light, a localized warm floor-lamp pool, soft furniture shadows and an interior-facing ceiling replace the previous hard outdoor-looking sunlight bands. The reading UI uses a native sans-serif font and adapts to both viewport width and height. A gentle, bounded camera shift follows a mouse over the room and recenters on leave; touch does not drag the camera. Each activation lifts and turns a card on the table while the HTML question updates immediately with a short fade-and-rise transition. The reading area reserves the tallest question in the current set at the current width, preventing button and room-layout jumps without clipping text. Hidden sizing copies are excluded from accessibility. Text transitions cancel cleanly on rapid activation and are disabled by reduced-motion preferences; the initial question does not animate. Rapid activations keep every question advance and retarget the bounded deal without accumulating height. Shared procedural brush textures, trailing ivy, sill flowers, botanical wall art, a tea set and a woven blanket basket give the room a hand-painted cottage direction. Pointed ivy leaves with continuous stems, a static wall clock, an unlit shelf candle, detailed book spines and cushion piping add more legible finishing details. The garden has clustered tree crowns and layered hills; repeated organic geometry is merged by color to limit draw calls.

Rendering is on demand, with no external models or textures. If WebGL 2 is unavailable or the renderer fails, a local room illustration replaces the scene without resetting the current question. Reduced-motion preferences disable both camera movement and dealing, including when the preference changes while the page is open; the furnished room stays visible. Rendering stops when pointer movement and dealing settle.

From the repository root:

```sh
cd web
npm ci
npm run dev
```

Open the local URL printed by Vite. To run the frontend test and production build:

```sh
cd web
npm test
npm run build
```

For the blockout's optional real-browser smoke checks, keep the dev server running on the dedicated preview port (`npm run dev -- --host 127.0.0.1 --port 5178 --strictPort`) and run these commands from `web/` in another terminal:

```sh
npx --yes --package @playwright/cli playwright-cli -s=hygge-room open http://127.0.0.1:5178/
npx --yes --package @playwright/cli playwright-cli -s=hygge-room run-code --filename=qa/blockout-smoke.js
npx --yes --package @playwright/cli playwright-cli -s=hygge-room close
```

Run `--filename=qa/motion-smoke.js` for real-renderer camera/card checks, rapid restarts, idle rendering, keyboard/touch activation, and live reduced-motion changes. Its scene inspection targets the Vite development server. Run `--filename=qa/card-visibility.js` to verify projected card bounds, center occlusion and screen-space movement during repeated restarts across the viewport matrix.

For the height/width regression matrix, run the same `run-code` command with `--filename=qa/layout-fit.js`. It checks all eight questions at 20 viewport sizes for scroll overflow and visible controls without content clipping. Extreme zoom may still scroll to preserve text readability.

This optional command downloads Playwright CLI if needed and requires a compatible browser. The smoke script checks question controls, responsive layout, reduced motion, WebGL absence, and actual context loss. It does not measure visual quality or physical-device performance; inspect the room in the browser separately.

`npm ci` installs exactly the dependencies recorded in `web/package-lock.json`; `web/package.json` is private and is not intended for npm publication. See [`docs/releasing.md`](docs/releasing.md) for the separate source-release process.

For a complete verification from the repository root:

```sh
cargo fmt --check
cargo test
cargo clippy --all-targets --all-features -- -D warnings
cd web
npm ci
npm test
npm run build
```

## Support

If Hygge is useful to you, you can support my work:

[![Buy Me a Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/menwhotreadontigerstail)
