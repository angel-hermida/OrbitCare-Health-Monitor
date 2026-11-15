// Display preferences (theme, temperature unit, alert sound, presenter button).
// Any component can call usePreferences(). Saved through storage.js, separate from mission data.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loadPreferences, savePreferences } from './storage.js'

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPreferences)

  useEffect(() => {
    savePreferences(prefs)
  }, [prefs])

  // Theme lives on <html data-theme="..."> so CSS can switch every page at once.
  // Only elements inside `.oc-app` react to it (see index.css), so the crew picker never changes.
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme
  }, [prefs.theme])

  const setPreference = useCallback((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const value = useMemo(() => ({ ...prefs, setPreference }), [prefs, setPreference])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const prefs = useContext(PreferencesContext)
  if (!prefs) throw new Error('usePreferences must be used inside <PreferencesProvider>')
  return prefs
}
