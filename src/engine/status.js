// Status engine: turns a number into a color, a plain sentence and a next step.
// All numbers and wording come from data/thresholds.js. No medical content lives here.

import { THRESHOLDS, SENSOR_THRESHOLDS } from '../data/thresholds.js'

const LEVELS = ['green', 'yellow', 'red']

const round = (n) => (n == null ? null : Math.round(n * 100) / 100)

function inRange(value, [low, high]) {
  return (low == null || value >= low) && (high == null || value <= high)
}

// Shrink a range from both sides. null sides (no limit) stay null.
export function tightenRange([low, high], amount) {
  return [low == null ? null : round(low + amount), high == null ? null : round(high - amount)]
}

// The green / yellow ranges for one threshold definition at a given response level.
export function getRanges(def, levelIndex = 0) {
  const amount = (def.tightenStep || 0) * levelIndex
  return { green: tightenRange(def.green, amount), yellow: tightenRange(def.yellow, amount) }
}

// Ranges for an indicator, for charts and the profile page.
// Blood pressure returns { systolic: {...}, diastolic: {...} }.
export function getIndicatorRanges(type, levelIndex = 0) {
  const def = THRESHOLDS[type]
  if (!def.parts) return getRanges(def, levelIndex)
  const out = {}
  for (const key of Object.keys(def.parts)) out[key] = getRanges(def.parts[key], levelIndex)
  return out
}

// Check one number. Returns { level: 0 | 1 | 2, side: 'Low' | 'High' | null }.
function checkOne(value, def, baselineValue, levelIndex) {
  const { green, yellow } = getRanges(def, levelIndex)

  // 1. Absolute safety limits
  let absolute = 0
  let side = null
  if (!inRange(value, green)) {
    side = green[0] != null && value < green[0] ? 'Low' : 'High'
    absolute = inRange(value, yellow) ? 1 : 2
  }

  // 2. Distance from this astronaut's own Earth baseline
  let deviation = 0
  if (baselineValue != null && def.baseline) {
    const diff = value - baselineValue
    const ignore = def.baseline.direction === 'low' && diff > 0
    if (!ignore) {
      if (Math.abs(diff) >= def.baseline.red) deviation = 2
      else if (Math.abs(diff) >= def.baseline.yellow) deviation = 1
      if (deviation > 0 && !side) side = diff < 0 ? 'Low' : 'High'
    }
  }

  // 3. Combine. A baseline shift can raise the result by one step at most,
  //    so a reading inside the safe range never jumps straight to red.
  const level = Math.max(absolute, Math.min(deviation, absolute + 1))
  return { level, side: level === 0 ? null : side }
}

// Main entry point.
// missionState needs { responseLevel: { index, redInstruction } } (see store/MissionContext.jsx).
// Returns { level, message, action, side, escalate }.
export function getStatus(type, value, astronaut, missionState) {
  const def = THRESHOLDS[type]
  const levelIndex = missionState?.responseLevel?.index ?? 0
  const baseline = astronaut?.baseline?.[type]

  let result
  if (def.parts) {
    // Two-number indicators (blood pressure): the worse part decides.
    result = { level: 0, side: null }
    for (const key of Object.keys(def.parts)) {
      const part = checkOne(value[key], def.parts[key], baseline?.[key], levelIndex)
      if (part.level > result.level) result = part
    }
  } else {
    result = checkOne(value, def, baseline, levelIndex)
  }

  const level = LEVELS[result.level]
  const text = def.text[level === 'green' ? 'green' : level + result.side]
  let action = text.action
  if (level === 'red' && missionState?.responseLevel) {
    action += ' ' + missionState.responseLevel.redInstruction
  }
  return { level, message: text.message, action, side: result.side, escalate: level === 'red' }
}

// Status for a cabin / radiation sensor. Returns { level, action }.
export function getSensorStatus(key, value) {
  const def = SENSOR_THRESHOLDS[key]
  let level = 'green'
  if (!inRange(value, def.green)) level = inRange(value, def.yellow) ? 'yellow' : 'red'
  return { level, action: level === 'green' ? '' : def.actions[level] }
}

export function formatSensor(key, value) {
  const def = SENSOR_THRESHOLDS[key]
  return `${value.toFixed(def.decimals)} ${def.unit}`
}

// Human-readable value, e.g. "118/76 mmHg", "36.8 °C (98.2 °F)".
export function formatValue(type, value) {
  if (value == null) return '—'
  switch (type) {
    case 'bloodPressure':
      return `${value.systolic}/${value.diastolic} mmHg`
    case 'temperature':
      return `${value.toFixed(1)} °C (${((value * 9) / 5 + 32).toFixed(1)} °F)`
    case 'sleep':
      return `${value.toFixed(1)} h`
    case 'mood':
      return `${value} / 5`
    default:
      return `${value} ${THRESHOLDS[type].unit}`
  }
}
