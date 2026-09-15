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

The web frontend now includes a **3D room blockout**: a static, window-side interior rendered with React Three Fiber, alongside a stable HTML reading panel. On mobile the room sits above the questions. **Another question** remains the only primary action and supports keyboard activation. The scene is deliberately stationary at this visual-review milestone; camera movement, card-dealing animation, and detailed material polish are not implemented yet.

Rendering is on demand, with no external models or textures. If WebGL 2 is unavailable or the renderer fails, a local room illustration replaces the scene without resetting the current question. The static 3D room is also used for reduced-motion preferences.

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

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/menwhotreadontigerstail)
