import { SENSOR_ORDER, SENSOR_THRESHOLDS } from '../data/thresholds.js'
import { formatSensor, getSensorStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import PageTitle from './PageTitle.jsx'
import { StatusPill } from './StatusPill.jsx'
import { CARD, LABEL, STATUS } from './ui.js'

// Live (simulated) cabin and radiation sensors.
export default function HabitatPanel() {
  const { sensors, environment } = useMission()
  const { tempUnit } = usePreferences()

  return (
    <section className={CARD}>
      <PageTitle title="Habitat" as="h2" size="text-xl" />
      <p className={`${LABEL} mt-2`}>Simulated sensors · live</p>

      <ul className="mt-3 divide-y divide-oc-border/40">
        {SENSOR_ORDER.map((key) => {
          const status = getSensorStatus(key, sensors[key])
          // For a radiation alert, the action depends on where the crew is.
          const action = key === 'radiation' && status.level === 'red' ? `Solar storm. ${environment.shelter}` : status.action
          return (
            <li key={key} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/90">{SENSOR_THRESHOLDS[key].label}</span>
                <span className="flex items-center gap-3">
                  <span className={`font-mono text-lg tabular-nums ${status.level === 'green' ? 'text-white' : STATUS[status.level].text}`}>{formatSensor(key, sensors[key], tempUnit)}</span>
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
