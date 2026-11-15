import ProfileForm from '../components/ProfileForm.jsx'
import SpaceFrame from '../components/SpaceFrame.jsx'
import { useMission } from '../store/MissionContext.jsx'

// Shown from the crew picker: create a custom astronaut and sign in as them.
// Same frame and backdrop as the crew picker, darkened behind the form.
export default function NewProfile({ onCancel }) {
  const { addAstronaut } = useMission()
  return (
    <SpaceFrame dim>
      <div className="mx-auto max-w-[900px] px-6 pb-16 pt-12">
        <ProfileForm
          title="New Crew Profile"
          accent="Profile"
          intro="Enter the crew member’s details. Earth baselines are estimated from them."
          centered
          submitLabel="Create profile"
          onSubmit={addAstronaut}
          onCancel={onCancel}
        />
      </div>
    </SpaceFrame>
  )
}
