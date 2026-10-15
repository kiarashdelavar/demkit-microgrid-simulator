# Project Plan — DEMKit Microgrid Simulator

**Status:** Proposed / awaiting prioritisation with project stakeholders  
**Created:** 15 October 2026  
**Focus:** Educational energy-transition simulation, installation, and classroom usability

## 1. Background and problem

The Microgrid Touchtable already lets learners place energy devices in a six-house neighbourhood and observe power demand, solar production, batteries, and grid limitations. The previous developer added a coin budget, learning missions, house feedback, and battery strategies.

The current development workflow is difficult for a teacher or student who is not a software developer: Python and Node dependencies must be installed manually, some paths are hardcoded, two processes must be managed, and error messages are not designed for end users. Compatibility across operating systems is unverified. Before adding many more features, the project needs a dependable baseline and a practical way to launch the application.

## 2. Main project objective

**Make the existing DEMKit-based educational simulator reliable and easier to install, launch, and use in a classroom, while evaluating a focused set of educational improvements.**

Cross-platform availability on **Windows, macOS, and Linux** is an intended outcome that requires feasibility work, platform-specific builds, and testing. It is not an existing guarantee.

## 3. Stakeholders and users

| Group | Need |
| --- | --- |
| Students | Explore energy devices and immediately understand grid effects |
| Teachers | Start the simulator quickly and use ready-to-run teaching activities |
| Project supervisors | Demonstrable technical progress, clear scope, and reproducible results |
| Future developers | Clear architecture, dependency setup, tests, and handover instructions |

Stakeholder priorities and acceptance criteria should be confirmed during the next feedback meeting.

## 4. Scope

### In scope — initial delivery

- Document the inherited architecture, version requirements, model inputs, and known problems.
- Test the current interactions and record reproducible issues.
- Investigate dependency version compatibility and reduce machine-specific configuration.
- Implement a reliable one-action launch process with health checks and helpful failures.
- Make nonessential database logging optional **if technically safe** so classroom simulation does not require configuring InfluxDB.
- Prepare and test an easier-to-distribute Windows build or installer.
- Investigate packaging options and compatibility for macOS and Linux; only claim support after validation.
- Write developer and teacher-facing guidance and collect usability feedback.

### Candidate educational enhancements (select after feedback)

- Clearer house and transformer metrics, labels, and accessible colours.
- Short guided challenges with prediction, experimentation, and reflection.
- Live energy charts based on in-memory simulation updates, without requiring persistent analytics.
- Teacher-selected presets and a reset action.
- Explanation of battery control strategies and scenario comparisons.

### Out of scope for now

- New InfluxDB deployments, persistent result storage, and cloud analytics.
- User accounts, authentication systems, or classroom administration portals.
- Commercial energy optimisation or claims of engineering-grade grid predictions.
- A full redesign of the DEMKit scientific simulation model without validation.
- Large AI features, external energy APIs, and automation that has not been agreed with supervisors.

## 5. Work phases and deliverables

| Phase | Focus | Deliverable |
| --- | --- | --- |
| 0. Baseline | Architecture, environment, functional smoke tests | Baseline report and issues list |
| 1. Startup | Paths, optional logging, readiness, shutdown | Reliable launcher and failure messages |
| 2. Packaging | Windows distribution; feasibility on other operating systems | Tested build(s), installation instructions, compatibility report |
| 3. Educational UX | Teacher/student feedback and selected enhancements | Prioritised usability improvement or learning feature |
| 4. Validation | Automated checks and release documentation | Test evidence, known limitations, handover |

Do not infer fixed dates or a release commitment from this sequence. Priorities can change after research and stakeholder review.

## 6. Quality and acceptance criteria

1. **Startup:** A fresh setup can start both services and reach the browser interface without manually editing machine-specific source paths; failure states are understandable.
2. **Correctness:** Main interactions (play/pause, device changes, batteries, rewards, overloads) have repeatable test outcomes and recorded limitations.
3. **Dependency management:** The validated interpreter/runtime versions and installation steps are documented, and dependency failure conditions are known.
4. **Packaging:** Every claimed supported operating system has a clean-machine install and launch test recorded; an untested build is not called supported.
5. **Classroom suitability:** At least one teacher or target user reviews the startup and learning experience; feedback is documented and reflected in priorities.
6. **Licensing and safety:** Upstream notices remain intact; no machine-specific secrets or environments are committed; distribution permissions are reviewed.

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Legacy Node dependency compatibility | Pin tested versions, explore controlled upgrades, validate core actions |
| InfluxDB assumptions in old model code | Map references and test optional logging instead of deleting integration blindly |
| Hardcoded paths, Windows batch launcher | Use derived paths/config templates and an OS-aware startup process |
| Missing platform-specific hardware/test access | Document feasibility, use available CI where possible, label untested platforms clearly |
| Scope expands into many game features | Deliver installation/reliability work first; limit teaching work to validated use cases |
| Licensing uncertainty | Preserve upstream notices and obtain permission before public distribution |

## 8. Definition of done (per backlog item)

- Acceptance criteria are met and demonstrated.
- Relevant changes are reviewed in a feature branch or pull request.
- Basic regression checks pass; any uncovered gaps are recorded.
- Documentation, usage instructions, and configuration examples are updated where necessary.
- No local credentials, `.venv`, `node_modules`, or generated results are committed.
- The outcome is shown to a supervisor or target user when the item affects classroom use.

## 9. Immediate next steps

1. Establish and document one working Windows baseline (versions, machine, launch steps).
2. Run the functional smoke tests in [TEST_PLAN.md](TEST_PLAN.md).
3. Investigate optional logging and a resilient startup sequence.
4. Build the first launcher prototype before selecting an installer framework.
5. Review the proposed backlog with supervisors and select the first releasable scope.

The tracked task list is in [../backlog/PRODUCT_BACKLOG.md](../backlog/PRODUCT_BACKLOG.md).
