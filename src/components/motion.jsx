// Shared animation helpers (motion / Framer Motion). Every animated component goes through
// useAnimationsEnabled(), so Settings > Animations: Off and the OS "reduce motion" setting both
// switch everything to instant. CSS transitions are switched off the same way in index.css.

import { motion, useReducedMotion } from 'motion/react'
import { usePreferences } from '../store/PreferencesContext.jsx'

export const DURATION = { exit: 0.15, enter: 0.25, open: 0.2 } // seconds, all under 300 ms
export const EASE_OUT = [0.16, 1, 0.3, 1]

// The one shared check: animations on in Settings AND the user has not asked to reduce motion.
export function useAnimationsEnabled() {
  const { animations } = usePreferences()
  const reduced = useReducedMotion()
  return animations && !reduced
}

// Fade + slide up on mount. `index` staggers siblings 40 ms apart (dashboard cards and panels).
export function StaggerItem({ index = 0, className = '', children }) {
  const enabled = useAnimationsEnabled()
  if (!enabled) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.enter, ease: EASE_OUT, delay: index * 0.04 }}
    >
      {children}
    </motion.div>
  )
}

// Height + fade for content that opens and closes (event rows, shelter steps).
// Use inside <AnimatePresence initial={false}>.
export function Collapse({ children, className = '' }) {
  const enabled = useAnimationsEnabled()
  const t = { duration: enabled ? DURATION.open : 0, ease: EASE_OUT }
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={enabled ? { height: 0, opacity: 0 } : false}
      animate={{ height: 'auto', opacity: 1, transition: t }}
      exit={{ height: 0, opacity: 0, transition: t }}
    >
      {children}
    </motion.div>
  )
}
