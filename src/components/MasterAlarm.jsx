import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getRedConditions } from '../engine/alarm.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { useSpaceWeather } from '../store/SpaceWeatherContext.jsx'
import { playAlarmPattern, playRisingBeeps } from './alertSound.js'

const REPEAT_MS = 2000
const RISING_MS = 700 // length of the three rising beeps before the repeating alarm
const ALL_CLEAR_MS = 5000

// Master alarm for the whole app (mounted in App.jsx above every page, including Emergency mode).
// - Any red condition (engine/alarm.js): red bar at the top + a two-tone alarm every 2 s.
// - ACKNOWLEDGE silences the sound; the bar stays. A NEW red condition starts the sound again.
// - Emergency mode opening: three rising beeps first. The page itself opens instantly.
// - All conditions cleared: sound stops, "All clear" for 5 s, then the bar disappears.
// - Settings > Master alarm sound: Off = bar only, no sound.
// Unmounting (switching crew member) stops everything.
export default function MasterAlarm() {
  const { db, astronaut, missionState, sensors } = useMission()
  const { alertSound, tempUnit } = usePreferences()
  const weather = useSpaceWeather()
  const { pathname } = useLocation()

  const conditions = getRedConditions({
    db,
    astronaut,
    missionState,
    sensors,
    spaceWeatherEvents: weather.events,
    emergencyOpen: pathname === '/emergency',
    tempUnit,
  })
  const ids = conditions.map((c) => c.id)
  const idsKey = ids.join('|')

  const [acknowledged, setAcknowledged] = useState(() => new Set())
  const [allClear, setAllClear] = useState(false)
  const previousIds = useRef(new Set())
  const emergencyJustOpened = useRef(false)

  // Track what changed: forget acknowledgements of cleared conditions, note a newly opened
  // Emergency mode, and show "All clear" when the last red condition goes away.
  useEffect(() => {
    const previous = previousIds.current
    const current = new Set(ids)
    previousIds.current = current
    if (current.has('emergency') && !previous.has('emergency')) emergencyJustOpened.current = true
    setAcknowledged((ack) => {
      const kept = [...ack].filter((id) => current.has(id))
      return kept.length === ack.size ? ack : new Set(kept)
    })
    if (current.size > 0) setAllClear(false)
    else if (previous.size > 0) setAllClear(true)
  }, [idsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!allClear) return
    const timer = setTimeout(() => setAllClear(false), ALL_CLEAR_MS)
    return () => clearTimeout(timer)
  }, [allClear])

  const unacknowledged = ids.filter((id) => !acknowledged.has(id))
  const sounding = alertSound && unacknowledged.length > 0
  const unacknowledgedKey = unacknowledged.join('|')

  // The sound. Restarts when a new unacknowledged condition appears; stops on cleanup.
  useEffect(() => {
    if (!sounding) {
      emergencyJustOpened.current = false
      return
    }
    let interval
    let delay
    const repeat = () => {
      playAlarmPattern()
      interval = setInterval(playAlarmPattern, REPEAT_MS)
    }
    if (emergencyJustOpened.current) {
      emergencyJustOpened.current = false
      playRisingBeeps()
      delay = setTimeout(repeat, RISING_MS)
    } else {
      repeat()
    }
    return () => {
      clearInterval(interval)
      clearTimeout(delay)
    }
  }, [sounding, unacknowledgedKey])

  if (conditions.length === 0 && !allClear) return null

  if (conditions.length === 0) {
    return (
      <div className="flex shrink-0 items-center gap-3 bg-oc-green px-6 py-1.5 text-sm font-bold uppercase tracking-[0.2em] text-oc-paper" role="status">
        Master alarm · All clear
      </div>
    )
  }

  const allAcknowledged = unacknowledged.length === 0
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 bg-oc-alert px-6 py-1.5 text-oc-paper" role="alert">
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-black uppercase tracking-[0.2em]">Master alarm</span>
        {conditions.map((c) => (
          <span key={c.id} className="font-semibold">
            {' · '}
            {c.label}
          </span>
        ))}
      </p>
      {allAcknowledged ? (
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-oc-paper/85">Acknowledged</span>
      ) : (
        <button
          type="button"
          onClick={() => setAcknowledged(new Set(ids))}
          className="cursor-pointer rounded border-2 border-oc-paper px-3 py-0.5 text-xs font-bold uppercase tracking-[0.2em] text-oc-paper hover:bg-oc-paper/15"
        >
          Acknowledge
        </button>
      )}
    </div>
  )
}
