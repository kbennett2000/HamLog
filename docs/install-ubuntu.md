# Installing HamLog on Ubuntu Server 22.04 / 24.04

By the end of this guide you'll have HamLog running on your Ubuntu machine,
accessible in a browser at `http://localhost:8050` and reachable from any
other device on your home network.

HamLog runs as two Docker containers — a MySQL 8 database and a Node.js
application that serves the web interface. Docker handles all the runtime
dependencies; you don't need to install Node.js, MySQL, or anything else
beyond Docker itself.

---

## Prerequisites

- Ubuntu Server 22.04 LTS or 24.04 LTS (desktop editions work too)
- A user account with `sudo` access
- Internet access to pull packages and Docker images
- About 10 minutes

You do not need prior Linux experience beyond knowing how to open a terminal.

---

## 1. Update your package list

Before installing anything, bring your package index up to date.

```bash
sudo apt-get update
```

Expected output: a long list of `Get:` lines as Ubuntu fetches the latest
package metadata. It ends without any errors.

---

## 2. Install Docker

Ubuntu's package repositories include Docker. Install Docker and the Compose
plugin in one command:

```bash
sudo apt-get install -y docker.io docker-compose-v2
```

Expected output: several lines of downloading and unpacking, ending with
`Processing triggers for ...` and returning to the prompt.

> [!NOTE]
> `docker-compose-v2` installs the modern `docker compose` plugin (with a
> space). Older tutorials use `docker-compose` (with a hyphen) — that is an
> older version. This guide uses the plugin form throughout.

---

## 3. Add your user to the docker group

By default, Docker commands require `sudo`. Add your user to the `docker`
group so you can run `docker compose` without it:

```bash
sudo usermod -aG docker $USER
```

Then apply the group change to your current session:

```bash
newgrp docker
```

Verify Docker is working:

```bash
docker run --rm hello-world
```

Expected output includes the line `Hello from Docker!`. If you see it, Docker
is installed and working correctly.

---

## 4. Get HamLog

**Option A — Git (recommended, makes updating easy):**

If `git` is not installed:

```bash
sudo apt-get install -y git
```

Clone the repository into your home directory:

```bash
git clone https://github.com/kbennett2000/HamLog.git ~/HamLog
cd ~/HamLog
```

**Option B — Download a ZIP:**

```bash
cd ~
curl -L https://github.com/kbennett2000/HamLog/archive/refs/heads/main.zip -o hamlog.zip
sudo apt-get install -y unzip
unzip hamlog.zip
mv HamLog-main HamLog
cd HamLog
```

Either way, confirm you are inside the HamLog directory:

```bash
pwd
```

Expected output: `/home/youruser/HamLog`

---

## 5. Configure HamLog

HamLog reads its configuration from a `.env` file. A template is included.

**Step 5a — Copy the template:**

```bash
cp .env.example .env
```

**Step 5b — Generate a JWT secret:**

The JWT secret is a random string that signs authentication tokens. It must be
set before HamLog will start. Generate one with:

```bash
openssl rand -hex 32
```

Expected output: a 64-character string of hex digits, for example:

```
a3f8c2e1d4b7a9f0e2c3d5a6b8f1e4c7d9a2b5c8e1f3a6b9c2d5e8f1a4b7c0d3
```

Copy that value — you'll paste it into `.env` in a moment.

If `openssl` is not available, use Node.js instead:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Step 5c — Edit the .env file:**

```bash
nano .env
```

The file looks like this:

```
DB_ROOT_PASSWORD=changeme
DB_NAME=HamLogDB
DB_USER=hamlog
DB_PASSWORD=changeme
PORT=8050
JWT_SECRET=
```

Change each value:

| Variable | What it does | What to set it to |
|---|---|---|
| `DB_ROOT_PASSWORD` | MySQL root account password | Any strong password |
| `DB_NAME` | Name of the database | `HamLogDB` is fine as-is |
| `DB_USER` | MySQL user for the app | `hamlog` is fine as-is |
| `DB_PASSWORD` | Password for the app's MySQL user | Any strong password |
| `PORT` | Port HamLog listens on | `8050` unless that port is already in use |
| `JWT_SECRET` | Signs login tokens | Paste the value from Step 5b |

> [!WARNING]
> Change `DB_ROOT_PASSWORD` and `DB_PASSWORD` from `changeme`. Anyone on your
> LAN who can reach port 3306 could log into the database with the defaults.

An example of a filled-in file:

```
DB_ROOT_PASSWORD=MyStr0ngRootPass!
DB_NAME=HamLogDB
DB_USER=hamlog
DB_PASSWORD=MyStr0ngAppPass!
PORT=8050
JWT_SECRET=a3f8c2e1d4b7a9f0e2c3d5a6b8f1e4c7d9a2b5c8e1f3a6b9c2d5e8f1a4b7c0d3
```

Save and exit nano: press `Ctrl+O`, then `Enter`, then `Ctrl+X`.

---

## 6. Start HamLog

Run this command from the `~/HamLog` directory:

```bash
docker compose up -d
```

The first time you run this, Docker downloads the MySQL 8 image and builds the
HamLog application image. This takes 2–5 minutes depending on your connection.

Expected output:

```
[+] Running 3/3
 ✔ Network hamlog_default  Created
 ✔ Container hamlog-db-1   Started
 ✔ Container hamlog-app-1  Started
```

