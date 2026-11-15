import { Link } from 'react-router-dom'
import HabitatPanel from '../components/HabitatPanel.jsx'
import StatusCard from '../components/StatusCard.jsx'
import PageTitle from '../components/PageTitle.jsx'
import { BTN, BTN_PRIMARY, CARD, LABEL, STATUS } from '../components/ui.js'
import { INDICATOR_ORDER } from '../data/thresholds.js'
import { getStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { latestReading } from '../store/storage.js'

const SUMMARY = {
  green: 'All your latest readings are normal.',
  yellow: 'Some readings need a simple action. See the yellow cards.',
  red: 'A reading needs attention now. See the red card.',
}

export default function Dashboard() {
  const { db, astronaut, missionState, environment, responseLevel } = useMission()

  // Latest reading + status for each indicator.
  const cards = INDICATOR_ORDER.map((type) => {
    const reading = latestReading(db, astronaut.id, type)
    const status = reading ? getStatus(type, reading.value, astronaut, missionState) : null
    return { type, reading, status }
  })

  const levels = cards.map((card) => card.status?.level)
  const overall = levels.includes('red') ? 'red' : levels.includes('yellow') ? 'yellow' : 'green'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <PageTitle title="Health Status" accent="Status" />
          <p className={`mt-3 text-lg font-medium ${STATUS[overall].text}`}>{SUMMARY[overall]}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/log" className={BTN_PRIMARY}>Log a reading</Link>
          <Link to="/symptoms" className={BTN}>I have a symptom</Link>
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
          <Link to="/settings" className="mt-4 inline-block font-semibold text-oc-blue hover:underline">
            Change location or mission day
          </Link>
        </section>
      </div>
    </div>
  )
}
