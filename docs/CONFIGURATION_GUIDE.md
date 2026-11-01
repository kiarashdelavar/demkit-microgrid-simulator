# Local Setup and Configuration Guide (BK-02)

**Status:** Developer guide for the inherited Windows development version.  
**Related issue:** [BK-02 — Keep local files and credentials out of Git](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/4)

This guide explains which files belong on your computer and how to set up the existing Microgrid Touchtable without uploading personal settings to GitHub. It does **not** install or configure InfluxDB.

## 1. Why keep local files out of Git?

Some files can be recreated automatically or contain information specific to one computer:

| Local file | Why it should not be committed |
| --- | --- |
| `.venv/` | Python virtual environment, installed dependencies and machine-specific executables |
| `workspace/touchtable/web/node_modules/` | Downloaded Node.js dependencies |
| `demkittt/conf/usrconf.py` | Local paths and potentially credentials |
| `.env`, `.env.local`, etc. | Local environment variables; they can contain secrets |
| `__pycache__/`, logs and generated output | Temporary files that are not the source of truth |

The tracked `demkittt/conf/usrconf.example.py` file is a **template** and should stay in Git. Never put real credentials in this example. The existing project notices and license must be preserved.

## 2. Start in the repository root

For an existing checkout, open VS Code and navigate to the root folder that contains `README.md`, `requirements.txt`, `demkittt/`, and `workspace/`.

Example:

```powershell
cd "D:\Saxion Programme\Demkit-simulation app\touchtable-tool"
```

Check:

```powershell
git status --short
Test-Path .\demkittt\demkit.py
Test-Path .\workspace\touchtable\web\package.json
```

Both `Test-Path` commands should return `True`. Your own installation path can be different.

## 3. Set up your local Python and Node dependencies

The environment recorded for the first working Windows demo was **Python 3.12.10**, **Node.js 22.15.0**, and **npm 11.12.1**. This is an observed setup, not a fully validated compatibility matrix.

From the repository root:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

For the web application:

```powershell
cd .\workspace\touchtable\web
npm ci
cd ..\..\..
```

`pip` installs Python packages inside `.venv`; `npm ci` installs JavaScript packages inside `node_modules`. Neither dependency directory should be pushed to GitHub.

## 4. Create your own DEMKit configuration

Only do the copy if `usrconf.py` does not exist already; do not overwrite a working local setup.

```powershell
if (-not (Test-Path .\demkittt\conf\usrconf.py)) {
    Copy-Item .\demkittt\conf\usrconf.example.py .\demkittt\conf\usrconf.py
}
```

The updated `usrconf.example.py` now **finds the four paths automatically** from its own location. You should no longer need to enter your own `D:/...` or `C:/...` path. The relevant lines are:

```python
from pathlib import Path
_REPO_ROOT = Path(__file__).resolve().parents[2]
componentPath = (_REPO_ROOT / 'demkittt' / 'components').as_posix() + '/'
workspacePath = (_REPO_ROOT / 'workspace').as_posix() + '/'
demCfg['env']['path'] = componentPath
demCfg['workspace']['path'] = workspacePath
```

**For existing setups:** If you already have `usrconf.py`, Git will not update it. **Do not delete or overwrite it blindly**, especially if you have local settings. Back it up first, then copy the six lines shown above into your existing file, replacing only the four old path assignments. Keep the rest of your local configuration unchanged.

```powershell
Copy-Item .\demkittt\conf\usrconf.py "$HOME\demkit-usrconf-backup.py"
```

Do not add a second active definition of `componentPath`, `workspacePath`, or the two `demCfg` paths. After this one-time migration, moving the project to another folder should not require updating the paths again.

**Important:** `usrconf.py` is local and ignored by Git. Keep passwords and tokens out of `usrconf.example.py`.

## 5. Check which files Git ignores

From the repository root:

```powershell
git check-ignore -v .venv/
git check-ignore -v demkittt/conf/usrconf.py
git check-ignore -v workspace/touchtable/web/node_modules/
git check-ignore -v .env
git check-ignore -v .env.local
```

Each should print a matching rule from `.gitignore`. This confirms Git would normally ignore those **untracked** files.

Also check for accidentally tracked local paths:

```powershell
git ls-files | Select-String -Pattern '(^|/)(\.venv|node_modules|__pycache__)/|(^|/)usrconf\.py$|(^|/)\.env(\..+)?$'
```

There should be no matches for sensitive local files. A tracked safe template such as `.env.example`, if one exists, can be reviewed separately.

Finally:

```powershell
git status --short
```

Review all files before staging and committing. Prefer `git add <specific-file>` over `git add .` when you're unsure.

**Limitation:** `.gitignore` does not protect files that Git already tracks, and it cannot detect passwords embedded inside other source files. Review staged diffs before publishing. If a real secret has already been committed, remove it from use and rotate/revoke it; a later deletion does not erase Git history.

## 6. Starting the existing simulation

Terminal 1, from the repository root:

```powershell
.\.venv\Scripts\python.exe .\demkittt\demkit.py -f touchtable/model -m touchtable
```

After Python DEMKit is listening on port `3001`, open terminal 2:

```powershell
cd workspace\touchtable\web
node index.js
```

Then open **http://localhost:3002**.

### One-action Windows launcher (BK-07 development version)

