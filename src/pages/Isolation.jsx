import { Link } from 'react-router-dom'
import HazardPage from '../components/HazardPage.jsx'
import MemoryBank from '../components/MemoryBank.jsx'
import { BTN_PRIMARY, CARD, H2 } from '../components/ui.js'
import { useMission } from '../store/MissionContext.jsx'
import { getReadings } from '../store/storage.js'

export default function Isolation() {
  const { db, astronaut } = useMission()
  const moods = getReadings(db, astronaut.id, 'mood').slice(-7)

  return (
    <HazardPage
      letter="I"
      title="Isolation and Confinement"
      accent="Isolation"
      intro="Months in a small space, far from family, wear people down. The app tracks mood every day and keeps home close."
    >
      <section className={CARD}>
        <h2 className={H2}>Your last mood check-ins</h2>
        <div className="mt-3 flex items-end gap-2">
          {moods.map((reading) => (
            <div key={reading.id} className="flex flex-col items-center gap-1">
              <div className={`w-10 rounded-t-sm ${reading.value <= 2 ? 'bg-oc-yellow' : 'bg-oc-green'}`} style={{ height: `${reading.value * 14}px` }} />
              <span className="font-mono text-sm text-oc-gray">{reading.value}</span>
            </div>
          ))}
        </div>
        <Link to="/log?type=mood" className={`${BTN_PRIMARY} mt-4`}>Do today’s mood check-in</Link>
      </section>

      <MemoryBank />
    </HazardPage>
  )
}
