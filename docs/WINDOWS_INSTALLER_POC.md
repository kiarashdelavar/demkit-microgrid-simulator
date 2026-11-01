# Windows installer — first prototype

**Status: prototype source code prepared; not built or tested yet.**

This is my first experiment with **Electron, electron-builder and PyInstaller**, based on the earlier installer research. I want students to open the neighbourhood simulation without installing Python and Node.js themselves.

## What the prototype does

- PyInstaller builds the existing Python DEMKit backend into a Windows executable.
- The package includes the DEMKit components, model, input data and inherited licence notices.
- Electron has its own Node.js runtime. It starts our existing Express/Socket.IO web server.
- Electron waits for the Python backend on port **3001** and the web interface on port **3002** before opening the simulation.
- Because an installed folder may be read-only, a writable runtime copy is prepared in the user's application data folder.
- Closing the Electron window should stop the web server and the owned Python backend. This must be verified.

**A successful build does not prove that the simulation works on a clean Windows computer.**

## Before I build

Use Windows x64 with the project working in the development setup, Python 3.12, and Node.js/npm. These tools are needed on the **build computer**, but should not be needed by students using the finished installer.

From the BK-10 branch, in the repository root:

~~~powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd workspace\touchtable\web
npm ci
cd ..\..\..
.\.venv\Scripts\python.exe -m pip install "pyinstaller>=6.22,<7"
~~~

Run the simple packaging checks first:

~~~powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_windows_packaging.py"
~~~

## Build the Windows prototype

Stop any old Python and Node.js DEMKit servers. Then, from the project root:

~~~powershell
.\.venv\Scripts\python.exe .\scripts\build_windows_prototype.py
~~~

The script prepares the backend, includes the model and web files with a **fresh example configuration**, installs the Electron build dependencies locally, and asks electron-builder to make an NSIS Windows installer.

The expected output folder is:

    packaging/windows/dist/

We **do not yet know** the final filename, size or whether it will work. Record the first build error rather than upgrading unrelated packages.

The current prototype targets **Windows x64 only**.

## How I will test it

1. Confirm the installer builds and record its size.
2. Install it on Windows, but **do not share the installer**.
3. Start the desktop app and confirm the six-house interface appears.
4. Start the simulation; add an EV charger, solar panel and battery.
5. Check coin balance, slots and energy values.
6. Close the application, then confirm ports 3001 and 3002 are no longer listening.
7. Open it again twice, checking for old processes and EADDRINUSE errors.
8. Test uninstall. The user-data runtime copy may remain after uninstall.
9. Repeat on a **clean Windows computer without Python and Node.js installed**. This is required before calling the installer ready.

If PyInstaller misses a dynamic Python dependency, record the error and fix the packaging setup. Do not change the DEMKit model just to make packaging pass.

## Important limitations

- **Licensing:** The inherited DEMKit code has non-commercial/scientific-use notices. We need permission from the rights holders before distributing the binaries. Keep the inherited licence documents with the files.
- **Dependency security:** The original Node dependencies previously showed several npm audit vulnerabilities; we still need to review these before release.
- **Unsigned app:** Windows may warn about an unknown publisher. Code signing and trustworthy distribution are not ready yet. Do not ask students to bypass warnings.
- **Writable runtime:** A model copy is stored in a versioned user-data directory. An uninstall may leave it behind; inspect it before deleting anything.
- **InfluxDB:** Logging integration is still postponed, not an installer requirement.
- **Other platforms:** macOS and Linux need their own builds and tests.

## Changed files

- packaging/windows/backend_entry.py — starts DEMKit from the packaged runtime.
- scripts/build_windows_prototype.py — stages and builds the Windows package.
- packaging/windows/electron/main.js — desktop window and process management.
- packaging/windows/electron/package.json — Electron build settings.
- tests/test_windows_packaging.py — staging and privacy checks.
- workspace/touchtable/web/index.js — exposes the web server to the Electron lifecycle.

If Electron turns out to be difficult or too large, our fallback is packaged Python with a bundled Node runtime and the existing browser-based launcher.
