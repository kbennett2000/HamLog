import React, { useState } from 'react';
import { downloadJsonBackup, downloadAdifBackup, backfillCallsignData } from '../api/hamlog-api';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeName } from '../contexts/ThemeContext';
import { Download, FileJson, FileText, Terminal, Palette, Check, MapPin } from 'lucide-react';
import config from '../config';

const { ButtonClassNameGreen, ButtonClassNameBlue } = config;

type DownloadState = 'idle' | 'json' | 'adif';

const themes: { id: ThemeName; label: string; description: string; colors: string[] }[] = [
  {
    id: 'theme-indigo',
    label: 'Indigo + Emerald',
    description: 'Professional dashboard',
    colors: ['#4f46e5', '#059669', '#f43f5e', '#f8fafc'],
  },
  {
    id: 'theme-teal',
    label: 'Teal + Amber',
    description: 'Warm radio aesthetic',
    colors: ['#0d9488', '#d97706', '#dc2626', '#fafaf9'],
  },
  {
    id: 'theme-dark',
    label: 'Dark Mode',
    description: 'Easy on the eyes',
    colors: ['#0ea5e9', '#22c55e', '#ef4444', '#18181b'],
  },
];

const Settings: React.FC = () => {
  const [downloading, setDownloading] = useState<DownloadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [backfillStatus, setBackfillStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [backfillResult, setBackfillResult] = useState<{ total: number; updated: number; failed: number } | null>(null);
  const { theme, setTheme } = useTheme();

  const handleDownload = async (format: 'json' | 'adif') => {
    setDownloading(format);
    setError(null);
    try {
      if (format === 'json') {
        await downloadJsonBackup();
      } else {
        await downloadAdifBackup();
      }
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setDownloading('idle');
    }
  };

  const handleBackfill = async () => {
    setBackfillStatus('running');
    setBackfillResult(null);
    try {
      const result = await backfillCallsignData();
      setBackfillResult(result);
    } catch {
      setBackfillResult({ total: 0, updated: 0, failed: 1 });
    } finally {
      setBackfillStatus('done');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h2>

      {/* Theme Selector */}
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Appearance</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                theme === t.id
                  ? 'border-primary-500 bg-primary-500/10 shadow-sm'
                  : 'border-[var(--color-card-border)] hover:border-[var(--color-surface-300)]'
              }`}
            >
              {theme === t.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="flex gap-1 mb-2">
                {t.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">{t.label}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Callsign Data */}
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Callsign Data</h3>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Look up location data for all callsigns using HamDB. This populates the QSO map with markers.
        </p>
        <button
          onClick={handleBackfill}
          disabled={backfillStatus === 'running'}
          className={`${ButtonClassNameBlue} ${backfillStatus === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <MapPin className="w-4 h-4" />
          {backfillStatus === 'running' ? 'Looking up callsigns...' : 'Backfill Locations'}
        </button>
        {backfillResult && (
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Processed {backfillResult.total} callsign{backfillResult.total !== 1 ? 's' : ''}: {backfillResult.updated} updated, {backfillResult.failed} failed.
          </p>
        )}
      </div>

      {/* Backup / Export */}
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Backup / Export</h3>
        </div>

        {error && (
          <div className="bg-danger-500/10 border border-danger-200 text-danger-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <button
              onClick={() => handleDownload('json')}
              disabled={downloading !== 'idle'}
              className={`${ButtonClassNameGreen} ${downloading !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileJson className="w-4 h-4" />
              {downloading === 'json' ? 'Downloading...' : 'Download JSON Backup'}
            </button>
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
              Full backup of all QSO data including POTA and contest records. Best for archival and restoring.
            </p>
          </div>

          <div>
            <button
              onClick={() => handleDownload('adif')}
              disabled={downloading !== 'idle'}
              className={`${ButtonClassNameBlue} ${downloading !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileText className="w-4 h-4" />
              {downloading === 'adif' ? 'Downloading...' : 'Download ADIF Export'}
            </button>
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
              Standard ADIF format compatible with other logging software.
            </p>
          </div>
        </div>
      </div>

      {/* API Access */}
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">API Access</h3>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          You can automate backups using the API. First obtain a token, then download:
        </p>
        <pre className="bg-[var(--color-surface-900)] text-[var(--color-surface-400)] p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`# Get a token
curl -s -X POST ${window.location.origin}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"YOUR_USER","password":"YOUR_PASS"}' \\
  | jq -r .token

# Download JSON backup
curl -H "Authorization: Bearer TOKEN" \\
  ${window.location.origin}/api/backup/json -o hamlog-backup.json

# Download ADIF export
curl -H "Authorization: Bearer TOKEN" \\
  ${window.location.origin}/api/backup/adif -o hamlog-backup.adi`}
        </pre>
        <p className="text-sm text-[var(--color-text-muted)] mt-3">
          Or use the included script: <code className="bg-[var(--color-surface-100)] px-1.5 py-0.5 rounded text-xs font-mono">scripts/backup-api.ps1</code>
        </p>
      </div>
    </div>
  );
};

export default Settings;
