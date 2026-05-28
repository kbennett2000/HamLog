import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { WifiOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapData } from '../api/hamlog-api';
import type { MapMarker } from '../types/qso';
import config from '../config';

// Fix Leaflet default marker icons (broken by Webpack)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const { ButtonClassNameBlue, ButtonClassNameOutline } = config;

type TimePreset = '1d' | '7d' | '30d' | '6m' | '1y' | 'all' | 'custom';

const presets: { key: TimePreset; label: string }[] = [
  { key: '1d', label: 'Day' },
  { key: '7d', label: 'Week' },
  { key: '30d', label: 'Month' },
  { key: '6m', label: '6 Months' },
  { key: '1y', label: 'Year' },
  { key: 'all', label: 'All' },
  { key: 'custom', label: 'Custom' },
];

function getDateRange(preset: TimePreset): { from?: string; to?: string } {
  if (preset === 'all') return {};
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);

  switch (preset) {
    case '1d': from.setDate(from.getDate() - 1); break;
    case '7d': from.setDate(from.getDate() - 7); break;
    case '30d': from.setDate(from.getDate() - 30); break;
    case '6m': from.setMonth(from.getMonth() - 6); break;
    case '1y': from.setFullYear(from.getFullYear() - 1); break;
    default: return {};
  }

  return { from: from.toISOString().slice(0, 10), to };
}

const Map: React.FC = () => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [preset, setPreset] = useState<TimePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [tilesOffline, setTilesOffline] = useState(false);

  const handleTileError = useCallback(() => {
    setTilesOffline(true);
  }, []);

  const handleTileLoad = useCallback(() => {
    setTilesOffline(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let from: string | undefined;
        let to: string | undefined;

        if (preset === 'custom') {
          from = customFrom || undefined;
          to = customTo || undefined;
        } else {
          const range = getDateRange(preset);
          from = range.from;
          to = range.to;
        }

        const data = await getMapData(from, to);
        setMarkers(data);
      } catch {
        setMarkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preset, customFrom, customTo]);

  const center = useMemo<[number, number]>(() => {
    if (markers.length === 0) return [39.8, -98.6]; // center of US
    const avgLat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const avgLng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return [avgLat, avgLng];
  }, [markers]);

  return (
    <div className="space-y-3 -mx-4 sm:-mx-6">
      {/* Filter Bar */}
      <div className="px-4 sm:px-6">
        <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl p-3 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {presets.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={preset === p.key ? ButtonClassNameBlue : ButtonClassNameOutline}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="px-2 py-1.5 border border-[var(--color-card-border)] rounded-lg text-sm bg-[var(--color-card-bg)] text-[var(--color-text-primary)]"
                />
                <span className="text-sm text-[var(--color-text-muted)]">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="px-2 py-1.5 border border-[var(--color-card-border)] rounded-lg text-sm bg-[var(--color-card-bg)] text-[var(--color-text-primary)]"
                />
              </div>
            )}

            <span className="text-xs font-medium text-[var(--color-text-muted)] sm:ml-auto">
              {loading ? 'Loading...' : `${markers.length} QSO${markers.length !== 1 ? 's' : ''} on map`}
            </span>
          </div>
        </div>
      </div>

      {/* Offline Banner */}
      {tilesOffline && (
        <div className="px-4 sm:px-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500/10 text-sm text-primary-600">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Map tiles unavailable offline. Markers are still shown with correct positions.</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-[calc(100vh-12rem)] min-h-[400px]">
        <MapContainer
          center={center}
          zoom={markers.length > 0 ? 4 : 3}
          className="h-full w-full rounded-xl"
          key={`${center[0]}-${center[1]}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ tileerror: handleTileError, tileload: handleTileLoad }}
          />
          {markers.map(m => (
            <Marker key={m.qsoId} position={[m.lat, m.lng]}>
              <Popup>
                <div className="text-sm space-y-1">
                  <div className="font-bold font-mono text-base">{m.callsign}</div>
                  {m.name && <div>{m.name}</div>}
                  {(m.city || m.country) && (
                    <div className="text-gray-600">
                      {[m.city, m.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div className="border-t pt-1 mt-1 text-xs text-gray-500 space-y-0.5">
                    <div>{new Date(m.date).toLocaleDateString('en-US')} {m.time?.slice(0, 5)}</div>
                    <div>{m.frequency} MHz {m.mode && `/ ${m.mode}`} {m.band && `/ ${m.band}`}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;
