import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getStreaks } from '../engine/streaks.js'
import { useMission } from '../store/MissionContext.jsx'
import { DURATION, useAnimationsEnabled } from './motion.jsx'

const SHOW_MS = 4000

// Short, quiet confirmation when the sixth check-in of the day is logged:
// "Check-in complete · 6-day streak". Mounted once for the whole app (App.jsx).
export default function StreakToast() {
  const { db, astronaut } = useMission()
  const animate = useAnimationsEnabled()
  const streak = astronaut ? getStreaks(db, astronaut.id) : null
  const previous = useRef({ id: astronaut?.id, complete: streak?.todayComplete })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!astronaut || !streak) return
    const prev = previous.current
    // Only when today flips from incomplete to complete for the same astronaut
    // (not on first load, and not when switching crew member).
    if (prev.id === astronaut.id && prev.complete === false && streak.todayComplete) {
      setMessage(`Check-in complete · ${streak.current}-day streak`)
    }
    previous.current = { id: astronaut.id, complete: streak.todayComplete }
  }, [astronaut, streak?.todayComplete, streak?.current])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), SHOW_MS)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded border border-oc-green/60 bg-[#0b1e3a] px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40"
            initial={animate ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0, transition: { duration: animate ? DURATION.open : 0 } }}
            exit={{ opacity: 0, transition: { duration: animate ? DURATION.exit : 0 } }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-oc-green text-xs text-oc-paper" aria-hidden="true">
              ✓
            </span>
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
