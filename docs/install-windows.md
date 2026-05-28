# Installing HamLog on Windows 10 / 11

By the end of this guide you'll have HamLog running on your Windows machine,
accessible in a browser at `http://localhost:8050` and reachable from any
other device on your home network.

HamLog runs as two Docker containers — a MySQL 8 database and a Node.js
application that serves the web interface. Docker Desktop handles all the
runtime dependencies; you don't need to install Node.js, MySQL, or anything
else.

All commands in this guide are for **PowerShell**. Do not use the old
Command Prompt (`cmd.exe`) — PowerShell is included with Windows 10 and 11.
To open PowerShell: press `Win+X` and choose **Windows PowerShell** or
**Terminal**.

---

## Prerequisites

- Windows 10 version 2004 or later, or Windows 11 (any edition)
- Administrator access on the machine
- Internet access
- About 15 minutes

> [!NOTE]
> Docker Desktop on Windows uses WSL 2 (Windows Subsystem for Linux) under
> the hood. This guide walks you through enabling it. If WSL 2 is already
> enabled on your machine, you can skip those steps.

---

## 1. Enable WSL 2

Docker Desktop for Windows requires WSL 2. Open PowerShell **as
Administrator** (right-click the Start menu, choose **Windows PowerShell
(Admin)** or **Terminal (Admin)**) and run:

```powershell
wsl --install
```

Expected output:

```
Installing: Windows Subsystem for Linux
Windows Subsystem for Linux has been installed.
Installing: Ubuntu
Ubuntu has been installed.
```

> [!NOTE]
> If you see `WSL is already installed`, WSL 2 is present and you can move
> on to Step 2.

Restart your computer when prompted. After restarting, Windows may open a
terminal to finish setting up Ubuntu — you can close it, you won't need the
Ubuntu shell for HamLog.

---

## 2. Install Docker Desktop

1. Open your browser and go to:
   `https://docs.docker.com/desktop/install/windows-install/`

2. Click **Docker Desktop for Windows** to download the installer.

3. Run the installer (`Docker Desktop Installer.exe`). Accept the defaults.
   When asked, ensure **Use WSL 2 instead of Hyper-V** is checked.

4. Click **Close and restart** when the installer finishes.

After the restart, Docker Desktop launches automatically. You'll see a Docker
whale icon in the system tray. Wait until the icon stops animating — that
means Docker is ready.

**Verify Docker is working.** Open PowerShell and run:

```powershell
docker run --rm hello-world
```

Expected output includes the line `Hello from Docker!`. If you see it, Docker
is installed and working correctly.

> [!TIP]
> If `docker` is not recognized, log out and log back in so that the PATH
> change from the Docker Desktop install takes effect.

---

## 3. Get HamLog

Choose one of these options:

**Option A — Git (recommended, makes updating easy):**

If Git is not installed, download it from `https://git-scm.com/download/win`
and run the installer with default settings.

Open PowerShell and clone the repository into your home directory:

```powershell
git clone https://github.com/kbennett2000/HamLog.git $HOME\HamLog
cd $HOME\HamLog
```

**Option B — Download a ZIP:**

```powershell
Invoke-WebRequest -Uri https://github.com/kbennett2000/HamLog/archive/refs/heads/main.zip `
  -OutFile "$HOME\hamlog.zip"
