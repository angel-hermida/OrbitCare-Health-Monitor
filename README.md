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

### NASA API key (optional)

Live space weather on the Radiation page uses the NASA API. Put your key in a file named `.env` next to `package.json`:

```
VITE_NASA_API_KEY=your-key-here
```

Get a free key at https://api.nasa.gov. Without one the app uses NASA's shared `DEMO_KEY` (low rate limit), and if api.nasa.gov is unreachable it falls back to the CCMC DONKI mirror, which needs no key. `.env` is in `.gitignore`, so it is never committed. **Restart `npm run dev` after creating or changing `.env`.**

Note: Vite builds `VITE_` variables into the JavaScript, so anyone with the built site can read the key. That is fine for a free NASA key; never put a secret there.

### Claude API key (AI assistant, optional)

The AI health assistant and medical record reading use the Claude API. Add to `.env`:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
# optional, default claude-sonnet-5-5
VITE_CLAUDE_MODEL=claude-sonnet-5-5
```

Restart `npm run dev` afterwards. Without a key the Assistant panel and the Medical records upload say they are unavailable; everything else works as before. **Local demos only:** the key is built into the JavaScript like the NASA key, and unlike the NASA key it is a paid secret. Do not deploy a build that contains it. For a public deploy, move `engine/assistant/claude.js`'s fetch behind a small server function that holds the key.

## Stack

React 19 + Vite, Tailwind CSS v4, Recharts, React Router (HashRouter). All data is in `localStorage`. There is no backend. Network calls: NASA DONKI (space weather) and, only when the assistant is used, the Claude API.

## What works now

| Feature | Where |
|---|---|
| Crew profiles (4 preset astronauts with Earth baselines) | first screen, `/profile` |
| Log 6 indicators by hand | `/log` |
| Camera heart-rate estimate (on-device, nothing saved or sent) | `/log`, Heart rate |
| Green / yellow / red status + plain sentence + next step | dashboard, log result |
| Daily check-in: old readings show as DUE, with today's progress | dashboard |
| How-to-measure guides | `/guides` |
| Location picker | `/mission` (Mission setup) |
| Delay to Earth → response level, and how the levels work | `/distance` (the D page) |
| Limits get stricter as the response level rises | status engine |
| Symptom checker (headache is complete, 4 others are stubs) | `/symptoms` |
| Emergency mode with 5 scenarios and a report to ground | `/emergency` |
| **Live NASA space weather** (flares, particle events, geomagnetic storms, last 30 days) | `/radiation` |
| Simulated cabin + radiation sensors (labelled SIMULATED) | Habitat panel (dashboard, `/environment`), `/radiation` |
| Demo controls: mission day, Next day, solar storm, CO₂ spike, reset | Presenter panel (button bottom right, Shift+P hides it) |
| Theme (dark / light), animations, °C / °F, master alarm sound | `/settings` |
| Master alarm (red bar + repeating sound for any red condition) | every page, incl. Emergency mode |
| Check-in streaks | dashboard status strip, `/profile` |
| 30 days of demo history | loads on first run, reset from the Presenter panel |
| Trend charts with colored range bands | `/history` |
| **AI health assistant** (chat: current vitals, history, range check, trend + forecast, records, opens pages) | **Assistant** button in the top bar, every page |
| **Medical records**: upload PDF / image, AI extracts conditions, medications, allergies, labs, exams | `/records` |
| **Memory bank**: messages from home (text, photo, audio, video), family drop countdown, NEW tags, "Add from home" uploads (IndexedDB, offline) | `/isolation` |
| Low mood 3 check-ins in a row → "A message from home is waiting" card | dashboard, low-mood symptom result |

### Routes

| Route | Page | Sidebar group |
|---|---|---|
| `/` | Dashboard | Health |
| `/log` | Log a reading (`?type=sleep` preselects) | Health |
| `/symptoms` | Symptom checker | Health |
| `/history` | Trends | Health |
| `/records` | Medical records (upload + extracted data) | Health |
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
    memoryBank.js          demo messages from home per crew member (photos in public/memory/)

  engine/                  LOGIC. No React in here.
    status.js              getStatus(): value -> level, message, action. Also formatting (°C / °F).
    checkin.js             getFreshness() and getTodayProgress() for the daily check-in
    streaks.js             getStreaks(): current / best check-in streak
    alarm.js               getRedConditions(): everything that should sound the master alarm
    responseLevel.js       delay to Earth and the four response levels
    symptomRunner.js       data checks + tree walking for the symptom checker
    memoryBank.js          memory bank: arrived / pending messages, next family drop, NEW tag
    sensors.js             simulated sensor loop
    spaceWeather.js        live NASA DONKI fetch (FLR / SEP / GST / notifications), fallback mirror,
                           cache, status summary, "does it matter here" per location
    seed.js                30-day demo data
    report.js              builds the "Report to Ground" text
    time.js                date helpers
    ppg.js                 estimateBpm(): heart rate from camera brightness samples
    assistant/             AI health assistant (see "AI assistant" below)
      tools.js             the tools the model can call, bound to the signed-in astronaut; NAV_PAGES
      trend.js             least-squares trend + 95% forecast interval
      prompt.js            system prompt (honesty, escalation, navigation rules)
      claude.js            Claude API calls: chat turn with tool use, record extraction

  store/
    storage.js             the only file that touches localStorage. addReading() and the
                           preferences section (loadPreferences / savePreferences) live here.
    MissionContext.jsx     global mission state. Components call useMission().
    memoryUploads.js       "Add from home" photos / audio / video in IndexedDB (idb-keyval)
    PreferencesContext.jsx theme, temperature unit, alert sound, presenter button. usePreferences().
    SpaceWeatherContext.jsx live NASA space weather for every page, refreshed every 10 min. useSpaceWeather().

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
    MemoryBank.jsx         memory bank on the Isolation page: countdown, message cards, full view, Add from home
    TrendChart.jsx         line chart with colored bands
    HazardPage.jsx         frame for a RIDGE hazard page (letter, title, intro)
    motion.jsx             useAnimationsEnabled(), StaggerItem, Collapse (all animation goes through here)
    StartupScreen.jsx      once-per-session startup screen
    SpaceFrame.jsx         crew-picker style frame for New Crew Profile
    MasterAlarm.jsx        red bar + repeating alarm for every red condition (mounted in App.jsx)
    alertSound.js          alarm tones (Web Audio API, no files)
    StreakToast.jsx        "Check-in complete · N-day streak" toast
    AssistantPanel.jsx     AI assistant chat drawer (opened from the top bar)
    AssistantCards.jsx     data cards in the chat (vitals, ranges, history, trend), drawn from app data
    CameraHeartRate.jsx    camera heart-rate estimate panel on the Heart rate form
    ui.js                  shared Tailwind class strings and status colors

  pages/                   one file per screen
    CrewPicker, Dashboard, LogReading, Guides, SymptomChecker, Emergency, History,
    Profile, Settings, MissionSetup, Distance, Radiation, Isolation, Gravity, Environment, Records
```

