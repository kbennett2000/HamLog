# 0005. GET /api/qsos/map returns { markers, total } to enable precise empty-state UI

Date: 2026-05-28
Status: Accepted

## Context

`GET /api/qsos/map` returns only geocoded QSOs — its query inner-joins
`ContactInfo` and filters rows where `ContactInfo_Latitude` and
`ContactInfo_Longitude` are non-empty. A response containing only those rows
left the frontend blind to two things:

1. Whether zero markers meant "no QSOs exist in this time range" or "QSOs
   exist but none have been geocoded yet." These are meaningfully different
   states: the first is a genuine empty range; the second is a data-quality
   gap the user can fix by running Backfill Locations in Settings.
2. How many contacts are missing from the map (relevant when only some are
   geocoded).

The user explicitly wanted the map to distinguish these cases and to show a
count label of the form "X of Y QSOs mapped" when the map is incomplete.

## Decision

`GET /api/qsos/map` returns `{ markers, total }` where:

- `markers` — the geocoded QSOs for the time window, as before.
- `total` — count of all the user's QSOs in the same time window regardless
  of geocoding, from a new `getQsoCountForRange` service function.

The route issues both queries concurrently via `Promise.all`. The frontend
uses `total` to render three distinct states:

- `total === 0` — "No QSOs in this time range."
- `total > 0 && markers.length === 0` — "None of your N QSOs in this range
  have location data yet. Run Backfill Locations in Settings." (with a link)
- `markers.length >= total` — "N QSOs on map" (all plotted).
- `markers.length < total` — "X of Y QSOs mapped" (some missing).

Count label formatting is a pure function `formatMapCount(valid, total)` in
`client/src/utils/map-view.ts` (no side effects, easily tested).

## Alternatives considered

- **Client-only count — derive everything from the returned markers array.**
  The frontend already knows `markers.length`. Rejected: the markers array
  contains only geocoded QSOs, so there is no way to infer `total` from it.
  The "no QSOs vs. QSOs but none geocoded" ambiguity cannot be resolved
  client-side.
- **A separate dedicated count endpoint (`GET /api/qsos/count`).**
  A clean separation-of-concerns approach. Rejected: it requires a second
  HTTP round-trip for a single number that is always needed alongside the
  markers. Folding `total` into the `/map` response makes the two values
  atomically consistent (same `userId`, same time window, same instant) and
  avoids the extra request.
- **Fetch the full QSO list and count locally.**
  The contacts endpoint already returns all QSOs. Rejected: transferring
  every QSO (with all fields) just to count them is wasteful and grows with
  log size. `SELECT COUNT(*)` is O(index) and trivially fast.

## Consequences

- One additional `COUNT(*)` query per map load. At LAN-logger scale (hundreds
  to low thousands of QSOs) this is negligible; both queries run concurrently.
- The `/map` response shape is now coupled to the "X of Y" UI requirement.
  Future map features that need richer server-side aggregation (per-band
  counts, per-mode breakdown) will need to extend this response shape or
  introduce additional endpoints.
- `markers.length <= total` is guaranteed as long as `ContactInfo` has a
  unique index on `ContactInfo_Callsign` (contacts are inner-joined, so
  markers is always a subset of total). If that constraint were ever removed,
  it would be possible for `markers.length > total` to produce a negative
  "missing" count in the UI.

## Revisit if

- The map needs richer server-side aggregations (e.g., per-band or per-mode
  counts) — at that point the response shape should be redesigned holistically
  rather than growing ad hoc fields.
- `getQsoCountForRange` appears in profiling as a hotspot (unlikely at
  LAN-logger scale, but worth noting as a trigger).
