# Session Handoff

Date: 2026-05-27. Branch: `main` (clean, up to date with `origin/main` at the
time of writing). HamLog = self-hosted amateur radio QSO logger (React 18 +
Tailwind, Express + MySQL, Docker Compose, TypeScript strict).

## Goal

Take HamLog from "functional after the 7-phase cleanup" to a polished,
publishable v1.0.0: visual overhaul, three new user-facing features (map,
search, sort), offline-awareness, complete end-user documentation with
screenshots, and GitHub discoverability/community-health setup — plus a v1.0.0
release.

## Done

All of the following are committed and pushed to `origin/main`. Commit order
(oldest first), verified against `git log`:

- `db61054b feat: complete UI visual overhaul with three selectable themes`
  - New `client/src/contexts/ThemeContext.tsx`. Themes: `theme-indigo`
    (default) / `theme-teal` / `theme-dark`, applied via CSS variables,
    persisted in localStorage key `hamlog-theme`.
  - Custom Tailwind theme in `client/tailwind.config.js` referencing CSS vars
    (`--color-primary` / `--color-accent` / `--color-danger` /
    `--color-surface-*`) defined in `client/src/index.css`.
  - Self-hosted Inter font (`@fontsource-variable/inter`), `lucide-react`
    icons.
  - Redesigned NavBar (mobile hamburger), Contacts (desktop table + mobile
    cards), CallsignInfo / QSOsForParkNumber (now non-blocking floating
    panels, not full-screen overlays), modals (backdrop blur + mobile
    bottom-sheet), Login / Register, Settings. Design tokens live in
    `client/src/config.ts`.
  - Review fixes folded in: modal-vs-tooltip z-index, dark-unsafe
    `color-50` → `color-500/10`, empty-callsign mouseover guard.
- `f833bef5 fix: remove Unix-only PORT syntax from start script for Windows compat`
  - Fixed `client/package.json` start script (dropped Unix `PORT=4000`
    prefix). Added gitignored `client/.env` with
    `DANGEROUSLY_DISABLE_HOST_CHECK=true` (works around a react-scripts 5 dev
    bug).
- `c8d5a8be docs: improve .env.example with quick-start instructions`
  - Docker LAN quick-start comments. Port configurable via `PORT`
    (default 8050); a single app container serves API + built frontend.
- `832023c4 feat: add QSO map with HamDB callsign lookup and time filters`
  - `client/src/pages/Map.tsx` (Leaflet + `react-leaflet@4` — intentionally
    DOWNGRADED from v5, which requires React 19).
  - `backend/src/services/hamdb-service.ts` (hamdb.org via Node `fetch`,
    returns null on failure).
  - `backend/src/services/contact-info-service.ts`:
    `lookupAndCreateContactInfo` / `updateContactInfoFromHamDB` /
    `getCallsignsNeedingBackfill`.
  - `backend/src/services/qso-service.ts`: `createContact` fires an async
    lookup; new `getQsosForMap`.
  - Endpoints: `GET /api/qsos/map?from=&to=`, `POST /api/contact-info/lookup`,
    `POST /api/contact-info/backfill`. Map nav link + Settings backfill button.
  - Filters: Day / Week / Month / 6mo / Year / All / Custom.
- `71648a3d feat: add client-side QSO search with multi-field filtering`
  - `client/src/components/SearchBar.tsx` + `client/src/utils/filter-qsos.ts`.
    AND-combined fields: callsign / date-range / frequency / band / mode /
    POTA park / notes.
- `fb286255 feat: add sortable column headers to QSO log table`
  - `client/src/components/SortableHeader.tsx` + `client/src/utils/sort-qsos.ts`.
    Band sorts by frequency order. Contacts render pipeline:
    conditions → `filterQsos` → `sortQsos` → display.
- `1038deaa fix: add offline-aware UX for map tiles and callsign backfill`
  - App is ~95% offline already; only external deps are HamDB and OSM tiles.
    Added a map tile-error banner + a "needs internet" hint on the Settings
    backfill action. No features removed.