> [!NOTE]
> **What just happened?**
> Docker created two containers. The `db` container runs MySQL 8 and stores
> your QSO data in a Docker volume (a managed storage area that persists even
> when containers are stopped). The `app` container runs the HamLog Node.js
> server, which serves the web interface and talks to the database. The `-d`
> flag means "detached" — both containers run in the background so you get
> your terminal back.

**Verify both containers are running:**

```bash
docker compose ps
```

Expected output:

```
NAME             IMAGE         COMMAND                  SERVICE   STATUS
hamlog-app-1     hamlog-app    "docker-entrypoint.s…"   app       Up About a minute
hamlog-db-1      mysql:8.0     "docker-entrypoint.s…"   db        Up About a minute (healthy)
```

Both containers should show `Up` in the STATUS column. The `db` container
also shows `(healthy)` once MySQL has finished initializing (give it 30
seconds if it shows `(starting)`).

If a container shows `Exited`, check the logs:

```bash
docker compose logs app
docker compose logs db
```

---

## 7. Open HamLog in your browser

On the same machine, open a browser and go to:

```
http://localhost:8050
```

You should see the HamLog login screen.

> [!TIP]
> If the page doesn't load, wait 30 seconds and try again. MySQL takes a
> moment to finish initializing on the first start.

---

## 8. Create your first account

1. Click **Register** on the login screen.
2. Enter a username, password, and your callsign (e.g. `AE9S`).
3. Click **Create Account**.
4. You are now logged in and ready to log contacts.

Each person who uses HamLog gets their own account and their own private log.
Registration is open — anyone who can reach HamLog on your network can create
an account.

---

## 9. Access HamLog from other devices on your LAN

Other computers, tablets, or phones on your home network can reach HamLog
using your server's IP address instead of `localhost`.

**Find your server's IP address:**

```bash
ip addr show
```

Look for a line like `inet 192.168.1.50/24` under your network interface
(usually `eth0` or `ens3`). The IP address is the part before the `/` —
in this example, `192.168.1.50`.

On other devices, navigate to:

```
http://192.168.1.50:8050
```

(replace `192.168.1.50` with your actual IP address)

**Firewall note (UFW):**

If Ubuntu's firewall is active, you need to allow traffic on port 8050:

```bash
sudo ufw allow 8050/tcp
sudo ufw status
```

Expected output of `ufw status`:

```
Status: active
To                         Action      From
--                         ------      ----
8050/tcp                   ALLOW       Anywhere
```

> [!TIP]
> To check whether UFW is active: `sudo ufw status`. If it says `inactive`,
> no action is needed.

---

## 10. Updating HamLog

When a new version is released, update by pulling the latest code and
rebuilding the containers. Your data is safe — it lives in a Docker volume
that is untouched by the update.

From the `~/HamLog` directory:

```bash
git pull
docker compose build
docker compose up -d
```

`git pull` fetches the latest code. `docker compose build` rebuilds the
application image. `docker compose up -d` replaces the running containers
with the new versions.

> [!WARNING]
> If the update includes database migrations, the release notes will say so.
> Always back up your data before updating (see Section 11).

---

## 11. Backing up your data

Your QSO log is stored in the `hamlog_data` Docker volume. Back it up
regularly, and always before updating.

### Option A — Via the HamLog web interface

1. Log in to HamLog.
2. Click **Settings** in the navigation bar.
3. Use the **Download JSON Backup** or **Download ADIF Backup** button.

The JSON backup includes all QSOs and is suitable for archival. The ADIF
backup is compatible with other logging software.

### Option B — Command-line JSON or ADIF backup

You need a Bearer token first (replace `myuser` and `mypass` with your
credentials):

```bash
TOKEN=$(curl -s -X POST http://localhost:8050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","password":"mypass"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
```

Download a JSON backup:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8050/api/backup/json \
  -o "hamlog-backup-$(date +%Y%m%d).json"
```

Download an ADIF backup:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8050/api/backup/adif \
  -o "hamlog-backup-$(date +%Y%m%d).adi"
```

### Option C — Full database dump with mysqldump

This creates a complete SQL dump of the database, including all users:

```bash
docker exec hamlog-db-1 mysqldump \
  --single-transaction --routines --triggers \
  -u hamlog -p"$(grep DB_PASSWORD ~/HamLog/.env | cut -d= -f2)" \
  HamLogDB > ~/HamLog/backups/HamLogDB-$(date +%Y%m%d-%H%M).sql
```

> [!TIP]
> Store backups somewhere other than the HamLog directory — a USB drive, a
> NAS, or cloud storage. A backup on the same machine that fails doesn't
> help much.

---

## 12. Stopping and restarting

**Stop HamLog** (containers stop, data is preserved):

```bash
docker compose down
```

**Start HamLog again:**

```bash
docker compose up -d
```

> [!NOTE]
> Your QSO data lives in the `hamlog_data` Docker volume. `docker compose down`
> does not touch volumes. Your data persists through stops, starts, updates,
> and even removing and recreating containers. The only command that would
> delete the data is `docker volume rm hamlog_hamlog_data` — don't run that
> unless you mean to.

**View live logs** (useful for troubleshooting):

```bash
docker compose logs -f
```

Press `Ctrl+C` to stop following logs.

**Auto-start on boot:**

Both containers have `restart: unless-stopped` in the Compose file, so they
start automatically when Docker starts. Docker itself starts on boot after
the `apt-get install` in Step 2. No additional configuration is needed.
