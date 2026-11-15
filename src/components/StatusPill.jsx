import { HAZARDS } from '../data/hazards.js'
import { STATUS } from './ui.js'

// Status pill (style guide section 7): OK / CAUTION / ALERT / NO DATA.
export function StatusPill({ level }) {
  const style = STATUS[level] || STATUS.none
  return <span className={`inline-block shrink-0 rounded-full px-3.5 py-1 text-xs font-bold tracking-wider ${style.solid}`}>{style.word}</span>
}

// RIDGE hazard tags, e.g. [E · Environment]. Blue, because they are not a health status.
export function HazardTags({ hazards }) {
  if (!hazards || hazards.length === 0) return null
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {hazards.map((letter) => (
        <span key={letter} className="rounded border border-oc-border bg-oc-panel/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
          {letter} · {HAZARDS[letter].name}
        </span>
      ))}
    </span>
  )
}