## AI assistant (engine/assistant/, components/AssistantPanel.jsx, pages/Records.jsx)

- **How it works:** the astronaut's question goes to Claude with a list of tools. Claude asks for the data it needs (`get_current_vitals`, `get_history`, `check_ranges`, `analyze_trend`, `get_medical_records`, `get_mission_context`, `navigate`). The tools run **in the browser** on the app's own data and send back only the result. The chat shows the tool results as data cards, so the numbers on screen always come from the app, not from the model's text.
- **One astronaut only:** no tool takes an astronaut id. Each tool is bound to whoever is signed in, so the model cannot read another crew member's data even if asked. The conversation is never saved and is cleared when the crew member switches.
- **No made-up numbers:** the system prompt (`prompt.js`) forbids stating any value not returned by a tool, requires units and timestamps, and labels values CURRENT / HISTORICAL / ESTIMATED. Indicators the app does not measure (e.g. blood oxygen) are listed in `NOT_TRACKED` and the assistant says so.
- **Trends (`trend.js`):** least-squares straight line over the last 5–30 days, slope per day with a 95% interval, "rising / falling" only when that interval excludes zero, forecast up to 7 days (capped at half the window) with a 95% prediction interval. Under 5 readings: no forecast. Blood pressure is analysed as systolic and diastolic separately.
- **Medical records:** PDF or image is sent once to Claude, which fills a fixed schema (forced tool call) with only what the document states, plus a short quote as evidence. Only the extracted data and file name / type / size are stored (`db.records`, `store/storage.js`), for the signed-in astronaut. If the record names someone else, the app asks before saving. Removing an astronaut deletes their records.
- **Navigation:** the assistant opens pages itself through `navigate`, limited to the routes in `NAV_PAGES` (`tools.js`).
- **Escalation:** ALERT readings or danger symptoms → follow the medical escalation protocol, notify the crew medical officer (CMO), offer Emergency mode.
- **Tests:** `npm run check:assistant` runs offline checks on the tools (scoping, real values, gaps, trend rules, records, navigation). Synthetic test record for the upload demo: `demo/SYNTHETIC_medical_record_Daniel_Reyes.pdf`.

