import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { DURATION, useAnimationsEnabled } from './components/motion.jsx'
import MasterAlarm from './components/MasterAlarm.jsx'
import StreakToast from './components/StreakToast.jsx'
import StartupScreen from './components/StartupScreen.jsx'
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

const STARTUP_KEY = 'orbitcare.startupShown' // sessionStorage: once per browser session

function startupAlreadyShown() {
  try {
    return sessionStorage.getItem(STARTUP_KEY) === '1'
  } catch {
    return true // storage blocked: skip the startup screen rather than show it on every load
  }
}

// The crew picker, unchanged inside. When animations are on, a click on a crew card first makes
// that card grow to 1.03 and brighten for 150 ms, then the original click goes through.
function CrewPickerWithTransition() {
  const enabled = useAnimationsEnabled()
  const passThrough = useRef(false)
  const pending = useRef(false)

  const onClickCapture = (event) => {
    if (!enabled || passThrough.current) return
    const card = event.target.closest('main li button')
    if (!card || /new astronaut/i.test(card.textContent)) return // "New astronaut" opens its form instantly
    event.preventDefault()
    event.stopPropagation()
    if (pending.current) return
    pending.current = true
    card.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.03)', filter: 'brightness(1.12)' },
      ],
      { duration: 150, easing: 'ease-out', fill: 'forwards' },
    )
    setTimeout(() => {
      passThrough.current = true
      card.click() // the crew picker's own handler selects the astronaut
      passThrough.current = false
      pending.current = false
    }, 150)
  }

  return (
    <div className="h-full" onClickCapture={onClickCapture}>
      <CrewPicker />
    </div>
  )
}

function MainApp() {
  const { astronaut } = useMission()
  // While the app fades out after "switch" there is no astronaut any more: render nothing,
  // so no page tries to read the old crew member (and the master alarm stops at once).
  if (!astronaut) return null
  return (
    <SpaceWeatherProvider>
      <StreakToast />
      {/* Master alarm bar above every page (including Emergency mode); the page fills the rest. */}
      <div className="flex h-full flex-col">
        <MasterAlarm />
        <div className="min-h-0 flex-1 overflow-auto">
      <Routes>
        {/* Emergency mode takes over the whole screen (no sidebar) and opens instantly (no transition). */}
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
        </div>
      </div>
    </SpaceWeatherProvider>
  )
}

export default function App() {
  const { astronaut } = useMission()
  const enabled = useAnimationsEnabled()
  const [showStartup, setShowStartup] = useState(() => enabled && !startupAlreadyShown())

  const finishStartup = useCallback(() => {
    try {
      sessionStorage.setItem(STARTUP_KEY, '1')
    } catch {
      // ignore: worst case the startup screen shows again next load
    }
    setShowStartup(false)
  }, [])

  // Nobody selected yet: pick a crew member first.
  const screen = astronaut ? <MainApp /> : <CrewPickerWithTransition />

  return (
    <>
      {/* Crew picker <-> app: fade (150 ms out, 250 ms in). Same tree when animations are off, just instant,
          so switching the setting never remounts the app. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={astronaut ? 'app' : 'picker'}
          className="h-full"
          initial={enabled ? { opacity: 0 } : false}
          animate={{ opacity: 1, transition: { duration: enabled ? DURATION.enter : 0 } }}
          exit={{ opacity: 0, transition: { duration: enabled ? DURATION.exit : 0 } }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{showStartup && enabled && <StartupScreen key="startup" onDone={finishStartup} />}</AnimatePresence>
    </>
  )
}
