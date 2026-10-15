# BK-01 — Working DEMKit Development Baseline

**Recorded:** 15 October 2026  
**Status:** Draft — missing machine details and a repeatable test run  
**Related issue:** [#3 — Record the current working DEMKit setup](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/3)  
**Purpose:** Keep a record of the currently working Windows setup before changing dependencies, paths, the launcher, or the energy models.

> This document separates **observations from the local demo**, **facts found in the repository**, and **checks still to complete**. A visible user interface does not prove that every device or control algorithm works correctly.

## 1. Environment

| Item | Value | Evidence / confidence |
| --- | --- | --- |
| Operating system | Windows — exact edition/build **to record** | Windows VS Code/PowerShell screenshots |
| Python | Python **3.12** virtual environment, `.venv/` | Local setup conversation; patch version to verify |
| Additional Python | Python 3.13.5 installed but not used for DEMKit | Local Python launcher output |
| Node.js | **v22.15.0** | Local terminal output |
| npm | **v11.12.1** | Local terminal output |
| pip | Installed in the Python virtual environment; version **to recheck** | Local terminal output |
| Git | Installed; version **to record** | Repository cloned and pushed |
| Local checkout | `D:\Saxion Programme\Demkit-simulation app\touchtable-tool` | Local terminal output |
| Local Git commit tested | **To record:** `git rev-parse HEAD` | Do not substitute a remote branch SHA for the tested commit |
| Database | No InfluxDB integration planned for this phase | Assignment scope decision |

**Important compatibility note:** `workspace/touchtable/web/package.json` declares Node 11.15.0/npm 6.7.0, but the application interface was opened on a machine using Node 22.15.0/npm 11.12.1. This is an *observed local run*, **not** a verified compatibility guarantee.

## 2. Application structure

| Part | Location | Purpose |
| --- | --- | --- |
| Python simulation | `demkittt/demkit.py` | Starts the DEMKit simulation |
| DEMKit local configuration | `demkittt/conf/usrconf.py` | Points to components, models, and optional services |
| Configuration template | `demkittt/conf/usrconf.example.py` | Safe starting template for each machine |
| Simulation model | `workspace/touchtable/model/` | Defines houses, devices, profiles, and the network |
| Node.js middleware | `workspace/touchtable/web/index.js` | Web server and communication with DEMKit |
| Browser interface | `workspace/touchtable/web/static/` | Interactive neighbourhood simulation |
| Original launcher | `workspace/touchtable/touchtafel.bat` | Windows launch script with machine-specific paths |

From the inherited [handover](../HANDOVER.md):

```text
Browser (http://localhost:3002)
        | Socket.IO
Node.js / Express (port 3002)
        | HTTP commands
Python DEMKit (port 3001)
        | simulation state returned to Node.js
Browser receives updated state
```

This is the **documented architecture**. Rechecking the two port listeners during a fresh run is still required.

## 3. How the Windows development version was started

Start from the root of the local repository:

```powershell
cd "D:\Saxion Programme\Demkit-simulation app\touchtable-tool"
```

### Python dependencies

A virtual environment was created using Python 3.12 (after a Python 3.13 environment-creation error). The intended setup is:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Local setup encountered a timeout from `files.pythonhosted.org` when installing Python packages. The developer retried downloads using longer timeouts.

### Node.js dependencies

```powershell
cd workspace\touchtable\web
npm ci
cd ..\..\..
```

The setup also encountered an `ECONNRESET` npm network error. A complete clean-install dependency test is **not yet recorded**.

### Machine-specific configuration

Create the ignored local configuration file:

```powershell
Copy-Item demkittt\conf\usrconf.example.py demkittt\conf\usrconf.py
```

Update these four values inside `usrconf.py` to point at the local checkout, using trailing slashes:

- `componentPath` → `<REPO_ROOT>/demkittt/components/`
- `workspacePath` → `<REPO_ROOT>/workspace/`
- `demCfg['env']['path']` → `<REPO_ROOT>/demkittt/components/`
- `demCfg['workspace']['path']` → `<REPO_ROOT>/workspace/`

Use forward slashes in the Python path values. **Do not commit `usrconf.py`, real credentials, or `.venv/`.**

### Launch (two terminals)

Terminal 1, from the repository root:

```powershell
.\.venv\Scripts\python.exe .\demkittt\demkit.py -f touchtable/model -m touchtable
```

Wait until DEMKit reports it is ready on port **3001**.

Terminal 2, from the repository root:

```powershell
cd workspace\touchtable\web
node index.js
```

Open **http://localhost:3002** in a browser. The inherited design starts paused; click **Start Mission** to run. Keep both processes open. Stop each with **Ctrl+C**.

## 4. What has been observed so far

| Area | Observed result | Verification status |
| --- | --- | --- |
| Repository | Source downloaded from Boxing Jiang and pushed to the project repository | Confirmed through Git history |
| Python environment | Python 3.12 virtual environment prepared after a Python 3.13 setup error | Observed during local setup |
| Node environment | Node 22.15.0 and npm 11.12.1 reported in VS Code | Observed during local setup |
| Browser | Microgrid interface displayed with six houses and neighbourhood connections | **Observed in screenshots** |
| Gameplay interface | Start Mission overlay, budget, learning-goal rewards, house loading and power values shown | **Observed in screenshots** |
| Placed devices | Interface screenshot contains EV charger / solar / battery-style device icons placed in houses | **Observed visually; behaviour not formally validated** |
| Running state | Later screenshot shows simulated date/time and energy readings | **Observed visually; accuracy not formally validated** |
| Device controls and energy calculations | Individual operations and numerical correctness | **Not yet fully tested — BK-03** |
| Backend ports | Port 3001 and port 3002 are specified by the handover | **Listener checks pending** |
| Clean installation on another machine | Not performed | **Not tested** |
| macOS / Linux | Not performed | **Not tested** |

Evidence still needed: attach at least one screenshot of the running application to [issue #3](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/3) and add its GitHub link here. Prefer one overview screenshot without personal browser tabs.

## 5. Known warnings and limitations

1. **Hardcoded paths:** The original Windows launcher and configuration template contain paths belonging to the previous developer.
2. **Legacy dependencies:** The Node.js engine versions declared in `package.json` are much older than the observed working Node/npm versions.
3. **Initial installation difficulties:** Python 3.13 `ensurepip` failed; Python package downloads timed out; npm reported `ECONNRESET`. These are *observed setup problems*, not necessarily reproducible on other machines.
4. **InfluxDB:** The inherited handover describes connection failures while the simulation continued. This has **not been independently verified in the new Windows baseline**. Database integration is out of scope; whether logging can be safely disabled is covered by BK-06.
5. **No completed regression test:** Successful browser display alone does not prove correctness of device behaviour, cable faults, battery strategies, or game scoring.
6. **No cross-platform installer:** Packaging and Windows/macOS/Linux compatibility have not been validated.

## 6. Details still to collect on the laptop

Run these commands from the repository root and add the results to section 1:

```powershell
(Get-CimInstance Win32_OperatingSystem) | Select-Object Caption, Version, BuildNumber
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -m pip --version
node --version
npm --version
git --version
git rev-parse HEAD
git branch --show-current
git status --short
```

While both application services are running, check the listeners:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3001,3002 -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, OwningProcess
```

Also capture a startup log (with any personal values or tokens removed) and a screenshot of the active app.

## 7. When BK-01 is complete

- [x] Baseline report created with environment, architecture, and startup instructions
- [x] Known setup problems documented separately from confirmed features
- [ ] Exact Windows version, Python patch version, pip version, and **local tested commit** recorded
- [ ] Confirm ports 3001/3002 are listening during a fresh start
- [ ] Screenshot or issue attachment linked as evidence
- [ ] Startup warnings checked and documented from a fresh run
- [ ] Report reviewed, merged into `main`, and [issue #3](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/3) closed

**Next work:** Run the formal functional tests in [TEST_PLAN.md](TEST_PLAN.md) under BK-03 and examine configuration hygiene under BK-02. Do not treat this baseline record as proof that all those tests passed.
