import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { DURATION, EASE_OUT, useAnimationsEnabled } from './motion.jsx'
import { formatDelay } from '../engine/responseLevel.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { BTN, BTN_DANGER, BTN_OUTLINE, BTN_PRIMARY, LABEL, LEVEL_BADGE } from './ui.js'

// Floating demo controls for presenting (bottom right of every page in the main layout).
// Shift+P shows / hides the Presenter button; the choice is saved in preferences.
// Uses useMission actions (setMissionDay, advanceDay, setStorm, setCo2Spike, resetDemo). No logic of its own.
export default function PresenterPanel() {
  const { environment, missionDay, comms, responseLevel, sensors, setMissionDay, advanceDay, setStorm, setCo2Spike, resetDemo } = useMission()
  const { presenterVisible, setPreference } = usePreferences()
  const [open, setOpen] = useState(false) // lives in Layout, so it stays open while navigating
  const [confirmReset, setConfirmReset] = useState(false)
  const [dayMessage, setDayMessage] = useState('')
  const animate = useAnimationsEnabled()

  useEffect(() => {
    function onKey(event) {
      if (!event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || event.key.toLowerCase() !== 'p') return
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target.isContentEditable) return
      event.preventDefault()
      setPreference('presenterVisible', !presenterVisible)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenterVisible, setPreference])

  if (!presenterVisible) return null

  return (
    <div className="fixed right-5 bottom-5 z-30 flex flex-col items-end gap-3">
      <AnimatePresence initial={false}>
      {open && (
        <motion.section
          key="presenter-panel"
          className="w-[22rem] origin-bottom-right rounded border border-oc-border bg-oc-bg p-4 text-white shadow-2xl shadow-black/40"
          aria-label="Presenter panel"
          initial={animate ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0, transition: { duration: animate ? DURATION.open : 0, ease: EASE_OUT } }}
          exit={{ opacity: 0, y: 8, transition: { duration: animate ? DURATION.open : 0 } }}
        >
          <div className="flex items-center justify-between">
            <p className={`${LABEL} text-white`}>Presenter</p>
            <button
              onClick={() => {
                setOpen(false)
                setDayMessage('')
              }}
              className="cursor-pointer text-oc-gray hover:text-white"
              aria-label="Close presenter panel"
            >
              ✕
            </button>
          </div>

          {/* Mission day */}
          <div className="mt-3 border-t border-oc-border/40 pt-3">
            <p className={LABEL}>Mission day</p>
            {environment.usesMissionDay ? (
              <>
                <input
                  type="range"
                  min="1"
                  max={environment.maxMissionDay}
                  value={missionDay}
                  onChange={(e) => setMissionDay(Number(e.target.value))}
                  className="mt-2 w-full"
                  aria-label="Mission day"
                />
                <p className="font-mono text-sm text-white">
                  Day {missionDay} of {environment.maxMissionDay}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-oc-gray">
                <span className="font-mono text-white">Day {missionDay}</span>. The delay does not depend on the day here. Choose Spacecraft or Mars on Mission setup to see it move.
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono text-white">{formatDelay(comms)}</span>
              <span className={`rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${LEVEL_BADGE[responseLevel.id]}`}>{responseLevel.label}</span>
            </div>
          </div>

          {/* Next day: all history moves 24 h back, so every daily check-in is due */}
          <div className="mt-3 border-t border-oc-border/40 pt-3">
            <button
              className={`${BTN_PRIMARY} w-full`}
              onClick={() => {
                const nextDay = Math.min(missionDay + 1, environment.maxMissionDay)
                advanceDay()
                setDayMessage(`Day ${nextDay} started. All check-ins are due.`)
              }}
            >
              Next day
            </button>
            {dayMessage && (
              <p className="mt-2 text-sm text-white" role="status">
                {dayMessage}
              </p>
            )}
          </div>

          {/* Sensor events */}
          <div className="mt-3 grid gap-2 border-t border-oc-border/40 pt-3">
            <button className={`${BTN} w-full`} onClick={() => setStorm(!sensors.stormActive)}>
              {sensors.stormActive ? 'End solar storm' : 'Trigger solar storm'}
            </button>
            <button className={`${BTN} w-full`} onClick={() => setCo2Spike(!sensors.co2Spike)}>
              {sensors.co2Spike ? 'End CO₂ spike' : 'Trigger CO₂ spike'}
            </button>
          </div>

          {/* Reset */}
          <div className="mt-3 border-t border-oc-border/40 pt-3">
            {confirmReset ? (
              <div>
                <p className="text-sm text-white">Clear everything logged and restore the 30-day demo history?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    className={`${BTN_DANGER} flex-1`}
                    onClick={() => {
                      resetDemo()
                      setConfirmReset(false)
                    }}
                  >
                    Yes, reset
                  </button>
                  <button className={`${BTN_OUTLINE} flex-1`} onClick={() => setConfirmReset(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className={`${BTN_OUTLINE} w-full`} onClick={() => setConfirmReset(true)}>
                Reset demo data
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-oc-gray">Presenter tools for demonstrating the app. Shift+P hides this button.</p>
        </motion.section>
      )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="cursor-pointer rounded-full border border-oc-border bg-oc-bg px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-black/30 hover:bg-oc-panel"
      >
        Presenter
      </button>
    </div>
  )
}
