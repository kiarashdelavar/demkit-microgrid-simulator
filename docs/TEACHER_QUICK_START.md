# DEMKit Microgrid — Quick Start for Teachers

**Status: internal classroom evaluation guide (Windows prototype).**

This is a short guide for trying the simulation with students and giving feedback. The Windows desktop prototype works on the developer's computer, but **it has not been approved for general distribution**. Installation on a clean computer without Python or Node.js, uninstall behaviour, dependency security and redistribution rights still need checking. Use only an installation supplied through an approved internal test.

## What is the tool?

The simulator shows a small neighbourhood with **six houses** connected to an electricity grid. Students can try EV chargers, solar panels, batteries and household devices, then see how the electricity demand and local production change.

The point is to **experiment and discuss**, not to predict exact electricity costs or the real capacity of a particular neighbourhood.

## Open the simulation

1. On an approved test computer, open **DEMKit Microgrid Prototype** from the Windows desktop or Start menu.
2. Wait until the game appears. You do **not** need to open a separate Python or Node.js terminal.
3. Read the introduction and click **Start Mission**.
4. The simulation shows the houses, a clock, transformer reading, device choices and a coin budget.

The Electron window can be smaller than the full **1920 × 1080** game board. Use the mouse wheel, touchpad or scrollbars to see the lower houses or the right side. This scrolling change is part of the latest development code; the installed version must be rebuilt after that change to include it.

If the program shows a startup error, stop and report the error message to the project developer. Don't install extra software or dismiss security warnings just to make it work.

## Try a simple activity (10–15 minutes)

1. **Start with one house.** Look at its current load and power.
2. **Add an EV charger.** Drag the EV icon from the device area into a house. See whether its power and the coin budget change.
3. **Add solar panels.** Compare the house's reading with and without solar production. Output can depend on the simulated time of day.
4. **Add a battery.** Try the Solar, Smart, plus and minus controls. A battery does not always change immediately: it depends on charging state and demand.
5. **Check the goals.** Read the current goal and complete it. Note any coin reward.
6. **Look at the grid.** Compare load and power between houses and watch for warnings. An overload may not happen in every short session.

The displayed device prices include **EV charger: 10 coins, solar panel: 10 coins, battery: 30 coins** in the tested game version. Coins, house slots and goals are **game mechanics**, not real purchase prices.

## Things to look at while playing

- **House load % and Power W:** changes when devices use or produce electricity.
- **Transformer A:** a reading for the shared electricity network.
- **Coins and house slots:** limits on what students can buy and place in the game.
- **Battery modes:** charging/discharging behaviour may vary with demand and solar.
- **Overload warning:** something to discuss about network capacity; don't force a failure if it doesn't appear.
- **Time and season:** help explain why demand or solar generation changes.

## Discussion after the activity (5 minutes)

Ask students:

1. What happened to the grid when we added EV chargers or other devices?
2. When did solar panels or batteries help, and when were they less useful?
3. **Who could afford these technologies in a real neighbourhood, and who might be left out?**
4. Who would pay for a stronger electricity network if it was overloaded?
5. What important real-world details are missing from this simple game?

The last three questions connect the exercise to **fairness in the energy transition**. The game's equal starting budget does not mean all real households have equal money, housing choices or access to technology.

## At the end

Close the desktop application normally. The latest prototype has been tested reopening on the original Windows computer, but **saving progress across new launches is not a promised feature**. Treat each lesson as a new test session until reset/persistence is checked.

## If something goes wrong

| Problem | What to do |
| --- | --- |
| Only part of the neighbourhood is visible | Use the scrollbars or mouse wheel; maximize the window if useful. |
| A device won't fit in a house | Check available slots, budget and whether the game allows that action. |
| Values don't change right away | Check whether the simulation is running, and whether the simulated conditions allow that device to act. |
| App says it cannot start | Copy the exact message and send it to the developer. |
| Web server disconnected | Close the application, make sure an older copy is not running and try once more. Report repeated failures. |
| Windows shows an unknown publisher or security block | **Stop and contact the supervisor/developer.** Do not bypass a security block. |

### Feedback for the project team

After a small supervised test, note: How long did starting the app take? Could students reach all six houses? Could they drag EV/solar/battery devices? Did the explanation make sense? What confused them? Which new feature would help a lesson most?

**Project:** DEMKit Microgrid Touchtable — Saxion educational prototype. For technical setup and known limitations, see [the developer guide](DEVELOPER_QUICK_START.md).
