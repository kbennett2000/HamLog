# Session Handoff

Date: 2026-06-04. Branch: `quality/f10-import-record-cap` (open, up to date
with `origin/quality/f10-import-record-cap` as of this writing, but see below —
all 8 PRs have merged, so main is ahead and this branch is effectively done).
HamLog = self-hosted amateur radio QSO logger (React 18 + Tailwind, Express +
MySQL, Docker Compose, TypeScript strict).

## Goal

Systematic security and code-health cleanup driven by `SECURITY_AUDIT.md` (repo
root, currently untracked). The audit identified 10 findings (F1–F10) against a
home-LAN threat model. The goal was proportionate hardening — not enterprise
security — delivered as 8 small, independently reviewable PRs, one per finding
or closely related pair.

## Done

All 8 PRs were merged to `main` on 2026-06-04. The current `main` tip is
`80c94b96 feat: cap ADIF import record count (Data-quality F10)`. The backend
test suite now has 88 passing tests (up from 45 before this session).

**PR #37 — F1: require explicit DB passwords (MERGED)**
- `docker-compose.yml`: changed `${DB_PASSWORD:-default}` / `${DB_ROOT_PASSWORD:-default}` to `${DB_PASSWORD:?...}` / `${DB_ROOT_PASSWORD:?...}` — Compose now refuses to start if either env var is unset, eliminating the "forgot the .env and ran on the public default password" footgun.

**PR #38 — F2: run container as non-root (MERGED)**
- `backend/Dockerfile`: added `USER node` so the Express process runs as the unprivileged `node` user rather than root.

**PR #39 — F4: patch backend dependencies (MERGED)**
- `npm audit fix` in `backend/`: resolved all prod vulnerabilities. The headline fix was mysql2 3.7.0 → 3.22.4, which addressed a CRITICAL RCE. Note: the audit initially mislabeled this as an Express-transitive issue; it is actually a direct mysql2 CVE.

**PR #40 — F5+F6: helmet security headers + CORS (MERGED)**
- `backend/src/index.ts`: added `helmet()` (adds ~12 security headers including CSP in report-only mode) and tightened CORS so same-origin is the default; non-default origins must be set via `CORS_ORIGIN`.
- `docker-compose.yml`: `CORS_ORIGIN` wired as a compose env var.
- CSP is intentionally **report-only** (see ADR 0009).

**PR #41 — F3+F8: rate-limit auth + throttle HamDB lookup (MERGED)**
- New `backend/src/middleware/rate-limit.ts`: two limiters — `authLimiter` (10 requests / 15 min per IP, applied to `POST /api/auth/login` and `POST /api/auth/register`) and `hamdbLimiter` (20 requests / min per authenticated user ID).
- Uses `express-rate-limit`; no new infrastructure required.

**PR #42 — F7: validate `/api/qsos/map` query params (MERGED)**
- New `backend/src/schemas/map.schema.ts`: Zod schema for `from` / `to` (ISO date strings, optional, `from` must precede `to` when both are present).
- New `backend/src/middleware/validateQuery.ts`: parallel to the existing `validate.ts` middleware but operates on `req.query` rather than `req.body`.
- Closes the deferred item from the 2026-05-28 handoff.

**PR #43 — F9: lean-permissive field-format validation (MERGED)**
- New `backend/src/schemas/field-formats.ts`: shared regex validators for callsign (1–2 letter prefix, 1–4 digit zone, 1–4 letter suffix, optional /portable), frequency (1–6 decimal places in MHz), and Maidenhead grid square (2+2 or 2+2+2+2 format, case-insensitive).
- Applied via Zod refinements in the existing QSO create/update schema.
- ADIF import path refactored: logic extracted into a testable `importAdif()` service function; bad records are skipped and collected into a `skipped[]` report rather than aborting the whole import.
- The SQLi characterization test was moved from the `callsign` field (which now rejects non-callsign strings) to the `notes` field (free-text, no format restriction).

**PR #44 — F10: cap ADIF import record count (MERGED)**
- `backend/src/routes/adif.ts`: rejects import payloads exceeding `MAX_IMPORT_RECORDS` (default 50 000) with HTTP 422 before any processing.
- `MAX_IMPORT_RECORDS` is env-tunable for operators with larger logs.
- Reject-not-truncate: the operator is told the file is too large rather than silently discarding records.

