import { StatusPill } from '../components/StatusPill.jsx'
import { BTN, CARD, H1, H2 } from '../components/ui.js'
import { INDICATOR_ORDER, THRESHOLDS } from '../data/thresholds.js'
import { attentionProfile, bmi } from '../engine/personalize.js'
import { formatValue, getStatus } from '../engine/status.js'
import { timeAgo } from '../engine/time.js'
import { useMission } from '../store/MissionContext.jsx'
import { latestReading } from '../store/storage.js'

// Who the astronaut is, and their Earth baseline next to their latest reading.
export default function Profile() {
  const { db, astronaut, missionState, selectAstronaut } = useMission()
  const attention = attentionProfile(astronaut)
  const body = bmi(astronaut)
  const medical = astronaut.medical || {}
  const listText = (arr) => (arr?.length ? arr.join(', ') : 'None recorded')

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={H1}>{astronaut.name}</h1>
          <p className="mt-1 text-sky-300">{astronaut.role}</p>
        </div>
        <button className={BTN} onClick={() => selectAstronaut(null)}>Switch crew member</button>
      </div>

      <section className={`${CARD} grid grid-cols-2 gap-4 sm:grid-cols-5`}>
        {[
          ['Age', astronaut.age],
          ['Gender', astronaut.gender],
          ['Weight', `${astronaut.weightKg} kg`],
          ['Height', astronaut.heightCm ? `${astronaut.heightCm} cm` : '—'],
          ['BMI', body ? body.toFixed(1) : '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className={CARD}>
        <h2 className={H2}>Attention level: {attention.label}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {attention.reasons.length ? attention.reasons.join(' ') : 'No extra risk factors. Standard limits apply.'}
        </p>
      </section>

      <section className={CARD}>
        <h2 className={H2}>Medical history</h2>
        <dl className="mt-2 space-y-1 text-slate-300">
          <div><dt className="inline text-slate-400">Conditions: </dt><dd className="inline">{listText(medical.conditions)}</dd></div>
          <div><dt className="inline text-slate-400">Medications: </dt><dd className="inline">{listText(medical.medications)}</dd></div>
          <div><dt className="inline text-slate-400">Allergies: </dt><dd className="inline">{listText(medical.allergies)}</dd></div>
          {medical.notes && <div><dt className="inline text-slate-400">Notes: </dt><dd className="inline">{medical.notes}</dd></div>}
        </dl>
      </section>

      <section className={CARD}>
        <h2 className={H2}>Earth baseline vs now</h2>
        <p className="mt-1 text-sm text-slate-400">
          Baseline source: {astronaut.baselineSource || 'measured before the mission'}. The app flags readings that move too far from it, even when they are inside the general safe range.
        </p>
        <table className="mt-4 w-full text-left">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-2 font-medium">Indicator</th>
              <th className="pb-2 font-medium">Earth baseline</th>
              <th className="pb-2 font-medium">Latest</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {INDICATOR_ORDER.map((type) => {
              const reading = latestReading(db, astronaut.id, type)
              const status = reading ? getStatus(type, reading.value, astronaut, missionState) : null
              return (
                <tr key={type}>
                  <td className="py-3 text-slate-200">{THRESHOLDS[type].label}</td>
                  <td className="py-3 text-slate-300">{formatValue(type, astronaut.baseline[type])}</td>
                  <td className="py-3 font-semibold text-white">
                    {reading ? formatValue(type, reading.value) : '—'}
                    {reading && <span className="block text-xs font-normal text-slate-400">{timeAgo(reading.timestamp)}</span>}
                  </td>
                  <td className="py-3"><StatusPill level={status ? status.level : 'none'} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
