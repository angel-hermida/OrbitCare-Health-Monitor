# OrbitCare

Health monitoring software for astronauts. NASA Space Apps Challenge 2026.

An offline-first web app that helps astronauts check their own health, understand each reading in plain language, and know what to do next, on a space station, a spacecraft, the Moon or Mars. It is organised around NASA's five hazards of human spaceflight (RIDGE): Radiation, Isolation, Distance, Gravity, Environment.

The look follows `design/style-guide.webp` (colors, type, top bar, vital cards, buttons, pills, tables). The crew picker matches `design/crew-picker.webp`.

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
| Daily check-in: old readings show as DUE, with today's progress | dashboard |
| How-to-measure guides | `/guides` |
| Location picker | `/mission` (Mission setup) |
| Delay to Earth → response level, and how the levels work | `/distance` (the D page) |
| Limits get stricter as the response level rises | status engine |
| Symptom checker (headache is complete, 4 others are stubs) | `/symptoms` |
| Emergency mode with 5 scenarios and a report to ground | `/emergency` |
| Simulated cabin + radiation sensors | Habitat panel (dashboard, `/environment`) |
| Demo controls: mission day, solar storm, CO₂ spike, reset | Presenter panel (button bottom right, Shift+P hides it) |
| Theme (dark / light), °C / °F, alert sound | `/settings` |
| 30 days of demo history | loads on first run, reset from the Presenter panel |
| Trend charts with colored range bands | `/history` |

### Routes

| Route | Page | Sidebar group |
|---|---|---|
| `/` | Dashboard | Health |
| `/log` | Log a reading (`?type=sleep` preselects) | Health |
| `/symptoms` | Symptom checker | Health |
| `/history` | Trends | Health |
| `/guides` | How to measure (`#sleep` scrolls) | Health |
| `/radiation`, `/isolation`, `/distance`, `/gravity`, `/environment` | RIDGE hazard pages | Hazards |
| `/mission` | Mission setup (location) | Mission |
| `/settings` | Settings (theme, units, alerts, about) | System (pinned bottom) |
| `/profile` | My profile | Crew (pinned bottom) |
| `/emergency` | Emergency mode (full screen, no sidebar) | top bar button |

In the top bar, LOCATION opens `/mission` and the response level badge opens `/distance`.

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
    checkin.js             how often each indicator should be measured (hours)

  engine/                  LOGIC. No React in here.
    status.js              getStatus(): value -> level, message, action. Also formatting (°C / °F).
    checkin.js             getFreshness() and getTodayProgress() for the daily check-in
    responseLevel.js       delay to Earth and the four response levels
    symptomRunner.js       data checks + tree walking for the symptom checker
    sensors.js             simulated sensor loop
    seed.js                30-day demo data
    report.js              builds the "Report to Ground" text
    time.js                date helpers

  store/
    storage.js             the only file that touches localStorage. addReading() and the
                           preferences section (loadPreferences / savePreferences) live here.
    MissionContext.jsx     global mission state. Components call useMission().
    PreferencesContext.jsx theme, temperature unit, alert sound, presenter button. usePreferences().

  components/              reusable UI
    Layout.jsx             sidebar, top bar, emergency button, disclaimer, Presenter panel
    Logo.jsx               OrbitCare wordmark (SVG)
    PageTitle.jsx          section title: bold, one red word, thin blue rule
    PresenterPanel.jsx     floating demo controls (mission day, storm, CO₂, reset)
    Segmented.jsx          segmented toggle used on Settings
    StatusCard.jsx         one indicator card on the dashboard (incl. the DUE state)
    StatusPill.jsx         OK / CAUTION / ALERT / DUE label, and RIDGE hazard tags
    HabitatPanel.jsx       live sensor list
    TreeRunner.jsx         runs any symptom tree
    TrendChart.jsx         line chart with colored bands
    StubPage.jsx           frame for pages that are not built yet
    RadiationAlertSound.jsx  beeps once when radiation turns red (if sound is on)
    alertSound.js          the beep (Web Audio API, no files)
    ui.js                  shared Tailwind class strings and status colors

  pages/                   one file per screen
    CrewPicker, Dashboard, LogReading, Guides, SymptomChecker, Emergency, History,
    Profile, Settings, MissionSetup, Distance, Radiation, Isolation, Gravity, Environment
