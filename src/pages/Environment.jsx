import HabitatPanel from '../components/HabitatPanel.jsx'
import HazardPage from '../components/HazardPage.jsx'

export default function Environment() {
  return (
    <HazardPage
      letter="E"
      title="Closed Environment"
      accent="Environment"
      intro="The crew lives in a sealed cabin where machines control the air, temperature, noise and light. Small problems build up because there is nowhere else to go."
    >
      <HabitatPanel />
    </HazardPage>
  )
}
