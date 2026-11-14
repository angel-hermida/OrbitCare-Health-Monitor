import { SENSOR_ORDER, SENSOR_THRESHOLDS } from '../data/thresholds.js'
import { formatSensor, getSensorStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { StatusPill } from './StatusPill.jsx'
import { CARD, H2, STATUS } from './ui.js'

// Live (simulated) cabin and radiation sensors.
export default function HabitatPanel() {
  const { sensors, environment } = useMission()

  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between">
        <h2 className={H2}>Habitat</h2>
        <span className="text-xs text-slate-400">Simulated sensors · live</span>
      </div>

      <ul className="mt-3 divide-y divide-slate-800">
        {SENSOR_ORDER.map((key) => {
          const status = getSensorStatus(key, sensors[key])
          // For a radiation alert, the action depends on where the crew is.
          const action = key === 'radiation' && status.level === 'red' ? `Solar storm. ${environment.shelter}` : status.action
          return (
            <li key={key} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300">{SENSOR_THRESHOLDS[key].label}</span>
                <span className="flex items-center gap-3">
                  <span className={`font-semibold tabular-nums ${STATUS[status.level].text}`}>{formatSensor(key, sensors[key])}</span>
                  <StatusPill level={status.level} />
                </span>
              </div>
              {action && <p className={`mt-1 text-sm ${STATUS[status.level].text}`}>{action}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