### Assistant demo (sign in as Daniel Reyes)

1. **Assistant** → "What are my current vitals?" → vitals card, sleep CAUTION.
2. "Is my resting heart rate increasing?" → trend card, ESTIMATED forecast with range.
3. "What is my blood oxygen?" → not tracked by OrbitCare.
4. "Take me to my trends" → opens `/history`.
5. **Medical records** → upload the synthetic PDF → "Do I have any documented allergies?" → penicillin, with the source file.
6. "Show me Maya's heart rate" → only available when Maya is signed in.

### Camera heart rate (components/CameraHeartRate.jsx, engine/ppg.js)

- **Where:** Log a Reading → Heart rate, under the bpm field.
- **How it works:** the front camera films the face for 20 s. Each frame, the app reads the average green value inside the forehead box (blood flow changes skin colour slightly with each beat). `estimateBpm()` filters that signal and finds the strongest rhythm between 42 and 180 bpm. Signal quality Good / Fair is shown; a weak signal gives no number and asks to retry.
- **Privacy and offline:** video is analysed in the browser only. No frames are saved or sent, and the camera turns off when the measurement ends or is cancelled.
- **Saving:** **Use this value** fills the bpm field. The astronaut still presses **Save reading**. A camera value saved unchanged is stored with `source: 'device'`; an edited value is `'manual'`. Status, thresholds and the Master Alarm work as for any reading.
- **Labelled ESTIMATE:** "Confirm with a manual count before acting on a red result."
- **Needs:** a camera, browser permission, and a secure page (`localhost` or `https`). Opening the dev server from another device by IP address over plain `http` blocks the camera.
- **Demo:** Log a Reading → Heart rate → Start → face a light, sit still 20 s → Use this value → Save reading.

### Daily check-in

