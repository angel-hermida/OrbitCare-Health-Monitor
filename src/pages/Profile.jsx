import PageTitle from '../components/PageTitle.jsx'
import { StatusPill } from '../components/StatusPill.jsx'
import { BTN_OUTLINE, CARD, LABEL, TABLE, TD, TH } from '../components/ui.js'
import { INDICATOR_ORDER, THRESHOLDS } from '../data/thresholds.js'
import { formatValue, getStatus } from '../engine/status.js'
import { timeAgo } from '../engine/time.js'
import { useMission } from '../store/MissionContext.jsx'
import { latestReading } from '../store/storage.js'

// Who the astronaut is, and their Earth baseline next to their latest reading.
export default function Profile() {
  const { db, astronaut, missionState, selectAstronaut } = useMission()

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`${LABEL} mb-1`}>Crew member</p>
          <h1 className="text-3xl font-bold text-white">{astronaut.name}</h1>
          <p className="mt-1 text-oc-blue">{astronaut.role}</p>
        </div>
        <button className={BTN_OUTLINE} onClick={() => selectAstronaut(null)}>Switch crew member</button>
      </div>

      <section className={`${CARD} grid grid-cols-3 gap-4`}>
        {[
          ['Age', astronaut.age],
          ['Gender', astronaut.gender],
          ['Weight', `${astronaut.weightKg} kg`],
        ].map(([label, value]) => (
          <div key={label}>
            <p className={LABEL}>{label}</p>
            <p className="mt-1 font-mono text-2xl text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <PageTitle title="Earth Baseline vs Now" accent="Baseline" as="h2" size="text-2xl" />
        <p className="text-sm text-oc-gray">
          Your baseline was measured before the mission. The app flags readings that move too far from it, even when they are inside the general safe range.
        </p>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Indicator</th>
              <th className={TH}>Earth baseline</th>
              <th className={TH}>Latest</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {INDICATOR_ORDER.map((type) => {
              const reading = latestReading(db, astronaut.id, type)
              const status = reading ? getStatus(type, reading.value, astronaut, missionState) : null
              return (
                <tr key={type}>
                  <td className={TD}>{THRESHOLDS[type].label}</td>
                  <td className={`${TD} font-mono text-oc-gray`}>{formatValue(type, astronaut.baseline[type])}</td>
                  <td className={TD}>
                    <span className="font-mono">{reading ? formatValue(type, reading.value) : '—'}</span>
                    {reading && <span className="block text-xs text-oc-gray">{timeAgo(reading.timestamp)}</span>}
                  </td>
                  <td className={TD}><StatusPill level={status ? status.level : 'none'} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
