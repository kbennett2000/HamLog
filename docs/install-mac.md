# Installing HamLog on macOS

By the end of this guide you'll have HamLog running on your Mac, accessible
in a browser at `http://localhost:8050` and reachable from any other device
on your home network.

HamLog runs as two Docker containers — a MySQL 8 database and a Node.js
application that serves the web interface. Docker handles all the runtime
dependencies; you don't need to install Node.js, MySQL, or anything else.

All commands in this guide are for the **Terminal** app. Open it from
`Applications → Utilities → Terminal`, or press `Cmd+Space` and type
`Terminal`.

---

## Prerequisites

- macOS 12 Monterey or later (Ventura, Sonoma, and Sequoia all work)
- An Intel Mac or Apple Silicon Mac (M1/M2/M3/M4)
- Administrator access on the machine
- Internet access
- About 15 minutes

> [!NOTE]
> Docker Desktop for Mac works on both Intel and Apple Silicon. Docker
> automatically uses the right image architecture for your chip.

---

## 1. Install Docker Desktop

1. Open your browser and go to:
   `https://docs.docker.com/desktop/install/mac-install/`

2. Download the correct installer for your Mac:
   - **Apple Silicon (M1/M2/M3/M4):** Download for Apple Silicon
   - **Intel:** Download for Intel

   Not sure which you have? Click the Apple menu → **About This Mac**. If
   it lists an `Apple M` chip, you have Apple Silicon. If it lists an
   `Intel Core` chip, you have Intel.

3. Open the downloaded `Docker.dmg` file. Drag the Docker icon into the
   Applications folder.

4. Open Docker from Applications. The first time, macOS will ask for your
   password to install the Docker helper — enter it and click **Install
   Helper**.

5. Docker Desktop opens and shows a tutorial. You can close it. Wait for the
   Docker whale icon in the menu bar to stop animating — that means Docker
   is ready.

**Verify Docker is working.** In Terminal:

```bash
docker run --rm hello-world
```

Expected output includes the line `Hello from Docker!`. If you see it, Docker
is installed and working correctly.

---

## 2. Get HamLog

Choose one of these options:

**Option A — Git (recommended, makes updating easy):**

macOS includes Git. In Terminal:

```bash
git clone https://github.com/kbennett2000/HamLog.git ~/HamLog
cd ~/HamLog
```

If macOS prompts you to install Xcode Command Line Tools when you run `git`,
click **Install** and wait for it to finish, then run the commands above again.

**Option B — Download a ZIP:**

```bash
curl -L https://github.com/kbennett2000/HamLog/archive/refs/heads/main.zip \
  -o ~/hamlog.zip
unzip ~/hamlog.zip -d ~
mv ~/HamLog-main ~/HamLog
cd ~/HamLog
```

Confirm you are in the correct directory:

```bash
pwd
```

Expected output: `/Users/yourname/HamLog`

---

## 3. Configure HamLog

HamLog reads its configuration from a `.env` file. A template is included.

**Step 3a — Copy the template:**

```bash
cp .env.example .env
```

**Step 3b — Generate a JWT secret:**

The JWT secret is a random string that signs authentication tokens. It must be
set before HamLog will start. macOS includes `openssl`, so run:

```bash
openssl rand -hex 32
```

Expected output: a 64-character string of hex digits, for example:

```
a3f8c2e1d4b7a9f0e2c3d5a6b8f1e4c7d9a2b5c8e1f3a6b9c2d5e8f1a4b7c0d3
```

Copy that value — you'll paste it into `.env` in a moment.

**Step 3c — Edit the .env file:**

Open the file in TextEdit:

```bash
open -e .env
```

> [!NOTE]
> TextEdit opens `.env` files as plain text. If you prefer a code editor,
> you can use VS Code (`code .env`) or nano in Terminal (`nano .env`).

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
| `JWT_SECRET` | Signs login tokens | Paste the value from Step 3b |

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

Save the file (`Cmd+S`) and close TextEdit.

> [!WARNING]
> Make sure TextEdit is in plain text mode, not rich text. If the file opens
> in rich text mode, go to **Format → Make Plain Text** before editing.
> Alternatively, use `nano .env` in Terminal to avoid this entirely.

---

## 4. Start HamLog

In Terminal, make sure you are in the HamLog directory:

```bash
cd ~/HamLog
```

Start the containers:

```bash
docker compose up -d
```

The first time you run this, Docker downloads the MySQL 8 image and builds
the HamLog application image. This takes 3–7 minutes depending on your
connection speed.

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
> your QSO data in a Docker volume — a managed storage area on your disk that
> persists even when containers are stopped. The `app` container runs the
> HamLog Node.js server, which serves the web interface and connects to the
> database. The `-d` flag means "detached" — both containers run in the
> background so you get your Terminal prompt back.

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
shows `(healthy)` once MySQL has finished initializing — give it 30 seconds
if it still shows `(starting)`.

If a container shows `Exited`, check the logs:

```bash
docker compose logs app
docker compose logs db
```

---

## 5. Open HamLog in your browser

Open any browser and go to:

```
http://localhost:8050
```

You should see the HamLog login screen.

