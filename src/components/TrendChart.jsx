import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatDateTime } from '../engine/time.js'
import { CARD } from './ui.js'

const COLORS = { green: '#34d399', yellow: '#fbbf24', red: '#f87171' }

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
  if (points.length === 0) {
    return (
      <section className={CARD}>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-2 text-slate-400">No readings in this period.</p>
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
      <h3 className="font-semibold text-white">
        {title} <span className="font-normal text-slate-400">({unit})</span>
      </h3>
      <div className="mt-3 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            {makeBands(ranges, domain).map((band) => (
              <ReferenceArea key={`${band.from}-${band.to}`} y1={band.from} y2={band.to} fill={band.color} fillOpacity={0.13} stroke="none" ifOverflow="hidden" />
            ))}
            <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={formatDate} stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis domain={domain} allowDataOverflow stroke="#64748b" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelFormatter={formatDateTime}
              formatter={(value) => [`${value} ${unit}`, title]}
            />
            <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
