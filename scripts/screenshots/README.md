# Documentation Screenshots

This folder regenerates the screenshots in `docs/screenshots/`. It runs a
**throwaway, isolated** HamLog instance seeded with **fictional demo data**, so
no real log data is ever captured.

> [!NOTE]
> This is local developer tooling only. Playwright is **not** part of the
> HamLog app, its Docker image, or its runtime. The app stays fully
> offline-capable.

## What gets captured

14 screenshots: `login`, `register`, `log-table`, `log-mobile`, `add-qso`,
`add-qso-pota`, `expanded-row`, `callsign-hover`, `search-bar`, `sort-columns`,
`map-view`, `map-popup`, `settings-theme`, `settings-backfill`.

## Prerequisites

- Docker (the same setup used to run HamLog)
- Node.js 18+ on your machine
- Internet access **once** (Playwright's Chromium download, and OpenStreetMap
  tiles for the map screenshots)

## Steps

From the repository root:

```bash
# 1. Create the throwaway env file
cp scripts/screenshots/.env.demo.example scripts/screenshots/.env.demo

# 2. Start an isolated demo instance on port 8060 (separate DB volume)
docker compose -p hamlog-demo --env-file scripts/screenshots/.env.demo up -d --build

# 3. Wait until the demo database is healthy, then seed fictional data
docker exec -i hamlog-demo-db-1 \
  mysql -u root -pdemo_root_pw HamLogDB < scripts/screenshots/demo-seed.sql

# 4. Install the capture tooling (one time)
cd scripts/screenshots
npm install
npx playwright install chromium

# 5. Capture — writes PNGs to docs/screenshots/
node capture.mjs

# 6. Tear the demo instance down, deleting its throwaway volume
cd ../..
docker compose -p hamlog-demo --env-file scripts/screenshots/.env.demo down -v
```

The demo login is `demo` / `demo1234`.

## Safety

- The demo instance uses the Compose project name `hamlog-demo`, giving it its
  own containers (`hamlog-demo-*`) and its own database volume. Your real
  instance (`hamlog-*`) and its data are never touched.
- All seed data is fictional (see the disclaimer in `demo-seed.sql`).
