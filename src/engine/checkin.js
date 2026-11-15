// Daily check-in: is a reading recent enough to trust, or is a new one due?
// Intervals live in data/checkin.js. Old readings stay stored; this only decides what the
// dashboard shows as current.

import { CHECK_INTERVAL_HOURS } from '../data/checkin.js'
import { INDICATOR_ORDER } from '../data/thresholds.js'
import { latestReading } from '../store/storage.js'

const HOUR = 60 * 60 * 1000

// reading may be null (never measured). Returns { due, hoursOld } (hoursOld is null with no reading).
export function getFreshness(reading, type, now = Date.now()) {
  if (!reading) return { due: true, hoursOld: null }
  const hoursOld = (now - reading.timestamp) / HOUR
  const interval = CHECK_INTERVAL_HOURS[type] ?? 24
  return { due: hoursOld > interval, hoursOld }
}

// How many of today's checks are done for one astronaut. Returns { done, total }.
export function getTodayProgress(db, astronautId, now = Date.now()) {
  let done = 0
  for (const type of INDICATOR_ORDER) {
    if (!getFreshness(latestReading(db, astronautId, type), type, now).due) done += 1
  }
  return { done, total: INDICATOR_ORDER.length }
}
