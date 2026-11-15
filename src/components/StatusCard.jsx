import { Link } from 'react-router-dom'
import { THRESHOLDS } from '../data/thresholds.js'
import { formatValue } from '../engine/status.js'
import { timeAgo } from '../engine/time.js'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { StatusPill } from './StatusPill.jsx'
import { BTN_PRIMARY } from './ui.js'

// Card border per level: plain for OK / due, coloured for caution and alert.
const BORDER = {
  green: 'border-oc-border/70',
  yellow: 'border-oc-yellow',
  red: 'border-2 border-oc-alert',
  due: 'border-oc-border/70',
  none: 'border-oc-border/70',
}

const MESSAGE_TEXT = { yellow: 'text-oc-yellow', red: 'text-oc-alert' }

// One indicator on the dashboard (design/dashboard-v2.webp):
// label + "+" (log new) -> big number + status pill -> "Measured X ago".
// OK cards stop there. Caution / alert cards add the message and the next step.
//
// due = true (engine/checkin.js): the latest reading is too old, or there is none.
// The card then shows a gray DUE state with the last value for context, never OK.
export default function StatusCard({ type, reading, status, due }) {
  const def = THRESHOLDS[type]
  const { tempUnit } = usePreferences()
  const level = due ? 'due' : status ? status.level : 'none'
  const logLink = `/log?type=${type}`

  return (
    <div className={`flex h-full flex-col rounded border bg-oc-panel/40 p-5 transition-colors duration-200 ${BORDER[level]}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="pt-1 text-sm font-bold uppercase tracking-[0.2em] text-white">{def.label}</h3>
        <Link
          to={logLink}
          title={`Log ${def.label.toLowerCase()}`}
          aria-label={`Log ${def.label.toLowerCase()}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/60 text-lg leading-none text-white hover:border-oc-blue hover:text-oc-blue"
        >
          +
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-4">
        {due ? (
          <p className="min-w-0 flex-1 text-xl font-semibold leading-tight text-white/80">Not measured today</p>
        ) : (
          <p className="min-w-0 flex-1 break-words font-mono text-[34px] font-medium leading-tight text-white">{formatValue(type, reading.value, tempUnit)}</p>
        )}
        <StatusPill level={level} size="lg" />
      </div>

      {due ? (
        <>
          <p className="mt-1 text-sm text-oc-gray">{reading ? `Last: ${formatValue(type, reading.value, tempUnit)} · ${timeAgo(reading.timestamp)}` : 'No reading yet'}</p>
          <Link to={logLink} className={`${BTN_PRIMARY} mt-4 self-start px-4 py-2`}>
            Log now
          </Link>
        </>
      ) : (
        <p className="mt-1 text-sm text-oc-gray">Measured {timeAgo(reading.timestamp)}</p>
      )}

      {!due && (level === 'yellow' || level === 'red') && (
        <div className="mt-3 border-t border-oc-border/40 pt-3 text-sm leading-snug">
          <p className={`font-semibold ${MESSAGE_TEXT[level]}`}>{status.message}</p>
          <p className="mt-1 text-white/90">
            <span className="font-bold text-white">Next step: </span>
            {status.action}
          </p>
        </div>
      )}
    </div>
  )
}
