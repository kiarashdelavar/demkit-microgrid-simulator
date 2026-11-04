# DEMKit security audit — first pass

**Date:** 4 November 2026  
**Status:** Initial source review and local-audit tooling; **not a security clearance**.

I checked the source code currently used by the Electron/PyInstaller Windows prototype. This first pass is meant to identify problems before we put an installer on another student's computer. We have **not yet** run a live penetration test, a clean-machine scan, or a fresh online dependency audit.

This report belongs to [security Issue #33](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/33). Licence/redistribution permission is separately tracked in [Issue #32](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/32).

## What I found in the source

| Finding | What I saw | Priority | Status |
| --- | --- | --- | --- |
| Backend API exposed on all network interfaces | `demkittt/components/api/eveApi.py` called `self.app.run(..., host='0.0.0.0')`. The API has routes to modify and create model objects. | **High** | **Mitigation implemented in this branch; Windows test pending** |
| Node.js network binding | The web app previously used `http.listen(PORT, WEB_HOST || undefined)`, allowing a non-local listener when no host is configured. | **High** | Default changed to `127.0.0.1`; runtime test pending |
| API operations without visible authentication | DEMKit provides routes such as `/syncset`, `/createobjp`, `/synccmds`; the code reviewed does not show authentication checks before these actions. | **High** | **Open** — local-only binding is not authentication |
| Browser requests from other origins | The Node app calls `app.use(cors())` without an origin allowlist. Socket.IO accepts connections without an origin/authentication check in the reviewed handler. | **High / investigate** | **Open** — test exploitability locally before deciding enforcement |
| Browser can change state through GET routes | Several DEMKit routes change the simulation on GET, e.g. `/syncset/.../...`. | **Medium / high** | **Open** — review request method, CSRF, origin/authentication |
| Electron renderer safeguards | `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and denial of new windows are present. | Positive | Confirmed in source; runtime review still needed |
| Electron content security policy and permissions | No explicit CSP or permission-request handler in the reviewed Electron code. The UI is a local HTTP page with inline style attributes and legacy JavaScript, so CSP must be tested carefully. | Medium | **Open** |
| Web dependencies are old | Inherited web manifest contains Express 4, Socket.IO 2, and deprecated `request@2.88.0`. Earlier local npm installation reported vulnerabilities. | **Audit required** | **Open** — previous count is historical; no fresh 2026-11-04 audit run |
| Python dependencies not fully pinned | `requirements.txt` pins `astral` but leaves many other dependencies unpinned; the local Windows environment had newer versions installed. | Medium | **Open** — compare exact packed versions |
| Electron build lockfile absent from Git | `packaging/windows/electron/package-lock.json` is not in `main`; the builder uses `npm install` if no local lockfile exists. | Medium / build reproducibility | **Open** — create and review a pinned build lockfile |
| Local configuration | Builder excludes the developer's ignored `usrconf.py` and stages a new config copied from the example; packaging test already checks this behavior. | Positive | Static code/test evidence only; inspect final installed files |

**Important:** If the application is reachable on the LAN while its write APIs have no authentication, another device on that network may be able to change simulation state. This is a risk inferred from the code, not a claim of an observed attack.

## Small code change prepared now

The first mitigation is deliberately narrow:

- Python DEMKit's REST API now defaults to **`127.0.0.1`** instead of **`0.0.0.0`**.
- The Node server also defaults to **`127.0.0.1`**.
- The Windows Electron launcher explicitly sets `DEMKIT_API_HOST=127.0.0.1`.
- The one-action development launcher sets local defaults for both services.
- A supervised networked installation may explicitly set `DEMKIT_API_HOST` or `WEB_HOST` to a different bind address. **Do not use `0.0.0.0` for a student distribution without designing authentication and reviewing network access first.**

This avoids a dangerous default while keeping a configurable path for later classroom installations. The app still uses the existing simulation code and ports **3001/3002**.

**Not fixed by this change:** malicious requests from software or webpages already running on the *same* computer, permissive CORS, unauthenticated Socket.IO and Python commands, or dependency vulnerabilities. Loopback is only one layer of protection.

## How to run the first audit locally (Windows)

From the repository root in PowerShell, with the existing `.venv`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_security_bindings.py"
.\scripts\run_security_audit.ps1
```

The script tries read-only `npm audit --json` for the inherited web app and Electron build setup, plus `pip-audit` for the installed Python environment. It does **not** upgrade anything.

If Python reports `No module named pip_audit`, first install the **audit utility** in the local development virtual environment:

```powershell
.\.venv\Scripts\python.exe -m pip install pip-audit
.\scripts\run_security_audit.ps1
```

Results are saved under **`security-audit-local/`**, which is ignored by Git. Review files for internal paths or details before sharing. If `npm audit` or `pip-audit` exits with code 1, that may indicate advisories, **not** that the script itself made changes. Other error codes or invalid JSON can indicate network/tool problems.

An Electron build audit cannot be reproducible until its missing `package-lock.json` is reviewed and committed. The script will report that separately instead of inventing an audit result.

### Confirm actual listening addresses

After starting the new development launcher, run:

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in 3001,3002 } |
    Select-Object LocalAddress,LocalPort,OwningProcess
