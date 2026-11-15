import PageTitle from './PageTitle.jsx'
import { LABEL } from './ui.js'

// Frame for a RIDGE hazard page: letter label, title with one red word, short intro, then the content.
export default function HazardPage({ letter, title, accent, intro, children }) {
  return (
    <div className="space-y-5">
      <div>
        <p className={`${LABEL} mb-2 text-oc-blue`}>RIDGE · {letter}</p>
        <PageTitle title={title} accent={accent} />
        <p className="mt-3 max-w-3xl text-oc-gray">{intro}</p>
      </div>

      {children}
    </div>
  )
}
