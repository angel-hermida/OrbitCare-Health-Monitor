# OrbitCare

Health monitoring software for astronauts. NASA Space Apps Challenge 2026.

An offline-first web app that helps astronauts check their own health, understand each reading in plain language, and know what to do next, on a space station, a spacecraft, the Moon or Mars. It is organised around NASA's five hazards of human spaceflight (RIDGE): Radiation, Isolation, Distance, Gravity, Environment.

"OrbitCare" is a placeholder name. To rename it, change `index.html`, `src/components/Layout.jsx` and `src/pages/CrewPicker.jsx`.

## Run it

```
npm install
npm run dev
```

Open the link it prints. `npm run build` makes a static site in `dist/` that can go on Vercel or GitHub Pages as it is.

Requires Node 20 or newer.

## Stack

React 19 + Vite, Tailwind CSS v4, Recharts, React Router (HashRouter). All data is in `localStorage`. There is no backend and no network call.

## What works now

| Feature | Where |
|---|---|
| Crew profiles (4 preset astronauts with Earth baselines) | first screen, `/profile` |
| Log 6 indicators by hand | `/log` |
| Green / yellow / red status + plain sentence + next step | dashboard, log result |
| How-to-measure guides | `/guides` |
| Location + mission day → delay to Earth → response level | `/settings` (the D page) |
| Limits get stricter as the response level rises | status engine |
| Symptom checker (headache is complete, 4 others are stubs) | `/symptoms` |
| Emergency mode with 5 scenarios and a report to ground | `/emergency` |
| Simulated cabin + radiation sensors, with demo switches | Habitat panel, `/settings` |
| 30 days of demo history, with a reset button | loads on first run |
| Trend charts with colored range bands | `/history` |

## File structure

```
src/
  main.jsx                 app entry (router + mission provider)
  App.jsx                  routes
  index.css                Tailwind import + base styles

  data/                    CONTENT. Edit these without touching components.
    crew.js                the 4 astronauts and their Earth baselines
    thresholds.js          every limit, message and next step (indicators + sensors)
    guides.js              how to measure / why it matters in space
    emergencies.js         emergency scenarios and steps
    symptomTrees.js        symptom checker decision trees
    environments.js        ISS / spacecraft / Moon / Mars: gravity, context, shelter advice
    hazards.js             the RIDGE letters, names and page links

  engine/                  LOGIC. No React in here.
    status.js              getStatus(): value -> level, message, action. Also formatting.
    responseLevel.js       delay to Earth and the four response levels
    symptomRunner.js       data checks + tree walking for the symptom checker
    sensors.js             simulated sensor loop
    seed.js                30-day demo data
    report.js              builds the "Report to Ground" text
    time.js                date helpers

  store/
    storage.js             the only file that touches localStorage. addReading() lives here.
    MissionContext.jsx     global state. Components call useMission().

  components/              reusable UI
    Layout.jsx             sidebar, top banner, emergency button, disclaimer
    StatusCard.jsx         one indicator card on the dashboard
    StatusPill.jsx         OK / CAUTION / ALERT label, and RIDGE hazard tags
    HabitatPanel.jsx       live sensor list
    TreeRunner.jsx         runs any symptom tree
    TrendChart.jsx         line chart with colored bands
    StubPage.jsx           frame for pages that are not built yet
    ui.js                  shared Tailwind class strings and status colors

  pages/                   one file per screen
    CrewPicker, Dashboard, LogReading, Guides, SymptomChecker, Emergency,
    History, Profile, Settings (= Distance), Radiation, Isolation, Gravity, Environment
```

## How data flows

```
form (LogReading.jsx)
  -> addReading({ astronautId, type, value, source, timestamp })   store/storage.js
  -> db in MissionContext, saved to localStorage on every change
  -> getStatus(type, value, astronaut, missionState)               engine/status.js
  -> StatusCard / charts / report
```

- **Every reading goes through `addReading`.** `source` is `'manual'`, `'device'` or `'sensor'`. To add the simulated wearable, call `addReading` from a timer with `source: 'device'`. No UI change is needed.
- `useMission()` gives components: `db`, `astronaut`, `environment`, `missionDay`, `comms`, `responseLevel`, `missionState`, `sensors`, and the actions `addReading`, `selectAstronaut`, `setEnvironment`, `setMissionDay`, `setStorm`, `setCo2Spike`, `logSymptom`, `resetDemo`, `getCheckContext`.
- `missionState` is what the status engine needs: `{ responseLevel, comms, environment, gravity }`.

### How a status is decided (engine/status.js)