```

For local desktop use, both listeners should show **`127.0.0.1`** (not `0.0.0.0` or `::`). Confirm the six-house simulation, EV/solar/battery purchases, goals and coins still work, then shut down and reopen.

A local-only listener is not proof of overall safety. We still need endpoint authorization, input validation, origin restrictions, and review of what the desktop app can read/write.

## Local dependency-audit results — 4 November 2026

The developer ran `scripts/run_security_audit.ps1` successfully on their Windows development machine after installing `pip-audit`. These numbers are copied from the terminal output; the detailed JSON reports have **not** yet been reviewed by the project team.

| Environment | Critical | High | Moderate | Low | Other / unspecified | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Inherited web application, `workspace/touchtable/web` | **8** | **7** | 5 | 4 | 0 | **24** |
| Electron *build* environment, `packaging/windows/electron` | 0 | 0 | **6** | 0 | 0 | **6** |
| Installed Python `.venv` (`pip-audit`) | — | — | — | — | **2 advisories in one installed package** | **2** |

**Web packages named in the terminal's top-12 critical/high summary:** `body-parser`, `engine.io`, `engine.io-client`, `express`, `form-data`, `json-schema`, `jsprim`, `path-to-regexp`, `proxy-addr`, `qs`, `request`, `socket.io`. This list is truncated to the first 12; it is *not* an exhaustive advisory list.

There are **32 reported audit findings in total** (24 + 6 + 2), but that does not mean 32 independently exploitable security flaws. npm's package-based counts and pip-audit's advisory count are different measures, and several affected packages may be linked through shared dependencies. The actual shipped runtime/build-only reachability must be checked before prioritizing individual fixes.

**Not known from this terminal summary:** exact installed versions, npm advisory/GHSA IDs and affected dependency paths, whether each report entry has a non-breaking fix, the Python package name/advisory IDs, and which Electron entries are build-time only. No dependency fixes have been applied.

The JSON reports are local-only in `security-audit-local/`. Next review the relevant metadata without committing raw environment details:

- `web-npm-audit.json`: critical/high packages, whether direct or transitive, advisory links, and `fixAvailable`.
- `electron-build-npm-audit.json`: six moderate entries, installed versions and whether present in the **distributed** app or only packaging workflow.
- `python-pip-audit.json`: the single affected package, installed version, two advisory IDs and suggested fixed versions.

**Release decision unchanged:** Windows/macOS/Linux installers should not be shared with students until relevant high-risk runtime findings, local HTTP/Socket.IO access and redistribution rights are resolved. The new loopback binding is only a first mitigation.

## Next security steps

1. **Capture actual package findings.** Record dependency names, versions, advisories, severity, fix candidates, and whether each package is inside the shipped installer. Do not use historical vulnerability counts as current evidence.
2. **Review local API access.** Decide how to secure the Electron-to-Node and Node-to-Python links. Evaluate a per-session secret and validation of Socket.IO/HTTP requests, including cross-origin access.
3. **Reduce unnecessary access.** Restrict CORS/Socket.IO origins and update unsafe mutation routes; test regular play and any teacher/second-screen workflow.
4. **Harden Electron carefully.** Add an appropriate CSP and permission handling without breaking the existing game scripts or drag-and-drop controls.
5. **Reproduce builds.** Commit reviewed lockfiles/versions and track any bundled licences and security fixes.
6. **Run clean-machine and OS-specific tests.** Repeat on Windows, macOS and Linux before any platform release.

## Release decision

**Not approved for public/student distribution yet.** This first pass contains at least two high-priority open areas (unauthenticated state changes and dependency/third-party review). The first fix needs user testing on Windows before its PR can be merged. Licence permission remains a separate release blocker.

## Reference material

- [Electron's security checklist](https://www.electronjs.org/docs/latest/tutorial/security/)
- [npm audit documentation](https://docs.npmjs.com/cli/commands/npm-audit/)
- [pip-audit documentation](https://github.com/pypa/pip-audit)
- [Flask host binding documentation](https://flask.palletsprojects.com/en/stable/api/)
