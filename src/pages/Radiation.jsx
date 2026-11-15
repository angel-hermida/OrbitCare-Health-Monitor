import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import HazardPage from '../components/HazardPage.jsx'
import { SimulatedTag, StatusPill } from '../components/StatusPill.jsx'
import { BTN_DANGER, BTN_OUTLINE, CARD, H2, LABEL, STATUS } from '../components/ui.js'
import { EMERGENCIES } from '../data/emergencies.js'
import { DONKI_PAGE, FEED_NAMES, KINDS, recentHazard, relevanceAt, spaceWeatherSummary, WINDOW_DAYS } from '../engine/spaceWeather.js'
import { formatSensor, getSensorStatus } from '../engine/status.js'
import { formatDate, formatDateTime, timeAgo } from '../engine/time.js'
import { useMission } from '../store/MissionContext.jsx'
import { useSpaceWeather } from '../store/SpaceWeatherContext.jsx'

const DAY = 24 * 60 * 60 * 1000
const COLLAPSED_COUNT = 3
const SHOW_ALL_KEY = 'orbitcare.radiation.showAllEvents'
const ALL_CLEAR_MS = 60 * 1000
const LEVEL_RANK = { green: 0, yellow: 1, red: 2 }

// Timeline / list marker per event kind (shape + color, so it does not rely on color alone).
const DOT = {
  flare: 'rounded-full bg-oc-red',
  sep: 'rounded-full bg-oc-yellow',
  storm: 'rounded-full bg-oc-blue',
  cme: 'rotate-45 rounded-[2px] bg-oc-blue',
  rbe: 'rounded-full bg-oc-silver',
  other: 'rounded-full border border-oc-silver',
}

const RELEVANCE_STYLE = {
  high: { label: 'Matters here', className: 'border-oc-red text-oc-red' },
  some: { label: 'Some effect here', className: 'border-oc-blue text-oc-blue' },
  low: { label: 'Low impact here', className: 'border-oc-silver/70 text-oc-gray' },
}

const affectsHere = (relevance) => relevance.level === 'high' || relevance.level === 'some'

function readShowAll() {
  try {
    return localStorage.getItem(SHOW_ALL_KEY) === 'true'
  } catch {
    return false
  }
}

function saveShowAll(value) {
  try {
    localStorage.setItem(SHOW_ALL_KEY, String(value))
  } catch {
    // Not saved; the choice still applies until the page is left.
  }
}

// Honest source label: LIVE only for data fetched from NASA just now.
function SourceStatus({ status, fetchedAt }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-oc-green">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oc-green opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-oc-green" />
        </span>
        Live · NASA DONKI · updated {timeAgo(fetchedAt)}
      </span>
    )
  }
  const text =
    status === 'loading'
      ? fetchedAt
        ? `Connecting… · data from ${formatDateTime(fetchedAt)}`
        : 'Connecting to NASA DONKI…'
      : fetchedAt
        ? `Cached · ${formatDateTime(fetchedAt)}`
        : 'Offline · no NASA data yet'
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-oc-gray">
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-oc-silver" />
      {text}
    </span>
  )
}

