# Product Backlog — DEMKit Microgrid Simulator

**Created:** 15 October 2026  
**Status:** Proposed backlog; not yet agreed as a release commitment  
**Principle:** Preserve the working simulation first, then make installation reliable, then enhance learning.

## Priorities and states

- **P0 — Must have for the first dependable prototype:** baseline, setup, startup, error handling, core simulation verification.
- **P1 — Should have for classroom distribution:** packaging, portability validation, user guidance and testing.
- **P2 — Could have after the core works:** energy dashboard, lesson workflows, comparisons and polish.
- **Status:** `Proposed`, `Ready`, `In progress`, `Blocked`, `Done`. All entries below start as **Proposed** until the work is agreed and tested.

## Backlog overview

| ID | Priority | Item | Status | Dependencies |
| --- | --- | --- | --- | --- |
| BK-01 | P0 | Record working development baseline | Proposed | — |
| BK-02 | P0 | Protect local configuration and environment files | Proposed | — |
| BK-03 | P0 | Run and document simulation smoke tests | Proposed | BK-01 |
| BK-04 | P0 | Audit runtimes, dependencies and hardcoded paths | Proposed | BK-01 |
| BK-05 | P0 | Refactor machine-specific startup configuration | Proposed | BK-04 |
| BK-06 | P0 | Investigate making InfluxDB logging optional | Proposed | BK-03, BK-04 |
| BK-07 | P0 | Build one-action multi-process launcher | Proposed | BK-05 |
| BK-08 | P0 | Add readiness checks and useful startup diagnostics | Proposed | BK-07 |
| BK-09 | P0 | Ensure clean shutdown and repeatable restart | Proposed | BK-07 |
| BK-23 | P0 | Research and rank student installers for Windows, macOS and Linux | In progress | BK-04; before BK-10–BK-12 |
| BK-10 | P1 | Package and validate a Windows build | Proposed | BK-07–BK-09 |
| BK-11 | P1 | Evaluate macOS packaging and test on supported hardware | Proposed | BK-07–BK-09 |
| BK-12 | P1 | Evaluate Linux packaging and test on supported distribution | Proposed | BK-07–BK-09 |
| BK-13 | P1 | Write teacher and developer installation guides | Proposed | BK-10 |
| BK-14 | P1 | Automate regression and release smoke tests | Proposed | BK-03, BK-07 |
| BK-15 | P1 | Improve visibility and accessibility of energy metrics | Proposed | BK-03 |
| BK-16 | P1 | Gather classroom feedback and define educational acceptance criteria | Proposed | BK-03 |
| BK-17 | P2 | Add live energy charts without mandatory persistence | Proposed | BK-03, BK-16 |
| BK-18 | P2 | Introduce guided lesson challenges and reflection prompts | Proposed | BK-16 |
| BK-19 | P2 | Explain battery control modes in the interface | Proposed | BK-03, BK-16 |
| BK-20 | P2 | Add teacher presets and reset controls | Proposed | BK-03, BK-16 |
| BK-21 | P2 | Compare two scenarios using session data | Proposed | BK-17 |
| BK-22 | P1 | Prepare final release notes, evidence and handover | Proposed | Main release items |

## User stories and acceptance criteria

### BK-01 — Record working development baseline (P0)
**Story:** As a developer, I want a reproducible description of the current working setup, so I can recognise regressions.

**Acceptance criteria:** Record OS, Python, Node, npm, Git commit, startup commands, ports, and known warnings in a baseline report. Distinguish observed behaviour from untested functionality.

### BK-02 — Protect local configuration and environment files (P0)
**Story:** As a contributor, I want machine-specific files ignored by Git, so the shared repository stays portable and safe.

**Acceptance criteria:** `.venv/`, `node_modules/`, local `usrconf.py`, `.env`, secrets, generated models/logs, and caches are ignored; `git status` confirms no credentials or dependency folders are staged.

### BK-03 — Run and document simulation smoke tests (P0)
**Story:** As a developer, I want a baseline test record, so later installation changes do not silently break the lesson.

**Acceptance criteria:** Execute and record tests T-01 through T-12 in [TEST_PLAN.md](../docs/TEST_PLAN.md), including failed or blocked cases and supporting evidence.

### BK-04 — Audit runtimes, dependencies and hardcoded paths (P0)
**Story:** As a maintainer, I want to understand runtime assumptions and version conflicts, so new installations are predictable.

**Acceptance criteria:** Produce a dependency inventory with tested versions and a list of hardcoded paths, ports, required data files, obsolete scripts, and native/platform-specific dependencies.

### BK-05 — Refactor machine-specific startup configuration (P0)
**Story:** As a new developer, I want project-relative configuration, so the same checkout works outside the previous developer's directory.

**Acceptance criteria:** No source edits are required solely to change installation location; paths containing spaces work; secrets stay local; defaults and overrides are documented.

### BK-06 — Investigate making InfluxDB logging optional (P0)
**Story:** As a teacher, I want to run the interactive simulation without setting up a database, so classroom startup is simpler.

**Acceptance criteria:** Map every database-related dependency, implement an optional/no-logging path if safe, and verify that device actions, time and live metrics still work. Do not claim historical storage is functioning; do not remove logging code without testing.

### BK-07 — Build one-action multi-process launcher (P0)
**Story:** As a teacher, I want to open the simulator with one action, so I do not need two terminals.

**Acceptance criteria:** A launcher starts Python DEMKit and Node.js in the correct order using configured paths and opens the browser only after successful startup. No fixed 30-second sleep is used as the sole readiness mechanism.

