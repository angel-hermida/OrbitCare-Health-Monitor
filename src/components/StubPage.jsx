import PageTitle from './PageTitle.jsx'
import { CARD, H2, LABEL } from './ui.js'

// Placeholder for a RIDGE hazard page that is not built yet.
// Replace the page's contents with the real feature; the TODO list says what to build.
export default function StubPage({ letter, title, accent, intro, todo, children }) {
  return (
    <div className="space-y-5">
      <div>
        <p className={`${LABEL} mb-2 text-oc-blue`}>RIDGE · {letter}</p>
        <PageTitle title={title} accent={accent} />
        <p className="mt-3 max-w-3xl text-oc-gray">{intro}</p>
      </div>

      {children}

      <section className={`${CARD} border-dashed`}>
        <h2 className={H2}>Not built yet</h2>
        <p className="mt-1 text-sm text-oc-gray">This page is a placeholder. Planned features:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-6 text-white/90">
          {todo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
