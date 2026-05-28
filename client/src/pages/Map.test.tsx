/**
 * Map.test.tsx — RED-phase tests for the refactored Map component.
 *
 * jest.mock() calls are hoisted by Jest's babel transform above all imports,
 * so the mocks are registered before react-leaflet is loaded even though the
 * import statements appear first in source order.
 *
 * Variables referenced inside jest.mock() factory functions MUST start with
 * "mock" so Jest's hoist-detection allows them.
 */

import React from 'react';
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import Map from './Map';
import { getMapData } from '../api/hamlog-api';
import type { MapMarker } from '../types/qso';
import {
  WORLD_CENTER,
  WORLD_ZOOM,
  MIN_ZOOM,
  FIT_MAX_ZOOM,
  FIT_PADDING,
  MAX_BOUNDS,
  getMarkerBounds,
} from '../utils/map-view';

// ---------------------------------------------------------------------------
// react-leaflet mock
// mockMap must be declared with a "mock" prefix so Jest's hoist pass allows
// the factory to reference it.
// ---------------------------------------------------------------------------
const mockMap = {
  fitBounds: jest.fn(),
  setView: jest.fn(),
};

jest.mock('react-leaflet', () => {
  // require() is used here instead of import because this factory is hoisted
  // before module-level imports are evaluated.
  const MockReact = require('react');
  return {
    MapContainer: (props: any) =>
      MockReact.createElement(
        'div',
        {
          'data-testid': 'map-container',
          'data-minzoom': String(props.minZoom),
          'data-center': JSON.stringify(props.center),
          'data-zoom': String(props.zoom),
          'data-maxbounds': JSON.stringify(props.maxBounds),
          'data-maxboundsviscosity': String(props.maxBoundsViscosity),
        },
        props.children,
      ),
    TileLayer: (props: any) =>
      MockReact.createElement('div', {
        'data-testid': 'tile-layer',
        'data-nowrap': String(props.noWrap),
      }),
    Marker: (props: any) =>
      MockReact.createElement(
        'div',
        {
          'data-testid': 'marker',
          'data-pos': JSON.stringify(props.position),
        },
        props.children,
      ),
    Popup: (props: any) =>
      MockReact.createElement('div', { 'data-testid': 'popup' }, props.children),
    useMap: () => mockMap,
  };
});

