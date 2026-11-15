// The only file that touches localStorage. Everything is stored in one object ("db"):
//   {
//     readings: [{ id, astronautId, type, value, source, timestamp, extra? }],
//     events:   [{ type: 'solarStorm' | 'co2Spike', timestamp }],
//     symptoms: [{ astronautId, symptom, title, hazards, level, timestamp }],
//     settings: { astronautId, environment, missionDay, environmentChangedAt },
//     astronauts: [custom profiles made in the app; the 4 presets live in data/crew.js],
//     edits:      { [presetId]: changed fields }   (edits to a preset astronaut),
//     removedIds: [ids of preset astronauts removed from the crew],
//   }

import { CREW } from '../data/crew.js'
import { applyOverrides, estimateBaseline } from '../engine/personalize.js'

const KEY = 'astrohealth.v1'

export const READING_TYPES = ['heartRate', 'bloodPressure', 'bloodSugar', 'temperature', 'sleep', 'mood']
export const READING_SOURCES = ['manual', 'device', 'sensor']

export function loadDb() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveDb(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // Storage can be full or blocked. The app still works for this session.
  }
  return db
}

let counter = 0
function newId() {
  counter += 1
  return `r-${Date.now().toString(36)}-${counter}`
}

// THE single entry point for health readings. Manual forms, the future wearable
// stream and the demo seed all come through here.
//   source: 'manual' | 'device' | 'sensor'
// Returns a new db (does not change the old one).
export function addReading(db, { astronautId, type, value, source = 'manual', timestamp = Date.now(), extra }) {
  if (!READING_TYPES.includes(type)) throw new Error(`Unknown reading type: ${type}`)
  if (!READING_SOURCES.includes(source)) throw new Error(`Unknown reading source: ${source}`)
  const reading = { id: newId(), astronautId, type, value, source, timestamp }
  if (extra) reading.extra = extra
  return { ...db, readings: [...db.readings, reading] }
}

// One astronaut's readings, oldest first. Pass a type to filter.
export function getReadings(db, astronautId, type) {
  return db.readings
    .filter((r) => r.astronautId === astronautId && (!type || r.type === type))
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function latestReading(db, astronautId, type) {
  const list = getReadings(db, astronautId, type)
  return list.length ? list[list.length - 1] : null
}

// ---------- Demo: jump to the next day ----------
// Presenter "Next day": mission day +1 (capped at the location's max) and every stored reading,
// event and symptom log moves 24 hours into the past. Nothing is deleted, so Trends, Profile and the
// Report to Ground keep the full history, but every reading is now over a day old, so the daily
// check-in shows all six as due. Returns a new db.
const HOURS_24 = 24 * 60 * 60 * 1000

export function advanceDay(db, maxMissionDay = Infinity) {
  const back = (item) => ({ ...item, timestamp: item.timestamp - HOURS_24 })
  const settings = db.settings
  return {
    ...db,
    readings: db.readings.map(back),
    events: (db.events ?? []).map(back),
    symptoms: (db.symptoms ?? []).map(back),
    settings: {
      ...settings,
      missionDay: Math.min(settings.missionDay + 1, maxMissionDay),
      // keep "days since the gravity changed" consistent with the shifted history
      environmentChangedAt: settings.environmentChangedAt != null ? settings.environmentChangedAt - HOURS_24 : settings.environmentChangedAt,
    },
  }
}

// ---------- Preferences ----------
// Display choices, kept apart from the mission db so "Reset demo data" never clears them,
// and so data saved before preferences existed keeps working (missing fields use the defaults).
//   { theme: 'dark' | 'light', tempUnit: 'C' | 'F', alertSound: boolean, presenterVisible: boolean, animations: boolean }

const PREFS_KEY = 'orbitcare.preferences.v1'

export const DEFAULT_PREFERENCES = {
  theme: 'dark',
  tempUnit: 'C',
  alertSound: true,
  presenterVisible: true,
  animations: true, // page transitions, startup screen, micro-animations (see components/motion.jsx)
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    const saved = raw ? JSON.parse(raw) : {}
    return { ...DEFAULT_PREFERENCES, ...(saved && typeof saved === 'object' ? saved : {}) }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Storage can be full or blocked. Preferences still apply for this session.
  }
  return prefs
}

// ----- astronaut profiles -----

// Presets first, then custom ones. Removed presets are hidden, edited presets get their changes.
// Older saved dbs have none of these fields.
export function allAstronauts(db) {
  const removed = db.removedIds ?? []
  return [...CREW, ...(db.astronauts ?? [])]
    .filter((a) => !removed.includes(a.id))
    .map((a) => (db.edits?.[a.id] ? { ...a, ...db.edits[a.id] } : a))
}

export function findAstronaut(db, id) {
  return allAstronauts(db).find((a) => a.id === id) || null
}

// profile: { name, role, age, gender, weightKg, heightCm, medical? }
// overrides: baseline numbers the astronaut already knows (see engine/personalize.js applyOverrides).
// Returns { db, astronaut }. The baseline starts as an estimate unless overridden.
export function addAstronaut(db, profile, overrides = {}) {
  const baseline = applyOverrides(estimateBaseline(profile), overrides)
  const hasOverride = Object.values(overrides).some((v) => v !== '' && v != null)
  const astronaut = {
    ...profile,
    id: `c-${Date.now().toString(36)}`,
    custom: true,
    baseline,
    baselineSource: hasOverride ? 'partly entered' : 'estimated',
    medical: { conditions: [], medications: [], allergies: [], notes: '', ...(profile.medical || {}) },
  }
  return { db: { ...db, astronauts: [...(db.astronauts ?? []), astronaut] }, astronaut }
}

// Save changes to a profile and its baselines. Works for presets and custom astronauts.
// overrides: baseline numbers to use (see applyOverrides). Anything blank falls back to the estimate.
// Past readings are kept; they are simply rated against the new baseline from now on.
export function updateAstronaut(db, id, profile, overrides = {}) {
  const current = findAstronaut(db, id)
  if (!current) return db
  const patch = {
    ...profile,
    baseline: applyOverrides(estimateBaseline(profile), overrides),
    baselineSource: 'edited',
    baselineUpdatedAt: Date.now(),
    medical: { conditions: [], medications: [], allergies: [], notes: '', ...(profile.medical || {}) },
  }
  if (current.custom) {
    return { ...db, astronauts: db.astronauts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }
  }
  return { ...db, edits: { ...(db.edits ?? {}), [id]: patch } }
}

// Remove an astronaut from the crew and delete their readings and symptom logs.
export function removeAstronaut(db, id) {
  const current = findAstronaut(db, id)
  if (!current) return db
  const next = {
    ...db,
    readings: db.readings.filter((r) => r.astronautId !== id),
    symptoms: (db.symptoms ?? []).filter((s) => s.astronautId !== id),
    settings: db.settings.astronautId === id ? { ...db.settings, astronautId: null } : db.settings,
  }
  if (current.custom) next.astronauts = db.astronauts.filter((a) => a.id !== id)
  else next.removedIds = [...(db.removedIds ?? []), id]
  if (next.edits?.[id]) {
    const { [id]: _gone, ...rest } = next.edits
    next.edits = rest
  }
  return next
}
