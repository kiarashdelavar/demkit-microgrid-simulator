# BK-23 — Research: Installation tools for Windows, macOS and Linux

**Date:** 18 October 2026  
**Issue:** [#15 — Research packaging tools](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/15)  
**Status:** Research complete; tool choice is a **proposal**, not a tested installer.

## 1. What do I want to build?

I want a student to download DEMKit, open it and use the neighbourhood simulation without first installing Python or Node.js. It should work on **Windows, macOS and Linux**.

The current project is not just a normal web page. It has **Python DEMKit** (energy simulation), a **Node.js server** (connects the app to DEMKit), and the **browser interface**. Any installer must include all three parts, the model's CSV data, and a way to start and stop everything safely.

## 2. My ranking

These scores are **my estimates for this specific assignment**, not benchmark results. I ranked options mainly on ease for students, fit with our current Python + Node project, support for three operating systems and implementation effort.

| Rank | Tools / approach | Score | Good points | Main problem |
| --- | --- | --- | --- | --- |
| **1** | **Electron + electron-builder + PyInstaller** | **8.5/10** | One desktop app; installer formats for all three systems; uses our current web technologies | Larger app; need to integrate and manage the Python process |
| **2** | **PyInstaller + bundled Node.js + small launcher + OS-specific packaging** | **8/10** | Keeps the existing browser UI; fewer UI changes; no runtime installation for students | More separate installer and launcher work across systems |
| **3** | **Tauri + packaged Python/Node sidecars** | **6.5/10** | Desktop app; supports external programs; potentially lighter than Electron | New Rust/Tauri knowledge and more integration work |
| **4** | **Docker Compose / Docker Desktop** | **5/10** | Useful for developers; same container setup on multiple operating systems | Students would need Docker, virtualization and extra setup |
| **5** | **BeeWare Briefcase** | **4/10** | Can package Python apps for different platforms | Our app also needs Node.js and its existing web server; not a direct fit |

### 1st — Electron + electron-builder + PyInstaller

**Electron** could show the current interface in an app window. **electron-builder** can make a Windows `.exe` installer, macOS `.dmg` and Linux `.AppImage` or `.deb`. **PyInstaller** could package DEMKit so a student would not need Python installed. The Electron main process could start and manage a packaged Python backend, while running or integrating our existing Node.js web server. This still needs to be implemented and tested.

**Why first?** I like that there is one main packaging workflow for a desktop app on all three systems. The trade-off is a bigger application and changes to the way we launch the current browser UI.

Official docs: [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model), [electron-builder targets](https://www.electron.build/v26/docs/targets/), [bundling extra executables](https://www.electron.build/v26/docs/contents/), [PyInstaller](https://www.pyinstaller.org/en/stable/).

### 2nd — PyInstaller + bundled Node.js + lightweight launcher

We could keep the simulation at `localhost:3002` in the student's **normal browser**. A small launcher would start packaged Python DEMKit and the Node server, wait until they are ready, and then open the browser. We could include a Node runtime in the distributed application, so students do not install it themselves.

**Why second?** It changes less of the inherited design and may be a good fallback if Electron causes extra work. But Windows, Mac and Linux still need their own packages. Node's single-executable application (SEA) feature is another possibility, but it has build restrictions and needs a separate test with our Node dependencies; I would not rely on it yet.

Official docs: [PyInstaller](https://www.pyinstaller.org/en/stable/), [Node.js single-executable applications](https://nodejs.org/api/single-executable-applications.html).

### 3rd — Tauri with sidecars

Tauri can package desktop apps and include other executables called **sidecars**. This is promising for our Python backend, but it introduces Rust/Tauri tooling and requires a way to bundle or run Node too. For this assignment, I think it would take longer to learn and integrate than Electron.

Official docs: [Tauri external binaries](https://v2.tauri.app/develop/sidecar/), [Tauri distribution](https://v2.tauri.app/distribute/).

### 4th — Docker Compose

We could package the backend and server as containers, but the user would have to install and run Docker Desktop. This needs extra computer setup, and on some systems virtualization. It is useful as a **developer option**, but not my first choice for students who just want to open an energy simulation.

Official docs: [Docker Desktop Windows](https://docs.docker.com/desktop/setup/install/windows-install/), [macOS](https://docs.docker.com/desktop/setup/install/mac-install/), [Linux](https://docs.docker.com/desktop/setup/install/linux/).

### 5th — Briefcase

Briefcase can package Python applications for desktop operating systems. I put it last here because our current application also runs a separate Node.js server. It might be useful for a Python-first application, but it does not solve our current two-server startup by itself.

Official docs: [Briefcase supported platforms](https://briefcase.beeware.org/en/stable/reference/platforms/).

## 3. Which installer should students receive?

| Student uses | Intended download | Note |
| --- | --- | --- |
| **Windows** | `.exe` installer, ideally also a portable version | Start with Windows because the simulator already runs here |
| **macOS** | `.dmg` containing an `.app` | Test Apple Silicon and Intel where possible; signing/notarization must be planned |
| **Linux** | `.AppImage` first; `.deb` for Ubuntu/Debian later | Test on at least one real Linux distribution, not only a successful build |

The packaging tools can create these *formats*, but that does not automatically mean the simulation will run on every device. We will need separate Python builds per operating system because **PyInstaller is not a cross-compiler**. GitHub Actions offers Windows, macOS and Linux runners, which could help with builds. We still need real installation and startup testing.

Sources: [PyInstaller platform note](https://www.pyinstaller.org/en/stable/), [electron-builder formats](https://www.electron.build/v26/docs/targets/), [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

## 4. My suggested decision and first experiment

**Proposed first choice:** Electron + electron-builder with PyInstaller for Python.  
**Fallback:** Keep the browser and use PyInstaller + a bundled Node runtime + a small launcher.

Before committing to Electron, I would make a **small Windows proof of concept**:
1. Package Python DEMKit and include its electricity, heat and weather data.
2. Start the Python simulation and the Node server with one click.
3. Wait for ports `3001` and `3002`, then open the interface.
4. Add an EV and battery, stop the app, and confirm both processes close.
5. Run it on a second Windows computer **without installed Python or Node**.
6. Compare installer size and setup effort with the browser-launcher fallback.

If that works, I would build on macOS and Linux using separate build jobs, then test on those systems. No cross-platform support should be claimed before those tests.

**Important before publishing:** The inherited DEMKit files contain non-commercial/scientific licence notices. We must confirm what redistribution is allowed and preserve upstream notices before distributing installers.

## 5. Where this fits in our backlog

- **BK-23:** This research and ranking (now).
- **BK-05:** Fix machine-specific paths.
- **BK-07–09:** One-click startup, readiness/error checks and shutdown.
- **BK-10:** Build and test the **Windows** installer.
- **BK-11:** Build and test the **macOS** package.
- **BK-12:** Build and test the **Linux** package.
- **BK-13:** Write simple student/teacher installation instructions.

**Conclusion:** I would **try Electron first**, not permanently choose it yet. A working prototype matters more than a high ranking on paper.
