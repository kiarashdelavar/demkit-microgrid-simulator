# Educational Feature Ideas — DEMKit Microgrid Simulator

**Date:** 15 October 2026  
**Status:** Research-informed proposals, **not** implemented features or approved commitments  
**Purpose:** Candidate enhancements to review with teachers, students, and supervisors before prioritising development.  
**Constraint:** Do not require InfluxDB, accounts, or cloud connectivity for the first classroom release. All metrics must be validated against DEMKit outputs.

## Existing baseline: build on these, don't duplicate them

According to `HANDOVER.md`, the existing application already provides a six-house simulation, drag-and-drop energy devices, seven learning goals, a coin budget and rewards, house feedback and overload warnings, solar generation, EV chargers, batteries, and Solar/Smart/manual battery controls. The enhancements below extend these features instead of incorrectly claiming they are missing.

## Feature catalogue

**Priority convention:** `E1` = strongest classroom candidate *after basic reliability and installation*; `E2` = next iteration; `E3` = advanced research/long-term. These are **proposals**, distinct from engineering backlog P0/P1/P2 priorities. Effort is approximate (`S`, `M`, `L`) and must be refined after a spike.

| ID | Feature | Priority | Effort | Value to students or teachers |
| --- | --- | --- | --- | --- |
| ED-01 | Live energy dashboard | E1 | M | Watch demand, solar, battery charge and grid import/export across simulated time. |
| ED-02 | Grid congestion heatmap | E1 | M | See which cables and homes are closest to overload and why. |
| ED-03 | Explain-why event cards | E1 | M | Understand causes when a number, warning or battery state changes. |
| ED-04 | Battery strategy explorer | E1 | S–M | Compare Solar, Smart and manual actions with visible state of charge and rules. |
| ED-05 | Teacher lesson presets | E1 | M | Start a predictable scenario with one click, reset it between classes. |
| ED-06 | Save-and-compare scenarios | E1 | M–L | Compare peak demand and energy use under identical model conditions. |
| ED-07 | Predict–experiment–explain worksheet | E1 | S | Promote scientific reasoning rather than only collecting coins. |
| ED-08 | Classroom-friendly UX and accessibility | E1 | M | Projector mode, readable numbers/units, legends, keyboard help and accessible colors. |
| ED-09 | Offline local session report | E1 | M | Export a graph, scenario settings, key outcomes and student reflection without a DB. |
| ED-10 | Guided onboarding and glossary | E1 | S | Explain kW/kWh, import/export, transformer, peak load and device interactions. |
| ED-11 | Grid Operator Challenge | E2 | M | Balance EV demand and limited transformer capacity under a budget. |
| ED-12 | Dynamic electricity price laboratory | E2 | M–L | Explore low-cost charging vs congestion, using clearly labelled example tariffs. |
| ED-13 | Flexible EV charging scheduler | E2 | L | Shift charging periods to investigate peak-demand reduction. |
| ED-14 | Net-aware battery strategy lab | E2 | L | Test whether price-led battery behavior helps or harms a local grid. |
| ED-15 | Weather and seasons controls | E2 | M–L | Compare sunny/cloudy days or winter/summer scenarios with validated input data. |
| ED-16 | What-if sliders | E2 | L | Change PV, storage, transformer limits and demand to explore causality. |
| ED-17 | Interactive replay and event timeline | E2 | L | Revisit overloads and battery choices with consistent time-labelled session data. |
| ED-18 | Learning modes and rule-based hints | E2 | M | Give beginners optional explanations while preserving open exploration. |
| ED-19 | Multi-objective scorecard | E2 | M | Balance grid peaks, budget, renewable self-consumption and resilience. |
| ED-20 | Realistic Netherlands classroom cases | E2 | M | Learn from simplified EV peak, sunny-street, and neighbourhood-battery examples. |
| ED-21 | Energy-flow animation | E2 | M | Visually trace power moving between houses, PV, storage and the grid. |
| ED-22 | Teacher scenario editor | E2 | L | Customize starting devices, challenge rules, budget, and educational goals. |
| ED-23 | Neighbourhood shared battery lab | E3 | L | Compare individual home batteries with a shared storage installation. Requires model validation. |
| ED-24 | Blackout and islanding resilience | E3 | L | Explore critical loads during outages; requires verified new power-system model behavior. |
| ED-25 | Vehicle-to-grid (V2G) exercise | E3 | L | Investigate EVs returning electricity to a neighbourhood; requires backend modelling. |
| ED-26 | Role-based team challenge | E3 | L | Students act as residents, grid operator and municipality with conflicting interests. |
| ED-27 | Heat pump and demand-flexibility lab | E3 | L | Investigate winter peaks and heating load shifts, after checking supported models. |

## Recommended first three educational enhancements

