// Builds the packaged "Report to Ground" text for Emergency mode.
// One message with everything the flight surgeons need, so no round trips are
// wasted on questions like "what is their heart rate?".

import { INDICATOR_ORDER, SENSOR_ORDER, SENSOR_THRESHOLDS, THRESHOLDS } from '../data/thresholds.js'
import { latestReading } from '../store/storage.js'
import { formatDelay } from './responseLevel.js'
import { formatSensor, formatValue, getSensorStatus, getStatus } from './status.js'
import { timeAgo } from './time.js'

const DAY = 24 * 60 * 60 * 1000

// tempUnit ('C' | 'F') only changes how temperatures are written.
export function buildReport({ db, astronaut, scenario, stepsDone, mission, tempUnit = 'C', now = Date.now() }) {
  const { environment, missionDay, comms, responseLevel, missionState, sensors } = mission
  const lines = []

  lines.push('REPORT TO GROUND')
  lines.push(`Sent: ${new Date(now).toISOString()}`)
  lines.push(`Location: ${environment.name}, mission day ${missionDay}`)
  lines.push(`Comms: ${formatDelay(comms)} | Response level: ${responseLevel.label}`)
  lines.push('')
  lines.push(`Crew member: ${astronaut.name} (${astronaut.role}), ${astronaut.age}, ${astronaut.gender}, ${astronaut.weightKg} kg`)
  lines.push(`Event: ${scenario.title}`)
  lines.push('')

  lines.push('Latest vitals:')
  for (const type of INDICATOR_ORDER) {
    const reading = latestReading(db, astronaut.id, type)
    if (!reading) {
      lines.push(`- ${THRESHOLDS[type].label}: no reading`)
      continue
    }
    const status = getStatus(type, reading.value, astronaut, missionState)
    lines.push(`- ${THRESHOLDS[type].label}: ${formatValue(type, reading.value, tempUnit)} [${status.level.toUpperCase()}] (${timeAgo(reading.timestamp, now)})`)
  }
  lines.push('')

  const symptoms = db.symptoms.filter((s) => s.astronautId === astronaut.id && now - s.timestamp < DAY)
  lines.push('Symptoms logged in the last 24 h:')
  if (symptoms.length === 0) lines.push('- none')
  for (const s of symptoms) lines.push(`- ${s.symptom}: ${s.title} [${s.level.toUpperCase()}] (${timeAgo(s.timestamp, now)})`)
  lines.push('')

  lines.push('Habitat:')
  for (const key of SENSOR_ORDER) {
    const status = getSensorStatus(key, sensors[key])
    lines.push(`- ${SENSOR_THRESHOLDS[key].label}: ${formatSensor(key, sensors[key], tempUnit)} [${status.level.toUpperCase()}]`)
  }
  lines.push('')

  lines.push('Actions taken by crew:')
  if (stepsDone.length === 0) lines.push('- none yet')
  stepsDone.forEach((step, i) => lines.push(`${i + 1}. ${step}`))

  return lines.join('\n')
}
