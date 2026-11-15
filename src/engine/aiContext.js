// Builds the plain-text summary of one astronaut that the future AI assistant receives.
// The status engine still decides colors. The AI only explains using this context.
// Add new profile or medical fields here and the AI sees them.

import { INDICATOR_ORDER, THRESHOLDS } from '../data/thresholds.js'
import { attentionProfile, bmi } from './personalize.js'
import { formatValue, getStatus } from './status.js'
import { latestReading } from '../store/storage.js'

const list = (arr) => (arr?.length ? arr.join(', ') : 'none recorded')

export function buildAstronautContext(db, astronaut, missionState) {
  const att = attentionProfile(astronaut)
  const m = astronaut.medical || {}
  const b = bmi(astronaut)
  const lines = [
    `Astronaut: ${astronaut.name}, ${astronaut.role}`,
    `Profile: age ${astronaut.age}, ${astronaut.gender}, ${astronaut.weightKg} kg, ${astronaut.heightCm ?? '?'} cm` + (b ? `, BMI ${b.toFixed(1)}` : ''),
    `Attention level: ${att.label}` + (att.reasons.length ? ` (${att.reasons.join(' ')})` : ''),
    `Medical conditions: ${list(m.conditions)}`,
    `Medications: ${list(m.medications)}`,
    `Allergies: ${list(m.allergies)}`,
    m.notes ? `Medical notes: ${m.notes}` : null,
    `Environment: ${missionState?.environment?.name ?? 'unknown'}, response level: ${missionState?.responseLevel?.label ?? 'unknown'}`,
    'Latest readings (value, Earth baseline, status):',
  ].filter(Boolean)

  for (const type of INDICATOR_ORDER) {
    const r = latestReading(db, astronaut.id, type)
    if (!r) {
      lines.push(`- ${THRESHOLDS[type].label}: no data`)
      continue
    }
    const s = getStatus(type, r.value, astronaut, missionState)
    lines.push(`- ${THRESHOLDS[type].label}: ${formatValue(type, r.value)} (baseline ${formatValue(type, astronaut.baseline[type])}) -> ${s.level}`)
  }
  const recent = (db.symptoms || []).filter((s) => s.astronautId === astronaut.id).slice(-5)
  if (recent.length) lines.push('Recent symptoms: ' + recent.map((s) => s.title || s.symptom).join(', '))
  return lines.join('\n')
}
