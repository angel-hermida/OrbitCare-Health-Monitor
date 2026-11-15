# OrbitCare – instructions for Claude

Astronaut health-monitoring web app for NASA Space Apps Challenge 2026. React 19 + Vite + Tailwind v4, offline-first, all data in `localStorage`. Read `README.md` for the file map, data flow and demo script.

## Protected

- **`src/pages/CrewPicker.jsx` must not change** unless the task explicitly says so. Before changing anything it uses (`components/Logo.jsx`, the `.oc-space` / `.oc-earth` / `.oc-horizon` styles and the Inter setup in `index.css`), check that its look and behaviour stay the same.
- End every task with the line **"Crew picker affected: YES or NO"**. If YES, list exactly what changed and why.

## Scope

- Do only what the task asks. Don't change thresholds, status-colour logic, symptom-tree structure (ids, node types, yes/no links), sensor logic or the demo seed unless the task says so.
- Text-only tasks: change strings only. No ids, numbers or logic.
- Don't change what existing buttons, links or forms do.
- The app must keep working offline. No new runtime network calls except NASA DONKI (`engine/spaceWeather.js`) and the optional Claude API assistant (`engine/assistant/claude.js`, only when used).

## Design

- Follow `design/style-guide.webp` and the class strings in `src/components/ui.js`.
- Colours: the `oc-*` palette tokens in `src/index.css`. Fonts: Inter for text, DM Mono for large numbers (bundled with `@fontsource`, no web fonts).
- Green / yellow / red only for health status and the EMERGENCY button.
- Panels: 1px border, corners 4px max. Section titles use `components/PageTitle.jsx` (one red word, thin blue rule).
- Both themes must work: dark (default) and light (`<html data-theme="light">`, scoped to `.oc-app`). The top bar and Emergency mode stay dark (`.oc-dark`).
- Tailwind only keeps class names written out in full. Never build class names from pieces.

## Honest labels

- Real NASA data: `LIVE · NASA DONKI` when just fetched, `CACHED · <time>` when offline.
- Anything simulated (cabin sensors, Presenter panel storm / CO₂ spike and everything they affect) carries the gray **SIMULATED** tag (`SimulatedTag` in `components/StatusPill.jsx`).
- Never label simulated data as live.
- No developer notes in the UI ("TODO", "placeholder", "not built", "Try it"). Planned features go in `README.md`.

## Wording

- Short operational mission language, like a flight checklist. Simple enough for non-doctors.
- No casual phrases. Nothing that doesn't work in space (use "stay restrained", "rover operations", "EVA", "glucose gel").
- Medical escalation goes to "the crew medical officer (CMO)".

## Every task

1. Run `npm run build` and fix all errors (also `npm run check` if `src/engine/personalize.js`, `status.js` or `store/storage.js` changed).
2. Update `README.md` when files, routes, features or demo steps change.
3. List every file changed or created.
4. State "Crew picker affected: YES or NO".

## Setup notes

- On Windows PowerShell, `npm` may be blocked by the script policy: use `npm.cmd run dev`.
- NASA API key: `VITE_NASA_API_KEY` in `.env` (gitignored). **Never commit `.env`.** Restart the dev server after changing it.
- Work on a feature branch (e.g. `ui/...`) and merge into `main` with a pull request.
