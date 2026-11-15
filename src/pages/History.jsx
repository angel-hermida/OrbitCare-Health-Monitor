import { useState } from 'react'
import TrendChart from '../components/TrendChart.jsx'
import PageTitle from '../components/PageTitle.jsx'
import { INDICATOR_ORDER, THRESHOLDS } from '../data/thresholds.js'
import { getIndicatorRanges, toFahrenheit } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { getReadings } from '../store/storage.js'

const DAY = 24 * 60 * 60 * 1000
const RANGES = [7, 30]

// Trend charts for the current astronaut. Bands show the green / yellow / red ranges
// at the current response level, so they narrow as the mission moves away from Earth.
export default function History() {
  const { db, astronaut, responseLevel } = useMission()
  const { tempUnit } = usePreferences()
  const [days, setDays] = useState(30)
  const since = Date.now() - days * DAY

  // Build one chart per number. Blood pressure becomes two charts (top and bottom number).
  const charts = []
  for (const type of INDICATOR_ORDER) {
    const def = THRESHOLDS[type]
    const readings = getReadings(db, astronaut.id, type).filter((r) => r.timestamp >= since)
    const ranges = getIndicatorRanges(type, responseLevel.index)
    if (def.parts) {
      for (const part of Object.keys(def.parts)) {
        charts.push({
          key: `${type}-${part}`,
          title: `${def.label}: ${def.parts[part].label}`,
          unit: def.unit,
          points: readings.map((r) => ({ t: r.timestamp, value: r.value[part] })),
          ranges: ranges[part],
        })
      }
    } else if (type === 'temperature' && tempUnit === 'F') {
      // Display-only: convert the points and the band limits to °F.
      const f = (c) => (c == null ? null : Math.round(toFahrenheit(c) * 10) / 10)
      charts.push({
        key: type,
        title: def.label,
        unit: '°F',
        points: readings.map((r) => ({ t: r.timestamp, value: f(r.value) })),
        ranges: { green: ranges.green.map(f), yellow: ranges.yellow.map(f) },
      })
    } else {
      charts.push({
        key: type,
        title: def.label,
        unit: def.unit,
        points: readings.map((r) => ({ t: r.timestamp, value: r.value })),
        ranges,
      })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <PageTitle title="Health Trends" accent="Trends" />
          <p className="mt-3 text-oc-gray">
            {astronaut.name} · green, yellow and red bands show the limits at the current response level ({responseLevel.label}).
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((option) => (
            <button
              key={option}
              onClick={() => setDays(option)}
              className={`cursor-pointer rounded border px-4 py-2 text-sm font-semibold uppercase tracking-wider ${option === days ? 'border-oc-blue bg-oc-panel text-white' : 'border-oc-border/60 text-oc-gray hover:bg-oc-panel/40 hover:text-white'}`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {charts.map(({ key, ...chart }) => (
          <TrendChart key={key} {...chart} />
        ))}
      </div>
    </div>
  )
}