## Decisions

Significant choices, including those made without explicit discussion. See the
corresponding ADRs in `docs/adr/` for full reasoning.

- **ADR 0007 — LAN threat model is the scope boundary.** Fixes were deliberately
  proportionate to the home-LAN adversary (a LAN guest, a curious registered
  user, accidental internet exposure). Enterprise-grade hardening (HttpOnly
  cookies, MFA, HTTPS as a hard requirement) was explicitly out of scope and
  not recommended. Referenced by all 8 PRs.

- **ADR 0008 — Rate-limiting keyed by IP for unauthenticated routes, by user ID
  for authenticated routes.** Auth endpoints (login/register) use IP because
  there is no user yet. HamDB lookup uses the authenticated user ID so a
  shared NAT/VPN does not let one user's burst penalize another.

- **ADR 0009 — CSP is report-only, not enforcing.** Enforcing CSP requires
  knowing every origin the app legitimately loads from. OSM tile URLs and any
  future third-party resources would need to be enumerated. Report-only is a
  safe first step; the next session should review the browser console for
  violations and then flip to enforcing.

- **ADR 0010 — Field validation is lean-permissive, not strict.** The callsign
  regex accepts the vast majority of real callsigns without attempting to cover
  every ITU edge case (maritime mobile, aeronautical, portable suffixes beyond
  /P). Over-rejection of real QSOs is worse than under-rejection of garbage.
  The ADIF import skip-and-report path means a bad import record does not abort
  a 900-record file.

- **ADR 0011 — ADIF import skips-and-reports bad records; rejects over-cap files
  up front.** Two independent decisions bundled: (1) skip bad records + return a
  `skipped[]` report rather than aborting on first error; (2) refuse files over
  `MAX_IMPORT_RECORDS` with a clear error rather than silently truncating. The
  cap is env-tunable for operators who know their log is large.

- **mysql2 RCE (PR #39).** The audit tooling initially attributed the CRITICAL
  CVE to Express as a transitive dependency. After investigation it was a direct
  mysql2 vuln (3.7.0 → 3.22.4 fixed it). Worth knowing if the audit report is
  re-read — the attribution in the tooling output was wrong.

## In progress

Nothing is mid-edit. All 8 PRs have merged. The current branch
(`quality/f10-import-record-cap`) has no uncommitted changes to code — only 6
untracked files that were intentionally not committed during the session (see
Pending below).

## Pending / next session

These are ordered by urgency.

1. **Commit the 5 new ADRs (0007–0011) and `SECURITY_AUDIT.md`.** They are
   currently untracked on `quality/f10-import-record-cap`, which is otherwise
   done. Options: (a) commit them directly to `main` (they are docs only,
   low-risk), or (b) open a tiny `docs/add-security-adrs` PR. The ADRs live at:
   - `docs/adr/0007-lan-threat-model-and-security-proportionality.md`
   - `docs/adr/0008-rate-limiting-key-strategy.md`
   - `docs/adr/0009-csp-report-only.md`
   - `docs/adr/0010-qso-field-validation-lean-permissive.md`
   - `docs/adr/0011-adif-import-skip-report-and-record-cap.md`
   - `SECURITY_AUDIT.md` (root) — decide whether this is permanent docs or a
     scratch artifact; if scratch, delete it instead of committing.

2. **Operator action: rotate DB passwords (tied to PR #37).** If the deployment
   was ever started without a `.env` (using the old `:-default` fallbacks), the
   live MySQL is running on the well-known repo defaults. The operator must
   rotate `DB_PASSWORD` and `DB_ROOT_PASSWORD` in `.env` and restart the stack.
   No git-history purge is needed (no real secret was ever committed; the
   defaults were literal strings in `docker-compose.yml`).

3. **Browser-verify CSP after PR #40 deploys.** Load the app (including the QSO
   map) in a browser with DevTools open. Confirm OSM tiles render and no
   `Content-Security-Policy-Report-Only` violations appear in the console. Once
   clean, flip CSP from report-only to enforcing in `backend/src/index.ts`. See
   ADR 0009.

4. **Count-label scope label (low priority, carried from 2026-05-28 handoff).**
   Append "in this range" to the QSO map count label when a non-"All" filter is
   active. If done, update `formatMapCount` in `client/src/utils/map-view.ts`,
   `map-view.test.ts`, and `Map.test.tsx`.

5. **`App.test.tsx` parse failure (pre-existing tech debt, carried from
   2026-05-28 handoff).** CRA's Jest 27 cannot resolve react-router-dom v7 (ESM
   only) when loading `App.test.tsx`. The `moduleNameMapper` added in the prior
   session changed the error message but did not fix it. Fix requires either a
   custom Jest transform config for that package or ejecting CRA.

