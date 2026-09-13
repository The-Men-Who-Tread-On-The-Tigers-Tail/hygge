# Releasing Hygge

This document defines the release gates for Hygge. It does not authorize a release.

## Scope and approval boundary

A GitHub source tag/release, npm publication, and crates.io publication are independent actions. None may be performed merely because another occurred.

Before any release action, Johann must explicitly approve:

- the version and tag (for example, `v0.1.0`);
- whether the GitHub Release is draft, prerelease, or public;
- the release-note source;
- whether npm and/or crates.io publication is authorized.

## Pre-release checks

Run all checks from a clean worktree at the intended commit:

```sh
git status --porcelain=v1
cargo fmt --check
cargo test
cargo clippy --all-targets --all-features -- -D warnings
(cd web && npm ci && npm test -- --run && npm run build)
```

Confirm the current GitHub Actions CI run passed. Perform the credential/leak scan over the working tree and reachable Git history without printing secret values. Stop for any unresolved finding.

## Versioning and changelog

When a version bump is explicitly approved, update `CHANGELOG.md` first with the intended released version and date. Then update these version-bearing files in the same change:

- `Cargo.toml`
- `web/package.json`

The frontend remains `private: true`; changing its version does not authorize npm publication.

## GitHub source release

After all gates pass and the explicit release approval has been given, create and verify a signed or annotated tag for the approved commit:

```sh
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
# Select exactly one command matching the approved release state:
gh release create vX.Y.Z --draft --generate-notes
gh release create vX.Y.Z --prerelease --generate-notes
gh release create vX.Y.Z --generate-notes # public release
```

Do not run these commands before approval. Do not add release assets unless they are specifically approved.

## Post-release verification

Read back and record:

```sh
git ls-remote --tags origin vX.Y.Z
gh release view vX.Y.Z
```

Record the GitHub Release URL and whether it is draft, prerelease, or public. Confirm the tag points to the approved commit and the release has the approved visibility. Also confirm that no npm or crates.io publication occurred unless separately authorized.

## Corrections and rollback

Do not silently delete, move, or recreate a public tag. If a release needs correction, publish a corrective release or document a security response with an explicit approval.
