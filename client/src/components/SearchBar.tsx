import React from 'react';
import { Search, X } from 'lucide-react';
import type { SearchFilters } from '../types/qso';
import config from '../config';

const { InputBoxClassName, ButtonClassNameOutline } = config;

const BANDS = ['', '160m', '80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m', '2m', '70cm'];
const MODES = ['', 'SSB', 'CW', 'FT8', 'FT4', 'AM', 'FM', 'RTTY', 'PSK31', 'JS8', 'DSTAR', 'DMR', 'C4FM'];

interface SearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ filters, onFiltersChange, onClear, isOpen, onToggle }) => {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const update = (field: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const labelClass = 'block text-xs font-medium text-[var(--color-text-muted)] mb-1';
  const selectClass = `${InputBoxClassName} appearance-none`;

  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className={`${ButtonClassNameOutline} ${hasActiveFilters ? 'border-primary-400 text-primary-600' : ''}`}
      >
        <Search className="w-4 h-4" />
        Search
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-primary-500/10 text-primary-600 text-xs rounded-full font-semibold">
            active
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl p-4 shadow-card animate-slide-in-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Callsign</label>
              <input
                type="text"
                value={filters.callsign}
                onChange={e => update('callsign', e.target.value.toUpperCase())}
                className={`${InputBoxClassName} font-mono`}
                placeholder="W1ABC"
              />
            </div>
            <div>
              <label className={labelClass}>Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => update('dateFrom', e.target.value)}
                className={InputBoxClassName}
              />
            </div>
            <div>
              <label className={labelClass}>Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => update('dateTo', e.target.value)}
                className={InputBoxClassName}
              />
            </div>
            <div>
              <label className={labelClass}>Frequency</label>
              <input
                type="text"
                value={filters.frequency}
                onChange={e => update('frequency', e.target.value)}
                className={`${InputBoxClassName} font-mono`}
                placeholder="14.074"
              />
            </div>
            <div>
              <label className={labelClass}>Band</label>
              <select value={filters.band} onChange={e => update('band', e.target.value)} className={selectClass}>
                <option value="">All Bands</option>
                {BANDS.filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Mode</label>
              <select value={filters.mode} onChange={e => update('mode', e.target.value)} className={selectClass}>
                <option value="">All Modes</option>
                {MODES.filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>POTA Park</label>
              <input
                type="text"
                value={filters.potaPark}
                onChange={e => update('potaPark', e.target.value.toUpperCase())}
                className={`${InputBoxClassName} font-mono`}
                placeholder="K-1234"
              />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <input
                type="text"
                value={filters.notes}
                onChange={e => update('notes', e.target.value)}
                className={InputBoxClassName}
                placeholder="Search notes..."
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-[var(--color-card-border)]">
              <button onClick={onClear} className={ButtonClassNameOutline}>
                <X className="w-4 h-4" /> Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
