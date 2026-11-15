import StubPage from '../components/StubPage.jsx'
import { StatusPill } from '../components/StatusPill.jsx'
import { CARD, H2, STATUS } from '../components/ui.js'
import { formatSensor, getSensorStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'

// STUB PAGE (R in RIDGE). The live reading and shelter advice below already work.
// TODO: build the full storm alert flow described in the list.
export default function Radiation() {
  const { sensors, environment } = useMission()
  const status = getSensorStatus('radiation', sensors.radiation)

  return (
    <StubPage
      letter="R"
      title="Radiation Watch"
      accent="Watch"
      intro="Outside Earth's magnetic field, solar storms can raise radiation fast. The app watches the level and tells the crew when and where to shelter."
      todo={[
        'Full-screen solar storm alert that appears on every page when radiation turns red',
        'Step-by-step shelter checklist that changes with the location (station, spacecraft, Moon, Mars)',
        'Crew roll call: tick off each crew member as they reach the shelter',
        'All-clear message when the level is back in the green',
        'Pitch only: each astronaut’s lifetime dose tracked against the career limit',
      ]}
    >
      <section className={`rounded border p-5 ${STATUS[status.level].border} ${STATUS[status.level].bg}`}>
        <div className="flex items-center justify-between">
          <h2 className={H2}>Radiation right now</h2>
          <StatusPill level={status.level} />
        </div>
        <p className={`mt-2 font-mono text-4xl font-medium ${status.level === 'green' ? 'text-white' : STATUS[status.level].text}`}>{formatSensor('radiation', sensors.radiation)}</p>
        {status.level !== 'green' && <p className="mt-2 text-white">{status.action}</p>}
      </section>

      <section className={CARD}>
        <h2 className={H2}>Where to shelter here</h2>
        <p className="mt-2 text-slate-200">{environment.shelter}</p>
        <p className="mt-2 text-sm text-slate-400">Try it: Presenter panel (bottom right) → Trigger solar storm.</p>
      </section>
    </StubPage>
  )
}
