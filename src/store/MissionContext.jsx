// Global mission state. Any component can call useMission() to read it.
//
// Data flow:  form -> addReading() -> db (saved to localStorage) -> status engine -> UI

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ENVIRONMENTS } from '../data/environments.js'
import { getComms, getResponseLevel } from '../engine/responseLevel.js'
import { INITIAL_SENSORS, SENSOR_TICK_MS, stepSensors } from '../engine/sensors.js'
import { createSeedDb } from '../engine/seed.js'
import { usePreferences } from './PreferencesContext.jsx'
import {
  addAstronaut as addAstronautToDb,
  addReading as addReadingToDb,
  addRecord as addRecordToDb,
  removeRecord as removeRecordFromDb,
  allAstronauts,
  findAstronaut,
  getReadings,
  loadDb,
  removeAstronaut as removeAstronautFromDb,
  saveDb,
  updateAstronaut as updateAstronautInDb,
  advanceDay as advanceDayInDb,
} from './storage.js'

const MissionContext = createContext(null)

export function MissionProvider({ children }) {
  // First load: use saved data, or create the 30-day demo history.
  const [db, setDb] = useState(() => loadDb() || createSeedDb())
  // The Animations preference (Settings), passed through so useMission() can expose it too.
  const { animations: animationsPreference } = usePreferences()
  const [sensors, setSensors] = useState(INITIAL_SENSORS)

  // Save every change.
  useEffect(() => {
    saveDb(db)
  }, [db])

  // One loop drives all simulated sensors.
  useEffect(() => {
    const timer = setInterval(() => setSensors(stepSensors), SENSOR_TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const { settings } = db
  const astronaut = findAstronaut(db, settings.astronautId)
  const crew = useMemo(() => allAstronauts(db), [db])
  const environment = ENVIRONMENTS[settings.environment]
  const comms = useMemo(() => getComms(settings.environment, settings.missionDay), [settings.environment, settings.missionDay])
  const responseLevel = getResponseLevel(comms)

  const updateSettings = useCallback((patch) => {
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  // ----- actions -----

  const addReading = useCallback((reading) => {
    setDb((prev) => addReadingToDb(prev, reading))
  }, [])

  // Medical records read by the AI assistant (see pages/Records.jsx). Always for the signed-in astronaut.
  const addRecord = useCallback((record) => {
    setDb((prev) => addRecordToDb(prev, { ...record, astronautId: prev.settings.astronautId }))
  }, [])

  const removeRecord = useCallback((recordId) => {
    setDb((prev) => removeRecordFromDb(prev, prev.settings.astronautId, recordId))
  }, [])

  const selectAstronaut = useCallback((astronautId) => updateSettings({ astronautId }), [updateSettings])

  // Create a custom astronaut and sign in as them.
  const addAstronaut = useCallback((profile, overrides) => {
    setDb((prev) => {
      const { db: next, astronaut } = addAstronautToDb(prev, profile, overrides)
      return { ...next, settings: { ...next.settings, astronautId: astronaut.id } }
    })
  }, [])

  // Save edits to a profile and its baselines.
  const updateAstronaut = useCallback((id, profile, overrides) => {
    setDb((prev) => updateAstronautInDb(prev, id, profile, overrides))
  }, [])

  // Remove an astronaut and their data. If it is the current user, the crew picker shows next.
  const removeAstronaut = useCallback((id) => {
    setDb((prev) => removeAstronautFromDb(prev, id))
  }, [])

  const setEnvironment = useCallback((envId) => {
    setDb((prev) => {
      if (prev.settings.environment === envId) return prev
      const max = ENVIRONMENTS[envId].maxMissionDay
      return {
        ...prev,
        settings: {
          ...prev.settings,
          environment: envId,
          missionDay: Math.min(prev.settings.missionDay, max),
          environmentChangedAt: Date.now(), // used by the "recent change in gravity" check
        },
      }
    })
  }, [])

  const setMissionDay = useCallback((missionDay) => updateSettings({ missionDay }), [updateSettings])

  // Presenter "Next day": mission day +1 and all history 24 h older, so every check-in is due.
  const advanceDay = useCallback(() => {
    setDb((prev) => advanceDayInDb(prev, ENVIRONMENTS[prev.settings.environment]?.maxMissionDay))
  }, [])

  const setStorm = useCallback((active) => {
    setSensors((prev) => ({ ...prev, stormActive: active }))
    if (active) setDb((prev) => ({ ...prev, events: [...prev.events, { type: 'solarStorm', timestamp: Date.now() }] }))
  }, [])

  const setCo2Spike = useCallback((active) => {
    setSensors((prev) => ({ ...prev, co2Spike: active }))
    if (active) setDb((prev) => ({ ...prev, events: [...prev.events, { type: 'co2Spike', timestamp: Date.now() }] }))
  }, [])

  const logSymptom = useCallback((entry) => {
    setDb((prev) => ({ ...prev, symptoms: [...prev.symptoms, { ...entry, timestamp: Date.now() }] }))
  }, [])

  // Memory bank (Isolation page): which messages were opened, and the Dashboard card dismissed for the day.
  const markMemoryOpened = useCallback((messageId) => {
    setDb((prev) => {
      const opened = prev.memoryOpened ?? []
      return opened.includes(messageId) ? prev : { ...prev, memoryOpened: [...opened, messageId] }
    })
  }, [])

  const dismissMemoryCard = useCallback(() => {
    setDb((prev) => ({
      ...prev,
      memoryCardDismissed: { ...(prev.memoryCardDismissed ?? {}), [prev.settings.astronautId]: prev.settings.missionDay },
    }))
  }, [])

  const resetDemo = useCallback(() => {
    setSensors(INITIAL_SENSORS)
    // Demo reset restores the 4 preset astronauts (undoing edits and removals) and keeps custom profiles (their readings are cleared).
    setDb((prev) => ({ ...createSeedDb(), astronauts: prev.astronauts ?? [], records: prev.records ?? [] }))
  }, [])

  // What the status engine needs to know about the mission.
  const missionState = useMemo(
    () => ({ responseLevel, comms, environment, gravity: environment.gravity }),
    [responseLevel, comms, environment]
  )

  // What the symptom checker's data checks need.
  const getCheckContext = useCallback(
    () => ({
      sensors,
      events: db.events,
      readings: astronaut ? getReadings(db, astronaut.id) : [],
      environmentChangedAt: settings.environmentChangedAt,
      now: Date.now(),
    }),
    [sensors, db, astronaut, settings.environmentChangedAt]
  )

  const value = {
    animationsPreference, // Settings > Animations. Components should use useAnimationsEnabled() (also checks reduced motion).
    db,
    astronaut,
    crew,
    environment,
    missionDay: settings.missionDay,
    comms,
    responseLevel,
    missionState,
    sensors,
    addReading,
    addRecord,
    removeRecord,
    selectAstronaut,
    addAstronaut,
    updateAstronaut,
    removeAstronaut,
    setEnvironment,
    setMissionDay,
    advanceDay,
    setStorm,
    setCo2Spike,
    logSymptom,
    markMemoryOpened,
    dismissMemoryCard,
    resetDemo,
    getCheckContext,
  }

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>
}

export function useMission() {
  const mission = useContext(MissionContext)
  if (!mission) throw new Error('useMission must be used inside <MissionProvider>')
  return mission
}