// 30-day strip: one marker per event, today at the right. Shown with the full event list.
function Timeline({ events, now }) {
  const start = now - WINDOW_DAYS * DAY
  const inWindow = events.filter((e) => e.time >= start && e.time <= now)
  const kindsShown = Object.keys(KINDS).filter((kind) => inWindow.some((e) => e.kind === kind))
  const x = (fraction) => `calc(12px + ${fraction * 100}% - ${fraction * 24}px)`

  return (
    <div>
      <div className="relative h-16 rounded border border-oc-border/50 bg-oc-bg/40" role="img" aria-label={`${inWindow.length} space weather events in the last ${WINDOW_DAYS} days`}>
        <span className="absolute top-1/2 right-3 left-3 h-px bg-oc-border/60" aria-hidden="true" />
        {inWindow.length === 0 && <span className="absolute inset-0 flex items-center justify-center text-sm text-oc-gray">No events reported in this period</span>}
        {inWindow.map((event, i) => {
          const fraction = (event.time - start) / (WINDOW_DAYS * DAY)
          const lane = [0, -12, 12][i % 3] // spread close events over three lanes
          return (
            <span
              key={event.id}
              title={`${event.title} · ${formatDateTime(event.time)}${event.detail ? ` · ${event.detail}` : ''}`}
              className={`absolute top-1/2 h-3 w-3 ${DOT[event.kind] || DOT.other}`}
              style={{ left: `calc(${x(fraction)} - 6px)`, marginTop: `${lane - 6}px` }}
            />
          )
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs text-oc-gray">
        <span>{WINDOW_DAYS} days ago</span>
        <span>Today</span>
      </div>
      {kindsShown.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-oc-gray">
          {kindsShown.map((kind) => (
            <li key={kind} className="flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 ${DOT[kind]}`} aria-hidden="true" />
              {KINDS[kind]} ({inWindow.filter((e) => e.kind === kind).length})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// One event: title, date and impact tag. Click to show the explanation.
function EventRow({ event, relevance, open, onToggle }) {
  const style = RELEVANCE_STYLE[relevance.level]
  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 py-3 text-left hover:bg-oc-panel/30">
        <span className={`inline-block h-2.5 w-2.5 shrink-0 ${DOT[event.kind] || DOT.other}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 font-semibold text-white">{event.title}</span>
        <span className="font-mono text-sm text-oc-gray">{formatDateTime(event.time)}</span>
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${style.className}`}>{style.label}</span>
        <span className={`text-oc-gray transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true">
          ›
        </span>
      </button>
      {open && (
        <div className="space-y-1 pb-3 pl-6 text-sm">
          <p className="text-white/90">{event.meaning}</p>
          <p className="text-oc-gray">
            {relevance.text}
            {event.detail ? <span className="font-mono"> · {event.detail}</span> : null}
            {event.link && (
              <>
                {' · '}
                <a href={event.link} target="_blank" rel="noreferrer" className="text-oc-blue hover:underline">
                  NASA record
                </a>
              </>
            )}
          </p>
        </div>
      )}
    </li>
  )
}

// The three shelter levels, always shown together (style per level written out in full for Tailwind).
const LADDER = [
  {
    level: 'green',
    label: 'Nominal',
    message: 'No action required.',
    dot: 'bg-oc-green',
    border: 'border-oc-green',
    tint: 'bg-oc-green/10',
    text: 'text-oc-green',
    nowTag: 'bg-oc-green text-oc-paper',
  },
  {
    level: 'yellow',
    label: 'Elevated',
    message: 'Prepare to shelter. Avoid low-shielding areas.',
    dot: 'bg-oc-yellow',
    border: 'border-oc-yellow',
    tint: 'bg-oc-yellow/10',
    text: 'text-oc-yellow',
    nowTag: 'bg-oc-yellow text-oc-navy',
  },
  {
    level: 'red',
    label: 'Shelter',
    message: 'Proceed to storm shelter immediately.',
    dot: 'bg-oc-alert',
    border: 'border-oc-alert',
    tint: 'bg-oc-alert/15',
    text: 'text-oc-alert',
    nowTag: 'bg-oc-alert text-oc-paper',
  },
]

// Shelter card: a 3-level ladder. Level = the worse of the simulated cabin sensor and NASA's 24-hour warning.
function ShelterCard({ level, causes, environment, crew }) {
  const [inShelter, setInShelter] = useState(() => new Set())
  const [allClearUntil, setAllClearUntil] = useState(0)
  const wasRed = useRef(level === 'red')

  // Roll call resets when the alert ends; going from red back to green shows "All clear" for a minute.
  useEffect(() => {
    if (level === 'red') {
      wasRed.current = true
      return
    }
    setInShelter(new Set())
    if (level === 'green' && wasRed.current) {
      wasRed.current = false
      setAllClearUntil(Date.now() + ALL_CLEAR_MS)
    }
  }, [level])

  useEffect(() => {
    if (!allClearUntil) return
    const timer = setTimeout(() => setAllClearUntil(0), Math.max(0, allClearUntil - Date.now()))
    return () => clearTimeout(timer)
  }, [allClearUntil])

  const isAlert = level === 'red'
  const toggle = (id) =>
    setInShelter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const storm = EMERGENCIES.find((e) => e.id === 'radiationStorm')
  const steps = [environment.shelter, ...storm.steps.slice(1)] // same as Emergency mode

  return (
    <section
      className={`rounded border p-5 ${isAlert ? 'border-2 border-oc-alert bg-oc-alert/10 lg:col-span-2' : 'border-oc-border/70 bg-oc-panel/25'}`}
      role={isAlert ? 'alert' : undefined}
    >
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Shelter status</h2>

      {allClearUntil > 0 && level === 'green' && (
        <p className={`mt-3 rounded border px-3 py-2 font-semibold ${STATUS.green.border} ${STATUS.green.bg} text-white`} role="status">
          All clear. You can leave the shelter.
        </p>
      )}

      {/* The ladder: all three levels, the current one highlighted */}
      <ol className="mt-3 space-y-2" aria-label="Shelter level">
        {LADDER.map((rung) => {
          const current = rung.level === level
          return (
            <li
              key={rung.level}
              aria-current={current ? 'step' : undefined}
              className={`flex items-start gap-3 rounded border-l-4 px-3 py-2.5 transition-opacity ${current ? `${rung.border} ${rung.tint} opacity-100` : 'border-transparent opacity-40'}`}
            >
              <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${rung.dot}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={`flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${current ? rung.text : 'text-oc-gray'}`}>
                  {rung.label}
                  {current && <span className={`rounded px-1.5 py-0.5 text-[10px] tracking-[0.15em] ${rung.nowTag}`}>Now</span>}
                </p>
                <p className={`${rung.level === 'red' && current ? 'text-2xl font-black tracking-wide text-oc-alert' : current ? 'font-bold text-white' : 'text-white'}`}>
                  {rung.message}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-3 text-sm text-white">
        <span className={`${LABEL} mr-2`}>Designated shelter</span>
        {environment.shelterName}
      </p>

      {/* SHELTER: what to do now (the full shelter instruction is the first step) */}
      {isAlert && (
        <div className="mt-5 grid gap-6 border-t border-oc-alert/40 pt-5 md:grid-cols-[3fr_2fr]">
          <div>
            <p className={`${LABEL} text-white`}>Steps</p>
            <ol className="mt-2 list-decimal space-y-2 pl-6 text-lg text-white">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className={`${LABEL} text-white`}>
              Crew roll call · <span className="font-mono tracking-normal">{inShelter.size} of {crew.length}</span> in shelter
            </p>
            <ul className="mt-2 space-y-2">
              {crew.map((member) => (
                <li key={member.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded border border-oc-border/60 bg-oc-bg/40 px-3 py-2 text-white">
                    <input type="checkbox" checked={inShelter.has(member.id)} onChange={() => toggle(member.id)} className="h-5 w-5 accent-oc-green" />
                    <span className="flex-1">{member.name}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${inShelter.has(member.id) ? 'text-oc-green' : 'text-oc-gray'}`}>
                      {inShelter.has(member.id) ? 'In shelter' : 'Not yet'}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <Link to="/emergency" className={`${BTN_DANGER} mt-4 w-full px-6 py-3`}>
              Open Emergency mode
            </Link>
          </div>
        </div>
      )}

      {level !== 'green' && causes.length > 0 && <p className="mt-4 text-sm text-oc-gray">Cause: {causes.join(' and ')}</p>}
    </section>
  )
}

// Radiation hazard (R in RIDGE): the simulated cabin sensor and shelter advice first,
// then a one-line summary of real NASA space weather, with the event list on demand.
export default function Radiation() {
  const { sensors, environment, crew } = useMission()
  const sensorStatus = getSensorStatus('radiation', sensors.radiation)
  const weather = useSpaceWeather()
  const now = Date.now()
  const hazard = recentHazard(weather.events, now)
  const summary = weather.status === 'none' ? null : spaceWeatherSummary(weather.events, now)

  const [showAll, setShowAll] = useState(readShowAll)
  const [openIds, setOpenIds] = useState(() => new Set())
  const toggleShowAll = () => {
    setShowAll((prev) => {
      saveShowAll(!prev)
      return !prev
    })
  }
  const toggleOpen = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Each event with what it means here; "affecting" = tagged Matters here / Some effect here.
  const rated = weather.events.map((event) => ({ event, relevance: relevanceAt(event, environment.id) }))
  const affecting = rated.filter((r) => affectsHere(r.relevance))
  const affectingThisWeek = affecting.filter((r) => now - r.event.time < 7 * DAY).length
  const listed = showAll ? rated : affecting.slice(0, COLLAPSED_COUNT)

  // Shelter level: the worse of the cabin sensor and the NASA warning, with what caused it.
  const shelterLevel = hazard && LEVEL_RANK[sensorStatus.level] < LEVEL_RANK.red ? 'red' : sensorStatus.level
  const causes = []
  if (sensorStatus.level !== 'green') causes.push(sensors.stormActive ? 'simulated storm' : 'simulated cabin sensor')
  if (hazard) causes.push(`NASA – ${hazard.flareClass ? `${hazard.flareClass} flare` : KINDS[hazard.kind].toLowerCase()}, ${formatDate(hazard.time)}`)

  // One sentence from the NASA data.
  let sentence = null
  if (hazard) {
    sentence = `Warning: ${hazard.flareClass ? `${hazard.flareClass.charAt(0).toUpperCase()}-class flare` : KINDS[hazard.kind].toLowerCase()} in the last 24 hours.`
  } else if (summary) {
    const affectingText = affectingThisWeek === 0 ? 'No events in the last 7 days affect you here.' : `${affectingThisWeek} event${affectingThisWeek === 1 ? '' : 's'} in the last 7 days affect${affectingThisWeek === 1 ? 's' : ''} you here.`
    sentence = `Space weather: ${summary.label.toLowerCase()}. ${affectingText}`
  }
  const sentenceColor = hazard ? 'text-oc-alert' : summary?.level === 'elevated' ? 'text-oc-yellow' : 'text-white'

  return (
    <HazardPage
      letter="R"
      title="Radiation Watch"
      accent="Watch"
      intro="Outside Earth's magnetic field, solar storms can raise radiation fast. The app watches the level and tells the crew when and where to shelter."
    >
      {/* NASA warning: X-class flare or particle event in the last 24 hours */}
      {hazard && (
        <section className="rounded border-2 border-oc-alert bg-oc-alert/10 p-5" role="alert">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-oc-alert">Space weather warning · NASA DONKI</p>
          <p className="mt-1 text-lg font-bold text-white">
            {hazard.title} {hazard.flareClass ? `(${hazard.flareClass})` : ''} at {formatDateTime(hazard.time)}
          </p>
          <p className="mt-1 text-white/90">{hazard.meaning}</p>
        </section>
      )}

      {/* 1. Right now */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded border p-5 ${STATUS[sensorStatus.level].border} ${STATUS[sensorStatus.level].bg}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className={H2}>Cabin radiation</h2>
              <SimulatedTag />
            </div>
            <StatusPill level={sensorStatus.level} />
          </div>
          <p className={`mt-2 font-mono text-5xl font-medium ${sensorStatus.level === 'green' ? 'text-white' : STATUS[sensorStatus.level].text}`}>
            {formatSensor('radiation', sensors.radiation)}
          </p>
          {sensorStatus.level !== 'green' && <p className="mt-2 text-white">{sensorStatus.action}</p>}
        </section>

        <ShelterCard level={shelterLevel} causes={causes} environment={environment} crew={crew} />
      </div>

      {/* 2-4. NASA space weather */}
      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className={`text-lg font-semibold ${sentenceColor}`}>{sentence || 'Space weather: no NASA data yet.'}</p>
          <SourceStatus status={weather.status} fetchedAt={weather.fetchedAt} />
        </div>

        <div className="mt-4 border-t border-oc-border/40">
          {listed.length === 0 ? (
            <p className="py-3 text-white/90">No events affecting you right now.</p>
          ) : (
            <ul className="divide-y divide-oc-border/40">
              {listed.map(({ event, relevance }) => (
                <EventRow key={event.id} event={event} relevance={relevance} open={openIds.has(event.id)} onToggle={() => toggleOpen(event.id)} />
              ))}
            </ul>
          )}
        </div>

        {showAll && weather.events.length > 0 && (
          <div className="mt-4">
            <Timeline events={weather.events} now={now} />
          </div>
        )}

        {weather.events.length > 0 && (
          <button type="button" className={`${BTN_OUTLINE} mt-4`} onClick={toggleShowAll} aria-expanded={showAll}>
            {showAll ? 'Hide events' : `Show all events (${weather.events.length})`}
          </button>
        )}

        {weather.unavailable?.length > 0 && (
          <p className="mt-3 text-sm text-oc-gray">
            Not available from NASA right now: {weather.unavailable.map((feed) => FEED_NAMES[feed]).join(', ')}. Will retry in 10 minutes.
          </p>
        )}

        <p className="mt-4 text-xs text-oc-gray">
          Source:{' '}
          <a href={DONKI_PAGE} target="_blank" rel="noreferrer" className="text-oc-blue hover:underline">
            NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)
          </a>
          . Event data is NASA’s; the crew explanations are OrbitCare’s.
        </p>
      </section>
    </HazardPage>
  )
}
