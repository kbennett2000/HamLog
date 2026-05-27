import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql, { Pool } from 'mysql2';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 2,
  multipleStatements: true,
});

const db = pool.promise();

const MIGRATIONS = [
  '001-add-utc-datetime.sql',
  '002-add-frequency-decimal.sql',
  '003-add-mode-band.sql',
  '004-add-users-table.sql',
  '005-add-user-id-to-contacts.sql',
];

async function ensureMigrationsTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const [rows] = await db.execute('SELECT name FROM _migrations ORDER BY id');
  return (rows as any[]).map(r => r.name);
}

async function run(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  for (const migration of MIGRATIONS) {
    if (applied.includes(migration)) {
      console.log(`  skip: ${migration} (already applied)`);
      continue;
    }

    const sqlPath = join(__dirname, migration);
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log(`  apply: ${migration}`);
    await db.query(sql);
    await db.execute('INSERT INTO _migrations (name) VALUES (?)', [migration]);
    console.log(`  done: ${migration}`);
  }

  console.log('All migrations applied.');
  await db.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
