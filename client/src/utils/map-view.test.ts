import type { MapMarker } from '../types/qso';
import {
  WORLD_CENTER,
  WORLD_ZOOM,
  MIN_ZOOM,
  FIT_MAX_ZOOM,
  FIT_PADDING,
  MAX_BOUNDS,
  isValidCoord,
  getMarkerBounds,
  formatMapCount,
} from './map-view';

// ---------------------------------------------------------------------------
// Fixture factory — keeps individual tests minimal by only requiring lat/lng.
// ---------------------------------------------------------------------------
let nextId = 1;
function makeMarker(lat: number, lng: number): MapMarker {
  const id = nextId++;
  return {
    qsoId: id,
    callsign: `TEST${id}`,
    date: '2024-01-01',
    time: '12:00',
    frequency: '14.074',
    mode: 'FT8',
    band: '20m',
    lat,
    lng,
    name: 'Test Station',
    city: 'Testville',
    country: 'US',
  };
}

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------
describe('constants', () => {
  it('WORLD_CENTER is [20, 0]', () => {
    expect(WORLD_CENTER).toEqual([20, 0]);
  });

  it('WORLD_ZOOM is 2', () => {
    expect(WORLD_ZOOM).toBe(2);
  });

  it('MIN_ZOOM is 2', () => {
    expect(MIN_ZOOM).toBe(2);
  });

  it('FIT_MAX_ZOOM is 10', () => {
    expect(FIT_MAX_ZOOM).toBe(10);
  });

  it('FIT_PADDING is [40, 40]', () => {
    expect(FIT_PADDING).toEqual([40, 40]);
  });

  it('MAX_BOUNDS is [[-90, -180], [90, 180]]', () => {
    expect(MAX_BOUNDS).toEqual([[-90, -180], [90, 180]]);
  });

  it('WORLD_ZOOM is greater than or equal to MIN_ZOOM', () => {
    expect(WORLD_ZOOM).toBeGreaterThanOrEqual(MIN_ZOOM);
  });
});

