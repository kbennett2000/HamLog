import type { MapMarker } from '../types/qso';

export const WORLD_CENTER: [number, number] = [20, 0];
export const WORLD_ZOOM = 2;
export const MIN_ZOOM = 2;
export const FIT_MAX_ZOOM = 10;
export const FIT_PADDING: [number, number] = [40, 40];
export const MAX_BOUNDS: [[number, number], [number, number]] = [[-90, -180], [90, 180]];

// Filter-bar count label. When every QSO in the window is plotted it reads
// "N QSOs on map"; when some lack usable coordinates it reads "X of Y QSOs mapped"
// so the missing contacts aren't hidden.
export function formatMapCount(valid: number, total: number): string {
  if (valid >= total) return `${valid} QSO${valid !== 1 ? 's' : ''} on map`;
  return `${valid} of ${total} QSO${total !== 1 ? 's' : ''} mapped`;
}

export function isValidCoord(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false; // null-island guard
  return true;
}

// Simple min/max bounding box over valid markers. Does not handle the
// antimeridian: markers near both +180 and -180 yield a world-spanning box
// rather than a tight Pacific box.
export function getMarkerBounds(
  markers: MapMarker[],
): [[number, number], [number, number]] | null {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  let count = 0;

  for (const m of markers) {
    if (!isValidCoord(m.lat, m.lng)) continue;
    count++;
    if (m.lat < minLat) minLat = m.lat;
    if (m.lat > maxLat) maxLat = m.lat;
    if (m.lng < minLng) minLng = m.lng;
    if (m.lng > maxLng) maxLng = m.lng;
  }

  if (count === 0) return null;
  return [[minLat, minLng], [maxLat, maxLng]];
}
