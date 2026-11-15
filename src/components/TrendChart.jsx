import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatDateTime } from '../engine/time.js'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { CARD } from './ui.js'

// Status colors for the bands (palette in src/index.css), plus chart chrome.
// Recharts needs real colors (not CSS classes), so the chrome is picked per theme here.
const COLORS = { green: '#22c55e', yellow: '#facc15', red: '#ef4444' }
const LINE = '#3ba2ff' // Accent Blue
const GRID = '#2e6edb' // Border
const CHROME = {
  dark: { axis: '#b0b7c3', panel: '#0b1e3a', text: '#ffffff' },
  light: { axis: '#4f5b6d', panel: '#ffffff', text: '#0b1e3a' },
}

// Turn green / yellow ranges into colored background bands that fill the chart.
function makeBands(ranges, [bottom, top]) {
  const clamp = (n, fallback) => (n == null ? fallback : Math.min(top, Math.max(bottom, n)))
  const greenLow = clamp(ranges.green[0], bottom)
  const greenHigh = clamp(ranges.green[1], top)
  const yellowLow = clamp(ranges.yellow[0], bottom)
  const yellowHigh = clamp(ranges.yellow[1], top)
  return [
    { from: bottom, to: yellowLow, color: COLORS.red },
    { from: yellowLow, to: greenLow, color: COLORS.yellow },
    { from: greenLow, to: greenHigh, color: COLORS.green },
    { from: greenHigh, to: yellowHigh, color: COLORS.yellow },
    { from: yellowHigh, to: top, color: COLORS.red },
  ].filter((band) => band.to > band.from)
}

// One line chart with green / yellow / red bands behind it.
//   points: [{ t: timestamp, value: number }]
//   ranges: { green: [low, high], yellow: [low, high] }
export default function TrendChart({ title, unit, points, ranges }) {
  const { theme } = usePreferences()
  const { axis: AXIS, panel: PANEL, text: TEXT } = CHROME[theme] || CHROME.dark

  if (points.length === 0) {
    return (
      <section className={CARD}>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-2 text-oc-gray">No readings in this period.</p>
      </section>
    )
  }

  // Y axis: fit the data, and show a little of each neighboring band.
  const values = points.map((p) => p.value)
  const limits = [...ranges.green, ...ranges.yellow].filter((n) => n != null)
  const low = Math.min(...values, ...limits)
  const high = Math.max(...values, ...limits)
  const pad = (high - low) * 0.12 || 1
  const domain = [Math.floor(low - pad), Math.ceil(high + pad)]

  return (
    <section className={CARD}>
      <h3 className="font-bold text-white">
        {title} <span className="font-normal text-oc-gray">({unit})</span>
      </h3>
      <div className="mt-3 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={GRID} strokeOpacity={0.35} vertical={false} />
            {makeBands(ranges, domain).map((band) => (
              <ReferenceArea key={`${band.from}-${band.to}`} y1={band.from} y2={band.to} fill={band.color} fillOpacity={0.13} stroke="none" ifOverflow="hidden" />
            ))}
            <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={formatDate} stroke={AXIS} tick={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }} />
            <YAxis domain={domain} allowDataOverflow stroke={AXIS} tick={{ fontSize: 12, fontFamily: 'DM Mono, monospace' }} />
            <Tooltip
              contentStyle={{ background: PANEL, border: `1px solid ${GRID}`, borderRadius: 4, color: TEXT }}
              labelStyle={{ color: AXIS }}
              labelFormatter={formatDateTime}
              formatter={(value) => [`${value} ${unit}`, title]}
            />
            <Line type="monotone" dataKey="value" stroke={LINE} strokeWidth={2.5} dot={{ r: 2.5, fill: LINE }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