After installing the existing dependencies and creating `demkittt/conf/usrconf.py`, stop **any previous Python or Node.js servers** on ports 3001 and 3002.

From the repository root, run:

```powershell
.\workspace\touchtable\touchtafel.bat
```

Or double-click `workspace/touchtable/touchtafel.bat` in File Explorer. This now calls `scripts/launch_demkit.py` using the project's Python virtual environment.

The script starts Python DEMKit, checks for an HTTP response on port **3001**, starts Node.js, checks the browser homepage on **3002**, and opens `http://localhost:3002`. It doesn't use a fixed 30-second sleep. Keep the launcher window open while using the simulation.

You can run the underlying Python launcher directly:

```powershell
.\.venv\Scripts\python.exe .\scripts\launch_demkit.py
```

The launcher refuses to start if either port is already in use. Close old DEMKit windows first; don't run `node index.js` or `demkit.py` separately at the same time.

### Checking your setup without starting the simulation (BK-08)

From the repository root:

```powershell
.\.venv\Scripts\python.exe .\scripts\launch_demkit.py --check
```

If both ports are free and the required files and Node.js are available, the command prints `Checks passed` and **does not** start Python DEMKit or Node.js. If either port is already in use, it reports `PORT_IN_USE` and tells you to close the earlier servers first.

Expected startup issues now have short codes and suggested fixes:

| Message | What to try |
| --- | --- |
| `MISSING_CONFIG` | Copy `demkittt/conf/usrconf.example.py` to the ignored local `usrconf.py`. |
| `MISSING_NPM` | Run `npm ci` inside `workspace/touchtable/web`. |
| `MISSING_NODE` | Install Node.js and reopen your terminal. |
| `PORT_IN_USE` | Close earlier DEMKit/Node.js servers. |
| `BACKEND_EXITED` | Read the Python error printed above it; check `usrconf.py`. |
| `WEB_EXITED` | Read the Node.js error printed above it; check web dependencies. |
| `BACKEND_TIMEOUT` / `WEB_TIMEOUT` | Check the service output and port availability. |
| `INVALID_PORT` | Use valid numeric port settings. |

To run automated checks without starting the real simulation:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_launcher.py"
```

**Keep the local configuration private.** The launcher does not display password/token values; backend and Node.js themselves may still print technical diagnostic output. In case of an error, share only the error code and relevant message, and remove private details from any logs before sending them to someone else.

### Stopping and reopening the simulator (BK-09)

When you finish using the simulation:

1. Return to the terminal that is running the launcher.
2. Press **Ctrl+C once**. Wait for the message `[Launcher] Shutdown complete. Both ports are free.`
3. Leave the browser tab open or close it. The browser alone does **not** stop the servers.
4. Run the same `workspace/touchtable/touchtafel.bat` command again to start a new session.

The launcher asks its two owned process groups to stop. If a process does not respond in a few seconds, it can force-stop **only the processes started by this launcher**. It then checks ports 3001 and 3002.

You can verify the ports yourself with PowerShell:

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in 3001,3002 } |
    Select-Object LocalPort,OwningProcess
```

**Expected after stopping:** no rows. If `PORT_STILL_IN_USE` appears, an old or unrelated process may still be listening. Identify it before stopping anything; never indiscriminately kill every Python or Node.js process. If you press Ctrl+C while the launcher is **starting**, it should also clean up any service it has already created.

**Limitations:** This only covers a normal Ctrl+C or a handled startup failure. Force-closing the terminal, power loss or a sudden crash of the launcher can still leave child processes behind. This remains a development launcher, and shutdown on macOS/Linux has not been manually verified. No simulation results are saved or restored by this change.

**This is not an installer.** Students still need Python and Node.js and must install the dependencies first. This is a development prototype; diagnostics, process lifecycle reliability and macOS/Linux verification remain future work (BK-08, BK-09 and packaging tasks). InfluxDB isn't required for this launcher and its existing connection warnings may still appear.

To test the configuration without starting the simulation, run:

```powershell
.\.venv\Scripts\python.exe .\scripts\check_portable_paths.py
```

This checks the tracked template in two temporary folders, including one with spaces. It **does not** replace the manual start-and-device tests in two actual checkouts.

## 7. BK-02 verification record

Checks reported from the Windows checkout on **16 October 2026**:

- `git check-ignore -v .venv/` → matched `.gitignore:19:.venv/`.
- `git check-ignore -v demkittt/conf/usrconf.py` → matched `.gitignore:10:usrconf.py`.
- `git check-ignore -v workspace/touchtable/web/node_modules/` → matched `.gitignore:1:node_modules/`.
- Tracked-file scan for `.venv`, `node_modules`, `__pycache__`, `usrconf.py` and `.env` → **no matches** in the local checkout.
- The branch `docs/bk-02-config-hygiene` was created locally.

The added `.env.*` rule should also be verified locally. The above checks do not represent a full security audit of all past commits or every source file.

## 8. Definition of done

- [x] Existing ignore rules for the virtual environment, Node modules and local DEMKit config were checked on Windows.
- [x] No tracked files matched the checked local-file patterns.
- [x] A safe template and local-setup steps are documented.
- [ ] Verify the new `.env.local` ignore rule locally.
- [ ] Review the PR, merge to `main`, and close [BK-02](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/4).

Next: [BK-03 — Test the existing simulation](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/5).
