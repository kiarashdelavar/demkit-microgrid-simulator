# Sprint 1 — DEMKit Simulation Test Results (BK-03)

**Date started:** 16 October 2026  
**Task:** [BK-03 — Test the existing simulation](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/5)  
**Status:** In progress — T-01 to T-04 passed; remaining tests pending

## 1. Why I am doing these tests

Before I change the setup or add new features, I want to check what already works. The app opened successfully on my Windows laptop during the first setup, but that does not mean every button or calculation works correctly.

In this task, I will try the important parts of the simulation and write down what happens. If something does not work, I will record it so I can fix it later without forgetting the problem.

**This task is about testing, not fixing or redesigning the app.**

## 2. My test setup

The versions below were recorded during [BK-01](BASELINE.md). I still need to confirm the Git commit I use for *these* tests.

| Item | Setup |
| --- | --- |
| Laptop operating system | Windows 11 Pro, build 26300 |
| Python | 3.12.10 (`.venv`) |
| Node.js | 22.15.0 |
| npm | 11.12.1 |
| Browser | **To fill in** (name and version if useful) |
| Git commit tested | **To fill in**: run `git rev-parse HEAD` before testing |
| DEMKit backend | Port 3001 |
| Node.js web server | Port 3002 |
| App URL | http://localhost:3002 |
| InfluxDB | Not part of this assignment for now |

I will use the same Git commit for my test session so that the results can be repeated. If I change code, I will write down the new commit.

## 3. How to start the app

Open VS Code in the local `touchtable-tool` folder. Start the two services in separate terminals.

**Terminal 1 — DEMKit (from the project root):**

```powershell
.\.venv\Scripts\python.exe .\demkittt\demkit.py -f touchtable/model -m touchtable
```

Wait for DEMKit to start. The Python backend is expected on port **3001**.

**Terminal 2 — Web server (from the project root):**

```powershell
cd workspace\touchtable\web
node index.js
```

Open **http://localhost:3002** and click **Start Mission** when needed. If the browser does not load, record the terminal error rather than marking the test as passed.

Before testing, run this from the project root:

```powershell
git rev-parse HEAD
git status --short
```

Copy the commit ID into section 2. If there are local code changes, record them too.

## 4. Test results overview

**Result guide:**
- **Pass:** I tried it and the expected behaviour happened.
- **Fail:** I tried it and something went wrong.
- **Blocked:** I could not test it, for example because the needed touch hardware was missing.
- **Not tested:** I have not tried it yet.

**Important:** T-01 to T-04 have passed their manual UI checks. T-04 confirmed the EV moved from House 1 to House 2, the slot counters updated, and no backend terminal errors were reported. These results do not yet verify every energy calculation or controller state.

| ID | What I am testing | Expected result (short) | Actual result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| T-01 | Start DEMKit and the browser | Both services run and the page loads | Browser loaded with the neighbourhood view, visible houses, power/load numbers, budget (300 coins) and simulation time (01 Jan 03:45). Tester confirmed it works. | **Pass — UI loads** | Screenshot supplied in chat on 16 Oct 2026; attach to GitHub issue #5 for permanent evidence. Terminal startup warnings and exact test commit still need recording. |
| T-02 | Start, pause and resume | Simulation time moves only when running | Time moved while playing, stayed still while paused, and moved again after resume. No extra problems reported. | **Pass — based on tester report** | Tester submitted Yes/Yes/Yes and 'None' for observations in chat on 16 Oct 2026. No separate timing/log screenshot recorded. |
| T-03 | Add and remove devices | Device changes appear correctly | EV charger, solar panel and battery were each added and removed successfully. Tester checked the backend terminals and reported no relevant errors. | **Pass — tested device types** | Direct tester report on 16 Oct 2026 (EV: pass, solar: pass, battery: pass, backend: no-errors, notes: none). No screenshot/log attached yet; exact simulation values were not verified. |
| T-04 | Move an EV to another house | EV leaves old house and appears in new house | The same EV charger disappeared from House 1 and appeared in House 2. The slot counters updated correctly. No backend terminal errors were noticed. | **Pass — based on manual tester report** | User submitted Yes/Yes/Yes/none and no additional observations on 16 Oct 2026. Backend entity membership was not independently inspected. |
| T-05 | Coins and house slots | Coins/slots change as expected; limits work | To fill in | Not tested | — |
| T-06 | Learning goal reward | Goal reward is added only once | To fill in | Not tested | — |
| T-07 | Battery controls | Modes change the battery behaviour within limits | To fill in | Not tested | — |
| T-08 | More than one battery | No invalid battery state or crash | To fill in | Not tested | — |
| T-09 | Overload and cable repair | Warning appears and cable can recover | To fill in | Not tested | — |
| T-10 | Refresh or reconnect | Page shows the current simulation state | To fill in | Not tested | — |
| T-11 | Stop backend while web server runs | Failure is visible, not a fake success | To fill in | Not tested | — |
| T-12 | Resize a device | Device value changes correctly, if supported | To fill in | Not tested | — |

## 5. Steps for each test

### T-01 — Open the simulation
1. Start the Python backend and Node.js server.
2. Open `http://localhost:3002`.
3. Check if the neighbourhood and six houses appear.
4. If possible, confirm ports 3001 and 3002 are listening.

**Look for:** Page loads, no blocking startup error, and both services running.

### T-02 — Start and pause
1. Click **Start Mission**.
2. Watch the simulation time.
3. Pause, wait briefly, then resume.

