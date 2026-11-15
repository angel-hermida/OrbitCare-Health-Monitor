// Offline checks for the AI assistant tools (no API key, no network).
// Run: npm run check:assistant
// Uses the demo seed (synthetic astronauts only).

import assert from 'node:assert/strict'
import { createSeedDb } from '../src/engine/seed.js'
import { linearTrend } from '../src/engine/assistant/trend.js'
import { createTools, TOOL_DEFINITIONS } from '../src/engine/assistant/tools.js'
import { trimHistory } from '../src/engine/assistant/claude.js'
import { getResponseLevel, getComms } from '../src/engine/responseLevel.js'
import { ENVIRONMENTS } from '../src/data/environments.js'
import { addRecord, findAstronaut } from '../src/store/storage.js'

const now = Date.now()
let db = createSeedDb(now)
const comms = getComms('iss', 120)
const missionState = { responseLevel: getResponseLevel(comms), comms, environment: ENVIRONMENTS.iss, gravity: 0 }
let navigated = null
const toolsFor = (id) => createTools(() => ({ db, astronaut: findAstronaut(db, id), missionState, tempUnit: 'C', navigate: (r) => (navigated = r), now }))
const pass = (msg) => console.log('  ok  ' + msg)

// 1. No tool accepts an astronaut id -> the model cannot request another crew member's data.
for (const t of TOOL_DEFINITIONS) {
  const props = Object.keys(t.input_schema.properties || {})
  assert.ok(!props.some((p) => /astronaut|crew|user|id/i.test(p)), `${t.name} must not take an id`)
}
pass('no tool takes an astronaut / user id')

// 2. Current vitals are real values with timestamps and units.
const daniel = toolsFor('a2')
const v = daniel.run('get_current_vitals').result
assert.equal(v.astronaut, 'Daniel Reyes')
const sleep = v.vitals.find((x) => x.indicator === 'sleep')
const realSleep = db.readings.filter((r) => r.astronautId === 'a2' && r.type === 'sleep').sort((a, b) => b.timestamp - a.timestamp)[0]
assert.equal(sleep.value, realSleep.value)
assert.ok(sleep.timestamp && sleep.unit === 'h')
assert.ok(v.notTrackedByOrbitCare.some((s) => s.includes('SpO2')))
pass(`current vitals match stored data (Daniel sleep ${sleep.display}, status ${sleep.status})`)

// 3. Isolation: tools for Daniel never return Maya's readings.
const maya = toolsFor('a1')
const hD = daniel.run('get_history', { indicator: 'heartRate', hours: 720 }).result
const hM = maya.run('get_history', { indicator: 'heartRate', hours: 720 }).result
const danielTimes = new Set(db.readings.filter((r) => r.astronautId === 'a2' && r.type === 'heartRate').map((r) => new Date(r.timestamp).toISOString() + r.value))
assert.ok(hD.readings.every((r) => danielTimes.has(r.timestamp + r.value)))
assert.notDeepEqual(hD.readings.map((r) => r.value), hM.readings.map((r) => r.value))
pass('history is scoped to the signed-in astronaut')

// 4. History comparison and missing data.
assert.ok(hD.latestVsPrevious && hD.summary.heartRate.average)
const hMayaBs = maya.run('get_history', { indicator: 'bloodSugar', hours: 24 }).result
assert.equal(hMayaBs.readingsInWindow, 0)
assert.ok(hMayaBs.note.startsWith('No readings in the last 24 h'))
pass('history gives min / avg / max, latest vs previous, and flags a gap (Maya blood sugar)')

// 5. Range check flags Daniel's short sleep.
const ranges = daniel.run('check_ranges').result
const sleepRange = ranges.items.find((i) => i.indicator === 'sleep')
assert.notEqual(sleepRange.status, 'OK')
pass(`range check flags Daniel sleep as ${sleepRange.status}`)

// 6. Trend: needs >= 5 points, labels the forecast ESTIMATED, caps the horizon.
assert.equal(linearTrend([{ t: now, y: 1 }, { t: now - 1e8, y: 2 }]).ok, false)
const rising = Array.from({ length: 10 }, (_, i) => ({ t: now - (9 - i) * 864e5, y: 60 + i + (i % 2 ? 0.3 : -0.3) }))
const tr = linearTrend(rising, { horizonDays: 30, now })
assert.equal(tr.direction, 'rising')
assert.equal(tr.forecast.label, 'ESTIMATED')
assert.ok(tr.forecast.horizonDays <= 4.5 && tr.horizonCapped)
const flat = linearTrend(Array.from({ length: 10 }, (_, i) => ({ t: now - i * 864e5, y: 60 + (i % 2 ? 1 : -1) })), { now })
assert.equal(flat.direction, 'no clear trend')
const bp = daniel.run('analyze_trend', { indicator: 'bloodPressure' }).result
assert.ok(bp.trend.systolic.ok && bp.trend.diastolic.ok)
pass(`trend: refuses with < 5 points, detects rising (+${tr.slopePerDay}/day), flat = no clear trend, BP split into 2 parts`)

// 7. Medical records: empty is explicit; a new record is visible at once; scoped per astronaut.
let rec = daniel.run('get_medical_records').result
assert.equal(rec.uploadedRecordCount, 0)
assert.match(rec.reminder, /Do not conclude/)
db = addRecord(db, { astronautId: 'a2', fileName: 'SYNTHETIC_bloodwork.pdf', fileType: 'application/pdf', sizeBytes: 1, extracted: { documentDate: '2026-06-01', allergies: [{ substance: 'Penicillin', reaction: 'rash', evidence: 'Allergy: penicillin (rash)' }], labs: [], conditions: [], medications: [], exams: [], history: [] } })
rec = daniel.run('get_medical_records', { category: 'allergies' }).result
assert.equal(rec.uploadedRecords[0].allergies[0].substance, 'Penicillin')
assert.equal(maya.run('get_medical_records').result.uploadedRecordCount, 0)
pass('records: empty is not "none", new upload visible immediately, not visible to another astronaut')

// 8. Navigation only to known pages.
assert.equal(daniel.run('navigate', { page: 'trends' }).result.ok, true)
assert.equal(navigated, '/history')
assert.equal(daniel.run('navigate', { page: 'admin' }).result.ok, false)
pass('navigation opens known routes only')

// 9. History trimming keeps whole exchanges.
const h = []
for (let i = 0; i < 12; i++) h.push({ role: 'user', content: 'q' + i }, { role: 'assistant', content: [{ type: 'text', text: 'a' }] })
const t = trimHistory(h, 8)
assert.equal(t[0].content, 'q4')
pass('conversation history trims to the last 8 exchanges')

console.log('All assistant checks passed.')