- Each indicator has a check interval in `data/checkin.js` (24 hours for all six today).
- `engine/checkin.js` → `getFreshness(reading, type, now)` says whether the latest reading is older than its interval (`due`), and `getTodayProgress(db, astronautId, now)` counts how many are fresh.
- On the dashboard a due (or missing) reading shows a gray **DUE** card: "Not measured today", the last value and its age, and a **Log now** button. A due reading never shows OK, and it does not count toward the green / yellow / red summary. The top shows "Today's check-in: X of 6 done" and the summary line counts the checks due.
- Old readings are kept. Trends, Profile and the Report to Ground still use the full history (the report shows each value's age).

### Preferences

Saved in `localStorage` under their own key (`orbitcare.preferences.v1`) through `store/storage.js`, separate from mission data, so **Reset demo data** never clears them and data saved before preferences existed keeps working.

- **Theme**: `<html data-theme="dark|light">`. Only elements inside `.oc-app` follow it (see `index.css`); the top bar and Emergency mode use `.oc-dark` to stay dark, and the crew picker is outside `.oc-app` so it never changes.
- **Temperature unit**: display only. Readings, thresholds and the status engine stay in °C; `formatValue` / `formatSensor` take an optional unit.
- **Master alarm sound** (key `alertSound`, default On): Off = the red bar still shows, without sound.
- **Presenter button**: Shift+P shows / hides it.
- **Animations** (default On): page transitions, startup screen, micro-animations. Also exposed as `useMission().animationsPreference`.

### Animations (motion / Framer Motion)

All motion goes through `components/motion.jsx`. `useAnimationsEnabled()` is the single check: Settings → Animations is On **and** the OS "reduce motion" setting is off. When it is false everything appears instantly; `<html data-motion="off">` and a `prefers-reduced-motion` rule in `index.css` also switch off CSS transitions.

- **Page transitions** (`Layout.jsx`): only the main content animates. Exit = fade out 150 ms; enter = fade in + slide up 8 px, 250 ms ease-out. Sidebar and top bar stay still.
- **Startup screen** (`StartupScreen.jsx`): once per browser session (`sessionStorage`), about 1.5 s, click or any key skips.
- **Crew picker → dashboard** (`App.jsx`): the clicked card grows to 1.03 and brightens for 150 ms, then the app fades. `CrewPicker.jsx` itself is unchanged; a wrapper handles the effect.
- **Micro-animations**: dashboard cards and panels stagger in 40 ms apart (`StaggerItem`), status pills and card borders fade between colours, the check-in bar animates its width, the Presenter panel and expanding rows (Radiation events, shelter steps) slide/fade in 200 ms (`Collapse`), buttons shrink slightly when pressed.
- **Emergency mode opens instantly**: `/emergency` is outside the animated layout.
- Every animation is under 300 ms except the startup screen.

## How data flows

```
form (LogReading.jsx)
  -> addReading({ astronautId, type, value, source, timestamp })   store/storage.js
  -> db in MissionContext, saved to localStorage on every change
  -> getStatus(type, value, astronaut, missionState)               engine/status.js
  -> StatusCard / charts / report
```

- **Every reading goes through `addReading`.** `source` is `'manual'`, `'device'` or `'sensor'`. To add the simulated wearable, call `addReading` from a timer with `source: 'device'`. No UI change is needed.
- `useMission()` gives components: `db`, `astronaut`, `environment`, `missionDay`, `comms`, `responseLevel`, `missionState`, `sensors`, and the actions `addReading`, `addRecord`, `removeRecord`, `selectAstronaut`, `setEnvironment`, `setMissionDay`, `setStorm`, `setCo2Spike`, `logSymptom`, `resetDemo`, `getCheckContext`.
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
3. **R**: Presenter panel → Trigger solar storm → the Habitat panel turns red with shelter advice for the current location → Emergency → Radiation storm. (Simulated, and labelled SIMULATED.)
4. **R, real data**: Radiation page → "Space weather (NASA)": live status (QUIET / ELEVATED / ACTIVE), a 30-day timeline of real NASA events, and what each one means at the current location. Switch location on Mission setup (ISS → Mars) and watch the "matters here" tags change.
5. **Report**: finish any emergency to see the packaged report and the reply estimate.
6. **Check-in**: Maya's dashboard → a DUE card → Log now → back to the dashboard: the card turns green and the check-in count goes up.
7. **Next day**: Presenter panel → Next day. Mission day goes up by one and every dashboard card shows DUE ("Today's check-in: 0 of 6 done").

### Real vs simulated data

Judges should be able to tell them apart at a glance:

- **Real:** the Space weather (NASA) panel on `/radiation`. Its label reads `LIVE · NASA DONKI · updated X min ago` when it has just fetched, `CACHED · <time>` when NASA cannot be reached (last good data from `localStorage`), or `OFFLINE` if it has never fetched on this device.
- **Simulated:** the cabin / radiation sensors (Habitat panel, "Radiation right now"), the Presenter panel's solar storm and CO₂ spike, the symptom-checker steps that read them, the Habitat section of the Report to Ground, and the "Crew alerted" box in Emergency mode. Each carries a gray **SIMULATED** tag.

### Live NASA space weather (engine/spaceWeather.js, store/SpaceWeatherContext.jsx)

- Four DONKI feeds for the last 30 days: solar flares (`FLR`), solar energetic particles (`SEP`), geomagnetic storms (`GST`) and NASA's space weather alerts (`notifications`: CMEs, radiation belt enhancements, shocks; weekly reports and auto-generated duplicates are skipped).
- `SpaceWeatherProvider` (in `App.jsx`) fetches once when the app opens and then every 10 minutes, for every page. Components call `useSpaceWeather()`.
- `https://api.nasa.gov/DONKI/...` with `VITE_NASA_API_KEY` (or `DEMO_KEY`); falls back to `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/...` (no key). Each feed is independent: if one fails (e.g. NASA's FLR endpoint was returning 404 in Nov 2026), the others still show as LIVE, the failed feed's last cached events are kept, and the panel says which feed is unavailable.
- **Status line** (`spaceWeatherSummary`): ACTIVE (X-class flare or particle event in 24 h), ELEVATED (M flare, Kp 5+ storm, particles, or a CME aimed at Earth or Mars in 3 days), or QUIET ("No major events for N days").
- **30-day timeline**: one marker per event (shape + color by kind, legend with counts, hover for details).
- **What it means here** (`relevanceAt(event, location)`): each event is tagged *Matters here* / *Some effect here* / *Low impact here* for the crew's current location. Examples: geomagnetic storms and radiation belt alerts matter on the ISS but not on Mars; particle events matter most outside Earth's magnetic field; a CME counts only if NASA predicts it reaches Earth (ISS, Moon) or Mars.
- **Symptom checker**: the "Solar storms in the last 24 hours" check uses real NASA events (particles, M/X flares, Kp 5+ storms) as well as the Presenter panel's simulated storm. The step is tagged SIMULATED only when the simulated storm triggered it.
- An X-class flare or particle event in the last 24 hours shows a warning banner with the shelter advice for the current location.
- Never shows an error screen: on failure it shows the cached result, or an offline note. The crew explanations are OrbitCare's wording, not NASA's; the page says so.

### Check-in streaks (engine/streaks.js)

- Same day rule as the check-in: "today" = the last 24 h, "yesterday" = the 24 h before, and so on. A day is complete when all six indicators were logged in it.
- **Current streak** = consecutive complete days up to today. If today is not complete yet, it shows the run up to yesterday with "Complete today's check-in to keep it". **Best streak** = longest run in the history.
- Shown on the dashboard status strip and on `/profile`. Logging the sixth check-in of the day shows a short toast: "Check-in complete · N-day streak". Nothing is ever locked behind a streak.
- Works with the Presenter **Next day** button (history moves 24 h back, so today starts empty and the streak shows yesterday's run).

### Master alarm (engine/alarm.js, components/MasterAlarm.jsx)

A red condition is active when any of these is true: the latest (non-due) reading of a vital is red; a cabin sensor is red (simulated, labelled so); NASA's 24-hour warning is active (X-class flare or SEP); Emergency mode is open.

- While active: slim red bar at the top of every page ("MASTER ALARM · Heart rate 130 bpm · ...") and a two-tone alarm every 2 s (Web Audio, offline).
- **Acknowledge** silences the sound; the bar stays ("Acknowledged"). A new red condition (including a new red reading) sounds again.
- Opening Emergency mode: three rising beeps, then the repeating alarm. The page opens instantly; sound never delays it.
- Everything clear: sound stops, the bar shows "All clear" for 5 s, then disappears. Switching crew member stops the alarm.
- Browsers only play sound after the user has clicked or typed on the page once.

### Next day (Presenter panel)

`advanceDay(db)` in `store/storage.js` (exposed as `useMission().advanceDay`): mission day +1 (capped at the location's maximum), and every stored reading, event and symptom log moves 24 hours into the past. Nothing is deleted, so Trends, Profile and the Report to Ground keep the full history, but every reading is now over a day old, so all daily check-ins are due.

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

### Planned features

These lists used to show inside the app ("Not built yet" boxes). They live here now so the UI shows only working features.

**Radiation (`pages/Radiation.jsx`)**
- [ ] Full-screen solar storm alert that appears on every page when radiation turns red
- [ ] Step-by-step shelter checklist that changes with the location (station, spacecraft, Moon, Mars)
- [ ] Crew roll call: tick off each crew member as they reach the shelter
- [ ] All-clear message when the level is back in the green
- [ ] Pitch only: each astronaut's lifetime dose tracked against the career limit

**Isolation (`pages/Isolation.jsx`)**
- [x] Memory bank: family photos, video and voice messages, delivered in family drops
- [x] Countdown to the next family drop (shows when a message has a dropDay after the current mission day; all demo messages have already arrived)
- [x] When mood is low for 3 check-ins, the dashboard suggests opening the memory bank (pick Aiko Tanaka to see it)
- [x] The memory bank is always open. Never locked behind health tasks
- [ ] Pitch only: private journal

**Gravity (`pages/Gravity.jsx`)**
- [ ] Jump visual: a figure that jumps higher and lands slower in low gravity (height = Earth jump ÷ gravity)
- [ ] Bone-loss meter that rises with days in low gravity and slows when exercise is logged
- [ ] Daily exercise log (needs a new reading type or a separate exercise list in storage)
- [ ] Hydration reminders
- [ ] Landing checklist before arriving at Mars or returning to Earth: fluids, balance, readiness
- [ ] Pitch only: stand-up test (heart rate and blood pressure lying down, then standing)

**Environment (`pages/Environment.jsx`)**
- [ ] Sensor history: how long each value has been out of range (e.g. "CO₂ has been high for 6 hours")
- [ ] Crew illness alert: when one person logs a fever, tell everyone to clean shared surfaces and check their temperature
- [ ] Body clock helper: fixed sleep and wake times with lighting reminders
- [ ] Pitch only: dust check after surface activity on the Moon or Mars

### Stub symptom trees to expand

- [ ] Dizziness, Nausea, Fatigue, Low mood (2-3 nodes each now).

### Not built yet

- [ ] Simulated wearable ("Connect device" toggle that calls `addReading` with `source: 'device'`).
- [ ] Measurement reminders on a schedule (the dashboard already shows which checks are due).
- [ ] Sensor history. Sensors only keep their current value, so the app cannot yet say "high for 6 hours".
- [ ] Crew alert is only a banner in Emergency mode. Nothing is sent to other profiles.
- [ ] Body map, streaks and points.
- [ ] The mood questions (stress, energy, loneliness) are saved in `reading.extra` but nothing uses them yet.
- [ ] Phone layout. The app is built for a laptop screen.


## Use of AI (Super Intelligence) tools

- **Code:** much of the app was written with help from Claude (Anthropic) via Claude Code. `CLAUDE.md` holds the instructions we gave it. The team designed, reviewed and tested all code.
- **Data:** `demo/SYNTHETIC_medical_record_Daniel_Reyes.pdf` is synthetic test data generated with AI help. It is not a real patient.
- **In the product:** the optional AI health assistant and medical-record extraction use the Claude API (claude-sonnet-5-5).
- No NASA logos, insignia or mission identifiers were generated or modified with AI.
- **Images:** the OrbitCare logo (OrbitCare Orbital Star Logo.png) and the login page background were AI-generated.