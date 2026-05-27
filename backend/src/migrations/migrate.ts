import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2';
import logger from '../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  '001-add-utc-datetime.sql',
  '002-add-frequency-decimal.sql',
  '003-add-mode-band.sql',
  '004-add-users-table.sql',
  '005-add-user-id-to-contacts.sql',
];

export async function runMigrations(): Promise<void> {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 2,
    multipleStatements: true,
  });

  const db = pool.promise();

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await db.execute('SELECT name FROM _migrations ORDER BY id');
    const applied = (rows as any[]).map(r => r.name);

    for (const migration of MIGRATIONS) {
      if (applied.includes(migration)) {
        logger.debug({ migration }, 'skip (already applied)');
        continue;
      }

      const sqlPath = join(__dirname, migration);
      const sql = readFileSync(sqlPath, 'utf-8');

      logger.info({ migration }, 'applying migration');
      await db.query(sql);
      await db.execute('INSERT INTO _migrations (name) VALUES (?)', [migration]);
      logger.info({ migration }, 'migration applied');
    }

    logger.info('all migrations applied');
  } finally {
    await db.end();
  }
}
