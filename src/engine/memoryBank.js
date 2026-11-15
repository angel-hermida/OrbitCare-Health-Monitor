// Memory bank logic (Isolation page). Pure functions, no storage.
//
// Messages from home travel in batches ("family drops"). A demo message arrives on its dropDay;
// messages with a later dropDay are still on their way and appear when the mission day reaches it
// (Presenter panel > Next day). A message counts as NEW for 7 mission days after it arrives,
// until the astronaut opens it.

import { MEMORY_BANK } from '../data/memoryBank.js'

export const NEW_FOR_DAYS = 7

// Demo messages for one astronaut, split into arrived (newest first) and still on the way.
export function getDemoMessages(astronautId, missionDay) {
  const mine = MEMORY_BANK.filter((m) => m.astronautId === astronautId)
  return {
    arrived: mine.filter((m) => m.dropDay <= missionDay).sort((a, b) => b.dropDay - a.dropDay),
    pending: mine.filter((m) => m.dropDay > missionDay),
  }
}

// Days until the next family drop for this astronaut, or null if nothing is on the way.
export function daysToNextDrop(pending, missionDay) {
  if (!pending.length) return null
  return Math.min(...pending.map((m) => m.dropDay)) - missionDay
}

export function isNew(message, missionDay, openedIds) {
  if (message.uplinked) return false
  if (openedIds.includes(message.id)) return false
  return missionDay - message.dropDay < NEW_FOR_DAYS
}
