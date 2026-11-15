import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom'
import { formatDelay } from '../engine/responseLevel.js'
import { useMission } from '../store/MissionContext.jsx'
import Logo from './Logo.jsx'
import { DURATION, EASE_OUT, useAnimationsEnabled } from './motion.jsx'
import AssistantPanel, { useAssistantChat } from './AssistantPanel.jsx'
import PresenterPanel from './PresenterPanel.jsx'
import { BTN_DANGER, LABEL, LEVEL_BADGE } from './ui.js'

// Small line icons for the sidebar (24x24, stroke = currentColor).
const ICONS = {
  dashboard: 'M3 12h4l3-8 4 16 3-8h4',
  log: 'M12 5v14M5 12h14',
  symptoms: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  trends: 'M4 20V14M10 20V9M16 20V12M22 20V5',
  guides: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  radiation: 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 3a9 9 0 0 1 7.8 4.5L14 10.8M4.2 7.5A9 9 0 0 1 12 3M10 10.8 4.2 7.5M12 14v7',
  isolation: 'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM5 21c1-3 3.8-5 7-5s6 2 7 5',
  distance: 'M3 12h18M15 6l6 6-6 6M3 6v12',
  gravity: 'M12 3v14M6 11l6 6 6-6M5 21h14',
  environment: 'M4 20c0-8 6-14 16-16-1 10-7 16-15 16M4 20 12 12',
  mission: 'M5 21V4h12l-2.5 4L17 12H5',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  records: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M13 10v6',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21c0-4 3.6-6 8-6s8 2 8 6',
}

// Main groups at the top of the sidebar.
const NAV = [
  { title: 'Health', links: [
    ['/', 'Dashboard', 'dashboard'],
    ['/log', 'Log a reading', 'log'],
    ['/symptoms', 'Symptom checker', 'symptoms'],
    ['/history', 'Trends', 'trends'],
    ['/records', 'Medical records', 'records'],
    ['/guides', 'How to measure', 'guides'],
  ] },
  { title: 'Hazards', links: [
    ['/radiation', 'R · Radiation', 'radiation'],
    ['/isolation', 'I · Isolation', 'isolation'],
    ['/distance', 'D · Distance', 'distance'],
    ['/gravity', 'G · Gravity', 'gravity'],
    ['/environment', 'E · Environment', 'environment'],
  ] },
  { title: 'Mission', links: [
    ['/mission', 'Mission setup', 'mission'],
  ] },
]

// Pinned to the bottom of the sidebar, below a separator line.
const NAV_BOTTOM = [
  { title: 'System', links: [['/settings', 'Settings', 'settings']] },
  { title: 'Crew', links: [['/profile', 'My profile', 'profile']] },
]

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

function navClass({ isActive }) {
  return `flex items-center gap-3 border-l-[3px] px-4 py-2.5 text-[15px] ${
    isActive ? 'border-oc-blue bg-oc-panel font-semibold text-white' : 'border-transparent text-white/85 hover:bg-oc-panel/40 hover:text-white'
  }`
}

function NavGroup({ group }) {
  return (
    <div>
      <p className={`${LABEL} px-5 pb-2 text-white`}>{group.title}</p>
      {group.links.map(([to, label, icon]) => (
        <NavLink key={to} to={to} end={to === '/'} className={navClass}>
          <Icon name={icon} />
          {label}
        </NavLink>
      ))}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="border-l border-white/30 pl-6">
      <p className={LABEL}>{label}</p>
      <div className="mt-0.5 text-lg font-medium text-white">{children}</div>
    </div>
  )
}

