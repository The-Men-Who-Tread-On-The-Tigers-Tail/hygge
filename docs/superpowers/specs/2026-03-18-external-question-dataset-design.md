# External Question Dataset Design

## Goal

Enable `hygge` to read a published external SQLite database of high-quality questions while preserving the current built-in seeded database as the default fallback experience.

The first rollout targets a separate dataset project that produces about 1,000 strong questions. The design must scale later to much larger corpora without changing the runtime contract that `hygge` depends on.

## Current State

`hygge` is a local Rust CLI that currently initializes a SQLite database on first run and seeds it from the in-repo `SEED_QUESTIONS` list. The app then selects one random question and prints it.

Today the storage layer assumes:

- one SQLite database file
- one published `questions` table
- local access only
- a small built-in seed dataset stored in Rust source

This is good for zero-setup behavior, but it is not the right place to author, curate, or quality-control a very large reflective question corpus.

## Product Direction

The app name stays `hygge`.

The new direction is:

- keep `hygge` as a lightweight local CLI
- do not add a backend right now
- do not bundle a massive database into this repository
- create a separate dataset project responsible for producing the external database
- start with 1,000 published questions to prove quality and integration
- design the contract so larger future datasets can use the same interface

## Why A Separate Dataset Project

High-quality reflective questions are an editorial problem, not just a storage problem.

The user goal is that the prompt feels deep enough to create a reaction like: "wow, this is a deep question." That means the important work is upstream:

- generating or collecting candidate questions
- removing shallow or repetitive prompts
- deduplicating aggressively
- keeping tone and depth consistent
- publishing only approved final questions

That work should live outside `hygge`, because the CLI should remain small and dependable.

## Recommended Architecture

### `hygge` repository

`hygge` remains the consumer application.

Responsibilities:

- keep the current built-in seeded database path and behavior
- add support for opening a published external SQLite database directly
- validate the external database schema before querying it
- return clear errors for missing files, invalid schema, or empty datasets
- continue printing one normalized question per invocation

Non-responsibilities:

- no generation pipeline
- no curation workflow
- no deep metadata processing
- no remote backend or API

### Separate dataset repository

The new dataset project becomes the producer.

Responsibilities:

- create or collect candidate questions
- run quality and deduplication checks
- publish a final SQLite artifact that `hygge` can read directly
- document the schema contract and publishing process
- support scaling beyond 1,000 questions later without breaking consumers

## Runtime Data Flow

1. User runs `hygge`.
2. `hygge` decides which database source to use.
3. If an external dataset path is configured, `hygge` opens that SQLite file directly.
4. If no external dataset path is configured, `hygge` uses the current app-managed local database with built-in seeds.
5. `hygge` validates the selected database and fetches one random question.
6. `hygge` normalizes line endings as it already does and prints one line of output.

This approach avoids import time, duplicate storage, and first-run delays for large datasets.

For the built-in local app-managed database path, `hygge` continues using its current initialization and seeding flow. The stricter published-dataset validation rules apply to externally supplied datasets.

## Configuration Model

Add a dedicated environment variable for the external published database, such as `HYGGE_EXTERNAL_DB_PATH`.

Proposed behavior:

- if `HYGGE_EXTERNAL_DB_PATH` is set and non-empty, prefer the external SQLite file
- otherwise, use the current default behavior with the app-managed local database
- keep `HYGGE_DB_PATH` for the existing local managed database behavior

Precedence rules:

- if both `HYGGE_EXTERNAL_DB_PATH` and `HYGGE_DB_PATH` are set, `HYGGE_EXTERNAL_DB_PATH` wins
- a whitespace-only `HYGGE_EXTERNAL_DB_PATH` is treated as unset, not as a valid path
- a non-whitespace `HYGGE_EXTERNAL_DB_PATH` that points to an invalid dataset is treated as an error

If `HYGGE_EXTERNAL_DB_PATH` is configured but the file is missing, unreadable, not a valid published dataset, or otherwise unusable, `hygge` should fail fast with a clear error. It should not silently fall back to built-in seeds, because silent fallback would hide configuration mistakes and make quality verification harder.

This keeps the current zero-setup experience while making the large dataset opt-in.

## Published SQLite Contract