```

### Daily check-in

- Each indicator has a check interval in `data/checkin.js` (24 hours for all six today).
- `engine/checkin.js` → `getFreshness(reading, type, now)` says whether the latest reading is older than its interval (`due`), and `getTodayProgress(db, astronautId, now)` counts how many are fresh.
- On the dashboard a due (or missing) reading shows a gray **DUE** card: "Not measured today", the last value and its age, and a **Log now** button. A due reading never shows OK, and it does not count toward the green / yellow / red summary. The top shows "Today's check-in: X of 6 done" and the summary line counts the checks due.
- Old readings are kept. Trends, Profile and the Report to Ground still use the full history (the report shows each value's age).

### Preferences

Saved in `localStorage` under their own key (`orbitcare.preferences.v1`) through `store/storage.js`, separate from mission data, so **Reset demo data** never clears them and data saved before preferences existed keeps working.

- **Theme**: `<html data-theme="dark|light">`. Only elements inside `.oc-app` follow it (see `index.css`); the top bar and Emergency mode use `.oc-dark` to stay dark, and the crew picker is outside `.oc-app` so it never changes.
- **Temperature unit**: display only. Readings, thresholds and the status engine stay in °C; `formatValue` / `formatSensor` take an optional unit.
- **Alert sound**: a short beep when a newly logged reading is red, and once each time radiation turns red.
- **Presenter button**: Shift+P shows / hides it.

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

- **Maya Okafor**: everything green, but blood sugar and temperature were last logged 2 days ago, so they show as DUE (check-in 4 of 6).
- **Daniel Reyes**: three short nights, so sleep is yellow. Headache → "poor sleep or low mood".
- **Aiko Tanaka**: low mood for four days, so mood is yellow.
- **Sam Whitfield**: a two-day mild fever about 11 days ago, visible on the temperature chart.

All demo controls are in the **Presenter panel**: the small "Presenter" button at the bottom right of every page (not on the crew picker or in Emergency mode). Shift+P hides or shows the button.

Good moments to show:

1. **E**: Presenter panel → Trigger CO₂ spike → wait about 8 seconds → Symptom checker → Headache. It finds the CO₂ by itself.
2. **D**: Mission setup → Mars base → Presenter panel → drag the mission day to 390. The top bar switches to "Fully autonomous" and the limits tighten (watch the bands on the Trends page).
3. **R**: Presenter panel → Trigger solar storm → the Habitat panel turns red with shelter advice for the current location → Emergency → Radiation storm.
4. **Report**: finish any emergency to see the packaged report and the reply estimate.
5. **Check-in**: Maya's dashboard → a DUE card → Log now → back to the dashboard: the card turns green and the check-in count goes up.

## Custom astronaut profiles (branch `feature/custom-astronaut-profiles`)

Crew picker -> **+ New astronaut**: name, role, age, gender, weight, height, optional medical history.

- `engine/personalize.js`: `estimateBaseline()` makes a starting Earth baseline from the profile. `attentionProfile()` returns a scale (1 = standard, 0.7 = strictest) that shrinks the "distance from baseline" limits in `status.js`, so the same reading can be green for one astronaut and yellow for another. Age 50+, age 65+, BMI outside 18.5-30 and listed medical conditions each raise attention. The 4 preset astronauts stay Standard, so the demo script is unchanged.
- Any baseline the astronaut already knows can be typed over the estimate. `baselineSource` records which.
- Custom profiles are saved in `db.astronauts` (`store/storage.js`). Demo reset keeps them.
- **Edit:** Profile page -> *Edit profile* changes any detail, baseline or medical history (`components/ProfileForm.jsx`, shared with the new-profile form). Past readings are kept and rated against the new baseline. *Re-estimate from profile* resets baselines to the formulas.
- **Remove:** Profile page -> *Remove from crew* (with confirmation) deletes the profile, their readings and symptom logs. Edits and removals of the 4 presets are stored in `db.edits` / `db.removedIds`, and *Reset demo* restores the presets.
- `engine/aiContext.js`: `buildAstronautContext()` returns the plain-text summary (profile, attention level, medical history, latest readings with status) that the AI assistant will receive. Add new record fields there.
- `npm run check` runs the logic checks in `scripts/check-personalization.mjs`.

All formulas in `personalize.js` are placeholders and need clinical review. Medical history is stored in the browser only.

Next: learn baselines from the first week of real readings, let conditions adjust specific limits, a baseline change history, then the AI chat panel.

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
- [ ] Measurement reminders on a schedule (the dashboard already shows which checks are due).
- [ ] Sensor history. Sensors only keep their current value, so the app cannot yet say "high for 6 hours".
- [ ] Crew alert is only a banner in Emergency mode. Nothing is sent to other profiles.
- [ ] Body map, streaks and points, camera input.
- [ ] The mood questions (stress, energy, loneliness) are saved in `reading.extra` but nothing uses them yet.
- [ ] Phone layout. The app is built for a laptop screen.
