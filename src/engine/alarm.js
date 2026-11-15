// Master alarm: which red conditions are active right now. No React, no sound (see
// components/MasterAlarm.jsx for the bar and components/alertSound.js for the tones).
//
// A red condition is active when any of these is true:
//   - the latest reading of a vital for the current astronaut is red (due / stale readings are ignored)
//   - a cabin sensor (CO₂, temperature, humidity, noise, radiation) is red   (simulated sensors)
//   - NASA's 24-hour space weather warning is active (X-class flare or SEP event)
//   - Emergency mode is open
// Each condition has a stable `id`, so the alarm can tell a NEW red condition from one already
// acknowledged.

import { INDICATOR_ORDER, SENSOR_ORDER, SENSOR_THRESHOLDS, THRESHOLDS } from '../data/thresholds.js'
import { latestReading } from '../store/storage.js'
import { getFreshness } from './checkin.js'
import { recentHazard } from './spaceWeather.js'
import { formatSensor, formatValue, getSensorStatus, getStatus } from './status.js'

// Returns [{ id, label }], vitals first, then sensors, NASA and Emergency mode.
export function getRedConditions({ db, astronaut, missionState, sensors, spaceWeatherEvents = [], emergencyOpen = false, tempUnit = 'C', now = Date.now() }) {
  const red = []

  if (astronaut) {
    for (const type of INDICATOR_ORDER) {
      const reading = latestReading(db, astronaut.id, type)
      if (!reading || getFreshness(reading, type, now).due) continue
      if (getStatus(type, reading.value, astronaut, missionState).level === 'red') {
        // The reading id is part of the condition id: a new red reading is a new alarm.
        red.push({ id: `vital:${type}:${reading.id}`, label: `${THRESHOLDS[type].label} ${formatValue(type, reading.value, tempUnit)}` })
      }
    }
  }

  if (sensors) {
    for (const key of SENSOR_ORDER) {
      if (getSensorStatus(key, sensors[key]).level === 'red') {
        red.push({ id: `sensor:${key}`, label: `${SENSOR_THRESHOLDS[key].label} ${formatSensor(key, sensors[key], tempUnit)} (simulated)` })
      }
    }
  }

  const hazard = recentHazard(spaceWeatherEvents, now)
  if (hazard) red.push({ id: `nasa:${hazard.id}`, label: `NASA: ${hazard.flareClass ? `${hazard.flareClass} flare` : hazard.title}` })

  if (emergencyOpen) red.push({ id: 'emergency', label: 'Emergency mode active' })

  return red
}
