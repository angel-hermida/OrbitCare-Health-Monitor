import ProfileForm from '../components/ProfileForm.jsx'
import { useMission } from '../store/MissionContext.jsx'

// Shown from the crew picker: create a custom astronaut and sign in as them.
export default function NewProfile({ onCancel }) {
  const { addAstronaut } = useMission()
  return (
    // `oc-app` gives this screen the app's palette and type (it is shown before the main layout).
    <div className="oc-app min-h-full">
      <div className="mx-auto max-w-4xl p-8">
        <ProfileForm title="New astronaut profile" submitLabel="Create profile" onSubmit={addAstronaut} onCancel={onCancel} />
      </div>
    </div>
  )
}
