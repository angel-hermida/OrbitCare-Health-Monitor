// Quick logic checks for personalization. Run: npm run check   (no test framework needed)
import assert from 'node:assert/strict'
import { CREW } from '../src/data/crew.js'
import { THRESHOLDS } from '../src/data/thresholds.js'
import { attentionProfile, bmi, estimateBaseline, applyOverrides } from '../src/engine/personalize.js'
import { getStatus } from '../src/engine/status.js'
import { addAstronaut, allAstronauts, findAstronaut } from '../src/store/storage.js'

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

console.log('All personalization checks passed. BMI example:', bmi(older).toFixed(1))