// ---------------------------------------------------------------------------
// hamlog-api mock — provide a manual factory so Jest never tries to load
// the real module (which would pull in ESM axios and explode).
// ---------------------------------------------------------------------------
jest.mock('../api/hamlog-api', () => ({
  getMapData: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Fixture factory — only require the fields that vary per test
// ---------------------------------------------------------------------------
let nextId = 1;

function makeMarker(overrides: Partial<MapMarker> & Pick<MapMarker, 'lat' | 'lng'>): MapMarker {
  const id = nextId++;
  return {
    qsoId: id,
    callsign: `W1AW${id}`,
    date: '2024-06-01',
    time: '14:00',
    frequency: '14.074',
    mode: 'FT8',
    band: '20m',
    name: `Station ${id}`,
    city: `City${id}`,
    country: 'US',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  nextId = 1;
});

// Render + flush the mounting effect's async getMapData inside act, so the
// resolved-promise state update doesn't fire between acts (React 18 warning).
async function renderMap() {
  await act(async () => { render(<Map />); });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Map component', () => {
  // -------------------------------------------------------------------------
  // Case 1: One <Marker> per valid marker
  // -------------------------------------------------------------------------
  it('renders one marker element per valid marker when given 3 valid markers', async () => {
    const markers = [
      makeMarker({ lat: 40, lng: -74 }),
      makeMarker({ lat: 51, lng: 0 }),
      makeMarker({ lat: -33, lng: 151 }),
    ];
    (getMapData as jest.Mock).mockResolvedValue(markers);

    await renderMap();

    const markerEls = await screen.findAllByTestId('marker');
    expect(markerEls).toHaveLength(3);
  });

  // -------------------------------------------------------------------------
  // Case 2: Invalid-coord markers are filtered out; count label is correct
  // -------------------------------------------------------------------------
  it('drops (0,0) and out-of-range markers and shows the valid count in the label', async () => {
    const fixture = [
      makeMarker({ lat: 40, lng: -74 }),
      makeMarker({ lat: 51, lng: 10 }),
      makeMarker({ lat: 0, lng: 0 }),     // null-island — must be excluded
      makeMarker({ lat: 200, lng: 200 }), // out of range — must be excluded
    ];
    (getMapData as jest.Mock).mockResolvedValue(fixture);

    await renderMap();

    // Only 2 marker elements — invalid ones are silently dropped
    await waitFor(() => {
      expect(screen.getAllByTestId('marker')).toHaveLength(2);
    });

    // The count label reflects valid markers only, not the raw API payload size
    expect(screen.getByText('2 QSOs on map')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Case 3: TileLayer has noWrap={true}
  // -------------------------------------------------------------------------
  it('renders TileLayer with noWrap true', async () => {
    (getMapData as jest.Mock).mockResolvedValue([]);

    await renderMap();

    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toHaveAttribute('data-nowrap', 'true');

    // Settle the fetch on a DOM observable (count label), independent of FitBounds
    await screen.findByText('0 QSOs on map');
  });

  // -------------------------------------------------------------------------
  // Case 4: MapContainer receives single-globe view constraints
  // -------------------------------------------------------------------------
  it('passes minZoom=MIN_ZOOM, maxBounds=MAX_BOUNDS, maxBoundsViscosity=1 to MapContainer', async () => {
    (getMapData as jest.Mock).mockResolvedValue([]);

    await renderMap();

    const container = screen.getByTestId('map-container');

    expect(container).toHaveAttribute('data-minzoom', String(MIN_ZOOM));

    const rawMaxBounds = container.getAttribute('data-maxbounds');
    expect(rawMaxBounds).not.toBeNull();
    expect(JSON.parse(rawMaxBounds!)).toEqual(MAX_BOUNDS);

    expect(container).toHaveAttribute('data-maxboundsviscosity', '1');

    // Settle the fetch on a DOM observable (count label), independent of FitBounds
    await screen.findByText('0 QSOs on map');
  });

  // -------------------------------------------------------------------------
  // Case 5: fitBounds is called with correct bounds + options after fetch
  // -------------------------------------------------------------------------
  it('calls map.fitBounds with marker bounds and FIT_PADDING/FIT_MAX_ZOOM options', async () => {
    const validMarkers = [
      makeMarker({ lat: 40, lng: -74 }),
      makeMarker({ lat: 51, lng: 10 }),
      makeMarker({ lat: -33, lng: 151 }),
    ];
    (getMapData as jest.Mock).mockResolvedValue(validMarkers);

    await renderMap();

    const expectedBounds = getMarkerBounds(validMarkers);

    await waitFor(() => {
      expect(mockMap.fitBounds).toHaveBeenCalledWith(expectedBounds, {
        padding: FIT_PADDING,
        maxZoom: FIT_MAX_ZOOM,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Case 6: Empty markers → world view; fitBounds is NOT called
  // -------------------------------------------------------------------------
  it('calls map.setView(WORLD_CENTER, WORLD_ZOOM) and does not call fitBounds when markers is empty', async () => {
    (getMapData as jest.Mock).mockResolvedValue([]);

    await renderMap();

    await waitFor(() => {
      expect(mockMap.setView).toHaveBeenCalledWith(WORLD_CENTER, WORLD_ZOOM);
    });

    expect(mockMap.fitBounds).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Case 7: Mixed valid/invalid — bounds passed to fitBounds exclude (0,0) etc.
  // -------------------------------------------------------------------------
  it('computes fitBounds from valid markers only — bounds are not skewed by (0,0) or out-of-range coords', async () => {
    const fixture = [
      makeMarker({ lat: 40, lng: -74 }),
      makeMarker({ lat: 51, lng: 10 }),
      makeMarker({ lat: 0, lng: 0 }),     // invalid
      makeMarker({ lat: 200, lng: 200 }), // invalid
    ];
    (getMapData as jest.Mock).mockResolvedValue(fixture);

    await renderMap();

    // getMarkerBounds already skips invalid coords, so this is the authoritative expected value
    const expectedBounds = getMarkerBounds(fixture); // [[40, -74], [51, 10]]

    await waitFor(() => {
      expect(mockMap.fitBounds).toHaveBeenCalledWith(expectedBounds, expect.any(Object));
    });

    const actualBounds = mockMap.fitBounds.mock.calls[0][0] as [[number, number], [number, number]];
    // Specifically: the SW corner must not have been pulled toward (0,0)
    expect(actualBounds[0][0]).not.toBe(0);
    expect(actualBounds[0][1]).not.toBe(0);
  });

  // -------------------------------------------------------------------------
  // Case 8: Popup shows callsign and city/country for a marker
  // -------------------------------------------------------------------------
  it("renders a marker's callsign and city/country inside its popup", async () => {
    const marker = makeMarker({
      lat: 40,
      lng: -74,
      callsign: 'KD9ZZZ',
      city: 'Chicago',
      country: 'US',
    });
    (getMapData as jest.Mock).mockResolvedValue([marker]);

    await renderMap();

    await screen.findAllByTestId('marker');

    const markerEl = screen.getAllByTestId('marker')[0];
    const popup = within(markerEl).getByTestId('popup');

    expect(within(popup).getByText('KD9ZZZ')).toBeInTheDocument();
    // city and country are joined with ", " in the popup
    expect(within(popup).getByText(/Chicago/)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Case 9: Clicking a filter preset re-fetches and updates the view
  // -------------------------------------------------------------------------
  it('re-fetches data and updates the map view when a time-preset filter button is clicked', async () => {
    const initialMarkers = [makeMarker({ lat: 40, lng: -74 })];
    const afterClickMarkers = [
      makeMarker({ lat: 51, lng: 0 }),
      makeMarker({ lat: -33, lng: 151 }),
    ];

    (getMapData as jest.Mock)
      .mockResolvedValueOnce(initialMarkers)
      .mockResolvedValueOnce(afterClickMarkers);

    await renderMap();

    // Wait for the initial fetch to complete
    await waitFor(() => {
      expect(getMapData).toHaveBeenCalledTimes(1);
    });

    const fitBoundsCountBefore = mockMap.fitBounds.mock.calls.length;

    // Click "Day" preset — this should trigger a new fetch with from/to params
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Day' }));
    });

    // A second getMapData call must happen
    await waitFor(() => {
      expect(getMapData).toHaveBeenCalledTimes(2);
    });

    // The view must be updated again after the second fetch
    await waitFor(() => {
      const totalViewCalls =
        mockMap.fitBounds.mock.calls.length + mockMap.setView.mock.calls.length;
      // fitBoundsCountBefore + 1 accounts for the first fetch;
      // we need at least one more call after the click
      expect(mockMap.fitBounds.mock.calls.length).toBeGreaterThan(fitBoundsCountBefore);
    });
  });
});
