import { SENSOR_ORDER, SENSOR_THRESHOLDS } from '../data/thresholds.js'
import { formatSensor, getSensorStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { SimulatedTag, StatusPill } from './StatusPill.jsx'
import { CARD, STATUS } from './ui.js'

// Line icons per sensor (24x24, stroke = currentColor).
const SENSOR_ICON = {
  co2: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18z',
  temp: 'M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0zM12 9v7',
  humidity: 'M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z',
  noise: 'M3 10v4M7 7v10M11 4v16M15 8v8M19 10v4',
  radiation: 'M12 12m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0M10.6 9.6 7.5 4.3A9 9 0 0 0 3 12h6.2M13.4 9.6l3.1-5.3A9 9 0 0 1 21 12h-6.2M10.6 14.4l-3.1 5.3a9 9 0 0 0 9 0l-3.1-5.3',
}

function SensorIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={SENSOR_ICON[name]} />
    </svg>
  )
}

// Simulated cabin and radiation sensors (engine/sensors.js). Not real data, and labelled so.
export default function HabitatPanel() {
  const { sensors, environment } = useMission()
  const { tempUnit } = usePreferences()

  return (
    <section className={`${CARD} h-full`}>
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 text-2xl font-bold tracking-tight text-white">Habitat</h2>
        <SimulatedTag />
        <span className="h-0.5 min-w-8 flex-1 bg-oc-blue" aria-hidden="true" />
      </div>

      <ul className="mt-3 divide-y divide-oc-border/40">
        {SENSOR_ORDER.map((key) => {
          const status = getSensorStatus(key, sensors[key])
          // For a radiation alert, the action depends on where the crew is.
          const action = key === 'radiation' && status.level === 'red' ? `Solar storm. ${environment.shelter}` : status.action
          return (
            <li key={key} className="py-2.5">
              <div className="flex items-center gap-3">
                <SensorIcon name={key} />
                <span className="min-w-0 flex-1 text-white/90">{SENSOR_THRESHOLDS[key].label}</span>
                <span className={`font-mono text-lg tabular-nums ${status.level === 'green' ? 'text-white' : STATUS[status.level].text}`}>{formatSensor(key, sensors[key], tempUnit)}</span>
                <span className="w-20 text-right">
                  <StatusPill level={status.level} />
                </span>
              </div>
              {action && <p className={`mt-1 pl-9 text-sm ${STATUS[status.level].text}`}>{action}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