> [!TIP]
> If the page doesn't load immediately, wait 30 seconds and refresh. MySQL
> needs a moment to finish initializing on the first start.

---

## 6. Create your first account

1. Click **Register** on the login screen.
2. Enter a username, password, and your callsign (e.g. `AE9S`).
3. Click **Create Account**.
4. You are now logged in and ready to log contacts.

Each person who uses HamLog gets their own account and their own private log.
Registration is open — anyone who can reach HamLog on your network can create
an account.

---

## 7. Access HamLog from other devices on your LAN

Other computers, tablets, or phones on your home network can reach HamLog
using your Mac's IP address instead of `localhost`.

**Find your Mac's IP address:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Expected output:

```
        inet 192.168.1.50 netmask 0xffffff00 broadcast 192.168.1.255
```

The IP address is the number after `inet` — in this example, `192.168.1.50`.

You can also find it in **System Settings → Wi-Fi** (or **Network**), click
your connected network, and look for **IP Address**.

On other devices, navigate to:

```
http://192.168.1.50:8050
```

(replace `192.168.1.50` with your actual IP address)

**macOS Firewall note:**

If your Mac's firewall is on, it may block incoming connections on port 8050.
Check in **System Settings → Network → Firewall**. If the firewall is
enabled, click **Options** and confirm that Docker Desktop is set to **Allow
incoming connections**. Docker Desktop adds itself to the firewall's allow
list during installation, but it's worth verifying if other devices can't
connect.

> [!TIP]
> If you're unsure whether the firewall is blocking connections, try
> temporarily turning it off for a quick test. If connections succeed with
> the firewall off, turn it back on and add the Docker rule.

---

## 8. Updating HamLog

When a new version is released, update by pulling the latest code and
rebuilding the containers. Your data is safe — it lives in a Docker volume
that is untouched by the update.

From the `~/HamLog` directory in Terminal:

```bash
git pull
docker compose build
docker compose up -d
```

`git pull` fetches the latest code. `docker compose build` rebuilds the
application image with the new code. `docker compose up -d` replaces the
running containers with the new versions.

> [!WARNING]
> If the update includes database migrations, the release notes will say so.
> Always back up your data before updating (see Section 9).

---

## 9. Backing up your data

Your QSO log is stored in a Docker volume. Back it up regularly, and always
before updating.

### Option A — Via the HamLog web interface

1. Log in to HamLog.
2. Click **Settings** in the navigation bar.
3. Use the **Download JSON Backup** or **Download ADIF Backup** button.

The JSON backup includes all QSOs and is suitable for archival. The ADIF
backup is compatible with other logging software such as Log4OM and WSJT-X.

### Option B — curl backup from Terminal

You need a Bearer token first (replace `myuser` and `mypass` with your
credentials):

```bash
TOKEN=$(curl -s -X POST http://localhost:8050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","password":"mypass"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
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

This creates a complete SQL dump of all users and logs:

```bash
DB_PASS=$(grep DB_PASSWORD ~/HamLog/.env | cut -d= -f2)

docker exec hamlog-db-1 mysqldump \
  --single-transaction --routines --triggers \
  -u hamlog -p"$DB_PASS" HamLogDB \
  > ~/HamLog/backups/HamLogDB-$(date +%Y%m%d-%H%M).sql
```

> [!TIP]
> Store backups somewhere other than the HamLog directory — an external
> drive, Time Machine, or cloud storage. A backup on the same drive that
> fails doesn't help much.

---

## 10. Stopping and restarting

**Stop HamLog** (containers stop, data is preserved):

```bash
docker compose down
```

**Start HamLog again:**

```bash
docker compose up -d
```

> [!NOTE]
> Your QSO data lives in the `hamlog_hamlog_data` Docker volume.
> `docker compose down` does not touch volumes. Your data persists through
> stops, starts, updates, and even removing and recreating containers. The
> only way to delete the data is to explicitly remove the volume with
> `docker volume rm hamlog_hamlog_data` — don't run that unless you mean to.

**View live logs** (useful for troubleshooting):

```bash
docker compose logs -f
```

Press `Ctrl+C` to stop following logs.

**Auto-start on boot:**

Docker Desktop is configured to start at login by default. Both HamLog
containers have `restart: unless-stopped` in the Compose file, so they start
automatically when Docker Desktop starts. No additional configuration is
needed.

> [!TIP]
> You can verify Docker Desktop auto-start is enabled in Docker Desktop →
> Settings → General → "Start Docker Desktop when you log in."

---

## Troubleshooting

**"Cannot connect to the Docker daemon"**

Docker Desktop is not running. Open it from Applications, wait for the menu
bar icon to stop animating, then try again.

**Port 8050 is already in use**

Another application is using port 8050. Edit `.env` and change `PORT` to
another value (e.g. `PORT=8051`), then run `docker compose up -d` again.

**The app container exits immediately**

Almost always caused by a missing or empty `JWT_SECRET` in `.env`. Check the
logs with `docker compose logs app` — you'll see an error like `JWT_SECRET is
required`. Go back to Step 3b and generate the secret.

**Changes to .env don't take effect**

After editing `.env`, you must restart the containers:

```bash
docker compose down
docker compose up -d
```