### BK-08 — Add readiness checks and useful startup diagnostics (P0)
**Story:** As a user, I want understandable error messages, so I know what to fix if the application cannot start.

**Acceptance criteria:** Detect missing runtime/components, ports in use, backend timeout and Node startup failure; produce clear, actionable diagnostics without exposing secrets.

### BK-09 — Ensure clean shutdown and repeatable restart (P0)
**Story:** As a teacher, I want to close and reopen the tool reliably, so lesson time is not lost.

**Acceptance criteria:** Closing the launcher terminates owned child processes, leaves no stale occupied ports, and supports a successful second launch.

### BK-23 — Research student-friendly cross-platform installers (P0)
**Story:** As a student, I want to install and open DEMKit without setting up Python, Node.js or Docker myself.

**Acceptance criteria:** Compare packaging options for Windows, macOS and Linux, rank them against our Python + Node.js architecture, recommend one proof of concept with a fallback, and document limitations such as code signing, platform builds, necessary model data and redistribution permissions. Save the findings in [PACKAGING_TOOL_RESEARCH.md](../docs/PACKAGING_TOOL_RESEARCH.md). **Research does not mean a working installer is finished.**

**Tracking:** [GitHub issue #15](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/15). This happens before BK-10, BK-11 and BK-12.

### BK-10 — Package and validate a Windows build (P1)
**Story:** As a Windows teacher, I want a straightforward install or portable build, so I do not manually install Python and Node.

**Acceptance criteria:** Document the chosen packaging approach and dependencies; deliver a tested clean-machine installation and uninstallation/portable removal path; preserve license notices.

### BK-11 — Evaluate macOS packaging (P1)
**Story:** As a macOS user, I want access to the same lesson, so I can use the tool on my computer.

**Acceptance criteria:** Record feasibility, architecture targets (Apple Silicon / Intel as applicable), required adaptations, and results from an actual test machine. Do not advertise macOS support until a real launch test passes.

### BK-12 — Evaluate Linux packaging (P1)
**Story:** As a Linux user, I want a documented way to install and start the simulation.

**Acceptance criteria:** Select a target distribution/architecture, perform clean installation and launch tests, and document compatibility and limitations.

### BK-13 — Write installation and teaching guides (P1)
**Story:** As a first-time teacher or developer, I want clear guidance to start and use the app without help.

**Acceptance criteria:** Provide quick start, controls legend, troubleshooting, reset instructions, and known limitations tested with a new user.

### BK-14 — Automate regression and release smoke tests (P1)
**Story:** As a maintainer, I want automated checks, so changes to launcher, API or UI are less risky.

**Acceptance criteria:** Automated startup/API/browser checks cover critical flows; CI reports pass/fail; simulation-specific manual validations remain documented.

### BK-15 — Improve visibility and accessibility of metrics (P1)
**Story:** As a student, I want clear labels and readable visualisations, so I can connect device choices to grid effects.

**Acceptance criteria:** Labels and units are understandable; text contrast and zoom are reviewed; feedback identifies which house or network metric changed; review with at least one user.

### BK-16 — Gather classroom feedback (P1)
**Story:** As a developer, I want teacher/student feedback, so educational enhancements reflect actual lesson needs.

**Acceptance criteria:** Run a short observation or interview, record the top user problems and learning outcomes, and reprioritise BK-17 through BK-21.

### BK-17 — Live energy charts (P2)
**Story:** As a student, I want live power charts, so I can see the effect of EVs, solar and battery strategies over time.

**Acceptance criteria:** Show demand, generation and relevant grid/battery indicators from live session data; label W/Wh/time; no InfluxDB required; avoid misleading values.

### BK-18 — Guided lesson challenges (P2)
**Story:** As a student, I want an experiment with a clear goal, so I learn why certain configurations increase or reduce grid peaks.

**Acceptance criteria:** At least one teacher-reviewed lesson includes a prediction question, device experiment, observable metrics and reflection prompt.

### BK-19 — Battery-strategy explanations (P2)
**Story:** As a student, I want to understand Solar, Smart and manual modes, so I know why the battery responds as it does.

**Acceptance criteria:** Show the selected mode, current charge, and concise explanations grounded in the actual implemented rules. Verify explanations against simulation behaviour.

### BK-20 — Teacher scenario presets (P2)
**Story:** As a teacher, I want ready-made scenarios and reset controls, so I can repeat demonstrations across classes.

**Acceptance criteria:** Provide at least two reproducible presets, a clear reset action, and tested lesson instructions; define whether reset starts a fresh simulation process.

### BK-21 — Scenario comparison (P2)
**Story:** As a student, I want to compare before/after configurations, so I can judge the trade-offs of my decisions.

**Acceptance criteria:** Compare identical simulation conditions using at least peak grid demand and imported/exported power metrics; clearly state data coverage and any estimation limitations; no persistent database required.

### BK-22 — Final evidence and handover (P1)
**Story:** As a future maintainer, I want a complete handover, so I can continue development after this assignment.

**Acceptance criteria:** Record working versions, install/launch steps, test evidence, supported platforms, unimplemented features, known issues, licenses, and a demo guide.

## Suggested next sprint (choose after supervisor review)

1. BK-01 — Baseline environment and version record.
2. BK-02 — `.gitignore`/configuration hygiene.
3. BK-03 — Core functional smoke tests.
4. BK-04 — Runtime, dependency and hardcoded-path audit.
5. Start BK-05/BK-06 technical investigation once the baseline is stable.

**Release strategy:** Prioritise BK-07 through BK-10 for the first usable distribution. Treat BK-17 through BK-21 as selectable enhancements, not mandatory initial release requirements.
