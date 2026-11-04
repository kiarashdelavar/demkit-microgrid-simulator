# DEMKit — Quick Start for the Next Developer

**Status: handover for the current development prototype.**

This project has two ways to run DEMKit on Windows: the Python/Node.js developer launcher, and the **internal Electron installer prototype**. The installer source has been merged into `main`, but **release testing is not finished**.

## Find the project

- Repository: https://github.com/kiarashdelavar/demkit-microgrid-simulator
- Technical setup: [Configuration guide](CONFIGURATION_GUIDE.md)
- Architecture: [System architecture](ARCHITECTURE.md)
- Windows packaging: [Installer build and test guide](WINDOWS_INSTALLER_POC.md)
- Prior tests: [Sprint 1 test results](TEST_RESULTS_SPRINT1.md)
- Backlog: [Product backlog](../backlog/PRODUCT_BACKLOG.md)

## Run the development version on Windows

From the repository root, with **Python 3.12**, Node.js and the project dependencies already installed:

1. Follow the [configuration guide](CONFIGURATION_GUIDE.md) to create `.venv`, install `requirements.txt`, install `workspace/touchtable/web` dependencies, and copy the portable example config to `demkittt/conf/usrconf.py`.
2. Close old DEMKit servers using ports **3001** and **3002**.
3. Start both processes with:

   ```powershell
   .\workspace\touchtable\touchtafel.bat
   ```

4. The launcher checks the backend and web server, then opens `http://localhost:3002`.
5. Press `Ctrl+C` in the launcher terminal to stop the processes.

To check prerequisites without starting the app:

```powershell
.\.venv\Scripts\python.exe .\scripts\launch_demkit.py --check
```

Run the launcher tests:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_launcher.py"
```

## Build the internal Windows prototype

This is a **developer-only build**; don't publish the result.

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_windows_packaging.py"
.\.venv\Scripts\python.exe .\scripts\build_windows_prototype.py
```

Read [the full build guide](WINDOWS_INSTALLER_POC.md) before using these commands. The packaged backend is made with PyInstaller; Electron contains a Node.js runtime and displays the existing browser game.

The builder writes the output under `packaging/windows/dist/`. The installer was confirmed to work on the original Windows development computer, including reopening from the desktop shortcut and interacting with devices. **That does not establish that it works on a clean computer.**

## What needs to be tested next

- **BK-10:** clean Windows x64 computer or VM **without Python/Node.js installed**; startup, devices, shutdown, uninstall, and remaining application data.
- **BK-10:** review third-party licences/redistribution permission, inherited web dependencies and signing before student distribution.
- **BK-11 and BK-12:** investigate and validate macOS and Linux separately; the Windows `.exe` does not work there.
- **BK-13:** ask a teacher/first-time user to follow the [teacher guide](TEACHER_QUICK_START.md) and collect feedback.

The simulation has a fixed 1920 × 1080 coordinate system. A scrolling change was tested and merged, but an already-installed application only receives that change after rebuilding and reinstalling the desktop package.

## Known issues / practical limits

- InfluxDB logging is **postponed**; legacy connection warnings may appear even while the game works.
- The model dynamically loads Python components. The first frozen build failed because `components.*` could not be imported; the packaging entry now adds the correct parent directory to `sys.path`.
- If the frozen backend stops before startup, read the error log path from Electron's dialog or run the packaged backend directly as described in the Windows packaging guide.
- If an old port stays occupied, first identify it. Do **not** kill every Python or Node.js process on the user's computer.
- The inherited game does not model all real-world conditions, costs or unequal access to energy technology.
- Whether progress survives a full application restart is **not a guaranteed feature**.

## Before handing over

Run the full simulation, make sure EV, solar and battery interactions work, and add a short note to the relevant GitHub issue describing the environment, what was tested and any actual errors. Never commit `demkittt/conf/usrconf.py`, credentials, built binaries or user-data folders.

**Project scope:** Make the existing simulator easier to install and teach with. Keep the energy engine unchanged unless a specific, verified bug requires it.