- `027c958a docs: comprehensive documentation for non-technical ham operators`
  (note: `f8259563 cleanup` sits between this and the previous feature commit)
  - Rewrote `README.md`; created `docs/install-ubuntu.md`,
    `docs/install-windows.md`, `docs/install-mac.md`, `docs/user-guide.md`,
    `docs/troubleshooting.md`. (Screenshot placeholders, filled in by the next
    commit.)
- `f1d6662c docs: add documentation screenshots and reproducible capture tooling`
  - 14 PNGs in `docs/screenshots/` (verified: login, register, log-table,
    search-bar, sort-columns, callsign-hover, expanded-row, add-qso,
    add-qso-pota, map-view, map-popup, settings-theme, settings-backfill,
    log-mobile).
  - Captured from a THROWAWAY isolated instance: Compose project
    `hamlog-demo`, port 8060, separate volume, torn down with `down -v`.
    Seeded with FICTIONAL data only via `scripts/screenshots/demo-seed.sql`
    (user W1DEMO / demo1234, ~18 invented callsigns, global lat/lng).
  - `scripts/screenshots/capture.mjs` (Playwright).
  - `.gitignore` exceptions: fictional `demo-seed.sql` + `.env.demo.example`
    are tracked; real `.env.demo` + `node_modules` stay ignored. VERIFIED:
    `git check-ignore` confirms `.env.demo` is ignored while `demo-seed.sql`
    and `.env.demo.example` are tracked.
- `6d18297c docs: boost discoverability — banner, badges, community health files`
  - Set repo description (dropped the inaccurate SOTA claim) + 18 topics via
    `gh`. Branded `docs/social-banner.png` (1280x640) via
    `scripts/screenshots/banner.html` + `make-banner.mjs`. README banner +
    shields.io badges.
  - `.github/`: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
    `ISSUE_TEMPLATE/{bug_report.yml, feature_request.yml, config.yml}`,
    `PULL_REQUEST_TEMPLATE.md` (all verified present).
- `4f919205 updated agents` — see "Watch out for"; this is NOT what the working
  record predicted.
- Release **v1.0.0** published; tag `v1.0.0` exists in the repo.
- GitHub issue **#35** (QSO map) closed with a summary.

## Decisions

- Theming via CSS variables + a Tailwind theme that references them, with
  three named themes and localStorage persistence. (Explicit.)
- `react-leaflet` pinned to **v4** because v5 requires React 19; HamLog is on
  React 18. Do not bump react-leaflet without first migrating React. (Explicit.)
- HamDB (hamdb.org) chosen as the callsign-lookup provider; lookups are
  best-effort and return null on failure rather than throwing. (Explicit.)
- Callsign enrichment is async/fire-and-forget on contact creation, with a
  manual backfill endpoint/button for historical rows. (Explicit.)
- Map/search/sort layered as a client-side render pipeline
  (`filterQsos` → `sortQsos`) over data already fetched, rather than
  server-side query params (except the map's `from`/`to`). (Implicit but
  consistent across the SearchBar/SortableHeader work.)
- Screenshots must come from a disposable instance seeded with fictional data,
  because the LOCAL Windows Docker instance contains the operator's REAL log
  (see "Watch out for"). (Explicit — drove the whole `scripts/screenshots/`
  isolation design.)
- Single app container serves both the API and the built frontend; LAN port is
  configurable via `PORT`. (Explicit.)

## In progress

Nothing is mid-edit. The working tree is clean and there are no unpushed
commits.

## Pending / next session