`hygge` should depend on a small stable contract, not on the internal pipeline details of the dataset project.

Published table: `questions`

Required columns:

- `id INTEGER PRIMARY KEY`
- `seed_key TEXT NOT NULL UNIQUE`
- `text TEXT NOT NULL`

Optional columns:

- `category TEXT`
- `source TEXT`

Contract requirements:

- every published question has non-empty `text`
- every published question has non-whitespace `text`
- `text` is already cleaned and ready for display
- duplicate `text` values are not allowed in the published dataset
- the table is queryable with the same general shape `hygge` already expects

Versioning requirements:

- the published database should set `PRAGMA user_version` to a documented schema version
- milestone 1 uses `PRAGMA user_version = 1`
- milestone 1 consumer behavior: `hygge` accepts only `user_version = 1` and rejects every other value
- future dataset evolution should add a new documented version rather than relying on loose compatibility guesses

For milestone 1, `hygge` should validate the external published database by checking:

- the `questions` table exists
- required column names are exactly present: `id`, `seed_key`, `text`
- optional columns `category` and `source` are allowed but not required
- other extra columns are allowed in milestone 1 because `hygge` reads only the documented contract columns
- `seed_key` is unique and non-null at the schema level
- `text` is non-null at the schema level
- runtime data contains no null, empty, or whitespace-only `seed_key` values
- runtime data contains no empty or whitespace-only `text` values

Accepted declared column types for milestone 1:

- `id`: SQLite column `type = INTEGER` and `pk = 1` via schema introspection
- `seed_key`: `TEXT NOT NULL`
- `text`: `TEXT NOT NULL`
- `category`: `TEXT` when present
- `source`: `TEXT` when present

Milestone 1 consumer validation should reject databases whose declared `questions` columns do not match those expected types for the contract columns it reads.

Validation method for milestone 1:

- inspect table shape with SQLite schema introspection such as `PRAGMA table_info(questions)`
- inspect uniqueness with SQLite index and constraint introspection such as `PRAGMA index_list(questions)` and related index metadata
- do not require byte-for-byte DDL matching
- accept logically equivalent SQLite schema forms that satisfy the contract, even if the original `CREATE TABLE` text differs

Examples of acceptable equivalents:

- case differences in declared types such as `integer` vs `INTEGER`
- equivalent constraint ordering such as `INTEGER NOT NULL PRIMARY KEY` vs `INTEGER PRIMARY KEY`

Examples of non-acceptable forms:

- `id` not marked as the primary key
- `seed_key` declared as a non-text column
- `text` declared as a non-text column
- missing uniqueness enforcement for `seed_key`

Duplicate `text` is a producer requirement for the published dataset, but not a mandatory runtime validation in `hygge` milestone 1. The dataset project is responsible for enforcing text uniqueness before publishing. `hygge` validates schema safety and row usability, not full editorial quality.

The dataset project may use many internal staging tables, metadata tables, or review tables, but `hygge` should rely only on the final published contract.

## Quality Bar

The main success criterion is not sheer volume. It is depth.

The published questions should feel:

- reflective rather than generic
- emotionally intelligent without sounding theatrical
- specific enough to provoke thought
- varied in structure and subject matter
- natural in wording
- free from awkward templated repetition

Questions that feel like filler, shallow journaling prompts, or obvious template expansions should not be published.

## Recommended Production Strategy

Use a curated generation pipeline in the separate dataset project.

Why this is the best fit:

- manual curation alone does not scale well
- raw template expansion tends to feel repetitive
- pure generation without filtering will not reliably meet the depth bar

Recommended pipeline stages:

1. generate or collect a large candidate pool
2. run style and depth filtering
3. deduplicate semantically and textually
4. score or rank candidates
5. review sampled outputs manually
6. publish only approved final rows to SQLite

For the first milestone, publish about 1,000 questions, but design the tooling so the same pipeline can later publish much larger sets.

## `hygge` Validation Requirements

Before querying an external database, `hygge` should verify:

- the file exists and opens successfully
- the file is a readable SQLite database rather than an arbitrary file
- `PRAGMA user_version` equals `1`
- the `questions` table exists
- required columns exist with compatible types
- required uniqueness or nullability constraints are present for contract columns
- the dataset is not empty
- no published row has null or whitespace-only `seed_key`
- no published row has empty or whitespace-only question text
- configured-invalid external datasets do not silently fall back to built-in seeds

