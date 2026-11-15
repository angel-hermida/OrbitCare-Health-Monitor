import { Link } from 'react-router-dom'
import { THRESHOLDS } from '../data/thresholds.js'
import { formatValue } from '../engine/status.js'
import { timeAgo } from '../engine/time.js'
import { StatusPill } from './StatusPill.jsx'
import { STATUS } from './ui.js'

// One indicator on the dashboard (style guide section 5, "Vital card"):
// title -> big number + status pill on a dark band -> plain sentence -> next step.
// Yellow and red cards also get a colored ring so they stand out in the grid.
export default function StatusCard({ type, reading, status }) {
  const def = THRESHOLDS[type]
  const level = status ? status.level : 'none'

  return (
    <div className={`flex flex-col overflow-hidden rounded bg-white text-oc-bg ${STATUS[level].ring}`}>
      <h3 className="px-5 pb-3 pt-4 text-lg font-bold uppercase tracking-wider">{def.label}</h3>

      <div className="flex items-center gap-4 bg-oc-bg px-5 py-4">
        <p className="min-w-0 flex-1 break-words font-mono text-[26px] font-medium leading-tight text-white">{reading ? formatValue(type, reading.value) : '—'}</p>
        <span className="h-10 w-px bg-white/30" aria-hidden="true" />
        <StatusPill level={level} />
      </div>

      <div className="flex flex-1 flex-col px-5 py-4">
        {status ? (
          <>
            <p className="text-[17px] leading-snug">{status.message}</p>
            <p className="mt-3 border-t border-oc-gray/60 pt-3 leading-snug">
              <span className="font-bold">Next step: </span>
              {status.action}
            </p>
            <p className="mt-3 text-xs text-oc-bg/60">
              Measured {timeAgo(reading.timestamp)} · {reading.source}
            </p>
          </>
        ) : (
          <p className="leading-snug">No reading yet. Log one to see your status.</p>
        )}

        <div className="mt-auto flex gap-5 pt-4 text-sm font-semibold">
          <Link to={`/log?type=${type}`} className="text-oc-border hover:underline">
            Log new
          </Link>
          <Link to={`/guides#${type}`} className="text-oc-bg/70 hover:text-oc-bg hover:underline">
            How to measure
          </Link>
        </div>
      </div>
    </div>
  )
}