- **Tests (REQUIRED by CLAUDE.md, NOT done this session).** No automated tests
  were added for any of this session's work. At minimum, cover:
  - `client/src/utils/filter-qsos.ts` (AND-combined multi-field filtering,
    incl. date-range and frequency/band edge cases).
  - `client/src/utils/sort-qsos.ts` (especially band-sorts-by-frequency-order).
  - `backend/src/services/hamdb-service.ts` (null-on-failure path, fetch
    mocking).
  - New components `SearchBar.tsx`, `SortableHeader.tsx`, `Map.tsx`.
  CLAUDE.md states a task is not "done" until relevant tests pass — treat this
  as the top outstanding item.
- **Manual GitHub follow-up (cannot be done from CLI):** upload the social
  preview image via the web UI — Settings → General → Social preview →
  `docs/social-banner.png`. Steps are in `scripts/screenshots/README.md`.
- Decide the fate of commit `4f919205 updated agents` (see "Watch out for").

## Open questions

- **What is commit `4f919205 updated agents`?** It is currently HEAD and is
  pushed to `origin/main`. It modifies `.claude/agents/code-reviewer.md`,
  `debugger.md`, `doc-writer.md`, `test-writer.md` and adds
  `decision-recorder.md` + `session-closer.md` (6 files, +119/-15). It was
  authored as `Kris Bennett <kbennett2000@hotmail.com>` with NO
  `Co-Authored-By` trailer — i.e. it does not look like an AI-assisted commit
  from this project's normal flow (which uses
  `Co-Authored-By: Claude Opus 4.7 (1M context)`). The prior session's working
  record believed these edits had been `git reset` and left uncommitted with
  "origin unknown". They are NOT uncommitted — they are committed and pushed.
  Next session should confirm with the operator whether these agent changes
  were intended to land on `main`, and revert if not.
- Are the agent-definition edits in `4f919205` consistent with how this repo
  wants its `.claude/agents/` maintained, or were they accidental local edits
  swept up by a `git add -A`? Unresolved.

## Watch out for

- **Real operator data lives in the LOCAL Windows Docker instance.** It holds
  the operator's actual log (~920 contacts, real callsigns/names). NEVER use
  it for screenshots, demos, or fixtures. Use the disposable `hamlog-demo`
  Compose project (port 8060, separate volume) with
  `scripts/screenshots/demo-seed.sql` instead, and tear it down with
  `down -v`. The real instance was verified untouched (920 contacts) after the
  screenshot work.
- **Separate-server data migration was guidance only — no repo change.** The
  operator's production log runs on a separate Ubuntu server.
  `backups/2024_04_06_HamLogDB.sql` is a PRE-multi-user dump; its
  `DROP TABLE` + old-schema recreate strips the `user_id` column, so naively
  importing it hides QSOs (they have no owner). The fix given was SQL to
  `ALTER` add `user_id` / `qso_datetime_utc` / `frequency_mhz` / `mode` /
  `band` then backfill `user_id = 1`. That SQL was run on THEIR server, not in
  this repo — do not assume any migration file exists here for it.
- **`4f919205 updated agents` is an unexpected commit at HEAD** (see Open
  questions). The git history diverges from the prior session's stated
  expectation here; trust `git log`, not the narrative that those edits were
  left uncommitted.
- **SOTA is scaffolded only, not implemented.** Do not advertise it (the repo
  description was deliberately corrected to drop the SOTA claim). No SOTA UI
  per CLAUDE.md "Out of Scope for v1".
- **Regenerating screenshots/banner needs internet** (Playwright Chromium
  download + OSM tiles). The app itself is offline-capable; only the capture
  tooling needs the network.
- **GitHub community-profile health shows ~85%**, because GitHub only counts a
  legacy single issue template, not the `ISSUE_TEMPLATE/` forms. The forms
  work correctly; the percentage is cosmetic.
- **`session-closer` agent file exists but is not a registered/launchable
  subagent type in this runtime.** Its definition is present at
  `.claude/agents/session-closer.md` (added in `4f919205`) but cannot be
  invoked as a subagent here.
- Project commit convention for AI-assisted work:
  `Co-Authored-By: Claude Opus 4.7 (1M context)`. (Commit `4f919205` notably
  lacks this trailer.)
