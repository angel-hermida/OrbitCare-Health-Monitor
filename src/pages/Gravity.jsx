import StubPage from '../components/StubPage.jsx'
import { CARD, H2 } from '../components/ui.js'
import { useMission } from '../store/MissionContext.jsx'

const EARTH_JUMP_METERS = 0.5 // an average standing jump on Earth

// STUB PAGE (G in RIDGE). The gravity level and jump height below already follow the location.
// TODO: build the features described in the list.
export default function Gravity() {
  const { environment } = useMission()
  const jump = environment.gravity > 0 ? `${(EARTH_JUMP_METERS / environment.gravity).toFixed(1)} m` : 'You would float away. Strap in.'

  return (
    <StubPage
      letter="G"
      title="Gravity Levels"
      accent="Levels"
      intro="Without Earth gravity, bones and muscles do less work and get weaker. Moving between gravity levels also upsets balance and blood pressure."
      todo={[
        'Jump visual: a figure that jumps higher and lands slower in low gravity (height = Earth jump ÷ gravity)',
        'Bone-loss meter that rises with days in low gravity and slows when exercise is logged',
        'Daily exercise log (needs a new reading type or a separate exercise list in storage)',
        'Hydration reminders',
        'Landing checklist before arriving at Mars or returning to Earth: fluids, balance, readiness',
        'Pitch only: stand-up test (heart rate and blood pressure lying down, then standing)',
      ]}
    >
      <section className={`${CARD} grid gap-4 sm:grid-cols-2`}>
        <div>
          <h2 className={H2}>Gravity here</h2>
          <p className="mt-1 font-mono text-3xl font-medium text-white">{environment.gravityLabel}</p>
          <p className="text-sm text-oc-gray">{environment.name}</p>
        </div>
        <div>
          <h2 className={H2}>How high you could jump</h2>
          <p className="mt-1 font-mono text-3xl font-medium text-white">{jump}</p>
          <p className="text-sm text-slate-400">On Earth: {EARTH_JUMP_METERS} m. Easier to move, but your bones and muscles work less.</p>
        </div>
      </section>
    </StubPage>
  )
}
