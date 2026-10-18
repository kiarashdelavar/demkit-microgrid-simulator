# BK-04 — Dependency and Configuration Audit

**Date:** 18 October 2026  
**Related task:** [BK-04 / Issue #6](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/6)  
**Status:** Audit completed — source files and local installed package versions recorded; a clean setup on another computer has not been tested

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

### Installed packages on my development laptop

I checked the project virtual environment on **18 October 2026** using:

```powershell
.\.venv\Scripts\python.exe -m pip list
.\.venv\Scripts\python.exe -m pip --version
.\.venv\Scripts\python.exe -c "import sys; print(sys.executable)"
```

The output confirmed **pip 26.2.1 (Python 3.12)** and that the interpreter is inside the project's `.venv\Scripts\python.exe` folder. The Python 3.12.10 patch version comes from the earlier BK-01 baseline, rather than this command output.

All packages listed in the root `requirements.txt` were present in the environment:

| Direct requirement | Version actually installed |
| --- | --- |
| `astral` | `1.10.1` |
| `beautifulsoup4` | `4.15.0` |
| `Eve` | `2.3.1` |
| `Flask` | `3.1.3` |
| `Flask-HTTPAuth` | `4.8.1` |
| `flask-cors` | `6.0.5` |
| `numpy` | `2.5.4` |
| `pandas` | `3.0.6` |
| `pymodbus` | `3.16.1` |
| `python-dateutil` | `2.9.0.post0` |
| `pytz` | `2026.5` |
| `pyzmq` | `27.2.0` |
| `requests` | `2.34.2` |
| `zmq` | `0.0.0` |

Other packages shown by `pip list` were: `blinker 1.9.0`, `Cerberus 1.3.8`, `certifi 2026.7.22`, `charset-normalizer 3.5.2`, `click 8.5.0`, `dnspython 2.9.0`, `Events 0.3`, `idna 3.20`, `itsdangerous 2.2.0`, `Jinja2 3.1.6`, `MarkupSafe 3.0.4`, `pip 26.2.1`, `pymongo 4.19.0`, `simplejson 3.20.2`, `six 1.17.0`, `soupsieve 3.0.3`, `typing_extensions 4.16.0`, `tzdata 2026.5`, `urllib3 2.8.0`, and `Werkzeug 3.1.9`. They are not explicitly listed as direct requirements in the root file; some may have been installed as dependencies of other packages. I have not checked why each one is present.

**What this confirms:** the packages are installed in the existing working virtual environment. **It does not confirm** that every version is compatible with a clean installation or with macOS/Linux. I should not update or pin the requirements just from this list.

**Still to test separately:** A fresh `pip install -r requirements.txt` in an isolated virtual environment, without changing the current working `.venv`.

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

## 10. Audit checklist and later verification

- [x] Listed the Python and Node dependencies from the repository.
- [x] Recorded the Windows, Python, Node.js and npm versions used in BK-01.
- [x] Confirmed installed Python packages with `pip list` in the project `.venv` on 18 October 2026.
- [x] Checked the launcher, example configuration, port variables and required input files.
- [x] Documented Windows/older Docker assumptions and the differences between the declared and tested versions.
- [x] Linked the confirmed Node.js crash to Bug #12, without changing the application code.

### Still not verified (future work)

- [ ] Fresh Python installation with `pip install -r requirements.txt` in a separate environment.
- [ ] Fresh Node.js installation with `npm ci`.
- [ ] Launch on a different Windows computer, and later macOS/Linux.
- [ ] Compatibility of the legacy Docker workflow and older runtime declarations.

These are **compatibility and setup tests**, not missing results I should mark as passed. They can be picked up in the portable setup/launcher and packaging tasks. I must not change or delete the current working `.venv` to run them.

### Local Git note

When I checked the environment, my local branch was `fix/node-backend-error-handling`, and `workspace/touchtable/web/index.js` had uncommitted changes for [Bug #12](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/12). This audit was written on a separate GitHub documentation branch, so it does not include or overwrite that unfinished fix.

**BK-04 conclusion:** I have documented the current dependencies and the main configuration problems well enough to plan the next changes. Next is [BK-05](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/7): make paths and startup configuration portable without changing the energy models.
