// Symptom Checker engine. Trees live in data/symptomTrees.js.
// This file knows how to (1) answer "data" nodes from app data and (2) walk a tree.

import { SENSOR_THRESHOLDS } from '../data/thresholds.js'
import { realStormLast24h } from './spaceWeather.js'
import { timeAgo } from './time.js'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Newest reading of a type from ctx.readings (the current astronaut's readings, oldest first).
function latest(ctx, type) {
  for (let i = ctx.readings.length - 1; i >= 0; i--) {
    if (ctx.readings[i].type === type) return ctx.readings[i]
  }
  return null
}

function lastN(ctx, type, n) {
  return ctx.readings.filter((r) => r.type === type).slice(-n)
}

function sleepUnder6(ctx) {
  const reading = latest(ctx, 'sleep')
  if (!reading) return { result: false, detail: 'No sleep logged yet.' }
  const short = reading.value < 6
  return { result: short, detail: `Last sleep: ${reading.value.toFixed(1)} h${short ? ' (under 6 h).' : '.'}` }
}

function lowMood3d(ctx) {
  const moods = lastN(ctx, 'mood', 3)
  const low = moods.length === 3 && moods.every((r) => r.value <= 2)
  const list = moods.map((r) => r.value).join(', ') || 'none logged'
  return { result: low, detail: `Last mood check-ins: ${list}${low ? ' (low 3 times in a row).' : '.'}` }
}

// Every check gets ctx = { sensors, events, readings, environmentChangedAt, now }
// and returns { result: true | false, detail: 'what the user sees' }.
// To add a check: add a function here, then use its key in a tree's data node.
export const DATA_CHECKS = {
  co2High: {
    label: 'Cabin CO₂ level',
    simulated: true, // reads the simulated cabin sensor
    run(ctx) {
      const limit = SENSOR_THRESHOLDS.co2.green[1]
      const value = Math.round(ctx.sensors.co2)
      const high = value > limit
      return { result: high, detail: `CO₂ is ${value} ppm. ${high ? `That is above the ${limit} ppm limit.` : 'That is normal.'}` }
    },
  },
  stormLast24h: {
    label: 'Solar storms in the last 24 hours',
    // Two sources: real NASA DONKI events (cached by the app, see engine/spaceWeather.js) and the
    // simulated storm from the Presenter panel. The step is tagged SIMULATED only when the simulated
    // storm is what triggered it.
    run(ctx) {
      const simulatedNow = ctx.sensors.stormActive
      const simulatedRecent = ctx.events.some((e) => e.type === 'solarStorm' && ctx.now - e.timestamp < DAY)
      if (simulatedNow || simulatedRecent) {
        return { result: true, simulated: true, detail: simulatedNow ? 'A simulated solar storm is active right now.' : 'There was a simulated solar storm in the last 24 hours.' }
      }
      const real = realStormLast24h(ctx.now)
      if (real) {
        return { result: true, simulated: false, detail: `NASA DONKI reported: ${real.title}${real.detail ? ` (${real.detail})` : ''}, ${timeAgo(real.time, ctx.now)}.` }
      }
      return { result: false, simulated: false, detail: 'No solar storm in the last 24 hours (NASA DONKI and simulated sensors).' }
    },
  },
  gravityChanged3d: {
    label: 'Recent change in gravity',
    run(ctx) {
      const days = (ctx.now - ctx.environmentChangedAt) / DAY
      const changed = days < 3
      return { result: changed, detail: changed ? 'You moved to a new gravity level in the last 3 days.' : `Gravity level has been the same for ${Math.floor(days)} days.` }
    },
  },
  sleepUnder6: { label: 'Last night’s sleep', run: sleepUnder6 },
  lowMood3d: { label: 'Mood over the last 3 check-ins', run: lowMood3d },
  poorSleepOrLowMood: {
    label: 'Sleep and mood logs',
    run(ctx) {
      const sleep = sleepUnder6(ctx)
      const mood = lowMood3d(ctx)
      return { result: sleep.result || mood.result, detail: `${sleep.detail} ${mood.detail}` }
    },
  },
}

// Starting at nodeId, answer every "data" node automatically until we reach
// a question or a result. Returns { nodeId, steps } where steps is what was checked.
export function followDataNodes(tree, nodeId, ctx) {
  const steps = []
  let id = nodeId
  let guard = 0
  while (tree.nodes[id] && tree.nodes[id].type === 'data' && guard++ < 50) {
    const node = tree.nodes[id]
    const check = DATA_CHECKS[node.check]
    if (!check) throw new Error(`Unknown data check "${node.check}" in symptom tree`)
    const { result, detail, simulated } = check.run(ctx)
    // A check can say per run whether its answer came from simulated data; otherwise use its default.
    steps.push({ kind: 'data', label: check.label, detail, result, simulated: simulated ?? !!check.simulated })
    id = result ? node.yes : node.no
  }
  return { nodeId: id, steps }
}
