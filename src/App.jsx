import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RadiationAlertSound from './components/RadiationAlertSound.jsx'
import CrewPicker from './pages/CrewPicker.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Distance from './pages/Distance.jsx'
import Emergency from './pages/Emergency.jsx'
import Environment from './pages/Environment.jsx'
import Gravity from './pages/Gravity.jsx'
import Guides from './pages/Guides.jsx'
import History from './pages/History.jsx'
import Isolation from './pages/Isolation.jsx'
import LogReading from './pages/LogReading.jsx'
import MissionSetup from './pages/MissionSetup.jsx'
import Profile from './pages/Profile.jsx'
import Radiation from './pages/Radiation.jsx'
import Settings from './pages/Settings.jsx'
import SymptomChecker from './pages/SymptomChecker.jsx'
import { useMission } from './store/MissionContext.jsx'
import { SpaceWeatherProvider } from './store/SpaceWeatherContext.jsx'

export default function App() {
  const { astronaut } = useMission()

  // Nobody selected yet: pick a crew member first.
  if (!astronaut) return <CrewPicker />

  return (
    <SpaceWeatherProvider>
      <RadiationAlertSound />
      <Routes>
        {/* Emergency mode takes over the whole screen (no sidebar). */}
        <Route path="/emergency" element={<Emergency />} />

        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/log" element={<LogReading />} />
          <Route path="/symptoms" element={<SymptomChecker />} />
          <Route path="/history" element={<History />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/radiation" element={<Radiation />} />
          <Route path="/isolation" element={<Isolation />} />
          <Route path="/distance" element={<Distance />} />
          <Route path="/gravity" element={<Gravity />} />
          <Route path="/environment" element={<Environment />} />
          <Route path="/mission" element={<MissionSetup />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </SpaceWeatherProvider>
  )
}
