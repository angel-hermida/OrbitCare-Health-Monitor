import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HazardTags } from '../components/StatusPill.jsx'
import { CARD, H1 } from '../components/ui.js'
import { GUIDES } from '../data/guides.js'
import { INDICATOR_ORDER, THRESHOLDS } from '../data/thresholds.js'

// "How to measure" + "why it matters in space" for every indicator.
export default function Guides() {
  const { hash } = useLocation()

  // Links like /guides#sleep scroll to that guide.
  useEffect(() => {
    const id = hash.replace('#', '')
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className={H1}>How to measure</h1>
        <p className="mt-1 text-slate-300">Short steps for each check, and why it matters out here.</p>
      </div>

      {INDICATOR_ORDER.map((type) => {
        const guide = GUIDES[type]
        const def = THRESHOLDS[type]
        return (
          <section key={type} id={type} className={`${CARD} scroll-mt-24`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">{def.label}</h2>
              <HazardTags hazards={def.hazards} />
            </div>

            <p className="mt-3 text-slate-200">
              <span className="font-semibold text-white">You need: </span>
              {guide.need}
            </p>

            <ol className="mt-3 list-decimal space-y-1 pl-6 text-slate-100">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-slate-100">
              <span className="font-semibold text-sky-300">Space tip: </span>
              {guide.spaceTip}
            </p>

            <p className="mt-3 text-slate-200">
              <span className="font-semibold text-white">Why it matters in space: </span>
              {guide.why}
            </p>

            <Link to={`/log?type=${type}`} className="mt-3 inline-block font-semibold text-sky-400 hover:text-sky-300">
              Log {def.label.toLowerCase()}
            </Link>
          </section>
        )
      })}
    </div>
  )
}
