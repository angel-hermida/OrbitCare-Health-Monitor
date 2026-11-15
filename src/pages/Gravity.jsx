import HazardPage from '../components/HazardPage.jsx'
import { CARD, H2 } from '../components/ui.js'
import { useMission } from '../store/MissionContext.jsx'

const EARTH_JUMP_METERS = 0.5 // an average standing jump on Earth

export default function Gravity() {
  const { environment } = useMission()
  const microgravity = environment.gravity === 0
  const jump = microgravity ? 'Microgravity – jump height not applicable.' : `${(EARTH_JUMP_METERS / environment.gravity).toFixed(1)} m`

  return (
    <HazardPage
      letter="G"
      title="Gravity Levels"
      accent="Levels"
      intro="Without Earth gravity, bones and muscles do less work and get weaker. Moving between gravity levels also upsets balance and blood pressure."
    >
      <section className={`${CARD} grid gap-4 sm:grid-cols-2`}>
        <div>
          <h2 className={H2}>Gravity here</h2>
          <p className="mt-1 font-mono text-3xl font-medium text-white">{environment.gravityLabel}</p>
          <p className="text-sm text-oc-gray">{environment.name}</p>
        </div>
        <div>
          <h2 className={H2}>Standing jump height</h2>
          <p className={microgravity ? 'mt-2 text-lg font-semibold text-white' : 'mt-1 font-mono text-3xl font-medium text-white'}>{jump}</p>
          <p className="text-sm text-slate-400">Earth reference: {EARTH_JUMP_METERS} m. Lower gravity means less load on bones and muscles.</p>
        </div>
      </section>
    </HazardPage>
  )
}
