# 0004. Drive the QSO map viewport with fitBounds on a single non-repeating globe

Date: 2026-05-28
Status: Accepted

## Context

The QSO map (`client/src/pages/Map.tsx`) needs to frame the user's contacts
appropriately on load and whenever the time-filter changes. The map is built
on Leaflet/react-leaflet.

The original implementation computed an average lat/lng of all markers and set
the viewport to that center at a fixed zoom level, using a React `key` prop on
`MapContainer` to remount the map when the filter changed. This produced three
problems:

1. The viewport opened off-center — a single cluster far from the average
   skewed the center, and fixed zoom meant some contacts were well outside the
   initial view.
2. The world tiles repeated horizontally (Leaflet's default), but marker icons
   only rendered in one copy of the globe. Scrolling sideways showed blank
   duplicate globes with no pins.
3. A `key`-based remount destroyed Leaflet's internal state on every filter
   change instead of smoothly panning to the new bounds.

## Decision

Replace average-center + fixed-zoom + remount with `fitBounds` on a
constrained, single-copy globe:

- A `FitBounds` child component (rendered inside `MapContainer`) holds a
  `useEffect` that calls `map.fitBounds(bounds, { padding: FIT_PADDING,
  maxZoom: FIT_MAX_ZOOM })` whenever the marker set changes. When no valid
  markers exist it calls `map.setView(WORLD_CENTER, WORLD_ZOOM)` to return to
  the world view. Using a child component is required because `useMap()` only
  resolves inside a `MapContainer` tree.
- `TileLayer` receives `noWrap` to prevent tile repetition.
- `MapContainer` receives `maxBounds={[[-90,-180],[90,180]]}` and
  `maxBoundsViscosity={1.0}` so panning is physically constrained to a single
  globe, and `minZoom={MIN_ZOOM}` (2) so the user cannot zoom out past one
  globe-width.
- Bounds math is extracted into a pure helper `client/src/utils/map-view.ts`
  (`getMarkerBounds`, `isValidCoord`) that returns a plain
  `[[lat, lng], [lat, lng]]` tuple and has no Leaflet import — keeping it
  cheaply testable and reusable.
- `FIT_MAX_ZOOM` (10) guards against street-level over-zoom on a
  single-marker result.

## Alternatives considered

- **Keep average-center + fixed zoom.** The simplest diff. Rejected: it does
  not frame all markers — contacts near the edge of the average are cropped —
  and the viewport opens off-center whenever the distribution is uneven.
- **Server-side viewport or marker clustering.** The server could compute a
  bounding box and return it alongside the markers, or a clustering library
  could aggregate dense pins. Rejected: overkill for a LAN logger where the
  entire filtered dataset is already fetched client-side and marker counts are
  in the hundreds to low thousands. Client-side fit on the already-fetched
  array is simpler and equally fast at this scale.
- **Allow world-wrap and render markers in every tile copy.** Leaflet can
  repeat markers across wrapping tile copies. Rejected: the user explicitly
  wanted a single-globe view, and duplicate pins add visual noise without
  improving the experience.

## Consequences

- The viewport automatically frames whatever contacts are in the current
  filter window; no manual zoom required.
- The `FitBounds` child pattern is a Leaflet-specific idiom. Developers
  unfamiliar with react-leaflet may not immediately understand why a seemingly
  no-op component is nested inside the map.
- `getMarkerBounds` uses a naive min/max bounding box. It does **not** handle
  the antimeridian: a log with contacts near both +180° and −180° (e.g.,
  contacts in Alaska and New Zealand) will produce a world-spanning bounding
  box rather than a tight Pacific box. This is documented in the helper source.
  For AE9S's current log this is not a practical issue.
- `FIT_MAX_ZOOM = 10` is a magic constant chosen conservatively. A single
  contact in a large geographic area (e.g., an entire country) may still zoom
  in further than ideal.

## Revisit if

- Logs grow large enough that loading all markers for a filter window and
  running client-side fit causes perceptible lag (a rough threshold: >5 000
  markers in a single filter window taking >300ms to render on the target
  hardware). At that point consider server-side bounding-box computation or
  a clustering library.
- Contacts near the antimeridian become common enough that the world-spanning
  bounding box is a practical problem rather than a theoretical one.