### ED-01 — Live energy dashboard
**User story:** As a student, I want to see demand, solar output, battery state of charge, and grid load change over time, so I can connect my decisions to energy-system behavior.

**Initial acceptance criteria:**
- Show a live session chart with a simulation-time axis (not wall-clock time).
- Label quantities and units correctly: power in W/kW, energy and battery capacity in Wh/kWh, current in A.
- Display only metrics supported by actual DEMKit state; clearly mark missing values.
- Keep an in-memory time series for the open session; no InfluxDB requirement.
- Include at least one test showing the chart changes when an EV or solar panel is added.

### ED-05 — Teacher lesson presets
**User story:** As a teacher, I want to load a tested lesson scenario quickly, so I can start an exercise without configuring the whole neighbourhood.

**Initial acceptance criteria:**
- Three sample presets: **EV evening peak**, **Sunny midday street**, and **Battery control experiment**.
- Define initial device configuration, learning goal, budget and simulation-input assumptions for each preset.
- Reset starts a fresh reproducible scenario and clears prior in-memory session data.
- Include a short teacher note and a student discussion question.

### ED-06 — Save-and-compare scenarios
**User story:** As a student, I want to compare two energy-system configurations, so I can support conclusions with evidence.

**Initial acceptance criteria:**
- Capture a baseline and a modified scenario from equivalent initial conditions and simulated time spans.
- Compare at least peak transformer load, import/export and overload duration when those values are available and validated.
- Avoid comparing different weather inputs or time windows without a warning.
- Work with local session data; cloud accounts and a database are not required.

## High-value innovative experiments

### ED-12 + ED-14 — Cheap electricity versus a safe grid
Give students a sample electricity-price schedule and two battery strategies: *charge when cheapest* and *minimise local transformer peaks*. Ask whether the cheapest strategy causes congestion. This extends the existing controls rather than assuming price optimization already exists. Explain all simplified tariff assumptions.

### ED-20 + ED-11 — Dutch grid-congestion challenge
Provide a simplified Dutch neighbourhood case in which many households charge EVs after work. Students must keep the transformer under a defined threshold while preserving household comfort and a fixed budget. Use explicitly illustrative data unless authoritative profiles are obtained and mapped correctly.

### ED-26 — Multi-stakeholder classroom negotiation
Students receive roles such as resident, grid operator, municipality, or energy cooperative. Each role has a different objective. The class debates solar panels, flexible charging, storage and grid upgrades, then applies decisions in the simulation. This can begin as a **teacher-led offline activity** before any multiplayer platform is built.

## Guardrails / scope

1. **First priority is engineering reliability:** protect the current behaviour, remove hardcoded machine paths, automate launch, and test Windows/macOS/Linux feasibility.
2. **No mandatory InfluxDB:** in-memory data and optional local CSV/JSON exports are sufficient for early analytics and experiments.
3. **No invented physics:** new batteries, islanding, EV discharge, heat pumps or financial optimisation require actual backend model support and validation.
4. **Keep learning goals explicit:** each feature must help a student explain at least one energy-system trade-off, not merely add visual decoration.
5. **Avoid claiming the whole catalogue will be delivered:** select 2–3 classroom features after teacher interviews and estimates.
6. **Protect authorship and licences:** retain original University of Twente/DEMKit and previous contributor notices, and confirm redistribution terms.

## Suggested teacher questions

- What age / education level will use this simulation?
- Is the primary lesson about grid congestion, storage, renewable energy or energy economics?
- Will students use individual laptops, or one large shared touch display?
- Is a 15-minute guided challenge or a 60-minute open investigation more valuable?
- Which three existing screens or actions currently confuse students?
- Which two features from this list would improve your next lesson most?

## Source inspiration

These references inspired the proposals; they do **not** imply that the referenced products or all listed capabilities already exist in this DEMKit application.

- PhET interactive simulation design — https://phet.colorado.edu/en/about
- PhET classroom activity design — https://phet.colorado.edu/files/guides/TeacherGuide_ActivityDesign_en.pdf
- REopt overview, renewable energy costs and resilience — https://www.nlr.gov/reopt/about
- Quintel Energy Transition Model — https://docs.energytransitionmodel.com/main/intro
- En-ROADS interactive scenario simulator — https://docs.climateinteractive.org/projects/en-roads/en/latest/guide/about.html
- Netbeheer Nederland, thuisbatterijen and network peaks — https://www.netbeheernederland.nl/flexoplossingen/thuisbatterijen
- TU Delft GO2Zero serious game — https://seriousgaming.tudelft.nl/games/go2-zero/
- Netbeheer Nederland, local flexibility — https://www.netbeheernederland.nl/netcapaciteit-en-flexibiliteit/flexibel-gebruik-van-het-elektriciteitsnet
