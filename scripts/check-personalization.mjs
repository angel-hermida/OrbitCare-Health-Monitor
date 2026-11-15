// Quick logic checks for personalization. Run: npm run check   (no test framework needed)
import assert from 'node:assert/strict'
import { CREW } from '../src/data/crew.js'
import { THRESHOLDS } from '../src/data/thresholds.js'
import { attentionProfile, bmi, estimateBaseline, applyOverrides } from '../src/engine/personalize.js'
import { getStatus } from '../src/engine/status.js'
import { addAstronaut, addReading, allAstronauts, findAstronaut, getReadings, removeAstronaut, updateAstronaut } from '../src/store/storage.js'

const ms = { responseLevel: { index: 0, redInstruction: '' } }
const inGreen = (def, v) => v >= (def.green[0] ?? -Infinity) && v <= (def.green[1] ?? Infinity)

// 1. Demo presets keep the standard attention level, so the demo script is unchanged.
for (const a of CREW) assert.equal(attentionProfile(a).scale, 1, `${a.name} should be standard`)

// 2. Estimated baselines stay inside the green ranges for a wide range of profiles.
for (const age of [20, 35, 50, 65, 80]) for (const gender of ['Female', 'Male', 'Other']) for (const [w, h] of [[50, 175], [70, 170], [110, 170]]) {
  const b = estimateBaseline({ age, gender, weightKg: w, heightCm: h })
  assert.ok(inGreen(THRESHOLDS.heartRate, b.heartRate), 'HR baseline in green')
  assert.ok(inGreen(THRESHOLDS.bloodPressure.parts.systolic, b.bloodPressure.systolic), 'SBP baseline in green')
  assert.ok(inGreen(THRESHOLDS.bloodPressure.parts.diastolic, b.bloodPressure.diastolic), 'DBP baseline in green')
  assert.ok(inGreen(THRESHOLDS.bloodSugar, b.bloodSugar), 'glucose baseline in green')
}

// 3. Same reading, different profile -> different attention.
const young = { age: 30, gender: 'Male', weightKg: 75, heightCm: 178, baseline: { heartRate: 62 } }
const older = { age: 62, gender: 'Male', weightKg: 105, heightCm: 172, medical: { conditions: ['hypertension'] }, baseline: { heartRate: 62 } }
assert.equal(attentionProfile(older).label, 'High')
assert.equal(getStatus('heartRate', 80, young, ms).level, 'green')
assert.equal(getStatus('heartRate', 80, older, ms).level, 'yellow')

// 4. Overrides replace estimates; blanks keep them.
const est = estimateBaseline({ age: 40, gender: 'Female', weightKg: 60, heightCm: 165 })
const merged = applyOverrides(est, { heartRate: '55', systolic: '' })
assert.equal(merged.heartRate, 55)
assert.equal(merged.bloodPressure.systolic, est.bloodPressure.systolic)

// 5. Storage: a custom astronaut is saved, found, and old dbs without the field still work.
let db = { readings: [], events: [], symptoms: [], settings: {} }
const res = addAstronaut(db, { name: 'Test Pilot', role: 'Pilot', age: 40, gender: 'Female', weightKg: 60, heightCm: 165, medical: { conditions: ['asthma'] } }, { heartRate: '55' })
assert.equal(allAstronauts(res.db).length, CREW.length + 1)
assert.equal(findAstronaut(res.db, res.astronaut.id).baseline.heartRate, 55)
assert.equal(res.astronaut.baselineSource, 'partly entered')
assert.equal(allAstronauts(db).length, CREW.length)

// 6. Edit a custom astronaut: details, baselines and medical history change; id and readings stay.
db = addReading(res.db, { astronautId: res.astronaut.id, type: 'heartRate', value: 60 })
const profile2 = { name: 'Test Pilot', role: 'Commander', age: 41, gender: 'Female', weightKg: 62, heightCm: 165, medical: { conditions: [] } }
db = updateAstronaut(db, res.astronaut.id, profile2, { heartRate: '58' })
const edited = findAstronaut(db, res.astronaut.id)
assert.equal(edited.role, 'Commander')
assert.equal(edited.baseline.heartRate, 58)
assert.equal(edited.medical.conditions.length, 0)
assert.equal(edited.baselineSource, 'edited')
assert.equal(getReadings(db, edited.id).length, 1)

// 7. Edit a PRESET astronaut: only that astronaut changes, the constant in crew.js is untouched.
const maya = CREW[0]
const db2 = updateAstronaut(db, maya.id, { ...maya, medical: { conditions: ['asthma'] } }, { heartRate: '60' })
assert.equal(findAstronaut(db2, maya.id).baseline.heartRate, 60)
assert.deepEqual(findAstronaut(db2, maya.id).medical.conditions, ['asthma'])
assert.equal(maya.baseline.heartRate, 62)
assert.equal(findAstronaut(db2, CREW[1].id).baseline.heartRate, CREW[1].baseline.heartRate)

// 8. Remove a custom astronaut: profile, readings and symptoms go; signed-in user is cleared.
let db3 = { ...db, symptoms: [{ astronautId: edited.id, symptom: 'headache' }, { astronautId: 'a1', symptom: 'x' }], settings: { astronautId: edited.id } }
db3 = removeAstronaut(db3, edited.id)
assert.equal(findAstronaut(db3, edited.id), null)
assert.equal(getReadings(db3, edited.id).length, 0)
assert.equal(db3.symptoms.length, 1)
assert.equal(db3.settings.astronautId, null)
assert.equal(allAstronauts(db3).length, CREW.length)

// 9. Remove a PRESET astronaut: hidden everywhere, others untouched, edits cleaned up.
const db4 = removeAstronaut(db2, maya.id)
assert.equal(findAstronaut(db4, maya.id), null)
assert.equal(allAstronauts(db4).length, CREW.length) // 4 presets - 1 + the custom one
assert.ok(!db4.edits?.[maya.id])
assert.equal(removeAstronaut(db4, 'does-not-exist'), db4)

console.log('All personalization checks passed. BMI example:', bmi(older).toFixed(1))
