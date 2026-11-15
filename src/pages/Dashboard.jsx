import { Link } from 'react-router-dom'
import HabitatPanel from '../components/HabitatPanel.jsx'
import StatusCard from '../components/StatusCard.jsx'
import PageTitle from '../components/PageTitle.jsx'
import { StaggerItem } from '../components/motion.jsx'
import { BTN_OUTLINE, BTN_PRIMARY, CARD, LABEL } from '../components/ui.js'
import { INDICATOR_ORDER } from '../data/thresholds.js'
import { getFreshness, getTodayProgress } from '../engine/checkin.js'
import { getStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { latestReading } from '../store/storage.js'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Status strip styles: icon + colours per state.
const STRIP = {
  red: { box: 'border-oc-alert bg-oc-alert/10', icon: 'bg-oc-alert text-oc-paper', glyph: '!', text: 'text-oc-alert' },
  yellow: { box: 'border-oc-yellow bg-oc-yellow/10', icon: 'bg-oc-yellow text-oc-navy', glyph: '!', text: 'text-oc-yellow' },
  due: { box: 'border-oc-border/70 bg-oc-panel/40', icon: 'bg-oc-silver text-oc-navy', glyph: '◷', text: 'text-white' },
  green: { box: 'border-oc-green/60 bg-oc-green/10', icon: 'bg-oc-green text-oc-paper', glyph: '✓', text: 'text-white' },
}

// One-line summary from the real readings and the daily check-in.
function stripState(cards, progress) {
  const red = cards.filter((c) => c.status?.level === 'red').length
  const yellow = cards.filter((c) => c.status?.level === 'yellow').length
  const current = cards.filter((c) => c.status).length
  const checks = `${progress.done} of ${progress.total} checks done`
  if (red) return { state: 'red', text: `${plural(red, 'reading')} need${red === 1 ? 's' : ''} attention now`, checks }
  if (yellow) return { state: 'yellow', text: `${plural(yellow, 'reading')} need${yellow === 1 ? 's' : ''} action`, checks }
  if (progress.done < progress.total) return { state: 'due', text: current ? 'Current readings normal' : 'No current readings', checks: `${checks} · ${plural(progress.total - progress.done, 'check')} due` }
  return { state: 'green', text: 'All readings normal', checks }
}

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
  const strip = stripState(cards, progress)
  const style = STRIP[strip.state]

  return (
    <div className="space-y-5">
      {/* Heading + actions */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-[16rem] flex-1">
          <PageTitle title="Health Status" accent="Status" size="text-4xl" />
        </div>
        <div className="flex gap-3">
          <Link to="/log" className={BTN_PRIMARY}>Log a reading</Link>
          <Link to="/symptoms" className={BTN_OUTLINE}>I have a symptom</Link>
        </div>
      </div>

      {/* Status strip: summary + today's check-in */}
      <StaggerItem index={0}>
      <div className={`relative overflow-hidden rounded border transition-colors duration-200 ${style.box}`} role="status">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base font-black ${style.icon}`} aria-hidden="true">
            {style.glyph}
          </span>
          <p className="text-lg font-semibold">
            <span className={style.text}>{strip.text}</span>
            <span className="text-white"> · {strip.checks}</span>
          </p>
        </div>
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-oc-blue/70 transition-[width] duration-300 ease-out"
          style={{ width: `${(progress.done / progress.total) * 100}%` }}
          role="progressbar"
          aria-label="Today's check-in"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
        />
      </div>
      </StaggerItem>

      {/* Vital cards (stagger in, 40 ms apart) */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, i) => (
          <StaggerItem key={card.type} index={i + 1} className="h-full">
            <StatusCard {...card} />
          </StaggerItem>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <StaggerItem index={cards.length + 1} className="h-full">
          <HabitatPanel />
        </StaggerItem>
        <StaggerItem index={cards.length + 2} className="h-full">
        <section className={`${CARD} h-full`}>
          <PageTitle title="Where you are" accent="you are" as="h2" size="text-2xl" />
          <p className="mt-4 text-white/90">{environment.context}</p>
          <p className={`${LABEL} mt-5`}>Gravity</p>
          <p className="mt-1 font-mono text-xl text-white">{environment.gravityLabel}</p>
          <p className={`${LABEL} mt-4`}>Response level</p>
          <p className="mt-1 font-mono text-xl text-white">{responseLevel.label}</p>
          <p className="mt-1 text-sm text-oc-gray">{responseLevel.summary}</p>
          <Link to="/mission" className="mt-4 inline-block text-sm font-semibold text-oc-blue hover:underline">
            Change location
          </Link>
        </section>
        </StaggerItem>
      </div>
    </div>
  )
}
