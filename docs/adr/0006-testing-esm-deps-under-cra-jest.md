# 0006. Mock ESM-only dependencies in frontend tests; use native-ESM style in backend tests

Date: 2026-05-28
Status: Accepted

## Context

Two dependencies added for the map feature ship only as ESM:

- **react-leaflet v4** — ESM-only package; also requires a real DOM canvas
  that jsdom cannot provide.
- **react-router-dom v7** — ships a conditional `exports` map; CRA 5's bundled
  Jest 27 does not honor `exports` and resolves the package to an ESM entry
  that `transformIgnorePatterns` (which excludes `node_modules`) cannot parse.

When either package is imported without accommodation, Jest throws:

    SyntaxError: Cannot use import statement outside a module

CRA 5 ships Jest 27 with a fixed `transformIgnorePatterns` that ignores
`node_modules`. There is no supported way to override this without ejecting
or wrapping CRA with a tool like craco.

The backend is plain Node.js with `"type": "module"` in its `package.json`
and is not constrained by CRA's configuration. It has its own Jest setup.

## Decision

**Frontend (CRA / Jest 27):** mock ESM-only packages rather than loading them.

- `react-leaflet` — mocked entirely in `Map.test.tsx` via `jest.mock(...)`,
  which Jest's babel transform hoists above imports. The mock provides stub
  implementations of `MapContainer`, `TileLayer`, `Marker`, `Popup`, and
  `useMap` using `require('react')` (required because the factory is hoisted
  before module-level imports are evaluated; `import` would be a temporal
  dead zone reference).
- `react-router-dom` — mocked per-file with `jest.mock('react-router-dom', ...)`
  and additionally registered in `client/package.json` under the Jest
  `moduleNameMapper` key:

      "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js"

  The mapper is necessary so that CRA's Jest can resolve the module at all
  before the mock intercepts it. Without the mapper, module resolution fails
  before `jest.mock` can register. The path `dist/index.js` is the CJS build
  that Jest 27 can parse.

**Backend (native ESM Jest):** use `jest.unstable_mockModule` + top-level
`await import(...)` + `@jest/globals`.

The pattern (established in `backend/__tests__/qso-service.test.ts`) is:

1. Import `jest`, `describe`, `it`, `expect`, `beforeEach` from
   `'@jest/globals'` — Jest globals are not injected automatically under
   native ESM.
2. Call `jest.unstable_mockModule('../src/db/pool.js', factory)` before any
   dynamic imports. `jest.mock` is not hoisted under native ESM.
3. Dynamically import the module under test and any mocked modules with
   `await import(...)` after the `unstable_mockModule` calls. This ensures the
   module loader sees the mock registrations before resolving imports.

## Alternatives considered

- **Eject CRA or adopt craco to customize `transformIgnorePatterns`.**
  Customizing `transformIgnorePatterns` (or adding ESM packages to the
  transform allowlist) would let Jest parse the actual ESM sources, making
  the mocks unnecessary. Rejected: ejecting CRA is irreversible and produces
  ~300 lines of config to maintain; craco is an unofficial wrapper with its
  own maintenance surface. The blast radius is large relative to the benefit
  for a v1 LAN app where test hermetics are more valuable than testing the
  real Leaflet rendering path in jsdom anyway.
- **Wrap components in real providers (MemoryRouter, real MapContainer).**
  The standard integration-test approach: render inside a `MemoryRouter` and
  a real `MapContainer`. Rejected on two grounds: (a) importing `MemoryRouter`
  from react-router-dom v7 hits the same ESM parse failure as the mock-free
  case; (b) a real Leaflet `MapContainer` requires canvas APIs that jsdom does
  not implement, so the map never actually renders, making the test worthless
  and brittle.
- **Migrate off CRA to Vite + Vitest (or Jest with full ESM support).**
  Vitest is ESM-native and has no `transformIgnorePatterns` problem; the
  mapper and hoisting workarounds would be unnecessary. Rejected for the
  current phase: the migration is out of scope for v1, and the mocking
  approach solves the immediate problem without a large refactor.

## Consequences

- Frontend tests run fast and are hermetic — they test component logic and
  Leaflet API call shapes, not Leaflet rendering internals.
- The `moduleNameMapper` path
  `<rootDir>/node_modules/react-router-dom/dist/index.js` is pinned to the
  CJS build location of react-router-dom v7. If a future version of
  react-router-dom moves or renames that file, the mapper will break and
  tests will fail at module resolution (not at runtime), so the breakage is
  loud. **Re-verify this path after every react-router-dom major bump.**
- The mapper is a global Jest configuration entry. It affects every test file
  in the client, not just `Map.test.tsx`. Currently `App.test.tsx` has a
  pre-existing failure unrelated to the mapper; the mapper changed the error
  message but did not introduce or fix that failure.
- The project now has two distinct module-mocking styles that contributors
  must follow: `jest.mock` (hoisted) for the CRA frontend, and
  `jest.unstable_mockModule` + dynamic `await import` for the native-ESM
  backend. These must not be mixed — using `jest.mock` in a backend `.test.ts`
  file under native ESM will not hoist and will produce subtle ordering bugs.

## Revisit if

- The project migrates the frontend off CRA (e.g., to Vite). Under Vite +
  Vitest, `moduleNameMapper` is not a concept, `transformIgnorePatterns` does
  not exist, and both the mapper and the `require('react')` factory trick
  become unnecessary — remove them at migration time.
- A react-router-dom upgrade moves the CJS build away from `dist/index.js`,
  breaking the mapper — update the path and note the new location here.
