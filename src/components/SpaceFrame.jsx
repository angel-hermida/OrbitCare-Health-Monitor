import Logo from './Logo.jsx'

// The crew picker's frame (top bar, Earth backdrop, footer) for other screens shown before the
// main layout, e.g. New Crew Profile. Mirrors src/pages/CrewPicker.jsx, which is protected and
// keeps its own copy. `dim` darkens the backdrop behind the content for readability.
// `oc-app oc-dark` gives children the app palette and keeps them dark in both themes.
export default function SpaceFrame({ children, dim = false }) {
  return (
    <div className="oc-app oc-dark flex min-h-full flex-col bg-[#050b1f] text-white">
      <header className="relative z-10 border-b border-sky-400/70 bg-[#071233]">
        <div className="flex items-center gap-6 px-8 py-4">
          <Logo className="h-14 text-white" />
          <span className="h-10 w-px bg-white/40" aria-hidden="true" />
          <p className="hidden text-xs font-semibold tracking-[0.3em] text-white md:block">CREW HEALTH &amp; BIOMETRICS PLATFORM</p>
        </div>
        <span className="absolute -bottom-[3px] left-0 h-[5px] w-48 bg-oc-red" aria-hidden="true" />
      </header>

      <main className="oc-space relative flex-1 overflow-hidden">
        <div className="oc-earth" aria-hidden="true" />
        <div
          className={`pointer-events-none absolute inset-0 ${dim ? 'bg-[#050b1f]/55' : 'bg-gradient-to-b from-transparent via-transparent to-[#050b1f]/40'}`}
          aria-hidden="true"
        />
        <div className="relative">{children}</div>
      </main>

      <footer className="relative z-10 flex flex-wrap items-center gap-6 border-t border-sky-400/70 bg-[#071233] px-8 py-5">
        <Logo className="h-10 text-white" />
        <span className="h-10 w-px bg-white/40" aria-hidden="true" />
        <p className="text-white">
          <span className="font-bold">OrbitCare</span> — Guidance tool. Does not replace flight surgeons.
        </p>
        <p className="ml-auto text-sm text-white/85">Version 0.1 · Last updated Nov 2026</p>
      </footer>
    </div>
  )
}
