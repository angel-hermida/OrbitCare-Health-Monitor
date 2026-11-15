// Data cards shown in the assistant chat. They render tool results straight from the app's data,
// so the numbers on screen never depend on the model's wording.

import { Link } from 'react-router-dom'
import { formatDateTime, timeAgo } from '../engine/time.js'
import { StatusPill } from './StatusPill.jsx'
import { LABEL } from './ui.js'

const LEVEL = { OK: 'green', CAUTION: 'yellow', ALERT: 'red' }
const levelOf = (item) => (!item.measured ? 'none' : item.checkDue ? 'due' : LEVEL[item.status] || LEVEL[String(item.status).split(' ')[0]] || 'none')

const BOX = 'rounded border border-oc-border/70 bg-oc-panel/30 p-3'
const TAG = 'inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]'
const MEASURED = `${TAG} border-oc-blue/70 text-oc-blue`
const ESTIMATED = `${TAG} border-oc-silver/70 bg-oc-silver/15 text-oc-gray`

function VitalsCard({ items }) {
  return (
    <div className={BOX}>
      <div className="mb-2 flex items-center justify-between">
        <p className={LABEL}>Current readings</p>
        <span className={MEASURED}>Measured</span>
      </div>
      <ul className="divide-y divide-oc-border/30">
        {items.map((v) => (
          <li key={v.indicator} className="flex items-center justify-between gap-3 py-1.5">
            <div className="min-w-0">
              <p className="text-sm text-white">{v.label}</p>
              <p className="text-xs text-oc-gray">{v.measured ? `${formatDateTime(Date.parse(v.timestamp))} · ${timeAgo(Date.parse(v.timestamp))}` : 'No reading recorded'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono text-base text-white">{v.measured ? v.display : '—'}</span>
              <StatusPill level={levelOf(v)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RangesCard({ items }) {
  const flagged = items.filter((i) => i.measured && !i.checkDue && i.status !== 'OK')
  const due = items.filter((i) => !i.measured || i.checkDue)
  return (
    <div className={BOX}>
      <p className={`${LABEL} mb-2`}>Reference range check</p>
      {flagged.length === 0 ? (
        <p className="text-sm text-white">All current readings are inside their configured ranges.</p>
      ) : (
        <ul className="space-y-1.5">
          {flagged.map((i) => (
            <li key={i.indicator} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white">{i.label}: <span className="font-mono">{i.display}</span></span>
              <StatusPill level={levelOf(i)} />
            </li>
          ))}
        </ul>
      )}
      {due.length > 0 && <p className="mt-2 text-xs text-oc-gray">Not current, not checked: {due.map((d) => d.label).join(', ')}.</p>}
    </div>
  )
}

function HistoryCard({ label, windowHours, readings, summary, unit }) {
  const window = windowHours >= 48 ? `${Math.round(windowHours / 24)} days` : `${windowHours} h`
  return (
    <div className={BOX}>
      <div className="mb-2 flex items-center justify-between">
        <p className={LABEL}>{label} · last {window}</p>
        <span className={MEASURED}>Measured</span>
      </div>
      {readings.length === 0 ? (
        <p className="text-sm text-oc-gray">No readings in this window.</p>
      ) : (
        <>
          {summary && (
            <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {Object.entries(summary).map(([k, s]) => (
                <span key={k} className="text-oc-gray">
                  {Object.keys(summary).length > 1 ? `${k}: ` : ''}min <span className="font-mono text-white">{s.min}</span> · avg <span className="font-mono text-white">{s.average}</span> · max <span className="font-mono text-white">{s.max}</span> {unit}
                </span>
              ))}
            </div>
          )}
          <ul className="max-h-36 space-y-0.5 overflow-y-auto text-xs">
            {readings.slice(-8).reverse().map((r) => (
              <li key={r.t} className="flex justify-between gap-3">
                <span className="text-oc-gray">{formatDateTime(r.t)}</span>
                <span className="font-mono text-white">{r.display}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-oc-gray">{readings.length} reading{readings.length === 1 ? '' : 's'} in window.</p>
        </>
      )}
    </div>
  )
}

function TrendCard({ label, unit, windowDays, parts, measuredLatest }) {
  return (
    <div className={BOX}>
      <div className="mb-2 flex items-center justify-between">
        <p className={LABEL}>{label} trend · {windowDays} days</p>
        <span className={ESTIMATED}>Estimated</span>
      </div>
      {measuredLatest && (
        <p className="mb-2 text-sm text-oc-gray">
          <span className={MEASURED}>Measured</span> latest <span className="font-mono text-white">{measuredLatest.display}</span> · {formatDateTime(Date.parse(measuredLatest.timestamp))}
        </p>
      )}
      {Object.entries(parts).map(([key, t]) => (
        <div key={key} className="text-sm">
          {Object.keys(parts).length > 1 && <p className="mt-1 font-semibold capitalize text-white">{key}</p>}
          {!t.ok ? (
            <p className="text-oc-gray">No forecast. {t.reason}</p>
          ) : (
            <>
              <p className="text-white">
                Direction: <span className="font-semibold">{t.direction}</span> ({t.slopePerDay > 0 ? '+' : ''}{t.slopePerDay} {unit}/day, 95%: {t.slopePerDayCi95[0]} to {t.slopePerDayCi95[1]})
              </p>
              <p className="text-oc-gray">
                In {t.forecast.horizonDays} days: <span className="font-mono text-white">{t.forecast.value}</span> {unit} (95% range {t.forecast.predictionInterval95[0]}–{t.forecast.predictionInterval95[1]})
              </p>
              <p className="text-xs text-oc-gray">Straight-line fit on {t.points} readings over {t.spanDays} days.</p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AssistantCard({ card }) {
  switch (card.kind) {
    case 'vitals':
      return <VitalsCard items={card.items} />
    case 'ranges':
      return <RangesCard items={card.items} />
    case 'history':
      return <HistoryCard {...card} />
    case 'trend':
      return <TrendCard {...card} />
    case 'records':
      return (
        <p className="text-xs text-oc-gray">
          Checked profile and {card.count} uploaded record{card.count === 1 ? '' : 's'}. <Link to="/records" className="text-oc-blue hover:underline">Medical records</Link>
        </p>
      )
    case 'nav':
      return <p className="text-xs text-oc-blue">Opened: {card.label}</p>
    default:
      return null
  }
}
