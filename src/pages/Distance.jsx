import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import { BTN_PRIMARY, CARD, H2, LABEL, LEVEL_BADGE } from '../components/ui.js'
import { formatDelay, formatReplyEstimate, RESPONSE_LEVELS } from '../engine/responseLevel.js'
import { useMission } from '../store/MissionContext.jsx'

const LEVEL_RULES = {
  ground: 'Delay under 5 seconds',
  shared: 'Delay up to 15 minutes',
  crew: 'Delay over 15 minutes',
  autonomous: 'No link (blackout)',
}

// The Distance hazard (D in RIDGE), read-only.
// Location + mission day -> delay to Earth -> response level -> how strict the limits are.
// Location is changed on Mission setup; mission day in the Presenter panel.
export default function Distance() {
  const { environment, missionDay, comms, responseLevel } = useMission()

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <p className={`${LABEL} mb-2 text-oc-blue`}>RIDGE · D</p>
        <PageTitle title="Distance from Earth" accent="Earth" />
        <p className="mt-3 text-oc-gray">The farther you are from Earth, the longer help takes, so the earlier the app makes you act.</p>
      </div>

      {/* Right now */}
      <section className={`${CARD} grid gap-6 md:grid-cols-2`}>
        <div>
          <p className={LABEL}>Delay to Earth</p>
          <p className="mt-2 font-mono text-4xl font-medium text-white">{formatDelay(comms)}</p>
          <p className="mt-1 text-oc-gray">{formatReplyEstimate(comms)}</p>
          <p className="mt-3 text-sm text-oc-gray">
            {environment.name} · <span className="font-mono">Day {missionDay}</span>
          </p>
        </div>
        <div>
          <p className={LABEL}>Response level</p>
          <p className={`mt-2 inline-block rounded border-2 px-4 py-1 text-2xl font-bold uppercase tracking-wider ${LEVEL_BADGE[responseLevel.id]}`}>{responseLevel.label}</p>
          <p className="mt-2 text-white/90">{responseLevel.summary}</p>
        </div>
        <div className="md:col-span-2">
          <Link to="/mission" className={BTN_PRIMARY}>Change location</Link>
        </div>
      </section>

      {/* The four levels */}
      <section className={CARD}>
        <h2 className={H2}>How the response level works</h2>
        <ul className="mt-3 space-y-2">
          {RESPONSE_LEVELS.map((level) => {
            const active = level.id === responseLevel.id
            return (
              <li key={level.id} className={`rounded-lg border p-3 ${active ? 'border-sky-400 bg-sky-500/10' : 'border-slate-800'}`}>
                <p className="flex flex-wrap items-center gap-2">
                  <span className={`rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${LEVEL_BADGE[level.id]}`}>{level.label}</span>
                  <span className="text-sm text-slate-400">{LEVEL_RULES[level.id]}</span>
                  {active && <span className="text-sm font-semibold text-sky-300">· now</span>}
                </p>
                <p className="mt-1 text-slate-200">{level.summary}</p>
                <p className="text-sm text-slate-400">
                  On a red reading: {level.redInstruction} {level.index === 0 ? 'Limits are at their normal width.' : `Limits are ${level.index} step${level.index > 1 ? 's' : ''} stricter.`}
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