Expand-Archive -Path "$HOME\hamlog.zip" -DestinationPath $HOME
Rename-Item "$HOME\HamLog-main" "$HOME\HamLog"
cd $HOME\HamLog
```

Confirm you are in the correct directory:

```powershell
Get-Location
```

Expected output: `C:\Users\yourname\HamLog`

---

## 4. Configure HamLog

HamLog reads its configuration from a `.env` file. A template is included.

**Step 4a — Copy the template:**

```powershell
Copy-Item .env.example .env
```

**Step 4b — Generate a JWT secret:**

The JWT secret is a random string that signs authentication tokens. It must be
set before HamLog will start. Generate one with:

```powershell
[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-","").ToLower()
```

Expected output: a 64-character string of hex digits, for example:

```
a3f8c2e1d4b7a9f0e2c3d5a6b8f1e4c7d9a2b5c8e1f3a6b9c2d5e8f1a4b7c0d3
```

Copy that value — you'll paste it into `.env` in a moment.

> [!TIP]
> If you have `openssl` installed (it ships with Git for Windows), you can
> also run: `openssl rand -hex 32`

**Step 4c — Edit the .env file:**

Open the file in Notepad:

```powershell
notepad .env
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
| `JWT_SECRET` | Signs login tokens | Paste the value from Step 4b |

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

Save the file (`Ctrl+S`) and close Notepad.

> [!WARNING]
> Make sure Notepad saves the file as plain text, not as `UTF-8 with BOM`.
> In Notepad on Windows 11, use **Save As** and confirm the encoding is
> `UTF-8` (without BOM). VS Code or Notepad++ avoid this issue entirely.

---

## 5. Start HamLog

In PowerShell, make sure you are in the HamLog directory:

```powershell
cd $HOME\HamLog
```

Start the containers:

```powershell
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
> background so you get your PowerShell prompt back.

**Verify both containers are running:**

```powershell
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

```powershell
docker compose logs app
docker compose logs db
```

---

## 6. Open HamLog in your browser

Open any browser and go to:

```
http://localhost:8050
```

You should see the HamLog login screen.

> [!TIP]
> If the page doesn't load immediately, wait 30 seconds and refresh. MySQL
> needs a moment to finish initializing on the first start.

---

## 7. Create your first account

1. Click **Register** on the login screen.
2. Enter a username, password, and your callsign (e.g. `AE9S`).
3. Click **Create Account**.
4. You are now logged in and ready to log contacts.

Each person who uses HamLog gets their own account and their own private log.
Registration is open — anyone who can reach HamLog on your network can create
an account.

---

## 8. Access HamLog from other devices on your LAN

Other computers, tablets, or phones on your home network can reach HamLog
using your machine's IP address instead of `localhost`.

**Find your IP address:**

```powershell
ipconfig
```

Look for a section like `Wireless LAN adapter Wi-Fi` or `Ethernet adapter
Ethernet`. Under it, find the `IPv4 Address` line:

```
IPv4 Address. . . . . . . . . . . : 192.168.1.50
```

On other devices, navigate to:

```
http://192.168.1.50:8050
```

(replace `192.168.1.50` with your actual IP address)

**Windows Firewall note:**

Windows Firewall may block incoming connections on port 8050. If other devices
can't reach HamLog, open PowerShell as Administrator and run:

```powershell
New-NetFirewallRule -DisplayName "HamLog" `
  -Direction Inbound -Protocol TCP -LocalPort 8050 -Action Allow
```

To confirm the rule was added:

```powershell
Get-NetFirewallRule -DisplayName "HamLog"
```

> [!NOTE]
> This rule only applies to your local network. Docker Desktop on Windows
> does not expose ports to the internet by default.

---

## 9. Updating HamLog

When a new version is released, update by pulling the latest code and
rebuilding the containers. Your data is safe — it lives in a Docker volume
that is untouched by the update.

From the `$HOME\HamLog` directory in PowerShell:

```powershell
git pull
docker compose build
docker compose up -d
```

`git pull` fetches the latest code. `docker compose build` rebuilds the
application image with the new code. `docker compose up -d` replaces the
running containers with the new versions.

> [!WARNING]
> If the update includes database migrations, the release notes will say so.
> Always back up your data before updating (see Section 10).

---

## 10. Backing up your data

Your QSO log is stored in a Docker volume. Back it up regularly, and always
before updating.

### Option A — Via the HamLog web interface

1. Log in to HamLog.
2. Click **Settings** in the navigation bar.
3. Use the **Download JSON Backup** or **Download ADIF Backup** button.

The JSON backup includes all QSOs and is suitable for archival. The ADIF
backup is compatible with other logging software such as Log4OM and WSJT-X.

### Option B — PowerShell backup scripts

HamLog includes backup scripts in the `scripts\` directory.

**JSON or ADIF backup via the API:**

```powershell
.\scripts\backup-api.ps1 -Username myuser -Password mypass
```

To download in ADIF format instead:

```powershell
.\scripts\backup-api.ps1 -Format adif -Username myuser -Password mypass
```

The backup file is saved to `backups\` in the HamLog directory.

### Option C — Full database dump with mysqldump

This creates a complete SQL dump of all users and logs:

```powershell
# Read the DB password from .env
$dbPass = (Get-Content .env | Where-Object { $_ -match "^DB_PASSWORD=" }) -replace "^DB_PASSWORD=",""

docker exec hamlog-db-1 mysqldump `
  --single-transaction --routines --triggers `
  -u hamlog "-p$dbPass" HamLogDB `
  | Out-File -FilePath "backups\HamLogDB-$(Get-Date -Format 'yyyyMMdd-HHmm').sql" -Encoding utf8
```

> [!TIP]
> Store backups somewhere other than the HamLog directory — a USB drive, a
> network share, or cloud storage. A backup on the same drive that fails
> doesn't help much.

---

## 11. Stopping and restarting

**Stop HamLog** (containers stop, data is preserved):

```powershell
docker compose down
```

**Start HamLog again:**

```powershell
docker compose up -d
```

> [!NOTE]
> Your QSO data lives in the `hamlog_hamlog_data` Docker volume.
> `docker compose down` does not touch volumes. Your data persists through
> stops, starts, updates, and even removing and recreating containers. The
> only way to delete the data is to explicitly remove the volume with
> `docker volume rm hamlog_hamlog_data` — don't run that unless you mean to.

**View live logs** (useful for troubleshooting):

```powershell
docker compose logs -f
```

Press `Ctrl+C` to stop following logs.

**Auto-start on boot:**

Docker Desktop is configured to start with Windows by default. Both HamLog
containers have `restart: unless-stopped` in the Compose file, so they start
automatically when Docker Desktop starts. No additional configuration is
needed.

> [!TIP]
> You can verify Docker Desktop auto-start is enabled in Docker Desktop →
> Settings → General → "Start Docker Desktop when you sign in to your
> computer."
