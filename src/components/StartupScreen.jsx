import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'

// Startup screen, once per browser session (App.jsx decides when to show it).
// Three status lines appear one by one, each gets a check, then the screen fades out (~1.5 s).
// Click anywhere or press any key to skip.

const LINES = ['Initializing systems…', 'Loading crew data…', 'Connecting to space weather feed…']
const STEP_MS = 420 // a new line every 420 ms
const CHECK_AFTER_MS = 300 // its check appears 300 ms later
const TOTAL_MS = 1500

export default function StartupScreen({ onDone }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    // A plain timer (not requestAnimationFrame, which browsers pause for hidden windows),
    // so the startup screen always finishes on time.
    const start = Date.now()
    const timer = setInterval(() => {
      const ms = Date.now() - start
      setElapsed(ms)
      if (ms >= TOTAL_MS) {
        clearInterval(timer)
        onDone()
      }
    }, 50)
    const skip = () => onDone()
    window.addEventListener('keydown', skip)
    return () => {
      clearInterval(timer)
      window.removeEventListener('keydown', skip)
    }
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#0b1e3a] text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      onClick={onDone}
      role="status"
      aria-label="OrbitCare is starting"
    >
      <Logo className="h-24 text-white" />
      <ul className="mt-10 w-80 space-y-2 font-mono text-sm">
        {LINES.map((line, i) => {
          const shownAt = i * STEP_MS
          if (elapsed < shownAt) return <li key={line} className="h-5" />
          const done = elapsed >= shownAt + CHECK_AFTER_MS
          return (
            <motion.li key={line} className="flex h-5 items-center justify-between gap-4" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              <span className="text-white/85">{line}</span>
              <span className={done ? 'text-oc-green' : 'text-oc-gray'} aria-hidden="true">
                {done ? '✓' : '·'}
              </span>
            </motion.li>
          )
        })}
      </ul>
      <p className="mt-10 text-xs uppercase tracking-[0.2em] text-oc-gray">Click or press any key to skip</p>
    </motion.div>
  )
}