// ---------------------------------------------------------------------------
// isValidCoord
// ---------------------------------------------------------------------------
describe('isValidCoord', () => {
  it('returns true for a valid mid-range coord (40, -74)', () => {
    expect(isValidCoord(40, -74)).toBe(true);
  });

  it('returns true for boundary values (90, 180)', () => {
    expect(isValidCoord(90, 180)).toBe(true);
  });

  it('returns true for boundary values (-90, -180)', () => {
    expect(isValidCoord(-90, -180)).toBe(true);
  });

  it('returns false when lat exceeds 90 (91, 0)', () => {
    expect(isValidCoord(91, 0)).toBe(false);
  });

  it('returns false when lat is below -90 (-91, 0)', () => {
    expect(isValidCoord(-91, 0)).toBe(false);
  });

  it('returns false when lng exceeds 180 (10, 181)', () => {
    // Use nonzero lat so the null-island guard is not what trips this
    expect(isValidCoord(10, 181)).toBe(false);
  });

  it('returns false when lng is below -180 (10, -181)', () => {
    expect(isValidCoord(10, -181)).toBe(false);
  });

  it('returns false when lat is NaN', () => {
    expect(isValidCoord(NaN, -74)).toBe(false);
  });

  it('returns false when lng is NaN', () => {
    expect(isValidCoord(40, NaN)).toBe(false);
  });

  it('returns false when lat is +Infinity', () => {
    expect(isValidCoord(Infinity, -74)).toBe(false);
  });

  it('returns false when lat is -Infinity', () => {
    expect(isValidCoord(-Infinity, -74)).toBe(false);
  });

  it('returns false when lng is +Infinity', () => {
    expect(isValidCoord(40, Infinity)).toBe(false);
  });

  it('returns false when lng is -Infinity', () => {
    expect(isValidCoord(40, -Infinity)).toBe(false);
  });

  it('returns false for exactly (0, 0) — null-island guard', () => {
    expect(isValidCoord(0, 0)).toBe(false);
  });

  it('returns true for a nonzero lat with lng === 0, e.g. (51, 0) — guard only fires when BOTH are 0', () => {
    expect(isValidCoord(51, 0)).toBe(true);
  });

  it('returns true for lat === 0 with a nonzero lng, e.g. (0, 90) — guard is conjunctive', () => {
    expect(isValidCoord(0, 90)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getMarkerBounds
// ---------------------------------------------------------------------------
describe('getMarkerBounds', () => {
  it('returns null for an empty array', () => {
    expect(getMarkerBounds([])).toBeNull();
  });

  it('returns null when all markers are invalid (0,0 and out-of-range)', () => {
    const markers = [makeMarker(0, 0), makeMarker(200, 200)];
    expect(getMarkerBounds(markers)).toBeNull();
  });

  it('returns degenerate bounds (SW === NE) for a single valid marker', () => {
    const markers = [makeMarker(40, -74)];
    expect(getMarkerBounds(markers)).toEqual([[40, -74], [40, -74]]);
  });

  it('returns degenerate bounds when all valid markers share the same coords', () => {
    const markers = [makeMarker(40, -74), makeMarker(40, -74), makeMarker(40, -74)];
    expect(getMarkerBounds(markers)).toEqual([[40, -74], [40, -74]]);
  });

  it('returns [[minLat, minLng], [maxLat, maxLng]] across multiple distinct valid markers spanning hemispheres', () => {
    // (40, -74) New York, (-33, 151) Sydney, (51, 0) London
    // minLat = -33, minLng = -74, maxLat = 51, maxLng = 151
    const markers = [makeMarker(40, -74), makeMarker(-33, 151), makeMarker(51, 0)];
    expect(getMarkerBounds(markers)).toEqual([[-33, -74], [51, 151]]);
  });

  it('computes bounds from the valid subset only — (0,0) and out-of-range markers do not affect the result', () => {
    // Valid: (40, -74), (51, 0)  →  bounds [[-33, -74], [51, 151]] once we include (-33,151)
    // Plus invalid: (0, 0) and (200, 200) must be ignored
    // Using a simpler case: valid markers (40, -74) and (51, 10), invalid (0,0) and (200,200)
    // Expected: [[40, -74], [51, 10]]  — NOT pulled toward 0,0
    const markers = [
      makeMarker(40, -74),
      makeMarker(51, 10),
      makeMarker(0, 0),    // null-island — must be ignored
      makeMarker(200, 200), // out of range — must be ignored
    ];
    const result = getMarkerBounds(markers);
    expect(result).toEqual([[40, -74], [51, 10]]);
    // Specifically assert the (0,0) row did NOT pull minLat or minLng toward 0
    expect(result![0][0]).not.toBe(0);
    expect(result![0][1]).not.toBe(0);
  });

  it('widens the bounds when an additional far-flung valid marker is added', () => {
    const baseMarkers = [makeMarker(40, -74), makeMarker(51, 10)];
    const baseBounds = getMarkerBounds(baseMarkers);

    // Add a far-south, far-east marker: (-55, 160)
    const extendedMarkers = [...baseMarkers, makeMarker(-55, 160)];
    const extendedBounds = getMarkerBounds(extendedMarkers);

    // The new marker should expand the SW corner south and east
    expect(extendedBounds).toEqual([[-55, -74], [51, 160]]);
    // Confirm it is actually wider than the base bounds
    expect(extendedBounds![0][0]).toBeLessThan(baseBounds![0][0]);   // minLat lower
    expect(extendedBounds![1][1]).toBeGreaterThan(baseBounds![1][1]); // maxLng higher
  });
});

// ---------------------------------------------------------------------------
// formatMapCount
// ---------------------------------------------------------------------------
describe('formatMapCount', () => {
  it('returns "0 QSOs on map" when valid === 0 and total === 0', () => {
    expect(formatMapCount(0, 0)).toBe('0 QSOs on map');
  });

  it('returns "1 QSO on map" (singular) when valid === 1 and total === 1', () => {
    expect(formatMapCount(1, 1)).toBe('1 QSO on map');
  });

  it('returns "2 QSOs on map" (plural) when valid === 2 and total === 2', () => {
    expect(formatMapCount(2, 2)).toBe('2 QSOs on map');
  });

  it('returns "5 QSOs on map" when valid === total === 5', () => {
    expect(formatMapCount(5, 5)).toBe('5 QSOs on map');
  });

  it('returns "3 of 5 QSOs mapped" when valid < total (3, 5)', () => {
    expect(formatMapCount(3, 5)).toBe('3 of 5 QSOs mapped');
  });

  it('returns "0 of 5 QSOs mapped" when valid === 0 and total > 0', () => {
    expect(formatMapCount(0, 5)).toBe('0 of 5 QSOs mapped');
  });
});
