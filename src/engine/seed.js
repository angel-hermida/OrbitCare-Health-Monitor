// Demo data: 30 days of history for every astronaut, so the app never demos empty.
// Uses a fixed random seed, so the story is the same every time you reset.
//
// Planted events (use these in the demo):
//   Maya Okafor   (a1): blood sugar and temperature last logged 2 days ago -> shown as DUE
//   Daniel Reyes  (a2): three short nights in a row, ending last night  -> sleep is yellow
//   Aiko Tanaka   (a3): low mood for the last four days                 -> mood is yellow
//   Sam Whitfield (a4): a two-day mild fever about 11 days ago          -> visible on the chart
//   Solar storm 9 days ago, cabin CO₂ spike 15 days ago                 -> in the events log

import { CREW } from '../data/crew.js'
import { addReading } from '../store/storage.js'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const DAYS = 30

// Small seeded random number generator (mulberry32).
function makeRandom(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (n, low, high) => Math.min(high, Math.max(low, n))
const round1 = (n) => Math.round(n * 10) / 10

export function createSeedDb(now = Date.now()) {
  const random = makeRandom(2026)
  const vary = (amount) => (random() - 0.5) * 2 * amount

  let db = {
    readings: [],
    events: [
      { type: 'co2Spike', timestamp: now - 15 * DAY },
      { type: 'solarStorm', timestamp: now - 9 * DAY },
    ],
    symptoms: [],
    settings: {
      astronautId: null,
      environment: 'iss',
      missionDay: 120,
      environmentChangedAt: now - 20 * DAY,
    },
  }

  for (const astronaut of CREW) {
    const base = astronaut.baseline
    for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo--) {
      const timestamp = now - daysAgo * DAY - HOUR // the newest reading is 1 hour old
      const shortSleep = astronaut.id === 'a2' && daysAgo <= 2
      const lowMood = astronaut.id === 'a3' && daysAgo <= 3
      const fever = astronaut.id === 'a4' && (daysAgo === 11 || daysAgo === 12)

      const moodScore = lowMood ? 2 : clamp(base.mood + (random() < 0.2 ? -1 : random() > 0.8 ? 1 : 0), 3, 5)

      const day = [
        ['heartRate', Math.round(base.heartRate + vary(4) + (shortSleep ? 6 : 0) + (fever ? 10 : 0))],
        ['bloodPressure', {
          systolic: Math.round(base.bloodPressure.systolic + vary(5)),
          diastolic: Math.round(base.bloodPressure.diastolic + vary(4)),
        }],
        ['bloodSugar', Math.round(base.bloodSugar + vary(8))],
        ['temperature', round1(fever ? 37.9 + vary(0.1) : base.temperature + vary(0.2))],
        ['sleep', round1(shortSleep ? 5.3 + vary(0.3) : base.sleep + vary(0.6))],
        ['mood', moodScore, {
          stress: lowMood ? 4 : clamp(Math.round(2 + vary(1)), 1, 5),
          energy: lowMood || shortSleep ? 2 : clamp(Math.round(4 + vary(1)), 1, 5),
          loneliness: lowMood ? 4 : clamp(Math.round(2 + vary(1)), 1, 5),
        }],
      ]

      for (const [type, value, extra] of day) {
        // Maya: blood sugar and temperature last logged 2 days ago, so the dashboard shows them as DUE.
        // (Values are still generated above, so the random sequence and all other data stay the same.)
        if (astronaut.id === 'a1' && daysAgo <= 1 && (type === 'bloodSugar' || type === 'temperature')) continue
        db = addReading(db, { astronautId: astronaut.id, type, value, source: 'manual', timestamp, extra })
      }
    }
  }

  return db
}
