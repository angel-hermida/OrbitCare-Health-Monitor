import { useState } from 'react'
import Logo from '../components/Logo.jsx'
import { useMission } from '../store/MissionContext.jsx'
import NewProfile from './NewProfile.jsx'

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20.5c0-3.6 3.6-6 8-6s8 2.4 8 6v.5H4z" />
    </svg>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-slate-800 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

// First screen: choose who is using the app, or create a new astronaut profile.
// `crew` = the 4 presets plus custom profiles, minus removed ones (store/storage.js allAstronauts).
export default function CrewPicker() {
  const { crew, selectAstronaut } = useMission()
  const [creating, setCreating] = useState(false)

  if (creating) return <NewProfile onCancel={() => setCreating(false)} />

  return (
    <div className="flex min-h-full flex-col bg-[#050b1f] text-white">
      {/* Top bar */}
      <header className="relative z-10 border-b border-sky-400/70 bg-[#071233]">
        <div className="flex items-center gap-6 px-8 py-4">
          <Logo className="h-14 text-white" />
          <span className="h-10 w-px bg-white/40" aria-hidden="true" />
          <p className="hidden text-xs font-semibold tracking-[0.3em] text-slate-100 md:block">CREW HEALTH &amp; BIOMETRICS PLATFORM</p>
          <button
            type="button"
            className="ml-auto cursor-pointer rounded-lg border-2 border-white/90 px-8 py-2 text-base font-bold tracking-wide text-white hover:bg-white/10"
          >
            SIGN UP
          </button>
        </div>
        <span className="absolute -bottom-[3px] left-0 h-[5px] w-48 bg-red-600" aria-hidden="true" />
      </header>

      {/* Space backdrop + content */}
      <main className="oc-space relative flex-1 overflow-hidden">
        <div className="oc-earth" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050b1f]/40" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-6xl flex-col px-8 pb-16 pt-14">
          <h1 className="text-center text-5xl font-extrabold tracking-tight md:text-6xl">
            Who is <span className="text-red-500">Checking</span> in?
          </h1>
          <div className="relative mx-auto mt-6 w-full max-w-xl" aria-hidden="true">
            <div className="oc-horizon" />
            <svg viewBox="0 0 20 20" className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
              <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0 Z" fill="currentColor" />
            </svg>
          </div>

          <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
            {/* Left: intro */}
            <div className="lg:pl-6">
              <p className="text-4xl font-bold italic md:text-5xl">
                <span className="mr-3 text-red-500">/</span>Pick your <span className="font-extrabold text-red-500">Profile.</span>
              </p>
              <p className="mt-5 max-w-lg pl-10 text-2xl leading-snug text-slate-200 md:text-3xl">
                Your readings are compared with your own Earth baseline.
              </p>
            </div>

            {/* Right: one card per crew member, then "New astronaut" */}
            <ul className="space-y-5">
              {crew.map((astronaut) => (
                <li key={astronaut.id}>
                  <button
                    type="button"
                    onClick={() => selectAstronaut(astronaut.id)}
                    className="group flex w-full cursor-pointer items-center gap-6 rounded-xl bg-slate-50 px-8 py-4 text-left shadow-lg shadow-black/30 transition hover:bg-white hover:ring-2 hover:ring-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <PersonIcon />
                    <span className="min-w-0 flex-1">
                      <span className="block text-2xl font-bold text-slate-900">{astronaut.name}</span>
                      <span className="block text-sm text-slate-500">{astronaut.role}</span>
                    </span>
                    <Chevron />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="group flex w-full cursor-pointer items-center gap-6 rounded-xl border-2 border-dashed border-white/50 px-8 py-4 text-left text-white transition hover:border-sky-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center text-3xl leading-none" aria-hidden="true">+</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-2xl font-bold">New astronaut</span>
                    <span className="block text-sm text-slate-300">Enter name, age, gender, weight and height</span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-wrap items-center gap-6 border-t border-sky-400/70 bg-[#071233] px-8 py-5">
        <Logo className="h-10 text-white" />
        <span className="h-10 w-px bg-white/40" aria-hidden="true" />
        <p className="text-slate-100">
          <span className="font-bold text-white">OrbitCare</span> — Guidance tool. Does not replace flight surgeons.
        </p>
        <p className="ml-auto text-sm text-slate-200">Version 0.1 · Last updated Nov 2026</p>
      </footer>
    </div>
  )
}
