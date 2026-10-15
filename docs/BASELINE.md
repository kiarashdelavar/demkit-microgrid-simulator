# BK-01 — Working DEMKit Development Baseline

**Recorded:** 15 October 2026  
**Status:** Draft — software versions and network listeners recorded; application evidence and startup warnings still pending  
**Related issue:** [#3 — Record the current working DEMKit setup](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/3)  
**Purpose:** Keep a record of the currently working Windows setup before changing dependencies, paths, the launcher, or the energy models.

> This document separates **observations from the local demo**, **facts found in the repository**, and **checks still to complete**. A visible user interface does not prove that every device or control algorithm works correctly.

## 1. Environment

| Item | Value | Evidence / confidence |
| --- | --- | --- |
| Operating system | **Windows 11 Pro, version 10.0.26300, build 26300** | Confirmed by PowerShell `Get-CimInstance Win32_OperatingSystem` screenshot (15 Oct 2026) |
| Python | **3.12.10** in `.venv/` | Confirmed by `.\.venv\Scripts\python.exe --version` from repository root (15 Oct 2026) |
| Additional Python | Python 3.13.5 installed but not used for DEMKit | Local Python launcher output |
| Node.js | **v22.15.0** | Local terminal output |
| npm | **v11.12.1** | Local terminal output |
| pip | **26.2.1**, Python 3.12 virtual environment | Confirmed by `.\.venv\Scripts\python.exe -m pip --version` (15 Oct 2026) |
| Git | **2.45.1.windows.1** | Confirmed by `git --version` in local PowerShell (15 Oct 2026) |
| Local checkout | `D:\Saxion Programme\Demkit-simulation app\touchtable-tool` | Local terminal output |
| Local Git HEAD at metadata capture | [`ac566ff74f1f401d49c5890af5905575b85ed6e2`](https://github.com/kiarashdelavar/demkit-microgrid-simulator/commit/ac566ff74f1f401d49c5890af5905575b85ed6e2) on `docs/educational-feature-ideas`; clean working tree | Confirmed by `git rev-parse HEAD`, `git branch --show-current`, and empty `git status --short` output (15 Oct 2026). This is the **recorded local HEAD**, not a verified SHA for the earlier demo run. |
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

This is the **documented architecture**. An initial port check returned no rows when service state was unknown. A later PowerShell check on 15 October 2026 showed **port 3001 listening on 0.0.0.0 (PID 10244)** and **port 3002 listening on :: (PID 27184)**. The listener process identities were subsequently confirmed as `python` for port 3001 and `node` for port 3002. This validates process identity and listening status, not complete HTTP or simulation behaviour.

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
| Backend ports | **3001 listening** (`0.0.0.0`, PID 10244 → `python`); **3002 listening** (`::`, PID 27184 → `node`) | Confirmed by `Get-NetTCPConnection` and `Get-Process` on Windows (15 Oct 2026). Full HTTP and simulation correctness not yet tested. |
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

Operating system, Python, pip, Node.js, npm, branch and current HEAD have been recorded. To finish evidence collection, run these remaining checks from the repository root:

```powershell
git --version  # Confirmed: 2.45.1.windows.1
Get-NetTCPConnection -State Listen -LocalPort 3001,3002 | ForEach-Object { $p = Get-Process -Id $_.OwningProcess; [PSCustomObject]@{Port=$_.LocalPort; Process=$p.ProcessName; PID=$_.OwningProcess} }  # Confirmed: 3001/python, 3002/node
```

While both application services are running, check the listeners:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3001,3002 -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, OwningProcess
```

Also capture a startup log (with any personal values or tokens removed) and a screenshot of the active app.


### Additional local-terminal observation (15 October 2026)

Running `git rev-parse HEAD` and `.\\.venv\\Scripts\\python.exe --version` from `D:\\Saxion Programme\\Demkit-simulation app` failed, because that is **the parent directory**, not the Git project root. The correct project root is `D:\\Saxion Programme\\Demkit-simulation app\\touchtable-tool`. This is a current-working-directory mistake, **not evidence of a broken Python installation or repository**. The version and commit checks were subsequently repeated successfully after changing into the repository root.

## 7. When BK-01 is complete

- [x] Baseline report created with environment, architecture, and startup instructions
- [x] Known setup problems documented separately from confirmed features
- [x] Windows version/build recorded from PowerShell screenshot
- [x] Confirm Python 3.12.10 and pip 26.2.1 via terminal, plus record local Git HEAD and branch
- [ ] Verify whether the recorded local HEAD is the same revision used for the original demo, or log a fresh run against that revision
- [x] Confirm ports 3001/3002 have listeners during a later run (PID 10244 / 27184)
- [x] Confirm port listener process names (`python` on 3001, `node` on 3002)
- [ ] Confirm application HTTP responses and simulation behaviour in the planned BK-03 smoke tests
- [ ] Screenshot or issue attachment linked as evidence
- [ ] Startup warnings checked and documented from a fresh run
- [ ] Report reviewed, merged into `main`, and [issue #3](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/3) closed

**Next work:** Run the formal functional tests in [TEST_PLAN.md](TEST_PLAN.md) under BK-03 and examine configuration hygiene under BK-02. Do not treat this baseline record as proof that all those tests passed.
