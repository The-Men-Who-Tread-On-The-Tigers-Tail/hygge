# hygge

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
npm install
npm run dev
```

Open the local URL printed by Vite. To run the frontend test and production build:

```sh
cd web
npm test
npm run build
```
