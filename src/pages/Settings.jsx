import PageTitle from '../components/PageTitle.jsx'
import { BTN, CARD, H2, LABEL, LEVEL_BADGE } from '../components/ui.js'
import { ENVIRONMENT_ORDER, ENVIRONMENTS } from '../data/environments.js'
import { formatDelay, formatReplyEstimate, RESPONSE_LEVELS } from '../engine/responseLevel.js'
import { useMission } from '../store/MissionContext.jsx'

const LEVEL_RULES = {
  ground: 'Delay under 5 seconds',
  shared: 'Delay up to 15 minutes',
  crew: 'Delay over 15 minutes',
  autonomous: 'No link (blackout)',
}

// Mission settings = the Distance hazard (D in RIDGE).
// Location + mission day -> delay to Earth -> response level -> how strict the limits are.
export default function Settings() {
  const { environment, missionDay, comms, responseLevel, sensors, setEnvironment, setMissionDay, setStorm, setCo2Spike, resetDemo } = useMission()

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <p className={`${LABEL} mb-2 text-oc-blue`}>RIDGE · D</p>
        <PageTitle title="Distance from Earth" accent="Earth" />
        <p className="mt-3 text-oc-gray">The farther you are from Earth, the longer help takes, so the earlier the app makes you act.</p>
      </div>

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

      {/* How far along? */}
      <section className={CARD}>
        <h2 className={H2}>Mission day</h2>
        {environment.usesMissionDay ? (
          <>
            <input
              type="range"
              min="1"
              max={environment.maxMissionDay}
              value={missionDay}
              onChange={(e) => setMissionDay(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <p className="text-sm text-slate-400">
              <span className="font-mono text-white">Day {missionDay} of {environment.maxMissionDay}</span>.{' '}
              {environment.id === 'mars' ? 'Drag toward the middle: the delay grows, then contact drops out for about two weeks around day 390.' : 'Drag right: the delay grows as the spacecraft leaves Earth behind.'}
            </p>
          </>
        ) : (
          <p className="mt-2 text-slate-300">The delay does not change with mission day at this location. Choose Spacecraft or Mars to see it move.</p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className={LABEL}>Delay to Earth</p>
            <p className="mt-1 font-mono text-2xl font-medium text-white">{formatDelay(comms)}</p>
            <p className="text-sm text-slate-400">{formatReplyEstimate(comms)}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className={LABEL}>Response level</p>
            <p className={`mt-2 inline-block rounded border-2 px-3 py-0.5 text-lg font-bold uppercase tracking-wider ${LEVEL_BADGE[responseLevel.id]}`}>{responseLevel.label}</p>
            <p className="mt-1 text-sm text-slate-300">{responseLevel.summary}</p>
          </div>
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

      {/* Demo controls */}
      <section className={`${CARD} border-dashed border-slate-600`}>
        <h2 className={H2}>Demo controls</h2>
        <p className="mt-1 text-sm text-slate-400">For presenting. These drive the simulated sensors.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className={BTN} onClick={() => setStorm(!sensors.stormActive)}>{sensors.stormActive ? 'End solar storm' : 'Trigger solar storm'}</button>
          <button className={BTN} onClick={() => setCo2Spike(!sensors.co2Spike)}>{sensors.co2Spike ? 'End CO₂ spike' : 'Trigger CO₂ spike'}</button>
          <button className={BTN} onClick={resetDemo}>Reset demo data</button>
        </div>
        <p className="mt-2 text-sm text-slate-400">Reset clears everything you logged and brings back the 30-day demo history.</p>
      </section>
    </div>
  )
}
