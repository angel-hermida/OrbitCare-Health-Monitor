import { Link, NavLink, Outlet } from 'react-router-dom'
import { formatDelay } from '../engine/responseLevel.js'
import { useMission } from '../store/MissionContext.jsx'
import { BTN_DANGER, LEVEL_BADGE } from './ui.js'

const NAV = [
  { title: 'Health', links: [
    ['/', 'Dashboard'],
    ['/log', 'Log a reading'],
    ['/symptoms', 'Symptom checker'],
    ['/history', 'Trends'],
    ['/guides', 'How to measure'],
  ] },
  { title: 'Hazards (RIDGE)', links: [
    ['/radiation', 'R · Radiation'],
    ['/isolation', 'I · Isolation'],
    ['/settings', 'D · Distance'],
    ['/gravity', 'G · Gravity'],
    ['/environment', 'E · Environment'],
  ] },
  { title: 'Crew', links: [
    ['/profile', 'My profile'],
  ] },
]

function navClass({ isActive }) {
  return `block rounded-lg px-3 py-2 text-[15px] ${isActive ? 'bg-sky-500/15 font-semibold text-sky-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
}

// Top bar: who, where, how far from Earth, who leads, and the emergency button.
function Banner() {
  const { astronaut, environment, missionDay, comms, responseLevel, selectAstronaut } = useMission()
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Crew member</p>
        <p className="font-semibold text-white">
          {astronaut.name}{' '}
          <button onClick={() => selectAstronaut(null)} className="ml-1 cursor-pointer text-sm font-normal text-sky-400 hover:text-sky-300">
            switch
          </button>
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Location</p>
        <p className="font-semibold text-white">{environment.short} · Day {missionDay}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Delay to Earth</p>
        <p className="font-semibold text-white">{formatDelay(comms)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Response level</p>
        <Link to="/settings" className={`inline-block rounded-md border px-2 py-0.5 text-sm font-bold ${LEVEL_BADGE[responseLevel.id]}`}>
          {responseLevel.label}
        </Link>
      </div>
      <Link to="/emergency" className={`${BTN_DANGER} ml-auto px-6 py-3 text-lg tracking-wide`}>
        EMERGENCY
      </Link>
    </header>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-full">
      <aside className="w-56 shrink-0 border-r border-slate-800 bg-slate-900/50 p-4">
        <p className="px-3 text-xl font-bold text-white">OrbitCare</p>
        <p className="px-3 text-xs text-slate-400">Crew health monitor</p>
        <nav className="mt-5 space-y-5">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title}</p>
              {group.links.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/'} className={navClass}>
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Banner />
        <main className="mx-auto w-full max-w-6xl flex-1 p-6">
          <Outlet />
        </main>
        <footer className="border-t border-slate-800 px-6 py-3 text-center text-sm text-slate-400">
          Guidance tool. Does not replace flight surgeons.
        </footer>
      </div>
    </div>
  )
}
