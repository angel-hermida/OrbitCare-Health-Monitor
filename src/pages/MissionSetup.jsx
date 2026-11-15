import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle.jsx'
import { CARD, H2, LABEL, LEVEL_BADGE } from '../components/ui.js'
import { ENVIRONMENT_ORDER, ENVIRONMENTS } from '../data/environments.js'
import { formatDelay } from '../engine/responseLevel.js'
import { useMission } from '../store/MissionContext.jsx'

// Where the crew is. Changing location changes gravity, shelter advice and (through the
// delay to Earth) the response level. The mission day is moved in the Presenter panel.
export default function MissionSetup() {
  const { environment, missionDay, comms, responseLevel, setEnvironment } = useMission()

  return (
    <div className="max-w-4xl space-y-5">
      <PageTitle title="Mission Setup" accent="Setup" />

      {/* Where are we? */}
      <section className={CARD}>
        <h2 className={H2}>Location</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ENVIRONMENT_ORDER.map((id) => {
            const env = ENVIRONMENTS[id]
            const active = env.id === environment.id
            return (
              <button
                key={id}
                onClick={() => setEnvironment(id)}
                className={`cursor-pointer rounded-lg border p-4 text-left ${active ? 'border-sky-400 bg-sky-500/15' : 'border-slate-700 bg-slate-950 hover:bg-slate-800'}`}
              >
                <p className={`font-semibold ${active ? 'text-sky-300' : 'text-white'}`}>{env.name}</p>
                <p className="text-sm text-slate-400">Gravity: {env.gravityLabel}</p>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-slate-200">{environment.context}</p>
      </section>

      {/* Mission info (read-only) */}
      <section className={`${CARD} grid gap-5 sm:grid-cols-2 lg:grid-cols-4`}>
        <div>
          <p className={LABEL}>Mission day</p>
          <p className="mt-1 font-mono text-2xl font-medium text-white">{missionDay}</p>
        </div>
        <div>
          <p className={LABEL}>Delay to Earth</p>
          <p className="mt-1 font-mono text-2xl font-medium text-white">{formatDelay(comms)}</p>
        </div>
        <div>
          <p className={LABEL}>Response level</p>
          <Link to="/distance" className={`mt-2 inline-block rounded border-2 px-3 py-0.5 font-bold uppercase tracking-wider hover:opacity-85 ${LEVEL_BADGE[responseLevel.id]}`}>
            {responseLevel.label}
          </Link>
        </div>
        <div>
          <p className={LABEL}>Gravity</p>
          <p className="mt-1 font-mono text-2xl font-medium text-white">{environment.gravity} g</p>
        </div>
        <p className="text-sm text-oc-gray sm:col-span-2 lg:col-span-4">
          {environment.usesMissionDay ? 'The delay here changes with the mission day. Move it in the Presenter panel (bottom right).' : 'The delay does not change with mission day at this location.'}
        </p>
      </section>
    </div>
  )
}
