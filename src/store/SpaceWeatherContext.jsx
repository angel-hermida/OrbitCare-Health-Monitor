// Live NASA space weather for the whole app (engine/spaceWeather.js does the fetching).
// Fetches once when the app opens (after a crew member is picked), then every 10 minutes.
// Components call useSpaceWeather() -> { status, fetchedAt, events, unavailable }.

import { createContext, useContext, useEffect, useState } from 'react'
import { loadCachedSpaceWeather, loadSpaceWeather, REFRESH_MS } from '../engine/spaceWeather.js'

const SpaceWeatherContext = createContext(null)

function initialState() {
  const cached = loadCachedSpaceWeather()
  return cached ? { status: 'loading', unavailable: [], ...cached } : { status: 'loading', fetchedAt: null, events: [], unavailable: [] }
}

export function SpaceWeatherProvider({ children }) {
  const [data, setData] = useState(initialState)
  const [, setTick] = useState(0) // re-render every minute so "updated X min ago" stays current

  useEffect(() => {
    let alive = true
    const refresh = () => loadSpaceWeather().then((result) => alive && setData(result))
    refresh()
    const fetchTimer = setInterval(refresh, REFRESH_MS)
    const clockTimer = setInterval(() => setTick((n) => n + 1), 60 * 1000)
    return () => {
      alive = false
      clearInterval(fetchTimer)
      clearInterval(clockTimer)
    }
  }, [])

  return <SpaceWeatherContext.Provider value={data}>{children}</SpaceWeatherContext.Provider>
}

export function useSpaceWeather() {
  const data = useContext(SpaceWeatherContext)
  if (!data) throw new Error('useSpaceWeather must be used inside <SpaceWeatherProvider>')
  return data
}
