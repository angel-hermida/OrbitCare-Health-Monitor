import { Link } from 'react-router-dom'
import HabitatPanel from '../components/HabitatPanel.jsx'
import StatusCard from '../components/StatusCard.jsx'
import { BTN, BTN_PRIMARY, CARD, H1, H2, STATUS } from '../components/ui.js'
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
        <div>
          <h1 className={H1}>Health status</h1>
          <p className={`mt-1 text-lg font-medium ${STATUS[overall].text}`}>{SUMMARY[overall]}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/log" className={BTN_PRIMARY}>Log a reading</Link>
          <Link to="/symptoms" className={BTN}>I have a symptom</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatusCard key={card.type} {...card} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HabitatPanel />
        <section className={CARD}>
          <h2 className={H2}>Where you are</h2>
          <p className="mt-2 text-slate-200">{environment.context}</p>
          <p className="mt-3 text-slate-300">
            <span className="font-semibold text-white">Gravity: </span>
            {environment.gravityLabel}
          </p>
          <p className="mt-1 text-slate-300">
            <span className="font-semibold text-white">{responseLevel.label}: </span>
            {responseLevel.summary}
          </p>
          <Link to="/settings" className="mt-3 inline-block font-semibold text-sky-400 hover:text-sky-300">
            Change location or mission day
          </Link>
        </section>
      </div>
    </div>
  )
}
