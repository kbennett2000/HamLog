# HamLog Troubleshooting

Common problems and how to fix them.

---

## Contents

1. ["JWT_SECRET is required" error at startup](#1-jwt_secret-is-required-error-at-startup)
2. ["Port 8050 is already in use"](#2-port-8050-is-already-in-use)
3. [Can't reach HamLog from another device on the LAN](#3-cant-reach-hamlog-from-another-device-on-the-lan)
4. ["Cannot connect to database" or app won't start](#4-cannot-connect-to-database-or-app-wont-start)
5. [Map shows no markers](#5-map-shows-no-markers)
6. [Map tiles don't load — grey background](#6-map-tiles-dont-load--grey-background)
7. ["docker: command not found"](#7-docker-command-not-found)
8. ["Permission denied" when running Docker commands](#8-permission-denied-when-running-docker-commands)
9. [What happens to data after an update](#9-what-happens-to-data-after-an-update)
10. [Forgot password](#10-forgot-password)

---

## 1. "JWT_SECRET is required" error at startup

**Symptom:** Running `docker compose up` fails, and the logs contain a message
like:

```
JWT_SECRET is required — generate with node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Cause:** The `.env` file is missing, or `JWT_SECRET` is present but blank.
Docker Compose refuses to start the app container when a required variable has
no value.

**Fix:**

Step 1 — Check whether `.env` exists:

```bash
ls -la ~/HamLog/.env
```

If the file is missing, copy the template:

```bash
cp ~/HamLog/.env.example ~/HamLog/.env
```

Step 2 — Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or with OpenSSL:

```bash
openssl rand -hex 32
```

Step 3 — Open `.env` and paste the generated value next to `JWT_SECRET`:

```
JWT_SECRET=paste-your-generated-value-here
```

Step 4 — Start HamLog:

```bash
docker compose up -d
```

---

## 2. "Port 8050 is already in use"

**Symptom:** `docker compose up` fails with an error mentioning port 8050 or
`address already in use`.

**Cause:** Another process on the machine is already listening on port 8050.

**Fix — option A:** Change HamLog to use a different port.

Open `.env` and change the PORT line:

```
PORT=8051
```

Then restart:

```bash
docker compose down
docker compose up -d
```

Access HamLog at the new port: `http://YOUR-IP:8051`

**Fix — option B:** Find and stop whatever is using port 8050.

On Linux:

```bash
sudo ss -tlnp | grep 8050
```

The output identifies the process. Stop that service, then start HamLog again.

---

## 3. Can't reach HamLog from another device on the LAN

**Symptom:** HamLog works at `http://localhost:8050` on the server, but other
devices on the network can't connect.

**Check 1 — Use the server's IP address, not `localhost`.**

`localhost` only resolves to the machine you are typing on. Other devices
need the server's actual IP address. Find it on the server:

```bash
ip addr show
```

Look for a line like `inet 192.168.1.50/24`. The address before the `/` is
your server's IP. On the other device, navigate to:

```
http://192.168.1.50:8050
```

**Check 2 — Firewall may be blocking port 8050.**

If Ubuntu's UFW firewall is active, you need to allow the port:

```bash
sudo ufw allow 8050/tcp
sudo ufw status
```

Verify the rule appears in the output under `8050/tcp ALLOW`. Then retry from
the other device.

To check whether UFW is active at all:

```bash
sudo ufw status
```

If it says `Status: inactive`, the firewall is not the problem.

---

## 4. "Cannot connect to database" or app won't start

**Symptom:** HamLog shows a connection error, or the app container exits
immediately after starting.

**Check 1 — Are the containers running?**

```bash
docker compose ps
```

Both `hamlog-db-1` and `hamlog-app-1` should show `Up` in the STATUS column.
The `db` container should also show `(healthy)`.

If `db` shows `(starting)`, MySQL is still initializing. On the first start
this can take 30 seconds. Wait and check again:

```bash
docker compose ps
```

If `db` shows `Exited`, MySQL failed to start. Check its logs:

```bash
docker compose logs db
```

**Check 2 — Check the app logs.**

```bash
docker compose logs app
```

Look for lines mentioning the database host, credentials, or connection
refused. Common causes:

- `DB_PASSWORD` in `.env` doesn't match what MySQL was initialized with. If
  you changed `DB_PASSWORD` after the database was already created, the
  volume still has the old password. The fix is to remove the volume and let
  MySQL reinitialize (this deletes all data — back up first).
- The `db` container is not yet healthy. The `app` container depends on it,
  but if the first-run initialization takes longer than expected, Docker may
  have started `app` before `db` was truly ready. Run `docker compose restart
  app` to try again.

**Check 3 — Restart after a fresh install.**

After the very first `docker compose up -d`, MySQL runs initialization scripts
that can take up to 30 seconds. If HamLog shows a database error immediately,
wait 30 seconds and reload the page. It should recover on its own.

---

## 5. Map shows no markers

**Symptom:** You navigate to the Map page, it loads, but no markers appear
even though you have QSOs in your log.

**Cause:** The map only shows QSOs where HamLog has latitude and longitude data
for the callsign. HamDB lookups happen in the background when you log a new
QSO, but older QSOs may not have been looked up yet, and some lookups may have
failed silently.

**Fix:**

1. Go to **Settings** in the navigation bar.
2. Click **Backfill Locations**.
3. Wait for the process to complete. It queries HamDB for each callsign missing
   location data, processing one every 500 ms. A large log may take a few
   minutes.
4. Return to the Map page.

This requires an internet connection. If most lookups fail, check that HamLog
can reach the internet (see the note in Settings about HamDB requiring internet
access).

---

## 6. Map tiles don't load — grey background

**Symptom:** The Map page loads and markers appear, but the map background is
grey instead of showing the street map.

**Cause:** Map tiles are loaded from OpenStreetMap's tile servers over the
internet. If HamLog can't reach the internet, tiles cannot load. This is
expected behavior.

**What to expect:**

- The grey background is normal when offline.
- Markers still appear at the correct geographic positions.
- The banner "Map tiles unavailable offline. Markers are still shown with
  correct positions." appears to confirm this.

**Fix:** When internet connectivity is restored, reload the Map page and tiles
will load normally.

If you have internet access and tiles still aren't loading, check whether
OpenStreetMap's tile servers are reachable from the server:

```bash
curl -I https://tile.openstreetmap.org/1/0/0.png
```

A `200 OK` response means tiles are reachable.

---

## 7. "docker: command not found"

**Symptom:** Running any `docker` command returns `command not found` or
`docker: command not found`.

**Cause:** Docker is not installed.

**Fix:**

Follow the [install guide](install-ubuntu.md) to install Docker. On Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
```

After installing, verify:

```bash
docker --version
```

---

## 8. "Permission denied" when running Docker commands

**Symptom:** Running `docker compose up` or any Docker command returns:

```
permission denied while trying to connect to the Docker daemon socket
```

**Cause:** Your user is not in the `docker` group. By default, Docker commands
require `sudo` or root access.

**Fix:**

Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

Then apply the group change without logging out:

```bash
newgrp docker
```

Verify it worked:

```bash
docker run --rm hello-world
```

If you log out and back in, the group membership will also take effect in that
new session.

---

## 9. What happens to data after an update

**Your data is preserved through updates.**

QSO data is stored in a Docker volume (`hamlog_data`), not inside the
container. Rebuilding or replacing containers does not touch the volume.

The standard update procedure:

```bash
git pull
docker compose build
docker compose up -d
```

The containers are recreated with new code. The database volume is untouched.

**To fully reset HamLog and delete all data** (not recommended, cannot be
undone):

```bash
docker compose down -v
```

The `-v` flag removes the volume along with the containers. All QSOs, POTA
records, contest records, and user accounts are permanently deleted. Only do
this if you intend to start completely fresh.

**Before any reset or risky operation, back up first:**

From the HamLog web interface: Settings > Download JSON Backup.

From the command line (Linux):

```bash
TOKEN=$(curl -s -X POST http://localhost:8050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","password":"mypass"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8050/api/backup/json \
  -o "hamlog-backup-$(date +%Y%m%d).json"
```

From the command line (Windows PowerShell):

```powershell
.\scripts\backup-api.ps1 -Username myuser -Password mypass
```

---

## 10. Forgot password

**HamLog has no password reset flow.**

Your options are:

**Option A — Create a new account.**

Anyone on the LAN can register a new account at any time. If you have lost
access to your account and cannot recover the password, create a new one with
a different username. Your old QSOs remain under the old account and cannot be
transferred automatically.

**Option B — Update the password directly in the database.**

This requires access to the MySQL container and your `DB_PASSWORD` from `.env`.

Generate a bcrypt hash of your new password. One way, using Node.js on the
server:

```bash
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('your-new-password', 10).then(h => console.log(h));
"
```

Then connect to MySQL and update the user record (replace `YOUR_USERNAME` and
paste the hash):

```bash
docker exec -it hamlog-db-1 mysql -u hamlog -p HamLogDB
```

Enter your `DB_PASSWORD` when prompted. Then run:

```sql
UPDATE Users SET password_hash = '$2b$10$...' WHERE username = 'YOUR_USERNAME';
```

Exit with `\q`.

> If Node.js is not installed on the server machine, install it temporarily or
> use an online bcrypt generator — but treat the result as sensitive and never
> paste your actual password into an untrusted website.