// Top bar (style guide section 3): logo, who, where, delay to Earth, response level, emergency button.
// `oc-dark` keeps it dark in the light theme too.
function Banner({ assistantOpen, onToggleAssistant }) {
  const { astronaut, environment, missionDay, comms, responseLevel, selectAstronaut } = useMission()
  return (
    <header className="oc-dark relative z-20 shrink-0 border-b border-oc-blue bg-oc-bg">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <Link to="/" className="pr-2" aria-label="OrbitCare dashboard">
          <Logo className="h-12 text-white" />
        </Link>
        <Field label="Crew member">
          {astronaut.name}
          <button onClick={() => selectAstronaut(null)} className="ml-2 cursor-pointer text-sm font-normal text-oc-blue hover:underline">
            switch
          </button>
        </Field>
        <Link to="/mission" title="Mission setup" className="group -my-1 cursor-pointer rounded py-1 pr-3 hover:bg-oc-panel/60">
          <Field label="Location">
            <span className="group-hover:text-oc-blue">
              {environment.short} – Day {missionDay}
            </span>
          </Field>
        </Link>
        <Field label="Delay to Earth">
          <span className="font-mono">{formatDelay(comms)}</span>
        </Field>
        <div className="ml-auto flex items-center gap-5 border-l border-white/30 pl-6">
          <button
            onClick={onToggleAssistant}
            aria-pressed={assistantOpen}
            title="AI health assistant"
            className={`cursor-pointer rounded border-2 border-oc-blue px-3 py-1 text-sm font-bold uppercase tracking-wider ${assistantOpen ? 'bg-oc-blue text-oc-paper' : 'text-oc-blue hover:bg-oc-blue/15'}`}
          >
            Assistant
          </button>
          <Link
            to="/distance"
            title="Response level: see how it works"
            className={`rounded border-2 px-3 py-1 text-sm font-bold uppercase tracking-wider hover:opacity-85 ${LEVEL_BADGE[responseLevel.id]}`}
          >
            {responseLevel.label}
          </Link>
          <Link to="/emergency" className={`${BTN_DANGER} px-7 py-3 text-base tracking-widest`}>
            Emergency
          </Link>
        </div>
      </div>
      <span className="absolute -bottom-[3px] left-0 h-[5px] w-36 bg-oc-red" aria-hidden="true" />
    </header>
  )
}

// Keeps the page that is leaving on screen while it fades out (useOutlet would already show the new one).
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

// Page transitions: exit = fade out 150 ms; enter = fade in + slide up 8 px, 250 ms, ease-out.
// Only the main content animates. Instant when animations are off or reduced motion is on.
function AnimatedOutlet() {
  const location = useLocation()
  const enabled = useAnimationsEnabled()
  // Same tree when off (durations 0), so toggling the setting does not remount the page.
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={enabled ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0, transition: { duration: enabled ? DURATION.enter : 0, ease: EASE_OUT } }}
        exit={{ opacity: 0, transition: { duration: enabled ? DURATION.exit : 0 } }}
      >
        <FrozenOutlet />
      </motion.div>
    </AnimatePresence>
  )
}

// The page fills the window: top bar fixed at the top, sidebar and page content scroll separately.
export default function Layout() {
  // Layout stays mounted across pages, so the conversation survives navigation.
  const [assistantOpen, setAssistantOpen] = useState(false)
  const chat = useAssistantChat()
  return (
    <div className="oc-app flex h-full flex-col">
      <Banner assistantOpen={assistantOpen} onToggleAssistant={() => setAssistantOpen((o) => !o)} />

      <div className="relative flex min-h-0 flex-1">
        <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} chat={chat} />
        <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-oc-border/50 bg-oc-bg py-5">
          <nav className="space-y-6">
            {NAV.map((group, i) => (
              <div key={group.title} className={i > 0 ? 'border-t border-oc-border/40 pt-5' : ''}>
                <NavGroup group={group} />
              </div>
            ))}
          </nav>
          <nav className="mt-auto space-y-4 border-t border-oc-border/60 pt-5">
            {NAV_BOTTOM.map((group) => (
              <NavGroup key={group.title} group={group} />
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="w-full max-w-[1600px] flex-1 p-6 pb-20">
            <AnimatedOutlet />
          </main>
          <footer className="border-t border-oc-border/50 px-6 py-3 text-center text-sm text-oc-gray">
            <span className="font-semibold text-white">OrbitCare</span> — Guidance tool. Does not replace flight surgeons.
          </footer>
        </div>
      </div>

      <PresenterPanel />
    </div>
  )
}
