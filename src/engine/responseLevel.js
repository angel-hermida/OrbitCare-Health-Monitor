// Distance hazard: how long a message takes to reach Earth, and who leads when something goes wrong.
// Rule for the pitch: the farther from Earth, the earlier the app makes the crew act.

const MINUTE = 60
const MARS_CYCLE_DAYS = 780 // Earth and Mars line up about every 780 days
const HANDLING_SECONDS = 5 * MINUTE // assumed time for ground to read a report and answer

// index is used by the status engine to tighten thresholds (0 = no tightening).
export const RESPONSE_LEVELS = [
  {
    id: 'ground',
    index: 0,
    label: 'Ground-led',
    summary: 'Earth answers almost live. Flight surgeons lead.',
    redInstruction: 'Contact the flight surgeons on the ground now.',
  },
  {
    id: 'shared',
    index: 1,
    label: 'Shared',
    summary: 'Start the steps yourself while ground is notified.',
    redInstruction: 'Start the steps now. Ground is being notified and will reply after the delay.',
  },
  {
    id: 'crew',
    index: 2,
    label: 'Crew-led',
    summary: 'Help is too slow. The crew handles it and ground gets a report.',
    redInstruction: 'The crew leads this. Work with the crew medical officer now and send ground a report.',
  },
  {
    id: 'autonomous',
    index: 3,
    label: 'Fully autonomous',
    summary: 'No link to Earth. The crew is on its own, so limits are at their strictest.',
    redInstruction: 'There is no link to Earth. The crew handles this alone. The report will be sent when contact returns.',
  },
]

// One-way delay for an environment and mission day.
// Returns { seconds, blackout }.
export function getComms(envId, missionDay) {
  if (envId === 'iss') return { seconds: 0.5, blackout: false }
  if (envId === 'moon') return { seconds: 1.3, blackout: false }

  if (envId === 'spacecraft') {
    // Simple model of a 180-day trip to Mars: the delay grows from about 1 second to 20 minutes.
    const progress = Math.min(Math.max(missionDay, 0), 180) / 180
    return { seconds: 1.3 + progress * 20 * MINUTE, blackout: false }
  }

  // Mars: about 4 minutes when the planets are close, about 24 minutes when they are far apart.
  // Around the far point the Sun sits between them and contact drops out for about 2 weeks.
  const day = missionDay % MARS_CYCLE_DAYS
  const phase = day / MARS_CYCLE_DAYS
  const minutes = 4 + (20 * (1 - Math.cos(2 * Math.PI * phase))) / 2
  const blackout = Math.abs(day - MARS_CYCLE_DAYS / 2) <= 7
  return { seconds: minutes * MINUTE, blackout }
}

export function getResponseLevel({ seconds, blackout }) {
  if (blackout) return RESPONSE_LEVELS[3]
  if (seconds < 5) return RESPONSE_LEVELS[0]
  if (seconds < 15 * MINUTE) return RESPONSE_LEVELS[1]
  return RESPONSE_LEVELS[2]
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds.toFixed(1)} sec`
  const minutes = seconds / 60
  return `${minutes < 10 ? minutes.toFixed(1) : Math.round(minutes)} min`
}

export function formatDelay({ seconds, blackout }) {
  return blackout ? 'No link (blackout)' : `${formatDuration(seconds)} one way`
}

// "When will ground answer?" = there and back, plus handling time.
export function formatReplyEstimate({ seconds, blackout }) {
  if (blackout) return 'No reply possible until contact returns'
  return `Reply expected in about ${formatDuration(seconds * 2 + HANDLING_SECONDS)}`
}