**Look for:** Time moves while running, stops when paused, and continues after resuming.

### T-03 — Add and remove devices
1. Add an EV charger to a house.
2. Remove it.
3. Repeat with a solar panel, a battery and other available devices.
4. Watch the house/device information after each action.

**Look for:** The device is added or removed both visually and in the reported simulation state. Note any type that does not work.

### T-04 — Move an EV
1. Add an EV charger to House 1.
2. Move it to House 2.
3. Check both houses.

**Look for:** It no longer belongs to House 1 and appears in House 2. The handover says the device may be recreated, so do not assume its previous state is kept.

### T-05 — Budget and slots
1. Note the starting coin balance and slots.
2. Buy and place a device.
3. Fill the slots in one house.
4. Try adding one more device and try a slot upgrade.

**Look for:** Coins decrease correctly, full slots block extra devices, and the upgrade follows the shown price.

### T-06 — Learning goal
1. Read one goal in the interface.
2. Complete the activity it asks for.
3. Check the reward and coin balance.
4. Try the same goal again.

**Look for:** The reward is shown and paid once, not repeatedly.

### T-07 — Battery modes
1. Add a battery to a house.
2. Try **Solar** and **Smart** modes under useful conditions.
3. Try manual charging and discharging.
4. Watch the battery state of charge and house/grid power.

**Look for:** Battery behaviour responds to the selected mode and does not go outside its available energy or power limits. If the effect is not visible, record that — do not guess.

### T-08 — Multiple batteries
1. Try placing more than one battery in the same house if the UI allows it.
2. Run the simulation.
3. Watch the battery levels and check both terminal logs.

**Look for:** No crash, negative energy, or values above capacity. If the game blocks the second battery, record that as a limitation rather than forcing it.

### T-09 — Overload and restore a cable
1. Use available devices to raise the load in a house or street.
2. Watch for grid warnings and a burned cable.
3. If a cable burns, reduce the demand and try the repair control.

**Look for:** Warning/repair behaviour matches the user interface. Record **Blocked** if you cannot reproduce an overload safely in the simulation.

### T-10 — Refresh the browser
1. While the simulation is running, refresh the browser page.
2. Wait for the connection.
3. Compare the visible devices and current values with the state before refreshing.

**Look for:** The screen reconnects and shows the current simulation instead of an unrelated or empty state.

### T-11 — Stop Python while Node is running
1. Leave the Node.js web server open.
2. Stop the Python backend with **Ctrl+C**.
3. Try one action in the browser.
4. Write down the message or behaviour.
5. Restart the backend when finished.

**Look for:** The failure is clear and the app does not pretend an unsuccessful action worked. Run this test near the end because it interrupts the simulation.

### T-12 — Resize a device
1. Select a device that supports resizing or scaling.
2. Use the supported mouse or touch control.
3. Compare the shown device size/power and the updated simulation values.

**Look for:** The change reaches the simulation. If it only works with a multitouch table that I do not have, mark **Blocked — touch hardware not available**.

## 6. How I will record a problem

When a test fails, I will write down:
- Which test failed.
- What I clicked or changed.
- What I expected to happen.
- What happened instead.
- Any useful terminal error or screenshot.
- Whether I could reproduce the same problem.

I will create a separate GitHub bug issue for a significant problem. I will not change the simulation code as part of this test report.

### Test notes

| Test ID | Date | What happened | Screenshot / log | Follow-up issue |
| --- | --- | --- | --- | --- |
| T-01 | 16 Oct 2026 | Opened the app at localhost:3002. Screenshot showed the neighbourhood, three houses in the visible crop (houses 1–3), power readings 173 W / 107 W / 138 W, transformer current 1.4 A and a 300-coin budget. The tester wrote 'ok its working'. The other houses are outside the provided screenshot crop. | Screenshot shared in this conversation; upload to issue #5 pending | — |
| T-02 | 16 Oct 2026 | I checked the simulation clock while playing, paused, and playing again. It advanced, stopped, and continued as expected. I did not notice any other problems. | Direct test report in chat (Yes/Yes/Yes, no other observations) | — |
| T-03 | 16 Oct 2026 | I added and removed an EV charger, a solar panel and a battery. All three worked as expected. I checked the backend output and saw no relevant errors. | Direct tester report (three passes; no backend errors); screenshots or logs not attached | — |
| T-04 | 16 Oct 2026 | I moved the EV charger from House 1 to House 2. It disappeared from House 1, appeared in House 2, and the slot counters changed correctly. I checked the terminals and did not see any errors. | Direct tester report; no screenshot/log attached | — |
| — | — | Add notes here after testing | — | — |

## 7. What I already know from the handover

The existing project includes EVs, solar panels, batteries, goals, budgets and cable warnings. The previous handover also mentions InfluxDB connection warnings. Those are useful things to watch during testing, but I will only mark a test as passed after trying it myself.

I do **not** need to set up InfluxDB for these tests.

## 8. When BK-03 is done

- [ ] I have tested T-01 through T-12, or explained clearly why a test was blocked.
- [ ] I have filled in the actual results instead of leaving `Not tested`.
- [ ] I have added screenshots or log evidence for important findings.
- [ ] I have recorded any problems and created follow-up issues when needed.
- [ ] I have written down the exact Git commit used for testing.
- [ ] I have reviewed the results and linked them to [Issue #5](https://github.com/kiarashdelavar/demkit-microgrid-simulator/issues/5).

**Next:** Use these results as a starting point for dependency/path investigation (BK-04) and later installation improvements.
