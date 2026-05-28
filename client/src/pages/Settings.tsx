import React, { useState } from 'react';
import { downloadJsonBackup, downloadAdifBackup } from '../api/hamlog-api';
import config from '../config';

const { ButtonClassNameGreen, ButtonClassNameBlue } = config;

type DownloadState = 'idle' | 'json' | 'adif';

const Settings: React.FC = () => {
  const [downloading, setDownloading] = useState<DownloadState>('idle');
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Backup / Export</h3>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <button
              onClick={() => handleDownload('json')}
              disabled={downloading !== 'idle'}
              className={`${ButtonClassNameGreen} ${downloading !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {downloading === 'json' ? 'Downloading...' : 'Download JSON Backup'}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Full backup of all QSO data including POTA and contest records. Best for archival and restoring.
            </p>
          </div>

          <div>
            <button
              onClick={() => handleDownload('adif')}
              disabled={downloading !== 'idle'}
              className={`${ButtonClassNameBlue} ${downloading !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {downloading === 'adif' ? 'Downloading...' : 'Download ADIF Export'}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Standard ADIF format compatible with other logging software.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">API Access</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          You can automate backups using the API. First obtain a token, then download:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap">
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Or use the included script: <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">scripts/backup-api.ps1</code>
        </p>
      </div>
    </div>
  );
};

export default Settings;
