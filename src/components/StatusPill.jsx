import { HAZARDS } from '../data/hazards.js'
import { STATUS } from './ui.js'

// Small colored label: OK / CAUTION / ALERT / NO DATA.
export function StatusPill({ level }) {
  const style = STATUS[level] || STATUS.none
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${style.solid}`}>{style.word}</span>
}

// RIDGE hazard tags, e.g. [E Environment].
export function HazardTags({ hazards }) {
  if (!hazards || hazards.length === 0) return null
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {hazards.map((letter) => (
        <span key={letter} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-200">
          {letter} · {HAZARDS[letter].name}
        </span>
      ))}
    </span>
  )
}
