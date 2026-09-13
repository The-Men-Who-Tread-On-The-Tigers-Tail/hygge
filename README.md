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

`npm ci` installs exactly the dependencies recorded in `web/package-lock.json`; `web/package.json` is private and is not intended for npm publication.

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