Failure cases should produce explicit errors that explain:

- which path failed
- whether the problem is open failure, schema mismatch, or empty data
- what the user should fix

## Testing Strategy

In `hygge`, tests should cover:

- external database path is preferred when configured
- fallback to built-in local database still works
- valid external schema is accepted
- invalid external schema fails cleanly
- empty external database fails cleanly
- configured invalid external database fails rather than falling back
- non-SQLite file at `HYGGE_EXTERNAL_DB_PATH` fails cleanly
- missing or unreadable external file fails cleanly
- valid SQLite file with wrong schema fails cleanly
- wrong or missing `user_version` fails cleanly
- null or whitespace-only `seed_key` fails cleanly
- required uniqueness constraints missing from the schema fail cleanly
- prebuilt external DBs with corrupted duplicate `seed_key` rows fail cleanly if they bypassed normal schema enforcement
- valid external DB without optional `category` or `source` is accepted
- valid external DB with extra non-contract columns is accepted
- both env vars set prefers `HYGGE_EXTERNAL_DB_PATH`
- whitespace-only `HYGGE_EXTERNAL_DB_PATH` is treated as unset
- logically equivalent accepted schema forms pass validation
- whitespace-only `text` is rejected
- whitespace-only `seed_key` is rejected
- multiline question text is still normalized to a single output line

Use temporary directories and temporary SQLite databases in integration and storage-layer tests.

## Scale And Performance Assumptions

Even though the first milestone publishes about 1,000 questions, the consumer contract should stay safe for much larger corpora.

Runtime assumptions for `hygge`:

- it depends only on the published `questions` table and schema version marker
- it does not depend on any dataset-project staging tables or editorial metadata
- it may continue to use row count plus random offset selection for early milestones
- if future scale makes offset-based random selection too slow, the selection strategy may change inside `hygge` without changing the published schema contract

This keeps milestone 1 simple without locking the system into a 1,000-row-only design.

## Rollout Plan

### Phase 1

- define the published schema contract and schema version `1`
- consumer milestone: add external SQLite path support to `hygge`
- consumer milestone: add schema validation and tests
- content milestone: create the separate dataset project
- content milestone: publish a first external database with about 1,000 curated questions

Phase 1 done criteria:

- `hygge` correctly prefers a configured external published dataset over the local managed database
- `hygge` fails fast and clearly for invalid configured external datasets
- `HYGGE_EXTERNAL_DB_PATH=""` or whitespace-only values are treated as unset
- invalid configured external datasets never fall back to the local managed database
- `hygge` still works with its current built-in seeded fallback when no external dataset is configured
- the dataset project publishes a SQLite file with `user_version = 1` and the documented contract

Dataset project initial content goal for the first published artifact:

- publish roughly 1,000 curated high-quality questions against schema version `1`

### Phase 2

- improve dataset project quality filters and scoring
- expand the question corpus in batches
- monitor repetition and quality drift through sampling
- evolve the published schema only through documented new versions

### Phase 3

- consider richer filtering or metadata only if product needs justify it
- consider a backend only if the product becomes multi-user or remote-first

## Non-Goals

- renaming the app
- adding a backend now
- committing a huge SQLite file to this repository
- building a full editorial CMS inside `hygge`
- solving million-question authoring in the first iteration

## Risks And Mitigations

### Risk: low-quality large-scale generation

Mitigation:

- keep publication separate from generation
- require filtering, deduplication, and sample review before publishing

### Risk: large datasets make setup slow or duplicate storage

Mitigation:

- open the external SQLite file directly instead of importing it into the local app DB

### Risk: future dataset project drifts from `hygge` expectations

Mitigation:

- document the final schema clearly
- keep `hygge` dependent on a minimal stable contract
- add schema validation tests in `hygge`

## Recommended Next Implementation Slice

The next implementation should focus only on `hygge` integration, not on building the full dataset pipeline.

Specifically:

- add external SQLite path support
- keep built-in local seeds as fallback
- validate external schema
- add focused tests for source selection and failure modes

The separate dataset project can then be started independently to publish the first 1,000-question database against that contract.
