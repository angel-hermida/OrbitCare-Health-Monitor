// The only file that touches localStorage. Everything is stored in one object ("db"):
//   {
//     readings: [{ id, astronautId, type, value, source, timestamp, extra? }],
//     events:   [{ type: 'solarStorm' | 'co2Spike', timestamp }],
//     symptoms: [{ astronautId, symptom, title, hazards, level, timestamp }],
//     settings: { astronautId, environment, missionDay, environmentChangedAt },
//     astronauts: [custom profiles made in the app; the 4 presets live in data/crew.js],
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

// ----- astronaut profiles -----

// Presets first, then custom ones. Older saved dbs have no `astronauts` field.
export function allAstronauts(db) {
  return [...CREW, ...(db.astronauts ?? [])]
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
