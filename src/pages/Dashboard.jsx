import { Link } from 'react-router-dom'
import HabitatPanel from '../components/HabitatPanel.jsx'
import StatusCard from '../components/StatusCard.jsx'
import PageTitle from '../components/PageTitle.jsx'
import { BTN, BTN_PRIMARY, CARD, LABEL, STATUS } from '../components/ui.js'
import { INDICATOR_ORDER } from '../data/thresholds.js'
import { getFreshness, getTodayProgress } from '../engine/checkin.js'
import { getStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { latestReading } from '../store/storage.js'

// Summary of the readings that are current (due ones are counted separately).
const SUMMARY = {
  green: 'Your current readings are normal.',
  yellow: 'Some readings need a simple action. See the yellow cards.',
  red: 'A reading needs attention now. See the red card.',
}

const checksDue = (n) => `${n} check${n === 1 ? '' : 's'} due today.`

export default function Dashboard() {
  const { db, astronaut, missionState, environment, responseLevel } = useMission()
  const now = Date.now()

  // Latest reading + status for each indicator. A due reading gets no status color.
  const cards = INDICATOR_ORDER.map((type) => {
    const reading = latestReading(db, astronaut.id, type)
    const { due } = getFreshness(reading, type, now)
    const status = reading && !due ? getStatus(type, reading.value, astronaut, missionState) : null
    return { type, reading, status, due }
  })

  const progress = getTodayProgress(db, astronaut.id, now)
  const dueCount = progress.total - progress.done
  const levels = cards.map((card) => card.status?.level).filter(Boolean)
  const overall = levels.includes('red') ? 'red' : levels.includes('yellow') ? 'yellow' : levels.length ? 'green' : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <PageTitle title="Health Status" accent="Status" />
          <p className="mt-3 text-lg font-medium">
            {overall && <span className={STATUS[overall].text}>{SUMMARY[overall]} </span>}
            {dueCount > 0 && <span className="text-oc-gray">{checksDue(dueCount)}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/log" className={BTN_PRIMARY}>Log a reading</Link>
          <Link to="/symptoms" className={BTN}>I have a symptom</Link>
        </div>
      </div>

      {/* Daily check-in progress */}
      <div className="flex items-center gap-4">
        <p className={`${LABEL} shrink-0 text-white`}>
          Today’s check-in: <span className="font-mono tracking-normal">{progress.done} of {progress.total}</span> done
        </p>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-oc-panel"
          role="progressbar"
          aria-label="Today's check-in"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
        >
          <div className="h-full rounded-full bg-oc-blue transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatusCard key={card.type} {...card} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HabitatPanel />
        <section className={CARD}>
          <PageTitle title="Where you are" accent="you are" as="h2" size="text-xl" />
          <p className="mt-4 text-white/90">{environment.context}</p>
          <p className={`${LABEL} mt-4`}>Gravity</p>
          <p className="font-mono text-lg text-white">{environment.gravityLabel}</p>
          <p className={`${LABEL} mt-3`}>Response level · {responseLevel.label}</p>
          <p className="text-white/90">{responseLevel.summary}</p>
          <Link to="/mission" className="mt-4 inline-block font-semibold text-oc-blue hover:underline">
            Change location
          </Link>
        </section>
      </div>
    </div>
  )
}
