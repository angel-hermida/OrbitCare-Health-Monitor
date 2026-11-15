import { HAZARDS } from '../data/hazards.js'
import { STATUS } from './ui.js'

// Status pill (style guide section 7): OK / CAUTION / ALERT / NO DATA / DUE.
// size="lg" is the larger pill used on the dashboard vital cards.
export function StatusPill({ level, size = 'md' }) {
  const style = STATUS[level] || STATUS.none
  const sizing = size === 'lg' ? 'min-w-[4.5rem] px-5 py-1.5 text-sm' : 'px-3.5 py-1 text-xs'
  return <span className={`inline-block shrink-0 rounded-full text-center font-bold tracking-wider transition-colors duration-200 ${sizing} ${style.solid}`}>{style.word}</span>
}

// Gray tag for anything driven by the simulated sensors or the Presenter panel,
// so demo data is never mistaken for real data.
export function SimulatedTag() {
  return (
    <span className="inline-block shrink-0 rounded border border-oc-silver/70 bg-oc-silver/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-oc-gray">
      Simulated
    </span>
  )
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
