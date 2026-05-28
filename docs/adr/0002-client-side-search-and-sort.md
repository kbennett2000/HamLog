# 0002. Search and sort QSOs in the browser, not on the server

Date: 2026-05-27
Status: Accepted

## Context

The Contacts page needs free-text search (callsign, frequency, notes, POTA
park), filtering (band, mode, date range), and column sorting. The page already
loads the full QSO list for the logged-in user up front and refreshes it on an
interval.

Personal amateur-radio logs are modest — hundreds to low thousands of QSOs for a
typical operator. The whole list comfortably fits in memory and over the wire.

## Decision

Filter and sort the already-loaded list entirely in the browser. No API or
query-parameter changes:

- `filterQsos()` (`utils/filter-qsos.ts`) and `sortQsos()`
  (`utils/sort-qsos.ts`) are pure functions over the in-memory `Contact[]`.
- `Contacts.tsx` runs `load all → filter → sort → render` through a single
  `useMemo` keyed on `[conditions, filters, sort]`, so re-filtering on each
  keystroke is local and instant.
- The backend `GET /api/qsos` continues to return the user's full log; it gains
  no search/sort parameters.

## Alternatives considered

- **Server-side filtering/sorting via query params.** Scales to arbitrarily
  large logs and keeps the client lean. Rejected for now: it adds backend
  surface (param parsing, parameterized WHERE/ORDER BY construction, tests) and
  a DB round-trip per keystroke, none of which is justified at hundreds-to-low-
  thousands of rows.
- **Hybrid (server filters, client sorts, or vice versa).** Splits the logic
  across two layers and two mental models for no benefit at this scale. More
  moving parts than the problem warrants.

## Consequences

- Search and sort are instantaneous and work fully offline once the list is
  loaded.
- The backend stays simple — one read endpoint, no query DSL to maintain.
- The entire log is held in browser memory, and filter/sort cost grows with log
  size. This is fine at current scale but will not scale to very large logs.
- Filtering operates on the periodically-refreshed snapshot, which is the
  intended behavior here.

## Revisit if

- A user's log grows large enough to cause noticeable initial-load delay or
  visible UI jank while filtering — rough trigger around 10k+ QSOs. At that
  point, move filtering/sorting (and pagination) server-side per ADR 0002's
  rejected alternative.
