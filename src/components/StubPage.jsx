import { CARD, H1, H2 } from './ui.js'

// Placeholder for a RIDGE hazard page that is not built yet.
// Replace the page's contents with the real feature; the TODO list says what to build.
export default function StubPage({ letter, title, intro, todo, children }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">RIDGE · {letter}</p>
        <h1 className={H1}>{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-300">{intro}</p>
      </div>

      {children}

      <section className={`${CARD} border-dashed border-slate-600`}>
        <h2 className={H2}>Not built yet</h2>
        <p className="mt-1 text-sm text-slate-400">This page is a placeholder. Planned features:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 text-slate-200">
          {todo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
