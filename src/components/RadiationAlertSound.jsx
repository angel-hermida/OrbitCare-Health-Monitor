import { useEffect, useRef } from 'react'
import { getSensorStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { playAlertBeep } from './alertSound.js'

// Plays the alert beep once each time the radiation sensor turns red (if sound is on).
// Renders nothing. Mounted in App.jsx after a crew member is chosen.
export default function RadiationAlertSound() {
  const { sensors } = useMission()
  const { alertSound } = usePreferences()
  const isRed = getSensorStatus('radiation', sensors.radiation).level === 'red'
  const wasRed = useRef(isRed)

  useEffect(() => {
    if (isRed && !wasRed.current && alertSound) playAlertBeep()
    wasRed.current = isRed
  }, [isRed, alertSound])

  return null
}
