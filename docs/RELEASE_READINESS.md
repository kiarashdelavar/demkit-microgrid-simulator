# DEMKit — Release Checklist for Windows, macOS and Linux

**Status: planning and internal testing. This is not a public release approval.**

We now have a Windows desktop prototype that runs on the development computer. The other two desktop versions are still planned. Before sharing installers with a class, we need to check the software rights, dependency safety and installation experience. These checks should not be left until the end.

This document is a checklist, **not a claim that the app is legally approved, secure or fully tested**.

## Overview

| Topic | Windows | macOS | Linux |
| --- | --- | --- | --- |
| Desktop package | NSIS `.exe` prototype built and opened locally | `.app` / `.dmg` planned | AppImage or `.deb` planned |
| Clean-computer test | Not done | Not done | Not done |
| Start/stop the services | Tested on one Windows machine | Not done | Not done |
| Installer removal / leftover files | Not done | Not done | Not done |
| Signing / trusted distribution | Not decided | Not decided | Not decided |
| Software licence clearance | **Shared task, not done** | **Shared task, not done** | **Shared task, not done** |
| Dependency and security audit | **Shared task, not done** | **Shared task, not done** | **Shared task, not done** |

Project issues: [Windows #25](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/25), [macOS #31](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/31), [Linux #34](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/34).

## 1. Check licences before sharing installers

**Task: [Licensing #32](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/32)**

The inherited DEMKit code includes a restriction about **non-commercial scientific purposes**. That does not automatically mean we can redistribute compiled copies to everyone.

What I need to do:

- [ ] List the DEMKit code, Touchtable model, web visualizer, Electron, PyInstaller and all bundled Python and npm packages.
- [ ] Record the licence and copyright notice for each part, including anything we must distribute with it.
- [ ] Ask the rights holders/supervisors whether **internal classroom installations** are allowed, and separately whether **public downloads** are allowed.
- [ ] Check use of Saxion/University of Twente names, logos and existing artwork.
- [ ] Preserve the required notices in the Windows, macOS and Linux packages.

**Until this is answered, do not publish the installers on GitHub Releases or distribute them publicly.** A public source repository alone does not grant permission to relicense the inherited application.

## 2. Check security in the shared application

**Task: [Security #33](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/33)**

The inherited Node.js app uses older packages, and earlier local dependency installation showed audit warnings. We need a fresh check, not an assumed number of issues.

What I need to do:

- [ ] Run `npm audit` for the inherited web application and Electron build files.
- [ ] Run a Python package vulnerability audit for the packaged backend.
- [ ] Review which reported dependencies actually ship with the installers; fix or document important findings, and retest the simulation.
- [ ] Ensure Python DEMKit and the Node.js server listen **only on the local computer**, not on the whole school network. Check both ports 3001 and 3002.
- [ ] Check Express/Socket.IO API input validation, local access and CORS settings.
- [ ] Review Electron security settings: sandbox, context isolation, navigation permissions, content security policy and external links.
- [ ] Make sure no developer passwords, `usrconf.py`, private paths or API keys get packed.
- [ ] Pin build dependencies and record package hashes and a dependency list for each release.

Don't run a large automatic dependency upgrade just to remove warnings. Verify what each change does to the inherited game.

## 3. Windows-specific release work

**Task: [BK-10 #25](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/25)**

- [x] Build first Electron/PyInstaller desktop prototype.
- [x] Open it from the Windows desktop and use the simulation.
- [x] Reopen the prototype without starting Python or Node.js in VS Code.
- [ ] Rebuild and check the latest scrolling change in the *installed* application.
- [ ] Install on a clean Windows x64 machine **without Python or Node.js**.
- [ ] Test NSIS uninstall and what happens to the user-data folder.
- [ ] Decide how the app will be distributed, and arrange Windows code signing for releases outside a trusted institutional system.
- [ ] Check Microsoft Defender/SmartScreen and record any warnings; do not instruct students to bypass security checks.
- [ ] Verify the final installed files, publisher name and SHA-256 checksum.

Signing helps identify the publisher, but a new signed Windows app may still get SmartScreen warnings while it builds reputation.

## 4. macOS-specific release work

**Task: [BK-11 #31](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/31)**

- [ ] Choose **Apple Silicon arm64** or **Intel x64** as the first target, depending on available Mac hardware.
- [ ] Build the Python backend on macOS and adapt Electron's Windows-only paths/process cleanup.
- [ ] Create a local `.app` / `.dmg` prototype and test it on a real Mac.
- [ ] Verify install, run, scroll/drag, EV/solar/battery, restart and app removal.
- [ ] Prepare **Developer ID code signing and Apple notarization** before normal distribution outside the Mac App Store.
- [ ] Confirm Gatekeeper behaviour, permissions and where model data and logs are stored.
- [ ] Verify installer/app signature, notarization, release checksum and licence notices.

A macOS build from CI alone is not enough evidence that the app works for a teacher.

## 5. Linux-specific release work

**Task: [BK-12 #34](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/34)**

- [ ] Select a specific Linux test target, for example Ubuntu LTS x86_64.
- [ ] Try **AppImage** for easy use or `.deb` for an Ubuntu installation; choose after testing.
- [ ] Package the Linux Python backend and adapt Electron startup/shutdown.
- [ ] Check Linux executable permissions, desktop integration, system libraries and user-data locations.
- [ ] Test on a clean machine or VM without Python and Node.js installed.
- [ ] Test uninstall/removal and whether any simulation files or cache remain.
- [ ] Choose a trustworthy distribution channel. For direct downloads, publish verified SHA-256 checksums; for an apt repository, plan repository/package signing.
- [ ] Check licence notices, dependency audit and supported Linux versions before release.

An AppImage is convenient, but it is **not automatically sandboxed**.

## 6. A release is ready only when

- [ ] Licence and redistribution questions are resolved (**#32**).
- [ ] Relevant security and dependency issues are reviewed or fixed (**#33**).
- [ ] The package works on a clean computer with the **specified OS and architecture**.
- [ ] The game works: all six houses, scrolling, EV, solar, battery, goals and coins.
- [ ] Closing the app stops both local services; restart works.
- [ ] Uninstall and remaining user-data behavior are documented.
- [ ] Required copyright notices, signatures and/or trusted-distribution checks are in place.
- [ ] A teacher has tried the quick guide, and we know what needs clarification.

**Keep prototypes and public releases separate.** A locally tested version is progress, but it is not the same as approved software for all students.

## References used

- [DEMKit licence notice in our configuration template](../demkittt/conf/usrconf.example.py)
- [Electron security guide](https://www.electronjs.org/docs/latest/tutorial/security/)
- [Microsoft — SmartScreen reputation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- [Microsoft — Windows signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- [Apple — software distribution and notarization](https://developer.apple.com/documentation/technologyoverviews/distribution)
- [electron-builder v26 — target selection](https://www.electron.build/v26/docs/targets/)
- [Windows packaging prototype notes](WINDOWS_INSTALLER_POC.md)

*This is a project planning checklist, not legal advice or a security certification.*
