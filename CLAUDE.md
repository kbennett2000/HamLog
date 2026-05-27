# CLAUDE.md

## Project Overview

HamLog is a self-hosted amateur radio QSO (contact) logging application with
support for POTA (Parks on the Air), contest logging, and (planned) SOTA. It is
designed for an individual licensed amateur radio operator running it on their
own network — not a multi-tenant SaaS.

## Tech Stack

- **Runtime:** Node.js 20 LTS, ESM throughout.
- **Backend:** Express 4, mysql2 (parameterized queries only).
- **Frontend:** React 18 on Create React App, Tailwind CSS, axios.
- **Database:** MySQL 8.
- **Language:** TypeScript with `strict: true` on both frontend and backend.
- **Validation:** Zod for all request/response schemas.
- **Testing:** Jest + React Testing Library (frontend), Jest (backend).
- **Logging:** pino with structured JSON output.
- **Auth:** Session-based with a single configured operator credential. No
  signup, no multi-user.
- **Secrets:** loaded from `.env` via dotenv. `.env` is gitignored. A
  committed `.env.example` documents required variables.

## Architecture

- `/backend/src/routes/` — Express route handlers, one file per resource.
- `/backend/src/db/` — DB access. All queries use mysql2 `?` placeholders.
- `/backend/src/schemas/` — Zod schemas for request validation.
- `/backend/src/services/` — Logic spanning multiple tables (e.g. creating a
  Contact + POTA QSO in a single transaction).
- `/backend/src/migrations/` — Numbered, forward-only SQL migrations.
- `/client/src/pages/` — Top-level views.
- `/client/src/components/` — Reusable UI components.
- `/client/src/api/` — Typed wrappers around backend endpoints.
- `/client/src/types/` — Shared TypeScript types mirroring backend schemas.
- `/docs/adr/` — Architecture Decision Records.
- `/scripts/` — One-off operational scripts (ADIF import/export, backups).
- `.claude/agents/` — Specialized review and writing agents. Invoke by name
  when their description matches the task.

## Conventions

- **REST routing:** Resource-based, lowercase plural. `POST /api/qsos`,
  `DELETE /api/qsos/:id`, `GET /api/qsos?callsign=...`. No verbs in paths.
- **HTTP verbs:** GET for reads only. POST/PUT/PATCH/DELETE for writes.
  Never use GET for state-changing operations.
- **SQL:** Always parameterized. Never interpolate user input into a query
  string. If you reach for a template literal in a query, stop.
- **Time:** All timestamps stored as UTC in `DATETIME` columns. The client
  formats to local time for display only. QSO times are always logged in UTC.
- **Frequency:** Stored as `DECIMAL(10,6)` in MHz (e.g. `14.074000`). Band is
  derived in code, not stored as a denormalized column.
- **Naming:**
  - DB columns: `snake_case`. Drop redundant table prefixes
    (`qso_callsign` → `callsign`).
  - TypeScript: `camelCase` for variables/functions, `PascalCase` for types.
  - Files: `kebab-case.ts` for modules, `PascalCase.tsx` for React components.
- **Imports:** Absolute imports rooted at `src/`. No `../../../` chains.
- **React:** No module-level mutable state in component files. Use `useState`,
  `useRef`, or context. Side effects belong in `useEffect`, not in the render
  path.
- **Error handling:** Throw typed errors at the service layer; convert to HTTP
  responses in route handlers. Never return error details to the client beyond
  a sanitized message and a request ID.

## Out of Scope for v1

- Multi-user accounts or any auth beyond a single operator login.
- Cloud or public deployment.
- Real-time spotting integration (RBN, DX clusters).
- Rig control (CAT/CI-V) or audio interfacing.
- Native mobile apps (mobile web is sufficient).
- SOTA UI — keep the data model scaffolded but no screens.
- WSJT-X / FT8 mode integration.
- Multilingual UI.

## Data Preservation

This repo has a live production database with the maintainer's QSO history.
**All refactors must preserve existing data.** This rule overrides everything
else in this file when they conflict.

- Schema changes ship as numbered forward-only migrations in
  `/backend/src/migrations/`.
- Every migration is accompanied by:
  1. A documented backup step the operator runs first
     (`mysqldump HamLogDB > backup-YYYYMMDD-HHMM.sql`).
  2. A verify query that runs after, asserting row counts and key invariants
     match expectations.
- Never write a destructive migration (`DROP TABLE`, `DROP COLUMN` against a
  populated column, `TRUNCATE`) in a single step. Add the new column,
  backfill, deprecate, then drop in a later release after the operator
  confirms.
- For renames, use `expand → migrate → contract`: add the new column, dual-
  write, backfill, switch reads, drop the old column in a later migration.

## Git Workflow

After any code change is complete and verified (tests pass / lint clean /
feature works), do the following without being asked:

1. `git add -A` to stage all changes
2. Commit with a concise conventional-commit message
   (e.g. `feat: add user auth middleware`, `fix: handle empty cart edge case`,
   `refactor: extract validation into shared module`, `docs: update README`)
3. `git push` to push to origin/main

Commit at logical checkpoints — a complete feature, a bug fix, a refactor —
not after every individual file edit. If a task spans multiple commits, make
each commit independently meaningful and atomic.

If `git push` fails (auth, conflict, network), surface the full error to the
user immediately. Do not retry silently or attempt destructive resolutions
(no `--force`, no resetting branches).

Never commit secrets, API keys, .env files, or anything matching .gitignore.

## Engineering Principles

### Tests are required, not optional

- Every new feature, bug fix, or non-trivial change ships with tests.
- For new functionality, prefer test-first: write the test from the spec,
  then implement until it passes.
- A task is not "done" until the relevant tests pass. Do not report
  completion with failing or skipped tests.
- When fixing a bug, first write a test that reproduces the bug (and fails),
  then fix it. This prevents regressions.
- Keep the test suite fast. If a test is slow, isolate it (mark as
  integration or e2e) so the default `test` command stays under 10 seconds
  for unit tests.

### Tight feedback loops

- Use strict typing everywhere (TypeScript strict mode / Pydantic / Zod —
  whatever the stack supports). Type errors should surface immediately.
- Run lint and typecheck before declaring a task complete.
- Add structured logging at module boundaries from day one. When something
  breaks, logs should narrow the cause in seconds, not minutes.
- If a change requires manual verification (UI, integrations), state exactly
  what to check and how — don't leave it implicit.

### Spec before code for non-trivial work

- For any task touching 3+ files, introducing a new module, or changing a
  contract between components: produce a spec FIRST in plan mode. Do not
  start editing until the user has approved the plan.
- For significant architectural decisions, write a short ADR (Architecture
  Decision Record) in `/docs/adr/` capturing: context, options considered,
  decision, consequences. Reference the ADR in commit messages.
- Read `/docs/` and `/specs/` (if they exist) before starting work. Those
  files describe intent; the code describes implementation. Both matter.

### Taste and restraint

- Prefer the simplest solution that solves the problem. Resist adding
  abstraction, config options, or framework features that aren't justified
  by an actual requirement.
- If a diff is getting large, stop and ask whether the task should be
  decomposed into smaller commits.
- Reuse existing patterns in the codebase before inventing new ones.