## Open questions

- **Should `SECURITY_AUDIT.md` be committed or deleted?** It is a review
  artifact / spec doc. If it has value as a historical record of what was found
  and fixed, commit it (perhaps to `docs/`). If it was a scratch working doc,
  delete it. Decision for the operator.

- **CSP enforcing: when?** ADR 0009 says "flip to enforcing after the operator
  confirms no violations." No timeline was set. This is a follow-up the operator
  should drive after the first deployment with PR #40 in place.

- **Social preview image (carried from 2026-05-28 handoff).** Upload
  `docs/social-banner.png` via GitHub's web UI at Settings > General > Social
  preview. Steps are in `scripts/screenshots/README.md`.

- **Commit `4f919205 updated agents` authorship (carried from 2026-05-28
  handoff).** An operator-authored commit modified `.claude/agents/` without a
  `Co-Authored-By` trailer. Status still unresolved — ask the operator whether
  those edits were intentional.

## Watch out for

- **All 8 PRs are merged; `main` is ahead of the current working branch.** The
  branch `quality/f10-import-record-cap` only has the 6 untracked files as
  pending work. Do not open new feature work from this branch — check out
  `main` first.

- **Docker was not available in the dev environment this session.** Every PR
  includes a note that Docker build/run and live-DB checks were deferred to
  the operator or CI. The backend test suite's DB-dependent characterization
  cases skip automatically without a live MySQL; that is expected behavior, not
  a test gap.

- **CSP is intentionally report-only.** The `Content-Security-Policy-Report-Only`
  header in PR #40 is not a forgotten TODO — it is a deliberate staged rollout
  per ADR 0009. Do not flip it to `Content-Security-Policy` until the browser
  console is clean.

- **`express-rate-limit` stores rate-limit state in memory.** If the container
  restarts, counters reset. This is intentional for a home LAN; no Redis or
  shared store is needed. Do not add one unless the threat model changes.

- **ADIF import rejects over-cap files, does not truncate.** This is
  intentional per ADR 0011. If an operator has a legitimate log > 50 000
  records, they set `MAX_IMPORT_RECORDS` in `.env`. Do not change this to
  silently truncate — the operator must know records were dropped.

- **mysql2 upgrade (PR #39) is a major version jump (3.7 → 3.22).** If
  unexpected query behavior surfaces after upgrading, check the mysql2 changelog
  between those versions. The backend tests passed and a live-curl demo worked,
  but exotic query patterns (e.g. streaming large result sets) were not
  exercised.

- **PR lockfile conflicts.** When merging PRs that both touch `backend/package.json`
  or `backend/package-lock.json` (PRs #39, #41, #43 all do), merge main into
  the branch and regenerate the lockfile before merging. This happened once
  during this session (#40 vs the F4 merge) and was resolved cleanly.

- **Real operator data lives in the local Windows Docker instance.** It holds
  ~920+ actual contacts. Never use it for screenshots, demos, or fixtures. Use
  the disposable `hamlog-demo` Compose project (port 8060, seeded from
  `scripts/screenshots/demo-seed.sql` with fictional data) and tear it down
  with `docker compose -p hamlog-demo down -v` when done.

- **react-leaflet is pinned to v4.** Do not upgrade to v5 without first
  migrating the frontend to React 19.

- **Backend tests use `jest.unstable_mockModule`.** The backend is `"type":
  "module"` (native ESM). `jest.mock()` does not work; `jest.unstable_mockModule`
  + top-level `await import(...)` + `@jest/globals` is the required pattern for
  all new backend tests.

- **`client/package.json` has a `moduleNameMapper` entry for react-router-dom**
  pointing to `./node_modules/react-router-dom/dist/index.js` (the CJS build).
  If react-router-dom is upgraded or its dist layout changes, this path needs
  updating.

- **SOTA is scaffolded only.** No SOTA UI per CLAUDE.md. Do not advertise it.
