import { Link } from 'react-router-dom'
import StubPage from '../components/StubPage.jsx'
import { BTN_PRIMARY, CARD, H2 } from '../components/ui.js'
import { useMission } from '../store/MissionContext.jsx'
import { getReadings } from '../store/storage.js'

// STUB PAGE (I in RIDGE). The mood data it needs is already being logged.
// TODO: build the memory bank described in the list.
export default function Isolation() {
  const { db, astronaut } = useMission()
  const moods = getReadings(db, astronaut.id, 'mood').slice(-7)

  return (
    <StubPage
      letter="I"
      title="Isolation and confinement"
      intro="Months in a small space, far from family, wear people down. The app tracks mood every day and keeps home close."
      todo={[
        'Memory bank: family photos, video and voice messages, with a new drop every month',
        'Countdown to the next family drop',
        'When mood is low for several days, suggest opening the memory bank and talking to the crew or ground',
        'The memory bank is always open. Never lock it behind health tasks',
        'Pitch only: private journal',
      ]}
    >
      <section className={CARD}>
        <h2 className={H2}>Your last mood check-ins</h2>
        <div className="mt-3 flex items-end gap-2">
          {moods.map((reading) => (
            <div key={reading.id} className="flex flex-col items-center gap-1">
              <div className={`w-10 rounded-t ${reading.value <= 2 ? 'bg-amber-300' : 'bg-emerald-400'}`} style={{ height: `${reading.value * 14}px` }} />
              <span className="text-sm text-slate-300">{reading.value}</span>
            </div>
          ))}
        </div>
        <Link to="/log?type=mood" className={`${BTN_PRIMARY} mt-4`}>Do today’s mood check-in</Link>
      </section>
    </StubPage>
  )
}
