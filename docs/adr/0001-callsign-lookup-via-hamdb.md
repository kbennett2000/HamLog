# 0001. Enrich callsigns via HamDB, server-side and graceful-degrading

Date: 2026-05-27
Status: Accepted

## Context

The QSO Map needs latitude/longitude for each contacted station, but
`ContactInfo` records were created as empty stubs (name/lat/lng blank, country
`'unknown'`), so there was nothing to plot. We need a way to resolve a callsign
to operator details and, critically, coordinates.

HamLog is a self-hosted hobby application that runs on a home LAN and is
expected to keep working when the internet is flaky or absent. Any lookup
mechanism therefore cannot be allowed to block QSO logging — the log is the
product; the map is a nice-to-have built on top of it.

## Decision

Resolve callsigns against HamDB's free JSON API
(`https://www.hamdb.org/api/lookup/{call}/json`) from the backend, and cache the
result in the `ContactInfo` table:

- The lookup is **server-side** (`hamdb-service.ts`), not called from the
  browser, so credentials/policy live in one place and the client stays simple.
- On QSO create, the lookup is **fire-and-forget**: `createContact()` kicks off
  `lookupAndCreateContactInfo()` without awaiting it and swallows any rejection
  into a log line. The QSO insert returns immediately regardless.
- On lookup **failure or NOT_FOUND**, we still write an empty `ContactInfo`
  stub for the callsign. This records that we tried, keeps the callsign present
  for later backfill, and the QSO is never lost.
- A `POST /api/contact-info/backfill` endpoint walks every callsign with no
  coordinates and re-queries HamDB, sleeping **500ms between calls** to stay a
  polite API consumer. `POST /api/contact-info/lookup` does a single on-demand
  lookup.
- The map query (`getQsosForMap`) simply ignores rows whose lat/lng are still
  empty, so missing data degrades to "fewer pins," never an error.

## Alternatives considered

- **QRZ XML API.** Richer and generally more authoritative data than HamDB.
  Rejected because it requires a paid XML-subscription and API credentials
  stored in `.env` — real recurring cost plus setup friction for what is a
  single-operator hobby deploy. HamDB covers the one field we actually need
  (coordinates) for free.
- **Manual entry of operator/location only.** Zero external dependency and
  works fully offline. Rejected because it is poor UX (every contact becomes
  data entry) and in practice the map would stay nearly empty, defeating the
  feature.

## Consequences

- Free, no credentials to manage, and the import path never blocks logging.
- Offline-safe: a failed lookup leaves a stub and the QSO still saves; the map
  just shows less.
- We are now coupled to HamDB's uptime and to having internet at lookup time.
  Map completeness is only as good as HamDB's coverage and accuracy.
- Backfilling a large backlog is deliberately slow (500ms/call), so a big first
  import takes a while to fully populate the map.
- Cached `ContactInfo` can go stale (an operator who later updates their HamDB
  record won't be refreshed unless re-backfilled).

## Revisit if

- HamDB becomes unreliable, rate-limits us aggressively, or shuts down.
- Operators need fields HamDB doesn't provide well (then weigh QRZ and its
  paid subscription).
- The 500ms-per-call backfill becomes a practical bottleneck for the size of
  logs people are importing.
