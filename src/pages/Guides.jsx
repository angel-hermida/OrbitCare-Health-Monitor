import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HazardTags } from '../components/StatusPill.jsx'
import PageTitle from '../components/PageTitle.jsx'
import { CARD, LABEL } from '../components/ui.js'
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
        <PageTitle title="How to Measure" accent="Measure" />
        <p className="mt-3 text-oc-gray">Short steps for each check, and why it matters out here.</p>
      </div>

      {INDICATOR_ORDER.map((type) => {
        const guide = GUIDES[type]
        const def = THRESHOLDS[type]
        return (
          <section key={type} id={type} className={`${CARD} scroll-mt-24`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">{def.label}</h2>
              <HazardTags hazards={def.hazards} />
            </div>

            <p className="mt-3 text-white/90">
              <span className={`${LABEL} mr-2 text-white`}>You need</span>
              {guide.need}
            </p>

            <ol className="mt-3 list-decimal space-y-1 pl-6 text-white">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <p className="mt-3 rounded border-l-[3px] border-oc-blue bg-oc-panel/60 px-3 py-2 text-white">
              <span className="font-bold text-oc-blue">Space tip: </span>
              {guide.spaceTip}
            </p>

            <p className="mt-3 text-white/90">
              <span className="font-bold text-white">Why it matters in space: </span>
              {guide.why}
            </p>

            <Link to={`/log?type=${type}`} className="mt-3 inline-block font-semibold text-oc-blue hover:underline">
              Log {def.label.toLowerCase()}
            </Link>
          </section>
        )
      })}
    </div>
  )
}
