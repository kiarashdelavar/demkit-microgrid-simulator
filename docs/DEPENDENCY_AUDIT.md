# BK-04 — Dependency and Configuration Audit

**Date:** 18 October 2026  
**Related task:** [BK-04 / Issue #6](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/6)  
**Status:** Draft — repository review completed; a clean setup on another computer has not been tested

## 1. Why I am doing this

I want to understand what the existing DEMKit Touchtable needs before I try to make the setup easier. The simulator works on my Windows laptop, but it still has paths and settings that belong to the previous developer.

For this task, I am **only checking and documenting** the current setup. I am not replacing libraries, removing logging, or fixing the launcher yet. Those changes belong to the next tasks.

I distinguish between:
- **Found in code:** I checked the file in this repository.
- **Worked on my laptop:** Recorded during BK-01 and the BK-03 manual tests.
- **Not verified:** Still needs a clean installation or extra test.

## 2. Runtime versions

| Tool | Version recorded on my Windows laptop | What the repository says | What this means |
| --- | --- | --- | --- |
| Windows | 11 Pro, build 26300 | Original `.bat` launcher is Windows-specific | Windows is the only platform tested so far |
| Python | **3.12.10** in `.venv` | No required Python version specified in `requirements.txt` | This version worked locally; compatibility range is unknown |
| pip | **26.2.1** | No exact pip version required | Local observation only |
| Node.js | **22.15.0** | `web/package.json` declares **11.15.0** | The old declaration does not match my working development environment |
| npm | **11.12.1** | `web/package.json` declares **6.7.0** | Needs checking before choosing supported versions |
| Git | **2.45.1.windows.1** | Required to clone and work with source | Recorded during BK-01 |

**Important:** A working local run with newer software does not prove that every feature or clean installation will work. The inherited `web/Dockerfile` uses `node:10`, while the actual `web/package-lock.json` uses lockfile version **3**. These old and new version expectations need to be checked together. Do not change versions just because one is newer.

Sources: [BK-01 baseline](BASELINE.md), [web package.json](../workspace/touchtable/web/package.json), [web Dockerfile](../workspace/touchtable/web/Dockerfile), [web package-lock.json](../workspace/touchtable/web/package-lock.json).

## 3. Python dependencies

The root [`requirements.txt`](../requirements.txt) lists these packages:

```text
astral==1.10.1
beautifulsoup4
Eve
Flask
Flask-HTTPAuth
flask-cors
numpy
pandas
pymodbus
python-dateutil
pytz
pyzmq
requests
zmq
```

Only `astral` has an exact version here. The other entries do not have pinned versions, so installs at different times may resolve different versions.

There are both `pyzmq` and `zmq` entries. I need to check whether both are necessary in this project; I should not remove either without testing. Packages such as `numpy`, `pandas`, `pymodbus` and the ZeroMQ-related packages need extra attention when checking Python and operating-system compatibility.

**Observed in BK-01:** A Python 3.12 virtual environment was created. Setup initially hit a Python 3.13 environment error and a package-download timeout. These are local setup observations, not proof that Python 3.13 is unsupported.

**Still needed:** Record the actual installed package versions with `python -m pip freeze` and check whether a fresh `pip install -r requirements.txt` works.

## 4. Node.js dependencies

The active [`workspace/touchtable/web/package.json`](../workspace/touchtable/web/package.json) lists:

| Package | Version range in source | Used for |
| --- | --- | --- |
| `body-parser` | `^1.19.0` | Read request bodies |
| `cors` | `^2.8.5` | Configure browser cross-origin requests |
| `express` | `^4.17.1` | Web server and routes |
| `request` | `^2.88.0` | Send HTTP commands to DEMKit |
| `socket.io` | `^2.2.0` | Communicate with the browser |

The `package-lock.json` is present and should be used for repeatable installs with `npm ci`. The `request` library and the older Socket.IO stack deserve a later maintenance check, but replacing them is **not** part of this audit. The separate copy under `demkittt/touchtable-code/web/` is older project material, not the web folder used by the current Windows startup.

**Still needed:** Verify a fresh `npm ci` and record whether there are installation or runtime warnings. We already found an error-handling problem with failed DEMKit requests in [Bug #12](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/12), which remains a separate fix.

## 5. Hardcoded paths and settings

| File | What I found | Why it matters |
| --- | --- | --- |
| [`workspace/touchtable/touchtafel.bat`](../workspace/touchtable/touchtafel.bat) | Uses `C:\Saxion_internship\Touchtable\...` and waits a fixed **30 seconds** | Won't work from my checkout path without editing; delay does not check whether Python is ready |
| [`demkittt/conf/usrconf.example.py`](../demkittt/conf/usrconf.example.py) | Four path settings refer to `C:/Saxion_internship/github_handover/microgrid-touchtable/` | Each new computer needs its own local paths |
| `demkittt/conf/usrconf.py` | Local configuration copied from the template (ignored by Git) | Keep personal paths and any credentials out of commits |
| [`web/example.env`](../workspace/touchtable/web/example.env) | Has `DEM_HOST=localhost` and `DEM_IP=3001` | `DEM_IP` does not match the port variable used by the current server |
| [`web/index.js`](../workspace/touchtable/web/index.js) | Reads `DEM_HOST` and **`DEM_PORT`** | Change the example to `DEM_PORT=3001` in BK-05, after checking the startup path |
| [`demkittt/docker-compose.yml`](../demkittt/docker-compose.yml) | Has old `/home/<username>/...` mounts and separate database/Grafana services | Historical Docker workflow is not verified as an alternative to the working Windows setup |

In my local checkout the path contains spaces:

`D:\Saxion Programme\Demkit-simulation app\touchtable-tool`

The future startup script should support this without requiring me to edit its source for every computer.

**Small documentation mismatch:** The example configuration says to rename it to `userconf.py`, but the current development guide uses `usrconf.py`. We should make the template instructions consistent with the real loader.

## 6. Ports and communication

| Service | Port | Source or setting |
| --- | --- | --- |
| Python DEMKit API | **3001** | `PushHost` in [`demkittt/components/hosts/touchtable/pushHost.py`](../demkittt/components/hosts/touchtable/pushHost.py) |
| Node.js web server | **3002** | `PORT` environment variable or default in `web/index.js` |
| Node.js → DEMKit | Default `localhost:3001` | `DEM_HOST` / `DEM_PORT` in `web/index.js` |
| DEMKit → Node.js state updates | Default `http://localhost:3002` | `PushHost.clients` in `pushHost.py` |
| InfluxDB, if enabled | **8086** | `usrconf.example.py`; logging is outside this assignment for now |

The original Python host listens on `0.0.0.0` by default. For a later packaging task, we should review whether the services need to be accessible outside the local computer.

**Known failure:** T-11 showed that stopping Python caused Node.js to crash rather than handle the connection error. That is tracked in [Bug #12](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/12).

## 7. Required simulation data

These files are already present in the active model folder:

| Data | Repository path | Where it is used |
| --- | --- | --- |
| Base electricity demand | `workspace/touchtable/model/alpg/output/demo/Electricity_Profile.csv` | `model/house/baseload.py` |
| Heat demand | `workspace/touchtable/model/alpg/output/demo/Heat_Profile.csv` | Heat pump settings in `web/index.js` |
| Temperature | `workspace/touchtable/model/data/weather/temperature.csv` | `model/environment/global.py` |
| Sun/solar irradiation | `workspace/touchtable/model/data/weather/solarirradiation.csv` | `model/environment/global.py` |

The current model uses relative paths to find the data. They must be included when launching or packaging the program. The inherited [model README](../workspace/touchtable/model/README.txt) also describes how ALPG profiles can be generated, but **regenerating profiles is not needed just to test this existing data**.

The simulation settings specify six houses and a 900-second (15-minute) simulation time step in [`settings_demostreet.py`](../workspace/touchtable/model/settings/settings_demostreet.py).

## 8. InfluxDB and platform limitations

- The simulator has printed `[InfluxDB] Could not connect to database` warnings while the web interface was able to run. This does **not** prove data is being stored correctly.
- The current assignment does not require InfluxDB integration. [BK-06](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/8) will look at making logging optional safely.
- The current Windows `.bat` launcher cannot run directly on macOS or Linux.
- The template also contains Linux-specific socket paths (`ipc:///home/user/python/`) and a USB device path (`/dev/ttyACM0`), but these are inherited settings and their use in this particular demo has not been verified.
- Neither macOS nor Linux has passed a clean installation test. I should not advertise them as supported yet.

## 9. Main findings and what to do next

| Priority | Finding | Follow-up |
| --- | --- | --- |
| High | Startup uses old absolute paths and a fixed 30-second wait | **BK-05:** portable configuration; **BK-07/BK-08:** launcher and readiness checks |
| High | Node/npm version declarations do not match tested versions | Check supported versions before changing manifests |
| High | `example.env` uses `DEM_IP` but Node.js expects `DEM_PORT` | **BK-05:** correct and document the settings |
| High | Data files depend on the model's working directory | **BK-05/BK-07:** ensure data paths work after moving the project |
| High | Node.js crashes when DEMKit is unavailable | **Bug #12:** separate fix and retest |
| Medium | Python dependencies are mostly unpinned; `pyzmq` and `zmq` both appear | Investigate versions and the actual imports before changing |
| Medium | Old Docker/OS settings are not verified | Review after the Windows launch is stable |
| Medium | InfluxDB warning appears during startup | **BK-06:** check safe optional logging |

## 10. What I still need to verify locally

These are **not completed checks**. They will help turn this document into a confirmed installation inventory.

From the repository root in PowerShell:

```powershell
git branch --show-current
git status --short
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -m pip freeze
node --version
npm --version
```

Run `npm ci` only when I am ready to check installation again; it can change the local `node_modules` folder. A separate clean virtual environment is better for testing Python installation than replacing my existing working one.

- [x] Listed Python and Node dependencies from the repository
- [x] Recorded the Windows versions used in BK-01
- [x] Checked the launcher, example config, port variables and main data files
- [x] Identified Windows/legacy Docker assumptions and links to follow-up work
- [ ] Confirm current installed Python package versions
- [ ] Repeat a clean install separately from the working environment
- [ ] Review the findings and close BK-04 when agreed

**Next:** Use the findings for BK-05, where I will make the startup configuration easier to use on a different computer, without changing the energy models.
