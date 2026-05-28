# Session Handoff

Date: 2026-05-28. Branch: `main` (clean, up to date with `origin/main` as of
this writing). HamLog = self-hosted amateur radio QSO logger (React 18 +
Tailwind, Express + MySQL, Docker Compose, TypeScript strict).

## Goal

Fix and polish the QSO map feature introduced in a prior session: the map
rendered off-center at a fixed zoom with the world repeating horizontally and
pins appearing in only one tile copy. Additionally, surface a meaningful QSO
count (distinguishing "plotted" from "total in window"), add guidance when the
map is empty, and keep documentation and screenshots in sync.

## Done

All of the following are committed and pushed to `origin/main`. Commits
confirmed against `git log` (oldest first):

- `f088519b fix: auto-fit QSO map to all pins and use a single non-wrapping globe`
  - New pure helper `client/src/utils/map-view.ts`: exports constants
    (`WORLD_CENTER [20,0]`, `WORLD_ZOOM 2`, `MIN_ZOOM 2`, `FIT_MAX_ZOOM 10`,
    `FIT_PADDING [40,40]`, `MAX_BOUNDS [[-90,-180],[90,180]]`), `isValidCoord`
    (rejects non-finite / out-of-range / exactly 0,0 null-island), and
    `getMarkerBounds` (bbox over valid markers or null when none).
  - `client/src/pages/Map.tsx`: replaced the average-center/fixed-zoom/`key`-
    remount approach with a `FitBounds` child component that uses
    react-leaflet's `useMap()` + `useEffect` to call `map.fitBounds` on
    mount and on every filter change; falls back to `map.setView(WORLD_CENTER,
    WORLD_ZOOM)` when there are no valid markers. `TileLayer` got `noWrap`;
    `MapContainer` got `minZoom`, `maxBounds`, and `maxBoundsViscosity=1`.
    Invalid-coord markers are filtered from pins, count, and fit math.
  - `client/src/index.css`: `.leaflet-container` background set to
    `var(--color-surface-200)` via `html .leaflet-container { ... }` (unlayered
    selector + bumped specificity to override leaflet.css's default gray).
  - New test files: `client/src/utils/map-view.test.ts` and
    `client/src/pages/Map.test.tsx` (react-leaflet and react-router-dom both
    jest.mock'd because both ship ESM and break CRA's Jest 27 bundled resolver).
  - `docs/user-guide.md` updated (removed now-false "centers on average
    position" and "background turns grey" descriptions).

- `9ac344a3 feat: clarify QSO map count, add empty-state guidance and date labels`
  - `backend/src/services/qso-service.ts`: new `getQsoCountForRange(userId,
    from?, to?)` function, fetches total QSO count for the time window
    regardless of geocoding status.
  - `backend/src/routes/qsos.ts`: `GET /api/qsos/map` now fetches markers and
    total in parallel (`Promise.all`) and returns `{ markers, total }`.
  - `client/src/types/qso.ts`: new `MapData { markers, total }` type.
  - `client/src/api/hamlog-api.ts`: `getMapData` return type updated to
    `MapData`.
  - `client/src/utils/map-view.ts`: `formatMapCount(valid, total)` — returns
    "N QSOs on map" when all are plotted, "X of Y QSOs mapped" otherwise.
  - `client/src/utils/map-view.test.ts` and `client/src/pages/Map.test.tsx`
    expanded with count/empty-state/label tests (49 total frontend map tests).
  - `client/src/pages/Map.tsx`: empty-state banner below the filter bar
    ("No QSOs in this time range." when total is 0; "Backfill Locations" Link
    to /settings when total > 0 but none geocoded); Custom date inputs got
    From/To labels + `aria-label`; popup dates use `toLocaleDateString()`
    instead of hard-coded `en-US`; `loading` initializes `true` to suppress
    empty-state flash on mount.
  - `client/package.json`: `jest.moduleNameMapper` entry routing
    `^react-router-dom$` to its CJS `dist/index.js` so CRA's Jest 27 can
    resolve the module when mocking it. (react-router-dom v7 ships only ESM
    in its default export; CRA's Jest can't handle that for mocks.)
  - `backend/__tests__/qso-service.test.ts`: the project's first DB-mocking
    backend test — 6 cases, uses `jest.unstable_mockModule` + top-level
    `await import` + `@jest/globals` (required native-ESM pattern for the
    backend's `"type": "module"` package).
  - `docs/user-guide.md` updated with count label and empty-state guidance.

- `2ee3154c docs: regenerate map screenshots for the single-globe view`
  - `docs/screenshots/map-view.png` and `map-popup.png` recaptured from a
    current build (single non-wrapping globe, auto-fit view).
  - `scripts/screenshots/capture.mjs`: removed the now-obsolete manual
    zoom-out step that existed to work around the old fixed-zoom behavior.

## Decisions

- `isValidCoord` rejects exactly `(0, 0)` (null island) in addition to
  out-of-range and non-finite values. This is the pragmatic call for ham radio:
  a real QSO contact at lat 0 / lng 0 (Gulf of Guinea) is theoretically
  possible but vanishingly unlikely, and an unset coordinate defaults to 0,0 in
  the DB. Accepted as a known trade-off; no alternative was considered in depth.
- `FitBounds` is a separate child component rather than logic inside the parent
  `Map` component because react-leaflet's `useMap()` hook can only be called
  inside a `MapContainer` descendant, not in the component that renders the
  `MapContainer` itself. This is a react-leaflet architectural constraint, not
  a style preference.
- The backend returns `total` alongside `markers` (via `Promise.all`) rather
  than computing it on the client from the existing markers array, because the
  markers array only contains geocoded QSOs — the client has no way to know
  how many non-geocoded QSOs exist in the window. A second DB query was the
  only correct approach.
- `jest.moduleNameMapper` pointing react-router-dom to its CJS build was chosen
  over alternatives (transformIgnorePatterns, custom resolver) because it is
  the narrowest possible change and does not affect runtime behavior — only
  Jest's module resolution for that one package.
- Zod validation for `GET /api/qsos/map`'s `from`/`to` query params was
  explicitly deferred (see Pending). The inputs are `type=date` HTML fields so
  the UI cannot produce an invalid value, and the issue pre-dates this session.

## In progress

Nothing is mid-edit. Working tree is clean, all three commits pushed.

## Pending / next session

- **Zod validation for `GET /api/qsos/map` query params.** The `from` and `to`
  date strings are currently unvalidated on the backend. The code reviewer
  flagged this as a hardening gap. Deferred this session as out-of-scope.
  Add a Zod schema in `backend/src/schemas/` and wire it through the route
  validation middleware, matching the pattern used by other endpoints.
- **Count label scope label (marginal).** The fresh-eyes review suggested
  appending "in this range" to the count label when a non-"All" filter is
  active, for clarity. Deferred as low-priority. If done, update
  `formatMapCount` signature and adjust `map-view.test.ts` and `Map.test.tsx`.
- **`App.test.tsx` cannot load under CRA Jest.** Pre-existing issue: the test
  file fails to even parse because react-router-dom v7 ships ESM and CRA's
  Jest 27 bundled resolver can't handle it. The `moduleNameMapper` added this
  session changed the error message but did not fix it. The entire frontend map
  test suite (49 tests) and the full backend suite (45 tests) pass regardless.
  Fix requires either upgrading react-router-dom's test setup or ejecting CRA.
  Left as pre-existing tech debt.
- **Social preview image** (manual GitHub step — cannot be done from CLI):
  upload `docs/social-banner.png` via GitHub's web UI at Settings > General >
  Social preview. Steps documented in `scripts/screenshots/README.md`.

## Open questions

- None new from this session. The open question about commit `4f919205 updated
  agents` from the prior session (operator-authored, no Co-Authored-By trailer,
  modifying `.claude/agents/`) remains unresolved. Ask the operator whether
  those agent-definition edits were intentional and whether they should stay
  on `main`.

## Watch out for

- **Real operator data lives in the LOCAL Windows Docker instance.** It holds
  the operator's actual log (~920+ contacts, real callsigns/names). NEVER use
  it for screenshots, demos, or fixtures. Use the disposable `hamlog-demo`
  Compose project (port 8060, separate volume, seeded from
  `scripts/screenshots/demo-seed.sql` with fictional data) and tear it down
  with `docker compose -p hamlog-demo down -v` when done.
- **react-leaflet is pinned to v4.** Do not upgrade to v5 without first
  migrating the frontend to React 19. v5 requires React 19; HamLog is on
  React 18.
- **Backend tests use `jest.unstable_mockModule`.** The backend is
  `"type": "module"` (native ESM). `jest.mock()` does not work for ESM
  modules; `jest.unstable_mockModule` + top-level `await import(...)` +
  `@jest/globals` is the required pattern. Do not switch to `jest.mock()` for
  new backend tests.
- **`client/package.json` has a `moduleNameMapper` entry for react-router-dom**
  pointing it at `./node_modules/react-router-dom/dist/index.js` (the CJS
  build). This is needed so CRA's Jest 27 can resolve react-router-dom when
  it is mocked in `Map.test.tsx`. If react-router-dom is upgraded or
  restructured, this path will need updating.
- **`formatMapCount` in `client/src/utils/map-view.ts` takes `(valid, total)`
  not `(total, valid)`.** Argument order matters; the tests cover this but
  swapping the args produces a plausible-looking wrong result rather than a
  crash.
- **The `loading` state in `Map.tsx` initializes `true`** so the component does
  not briefly show an empty-state banner before the first fetch completes.
  If the data-fetch logic is refactored, preserve this initialization or
  empty-state will flash on every mount.
- **SOTA is scaffolded only.** No SOTA UI per CLAUDE.md. Do not advertise it.
- **The prior session's open question about `4f919205 updated agents`** is still
  open (see Open questions above). The agent files in `.claude/agents/` were
  modified in that commit without a `Co-Authored-By` trailer; status is
  unresolved.
