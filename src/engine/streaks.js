// Check-in streaks. Same day rule as the daily check-in (engine/checkin.js): "today" is the last
// 24 hours, "yesterday" the 24 hours before that, and so on. A day is complete when all six
// indicators were logged in it. Because days are counted back from `now`, the Presenter "Next day"
// button (which moves all history 24 h into the past) works without any special case.
// Streaks are only shown; nothing in the app is locked or hidden behind them.

import { INDICATOR_ORDER } from '../data/thresholds.js'
import { getReadings } from '../store/storage.js'

const DAY = 24 * 60 * 60 * 1000

// Day index of a timestamp: 0 = the last 24 h, 1 = the 24 h before, ... (null for future times).
const dayIndex = (timestamp, now) => (timestamp > now ? null : Math.floor((now - timestamp) / DAY))

// Set of day indexes on which all six indicators were logged.
function completeDays(db, astronautId, now) {
  const perType = INDICATOR_ORDER.map((type) => {
    const days = new Set()
    for (const reading of getReadings(db, astronautId, type)) {
      const d = dayIndex(reading.timestamp, now)
      if (d != null) days.add(d)
    }
    return days
  })
  const [first, ...rest] = perType
  return new Set([...first].filter((d) => rest.every((days) => days.has(d))))
}

// Returns { current, best, todayComplete }.
//   current: consecutive complete days ending today, or ending yesterday if today is not complete yet
//            (then the UI says "Complete today's check-in to keep it").
//   best:    longest run of consecutive complete days in the whole history.
export function getStreaks(db, astronautId, now = Date.now()) {
  const complete = completeDays(db, astronautId, now)
  const todayComplete = complete.has(0)

  let current = 0
  for (let d = todayComplete ? 0 : 1; complete.has(d); d++) current++

  let best = 0
  let run = 0
  const maxDay = complete.size ? Math.max(...complete) : -1
  for (let d = 0; d <= maxDay; d++) {
    run = complete.has(d) ? run + 1 : 0
    best = Math.max(best, run)
  }

  return { current, best, todayComplete }
}

export const streakLabel = (days) => `${days}-day check-in streak`
