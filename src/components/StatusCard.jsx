import { Link } from 'react-router-dom'
import { THRESHOLDS } from '../data/thresholds.js'
import { formatValue } from '../engine/status.js'
import { timeAgo } from '../engine/time.js'
import { StatusPill } from './StatusPill.jsx'
import { STATUS } from './ui.js'

// One indicator on the dashboard: number -> color -> plain sentence -> next step.
export default function StatusCard({ type, reading, status }) {
  const def = THRESHOLDS[type]
  const style = STATUS[status ? status.level : 'none']

  return (
    <div className={`flex flex-col rounded-xl border p-5 ${style.border} ${style.bg}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-200">{def.label}</h3>
        <StatusPill level={status ? status.level : 'none'} />
      </div>

      <p className={`mt-3 text-3xl font-bold ${style.text}`}>{reading ? formatValue(type, reading.value) : '—'}</p>

      {status ? (
        <>
          <p className="mt-2 text-slate-100">{status.message}</p>
          <p className="mt-2 text-sm text-slate-300">
            <span className="font-semibold text-slate-100">Next step: </span>
            {status.action}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Measured {timeAgo(reading.timestamp)} · {reading.source}
          </p>
        </>
      ) : (
        <p className="mt-2 text-slate-300">No reading yet. Log one to see your status.</p>
      )}

      <div className="mt-auto flex gap-4 pt-4 text-sm">
        <Link to={`/log?type=${type}`} className="font-semibold text-sky-400 hover:text-sky-300">
          Log new
        </Link>
        <Link to={`/guides#${type}`} className="text-slate-300 hover:text-white">
          How to measure
        </Link>
      </div>
    </div>
  )
}