1. Check the value against the absolute green and yellow ranges in `thresholds.js`.
2. Check how far it is from the astronaut's own baseline. This uses a fixed amount in the indicator's unit (for example 20 bpm), not a percentage, because a percentage makes no sense for temperature.
3. Take the worse of the two, but a baseline shift can raise the result by one step at most.
4. Both ranges shrink by `tightenStep × responseLevel.index`, so limits are stricter farther from Earth.
5. A red result gets the escalation sentence for the current response level added to its action.

### Response levels (engine/responseLevel.js)

| Delay | Level | index |
|---|---|---|
| under 5 sec (ISS, Moon) | Ground-led | 0 |
| up to 15 min | Shared | 1 |
| over 15 min | Crew-led | 2 |
| blackout (Mars, around day 390) | Fully autonomous | 3 |

The delay model is simple on purpose. Spacecraft: grows in a straight line to 20 minutes over 180 days. Mars: a cosine curve between about 4 and 24 minutes over a 780-day cycle.

## How to add things

**A symptom tree.** Add a key in `data/symptomTrees.js`. Node types are `data` (answered from app data), `question` (yes / no) and `result`. The format is explained at the top of that file. The symptom button appears by itself.

**A data check for trees.** Add an entry to `DATA_CHECKS` in `engine/symptomRunner.js`. It gets `{ sensors, events, readings, environmentChangedAt, now }` and returns `{ result, detail }`.

**An emergency scenario.** Add an object to `data/emergencies.js` with `id`, `title`, `summary`, `hazards`, `steps`.

**An indicator.**
1. Add it to `THRESHOLDS` and `INDICATOR_ORDER` in `data/thresholds.js`.
2. Add it to `READING_TYPES` in `store/storage.js`.
3. Add a baseline value for each astronaut in `data/crew.js`.
4. Add a guide in `data/guides.js`.
5. Add its input field in `pages/LogReading.jsx`, and a case in `formatValue` in `engine/status.js` if it needs special formatting.
6. Add it to the seed in `engine/seed.js`.

**Styling.** Use the class strings in `components/ui.js`. Tailwind only keeps class names that are written out in full in the source, so do not build class names from pieces.

## Demo script

Demo data is the same after every reset. Planted events:

- **Maya Okafor**: everything green.
- **Daniel Reyes**: three short nights, so sleep is yellow. Headache → "poor sleep or low mood".
- **Aiko Tanaka**: low mood for four days, so mood is yellow.
- **Sam Whitfield**: a two-day mild fever about 11 days ago, visible on the temperature chart.

Good moments to show:

1. **E**: Distance page → Trigger CO₂ spike → wait about 8 seconds → Symptom checker → Headache. It finds the CO₂ by itself.
2. **D**: Distance page → Mars base → drag the mission day to 390. The banner switches to "Fully autonomous" and the limits tighten (watch the bands on the Trends page).
3. **R**: Trigger solar storm → the Habitat panel turns red with shelter advice for the current location → Emergency → Radiation storm.
4. **Report**: finish any emergency to see the packaged report and the reply estimate.

## TODO checklist

### Unverified content (do this before presenting)

- [ ] `data/thresholds.js`: every range, baseline amount and `tightenStep` is a placeholder. Verify each one and fill in `source`.
- [ ] `data/thresholds.js`: sensor limits (CO₂, temperature, humidity, noise, radiation) are placeholders.
- [ ] `data/emergencies.js`: all five protocols are placeholder first-aid style steps.
- [ ] `data/symptomTrees.js`: the medical logic in every tree.
- [ ] `data/guides.js`: the space-specific claims.
- [ ] Blood sugar limits do not separate fasting from after-meal readings.

### Stub pages to build

- [ ] `pages/Radiation.jsx`: storm alert on every page, shelter checklist by location, crew roll call, all-clear.
- [ ] `pages/Isolation.jsx`: memory bank, countdown to the next family drop, low-mood suggestion. Always open, never locked behind tasks.
- [ ] `pages/Gravity.jsx`: animated jump visual, bone-loss meter, exercise log, hydration reminders, landing checklist.
- [ ] `pages/Environment.jsx`: sensor history, crew illness alert, body clock helper.

### Stub symptom trees to expand

- [ ] Dizziness, Nausea, Fatigue, Low mood (2-3 nodes each now).

### Not built yet

- [ ] Simulated wearable ("Connect device" toggle that calls `addReading` with `source: 'device'`).
- [ ] Measurement reminders on a schedule.
- [ ] Sensor history. Sensors only keep their current value, so the app cannot yet say "high for 6 hours".
- [ ] Crew alert is only a banner in Emergency mode. Nothing is sent to other profiles.
- [ ] Body map, streaks and points, camera input.
- [ ] The mood questions (stress, energy, loneliness) are saved in `reading.extra` but nothing uses them yet.
- [ ] Phone layout. The app is built for a laptop screen.
