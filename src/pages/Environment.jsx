import HabitatPanel from '../components/HabitatPanel.jsx'
import StubPage from '../components/StubPage.jsx'

// STUB PAGE (E in RIDGE). The live cabin sensors below already work.
// TODO: build the features described in the list.
export default function Environment() {
  return (
    <StubPage
      letter="E"
      title="Closed environment"
      intro="The crew lives in a sealed cabin where machines control the air, temperature, noise and light. Small problems build up because there is nowhere else to go."
      todo={[
        'Sensor history: how long each value has been out of range (e.g. "CO₂ has been high for 6 hours")',
        'Crew illness alert: when one person logs a fever, tell everyone to clean shared surfaces and check their temperature',
        'Body clock helper: fixed sleep and wake times with lighting reminders',
        'Pitch only: dust check after surface activity on the Moon or Mars',
      ]}
    >
      <HabitatPanel />
      <p className="text-sm text-slate-400">Try it: Distance page → Demo controls → Trigger CO₂ spike, then run the Symptom checker for a headache.</p>
    </StubPage>
  )
}
